use std::process::{exit, Command, Output};

// Helper function to execute a command and capture its output
fn run_command(description: &str, command: &str) -> Output {
    println!("{}", description);
    println!("{}", command);

    let output = Command::new("cmd")
        .args(&["/C", command])
        .output()
        .expect("Failed to execute command");
    
    eprintln!("{}", String::from_utf8_lossy(&output.stderr));
    println!("{}", String::from_utf8_lossy(&output.stdout));
    
    if ! output.status.success() {
        ask_to_exit();
        exit(1);
    }

    output
}

pub fn install(args: Vec<String>) {
    let install_dir = &args[1];
    std::fs::read_dir(install_dir).expect("No such directory");

    println!("{}", "=== Step 1: Unmounting existing volume at X: ===");

    Command::new("cmd")
        .args(&["/C", "mountvol X: /d"])
        .status()
        .expect("Failed to execute command");


    run_command(
        "=== Step 2: Mounting EFI System Partition ===",
        "mountvol X: /s",
    );

    run_command(
        "=== Step 3.1: Copying Android Bootloader Files ===",
        &format!(r"robocopy {}\boot X:\ /E", install_dir),
    );
    run_command(
        "=== Step 3.2: Copying Android EFI Boot Files ===",
        &format!(r"robocopy {}\efi\boot X:\EFI\ /E", install_dir),
    );

    let bcdedit_output = run_command(
        "=== Step 4: Creating Bootloader Entry for Android ===",
        r#"bcdedit /copy {bootmgr} /d "Android""#,
    );

    println!("Step 4.1: Parse GUID from bcdedit output");

    let output_text = String::from_utf8_lossy(&bcdedit_output.stdout);
    let guid_regex = regex::Regex::new(r"\{[a-fA-F0-9-]+\}").expect("Failed to compile regex");
    let guid = guid_regex
        .find(&output_text)
        .expect("Failed to find GUID in bcdedit output")
        .as_str();
    println!("Parsed GUID: {}", guid);

    run_command(
        "=== Step 4.2: Setting the bootloader path ===",
        &format!(r"bcdedit /set {} path \EFI\boot\BOOTx64.EFI", guid),
    );

    run_command(
        "=== Step 5: Disabling Hibernation ===",
        "powercfg.exe /hibernate off",
    );

    println!("=== All commands executed successfully! ===");
    ask_to_exit();

}

fn ask_to_exit() {
    println!("Press enter key to exit...");
    // Wait for user input
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).expect("Failed to read input");
}

