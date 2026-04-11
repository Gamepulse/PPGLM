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
            commands::database::update_game_igdb_id,
            commands::database::update_game_from_igdb_candidate,
            commands::database::delete_all_games,
            commands::database::get_tags,
            commands::database::get_genres,
            commands::database::get_game_modes,
            commands::database::get_player_perspectives,
            commands::database::get_themes,
            commands::database::get_platforms,
            commands::database::get_active_platforms,
            commands::database::get_all_filter_options,
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
            commands::matcher::retry_igdb_search,
            commands::matcher::bulk_retry_igdb_search,
            commands::igdb::get_igdb_credentials,
            commands::igdb::save_igdb_credentials,
            commands::igdb::test_igdb_connection,
            commands::igdb::search_igdb_games,
            commands::igdb::search_igdb_games_full,
            commands::igdb::clear_igdb_cache,
            commands::igdb::refresh_game_from_igdb,
            commands::igdb::get_igdb_screenshots,
            // New commands for features 1-20
            commands::database::update_game_play_time,
            commands::database::update_game_completion_status,
            commands::database::update_game_favorite,
            commands::database::update_game_executable_path,
            commands::database::update_game_store_links,
            commands::database::update_game_platform,
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
            commands::launcher::open_folder,
            commands::launcher::discover_executable_path,
            commands::launcher::auto_discover_and_save_executable,
            commands::quick_add::quick_add_game,
            commands::quick_add::export_collection_csv,
            // VGMdb soundtrack commands
            commands::vgmdb_commands::search_vgmdb_soundtracks,
            commands::vgmdb_commands::get_vgmdb_album_details,
            commands::vgmdb_commands::get_game_soundtracks,
            commands::vgmdb_commands::save_game_soundtrack,
            commands::vgmdb_commands::delete_game_soundtrack,
            commands::vgmdb_commands::update_soundtrack_spotify_link,
            commands::vgmdb_commands::auto_fetch_soundtracks,
            // MusicBrainz soundtrack commands
            commands::musicbrainz::search_musicbrainz_soundtracks,
            commands::musicbrainz::search_musicbrainz_broad,
            commands::musicbrainz::get_musicbrainz_release_details,
            commands::musicbrainz::save_musicbrainz_soundtrack,
            commands::musicbrainz::auto_fetch_musicbrainz_soundtracks,
            // ListenBrainz commands
            commands::listenbrainz::lookup_listenbrainz_metadata,
            commands::listenbrainz::search_youtube_video,
            commands::listenbrainz::extract_youtube_info,
            commands::listenbrainz::get_youtube_videos_for_album,
            // Background tasks
            commands::background_tasks::background_fetch_soundtracks,
            commands::background_tasks::auto_fetch_and_save_soundtracks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
