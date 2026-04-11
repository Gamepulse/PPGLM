import os
import subprocess

os.chdir(r'C:\Coding\Pascal')

print("=== Commit des icones RGBA ===")

# Add icons
print("\n1. Adding icons to git...")
result = subprocess.run(['git', 'add', 'src-tauri/icons/'], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")
if result.stderr:
    print(f"Stderr: {result.stderr}")

# Check what was added
print("\n2. Checking what was staged...")
result = subprocess.run(['git', 'diff', '--cached', '--name-only'], capture_output=True, text=True, shell=True)
print(f"Staged files: {result.stdout}")

# Commit
print("\n3. Committing changes...")
result = subprocess.run([
    'git', 'commit', 
    '-m', 'fix: convert icons to RGBA format for cross-platform builds',
    '-m', '- All PNG icons now use RGBA color mode with alpha channel',
    '-m', '- Required for Tauri builds on macOS and Linux',
    '-m', '- Fixes build error: icon is not RGBA'
], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")
print(f"Stdout: {result.stdout[:500]}")
if result.stderr:
    print(f"Stderr: {result.stderr[:200]}")

# Push
print("\n4. Pushing to origin/Dev...")
result = subprocess.run(['git', 'push', 'origin', 'Dev'], capture_output=True, text=True, shell=True)
print(f"Return code: {result.returncode}")
print(f"Stdout: {result.stdout[:500]}")
if result.stderr:
    print(f"Stderr: {result.stderr[:200]}")

print("\n=== Done ===")
