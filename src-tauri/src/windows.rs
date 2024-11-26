use std::{
    borrow::Cow,
    ffi::{OsStr, OsString},
    process::{Command, Output},
};

use std::io::{self, Write};

// Helper function to execute a command and capture its output
pub fn run_command(description: &str, command: &str) -> Output {
    println!("{description}");
    println!("{command}");

    let output = Command::new("cmd")
        .args(["/C", command])
        .output()
        .expect("Failed to execute command");

    io::stdout().write_all(&output.stdout).unwrap();
    io::stderr().write_all(&output.stderr).unwrap();

    output
}

pub fn mount_efi_system_partition(esp_drive_letter: &str) {
    run_command(
        &format!("=== Step 1: Unmounting existing volume at {esp_drive_letter} ==="),
        &format!("mountvol {esp_drive_letter} /d"),
    );

    println!("=== Step 2: Mounting EFI System Partition ===");
    println!("mountvol {esp_drive_letter} /s");

    let status = Command::new("cmd")
        .args(&["/C", &format!("mountvol {esp_drive_letter} /s")])
        .status()
        .expect("Failed to execute command");

    if !status.success() {
        eprintln!("Failed to mount EFI system partition");
        crate::cli::ask_to_exit();
    }
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

pub fn run_command_as_admin<I, S>(program: S, args: I) -> io::Result<()>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut argument_list = OsString::new();

    for arg in args {
        if argument_list != OsString::new() {
            argument_list.push(",");
        }
        argument_list.push("\"");
        argument_list.push(arg);
        argument_list.push("\"");
    }

    let mut powershell_arg = OsString::new();

    powershell_arg.push("Start-Process -Wait -Verb RunAs");

    powershell_arg.push(" -FilePath \"");
    powershell_arg.push(program);
    powershell_arg.push("\"");

    powershell_arg.push(" -ArgumentList \"");
    powershell_arg.push(argument_list);
    powershell_arg.push("\"");

    Command::new("powershell").arg(powershell_arg).output()?;

    Ok(())
}
