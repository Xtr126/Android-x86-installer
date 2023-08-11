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
  Ok(format!("{install_dir} {memsize_mb} {cpus} {x_res} x {y_res} .. {display_type} {use_gl} .. {device_type} {input_type} .. {enable_serial_console} {perform_e2fsck} .. {forward_port} {forward_port_no} ..{override_sdl_videodriver}.. {sdl_videodriver} ")) 
}