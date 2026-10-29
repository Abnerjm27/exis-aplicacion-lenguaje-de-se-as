import subprocess

def capture(ax, ay, az, fx, fy, fz, hx, hy, hz, name):
    lA = [ax, -ay, -az]
    lF = [fx, -fy, -fz]
    lH = [hx, -hy, -hz]

    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body style="margin:0; background:#0b1120; overflow:hidden;">
<canvas id="c" style="width:500px; height:500px; display:block;"></canvas>
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

  bones['RightArm'].rotation.set({ax}, {ay}, {az});
  bones['RightForeArm'].rotation.set({fx}, {fy}, {fz});
  bones['RightHand'].rotation.set({hx}, {hy}, {hz});

  bones['LeftArm'].rotation.set({lA[0]}, {lA[1]}, {lA[2]});
  bones['LeftForeArm'].rotation.set({lF[0]}, {lF[1]}, {lF[2]});
  bones['LeftHand'].rotation.set({lH[0]}, {lH[1]}, {lH[2]});

  ['Right', 'Left'].forEach(side => {{
    ['Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {{
      for (let i = 1; i <= 3; i++) {{
        const b = bones[side + 'Hand' + f + i];
        if (b) {{
          b.rotation.x = 0;
          if (i === 1) {{
            if (f === 'Index') b.rotation.z = (side === 'Right' ? 0.08 : -0.08);
            if (f === 'Pinky') b.rotation.z = (side === 'Right' ? -0.08 : 0.08);
          }}
        }}
      }}
    }});
    for (let i = 1; i <= 3; i++) {{
      const b = bones[side + 'HandThumb' + i];
      if (b) b.rotation.set(0.1, (side === 'Right' ? 0.15 : -0.15), (side === 'Right' ? -0.2 : 0.2));
    }}
  }});

  gltf.scene.updateMatrixWorld(true);

  // App camera: (0, 1.45, 1.65), target (0, 1.42, 0)
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 1.45, 1.65);
  camera.lookAt(0, 1.42, 0);
  renderer.render(scene, camera);
  document.title = 'READY';
}});
</script></body></html>"""

    page = f'render_{name}.html'
    with open(page, 'w', encoding='utf-8') as f:
        f.write(html)

    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    out_png = rf'C:\Users\abner\.gemini\antigravity\brain\350c463a-68d6-42c1-adf9-9eb3a98a348b\{name}.png'
    cmd = [
        chrome, '--headless=new', '--disable-gpu', '--no-sandbox',
        '--window-size=500,500', '--virtual-time-budget=2000',
        f'--screenshot={out_png}',
        f'http://localhost:8000/{page}'
    ]
    subprocess.run(cmd, timeout=10)
    print(f"Captured {name}")

capture(0.18, -0.40, -0.80, -0.85, -0.30, 0.30, 0.15, -0.15, 0.0, "dias_final_c1")
capture(0.24, -0.38, -0.78, -0.88, -0.28, 0.28, 0.15, -0.15, 0.0, "dias_final_c2")
