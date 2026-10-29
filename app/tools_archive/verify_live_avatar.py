import subprocess, os, re, json, time

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\5624d43d-dfbc-47cb-80d3-cf57e6a0fe24'
scratch_dir = os.path.join(brain_dir, 'scratch')
os.makedirs(scratch_dir, exist_ok=True)

# 1. Test dump DOM and check avatar status
cmd_dump = [
    chrome,
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--dump-dom',
    'http://localhost:8000/'
]

res = subprocess.run(cmd_dump, capture_output=True, text=True, encoding='utf-8', errors='ignore', timeout=15)
match = re.search(r'data-avatar-status="([^"]+)"', res.stdout)
if match:
    raw = match.group(1).replace('&quot;', '"')
    print("STATUS FOUND:", raw)
else:
    print("STATUS NOT FOUND in initial dump. Let's inspect stdout length:", len(res.stdout))

# 2. Test screenshots for multiple signs with Chrome headless
test_signs = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'A', 'B', 'C', 'L', 'V']
results = {}

for sign in test_signs:
    out_png = os.path.join(brain_dir, f'evidence_anime_{sign}.png')
    cmd_shot = [
        chrome,
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,850',
        f'--screenshot={out_png}',
        f'http://localhost:8000/?sign={sign}'
    ]
    sub = subprocess.run(cmd_shot, capture_output=True, timeout=15)
    exists = os.path.exists(out_png)
    size = os.path.getsize(out_png) if exists else 0
    results[sign] = {'exists': exists, 'size': size, 'path': out_png}
    print(f"Captured {sign}: exists={exists}, size={size} bytes")

print("\n--- Summary of Live Captures ---")
print(json.dumps(results, indent=2))
