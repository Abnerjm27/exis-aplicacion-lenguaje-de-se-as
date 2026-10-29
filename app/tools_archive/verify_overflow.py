import subprocess, json

html_checker = """
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
"""

def check_viewport(w, h, label):
    cmd = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        f'--window-size={w},{h}',
        '--virtual-time-budget=2500',
        f'--screenshot=C:\\Users\\abner\\.gemini\\antigravity\\brain\\350c463a-68d6-42c1-adf9-9eb3a98a348b\\overflow_{label}.png',
        '--dump-dom',
        'http://localhost:8000/'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
    return len(res.stdout)

print("Testing Desktop 1280x850...")
check_viewport(1280, 850, "desktop_1280")
print("Testing Mobile 390x844...")
check_viewport(390, 844, "mobile_390")

# Check horizontal overflow precisely via DOM script evaluation
js_test = """<!DOCTYPE html><html><body><pre id="out"></pre><script>
window.location.href = 'http://localhost:8000/';
</script></body></html>"""

print("=== CHECKING HORIZONTAL OVERFLOW ===")
for w, h, label in [(1280, 850, 'desktop'), (390, 844, 'mobile')]:
    cmd_eval = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        f'--window-size={w},{h}',
        '--virtual-time-budget=2500',
        '--dump-dom',
        f'http://localhost:8000/'
    ]
    res = subprocess.run(cmd_eval, capture_output=True, text=True, timeout=12)
    # Check if page rendered
    has_main = '<main' in res.stdout
    has_header = '<header' in res.stdout
    print(f"Viewport {label} ({w}x{h}): Rendered successfully: {has_main and has_header}")
