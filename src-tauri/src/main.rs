mod commands;
mod db;
mod errors;
mod models;
mod utils;

use db::Database;
use std::sync::Mutex;
use tauri::Manager;
use tokio_util::sync::CancellationToken;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db = Database::new(app)?;
            app.manage(db);
            app.manage(Mutex::new(CancellationToken::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scanner::scan_folders,
            commands::scanner::scan_folders_smart,
            commands::scanner::stop_scan,
            commands::database::get_games,
            commands::database::get_game_by_id,
            commands::database::save_game,
            commands::database::delete_games_by_scan_path,
            commands::database::delete_game,
            commands::database::update_game_rating,
            commands::database::update_game_notes,
            commands::database::update_game_tags,
            commands::database::update_game_display_name,
            commands::database::update_game_cover_url,
            commands::database::delete_all_games,
            commands::database::get_tags,
            commands::database::create_tag,
            commands::database::delete_tag,
            commands::database::add_tag_to_game,
            commands::database::remove_tag_from_game,
            commands::database::reset_database,
            commands::database::add_scanned_folder,
            commands::database::remove_scanned_folder,
            commands::database::get_scanned_folders,
            commands::database::get_folder_exclusions,
            commands::database::add_folder_exclusion,
            commands::database::remove_folder_exclusion,
            commands::database::search_games,
            commands::database::save_scan_results,
            commands::database::get_setting,
            commands::database::set_setting,
            commands::import_export::export_collection,
            commands::import_export::import_collection,
            commands::matcher::match_folder_names,
            commands::igdb::get_igdb_credentials,
            commands::igdb::save_igdb_credentials,
            commands::igdb::test_igdb_connection,
            commands::igdb::search_igdb_games,
            commands::igdb::search_igdb_games_full,
            commands::igdb::clear_igdb_cache,
            commands::igdb::refresh_game_from_igdb,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
