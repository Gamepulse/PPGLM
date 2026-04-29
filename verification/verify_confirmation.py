import os
import time
from playwright.sync_api import sync_playwright

def verify_confirmation_dialog():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        page.add_init_script("""
            window.localStorage.setItem('pascal-theme-mode', 'dark');
            window.localStorage.setItem('pascal-color-theme', 'indigo');
            window.localStorage.setItem('pascal-language', 'en');

            // Mock Tauri internals
            window.__TAURI_INTERNALS__ = {
                invoke: async (cmd, args) => {
                    console.log('Tauri invoke (Internals):', cmd, args);
                    if (cmd === 'get_games') return [{
                        id: 1,
                        display_name: 'Test Game',
                        folder_name: 'test-game',
                        folder_path: '/path/to/test-game',
                        igdb_id: 123,
                        tags: [],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        personal_rating: 80,
                        igdb_rating: 75,
                        completion_status: 'playing',
                        play_time: 10
                    }];
                    if (cmd === 'get_game_by_id') return {
                        id: 1,
                        display_name: 'Test Game',
                        folder_name: 'test-game',
                        folder_path: '/path/to/test-game',
                        igdb_id: 123,
                        tags: [],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        personal_rating: 80,
                        igdb_rating: 75,
                        completion_status: 'playing',
                        play_time: 10
                    };
                    if (cmd === 'get_scanned_folders') return [];
                    if (cmd === 'get_igdb_credentials') return { client_id: 'abc', client_secret: '123' };
                    if (cmd === 'get_all_filter_options') return {
                        genres: [],
                        game_modes: [],
                        player_perspectives: [],
                        themes: [],
                        platforms: [],
                        tags: []
                    };
                    if (cmd.startsWith('get_setting')) return null;
                    return null;
                }
            };

            window.__TAURI__ = {
                core: {
                    invoke: window.__TAURI_INTERNALS__.invoke
                }
            };
        """)

        try:
            page.goto("http://localhost:1420")

            time.sleep(2)

            page.wait_for_selector(".theme-card", timeout=10000)
            page.click(".theme-card")

            page.wait_for_selector("text=Back to Library")

            # Find delete button by text
            delete_button = page.locator("button:has-text('Delete Game')")

            dialog_captured = {"happened": False}
            def handle_dialog(dialog):
                print(f"Dialog appeared: {dialog.message}")
                dialog_captured["happened"] = True
                dialog.dismiss()

            page.on("dialog", handle_dialog)

            # Click delete button, which should trigger the dialog
            delete_button.click()
            time.sleep(1)

            if dialog_captured["happened"]:
                print("Successfully verified confirmation dialog!")
                # Take a screenshot after the dialog was handled (though it won't show the dialog)
                page.screenshot(path="verification/final_success.png")
            else:
                print("Failed to capture confirmation dialog.")
                page.screenshot(path="verification/after_click_failed.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_confirmation_dialog()
