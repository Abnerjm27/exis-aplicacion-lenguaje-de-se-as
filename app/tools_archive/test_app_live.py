import subprocess, os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

for s in ['HOLA', 'YO', 'BUENOS', 'DIAS', 'V']:
    out_png = os.path.join(brain_dir, f'live_app_{s}.png')
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,850',
        '--virtual-time-budget=2000',
        f'--screenshot={out_png}',
        f'http://localhost:8000/?sign={s}'
    ]
    subprocess.run(cmd, timeout=12)
    print(f'Captured live app for {s}: {os.path.exists(out_png)}')
