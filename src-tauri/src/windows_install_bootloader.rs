use std::{fs::File, path::Path, process::{Command, Output}};
use std::io::Write;


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

    output
}

pub fn install(args: Vec<String>) {
    let install_dir = &args[1];
    std::fs::read_dir(install_dir).expect("No such directory");

    run_command(
        "=== Step 1: Unmounting existing volume at X: ===",
        "mountvol X: /d",
    );

    run_command(
        "=== Step 2: Mounting EFI System Partition ===",
        "mountvol X: /s",
    );

    run_command(
        "=== Step 3: Copying Android Bootloader Files ===",
        &format!(r"robocopy {install_dir}\boot X:\boot /E /NJH /NC /NS"),
    );
    run_command("", &format!(r"robocopy {install_dir}\efi X:\EFI /E /NJH /NC /NS"));

    let bcdedit_output = run_command(
        "=== Step 4: Creating Bootloader Entry for Android ===",
        r#"bcdedit /copy {bootmgr} /d "Android""#,
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

    run_command(
        "=== Step 6: Unmounting EFI system partition at X: ===",
        "mountvol X: /d",
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

fn parse_and_save_guid<'a>(output_text: &'a std::borrow::Cow<'a, str>, install_dir: &String) -> &'a str {
    
    let guid_regex = regex::Regex::new(r"\{[a-fA-F0-9-]+\}").expect("Failed to compile regex");
    
    let guid = guid_regex
        .find(&output_text)
        .expect("Failed to find GUID in bcdedit output")
        .as_str();

    println!("Parsed GUID: {}", guid);

    let guid_store_file_path = Path::new(install_dir).join("bcdedit-guid.txt");
    let mut guid_store_file = File::create(guid_store_file_path).expect("Failed to create bcdedit-guid.txt to store guid");
    writeln!(guid_store_file, "{guid}").expect("Failed to write to bcdedit-guid.txt");
    
    &guid   
}
