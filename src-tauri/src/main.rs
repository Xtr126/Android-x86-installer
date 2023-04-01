#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::dialog;
use compress_tools::list_archive_files;
use std::{fs::File, path::PathBuf};

#[derive(serde::Serialize)]
struct CustomResponse {
  file_path: String,
  is_valid: bool,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn pick_file() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_file().unwrap();
    
    let mut source  = File::open(file_path.as_path()).map_err(|err| err.to_string())?;
    let file_list: Vec<String> = list_archive_files(&mut source).unwrap();
    
    let required_files = &["kernel", "initrd.img", "system.sfs"];

    let is_file_found = required_files.iter().all(|file| file_list.contains(&(file).to_string()));

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: is_file_found,
      })
} 

#[tauri::command]
async fn pick_folder() -> Result<CustomResponse, String> {
    let file_path: PathBuf = dialog::blocking::FileDialogBuilder::new().pick_folder().unwrap();
        
    let mut test_file = file_path.clone();
    test_file.push("kernel");

    Ok(CustomResponse {
        file_path: file_path.display().to_string(),
        is_valid: File::create(test_file).is_ok(),
      })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![pick_file, pick_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
