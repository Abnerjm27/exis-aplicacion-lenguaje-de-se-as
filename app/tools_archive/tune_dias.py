import subprocess

def test_pose(rA, rF, rH, name="test"):
    # Left is symmetric
    # In RPM:
    # RightArm: [rx, ry, rz] -> LeftArm: [rx, -ry, -rz]
    # RightForeArm: [rx, ry, rz] -> LeftForeArm: [rx, -ry, -rz]
    # RightHand: [rx, ry, rz] -> LeftHand: [rx, -ry, -rz]
    lA = [rA[0], -rA[1], -rA[2]]
    lF = [rF[0], -rF[1], -rF[2]]
    lH = [rH[0], -rH[1], -rH[2]]

    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body style="margin:0; background:#0b1120; overflow:hidden;">
<canvas id="c" style="width:500px; height:500px; display:block;"></canvas>
<pre id="p" style="color:white; position:absolute; top:0;"></pre>
<script>
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1120);
const renderer = new THREE.WebGLRenderer({{ canvas: document.getElementById('c'), antialias: true }});
renderer.setSize(500, 500);
renderer.outputEncoding = THREE.sRGBEncoding;
scene.add(new THREE.AmbientLight(0xffffff, 1.3));
const dir = new THREE.DirectionalLight(0xffffff, 1.4);
dir.position.set(0.5, 2.0, 2.5);
scene.add(dir);

new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {{
  scene.add(gltf.scene);
  const bones = {{}};
  gltf.scene.traverse(n => {{ if (n.isBone) bones[n.name] = n; }});

  bones['RightArm'].rotation.set({rA[0]}, {rA[1]}, {rA[2]});
  bones['RightForeArm'].rotation.set({rF[0]}, {rF[1]}, {rF[2]});
  bones['RightHand'].rotation.set({rH[0]}, {rH[1]}, {rH[2]});

  bones['LeftArm'].rotation.set({lA[0]}, {lA[1]}, {lA[2]});
  bones['LeftForeArm'].rotation.set({lF[0]}, {lF[1]}, {lF[2]});
  bones['LeftHand'].rotation.set({lH[0]}, {lH[1]}, {lH[2]});

  // Open fingers
  ['Right', 'Left'].forEach(side => {{
    ['Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {{
      for (let i = 1; i <= 3; i++) {{
        const b = bones[side + 'Hand' + f + i];
        if (b) b.rotation.set(0, 0, 0);
      }}
    }});
    for (let i = 1; i <= 3; i++) {{
      const b = bones[side + 'HandThumb' + i];
      if (b) b.rotation.set(0, 0, 0);
    }}
  }});

  gltf.scene.updateMatrixWorld(true);

  const rHand = new THREE.Vector3();
  const lHand = new THREE.Vector3();
  const rTip = new THREE.Vector3();
  bones['RightHand'].getWorldPosition(rHand);
  bones['LeftHand'].getWorldPosition(lHand);
  bones['RightHandMiddle3'].getWorldPosition(rTip);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 1.45, 1.65);
  camera.lookAt(0, 1.42, 0);
  renderer.render(scene, camera);

  document.getElementById('p').textContent = JSON.stringify({{
    rHand: [rHand.x.toFixed(3), rHand.y.toFixed(3), rHand.z.toFixed(3)],
    lHand: [lHand.x.toFixed(3), lHand.y.toFixed(3), lHand.z.toFixed(3)],
    rTip: [rTip.x.toFixed(3), rTip.y.toFixed(3), rTip.z.toFixed(3)],
  }});
  document.title = 'READY';
}});
</script></body></html>"""

    with open('test_dias_tune.html', 'w', encoding='utf-8') as f:
        f.write(html)

    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    out_png = rf'C:\Users\abner\.gemini\antigravity\brain\350c463a-68d6-42c1-adf9-9eb3a98a348b\dias_{name}.png'
    cmd = [
        chrome, '--headless=new', '--disable-gpu', '--no-sandbox',
        '--window-size=500,500', '--virtual-time-budget=2000',
        f'--screenshot={out_png}',
        'http://localhost:8000/test_dias_tune.html'
    ]
    subprocess.run(cmd, timeout=10)

    cmd_dom = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/test_dias_tune.html']
    res = subprocess.run(cmd_dom, capture_output=True, text=True, timeout=10)
    s = res.stdout.find('<pre id="p"')
    e = res.stdout.find('</pre>')
    print(f"[{name}] {res.stdout[s+30:e] if s != -1 else ''}")

# Let's test a few variations
test_pose([0.45, -0.30, -0.65], [-1.05, -0.20, 0.40], [0.10, -0.10, 0.0], "v1")
test_pose([0.55, -0.25, -0.75], [-0.95, -0.20, 0.45], [0.15, -0.15, 0.0], "v2")
test_pose([0.65, -0.20, -0.85], [-0.85, -0.20, 0.50], [0.15, -0.20, 0.0], "v3")
