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
            // New commands for features 1-20
            commands::database::update_game_play_time,
            commands::database::update_game_completion_status,
            commands::database::update_game_favorite,
            commands::database::update_game_executable_path,
            commands::database::update_game_store_links,
            commands::database::record_game_played,
            commands::database::get_collections,
            commands::database::create_collection,
            commands::database::add_game_to_collection,
            commands::database::remove_game_from_collection,
            commands::database::get_game_collections,
            commands::database::add_screenshot,
            commands::database::get_screenshots,
            commands::database::delete_screenshot,
            commands::database::add_search_history,
            commands::database::get_search_history,
            commands::database::clear_search_history,
            commands::database::get_game_statistics,
            commands::database::bulk_update_games,
            commands::database::find_duplicate_games,
            commands::launcher::launch_game,
            commands::launcher::open_store_link,
            commands::launcher::discover_executable_path,
            commands::launcher::auto_discover_and_save_executable,
            commands::quick_add::quick_add_game,
            commands::quick_add::export_collection_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
