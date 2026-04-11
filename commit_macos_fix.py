import subprocess
import os

os.chdir(r'C:\Coding\Pascal')

print("=== Commit des corrections macOS ===")

# Add files
print("\n1. Adding files to git...")
result = subprocess.run(['git', 'add', '.github/workflows/build.yml', 'src-tauri/tauri.conf.json', 'src-tauri/entitlements.plist'], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")

# Check status
print("\n2. Checking staged files...")
result = subprocess.run(['git', 'diff', '--cached', '--name-only'], capture_output=True, text=True, shell=True)
print(f"Staged files: {result.stdout}")

# Commit
print("\n3. Committing changes...")
result = subprocess.run([
    'git', 'commit', 
    '-m', 'fix: add macOS entitlements and signing configuration',
    '-m', '- Add entitlements.plist for required macOS permissions',
    '-m', '- Update tauri.conf.json with macOS signing settings',
    '-m', '- Update GitHub workflow to support macOS code signing',
    '-m', '- Fixes app not opening on macOS due to Gatekeeper restrictions'
], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")
print(f"Stdout: {result.stdout[:500]}")
if result.stderr:
    print(f"Stderr: {result.stderr[:200]}")

# Push
print("\n4. Pushing to origin/Dev...")
result = subprocess.run(['git', 'push', 'origin', 'Dev'], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")
if result.stderr:
    print(f"Stderr: {result.stderr[:200]}")

print("\n=== Done ===")
