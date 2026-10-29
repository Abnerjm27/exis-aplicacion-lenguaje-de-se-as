import subprocess

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--virtual-time-budget=2000',
    '--dump-dom',
    'http://localhost:8000/test_debug_bones.html'
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
tag_start = '<pre id="output">'
tag_end = '</pre>'
s = res.stdout.find(tag_start)
e = res.stdout.find(tag_end)
if s != -1 and e != -1:
    print(res.stdout[s + len(tag_start):e])
else:
    print('Not found')
