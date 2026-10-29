/**
 * LSC Learn · Proyecto EXIS
 * avatar-3d.js - Renderizado y Cinemática con THREE.AnimationMixer del Avatar 3D
 * Soporta modelos Anime (models/anime_character.glb) y Humano (models/human_player.glb)
 * Reproducción de clips mediante THREE.AnimationMixer y transiciones suaves (crossFadeTo)
 */

const Avatar3D = (() => {
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  let activeModel = null;
  let activeModelType = 'none'; // 'anime' | 'human' | 'procedural'
  let mixer = null;
  let currentAction = null;
  let activeSignId = 'HOLA';
  let animationSpeed = 1.0;
  let activeCameraPreset = 'body';

  const bonesMap = {};
  const clipsMap = {}; // { 'HOLA': THREE.AnimationClip, ... }
  let clipsJsonLoaded = false;

  const statusObj = {
    modelLoaded: false,
    modelType: 'none',
    bonesCount: 0,
    mixerActive: false,
    clipsCount: 0,
    currentClip: '',
    speed: 1.0,
    errors: []
  };

  function updateStatusDOM() {
    statusObj.modelLoaded = !!activeModel;
    statusObj.modelType = activeModelType;
    statusObj.bonesCount = Object.keys(bonesMap).length;
    statusObj.mixerActive = !!mixer;
    statusObj.clipsCount = Object.keys(clipsMap).length;
    statusObj.currentClip = activeSignId;
    statusObj.speed = animationSpeed;
    if (document && document.body) {
      document.body.setAttribute('data-avatar-status', JSON.stringify(statusObj));
    }
  }

  window.addEventListener('error', (e) => {
    statusObj.errors.push(e.message || String(e));
    updateStatusDOM();
  });

  // Procedural avatar fallback elements
  let avatarRoot = null;
  let chestGroup = null, headGroup = null;
  let rArmGroup = null, rForearmGroup = null, rHandGroup = null;

  // Canonical bone dictionary to map between anime/VRM and ReadyPlayerMe rigs
  const CANONICAL_BONES = {
    Spine: ['Spine', 'J_Bip_C_Spine', 'spine'],
    Spine1: ['Spine1', 'J_Bip_C_Chest', 'J_Bip_C_UpperChest', 'chest', 'upperChest'],
    Neck: ['Neck', 'J_Bip_C_Neck', 'neck'],
    Head: ['Head', 'J_Bip_C_Head', 'head'],

    RightShoulder: ['RightShoulder', 'J_Bip_R_Shoulder', 'rightShoulder'],
    RightArm: ['RightArm', 'J_Bip_R_UpperArm', 'rightUpperArm'],
    RightForeArm: ['RightForeArm', 'J_Bip_R_LowerArm', 'rightLowerArm'],
    RightHand: ['RightHand', 'J_Bip_R_Hand', 'rightHand'],

    RightHandThumb1: ['RightHandThumb1', 'J_Bip_R_Thumb1', 'rightThumbProximal'],
    RightHandThumb2: ['RightHandThumb2', 'J_Bip_R_Thumb2', 'rightThumbIntermediate'],
    RightHandThumb3: ['RightHandThumb3', 'J_Bip_R_Thumb3', 'rightThumbDistal'],

    RightHandIndex1: ['RightHandIndex1', 'J_Bip_R_Index1', 'rightIndexProximal'],
    RightHandIndex2: ['RightHandIndex2', 'J_Bip_R_Index2', 'rightIndexIntermediate'],
    RightHandIndex3: ['RightHandIndex3', 'J_Bip_R_Index3', 'rightIndexDistal'],

    RightHandMiddle1: ['RightHandMiddle1', 'J_Bip_R_Middle1', 'rightMiddleProximal'],
    RightHandMiddle2: ['RightHandMiddle2', 'J_Bip_R_Middle2', 'rightMiddleIntermediate'],
    RightHandMiddle3: ['RightHandMiddle3', 'J_Bip_R_Middle3', 'rightMiddleDistal'],

    RightHandRing1: ['RightHandRing1', 'J_Bip_R_Ring1', 'rightRingProximal'],
    RightHandRing2: ['RightHandRing2', 'J_Bip_R_Ring2', 'rightRingIntermediate'],
    RightHandRing3: ['RightHandRing3', 'J_Bip_R_Ring3', 'rightRingDistal'],

    RightHandPinky1: ['RightHandPinky1', 'J_Bip_R_Little1', 'rightLittleProximal'],
    RightHandPinky2: ['RightHandPinky2', 'J_Bip_R_Little2', 'rightLittleIntermediate'],
    RightHandPinky3: ['RightHandPinky3', 'J_Bip_R_Little3', 'rightLittleDistal'],

    LeftShoulder: ['LeftShoulder', 'J_Bip_L_Shoulder', 'leftShoulder'],
    LeftArm: ['LeftArm', 'J_Bip_L_UpperArm', 'leftUpperArm'],
    LeftForeArm: ['LeftForeArm', 'J_Bip_L_LowerArm', 'leftLowerArm'],
    LeftHand: ['LeftHand', 'J_Bip_L_Hand', 'leftHand'],

    LeftHandThumb1: ['LeftHandThumb1', 'J_Bip_L_Thumb1', 'leftThumbProximal'],
    LeftHandThumb2: ['LeftHandThumb2', 'J_Bip_L_Thumb2', 'leftThumbIntermediate'],
    LeftHandThumb3: ['LeftHandThumb3', 'J_Bip_L_Thumb3', 'leftThumbDistal'],

    LeftHandIndex1: ['LeftHandIndex1', 'J_Bip_L_Index1', 'leftIndexProximal'],
    LeftHandIndex2: ['LeftHandIndex2', 'J_Bip_L_Index2', 'leftIndexIntermediate'],
    LeftHandIndex3: ['LeftHandIndex3', 'J_Bip_L_Index3', 'leftIndexDistal'],

    LeftHandMiddle1: ['LeftHandMiddle1', 'J_Bip_L_Middle1', 'leftMiddleProximal'],
    LeftHandMiddle2: ['LeftHandMiddle2', 'J_Bip_L_Middle2', 'leftMiddleIntermediate'],
    LeftHandMiddle3: ['LeftHandMiddle3', 'J_Bip_L_Middle3', 'leftMiddleDistal'],

    LeftHandRing1: ['LeftHandRing1', 'J_Bip_L_Ring1', 'leftRingProximal'],
    LeftHandRing2: ['LeftHandRing2', 'J_Bip_L_Ring2', 'leftRingIntermediate'],
    LeftHandRing3: ['LeftHandRing3', 'J_Bip_L_Ring3', 'leftRingDistal'],

    LeftHandPinky1: ['LeftHandPinky1', 'J_Bip_L_Little1', 'leftLittleProximal'],
    LeftHandPinky2: ['LeftHandPinky2', 'J_Bip_L_Little2', 'leftLittleIntermediate'],
    LeftHandPinky3: ['LeftHandPinky3', 'J_Bip_L_Little3', 'leftLittleDistal']
  };

  function init() {
    const container = document.getElementById('canvas3dContainer');
    const canvas = document.getElementById('threeCanvas');
    if (!container || !canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);

    camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.45, 1.65);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.42, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.4;
    controls.maxDistance = 3.5;
    controls.update();

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.40);
    keyLight.position.set(0, 2.0, 3.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.85);
    fillLight.position.set(-2.5, 1.5, 1.5);
    scene.add(fillLight);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 1.5);
    cyanRim.position.set(2.5, 2.0, -2.0);
    scene.add(cyanRim);

    // Grid Floor
    const grid = new THREE.GridHelper(10, 25, 0x4338ca, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Initial load: Attempt Anime character first, fallback to ReadyPlayerMe, fallback to procedural
    loadModelWithFallback();

    window.addEventListener('resize', onWindowResize);
    animate();
  }

  function loadModelWithFallback() {
    const loader = new THREE.GLTFLoader();
    console.log("Avatar3D: Intentando cargar modelo Anime (models/anime_character.glb)...");

    loader.load(
      'models/anime_character.glb',
      (gltf) => {
        onModelLoaded(gltf, 'anime');
      },
      undefined,
      (err) => {
        console.warn("Avatar3D: No se pudo cargar models/anime_character.glb. Usando fallback models/human_player.glb:", err);
        loader.load(
          'models/human_player.glb',
          (gltf) => {
            onModelLoaded(gltf, 'human');
          },
          undefined,
          (err2) => {
            console.warn("Avatar3D: No se pudo cargar models/human_player.glb, activando avatar procedural:", err2);
            buildProceduralAvatar();
            const loadingEl = document.getElementById('loading3d');
            if (loadingEl) loadingEl.style.display = 'none';
          }
        );
      }
    );
  }

  function onModelLoaded(gltf, modelType) {
    if (activeModel) {
      scene.remove(activeModel);
    }

    activeModel = gltf.scene;
    activeModelType = modelType;
    activeModel.position.set(0, 0, 0);
    if (modelType === 'anime') {
      activeModel.rotation.y = Math.PI;
    }
    scene.add(activeModel);

    // Index bones and configure materials
    Object.keys(bonesMap).forEach(k => delete bonesMap[k]);
    activeModel.traverse((node) => {
      if (node.isBone) {
        bonesMap[node.name] = node;
      }
      if (node.isMesh && node.material) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (Array.isArray(node.material)) {
          node.material.forEach(m => { m.depthWrite = true; m.side = THREE.DoubleSide; });
        } else {
          node.material.depthWrite = true;
          node.material.side = THREE.DoubleSide;
        }
      }
    });

    console.log(`Avatar 3D (${modelType}) cargado con éxito. Huesos encontrados:`, Object.keys(bonesMap).length);

    // Initialize THREE.AnimationMixer on the loaded model
    mixer = new THREE.AnimationMixer(activeModel);
    mixer.timeScale = animationSpeed;

    // Build deterministic baseline clips for all signs
    buildBaselineClips();

    // Fetch and load clips from animations/lsc_clips.json
    fetchAndLoadClipsJson();

    // Hide loading overlay
    const loadingEl = document.getElementById('loading3d');
    if (loadingEl) loadingEl.style.display = 'none';

    // Play initial sign
    playSignClip(activeSignId);

    updateStatusDOM();

    if (activeCameraPreset === 'hand') {
      setTimeout(updateHandCamera, 100);
    }
  }

  // Helper to resolve bone by canonical name or alias
  function getBone(name) {
    if (bonesMap[name]) return bonesMap[name];
    const aliases = CANONICAL_BONES[name];
    if (aliases) {
      for (const a of aliases) {
        if (bonesMap[a]) return bonesMap[a];
      }
    }
    return null;
  }

  // Retarget tracks of a clip to match whatever bone names exist in active model
  function adaptClipToModel(clip, model) {
    if (!model || !clip) return clip;
    const modelBones = new Set(Object.keys(bonesMap));
    const adaptedTracks = [];

    clip.tracks.forEach(track => {
      const dotIdx = track.name.lastIndexOf('.');
      const boneName = dotIdx !== -1 ? track.name.substring(0, dotIdx) : track.name;
      const prop = dotIdx !== -1 ? track.name.substring(dotIdx) : '';

      if (modelBones.has(boneName)) {
        adaptedTracks.push(track);
      } else {
        let mapped = null;
        for (const [canonical, aliases] of Object.entries(CANONICAL_BONES)) {
          if (canonical === boneName || aliases.includes(boneName)) {
            const hit = aliases.find(a => modelBones.has(a));
            if (hit) { mapped = hit; break; }
          }
        }
        if (mapped) {
          const cloned = track.clone();
          cloned.name = mapped + prop;
          adaptedTracks.push(cloned);
        } else {
          adaptedTracks.push(track);
        }
      }
    });

    return new THREE.AnimationClip(clip.name, clip.duration, adaptedTracks);
  }

  // Build baseline procedural clips for all 11 signs so mixer always functions immediately
  function buildBaselineClips() {
    function makeQuatTrack(boneName, times, eulers) {
      const values = [];
      eulers.forEach(([rx, ry, rz]) => {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
        values.push(q.x, q.y, q.z, q.w);
      });
      return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
    }

    function makeFingerTracks(side, finger, times, curls, spread = 0) {
      const tracks = [];
      for (let j = 1; j <= 3; j++) {
        const bone = `${side}Hand${finger}${j}`;
        const eulers = curls.map(c => [c * 1.30, 0, j === 1 ? spread : 0]);
        tracks.push(makeQuatTrack(bone, times, eulers));
      }
      return tracks;
    }

    function makeThumbTracks(side, times, mode, fold = 0.8) {
      const s = side === 'Right' ? 1 : -1;
      let tx = 0, ty = 0, tz = 0;
      if (mode === 'tucked') {
        tx = 0.18; ty = 0.35 * s; tz = fold * s;
      } else if (mode === 'lateral_up') {
        tx = -0.30; ty = 0.75 * s; tz = 0.05 * s;
      } else if (mode === 'l_shape') {
        tx = 0.0; ty = 0.0; tz = -0.95 * s;
      } else if (mode === 'c_shape') {
        tx = 0.42; ty = 0.22 * s; tz = -0.42 * s;
      }
      const tracks = [];
      for (let j = 1; j <= 3; j++) {
        const bone = `${side}HandThumb${j}`;
        const eulers = times.map(() => [tx, ty, tz]);
        tracks.push(makeQuatTrack(bone, times, eulers));
      }
      return tracks;
    }

    // Default rest arm pose for non-active limbs
    const restRArm = [1.15, 0.0, 0.25];
    const restRFore = [-0.15, 0.0, 0.0];
    const restLArm = [1.15, 0.0, -0.25];
    const restLFore = [-0.15, 0.0, 0.0];

    // Subtle breathing posture
    const spineTimes = [0.0, 1.0, 2.0];
    const spineEulers = [[0.02, 0, 0], [0.03, 0, 0], [0.02, 0, 0]];
    const headEulers = [[0.01, 0.02, 0], [0.01, -0.02, 0], [0.01, 0.02, 0]];

    const rawClips = {};

    // 1. HOLA (Right hand wave at temple)
    {
      const times = [0.0, 0.5, 1.0, 1.5, 2.0];
      const rA = times.map(() => [-0.20, 0.0, -1.20]);
      const rF = times.map(() => [-2.40, 0.60, -0.40]);
      const rH = [
        [0.0, -0.20, 0.08],
        [0.0, -0.20, 0.24],
        [0.0, -0.20, 0.08],
        [0.0, -0.20, 0.24],
        [0.0, -0.20, 0.08]
      ];
      const lA = times.map(() => restLArm);
      const lF = times.map(() => restLFore);

      const tracks = [
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('Spine1', spineTimes, spineEulers),
        makeQuatTrack('Head', spineTimes, headEulers),
        ...makeFingerTracks('Right', 'Index', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Right', 'Middle', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Right', 'Ring', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Right', 'Pinky', times, [0, 0, 0, 0, 0]),
        ...makeThumbTracks('Right', times, 'neutral')
      ];
      rawClips['HOLA'] = new THREE.AnimationClip('HOLA', 2.0, tracks);
    }

    // 2. YO (Index pointing to chest)
    {
      const times = [0.0, 1.0, 2.0];
      const rA = times.map(() => [0.45, -0.20, -1.40]);
      const rF = times.map(() => [2.15, -0.40, -0.40]);
      const rH = [[-0.40, -0.45, 0.30], [-0.44, -0.45, 0.30], [-0.40, -0.45, 0.30]];
      const lA = times.map(() => restLArm);
      const lF = times.map(() => restLFore);

      const tracks = [
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('Spine1', spineTimes, spineEulers),
        makeQuatTrack('Head', spineTimes, headEulers),
        ...makeFingerTracks('Right', 'Index', times, [0, 0, 0]),
        ...makeFingerTracks('Right', 'Middle', times, [1.30, 1.30, 1.30]),
        ...makeFingerTracks('Right', 'Ring', times, [1.30, 1.30, 1.30]),
        ...makeFingerTracks('Right', 'Pinky', times, [1.30, 1.30, 1.30]),
        ...makeThumbTracks('Right', times, 'tucked', 0.85)
      ];
      rawClips['YO'] = new THREE.AnimationClip('YO', 2.0, tracks);
    }

    // 3. BUENOS (Hand from chin projecting forward)
    {
      const times = [0.0, 1.25, 2.5];
      const rA = times.map(() => [-0.20, -0.60, -1.40]);
      const rF = [[-2.40, 0.50, -0.40], [-2.40, 0.50, -0.30], [-2.40, 0.50, -0.40]];
      const rH = times.map(() => [0.15, -0.20, 0.05]);
      const lA = times.map(() => [0.35, 0.15, 1.05]);
      const lF = times.map(() => [1.40, -0.50, -0.20]);
      const lH = times.map(() => [0.10, 0.15, 0.0]);

      const tracks = [
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('LeftHand', times, lH),
        makeQuatTrack('Spine1', times, spineEulers),
        ...makeFingerTracks('Right', 'Index', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Right', 'Middle', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Right', 'Ring', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Right', 'Pinky', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Left', 'Index', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Left', 'Middle', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Left', 'Ring', times, [0.05, 0.05, 0.05]),
        ...makeFingerTracks('Left', 'Pinky', times, [0.05, 0.05, 0.05]),
        ...makeThumbTracks('Right', times, 'neutral'),
        ...makeThumbTracks('Left', times, 'neutral')
      ];
      rawClips['BUENOS'] = new THREE.AnimationClip('BUENOS', 2.5, tracks);
    }

    // 4. DIAS (Both arms open upward like sunrise)
    {
      const times = [0.0, 1.25, 2.5];
      const rA = [[0.32, -0.32, -0.42], [0.36, -0.35, -0.48], [0.32, -0.32, -0.42]];
      const rF = [[-1.15, -0.22, 0.22], [-1.12, -0.20, 0.25], [-1.15, -0.22, 0.22]];
      const rH = times.map(() => [0.15, -0.15, 0.0]);
      const lA = [[0.32, 0.32, 0.42], [0.36, 0.35, 0.48], [0.32, 0.32, 0.42]];
      const lF = [[-1.15, 0.22, -0.22], [-1.12, 0.20, -0.25], [-1.15, 0.22, -0.22]];
      const lH = times.map(() => [0.15, 0.15, 0.0]);

      const tracks = [
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('LeftHand', times, lH),
        makeQuatTrack('Spine1', times, spineEulers),
        ...makeFingerTracks('Right', 'Index', times, [0, 0, 0], 0.08),
        ...makeFingerTracks('Right', 'Middle', times, [0, 0, 0], 0.08),
        ...makeFingerTracks('Right', 'Ring', times, [0, 0, 0]),
        ...makeFingerTracks('Right', 'Pinky', times, [0, 0, 0], -0.06),
        ...makeFingerTracks('Left', 'Index', times, [0, 0, 0], -0.08),
        ...makeFingerTracks('Left', 'Middle', times, [0, 0, 0], -0.08),
        ...makeFingerTracks('Left', 'Ring', times, [0, 0, 0]),
        ...makeFingerTracks('Left', 'Pinky', times, [0, 0, 0], 0.06),
        ...makeThumbTracks('Right', times, 'neutral'),
        ...makeThumbTracks('Left', times, 'neutral')
      ];
      rawClips['DIAS'] = new THREE.AnimationClip('DIAS', 2.5, tracks);
    }

    // 5. NOCHES (Arms crossed over chest)
    {
      const times = [0.0, 1.25, 2.5];
      const lA = times.map(() => [0.45, 0.12, 0.82]);
      const lF = times.map(() => [1.75, 0.20, 0.25]);
      const lH = times.map(() => [-0.10, 0.20, -0.15]);
      const rA = times.map(() => [0.40, -0.10, -0.92]);
      const rF = times.map(() => [1.90, -0.20, -0.25]);
      const rH = times.map(() => [-0.10, -0.20, 0.15]);

      const tracks = [
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('LeftHand', times, lH),
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('Spine1', times, spineEulers),
        ...makeFingerTracks('Right', 'Index', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Right', 'Middle', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Right', 'Ring', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Right', 'Pinky', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Left', 'Index', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Left', 'Middle', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Left', 'Ring', times, [0.40, 0.40, 0.40]),
        ...makeFingerTracks('Left', 'Pinky', times, [0.40, 0.40, 0.40]),
        ...makeThumbTracks('Right', times, 'tucked', 0.50),
        ...makeThumbTracks('Left', times, 'tucked', 0.50)
      ];
      rawClips['NOCHES'] = new THREE.AnimationClip('NOCHES', 2.5, tracks);
    }

    // 6. NOMBRE (Two fingers right tap on two fingers left)
    {
      const times = [0.0, 0.5, 1.0, 1.5, 2.0];
      const lA = times.map(() => [0.65, 0.20, 1.20]);
      const lF = times.map(() => [1.90, 0.40, 0.40]);
      const lH = times.map(() => [0.0, 0.10, 0.0]);
      const rA = times.map(() => [0.65, 0.0, -1.20]);
      const rF = [
        [1.90, -0.40, -0.40],
        [1.94, -0.40, -0.40],
        [1.90, -0.40, -0.40],
        [1.94, -0.40, -0.40],
        [1.90, -0.40, -0.40]
      ];
      const rH = times.map(() => [0.05, -0.15, 0.0]);

      const tracks = [
        makeQuatTrack('LeftArm', times, lA),
        makeQuatTrack('LeftForeArm', times, lF),
        makeQuatTrack('LeftHand', times, lH),
        makeQuatTrack('RightArm', times, rA),
        makeQuatTrack('RightForeArm', times, rF),
        makeQuatTrack('RightHand', times, rH),
        makeQuatTrack('Spine1', spineTimes, spineEulers),
        ...makeFingerTracks('Right', 'Index', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Right', 'Middle', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Right', 'Ring', times, [1.40, 1.40, 1.40, 1.40, 1.40]),
        ...makeFingerTracks('Right', 'Pinky', times, [1.40, 1.40, 1.40, 1.40, 1.40]),
        ...makeFingerTracks('Left', 'Index', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Left', 'Middle', times, [0, 0, 0, 0, 0]),
        ...makeFingerTracks('Left', 'Ring', times, [1.40, 1.40, 1.40, 1.40, 1.40]),
        ...makeFingerTracks('Left', 'Pinky', times, [1.40, 1.40, 1.40, 1.40, 1.40]),
        ...makeThumbTracks('Right', times, 'tucked', 0.90),
        ...makeThumbTracks('Left', times, 'tucked', 0.90)
      ];
      rawClips['NOMBRE'] = new THREE.AnimationClip('NOMBRE', 2.0, tracks);
    }

    // Letters A, B, C, L, V (Upright hand postures)
    const letterConfigs = {
      'A': {
        curls: { Index: 1.45, Middle: 1.45, Ring: 1.45, Pinky: 1.45 },
        thumbMode: 'lateral_up',
        spread: { Index: 0, Middle: 0, Pinky: 0 },
        handRot: [-0.10, 0.10, -1.15]
      },
      'B': {
        curls: { Index: 0.0, Middle: 0.0, Ring: 0.0, Pinky: 0.0 },
        thumbMode: 'tucked',
        thumbFold: 1.15,
        spread: { Index: 0, Middle: 0, Pinky: 0 },
        handRot: [-0.10, 0.10, -1.15]
      },
      'C': {
        curls: { Index: 0.58, Middle: 0.58, Ring: 0.58, Pinky: 0.58 },
        thumbMode: 'c_shape',
        spread: { Index: 0, Middle: 0, Pinky: 0 },
        handRot: [-0.10, -0.22, -0.95]
      },
      'L': {
        curls: { Index: 0.0, Middle: 1.45, Ring: 1.45, Pinky: 1.45 },
        thumbMode: 'l_shape',
        spread: { Index: 0, Middle: 0, Pinky: 0 },
        handRot: [-0.10, 0.10, -1.15]
      },
      'V': {
        curls: { Index: 0.0, Middle: 0.0, Ring: 1.45, Pinky: 1.45 },
        thumbMode: 'tucked',
        thumbFold: 0.95,
        spread: { Index: -0.32, Middle: 0.32, Pinky: 0 },
        handRot: [-0.10, 0.10, -1.15]
      }
    };

    const letTimes = [0.0, 1.0, 2.0];
    Object.entries(letterConfigs).forEach(([sign, cfg]) => {
      const rA = letTimes.map(() => [0.40, 0.30, -0.90]);
      const rF = letTimes.map(() => [2.10, -0.60, -0.30]);
      const rH = letTimes.map(() => cfg.handRot);
      const lA = letTimes.map(() => restLArm);
      const lF = letTimes.map(() => restLFore);

      const tracks = [
        makeQuatTrack('RightArm', letTimes, rA),
        makeQuatTrack('RightForeArm', letTimes, rF),
        makeQuatTrack('RightHand', letTimes, rH),
        makeQuatTrack('LeftArm', letTimes, lA),
        makeQuatTrack('LeftForeArm', letTimes, lF),
        makeQuatTrack('Spine1', letTimes, spineEulers),
        makeQuatTrack('Head', letTimes, headEulers),
        ...makeFingerTracks('Right', 'Index', letTimes, [cfg.curls.Index, cfg.curls.Index, cfg.curls.Index], cfg.spread.Index),
        ...makeFingerTracks('Right', 'Middle', letTimes, [cfg.curls.Middle, cfg.curls.Middle, cfg.curls.Middle], cfg.spread.Middle),
        ...makeFingerTracks('Right', 'Ring', letTimes, [cfg.curls.Ring, cfg.curls.Ring, cfg.curls.Ring]),
        ...makeFingerTracks('Right', 'Pinky', letTimes, [cfg.curls.Pinky, cfg.curls.Pinky, cfg.curls.Pinky], cfg.spread.Pinky),
        ...makeThumbTracks('Right', letTimes, cfg.thumbMode, cfg.thumbFold || 0.8)
      ];
      rawClips[sign] = new THREE.AnimationClip(sign, 2.0, tracks);
    });

    // Adapt all baseline clips to active model
    Object.entries(rawClips).forEach(([sign, clip]) => {
      clipsMap[sign] = adaptClipToModel(clip, activeModel);
    });
  }

  // Fetch and parse clips from animations/lsc_clips.json
  function fetchAndLoadClipsJson() {
    fetch('animations/lsc_clips.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        parseAndApplyClips(data);
        clipsJsonLoaded = true;
        console.log("Avatar3D: animations/lsc_clips.json cargado e integrado exitosamente.");
        if (mixer && activeSignId && clipsMap[activeSignId]) {
          playSignClip(activeSignId);
        }
      })
      .catch(err => {
        console.log("Avatar3D: animations/lsc_clips.json no disponible aún, usando clips procedurales base.");
      });
  }

  function parseAndApplyClips(data) {
    if (!data) return;
    let count = 0;

    const processClipObj = (name, clipData) => {
      try {
        let clip = null;
        if (clipData.tracks && Array.isArray(clipData.tracks)) {
          clip = THREE.AnimationClip.parse(clipData);
        } else if (Array.isArray(clipData)) {
          // Array of tracks directly
          const tracks = [];
          clipData.forEach(t => {
            if (t.name && t.times && t.values) {
              if (t.name.endsWith('.quaternion') || t.type === 'quaternion') {
                tracks.push(new THREE.QuaternionKeyframeTrack(t.name, t.times, t.values));
              } else {
                tracks.push(new THREE.VectorKeyframeTrack(t.name, t.times, t.values));
              }
            }
          });
          const dur = tracks.reduce((max, tr) => Math.max(max, tr.times[tr.times.length - 1]), 2.0);
          clip = new THREE.AnimationClip(name, dur, tracks);
        }

        if (clip) {
          const adapted = adaptClipToModel(clip, activeModel);
          clipsMap[name.toUpperCase()] = adapted;
          count++;
        }
      } catch (e) {
        console.warn(`Error parseando clip para ${name}:`, e);
      }
    };

    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.name) processClipObj(item.name, item);
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, val]) => {
        processClipObj(key, val);
      });
    }

    console.log(`Avatar3D: ${count} clips de animación integrados.`);
    updateStatusDOM();
  }

  function playSignClip(signId) {
    if (!signId) signId = 'HOLA';
    activeSignId = signId.toUpperCase();

    if (!mixer || !activeModel) {
      if (avatarRoot) {
        // Procedural group animation will handle it
      }
      return;
    }

    const clip = clipsMap[activeSignId];
    if (!clip) {
      console.warn(`Avatar3D: Clip no encontrado para ${activeSignId}`);
      return;
    }

    const nextAction = mixer.clipAction(clip);
    nextAction.setLoop(THREE.LoopRepeat);
    nextAction.clampWhenFinished = false;
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(animationSpeed);
    nextAction.setEffectiveWeight(1.0);

    if (currentAction && currentAction !== nextAction) {
      nextAction.reset();
      // Smooth cross-fade over 0.35 seconds
      currentAction.crossFadeTo(nextAction, 0.35, true);
      nextAction.play();
    } else {
      nextAction.reset();
      nextAction.play();
    }

    currentAction = nextAction;
    updateStatusDOM();

    if (activeCameraPreset === 'hand') {
      setTimeout(updateHandCamera, 30);
    }
  }

  function setSign(signId) {
    playSignClip(signId);
  }

  // Animation speed control (0.5x, 1.0x, etc.)
  function setSpeed(speed) {
    animationSpeed = Math.max(0.1, Number(speed) || 1.0);
    if (mixer) {
      mixer.timeScale = animationSpeed;
    }
    if (currentAction) {
      currentAction.setEffectiveTimeScale(animationSpeed);
    }
    updateStatusDOM();
    console.log(`Avatar3D: Velocidad configurada a ${animationSpeed}x`);
  }

  function getSpeed() {
    return animationSpeed;
  }

  // Hand camera tracking
  function updateHandCamera() {
    const rHand = getBone('RightHand');
    if (!rHand || !camera || !controls) return;

    if (activeModel) activeModel.updateMatrixWorld(true);

    const hPos = new THREE.Vector3();
    const mPos = new THREE.Vector3();
    rHand.getWorldPosition(hPos);

    const middle2 = getBone('RightHandMiddle2');
    if (middle2) middle2.getWorldPosition(mPos);
    else mPos.copy(hPos);

    const center = hPos.clone().lerp(mPos, 0.5);

    camera.position.set(center.x, center.y, center.z + 0.38);
    controls.target.set(center.x, center.y, center.z);
    controls.update();
  }

  function setCameraPreset(preset) {
    if (!camera || !controls) return;
    activeCameraPreset = preset;

    if (preset === 'hand') {
      updateHandCamera();
    } else if (preset === 'face') {
      camera.position.set(0, 1.62, 0.70);
      controls.target.set(0, 1.60, 0);
      controls.update();
    } else {
      camera.position.set(0, 1.45, 1.65);
      controls.target.set(0, 1.42, 0);
      controls.update();
    }
  }

  // Procedural Articulated Avatar (Ultimate Fallback)
  function buildProceduralAvatar() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const chestMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });

    avatarRoot = new THREE.Group();
    scene.add(avatarRoot);

    chestGroup = new THREE.Group();
    avatarRoot.add(chestGroup);

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.38, 16), chestMat);
    torsoMesh.position.y = 1.30;
    chestGroup.add(torsoMesh);

    headGroup = new THREE.Group();
    headGroup.position.set(0, 1.55, 0);
    chestGroup.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.10, 24, 24), bodyMat);
    headGroup.add(headMesh);

    // Left Arm resting
    const lShoulder = new THREE.Group();
    lShoulder.position.set(-0.22, 1.45, 0);
    chestGroup.add(lShoulder);
    const lArm = new THREE.Group();
    lShoulder.add(lArm);
    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.22), bodyMat);
    lArmMesh.position.y = -0.11;
    lArm.add(lArmMesh);
    lArm.rotation.z = 0.2;

    // Right Arm
    const rShoulder = new THREE.Group();
    rShoulder.position.set(0.22, 1.45, 0);
    chestGroup.add(rShoulder);

    rArmGroup = new THREE.Group();
    rShoulder.add(rArmGroup);
    const rUpperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.22), bodyMat);
    rUpperMesh.position.y = -0.11;
    rArmGroup.add(rUpperMesh);

    rForearmGroup = new THREE.Group();
    rForearmGroup.position.set(0, -0.22, 0);
    rArmGroup.add(rForearmGroup);
    const rForeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.20), skinMat);
    rForeMesh.position.y = -0.10;
    rForearmGroup.add(rForeMesh);

    rHandGroup = new THREE.Group();
    rHandGroup.position.set(0, -0.20, 0);
    rForearmGroup.add(rHandGroup);
    const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.024), skinMat);
    palmMesh.position.set(0, -0.035, 0);
    rHandGroup.add(palmMesh);
  }

  function animateProceduralAvatar(time) {
    if (!avatarRoot) return;
    chestGroup.position.y = Math.sin(time * 2.2) * 0.006;
    headGroup.rotation.y = Math.sin(time * 0.9) * 0.06;

    if (activeSignId === 'HOLA') {
      rArmGroup.rotation.set(-1.35, 0.4, -0.55);
      rForearmGroup.rotation.set(-0.5, 0, 0.2);
      rHandGroup.rotation.z = Math.sin(time * 4.0 * animationSpeed) * 0.35;
    } else if (activeSignId === 'YO') {
      rArmGroup.rotation.set(-0.85, 0.55, -0.35);
      rForearmGroup.rotation.set(-1.0, 0.2, -0.4);
      rHandGroup.rotation.set(-0.9 + Math.sin(time * 2.5 * animationSpeed) * 0.08, -0.5, 0.4);
    } else {
      rArmGroup.rotation.set(-0.9, 0.15, -0.25);
      rForearmGroup.rotation.set(-0.9, 0, 0);
    }
  }

  function onWindowResize() {
    const container = document.getElementById('canvas3dContainer');
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (mixer) {
      mixer.update(delta);
      if (activeCameraPreset === 'hand') {
        updateHandCamera();
      }
    } else if (avatarRoot) {
      animateProceduralAvatar(time);
    }

    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  return {
    init,
    setSign,
    setCameraPreset,
    setSpeed,
    getSpeed,
    reloadClips: fetchAndLoadClipsJson,
    onWindowResize
  };
})();

window.Avatar3D = Avatar3D;
