# Graph Report - exis aplicacion lenguaje de señas  (2026-11-02)

## Corpus Check
- 66 files · ~238,149 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .woff2 8, .glb 4, .css 2)

## Summary
- 260 nodes · 459 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- MoCap & Landmark Extraction
- Anime Video Curation Pipeline
- Gesture Trimming & Processing
- Camera Manager & UI Rendering
- Backend HTTP & Ollama LSC Server
- Optical Flow Video Generator
- Playwright Catalog Tests
- Letter I Video Curator
- Letter O Video Curator
- Multimedia Quality Verifier
- Offline Assets & TFLite Models
- Dictionary Schema Tests
- Frontend UI Orchestration
- End-to-End Browser Tests
- Console Error Audit
- Vision Evaluator Rules Test
- Live Hand Inference Suite
- Letter I Animation Test
- Letter O Animation Test
- Package & Dependency Specs
- Offline PWA & Cache Tests
- Chat Tutor & Ollama Client
- LSC Official Signs Catalog

## God Nodes (most connected - your core abstractions)
1. `CameraDeviceManager` - 18 edges
2. `MoCapExtractor` - 10 edges
3. `playwright` - 10 edges
4. `AnimeCurator` - 8 edges
5. `AnimeCurator` - 8 edges
6. `process_sign()` - 8 edges
7. `LSCHandler` - 8 edges
8. `main()` - 7 edges
9. `main()` - 7 edges
10. `read_image_safe()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `curate_sign()` --calls--> `cv2`  [EXTRACTED]
  app/tools/curate_anime_videos.py →   _Bridges community 1 → community 2_
- `read_image_safe()` --calls--> `cv2`  [EXTRACTED]
  app/tools/generate_videos.py →   _Bridges community 5 → community 2_
- `normalize()` --calls--> `numpy`  [EXTRACTED]
  app/tools/mocap_extractor.py →   _Bridges community 0 → community 2_
- `download_file()` --calls--> `os`  [EXTRACTED]
  app/tools/setup_offline_assets.py →   _Bridges community 10 → community 1_
- `check_mp4_video()` --calls--> `cv2`  [EXTRACTED]
  app/tools/verify_videos.py →   _Bridges community 9 → community 2_

## Import Cycles
- None detected.

## Communities (23 total, 8 thin omitted)

### Community 0 - "MoCap & Landmark Extraction"
Cohesion: 0.10
Nodes (5): euler_to_quaternion(), MoCapExtractor, normalize(), quaternion_slerp(), verify_clips_json()

### Community 1 - "Anime Video Curation Pipeline"
Cohesion: 0.13
Nodes (8): curate_sign(), main(), process_b(), process_buenos(), process_c(), process_hola(), cleanup_temp_files(), process_video()

### Community 2 - "Gesture Trimming & Processing"
Cohesion: 0.19
Nodes (21): extract_trimmed_frames(), main(), save_mp4(), save_webp(), cv2_imread(), cv2_imwrite(), interpolate_sequence(), load_keyframes() (+13 more)

### Community 3 - "Camera Manager & UI Rendering"
Cohesion: 0.13
Nodes (5): Avatar3D, CameraDeviceManager, TrajectoryTracker, VideoPlayer, VisionEvaluator

### Community 4 - "Backend HTTP & Ollama LSC Server"
Cohesion: 0.10
Nodes (5): detect_sign(), free_port(), LSCHandler, RangeFileWrapper, RobustThreadingServer

### Community 5 - "Optical Flow Video Generator"
Cohesion: 0.18
Nodes (7): build_smooth_loop(), interpolate_pair(), main(), process_sign(), read_image_safe(), save_animated_webp(), save_mp4()

### Community 6 - "Playwright Catalog Tests"
Cohesion: 0.17
Nodes (5): playwright, { chromium }, { chromium }, { chromium }, { chromium }

### Community 9 - "Multimedia Quality Verifier"
Cohesion: 0.33
Nodes (4): check_mp4_video(), check_webp_anim(), main(), test_media_assets()

### Community 10 - "Offline Assets & TFLite Models"
Cohesion: 0.57
Nodes (6): download_file(), main(), setup_canvas_confetti(), setup_fonts(), setup_mediapipe(), setup_tailwind()

### Community 11 - "Dictionary Schema Tests"
Cohesion: 0.25
Nodes (7): code, fs, path, requiredLetters, requiredWords, signsDataPath, window

### Community 12 - "Frontend UI Orchestration"
Cohesion: 0.62
Nodes (6): bindUIEvents(), dismissSuccessModal(), explainSignVoice(), renderSignButtons(), selectSign(), switchCategory()

### Community 13 - "End-to-End Browser Tests"
Cohesion: 0.29
Nodes (4): { chromium }, fs, path, runTests()

### Community 15 - "Vision Evaluator Rules Test"
Cohesion: 0.33
Nodes (5): code, fs, missing, path, requiredBranches

### Community 17 - "Letter I Animation Test"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 18 - "Letter O Animation Test"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `MoCap & Landmark Extraction` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `Anime Video Curation Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.13054187192118227 - nodes in this community are weakly interconnected._
- **Should `Camera Manager & UI Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._
- **Should `Backend HTTP & Ollama LSC Server` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._