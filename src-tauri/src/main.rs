#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use compress_tools::{uncompress_archive, Ownership};
use error::Error;
use progress::Progress;
use std::fs::{remove_dir, File};
use std::io::{Seek, Write};
use std::path::{Path, PathBuf};
use std::{thread, time};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tauri_plugin_shell::ShellExt;

mod error;
mod fs_utils;
mod progress;
mod qemu_install;

#[cfg(windows)]
mod cli;
#[cfg(windows)]
mod windows;
#[cfg(windows)]
mod windows_install_bootloader;
#[cfg(windows)]
mod windows_uninstall;

#[derive(serde::Serialize)]
struct PickFileResponse {
    file_path: String,
    is_valid: bool,
}

#[derive(serde::Serialize)]
struct PickFolderResponse {
    file_path: String,
    is_valid: bool,
    is_fat32: bool,
}

static MEGABYTE: u64 = 1024 << 10; // megabyte size in bytes

#[tauri::command]
async fn pick_file(app_handle: tauri::AppHandle) -> Result<PickFileResponse, Error> {
    let file_path = app_handle
        .dialog()
        .file()
        .blocking_pick_file()
        .unwrap_or_else(|| FilePath::from(Path::new("")));

    let file_path_buf = file_path.into_path()?;

    let is_file_found = check_iso_file(&file_path_buf)?;

    Ok(PickFileResponse {
        file_path: file_path_buf.display().to_string(),
        is_valid: is_file_found,
    })
}

fn check_iso_file(file_path_buf: &PathBuf) -> Result<bool, compress_tools::Error> {
    let mut source = File::open(file_path_buf)?;
    let file_list: Vec<String> = compress_tools::list_archive_files(&mut source)?;

    let required_files = &["kernel", "initrd.img"];

    let mut is_file_found = required_files
        .iter()
        .all(|file| file_list.contains(&(file).to_string()));

    if !(file_list.contains(&"system.sfs".to_string())
        || file_list.contains(&"system.efs".to_string()))
    {
        is_file_found = false;
    }

    Ok(is_file_found)
}

#[tauri::command]
async fn pick_folder(app_handle: tauri::AppHandle) -> Result<PickFolderResponse, Error> {
    let file_path = app_handle
        .dialog()
        .file()
        .blocking_pick_folder()
        .unwrap_or_else(|| FilePath::from(Path::new("")));

    let file_path_buf = file_path.into_path()?;

    let install_dir_rw = check_install_dir(&file_path_buf);

    Ok(PickFolderResponse {
        file_path: file_path_buf.display().to_string(),
        is_valid: install_dir_rw,
        is_fat32: fs_utils::is_fat32(file_path_buf.to_str().unwrap()),
    })
}

#[tauri::command]
fn check_install_dir(install_dir: &Path) -> bool {
    let install_dir_path = install_dir.join("kernel");
    // Check if directory is not empty and is writable
    return !install_dir.eq(Path::new("")) && File::create(install_dir_path).is_ok();
}

#[tauri::command]
async fn create_data_img(
    app_handle: tauri::AppHandle,
    install_dir: String,
    size: u64,
) -> Result<String, Error> {
    let app_handle = &app_handle;
    let file_path = Path::new(&install_dir);

    let data_img_path = file_path.join("data.img");

    match data_img_path.try_exists() {
    Ok(false) => {},
    Ok(true) => show_dialog(app_handle, "Warning", format!("Found existing file at {data_img_path:?}<br>Not creating data.img")),
    Err(err) => show_dialog(app_handle, "Warning", format!("Failed to determine if file exists at {data_img_path:?}<br>Not creating data.img<br>{err}")),
  }

    let command = {
        // On Windows use the bundled mkfs.ext4.exe
        #[cfg(windows)]
        {
            app_handle.shell().sidecar("mkfs.ext4.exe")?
        }
        #[cfg(target_os = "linux")]
        {
            app_handle.shell().command("mkfs.ext4")
        }
    };

    let size = {
        if fs_utils::is_fat32(&install_dir) {
            "4000M".to_string()
        } else {
            format!("{size}G")
        }
    };

    let output = command
        .args([
            "-F",
            "-b",
            "4096",
            "-L",
            "/data",
            &data_img_path.display().to_string(),
            &size,
        ])
        .output()
        .await?;

    remove_dir(file_path.join("data"))?;

    Ok(String::from_utf8(output.stdout).unwrap())
}

#[tauri::command]
fn create_grub_entry(install_dir: String, os_title: String) -> String {
    let fs_install_dir = fs_utils::get_path_on_filesystem(Path::new(&install_dir))
        .display()
        .to_string();

    format!(
        r#"menuentry "{os_title}" --class android-x86 {{
    savedefault
    search --no-floppy --set=root --file /{fs_install_dir}/boot/grub/grub.cfg
    configfile /{fs_install_dir}/boot/grub/grub.cfg
  }}"#
    )
    .into()
}

