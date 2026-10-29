import subprocess

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=4000', '--dump-dom', 'http://localhost:8000/ik_letters.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
tag_start = '<div id="output">'
tag_end = '</div>'
s = res.stdout.find(tag_start)
e = res.stdout.find(tag_end, s)
if s != -1 and e != -1:
    print(res.stdout[s + len(tag_start):e])
else:
    print('Failed to find output')
