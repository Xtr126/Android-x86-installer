use std::path::Path;

#[cfg(windows)]
use crate::windows_install_bootloader;
#[cfg(windows)]
use crate::windows_uninstall;

pub fn init(args: Vec<String>) {
    println!("=== This program requires administrative privileges to run ===");

    match args[1].as_str() {
        "install" => windows_install_bootloader::install(&args[2]),
        "uninstall" => windows_uninstall::uninstall(Path::new(&args[2])).unwrap(),
        arg => eprintln!("Invalid argument {arg}"),
    }
    ask_to_exit();
}

pub fn ask_to_exit() {
    println!("Press enter key to exit...");
    // Wait for user input
    let mut input = String::new();
    std::io::stdin()
        .read_line(&mut input)
        .expect("Failed to read input");
}

#[tauri::command]
pub fn get_executable_name() -> String {
    let args: Vec<String> = std::env::args().collect();
    args[0].clone()
}
