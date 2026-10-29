import subprocess, os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

desktop_png = os.path.join(brain_dir, 'redesign_desktop_1280x850.png')
mobile_png = os.path.join(brain_dir, 'redesign_mobile_390x844.png')
sign_b_png = os.path.join(brain_dir, 'redesign_desktop_sign_B.png')

# 1. Desktop 1280x850
cmd_desk = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,850',
    '--virtual-time-budget=2500',
    f'--screenshot={desktop_png}',
    'http://localhost:8000/'
]
subprocess.run(cmd_desk, timeout=15)
print('Desktop 1280x850:', os.path.exists(desktop_png), f"({os.path.getsize(desktop_png) if os.path.exists(desktop_png) else 0}b)")

# 2. Mobile 390x844
cmd_mob = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    '--virtual-time-budget=2500',
    f'--screenshot={mobile_png}',
    'http://localhost:8000/'
]
subprocess.run(cmd_mob, timeout=15)
print('Mobile 390x844:', os.path.exists(mobile_png), f"({os.path.getsize(mobile_png) if os.path.exists(mobile_png) else 0}b)")

# 3. Sign B on Desktop
cmd_b = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,850',
    '--virtual-time-budget=2500',
    f'--screenshot={sign_b_png}',
    'http://localhost:8000/?sign=B'
]
subprocess.run(cmd_b, timeout=15)
print('Sign B Desktop:', os.path.exists(sign_b_png), f"({os.path.getsize(sign_b_png) if os.path.exists(sign_b_png) else 0}b)")

print("=== SCREENSHOT CHECKS COMPLETED ===")
