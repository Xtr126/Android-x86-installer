# Android-x86 Installer
Cross-platform Android x86 installer desktop app built with Tauri.  
The installer can function without root access. For safety, it was designed not to mess with the bootloader.  
It re-uses the grub config and kernel command line parameters from the ISO.  

Download for Linux and Windows: https://github.com/Xtr126/Android-x86-installer/releases/latest  
Arch linux: https://aur.archlinux.org/packages/android-x86-installer-tauri-bin   

## Development
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites/)
- It might take a while to compile the rust dependencies.
```
git clone https://github.com/Xtr126/Android-x86-installer.git 
cd Android-x86-installer
pnpm install 
pnpm tauri dev
```
![](Screenshot.png)  

The installer also supports generating a script to boot the same physical Android install in qemu:
![image](https://github.com/Xtr126/Android-x86-installer/assets/80520774/4849d563-2057-4104-8997-6fe62c6606a9)  
[User interface preview](https://xtr126.github.io/Android-x86-installer)   

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
