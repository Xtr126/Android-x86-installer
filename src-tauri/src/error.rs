use serde::{ser::Serializer, Serialize};

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Fs(#[from] tauri_plugin_fs::Error),
    #[error(transparent)]
    Shell(#[from] tauri_plugin_shell::Error),
    #[error(transparent)]
    CompressTools(#[from] compress_tools::Error),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
