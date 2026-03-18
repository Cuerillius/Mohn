use serde_json::{json, Value};
use url::Url;

fn build_stream_url(manifest: &str, media_type: &str, id: &str) -> Result<String, String> {
    let mut url = Url::parse(manifest).map_err(|e| format!("Invalid manifest URL: {e}"))?;

    if !url.path().ends_with("manifest.json") {
        return Err("Manifest URL must end with manifest.json".to_string());
    }

    let stream_base = url.path().trim_end_matches("manifest.json").to_string() + "stream";
    url.set_path(&stream_base);

    let json_id = format!("{id}.json");
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Cannot modify URL path segments".to_string())?;
        segments.pop_if_empty();
        segments.push(media_type);
        segments.push(&json_id);
    }

    Ok(url.to_string())
}

#[tauri::command]
async fn get_streams(manifest: String, media_type: String, id: String) -> Result<Value, String> {
    let url = build_stream_url(&manifest, &media_type, &id)?;
    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let err_data: Value = response.json().await.unwrap_or_else(|_| json!({}));
        let message = err_data
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or(status.canonical_reason().unwrap_or("Unknown error"));

        return Err(format!("Provider Error: {message}"));
    }

    response
        .json::<Value>()
        .await
        .map_err(|e| format!("Invalid JSON response: {e}"))
}

#[tauri::command]
fn get_config_url(manifest: String) -> Result<String, String> {
    let mut url = Url::parse(&manifest).map_err(|e| format!("Invalid manifest URL: {e}"))?;

    if !url.path().ends_with("manifest.json") {
        return Err("Manifest URL must end with manifest.json".to_string());
    }

    let config_path = url.path().trim_end_matches("manifest.json").to_string() + "configure";
    url.set_path(&config_path);

    Ok(url.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_libmpv::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_streams, get_config_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
