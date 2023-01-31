#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::dialog;


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn pick_file() -> Result<String, String> {
    let file_path: Option<std::path::PathBuf> = dialog::blocking::FileDialogBuilder::new().pick_file();
    Ok(format!("{}", file_path.unwrap().display()))
}   

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![pick_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
