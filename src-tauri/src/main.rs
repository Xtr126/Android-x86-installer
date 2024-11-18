use progress::Progress;
use tauri::api::dialog;
use tauri::api::process::Encoding;
use std::{thread, time};
use std::path::{Path, PathBuf};
use std::io::{Seek, Write};
use std::fs::{remove_dir, File};
use compress_tools::{uncompress_archive, Ownership};

mod qemu_install;
mod progress;
mod fs_utils;
#[cfg(windows)] mod uninstall;

#[cfg(windows)] mod windows_install_bootloader;

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
async fn pick_file() -> Result<PickFileResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_file().unwrap_or_else(|| PathBuf::new());

    let is_file_found = check_iso_file(file_path.clone())?;

    Ok(PickFileResponse {
        file_path: file_path.display().to_string(),
        is_valid: is_file_found,
    })
} 

#[tauri::command]
async fn pick_folder() -> Result<PickFolderResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_folder().unwrap_or_else(|| PathBuf::new());

    let install_dir_rw = check_install_dir(file_path.clone().to_str().unwrap());

    Ok(PickFolderResponse {
        file_path: file_path.display().to_string(),
        is_valid: install_dir_rw,
        is_fat32: fs_utils::is_fat32(file_path.to_str().unwrap())
    })
}

fn check_iso_file(file_path: PathBuf) -> Result<bool, String> {
  let mut source  = File::open(file_path).map_err(|err| err.to_string())?;
  let file_list: Vec<String> = compress_tools::list_archive_files(&mut source).map_err(|err| err.to_string())?;
  
  let required_files = &["kernel", "initrd.img"];

  let mut is_file_found = required_files.iter().all(|file| file_list.contains(&(file).to_string()));
  
  if ! ( file_list.contains(&"system.sfs".to_string()) || file_list.contains(&"system.efs".to_string()) ) {
    is_file_found = false;
  }

  Ok(is_file_found)
}

#[tauri::command]
fn check_install_dir(install_dir: &str) -> bool {
  let install_dir_path = Path::new(install_dir).join("kernel");
  return !install_dir.trim().is_empty() && File::create(install_dir_path).is_ok()
}

