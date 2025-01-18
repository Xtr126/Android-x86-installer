# Android-x86 Installer
Cross-platform Android x86 installer desktop app built with Tauri.  
The installer can function without root access. For safety, it was designed not to mess with the bootloader.  
It re-uses the grub config and kernel command line parameters from the ISO.  

Download for Linux and Windows: https://github.com/Xtr126/Android-x86-installer/releases/latest  
Arch linux: https://aur.archlinux.org/packages/android-x86-installer-tauri-bin   
Documentation: https://xtr126.github.io/Documentation/installation/using-android-x86-installer/#linux
## Development
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/#_top)
- It might take a while to compile the rust dependencies.
```
git clone https://github.com/Xtr126/Android-x86-installer.git 
cd Android-x86-installer
pnpm install 
pnpm tauri dev
```

# Gallery
![Screenshot (4)](https://github.com/user-attachments/assets/3ed5e996-db53-4524-a796-a026d3c9f644)
![Screenshot (5)](https://github.com/user-attachments/assets/b2736298-6095-4461-990d-208513ce326c)
![Screenshot (1)](https://github.com/user-attachments/assets/c8f02afd-a7b2-42aa-84b3-02a4127f3154)


## Open source libraries and projects used
- Tauri: https://github.com/tauri-apps/tauri/
### User Interface
- Material Web: https://github.com/material-components/material-web/
- Lit: https://github.com/lit/lit/
### ISO file handling 
- compress-tools-rs: https://github.com/OSSystems/compress-tools-rs/
- libarchive: https://github.com/libarchive/libarchive/
### data.img creation
- e2fsprogs (mke2fs/mkfs.ext4)
- Cygwin - mkfs.ext4.exe for Windows
### Disk I/O statistics 
- sysinfo: https://github.com/GuillaumeGomez/sysinfo
