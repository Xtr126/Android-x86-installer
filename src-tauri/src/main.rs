#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::dialog;
use std::{fs::File, path::{PathBuf, Path}, time, thread};
use compress_tools::{uncompress_archive, Ownership};

#[derive(serde::Serialize)]
struct CustomResponse {
  file_path: String,
  is_valid: bool,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn pick_file() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_file().unwrap();

    let is_file_found = check_iso_file(file_path.clone()).map_err(|err| err.to_string())?;

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: is_file_found,
    })
} 

#[tauri::command]
async fn pick_folder() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_folder().unwrap();

    let install_dir_rw = check_install_dir(file_path.clone()).map_err(|err| err.to_string())?;

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: install_dir_rw,
    })
}

fn check_iso_file(file_path: PathBuf) -> Result<bool, String> {
  let mut source  = File::open(file_path).map_err(|err| err.to_string())?;
  let file_list: Vec<String> = compress_tools::list_archive_files(&mut source).unwrap();
  
  let required_files = &["kernel", "initrd.img", "system.sfs"];

  let is_file_found = required_files.iter().all(|file| file_list.contains(&(file).to_string()));
  Ok(is_file_found)
}

fn check_install_dir(mut install_dir: PathBuf) -> Result<bool, String> {
  install_dir.push("kernel");
  Ok(File::create(install_dir).is_ok())
}

#[tauri::command]
fn start_install(
  window: tauri::Window,
  iso_file: String, 
  install_dir: String, 
  os_title: String,
) -> Result<String, String> {
  let iso_file_valid = check_iso_file(iso_file.clone().into()).map_err(|err| err.to_string())?;
  let install_dir_valid = check_install_dir(install_dir.clone().into()).map_err(|err| err.to_string())?;
  
  if iso_file_valid && install_dir_valid {
    let source  = File::open(iso_file).map_err(|err| err.to_string())?;
    let filesize = source.metadata().unwrap().len();

    let install_dir1 = install_dir.clone();  
    thread::spawn(move || {
      let file_path = Path::new(&install_dir1);
      let mut init_size = fs_extra::dir::get_size(file_path).unwrap();
      let mut progress_eq = false;
      let mut progress = 0;
      loop {
        let size = fs_extra::dir::get_size(file_path).unwrap();
        if size > init_size {
          let new_progress = (size - init_size) * 100 / filesize;
          
          if progress == new_progress { 
            if progress_eq { window.emit("new-dir-size", 100).unwrap(); break; }
            progress_eq = true; 
          }

          progress = new_progress;  
          window.emit("new-dir-size", progress).unwrap();
        } else {
          init_size = size;
        }
        thread::sleep(time::Duration::from_secs(2));
      }
    });

    thread::spawn(move || {
      uncompress_archive(source, Path::new(&install_dir), Ownership::Preserve).unwrap();
    });  
  } else {
    return Err("Select installation directory/ ISO file to continue".to_string())
  }
  Ok("Success".to_string()) 
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![pick_file, pick_folder, start_install])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
