"""Download only the official Android platform and build tools needed by build-android.ps1."""
import hashlib
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

base = Path(__file__).resolve().parent.parent / 'artifacts' / 'android-tools'
base.mkdir(parents=True, exist_ok=True)
repository = base / 'repository.xml'
if not repository.exists():
    urllib.request.urlretrieve('https://dl.google.com/android/repository/repository2-1.xml', repository)
root = ET.parse(repository).getroot()

def install(filename):
    item = next(e for e in root.iter('complete') if e.findtext('url') == filename)
    destination = base / filename
    if not destination.exists():
        urllib.request.urlretrieve('https://dl.google.com/android/repository/' + filename, destination)
    algorithm = item.find('checksum').get('type', 'sha1')
    if hashlib.new(algorithm, destination.read_bytes()).hexdigest() != item.findtext('checksum'):
        raise RuntimeError('Checksum mismatch: ' + filename)
    with zipfile.ZipFile(destination) as archive:
        top = archive.namelist()[0].split('/')[0]
        if not (base / top).exists():
            archive.extractall(base)
    print(filename, 'verified and extracted', flush=True)

with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(install, ['platform-36_r02.zip', 'build-tools_r36_windows.zip']))
