use std::process::Command;

use std::io::Write;
use std::process::Stdio;


pub fn install(args: Vec<String>) {
    let install_dir = &args[1];
    std::fs::read_dir(install_dir).expect("No such directory");

    // Start a Command Prompt instance and keep it alive
    let mut cmd = Command::new("cmd")
        .args(&["/K"]) // Keep the Command Prompt open
        .stdin(Stdio::piped()) // Allow sending commands to stdin
        .spawn()
        .expect("Failed to spawn command prompt");

    // Ensure we can write to the process's stdin
    if let Some(stdin) = cmd.stdin.as_mut() {
        
        let robocopy_cmd1 = format!(r#"robocopy {install_dir}\boot X:\ /E"#);
        let robocopy_cmd2 = format!(r#"robocopy {install_dir}\efi\boot X:\EFI\ /E"#);
        let robocopy_cmd1_desc = format!(r#"echo Executing: robocopy {install_dir}\boot X:\ /E"#);
        let robocopy_cmd2_desc = format!(r#"echo Executing: robocopy {install_dir}\efi\boot X:\EFI\ /E"#);

        let commands = vec![
            
            "echo === Step 1: Unmounting X: drive letter ===",
            "echo Executing: mountvol X: /d",
            "mountvol X: /d",

            "echo === Step 2: Mounting EFI System Partition at X: drive letter ===",
            "echo Executing: mountvol X: /s",
            "mountvol X: /s",

            "echo === Step 3: Copying Android Bootloader Files ===",
            &robocopy_cmd1_desc,
            &robocopy_cmd1,
            &robocopy_cmd2_desc,
            &robocopy_cmd2,

            "echo === Step 4: Creating Bootloader Entry for Android ===",
            "echo Executing: bcdedit /copy {bootmgr} /d \"Android\"",
            "bcdedit /copy {bootmgr} /d \"Android\"",

            "echo === Step 5: Disabling Hibernation ===",
            "echo Executing: powercfg.exe /hibernate off",
            "powercfg.exe /hibernate off",

            "echo === All commands executed! The prompt will remain open. ===",
        ];

        for command in commands {
            writeln!(stdin, "{}", command).expect("Failed to write to stdin");
        }

        // Keep the Command Prompt open for user interaction
        writeln!(stdin, "pause").expect("Failed to write to stdin");
    }

    // Wait for the Command Prompt to complete
    cmd.wait().expect("Command prompt process failed");

}

