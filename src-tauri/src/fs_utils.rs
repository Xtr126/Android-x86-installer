#[cfg(target_os = "linux")]
pub fn get_path_on_filesystem(install_dir: String) -> String {
  let output = std::process::Command::new("stat")
          .args(["-c", r#"%m"#, &install_dir.to_string()])
          .output().unwrap();
  let mountpoint = String::from_utf8_lossy(&output.stdout).strip_suffix("\n").unwrap().to_string();
  install_dir.strip_prefix(&mountpoint).unwrap().into()
}

#[cfg(windows)]
pub fn get_path_on_filesystem(install_dir: String) -> String {
  let components = Path::new(&install_dir).components();
      let mut install_dir = "".to_owned();

      for component in components {     
          if component == std::path::Component::RootDir {
            install_dir.clear();
            continue;
          }            
          let component = component.as_os_str().to_str().unwrap();
          install_dir.push_str(component);
      }
      if install_dir.ends_with('/') { install_dir.pop(); }

      return install_dir;
}

#[cfg(target_os = "linux")]  
pub fn is_fat32(dir: &str) -> bool {
    use std::ffi::CString;
    
    use libc::statfs;
    let cstr_dir = CString::new(dir).expect("CString::new failed");
    let mut stat: libc::statfs = unsafe { std::mem::zeroed() };
    let result = unsafe { statfs(cstr_dir.as_ptr(), &mut stat) };

    if result == 0 {
        // FAT32/VFAT filesystems are usually identified by the magic number 0x4d44
        stat.f_type as u32 == 0x4d44
    } else {
        false
    }
}


#[cfg(windows)]  
fn is_fat32(path: &str) -> bool {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use std::ptr;
    use winapi::um::fileapi::GetVolumeInformationW;
    use winapi::um::winnt::LPWSTR;

    // Convert the path to a wide string (Windows expects wide strings for file paths)
    let path_wide: Vec<u16> = OsString::from(path)
        .encode_wide()
        .chain(Some(0)) // null-terminate the wide string
        .collect();
    
    // Prepare buffers for the volume information
    let mut fs_name_buffer: [u16; 256] = [0; 256];
    
    // Call GetVolumeInformationW to get the filesystem name
    let result = unsafe {
        GetVolumeInformationW(
            path_wide.as_ptr(),
            ptr::null_mut(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            fs_name_buffer.as_mut_ptr(),
            fs_name_buffer.len() as u32,
        )
    };
    
    if result != 0 {
        // Convert the filesystem name to a Rust string
        let fs_name = String::from_utf16_lossy(
            &fs_name_buffer[..fs_name_buffer.iter().position(|&c| c == 0).unwrap_or(256)]
        );
        
        // Check if the filesystem is FAT32
        fs_name == "FAT32"
    } else {
        false
    }
}
