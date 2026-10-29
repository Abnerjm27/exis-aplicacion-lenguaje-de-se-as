import subprocess, os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

out_png = os.path.join(brain_dir, 'thumb_test.png')
url = 'http://localhost:8000/test_thumb.html?axis=y&val=1.0'
cmd = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=600,600',
    f'--screenshot={out_png}',
    '--virtual-time-budget=2000',
    url
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
print('STDOUT:', res.stdout)
print('STDERR:', res.stderr)
print('Exists:', os.path.exists(out_png))
