import subprocess, os, tempfile, re, json, time, socket, struct, hashlib, base64

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
user_data = os.path.join(tempfile.gettempdir(), 'chrome_avatar_verify')
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\5624d43d-dfbc-47cb-80d3-cf57e6a0fe24'
port = 9444

proc = subprocess.Popen([
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    f'--remote-debugging-port={port}',
    f'--user-data-dir={user_data}',
    '--window-size=1280,850',
    'http://localhost:8080/?sign=HOLA'
])

time.sleep(3.5)

try:
    import urllib.request
    tabs = json.loads(urllib.request.urlopen(f'http://localhost:{port}/json/list').read().decode('utf-8'))
    target_tab = next(t for t in tabs if 'EXIS' in t.get('title', ''))
    ws_url = target_tab['webSocketDebuggerUrl']
    print("Connecting to CDP WS:", ws_url)

    # Parse ws_url: ws://localhost:port/devtools/page/...
    path = ws_url.split(f':{port}')[1]
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', port))

    sec_key = base64.b64encode(os.urandom(16)).decode('utf-8')
    handshake = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: localhost:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {sec_key}\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(handshake.encode('utf-8'))
    resp = s.recv(4096).decode('utf-8', errors='ignore')
    assert "101" in resp, f"Handshake failed: {resp}"

    def send_cdp(method, params=None, msg_id=1):
        payload = json.dumps({"id": msg_id, "method": method, "params": params or {}}).encode('utf-8')
        length = len(payload)
        mask = os.urandom(4)
        masked_payload = bytearray([payload[i] ^ mask[i % 4] for i in range(length)])
        if length < 126:
            header = bytearray([0x81, 0x80 | length]) + mask
        else:
            header = bytearray([0x81, 0x80 | 126]) + struct.pack('>H', length) + mask
        s.sendall(header + masked_payload)

    def recv_cdp_msg():
        # Read header
        b1, b2 = struct.unpack('BB', s.recv(2))
        length = b2 & 0x7f
        if length == 126:
            length = struct.unpack('>H', s.recv(2))[0]
        elif length == 127:
            length = struct.unpack('>Q', s.recv(8))[0]
        data = bytearray()
        while len(data) < length:
            chunk = s.recv(min(length - len(data), 65536))
            if not chunk: break
            data.extend(chunk)
        return json.loads(data.decode('utf-8', errors='ignore'))

    # Enable Console and Runtime
    send_cdp("Console.enable", msg_id=10)
    send_cdp("Runtime.enable", msg_id=11)

    # Poll status until model is loaded
    status_data = None
    for attempt in range(25):
        time.sleep(0.4)
        send_cdp("Runtime.evaluate", {
            "expression": "JSON.stringify(document.body.dataset.avatarStatus ? JSON.parse(document.body.dataset.avatarStatus) : window.Avatar3D ? { speed: Avatar3D.getSpeed() } : {})",
            "returnByValue": True
        }, msg_id=100 + attempt)
        
        while True:
            msg = recv_cdp_msg()
            if msg.get('id') == 100 + attempt:
                val = msg.get('result', {}).get('result', {}).get('value')
                if val:
                    st = json.loads(val)
                    if st.get('modelLoaded'):
                        status_data = st
                        break
                break
        if status_data:
            break

    print("\n=== Live Avatar Status from Browser ===")
    print(json.dumps(status_data, indent=2))

    # Evaluate console errors if any
    send_cdp("Runtime.evaluate", {
        "expression": "JSON.stringify(window.errorsLogged || [])",
        "returnByValue": True
    }, msg_id=200)

    # Capture screenshots of signs via Page.captureScreenshot
    test_signs = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'B', 'V']
    screenshot_results = {}

    for idx, sign in enumerate(test_signs):
        # Switch sign via Avatar3D.setSign(sign)
        send_cdp("Runtime.evaluate", {
            "expression": f"selectSign('{sign}');",
            "returnByValue": True
        }, msg_id=300 + idx)
        time.sleep(0.6)

        # Capture screenshot
        send_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=400 + idx)
        while True:
            msg = recv_cdp_msg()
            if msg.get('id') == 400 + idx:
                b64 = msg.get('result', {}).get('data', '')
                out_path = os.path.join(brain_dir, f'live_{sign}_mixer.png')
                with open(out_path, 'wb') as f:
                    f.write(base64.b64decode(b64))
                screenshot_results[sign] = {
                    'path': out_path,
                    'size': os.path.getsize(out_path)
                }
                print(f"Captured live sign {sign}: {out_path} ({os.path.getsize(out_path)} bytes)")
                break

    # Test slow motion 0.5x
    send_cdp("Runtime.evaluate", {
        "expression": "document.getElementById('btnSpeed05').click(); Avatar3D.getSpeed();",
        "returnByValue": True
    }, msg_id=500)
    time.sleep(0.3)
    send_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=501)
    while True:
        msg = recv_cdp_msg()
        if msg.get('id') == 501:
            b64 = msg.get('result', {}).get('data', '')
            out_path = os.path.join(brain_dir, 'live_speed_05x.png')
            with open(out_path, 'wb') as f:
                f.write(base64.b64decode(b64))
            print(f"Captured slow motion 0.5x: {out_path} ({os.path.getsize(out_path)} bytes)")
            break

    # Restore 1.0x
    send_cdp("Runtime.evaluate", {
        "expression": "document.getElementById('btnSpeed10').click(); Avatar3D.getSpeed();",
        "returnByValue": True
    }, msg_id=502)

    # Test hand camera preset
    send_cdp("Runtime.evaluate", {
        "expression": "document.getElementById('btnCamHand').click();",
        "returnByValue": True
    }, msg_id=503)
    time.sleep(0.4)
    send_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=504)
    while True:
        msg = recv_cdp_msg()
        if msg.get('id') == 504:
            b64 = msg.get('result', {}).get('data', '')
            out_path = os.path.join(brain_dir, 'live_hand_camera_preset.png')
            with open(out_path, 'wb') as f:
                f.write(base64.b64decode(b64))
            print(f"Captured hand camera framing: {out_path} ({os.path.getsize(out_path)} bytes)")
            break

finally:
    proc.kill()

print("\nCDP Verification completed successfully.")
