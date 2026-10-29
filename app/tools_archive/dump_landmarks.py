import subprocess

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--virtual-time-budget=2000',
    '--dump-dom',
    'http://localhost:8000/measure_poses.html'
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<div id="log">')
e = res.stdout.find('</div>')
if s != -1 and e != -1:
    print(res.stdout[s+14:e])
else:
    print('Failed to find log')
