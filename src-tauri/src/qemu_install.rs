#[cfg(target_os = "linux")]
#[tauri::command]
pub fn install_qemu(
    install_dir: String,
    memsize_mb: u16,
    cpus: u8,
    x_res: u16,
    y_res: u16,
    
    display_type: String,
    use_gl: String,    

    device_type: String,
    input_type: String,
    
    enable_serial_console: bool,
    perform_e2fsck: bool,
    
    forward_port: bool,
    forward_port_no: u16,

    override_sdl_videodriver: bool,
    sdl_videodriver: String,
) -> Result<String, String> {  
  
  let net_user_hostfwd: String = if forward_port { 
    format!("-net user,hostfwd=tcp::{forward_port_no}-:{forward_port_no}") 
  } else { "-net user".to_string() };
  
  let console = if enable_serial_console { "console=ttyS0" } else { "" };
  let serial_console = if enable_serial_console { "-serial mon:stdio \\" } else { "" };

  let env_vars = if override_sdl_videodriver {
    format!("SDL_VIDEODRIVER={sdl_videodriver}")
  } else { "".to_string() };

  let e2fsck_cmd = if perform_e2fsck {
    format!(r#"e2fsck -fy "{install_dir}/data.img""#)
  } else { "".to_string() };

  let input_devices = if device_type == "usb" { 
    format!("-usb -device usb-{input_type} -device usb-kbd \\") 
  } else {
    format!("-device virtio-{input_type} -device virtio-keyboard \\") 
  }; 

  let contents = format!(r#"#!/bin/bash
{e2fsck_cmd}

if [ -f "{install_dir}"/system.efs ]; then
  system_img=system.efs
else 
  system_img=system.sfs
fi

{env_vars} exec qemu-system-x86_64 -enable-kvm -cpu host -smp {cpus} -m {memsize_mb}M \
      -drive index=0,if=virtio,id=system,file="{install_dir}"/$system_img,format=raw,readonly=on \
      -drive index=1,if=virtio,id=data,file="{install_dir}/data.img",format=raw \
      -display {display_type},gl={use_gl} \
      -device virtio-vga-gl,xres={x_res},yres={y_res} \
      -net nic,model=virtio-net-pci {net_user_hostfwd} \
      -machine vmport=off -machine q35 \
      {input_devices}
      {serial_console}
      -kernel "{install_dir}/kernel" -append "root=/dev/ram0 quiet SRC=/ DATA=/dev/vdb video={x_res}x{y_res} {console} VIRT_WIFI=1" \
      -initrd "{install_dir}/initrd.img"
      "#);

      let script_path = std::path::Path::new(&install_dir).join("start_android.sh");
      
      // make script executable 
      let mut options = std::fs::OpenOptions::new();
      std::os::unix::fs::OpenOptionsExt::mode(&mut options, 0o770);
      options.create(true).write(true).open(script_path.clone()).unwrap();

      std::fs::write(script_path, contents).map_err(|err| err.to_string())?;
  Ok(format!("qemu script written to {install_dir}/start_android.sh
  -m {memsize_mb} -smp {cpus} res: {x_res}x{y_res} -display {display_type} use-gl={use_gl} input: {device_type} {input_type} serial_console: {enable_serial_console} e2fsck: {perform_e2fsck} forwardport: {forward_port} {forward_port_no} override_sdl_videodriver: {override_sdl_videodriver} {sdl_videodriver} ")) 
}

#[cfg(windows)]
#[tauri::command]
pub fn install_qemu(
    install_dir: String,
    memsize_mb: u16,
    cpus: u8,
    x_res: u16,
    y_res: u16,
    
    display_type: String,
    use_gl: String,    

    device_type: String,
    input_type: String,
    
    enable_serial_console: bool,
    perform_e2fsck: bool,
    
    forward_port: bool,
    forward_port_no: u16,

    override_sdl_videodriver: bool,
    sdl_videodriver: String,
) -> Result<String, String> {  
  
  let net_user_hostfwd: String = if forward_port { 
    format!("-net user,hostfwd=tcp::{forward_port_no}-:{forward_port_no}") 
  } else { "-net user".to_string() };
  
  let console = if enable_serial_console { "console=ttyS0" } else { "" };
  let serial_console = if enable_serial_console { "-serial mon:stdio \\" } else { "" };

  let env_vars = if override_sdl_videodriver {
    format!("SDL_VIDEODRIVER={sdl_videodriver}")
  } else { "".to_string() };

  let e2fsck_cmd = if perform_e2fsck {
    format!(r#"e2fsck.exe -fy "{install_dir}/data.img""#)
  } else { "".to_string() };

  let input_devices = if device_type == "usb" { 
    format!("-usb -device usb-{input_type} -device usb-kbd \\") 
  } else {
    format!("-device virtio-{input_type} -device virtio-keyboard \\") 
  }; 

    let fs_install_dir = crate::get_fs_install_dir(install_dir.clone());
  let contents = format!(r#"#!/bin/bash
{e2fsck_cmd}

if [ -f "/{fs_install_dir}"/system.efs ]; then
  system_img=system.efs
else 
  system_img=system.sfs
fi

{env_vars} qemu-system-x86_64.exe -accel whpx,kernel-irqchip=off -cpu host -smp {cpus} -m {memsize_mb}M \
      -drive index=0,if=virtio,id=system,file="/{fs_install_dir}"/$system_img,format=raw,readonly=on \
      -drive index=1,if=virtio,id=data,file="/{fs_install_dir}/data.img",format=raw \
      -display {display_type},gl={use_gl} \
      -device virtio-vga-gl,xres={x_res},yres={y_res} \
      -net nic,model=virtio-net-pci {net_user_hostfwd} \
      -machine vmport=off -machine q35 \
      {input_devices}
      {serial_console}
      -kernel "/{fs_install_dir}/kernel" -append "root=/dev/ram0 quiet SRC=/ DATA=/dev/vdb video={x_res}x{y_res} {console} VIRT_WIFI=1" \
      -initrd "/{fs_install_dir}/initrd.img"
      "#);

      let script_path = Path::new(&install_dir).join("start_android.sh");
    std::fs::write(script_path, contents).map_err(|err| err.to_string())?;
  Ok(format!("qemu script written to {install_dir}/start_android.sh
  -m {memsize_mb} -smp {cpus} res: {x_res}x{y_res} -display {display_type} use-gl={use_gl} input: {device_type} {input_type} serial_console: {enable_serial_console} e2fsck: {perform_e2fsck} forwardport: {forward_port} {forward_port_no} override_sdl_videodriver: {override_sdl_videodriver} {sdl_videodriver} ")) 
}
