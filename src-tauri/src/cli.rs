use std::path::Path;

#[cfg(windows)] use crate::windows_uninstall;
#[cfg(windows)] use crate::windows_install_bootloader;

pub fn init(args: Vec<String>) {
    match args[1].as_str() {
        "install" => windows_install_bootloader::install(&args[2]),
        "uninstall" => windows_uninstall::uninstall( Path::new(&args[2])),
        arg => eprintln!("Invalid argument {arg}"),
    }    
}