import subprocess
import os
import shutil

os.chdir(r'C:\Coding\Pascal')

# Créer le dossier de téléchargement
if os.path.exists('release_assets'):
    shutil.rmtree('release_assets')
os.makedirs('release_assets')

# Liste des fichiers à télécharger depuis la release draft
assets = [
    ("Pascal_0.4.1_x64_en-US.msi", "Pascal_0.5.0_x64_en-US.msi"),
    ("Pascal_0.4.1_x64-setup.exe", "Pascal_0.5.0_x64-setup.exe"),
    ("Pascal_0.4.1_x64.dmg", "Pascal_0.5.0_x64.dmg"),
    ("Pascal_0.4.1_aarch64.dmg", "Pascal_0.5.0_aarch64.dmg"),
    ("Pascal_0.4.1_amd64.deb", "Pascal_0.5.0_amd64.deb"),
    ("Pascal-0.4.1-1.x86_64.rpm", "Pascal-0.5.0-1.x86_64.rpm"),
    ("Pascal_0.4.1_amd64.AppImage", "Pascal_0.5.0_amd64.AppImage"),
]

print("=== Telechargement des artefacts ===")
for original_name, new_name in assets:
    print(f"\nTelechargement: {original_name}")
    # Telecharger depuis la release draft
    result = subprocess.run(
        ['gh', 'release', 'download', 'app-v0.4.1', '--pattern', original_name, '--dir', 'release_assets'],
        capture_output=True, text=True, shell=True
    )
    if result.returncode == 0:
        print(f"  -> OK")
        # Renommer
        old_path = os.path.join('release_assets', original_name)
        new_path = os.path.join('release_assets', new_name)
        if os.path.exists(old_path):
            shutil.move(old_path, new_path)
            print(f"  -> Renomme en: {new_name}")
    else:
        print(f"  -> ERREUR: {result.stderr[:200]}")

print("\n=== Upload vers v0.5.0 ===")
for _, new_name in assets:
    file_path = os.path.join('release_assets', new_name)
    if os.path.exists(file_path):
        print(f"\nUpload: {new_name}")
        result = subprocess.run(
            ['gh', 'release', 'upload', 'v0.5.0', file_path, '--clobber'],
            capture_output=True, text=True, shell=True
        )
        if result.returncode == 0:
            print(f"  -> OK")
        else:
            print(f"  -> ERREUR: {result.stderr[:200]}")

print("\n=== Nettoyage ===")
shutil.rmtree('release_assets')

print("\n=== Termine! ===")
