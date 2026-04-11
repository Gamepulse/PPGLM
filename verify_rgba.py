import os
from PIL import Image

os.chdir(r'C:\Coding\Pascal')

print("=== Verification du format RGBA des icones ===")

icon_files = [
    'src-tauri/icons/32x32.png',
    'src-tauri/icons/128x128.png',
    'src-tauri/icons/128x128@2x.png'
]

modified = False
for icon_file in icon_files:
    if os.path.exists(icon_file):
        img = Image.open(icon_file)
        print(f"{icon_file}: mode={img.mode}, size={img.size}")
        
        # Verifier si c'est bien RGBA
        if img.mode == 'RGBA':
            print(f"  [OK] Format RGBA correct!")
        else:
            print(f"  [WARNING] Format {img.mode} - Doit etre RGBA!")
            # Convertir en RGBA
            print(f"  -> Conversion en RGBA...")
            img = img.convert('RGBA')
            img.save(icon_file)
            print(f"  -> Sauvegarde en RGBA terminee")
            modified = True
    else:
        print(f"{icon_file}: FICHIER MANQUANT!")

if modified:
    print("\n[IMPORTANT] Des icones ont ete modifiees! Il faut les commit.")
else:
    print("\n[INFO] Toutes les icones sont deja en format RGBA.")

print('\n=== Verification terminee ===')
