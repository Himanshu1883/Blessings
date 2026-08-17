"""Convert public/new_data HEIC looks to resized JPEGs for catalog seed."""
from pathlib import Path

from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "new_data"
DST = Path(__file__).resolve().parent / ".seed-cache"
DST.mkdir(parents=True, exist_ok=True)

MAX = (1600, 2200)


def convert_one(src: Path) -> Path:
    dest = DST / (src.stem + ".jpg")
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        print(f"skip {src.name}")
        return dest
    im = Image.open(src)
    im = im.convert("RGB")
    im.thumbnail(MAX)
    im.save(dest, "JPEG", quality=82, optimize=True)
    print(f"ok {src.name} -> {dest.name} {dest.stat().st_size}")
    return dest


def main() -> None:
    files = [p for p in SRC.iterdir() if p.suffix.lower() in {".heic", ".heif"}]
    print(f"{len(files)} HEIC files in {SRC}")
    for p in sorted(files):
        convert_one(p)


if __name__ == "__main__":
    main()
