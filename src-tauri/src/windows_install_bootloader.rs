use std::borrow::Cow;
use std::io::Write;
use std::{fs::File, path::Path};

use crate::windows::run_command;

pub fn install(install_dir: &String) {
    std::fs::read_dir(install_dir).expect("No such directory");

    let esp_drive_letter = "X:\\";
    crate::windows::mount_efi_system_partition(esp_drive_letter);

    run_command(
        "=== Step 3: Copying Android Bootloader Files ===",
        &format!(r"xcopy {install_dir}\boot X:\boot /E /Q /H /R"),
    );
    run_command(
        "",
        &format!(r"xcopy {install_dir}\efi X:\EFI /E /Q /H /R"),
    );

    let bcdedit_output = run_command(
        "=== Step 4: Creating Bootloader Entry for Android ===",
        r#"bcdedit /copy {bootmgr} /d Android"#,
    );
    let output_text = String::from_utf8_lossy(&bcdedit_output.stdout);

    println!("=== Step 4.1: Parse GUID from bcdedit output ===");

    let guid = parse_and_save_guid(&output_text, install_dir);

    run_command(
        "=== Step 4.2: Setting the bootloader path ===",
        &format!(r"bcdedit /set {guid} path \EFI\boot\BOOTx64.EFI"),
    );

    run_command(
        "=== Step 5: Disabling Hibernation ===",
        "powercfg.exe /hibernate off",
    );

    crate::windows::unmount_efi_system_partition(esp_drive_letter);

    println!("=== All commands executed successfully! ===");
}

fn parse_and_save_guid<'a>(output_text: &'a Cow<'a, str>, install_dir: &String) -> &'a str {
    let guid = crate::windows::parse_guid(output_text);

    let guid_store_file_path = Path::new(install_dir).join("bcdedit-guid.txt");
    let mut guid_store_file = File::create(guid_store_file_path)
        .expect("Failed to create bcdedit-guid.txt to store guid");
    writeln!(guid_store_file, "{guid}").expect("Failed to write to bcdedit-guid.txt");

    &guid
}
