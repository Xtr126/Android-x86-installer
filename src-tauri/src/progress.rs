use sysinfo::{DiskUsage, ProcessRefreshKind, ProcessesToUpdate, RefreshKind};

use crate::MEGABYTE;

pub(crate) struct Progress {
    progress: u64,
    my_pid: sysinfo::Pid,
    system: sysinfo::System,
    disk_usage: sysinfo::DiskUsage,
    isofile_size_bytes: u64,
    total_write_bytes: u64,
    total_read_bytes: u64,
}

#[derive(Clone, serde::Serialize)]
pub(crate) struct ProgressInfo {
    pub(crate) mb_written: u64,
    pub(crate) mb_read: u64,
    pub(crate) mb_total: u64,
    pub(crate) read_speed_mbps: u64,
    pub(crate) write_speed_mbps: u64,
    pub(crate) progress_percent: u64,
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
            total_read_bytes: 0,
        };
        s.refresh_progress();
        s.total_write_bytes = 0;
        s.total_read_bytes = 0;
        s
    }

    pub fn refresh_progress(&mut self) -> ProgressInfo {
        self.system.refresh_processes_specifics(
            ProcessesToUpdate::Some(&[self.my_pid]),
            true,
            ProcessRefreshKind::new().with_disk_usage(),
        );
        let process = self.system.process(self.my_pid).unwrap();

        self.disk_usage = process.disk_usage();

        self.progress = count_progress(self);

        ProgressInfo {
            progress_percent: self.progress,
            mb_written: self.total_write_bytes / MEGABYTE,
            mb_read: self.total_read_bytes / MEGABYTE,
            mb_total: self.isofile_size_bytes / MEGABYTE,
            read_speed_mbps: self.disk_usage.read_bytes / MEGABYTE,
            write_speed_mbps: self.disk_usage.written_bytes / MEGABYTE,
        }
    }
}

fn count_progress(p: &mut Progress) -> u64 {
    p.total_write_bytes += p.disk_usage.written_bytes;
    p.total_read_bytes += p.disk_usage.read_bytes;

    if p.total_write_bytes != 0 && p.disk_usage.written_bytes == 0 && p.disk_usage.read_bytes == 0 {
        100
    } else {
        p.total_write_bytes * 100 / p.isofile_size_bytes
    }
}
