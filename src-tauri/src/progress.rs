use std::path::Path;

use sysinfo::{DiskUsage, ProcessRefreshKind, ProcessesToUpdate, RefreshKind};


pub(crate) struct Progress {
    progress: u64,
    my_pid: sysinfo::Pid,
    system: sysinfo::System,
    disk_usage: sysinfo::DiskUsage,
    isofile_size_bytes: u64,
    total_write_bytes: u64
}

impl Progress {
    pub fn new(isofile_size_bytes: u64) -> Self {
        let mut s = Self {
            progress: 0,
            my_pid: sysinfo::get_current_pid().unwrap(),
            system: sysinfo::System::new_with_specifics(
                RefreshKind::new().with_processes(ProcessRefreshKind::new().with_disk_usage()),
            ),
            disk_usage: DiskUsage::default(),
            isofile_size_bytes: isofile_size_bytes,
            total_write_bytes: 0,
        };
        s.refresh_progress();
        s.total_write_bytes = 0;
        s
    }

    pub fn refresh_progress(&mut self) -> u64 {
        self.system.refresh_processes_specifics(
            ProcessesToUpdate::Some(&[self.my_pid]),
            true,
            ProcessRefreshKind::new().with_disk_usage(),
          );
        let process = self.system.process(self.my_pid).unwrap();

        self.disk_usage = process.disk_usage();

        self.progress = count_progress(self);
        self.progress
    }
}

fn count_progress(p: &mut Progress) -> u64 {
    println!("read bytes: new/total => {}/{} B",
        p.disk_usage.read_bytes,
        p.disk_usage.total_read_bytes,
    );
    println!("written bytes: new/total => {}/{} B",
        p.disk_usage.written_bytes,
        p.disk_usage.total_written_bytes,
    );
    p.total_write_bytes += p.disk_usage.written_bytes;
    p.total_write_bytes * 100 / p.isofile_size_bytes
}
  