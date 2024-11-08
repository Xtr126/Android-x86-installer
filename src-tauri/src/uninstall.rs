use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;
use std::vec::Vec;

fn write_bootloader_file_list(dest_dir: &Path) -> io::Result<()> {
    // Define the subdirectories to search
    let subdirs = ["boot", "efi"];
    
    // Open the output file
    let uninstall_file_path = dest_dir.join("uninstall.txt");
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
  dest_dir: &Path,
) -> io::Result<()> {
    write_bootloader_file_list(dest_dir)
}

