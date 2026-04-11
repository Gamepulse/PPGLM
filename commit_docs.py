import subprocess
import os

os.chdir(r'C:\Coding\Pascal')

print("=== Commit de la documentation macOS ===")

# Add file
result = subprocess.run(['git', 'add', 'MACOS_TROUBLESHOOTING.md'], capture_output=True, text=True, shell=True)
print(f"Add return code: {result.returncode}")

# Commit
result = subprocess.run([
    'git', 'commit', 
    '-m', 'docs: add macOS troubleshooting guide',
    '-m', '- Add MACOS_TROUBLESHOOTING.md with Gatekeeper bypass instructions',
    '-m', '- Explain why the app is blocked on macOS',
    '-m', '- Provide 3 different solutions for users',
    '-m', '- Include developer guide for code signing setup'
], capture_output=True, text=True, shell=True)
print(f"Commit return code: {result.returncode}")
print(f"Stdout: {result.stdout[:500]}")

# Push
result = subprocess.run(['git', 'push', 'origin', 'Dev'], capture_output=True, text=True, shell=True)
print(f"Push return code: {result.returncode}")

print("\n=== Done ===")
