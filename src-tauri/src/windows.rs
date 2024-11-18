use std::{borrow::Cow, process::{Command, Output}};

// Helper function to execute a command and capture its output
pub fn run_command(description: &str, command: &str) -> Output {

    println!("{}", description);
    println!("{}", command);

    let output = Command::new("cmd")
        .args(&["/C", command])
        .output()
        .expect("Failed to execute command");
    
    eprintln!("{}", String::from_utf8_lossy(&output.stderr));
    println!("{}", String::from_utf8_lossy(&output.stdout));

    output
}


pub fn mount_efi_system_partition(esp_drive_letter: &str) {
    run_command(
        &format!("=== Step 1: Unmounting existing volume at {esp_drive_letter} ==="),
        &format!("mountvol {esp_drive_letter} /d"),
    );

    run_command(
        &format!("=== Step 2: Mounting EFI System Partition ==="),
        &format!("mountvol {esp_drive_letter} /s"),
    );
}

pub fn unmount_efi_system_partition(esp_drive_letter: &str) {
    run_command(
        &format!("=== Unmounting EFI system partition at {esp_drive_letter} ==="),
        &format!("mountvol {esp_drive_letter} /d"),
    );
}

pub fn parse_guid<'a>(output_text: &'a Cow<'a, str>) -> &'a str {
    let guid_regex = regex::Regex::new(r"\{[a-fA-F0-9-]+\}").expect("Failed to compile regex");
    
    let guid = guid_regex
        .find(&output_text)
        .expect("Failed to find GUID in bcdedit output")
        .as_str();
    
    println!("Parsed GUID: {}", guid);
    
    &guid
}

