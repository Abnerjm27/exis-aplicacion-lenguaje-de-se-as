import subprocess, os, tempfile, re, json, time

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
user_data = os.path.join(tempfile.gettempdir(), 'chrome_avatar_verify')
os.makedirs(user_data, exist_ok=True)

brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\5624d43d-dfbc-47cb-80d3-cf57e6a0fe24'

# 1. Start Chrome with remote debugging to inspect console errors and live status
port = 9333
proc = subprocess.Popen([
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    f'--remote-debugging-port={port}',
    f'--user-data-dir={user_data}',
    'http://localhost:8080/?sign=HOLA'
])

time.sleep(3.5)

import urllib.request
tabs = json.loads(urllib.request.urlopen(f'http://localhost:{port}/json/list').read().decode('utf-8'))
print(f"Open tabs ({len(tabs)}):")
for t in tabs:
    print(f" - {t.get('title')} ({t.get('url')})")

proc.kill()
