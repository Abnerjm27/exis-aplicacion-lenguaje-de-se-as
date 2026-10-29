import subprocess

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

poses = [
    ('HOLA', '0.35,-0.40,-0.95', '-2.15,0.60,0.15', '0.0,-0.20,0.15', '0.15,0,1.28', '-0.15,0,0', '0,0,0', 'temple'),
    ('YO', '0.30,0.15,-1.15', '-1.60,0.70,0.35', '-0.35,-0.50,0.30', '0.15,0,1.28', '-0.15,0,0', '0,0,0', 'chest'),
    ('BUENOS', '0.45,-0.25,-0.85', '-1.85,0.35,0.20', '-0.15,-0.20,0.05', '0.35,0.15,1.05', '-1.35,-0.50,-0.20', '0.1,0.15,-0.1', 'chin'),
    ('DIAS', '-0.40,-0.20,-0.80', '-1.20,0.50,0.20', '0.1,-0.1,0', '-0.40,0.20,0.80', '-1.20,-0.50,-0.20', '0.1,0.1,0', 'chest'),
    ('NOCHES', '0.65,-0.20,-0.95', '-1.85,0.25,0.35', '-0.1,-0.2,0', '0.60,0.20,1.00', '-1.80,-0.25,-0.35', '0.1,0.2,0', 'cross'),
    ('NOMBRE', '0.40,-0.15,-1.05', '-1.60,0.20,0.25', '0.05,-0.15,0', '0.35,0.15,1.10', '-1.50,-0.30,-0.20', '0,0.1,0', 'cross'),
]

for name, ra, rf, rh, la, lf, lh, target in poses:
    url = f'http://localhost:8000/calibrate_interactive.html?ra={ra}&rf={rf}&rh={rh}&la={la}&lf={lf}&lh={lh}&target={target}&view=body'
    cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', url]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    s = res.stdout.find('<div id="metrics"')
    e = res.stdout.find('</div>', s) if s != -1 else -1
    metric = res.stdout[s:e+6] if s != -1 else 'N/A'
    # clean tag
    clean = metric.replace('<div id="metrics" style="position:absolute; top:10px; left:10px; color:#38bdf8; font-family:monospace; font-size:14px; background:rgba(0,0,0,0.7); padding:8px;">', '').replace('</div>', '')
    print(f"{name:8s}: {clean}")
