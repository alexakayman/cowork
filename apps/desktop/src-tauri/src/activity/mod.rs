pub mod detector;
pub mod mapper;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActivityState {
    pub activity: String,
    pub app_name: String,
    pub process: String,
}
