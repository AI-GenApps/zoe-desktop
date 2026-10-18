use std::{collections::BTreeMap, env, fs};
use tauri_utils::{acl::{capability::Capability, manifest::Manifest, resolved::Resolved, ExecutionContext}, platform::Target};

fn granted(resolved: &Resolved, command: &str, window: &str) -> bool {
    let matches = |entry: &tauri_utils::acl::resolved::ResolvedCommand| {
        entry.context == ExecutionContext::Local && entry.windows.iter().any(|pattern| pattern.matches(window))
    };
    resolved.allowed_commands.get(command).is_some_and(|entries| entries.iter().any(matches))
        && !resolved.denied_commands.get(command).is_some_and(|entries| entries.iter().any(matches))
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let manifests: BTreeMap<String, Manifest> = serde_json::from_str(&fs::read_to_string(&args[1]).unwrap()).unwrap();
    let mut capabilities = BTreeMap::new();
    for path in &args[2..4] {
        let capability: Capability = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
        capabilities.insert(capability.identifier.clone(), capability);
    }
    let resolved = Resolved::resolve(&manifests, capabilities, Target::MacOS).unwrap();
    let expected = args[4] == "fixed";
    let operations = ["initialize", "load_client", "create_client", "get_store_record", "save_store_record", "remove_store_record", "save"];
    for operation in operations {
        let command = format!("plugin:stronghold|{operation}");
        assert_eq!(granted(&resolved, &command, "main"), expected, "{command}: main window");
        assert!(!granted(&resolved, &command, "unrelated-window"), "{command}: unrelated window must be denied");
    }
    println!("macOS {}: all 7 credential operations {}; unrelated window denied", args[4], if expected { "authorized for main" } else { "denied for main (regression reproduced)" });
}
