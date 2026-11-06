# Graph Report - exis aplicacion lenguaje de señas  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 345 nodes · 634 edges · 28 communities (14 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af492bee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- avatar-3d.js
- chat-tutor.js
- signs-data.js
- trajectory-tracker.js
- video-player.js

## God Nodes (most connected - your core abstractions)
1. `LearningPlanManager` - 21 edges
2. `AuthProfileManager` - 21 edges
3. `BlindExamController` - 21 edges
4. `CameraDeviceManager` - 18 edges
5. `playwright` - 12 edges
6. `MoCapExtractor` - 10 edges
7. `LSCHandler` - 9 edges
8. `AnimeCurator` - 8 edges
9. `AnimeCurator` - 8 edges
10. `process_sign()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `build_pedagogical_plan()` --calls--> `json`  [EXTRACTED]
  server.py →   _Bridges community 1 → community 2_
- `free_port()` --calls--> `os`  [EXTRACTED]
  server.py →   _Bridges community 1 → community 0_
- `check_mp4_video()` --calls--> `cv2`  [EXTRACTED]
  app/tools/verify_videos.py →   _Bridges community 12 → community 0_
- `download_file()` --calls--> `os`  [EXTRACTED]
  app/tools/setup_offline_assets.py →   _Bridges community 13 → community 0_
- `normalize()` --calls--> `numpy`  [EXTRACTED]
  app/tools/mocap_extractor.py →   _Bridges community 2 → community 0_

## Import Cycles
- None detected.

## Communities (28 total, 14 thin omitted)

### Community 0 - "MoCap & Landmark Extraction"
Cohesion: 0.09
Nodes (29): curate_sign(), main(), extract_trimmed_frames(), main(), save_mp4(), save_webp(), cv2_imread(), cv2_imwrite() (+21 more)

### Community 1 - "Anime Video Curation Pipeline"
Cohesion: 0.09
Nodes (8): build_pedagogical_plan(), detect_sign(), free_port(), load_users_db(), LSCHandler, RangeFileWrapper, RobustThreadingServer, save_user_to_db()

### Community 2 - "Gesture Trimming & Processing"
Cohesion: 0.10
Nodes (5): euler_to_quaternion(), MoCapExtractor, normalize(), quaternion_slerp(), verify_clips_json()

### Community 7 - "Letter I Video Curator"
Cohesion: 0.12
Nodes (8): http, { spawn }, assert, http, assert, { chromium }, assert, { chromium }

### Community 8 - "Letter O Video Curator"
Cohesion: 0.18
Nodes (7): build_smooth_loop(), interpolate_pair(), main(), process_sign(), read_image_safe(), save_animated_webp(), save_mp4()

### Community 9 - "Multimedia Quality Verifier"
Cohesion: 0.17
Nodes (5): playwright, { chromium }, { chromium }, { chromium }, { chromium }

### Community 12 - "Frontend UI Orchestration"
Cohesion: 0.33
Nodes (4): check_mp4_video(), check_webp_anim(), main(), test_media_assets()

### Community 13 - "End-to-End Browser Tests"
Cohesion: 0.57
Nodes (6): download_file(), main(), setup_canvas_confetti(), setup_fonts(), setup_mediapipe(), setup_tailwind()

### Community 14 - "Console Error Audit"
Cohesion: 0.25
Nodes (7): code, fs, path, requiredLetters, requiredWords, signsDataPath, window

### Community 15 - "Vision Evaluator Rules Test"
Cohesion: 0.62
Nodes (6): bindUIEvents(), dismissSuccessModal(), explainSignVoice(), renderSignButtons(), selectSign(), switchCategory()

### Community 16 - "Live Hand Inference Suite"
Cohesion: 0.29
Nodes (4): { chromium }, fs, path, runTests()

### Community 17 - "Letter I Animation Test"
Cohesion: 0.33
Nodes (5): code, fs, missing, path, requiredBranches

### Community 19 - "Package & Dependency Specs"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 20 - "Offline PWA & Cache Tests"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playwright` connect `Multimedia Quality Verifier` to `Letter I Video Curator`, `Live Hand Inference Suite`, `Letter O Animation Test`, `Package & Dependency Specs`, `Offline PWA & Cache Tests`, `Chat Tutor & Ollama Client`, `LSC Official Signs Catalog`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `MoCap & Landmark Extraction` be split into smaller, more focused modules?**
  _Cohesion score 0.09461152882205513 - nodes in this community are weakly interconnected._
- **Should `Anime Video Curation Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.08669354838709678 - nodes in this community are weakly interconnected._
- **Should `Gesture Trimming & Processing` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `Letter I Video Curator` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._