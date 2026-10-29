import subprocess

html = """<!DOCTYPE html><html><body><pre id="log"></pre>
<iframe id="f" style="border:none;" src="http://localhost:8000/"></iframe>
<script>
const params = new URLSearchParams(window.location.search);
const w = parseInt(params.get('w') || '1280');
const h = parseInt(params.get('h') || '850');

const f = document.getElementById('f');
f.style.width = w + 'px';
f.style.height = h + 'px';

f.onload = () => {
  setTimeout(() => {
    const doc = f.contentDocument;
    const scrollW = doc.documentElement.scrollWidth;
    const clientW = doc.documentElement.clientWidth;
    const bodyScrollW = doc.body.scrollWidth;
    const bodyClientW = doc.body.clientWidth;

    const res = {
      windowWidth: w,
      htmlScrollWidth: scrollW,
      htmlClientWidth: clientW,
      bodyScrollWidth: bodyScrollW,
      bodyClientWidth: bodyClientW,
      hasHorizontalOverflow: scrollW > clientW || bodyScrollW > bodyClientW
    };

    document.getElementById('log').textContent = JSON.stringify(res, null, 2);
    document.title = 'CHECKED';
  }, 1000);
};
</script></body></html>"""

with open('check_overflow_iframe.html', 'w', encoding='utf-8') as fp:
    fp.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
for w, h in [(1280, 850), (390, 844)]:
    cmd = [
        chrome, '--headless=new', '--disable-gpu', '--no-sandbox',
        f'--window-size={w+50},{h+50}', '--virtual-time-budget=3000',
        '--dump-dom',
        f'http://localhost:8000/check_overflow_iframe.html?w={w}&h={h}'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
    s = res.stdout.find('<pre id="log">')
    e = res.stdout.find('</pre>')
    print(f"=== {w}x{h} ===")
    print(res.stdout[s+14:e])