#[tauri::command]
async fn create_data_img(
  window: tauri::Window,
  install_dir: String, 
  size: u64
) -> Result<String, String>  {
  let file_path = Path::new(&install_dir);

  let data_img_path = file_path.join("data.img");

  match data_img_path.try_exists() {
    Ok(false) => {},
    Ok(true) => show_dialog(window, "Warning", format!("Found existing file at {data_img_path:?}<br>Not creating data.img")),
    Err(err) => show_dialog(window, "Warning", format!("Failed to determine if file exists at {data_img_path:?}<br>Not creating data.img<br>{err}")),
  }

  use tauri::api::process::Command;

  let command = { // On Windows use the bundled mkfs.ext4.exe
    #[cfg(windows)]
    {
        Command::new_sidecar("mkfs.ext4").map_err(|err| err.to_string())?
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("mkfs.ext4")
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
    .encoding(Encoding::for_label(b"utf-8").unwrap())
    .args([
        "-F", "-b", "4096", "-L", "/data",
        &data_img_path.display().to_string(),
        &size
    ])
    .output()
    .map_err(|err| err.to_string())?;

  remove_dir(file_path.join("data")).map_err(|err| err.to_string())?;
  
  Ok(output.stdout) 
}

#[tauri::command]
fn create_grub_entry(install_dir: String, os_title: String) -> String {  
  let fs_install_dir = fs_utils::get_path_on_filesystem(Path::new(&install_dir)).display().to_string();

  format!(r#"menuentry "{os_title}" --class android-x86 {{
    savedefault
    search --no-floppy --set=root --file /{fs_install_dir}/boot/grub/grub.cfg
    configfile /{fs_install_dir}/boot/grub/grub.cfg
  }}"#).into()
}

// For recovery https://github.com/BlissOS/bootable_newinstaller/blob/c81bcf9d8148f3f071013161c3eb4a3ee58a1189/install/scripts/1-install#L987
fn prepare_recovery(
  dest_dir: &Path,
) -> std::io::Result<()>   {
    std::fs::rename(dest_dir.join("ramdisk-recovery.img"), dest_dir.join("recovery.img"))?;

    let misc_img_path = dest_dir.join("misc.img");
    let mut misc_img_file = File::create(misc_img_path)?;

    // Create 10 MB misc.img
    misc_img_file.seek(std::io::SeekFrom::Start(MEGABYTE * 10))?;
    misc_img_file.write(&[0])?;
    
    Ok(())
}

#[tauri::command]
fn start_install(
  window: tauri::Window,
  iso_file: String, 
  install_dir: String, 
) -> Result<(), String> {
    let source  = File::open(iso_file).map_err(|err| err.to_string())?;

    let isofile_size_bytes = source.metadata().map_err(|err| err.to_string())?.len();

    thread::spawn(move || {
      let dest_dir: &Path = Path::new(&install_dir);
      let _ = uncompress_archive(source, dest_dir, Ownership::Preserve);
     
      window.emit("progress-info",
        progress::ProgressInfo {
            progress_percent: 100,
            mb_written: isofile_size_bytes,
            mb_read: isofile_size_bytes,
            mb_total: isofile_size_bytes / MEGABYTE,
            read_speed_mbps: 0,
            write_speed_mbps: 0,
        }
      ).unwrap();

      let fs_install_dir = fs_utils::get_path_on_filesystem(Path::new(&install_dir)).display().to_string();

      let contents = format!(r#"
          set timeout=5
          set debug_mode="(DEBUG mode)"
          set kdir="/{fs_install_dir}"
          set autoload_old="(Old Modprobe mode)"
          search --no-floppy --set=root --file "$kdir"/kernel
          source "$kdir"/efi/boot/android.cfg
      "#);
      
      match std::fs::write(dest_dir.join("boot/grub/grub.cfg"), contents)  {
        Ok(_) => {},
        Err(_) => { 
            show_dialog(window.clone(), "Warning", format!("Create boot/grub/grub.cfg failed")); 
        },
      }

      match std::fs::create_dir(dest_dir.join("data"))  {
          Ok(_) => {},
          Err(err) => { 
            show_dialog(window, "Warning", format!("Create /data failed<br>{err}")); 
          },
      }
      
      let _ = std::fs::remove_file(dest_dir.join("install.img"));
      let _ = prepare_recovery(dest_dir);
      
      #[cfg(windows)]
      let _ = uninstall::prepare_uninstall(dest_dir);
    });
    
    Ok(())
}

#[tauri::command]
fn count_progress(
  window: tauri::Window,
  iso_file: String, 
) {
  let isofile_size_bytes = File::open(iso_file).unwrap().metadata().unwrap().len();

  thread::spawn(move || {
    let mut progress: Progress = Progress::new(isofile_size_bytes);
    loop {
      let progress_info = progress.refresh_progress();
      // 100 should be sent only from the other thread
      if progress_info.progress_percent != 100 { 
          window.emit("progress-info", progress_info).unwrap(); 
          thread::sleep(time::Duration::from_secs(1));
      } else {
          break;
      }
    }
  });
}

fn show_dialog( 
  window: tauri::Window,
  title: &str,
  html_content: String, 
) {    
    window.eval(
      &format!(r"
      document.getElementById('installer_app')
              .showDialog('{title}', html`{html_content}`)")
    ).unwrap();
}

fn main() {
  #[cfg(windows)] {
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 {
      windows_install_bootloader::install(args);
      return;
    }
  }
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      pick_file, pick_folder, check_install_dir,
      start_install,  qemu_install::install_qemu, 
      create_data_img, create_grub_entry,
      count_progress])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
