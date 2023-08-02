pub struct QemuInstaller {
    memsize_mb: u16,
    cpus: u8,
    x_res: u16,
    y_res: u16,
    
    display_sdl: bool,
    display_gtk: bool,
    
    virtio_tablet: bool,
    virtio_mouse: bool,
    
    use_gl_es: bool,
    use_gl_ogl: bool,
    
    install_dir: String,
    enable_serial_console: bool,
    perform_e2fsck: bool,
    
    forward_port: bool,
    forward_port_no: u16,

    sdl_videodriver_override: bool,
    sdl_videodriver: String,
}