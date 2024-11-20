use std::path::Path;
use std::path::PathBuf;

#[cfg(target_os = "linux")]
use std::ffi::CString;

#[cfg(target_os = "linux")]
fn get_mount_point(file_path: &str) -> std::io::Result<PathBuf> {
    use libc::stat;
    use std::io;
    use std::str::FromStr;

    // Get the device ID of the file

    let mut stat_buf: stat = unsafe { std::mem::zeroed() };
    let c_file_path = CString::new(file_path).unwrap();
    if unsafe { stat(c_file_path.as_ptr(), &mut stat_buf) } != 0 {
        return Err(io::Error::last_os_error());
    }
    let file_dev = stat_buf.st_dev;

    // Traverse up the directory tree to find the mount point
    let mut current_path = PathBuf::from_str(&file_path).unwrap();
    loop {
        // Stat the current directory
        let c_current_path = CString::new(file_path).unwrap();
        if unsafe { stat(c_current_path.as_ptr(), &mut stat_buf) } != 0 {
            return Err(io::Error::last_os_error());
        }

        // Check if we've crossed the actual mount point by comparing device IDs
        if stat_buf.st_dev != file_dev {
            break;
        }

        let parent = current_path.parent();
        match parent {
            None => {
                return Ok("/".into());
            }
            Some(parent) => {
                current_path = parent.to_path_buf();
            }
        }
    }

    // Move back down to the last directory that matched the device ID
    Ok(current_path)
}

#[cfg(target_os = "linux")]
pub fn get_path_on_filesystem(install_dir: &Path) -> PathBuf {
    let mount_point = get_mount_point(install_dir.as_os_str().to_str().unwrap()).unwrap();

    // Strip the mount point prefix from the file path
    let relative_path = install_dir.strip_prefix(&mount_point).unwrap();

    relative_path.to_path_buf()
}

#[cfg(windows)]
pub fn get_path_on_filesystem(install_dir: &Path) -> PathBuf {
    let components = install_dir.components();
    let mut install_dir = "".to_owned();

    for component in components {
        if component == std::path::Component::RootDir {
            install_dir.clear();
            continue;
        }
        let component = component.as_os_str().to_str().unwrap();
        install_dir.push_str(component);
    }
    if install_dir.ends_with('/') {
        install_dir.pop();
    }

    install_dir.into()
}

#[cfg(target_os = "linux")]
pub fn is_fat32(dir: &str) -> bool {
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
pub fn is_fat32(path: &str) -> bool {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr;
    use winapi::um::fileapi::GetVolumeInformationW;

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
            &fs_name_buffer[..fs_name_buffer.iter().position(|&c| c == 0).unwrap_or(256)],
        );

        // Check if the filesystem is FAT32
        fs_name == "FAT32"
    } else {
        false
    }
}
