#[tauri::command]
pub async fn send_quit_heartbeat(
    endpoint: String,
    payload_json: String,
    authorization_header: String,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    client
        .post(&endpoint)
        .header("Authorization", authorization_header)
        .header("Content-Type", "application/json")
        .body(payload_json)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
