import os
import subprocess

os.chdir(r'C:\Coding\Pascal')

print("=== Vérification des fichiers d'icônes ===")

# Lister les fichiers dans src-tauri/icons/
if os.path.exists('src-tauri/icons'):
    files = os.listdir('src-tauri/icons')
    print(f"Fichiers trouvés: {files}")
else:
    print("Dossier src-tauri/icons n'existe pas!")

# Vérifier si les fichiers sont trackés par git
print("\n=== Vérification git ===")

# Utiliser os.system pour git status
print("\nExécution: git status")
exit_code = os.system('git status')
print(f"Exit code: {exit_code}")

print("\nExécution: git diff --stat")
exit_code = os.system('git diff --stat src-tauri/icons/')
print(f"Exit code: {exit_code}")

print("\nDone!")
