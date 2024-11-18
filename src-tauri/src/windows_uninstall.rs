use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;
use std::vec::Vec;
use std::io::BufRead;

use crate::windows::run_command;


fn write_bootloader_file_list(dest_dir: &Path) -> io::Result<()> {
    // Define the subdirectories to search
    let subdirs = ["boot", "efi"];
    
    // Open the output file
    let uninstall_file_path = dest_dir.join("uninstall-bootloader.txt");
    let mut uninstall_file = File::create(uninstall_file_path)?;

    // Iterate through each subdirectory
    for subdir in subdirs.iter() {
        let subdir_path = dest_dir.join(subdir);

        // Check if the subdirectory exists and is a directory
        if subdir_path.is_dir() {
            // Collect all files recursively from the subdirectory
            let files = get_files_in_dir(&subdir_path)?;

            // Write each file's path to the uninstall.txt file
            for file in files {
                if let Some(stripped_path) = file.strip_prefix(dest_dir).ok() {
                    writeln!(uninstall_file, "{}", stripped_path.display())?;
                }
            }
        }
    }

    Ok(())
}

// Helper function to recursively collect all files in a directory
fn get_files_in_dir(dir: &Path) -> io::Result<Vec<std::path::PathBuf>> {
    let mut files = Vec::new();

    // Read the directory entries
    let entries = fs::read_dir(dir)?;

    // Iterate over entries
    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            // Recursively get files from subdirectories
            let subdir_files = get_files_in_dir(&path)?;
            files.extend(subdir_files);
        } else if path.is_file() {
            // Collect file path if it's a file
            files.push(path);
        }
    }

    Ok(files)
}

pub(crate) fn prepare_uninstall(
  install_dir: &Path,
) -> io::Result<()> {
    write_bootloader_file_list(install_dir)
}

pub(crate) fn uninstall(install_dir: &Path) -> io::Result<()> {
    std::fs::read_dir(install_dir).expect("No such directory");
    
    let guid_contents = std::fs::read(install_dir.join("bcdedit-guid.txt")).expect("bcdedit-guid.txt not found");
    let guid_str = String::from_utf8_lossy(&guid_contents);
    let guid = crate::windows::parse_guid(&guid_str);

    let esp_drive_letter = "X:"; 
    crate::windows::mount_efi_system_partition(esp_drive_letter);
    
    // Open the file containing the list of files
    let file = std::fs::File::open(install_dir.join("uninstall-bootloader.txt")).expect("uninstall-bootloader.txt not found");
    let reader = io::BufReader::new(file);

    // Iterate through each line in the file
    for line in reader.lines() {
        let line = line?;
        
        // Construct the full path to the file on the specified drive
        let file_to_remove = Path::new(esp_drive_letter).join(line);

        // Attempt to delete the file
        if file_to_remove.exists() {
            match fs::remove_file(&file_to_remove) {
                Ok(_) => println!("Deleted: {}", file_to_remove.display()),
                Err(e) => eprintln!("Failed to delete {}: {}", file_to_remove.display(), e),
            }
        } else {
            eprintln!("File not found: {}", file_to_remove.display());
        }
    }

    run_command(
        "=== Step 3: Removing bcd entry ===",
        &format!(r"bcdedit /delete {guid}"),
    );

    crate::windows::unmount_efi_system_partition(esp_drive_letter);
    println!("=== Uninstallation done! ===");
    Ok(())
}