// For recovery https://github.com/BlissOS/bootable_newinstaller/blob/c81bcf9d8148f3f071013161c3eb4a3ee58a1189/install/scripts/1-install#L987
fn prepare_recovery(dest_dir: &Path) -> std::io::Result<()> {
    std::fs::rename(
        dest_dir.join("ramdisk-recovery.img"),
        dest_dir.join("recovery.img"),
    )?;

    let misc_img_path = dest_dir.join("misc.img");
    let mut misc_img_file = File::create(misc_img_path)?;

    // Create 10 MB misc.img
    misc_img_file.seek(std::io::SeekFrom::Start(MEGABYTE * 10))?;
    misc_img_file.write(&[0])?;

    Ok(())
}

#[tauri::command]
fn start_install(
    app_handle: tauri::AppHandle,
    iso_file: String,
    install_dir: String,
) -> Result<(), Error> {
    let source = File::open(iso_file)?;

    let isofile_size_bytes = source.metadata()?.len();

    thread::spawn(move || {
        let dest_dir: &Path = Path::new(&install_dir);
        let _ = uncompress_archive(source, dest_dir, Ownership::Preserve);

        app_handle
            .emit(
                "progress-info",
                progress::ProgressInfo {
                    progress_percent: 100,
                    mb_written: isofile_size_bytes,
                    mb_read: isofile_size_bytes,
                    mb_total: isofile_size_bytes / MEGABYTE,
                    read_speed_mbps: 0,
                    write_speed_mbps: 0,
                },
            )
            .unwrap();

        let fs_install_dir = fs_utils::get_path_on_filesystem(Path::new(&install_dir))
            .display()
            .to_string();

        let contents = format!(
            r#"
          set timeout=5
          set debug_mode="(DEBUG mode)"
          set kdir="/{fs_install_dir}"
          set autoload_old="(Old Modprobe mode)"
          search --no-floppy --set=root --file "$kdir"/kernel
          source "$kdir"/efi/boot/android.cfg
      "#
        );

        match std::fs::write(dest_dir.join("boot/grub/grub.cfg"), contents) {
            Ok(_) => {}
            Err(_) => {
                show_dialog(
                    &app_handle,
                    "Warning",
                    format!("Create boot/grub/grub.cfg failed"),
                );
            }
        }

        match std::fs::create_dir(dest_dir.join("data")) {
            Ok(_) => {}
            Err(err) => {
                show_dialog(
                    &app_handle,
                    "Warning",
                    format!("Create /data failed<br>{err}"),
                );
            }
        }

        let _ = std::fs::remove_file(dest_dir.join("install.img"));
        let _ = prepare_recovery(dest_dir);

        #[cfg(windows)]
        let _ = windows_uninstall::prepare_uninstall(dest_dir);
    });

    Ok(())
}

#[tauri::command]
fn count_progress(app_handle: tauri::AppHandle, iso_file: String) {
    let isofile_size_bytes = File::open(iso_file).unwrap().metadata().unwrap().len();

    thread::spawn(move || {
        let mut progress: Progress = Progress::new(isofile_size_bytes);
        loop {
            let progress_info = progress.refresh_progress();
            // 100 should be sent only from the other thread
            if progress_info.progress_percent != 100 {
                app_handle.emit("progress-info", progress_info).unwrap();
                thread::sleep(time::Duration::from_secs(1));
            } else {
                // progress::count_progress() sends 100 if no data was written/read during the interval. On recieving 100, we break the loop to end the thread.
                break;
            }
        }
    });
}

#[cfg(windows)]
#[tauri::command]
fn install_bootloader(install_dir: String) -> Result<(), Error> {
    let args: Vec<String> = std::env::args().collect();
    windows::run_command_as_admin(&args[0], [&"install".to_string(), &install_dir])?;
    Ok(())
}

fn show_dialog(app_handle: &tauri::AppHandle, title: &str, html_content: String) {
    let webview = app_handle.get_webview_window("main").unwrap();
    webview
        .eval(&format!(
            r"
      document.getElementById('installer_app')
              .showDialog('{title}', '{html_content}')"
        ))
        .unwrap();
}

fn main() {
    #[cfg(windows)]
    {
        let args: Vec<String> = std::env::args().collect();
        if args.len() > 1 {
            cli::init(args);
            return;
        }
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            pick_file,
            pick_folder,
            check_install_dir,
            start_install,
            qemu_install::install_qemu,
            create_data_img,
            create_grub_entry,
            count_progress,
            #[cfg(windows)]
            install_bootloader,
            #[cfg(windows)]
            cli::get_executable_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
