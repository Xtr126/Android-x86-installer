#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use fs_extra::error::Error;
use progress::Progress;
use tauri::api::dialog;
use std::time;
use std::thread;
use std::sync::Arc;
use std::path::{Path, PathBuf};
use std::io::{Seek, Write};
use std::fs::{remove_dir, File};
use compress_tools::{uncompress_archive, Ownership};

mod qemu_install;
mod progress;
#[cfg(windows)] mod windows_install_bootloader;

#[derive(serde::Serialize)]
struct CustomResponse {
  file_path: String,
  is_valid: bool,
}

#[tauri::command]
async fn pick_file() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_file().unwrap_or_else(|| PathBuf::new());

    let is_file_found = check_iso_file(file_path.clone()).map_err(|err| err.to_string())?;

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: is_file_found,
    })
} 

#[tauri::command]
async fn pick_folder() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_folder().unwrap();

    let install_dir_rw = check_install_dir(file_path.clone().to_str().unwrap());

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: install_dir_rw,
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
  install_dir: String, 
  size: u64
) -> Result<String, String>  {
  let file_path = Path::new(&install_dir);

  let data_img_path = file_path.join("data.img");

  use tauri::api::process::Command;

  #[cfg(windows)]  
  let output = Command::new_sidecar("mkfs.ext4")
          .map_err(|err| err.to_string())?
          .args([
          "-F", "-b", "4096", "-L", "/data",
          &data_img_path.display().to_string(),
          format!("{size}G").as_str() 
          ])
          .output().map_err(|err| err.to_string())?;

  #[cfg(target_os = "linux")]  
  let output = Command::new("mkfs.ext4")
          .args([
          "-F", "-b", "4096", "-L", "/data",
          &data_img_path.display().to_string(),
          format!("{size}G").as_str() 
          ])
          .output().map_err(|err| err.to_string())?;
  
  remove_dir(file_path.join("data")).map_err(|err| err.to_string())?;
  
  Ok(output.stdout) 
}

#[tauri::command]
fn create_grub_entry(install_dir: String, os_title: String) -> String {  
  let fs_install_dir = get_fs_install_dir(install_dir);

  format!(r#"menuentry "{os_title}" --class android-x86 {{
    savedefault
    search --no-floppy --set=root --file /{fs_install_dir}/boot/grub/grub.cfg
    configfile /{fs_install_dir}/boot/grub/grub.cfg
  }}"#).into()
}

#[cfg(target_os = "linux")]
fn get_fs_install_dir(install_dir: String) -> String {
  let output = std::process::Command::new("stat")
          .args(["-c", r#"%m"#, &install_dir.to_string()])
          .output().unwrap();
  let mountpoint = String::from_utf8_lossy(&output.stdout).strip_suffix("\n").unwrap().to_string();
  install_dir.strip_prefix(&mountpoint).unwrap().into()
}

#[cfg(windows)]
pub fn get_fs_install_dir(install_dir: String) -> String {
  let components = Path::new(&install_dir).components();
      let mut install_dir = "".to_owned();

      for component in components {     
          if component == std::path::Component::RootDir {
            install_dir.clear();
            continue;
          }            
          let component = component.as_os_str().to_str().unwrap();
          install_dir.push_str(component);
      }
      if install_dir.ends_with('/') { install_dir.pop(); }

      return install_dir;
}

// For recovery https://github.com/BlissOS/bootable_newinstaller/blob/c81bcf9d8148f3f071013161c3eb4a3ee58a1189/install/scripts/1-install#L987
fn prepare_recovery(
  dest_dir: &Path,
) -> Result<(), Error>  {
    std::fs::rename(dest_dir.join("ramdisk-recovery.img"), dest_dir.join("recovery.img"))?;

    let misc_img_path = dest_dir.join("misc.img");
    let mut misc_img_file = File::create(misc_img_path)?;
    let megabyte = 1024 << 10; // megabyte size in bytes

    // Create 10 MB misc.img
    misc_img_file.seek(std::io::SeekFrom::Start(megabyte * 10))?;
    misc_img_file.write(&[0])?;
    
    Ok(())
}

#[tauri::command]
fn start_install(
  window: tauri::Window,
  iso_file: String, 
  install_dir: String, 
) -> Result<String, String> {
    let window = Arc::new(window);
    let source  = File::open(iso_file).map_err(|err| err.to_string())?;

    let window_ = window.clone();
    let isofile_size_bytes = source.metadata().unwrap().len();

    thread::spawn(move || {
      let mut progress: Progress = Progress::new(isofile_size_bytes);
      loop {
        let progress_percent = progress.refresh_progress();
        // 100 should be sent only from the other thread
        if progress_percent != 100 { 
            window.emit("new-dir-size", progress_percent).unwrap(); 
            thread::sleep(time::Duration::from_secs(1));
        } else {
            break;
        }
      }
    });

    let window = Arc::clone(&window_);
    thread::spawn(move || {
      let dest_dir: &Path = Path::new(&install_dir);
      let _ = uncompress_archive(source, dest_dir, Ownership::Preserve);
      window.emit("new-dir-size", 100).unwrap();

      let fs_install_dir = get_fs_install_dir(install_dir.clone());

      let contents = format!(r#"
          set timeout=5
          set debug_mode="(DEBUG mode)"
          set kdir="/{fs_install_dir}"
          set autoload_old="(Old Modprobe mode)"
          search --no-floppy --set=root --file "$kdir"/kernel
          source "$kdir"/efi/boot/android.cfg
      "#);
      std::fs::write(dest_dir.join("boot/grub/grub.cfg"), contents).unwrap();
      std::fs::create_dir(dest_dir.join("data")).unwrap();
      
      let _ = std::fs::remove_file(dest_dir.join("install.img"));
      let _ = prepare_recovery(dest_dir);
    });
  Ok("Success".to_string()) 
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
      create_data_img, create_grub_entry])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
