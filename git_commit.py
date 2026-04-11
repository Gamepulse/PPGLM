import subprocess
import os

os.chdir(r'C:\Coding\Pascal')

print("=== Git Operations ===")

# Add icons
print("\n1. Adding icons to git...")
result = subprocess.run(['git', 'add', 'src-tauri/icons/'], capture_output=True, text=True, shell=True)
print(f"stdout: {result.stdout}")
print(f"stderr: {result.stderr}")
print(f"return code: {result.returncode}")

# Check status
print("\n2. Checking git status...")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True, shell=True)
print(f"Changes: {result.stdout}")

# Commit
print("\n3. Committing changes...")
result = subprocess.run([
    'git', 'commit', 
    '-m', 'fix: convert icons to RGBA format for cross-platform builds',
    '-m', '- All PNG icons now use RGBA color mode with alpha channel',
    '-m', '- Required for Tauri builds on macOS and Linux',
    '-m', '- Fixes build error: icon is not RGBA'
], capture_output=True, text=True, shell=True)
print(f"stdout: {result.stdout[:500]}")
print(f"stderr: {result.stderr[:200]}")

# Push
print("\n4. Pushing to origin/Dev...")
result = subprocess.run(['git', 'push', 'origin', 'Dev'], capture_output=True, text=True, shell=True)
print(f"stdout: {result.stdout[:500]}")
print(f"stderr: {result.stderr[:200]}")

print("\n=== Done ===")
