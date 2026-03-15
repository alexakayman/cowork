pub mod detector;
pub mod mapper;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActivityState {
    pub activity: String,
    pub app_name: String,
    pub process: String,
    /// Bundle identifier (macOS) or empty; used for server-side classification when sent to server.
    pub bundle_id: String,
}
