# Graph Report - photos_letras_postgres  (2026-11-26)

## Corpus Check
- 210 files · ~4,432,599 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 48 file(s) not represented in the graph (top: .woff2 16, .css 10, .tflite 4)

## Summary
- 4527 nodes · 9919 edges · 183 communities (142 shown, 41 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 369 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c7076d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pose_solution_wasm_bin.js
- LessonSessionController
- AuthProfileManager
- BlindExamController
- CameraDeviceManager
- LearningPlanManager
- test_blind_exam_arena_unit.js
- mocap_extractor.py
- 4. Prompts Detallados para Copiar y Pegar
- ref_assert
- .parse
- AuthService
- ViewRouter
- three.module.min.js
- 4. Especificación Técnica de las 5 Nuevas Señas
- setup_offline_assets.py
- BodyAnchorDetector
- ref_fs
- AuthPageController
- manifest.json
- hands_solution_simd_wasm_bin.js
- test_lesson_session_unit.js
- tailwind.js
- OnboardingQuizController
- PWAManager
- hands_solution_wasm_bin.js
- MascotGalleryController
- check_console.js
- b
- assert
- Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video
- CertificateGenerator
- 🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol"
- Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)
- Review Focus
- assert
- add
- AnimeCurator
- AnimeCurator
- test_auth_split_flow.spec.js
- test_signs_data.js
- test_client_nlu.js
- main.js
- test_playwright.js
- playwright
- camera_utils.js
- Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`
- push
- subprocess
- readLatin1String
- test_finger_feedback_unit.js
- verify_exam_arena_no_video.js
- has
- SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md
- Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)
- AlphabetLabController
- signs-data.js
- video-player.js
- sw.js
- readLatin1String
- sort
- v
- decl
- hands.js
- server.py
- abort
- subprocess
- throwBindingError
- Q
- throwBindingError
- pose_solution_simd_wasm_bin.js
- r
- stringify
- warnOnce
- BlindSpellSession
- E
- b
- abort
- server.py
- kb
- checkStackCookie
- checkStackCookie
- confetti.browser.min.js
- _strftime
- ExceptionInfo
- _strftime
- ExceptionInfo
- cv2
- K
- test_gamification_unit.js
- test_checkpoints_unit.js
- __embind_register_std_string
- .reference
- PostgresUserRepository
- __embind_register_std_string
- package.json
- emscriptenWebGLGetTexPixelData
- emscriptenWebGLGetTexPixelData
- ZorritoVideoProcessor
- sys
- b
- runWithFS
- TestLiveChatAPI
- Nomenclatura Requerida
- getStringOrSymbol
- getStringOrSymbol
- ul
- Integración ECC (Everything Claude Code) · Proyecto Manitas (EXIS)
- assert
- warnOnce
- LetterECurator
- LetterUCurator
- assert
- test_security_and_hardening.py
- readLatin1String
- readLatin1String
- test_sign_anatomy_validator.js
- throwBindingError
- throwBindingError
- Review Focus
- c
- E
- SignAnatomyValidator
- createWasm
- LSCHandler
- postgres
- generate_videos.py
- createWasm
- b
- abort
- info
- abort
- checkStackCookie
- checkStackCookie
- _strftime
- ExceptionInfo
- _strftime
- ExceptionInfo
- .reference
- __embind_register_std_string
- __embind_register_std_string
- ExamUIHelper
- ta
- drawing_utils.js
- setup_offline_assets.py
- control_utils.js
- PerfilPageController
- emscriptenWebGLGetTexPixelData
- emscriptenWebGLGetTexPixelData
- TestSecurityAndHardeningLiveHTTP
- Tareas de Implementación
- Mapa de Archivos a Crear y Modificar
- runWithFS
- getStringOrSymbol
- getStringOrSymbol
- warnOnce
- f
- Global Constraints
- replace
- test_3_screens_flow.spec.js
- pose.js
- oa
- SRSClient
- GamificationManager
- _glGetUniformLocation
- curate_anime_videos.py
- FingerFeedbackEngine
- Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)
- control_utils.js
- FakeConnection
- ha
- Kn
- test_vision_rules.js
- constructor
- AchievementsController
- r
- pa
- _glGetUniformLocation
- Pa

## God Nodes (most connected - your core abstractions)
1. `push()` - 69 edges
2. `assert()` - 68 edges
3. `assert()` - 68 edges
4. `assert()` - 68 edges
5. `assert()` - 68 edges
6. `add()` - 64 edges
7. `LessonSessionController` - 50 edges
8. `replace()` - 49 edges
9. `BlindExamController` - 44 edges
10. `remove()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`)` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-learning-platform-plan.md → app/js/auth-profile-manager.js
- `Task 1: Mostrar `AÑOS` (y nombres legibles) en los nodos de la ruta (`app/js/learning-plan-manager.js`)` --references--> `LearningPlanManager`  [INFERRED]
  docs/superpowers/plans/2026-11-20-exam-mode-split-plan.md → app/js/learning-plan-manager.js
- `1. Resumen Ejecutivo` --references--> `LessonSessionController`  [INFERRED]
  .superpowers/sdd/2026-11-06-interactive-lesson-quiz/task-1-report.md → app/js/lesson-session.js
- `4. Arquitectura de Componentes y Módulos (POO)` --references--> `LSCHandler`  [INFERRED]
  docs/superpowers/specs/2026-11-05-exis-learning-platform-design.md → server.py
- `EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-3-screens-duolingo-flow-plan.md → app/js/auth-profile-manager.js

## Import Cycles
- None detected.

## Communities (183 total, 41 thin omitted)

### Community 0 - "pose_solution_wasm_bin.js"
Cohesion: 0.02
Nodes (47): alignMemory(), doReadv(), doWritev(), _environ_get(), _environ_sizes_get(), _fd_read(), _fd_write(), getEnvStrings() (+39 more)

### Community 1 - "LessonSessionController"
Cohesion: 0.06
Nodes (14): LessonSessionController, voiceFeedback, VoiceFeedbackService, 1. Requisitos Básicos, 2. Clonar y Arrancar (1 clic), 3. Persistencia con PostgreSQL (Opcional), 👥 Colaboración en Equipo, 📄 Créditos (+6 more)

### Community 3 - "BlindExamController"
Cohesion: 0.12
Nodes (7): BlindExamController, Review Focus, 1. Propósito y Por qué, 2. Metas, No-Metas y Restricciones, 3. Enfoques Evaluados, 4. Diseño de Componentes a Modificar, Especificación de Diseño — División de Exámenes (Solo Cámara vs. Solo Adivinar Señas)

### Community 4 - "CameraDeviceManager"
Cohesion: 0.07
Nodes (16): 1. Identidad y Misión del Proyecto, 2. Reglas Duras de Desarrollo (Hard Rules), 3. Especificación de Hardware y Optimización, 4. Protocolo de Colaboración en Pareja (Evitar Choques), 5. Estructura de Directorios, 6. Integración y Protocolo de Agentes ECC (Everything Claude Code), AGENTS.md — Reglas y Contexto Técnico para Agentes de IA (Proyecto EXIS), Armonización Reglas ECC vs EXIS: (+8 more)

### Community 6 - "test_blind_exam_arena_unit.js"
Cohesion: 0.11
Nodes (18): assert, BlindExamController, createMockElement(), fs, gesturePane, getMock(), mockElements, modal (+10 more)

### Community 7 - "mocap_extractor.py"
Cohesion: 0.10
Nodes (5): euler_to_quaternion(), MoCapExtractor, normalize(), quaternion_slerp(), verify_clips_json()

### Community 8 - "4. Prompts Detallados para Copiar y Pegar"
Cohesion: 0.07
Nodes (27): 01. Seña: HOLA (Saludo Oficial LSC70), 02. Seña: YO (Pronombre Primera Persona), 03. Seña: BUENOS / BUENAS (Cortesía - LSC70), 04. Seña: DÍAS (Tiempo / Amanecer), 05. Seña: NOCHES (Tiempo / Anochecer), 06. Seña: NOMBRE (Identificación), 07. Dactilología: Letra A, 08. Dactilología: Letra B (+19 more)

### Community 9 - "ref_assert"
Cohesion: 0.08
Nodes (16): assert, { chromium }, assert, { chromium }, assert, { chromium }, assert, { chromium } (+8 more)

### Community 12 - "ViewRouter"
Cohesion: 0.07
Nodes (9): LandingHeroPlayer, LandingPortalController, ZorritoCompanionController, ViewRouter, EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan, Global Constraints (`AGENTS.md` + `impeccable` + Emil Kowalski), Task 1: Landing Page Futurista y Portal Auth (`app/landing.html`, `app/css/landing.css`, `app/js/landing.js`), Task 2: Separación en 2 Vistas de Pantalla Completa dentro de `app/index.html` (`ViewRouter` + Mapa Estilo Duolingo vs Cabina de Práctica) (+1 more)

### Community 13 - "three.module.min.js"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 14 - "4. Especificación Técnica de las 5 Nuevas Señas"
Cohesion: 0.12
Nodes (15): 1. AÑOS (`ANNOS`) — Palabra, 1. Contexto e Intención, 2. LICOR (`LICOR`) — Palabra, 2. Metas y No-Metas, 3. Enfoques Considerados y Selección, 3. Letra D (`D`) — Letra Dactilológica, 4. Especificación Técnica de las 5 Nuevas Señas, 4. Letra E (`E`) — Letra Dactilológica (+7 more)

### Community 15 - "setup_offline_assets.py"
Cohesion: 0.13
Nodes (4): recv_cdp_msg(), send_cdp(), test_nlp_engine(), test_pwa_assets()

### Community 17 - "ref_fs"
Cohesion: 0.07
Nodes (22): { chromium }, fs, path, assert, { chromium }, fs, path, { chromium } (+14 more)

### Community 19 - "manifest.json"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, lang, name, orientation (+4 more)

### Community 20 - "hands_solution_simd_wasm_bin.js"
Cohesion: 0.02
Nodes (52): alignMemory(), doReadv(), doWritev(), _emscripten_get_heap_max(), emscripten_realloc_buffer(), _emscripten_resize_heap(), _environ_get(), _environ_sizes_get() (+44 more)

### Community 21 - "test_lesson_session_unit.js"
Cohesion: 0.17
Nodes (9): assert, documentMock, fs, lessonCode, lessonSessionPath, mockElements, path, signsDataCode (+1 more)

### Community 22 - "tailwind.js"
Cohesion: 0.02
Nodes (97): aa(), ac(), Ah(), Ak(), Ba(), bd(), bk(), blueGray() (+89 more)

### Community 25 - "hands_solution_wasm_bin.js"
Cohesion: 0.02
Nodes (45): alignMemory(), convertI32PairToI53Checked(), doReadv(), doWritev(), _environ_get(), _environ_sizes_get(), _fd_read(), _fd_seek() (+37 more)

### Community 27 - "check_console.js"
Cohesion: 0.20
Nodes (4): http, { spawn }, assert, http

### Community 28 - "b"
Cohesion: 0.24
Nodes (3): b(), D(), F()

### Community 29 - "assert"
Cohesion: 0.04
Nodes (92): addRunDependency(), assert(), asyncLoad(), convertI32PairToI53(), createExportWrapper(), doCallback(), done(), dynCall() (+84 more)

### Community 30 - "Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video"
Cohesion: 0.20
Nodes (9): 1. Intención y Propósito (The Why), 2. Metas, No-Metas y Anti-Metas, 3. Enfoques Evaluados (Approaches), 4. Arquitectura de Componentes y Módulos (POO), 5. Directrices de Calidad Visual y Pruebas (`impeccable` + `Emil Kowalski` + `Playwright`), Anti-Metas (Anti-Goals — Qué haría fallar el diseño aunque funcione), Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video, Metas (Goals) (+1 more)

### Community 31 - "CertificateGenerator"
Cohesion: 0.12
Nodes (5): CertificateGenerator, LSC_ALPHABET_24, assert, CertificateGenerator, runTests()

### Community 32 - "🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol""
Cohesion: 0.20
Nodes (9): 1. Concepto e Identidad, 2. Anatomía y Silueta Diseñada para Lengua de Señas (LSC), 3. Paleta Cromática Oficial (Color Swatches), 4. Vistas Obligatorias en la Hoja de Referencia (Model Sheet), 5. Cómo Usar esta Hoja como Referencia en Gemini / Kling / Runway, A. Rostro y Cabeza (Componente No Manual), B. Manos y Muñecas (Componente Manual), C. Torso y Contraste de Ropa (+1 more)

### Community 33 - "Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)"
Cohesion: 0.20
Nodes (9): 1. Resumen Ejecutivo, 2. Cumplimiento de Reglas Duras (AGENTS.md), 3. Arquitectura y Lógica Implementada, 4. Resultados de Pruebas Unitarias (`node tests/test_lesson_session_unit.js`), 5. Archivos Afectados, A. Estado Privado Encapsulado (`#`), B. Generador de Opciones sin Duplicados, C. Fases Pedagógicas (+1 more)

### Community 34 - "Review Focus"
Cohesion: 0.22
Nodes (8): Expansión de 5 Nuevas Señas LSC (AÑOS, LICOR, D, E, U) Implementation Plan, Global Constraints, Review Focus, Task 1: Generación y Verificación de Videos y Muestras Multimedia (`app/tools/generate_batch_5_signs.py`), Task 2: Actualización del Catálogo Oficial (`app/js/signs-data.js`), Task 3: Implementación de Reglas de Evaluación MediaPipe (`app/js/vision-evaluator.js`), Task 4: Documentación de Prompts Oficiales Anime IA (`referencias_para_gemini/PROMPTS_GEMINI.md`), Task 5: Verificación Integral del Sistema en Servidor Local

### Community 35 - "assert"
Cohesion: 0.04
Nodes (89): addRunDependency(), assert(), asyncLoad(), convertI32PairToI53(), convertI32PairToI53Checked(), createExportWrapper(), doCallback(), done() (+81 more)

### Community 36 - "add"
Cohesion: 0.09
Nodes (37): add(), l(), o(), already(), au(), Bh(), c(), checkForWarning() (+29 more)

### Community 39 - "test_auth_split_flow.spec.js"
Cohesion: 0.25
Nodes (5): assert, { chromium }, fs, path, shots

### Community 40 - "test_signs_data.js"
Cohesion: 0.25
Nodes (7): code, fs, path, requiredLetters, requiredWords, signsDataPath, window

### Community 41 - "test_client_nlu.js"
Cohesion: 0.22
Nodes (6): assert, cases, fs, LSCClientNLU, path, vm

### Community 42 - "main.js"
Cohesion: 0.54
Nodes (7): bindUIEvents(), dismissSuccessModal(), explainSignVoice(), initStudioOrientationBanner(), renderSignButtons(), selectSign(), switchCategory()

### Community 43 - "test_playwright.js"
Cohesion: 0.33
Nodes (4): { chromium }, fs, path, runTests()

### Community 44 - "playwright"
Cohesion: 0.08
Nodes (12): playwright, assert, { chromium }, { chromium }, { chromium }, { chromium }, { chromium }, { chromium } (+4 more)

### Community 45 - "camera_utils.js"
Cohesion: 0.11
Nodes (17): b(), C(), D(), e(), H(), I(), J(), b() (+9 more)

### Community 46 - "Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`"
Cohesion: 0.40
Nodes (4): Estructura Semántica Requerida, Objetivo, Restricciones Duras, Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`

### Community 47 - "push"
Cohesion: 0.06
Nodes (80): n(), _2(), after(), append(), as(), B(), BC(), before() (+72 more)

### Community 48 - "subprocess"
Cohesion: 0.06
Nodes (5): test_pose(), test_hand_shape(), capture(), test_pose(), check_viewport()

### Community 49 - "readLatin1String"
Cohesion: 0.09
Nodes (44): craftInvokerFunction(), onDone(), createNamedFunction(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+36 more)

### Community 50 - "test_finger_feedback_unit.js"
Cohesion: 0.05
Nodes (41): assert, dueFuture, engine, { FingerFeedbackEngine }, fs, letters24, lmF, lmG (+33 more)

### Community 51 - "verify_exam_arena_no_video.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 52 - "has"
Cohesion: 0.06
Nodes (50): b2(), ca(), Cl(), cs(), d2(), DC(), delete(), _deleteIfExpired() (+42 more)

### Community 53 - "SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md"
Cohesion: 0.50
Nodes (3): Pre-flight Checklist, SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md, Tasks Status

### Community 54 - "Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)"
Cohesion: 0.50
Nodes (3): Objetivo, Requisitos de Diseño, Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

### Community 62 - "readLatin1String"
Cohesion: 0.09
Nodes (44): craftInvokerFunction(), onDone(), createNamedFunction(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+36 more)

### Community 63 - "sort"
Cohesion: 0.14
Nodes (15): applyVariantOffset(), compare(), dm(), eE(), hm(), Lh(), qh(), QS() (+7 more)

### Community 64 - "v"
Cohesion: 0.12
Nodes (17): arbitraryProperty(), cr(), create(), Eh(), forVariant(), jt(), negative(), $o() (+9 more)

### Community 65 - "decl"
Cohesion: 0.08
Nodes (38): An(), atrule(), beforeAfter(), block(), body(), calcBefore(), comment(), decl() (+30 more)

### Community 66 - "hands.js"
Cohesion: 0.08
Nodes (32): bc(), cc(), dc(), Fa(), Ga(), gc(), Ha(), hc() (+24 more)

### Community 67 - "server.py"
Cohesion: 0.14
Nodes (5): create_user_repository(), _find_user(), handle_srs_get(), handle_srs_post(), TestSRSAndPostgres

### Community 68 - "abort"
Cohesion: 0.09
Nodes (29): abort(), addOnInit(), ___assert_fail(), checkIncomingModuleAPI(), convertFrameToPC(), createWasm(), instantiateArrayBuffer(), instantiateAsync() (+21 more)

### Community 69 - "subprocess"
Cohesion: 0.07
Nodes (5): process_buenos(), process_c(), process_hola(), cleanup_temp_files(), process_video()

### Community 70 - "throwBindingError"
Cohesion: 0.09
Nodes (33): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), constNoSmartPtrRawPointerToWireType(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+25 more)

### Community 71 - "Q"
Cohesion: 0.14
Nodes (24): ac(), Eb(), fc(), hb(), ib(), ic(), jb(), kb() (+16 more)

### Community 72 - "throwBindingError"
Cohesion: 0.09
Nodes (33): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), constNoSmartPtrRawPointerToWireType(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+25 more)

### Community 73 - "pose_solution_simd_wasm_bin.js"
Cohesion: 0.02
Nodes (45): alignMemory(), convertI32PairToI53Checked(), doReadv(), doWritev(), _environ_get(), _environ_sizes_get(), _fd_read(), _fd_seek() (+37 more)

### Community 74 - "r"
Cohesion: 0.12
Nodes (23): Ae(), ao(), cy(), Dl(), dy(), error(), fromOffset(), fy() (+15 more)

### Community 75 - "stringify"
Cohesion: 0.13
Nodes (25): async(), catch(), content(), css(), dp(), finally(), getAsyncError(), getIterator() (+17 more)

### Community 76 - "warnOnce"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 77 - "BlindSpellSession"
Cohesion: 0.10
Nodes (9): BlindSpellSession, assert, { BlindSpellSession }, failSummary, r1, r2, rSkip, session (+1 more)

### Community 78 - "E"
Cohesion: 0.25
Nodes (16): A(), aa(), cd(), E(), ea(), ed(), fd(), gd() (+8 more)

### Community 79 - "b"
Cohesion: 0.21
Nodes (4): b(), c(), Cb(), M()

### Community 80 - "abort"
Cohesion: 0.12
Nodes (19): abort(), ___assert_fail(), checkIncomingModuleAPI(), convertFrameToPC(), __dlopen_js(), __dlsym_js(), _emscripten_asm_const_int(), _emscripten_pc_get_function() (+11 more)

### Community 81 - "server.py"
Cohesion: 0.08
Nodes (7): build_pedagogical_plan(), free_port(), load_users_db(), ProcessLifecycleManager, RangeFileWrapper, RobustThreadingServer, save_user_to_db()

### Community 82 - "kb"
Cohesion: 0.15
Nodes (18): Ab(), Bb(), Db(), kb(), M(), nb(), ob(), Pb() (+10 more)

### Community 83 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 84 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 85 - "confetti.browser.min.js"
Cohesion: 0.21
Nodes (16): A(), b(), b(), M(), p(), c(), c(), e() (+8 more)

### Community 86 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 88 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 90 - "cv2"
Cohesion: 0.13
Nodes (22): extract_trimmed_frames(), main(), save_mp4(), save_webp(), cv2_imread(), cv2_imwrite(), interpolate_sequence(), load_keyframes() (+14 more)

### Community 91 - "K"
Cohesion: 0.08
Nodes (43): _a(), applyParallelOffset(), ax(), Bf(), clear(), ea(), en(), every() (+35 more)

### Community 92 - "test_gamification_unit.js"
Cohesion: 0.08
Nodes (21): assert, dispatchedEvents, examGm, fs, { GamificationManager }, gm, MockCustomEvent, nextDayState (+13 more)

### Community 93 - "test_checkpoints_unit.js"
Cohesion: 0.13
Nodes (11): assert, BlindExamController, counterEl, cp1Config, demoVideo, elements, fs, fullPlanConfig (+3 more)

### Community 94 - "__embind_register_std_string"
Cohesion: 0.17
Nodes (11): allocateUTF8(), __embind_register_std_string(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8() (+3 more)

### Community 95 - ".reference"
Cohesion: 0.20
Nodes (9): _emscripten_webgpu_get_device(), Manager(), _wgpuBufferReference(), _wgpuDeviceGetQueue(), _wgpuDeviceReference(), _wgpuSamplerReference(), _wgpuShaderModuleReference(), _wgpuTextureReference() (+1 more)

### Community 96 - "PostgresUserRepository"
Cohesion: 0.10
Nodes (4): JsonToPostgresMigrator, main(), PostgresUserRepository, SRSService

### Community 97 - "__embind_register_std_string"
Cohesion: 0.17
Nodes (11): allocateUTF8(), __embind_register_std_string(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8() (+3 more)

### Community 98 - "package.json"
Cohesion: 0.17
Nodes (11): description, devDependencies, playwright, name, scripts, test, test:console, test:e2e (+3 more)

### Community 99 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 100 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 102 - "sys"
Cohesion: 0.17
Nodes (6): AnimeCurator, main(), check_mp4_video(), check_webp_anim(), main(), test_media_assets()

### Community 103 - "b"
Cohesion: 0.18
Nodes (18): ab(), D(), dd(), c(), lc(), oc(), pa(), qa() (+10 more)

### Community 104 - "runWithFS"
Cohesion: 0.33
Nodes (3): runWithFS(), assert(), processPackageData()

### Community 106 - "Nomenclatura Requerida"
Cohesion: 0.33
Nodes (5): Integración con la Aplicación Web, Letras:, Nomenclatura Requerida, Palabras:, Videos Anime IA — Proyecto EXIS

### Community 107 - "getStringOrSymbol"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 108 - "getStringOrSymbol"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 109 - "ul"
Cohesion: 0.09
Nodes (29): br(), comma(), cx(), dx(), ec(), Fh(), fx(), gx() (+21 more)

### Community 110 - "Integración ECC (Everything Claude Code) · Proyecto Manitas (EXIS)"
Cohesion: 0.50
Nodes (3): 1. Mapeo de Subagentes ECC al Stack de Manitas, 2. Pautas de Armonización ECC + Reglas Duras EXIS, Integración ECC (Everything Claude Code) · Proyecto Manitas (EXIS)

### Community 111 - "assert"
Cohesion: 0.04
Nodes (92): addRunDependency(), assert(), asyncLoad(), convertI32PairToI53(), createExportWrapper(), doCallback(), done(), dynCall() (+84 more)

### Community 112 - "warnOnce"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 115 - "assert"
Cohesion: 0.04
Nodes (85): addRunDependency(), assert(), asyncLoad(), convertI32PairToI53(), convertI32PairToI53Checked(), createExportWrapper(), doCallback(), done() (+77 more)

### Community 116 - "test_security_and_hardening.py"
Cohesion: 0.15
Nodes (4): PedagogicalPlanner, RateLimiter, UserRepository, TestSecurityAndHardeningUnit

### Community 117 - "readLatin1String"
Cohesion: 0.09
Nodes (44): craftInvokerFunction(), onDone(), createNamedFunction(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+36 more)

### Community 118 - "readLatin1String"
Cohesion: 0.09
Nodes (44): craftInvokerFunction(), onDone(), createNamedFunction(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+36 more)

### Community 119 - "test_sign_anatomy_validator.js"
Cohesion: 0.04
Nodes (51): annosPose0Hands, assert, buenosNoBase, buenosPose1Hand, buenosWithBase, cAsO, crossLeft, crossRight (+43 more)

### Community 120 - "throwBindingError"
Cohesion: 0.09
Nodes (33): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), constNoSmartPtrRawPointerToWireType(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+25 more)

### Community 121 - "throwBindingError"
Cohesion: 0.09
Nodes (33): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), constNoSmartPtrRawPointerToWireType(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+25 more)

### Community 122 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Sistema de Lección Interactiva Tipo Test y Práctica con Cámara (Plan de Implementación), Task 1: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`), Task 2: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`), Task 3: Estructura HTML del Contenedor de Lección en `app/index.html`, Task 4: Integración con la Ruta Duolingo (`app/js/learning-plan-manager.js` y `app/js/main.js`), Task 5: Pruebas E2E Automatizadas con Playwright y Verificación

### Community 124 - "E"
Cohesion: 0.17
Nodes (19): A(), aa(), cd(), dd(), E(), ea(), ed(), fd() (+11 more)

### Community 126 - "createWasm"
Cohesion: 0.14
Nodes (19): addOnInit(), createWasm(), instantiateArrayBuffer(), instantiateAsync(), receiveInstance(), receiveInstantiationResult(), _emscripten_get_heap_max(), emscripten_realloc_buffer() (+11 more)

### Community 128 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, container_name (+10 more)

### Community 129 - "generate_videos.py"
Cohesion: 0.18
Nodes (7): build_smooth_loop(), interpolate_pair(), main(), process_sign(), read_image_safe(), save_animated_webp(), save_mp4()

### Community 130 - "createWasm"
Cohesion: 0.14
Nodes (20): addOnInit(), createWasm(), instantiateArrayBuffer(), instantiateAsync(), receiveInstance(), receiveInstantiationResult(), _emscripten_get_heap_max(), emscripten_realloc_buffer() (+12 more)

### Community 131 - "b"
Cohesion: 0.22
Nodes (3): b(), c(), L()

### Community 132 - "abort"
Cohesion: 0.12
Nodes (19): abort(), ___assert_fail(), checkIncomingModuleAPI(), convertFrameToPC(), __dlopen_js(), __dlsym_js(), _emscripten_asm_const_int(), _emscripten_pc_get_function() (+11 more)

### Community 133 - "info"
Cohesion: 0.14
Nodes (19): addOnInit(), createWasm(), instantiateArrayBuffer(), instantiateAsync(), receiveInstance(), receiveInstantiationResult(), _emscripten_get_heap_max(), emscripten_realloc_buffer() (+11 more)

### Community 134 - "abort"
Cohesion: 0.12
Nodes (19): abort(), ___assert_fail(), checkIncomingModuleAPI(), convertFrameToPC(), __dlopen_js(), __dlsym_js(), _emscripten_asm_const_int(), _emscripten_pc_get_function() (+11 more)

### Community 135 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 136 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 137 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 139 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 141 - ".reference"
Cohesion: 0.20
Nodes (9): _emscripten_webgpu_get_device(), Manager(), _wgpuBufferReference(), _wgpuDeviceGetQueue(), _wgpuDeviceReference(), _wgpuSamplerReference(), _wgpuShaderModuleReference(), _wgpuTextureReference() (+1 more)

### Community 142 - "__embind_register_std_string"
Cohesion: 0.17
Nodes (11): allocateUTF8(), __embind_register_std_string(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8() (+3 more)

### Community 143 - "__embind_register_std_string"
Cohesion: 0.17
Nodes (11): allocateUTF8(), __embind_register_std_string(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8() (+3 more)

### Community 145 - "ta"
Cohesion: 0.25
Nodes (12): D(), pa(), qa(), sa(), ta(), ua(), va(), wa() (+4 more)

### Community 146 - "drawing_utils.js"
Cohesion: 0.17
Nodes (6): G(), h(), p(), q(), r(), r()

### Community 147 - "setup_offline_assets.py"
Cohesion: 0.67
Nodes (6): download_file(), main(), setup_canvas_confetti(), setup_fonts(), setup_mediapipe(), setup_tailwind()

### Community 148 - "control_utils.js"
Cohesion: 0.17
Nodes (12): Ga(), K(), L(), M(), N(), na(), O(), q() (+4 more)

### Community 150 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 151 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 153 - "Tareas de Implementación"
Cohesion: 0.20
Nodes (9): Análisis de Agentes Necesarios, Plan de Implementación: Sistema de Puntos y Trayectorias de Movimiento LSC (Connect-the-Dots), Restricciones Globales (Hard Rules), Tarea 1: Modelado de Datos de Trayectorias en `signs-data.js`, Tarea 2: Creación del Motor `app/js/trajectory-tracker.js`, Tarea 3: Integración en `vision-evaluator.js` y Evaluación Concurrente, Tarea 4: Actualización de UI y Accesibilidad en `index.html`, `styles.css` y `main.js`, Tarea 5: Verificación Funcional, Responsiva y Cero Errores (+1 more)

### Community 154 - "Mapa de Archivos a Crear y Modificar"
Cohesion: 0.22
Nodes (7): EXIS Learning Platform, AI Paths & Blind Exam Mode Implementation Plan, Global Constraints, Mapa de Archivos a Crear y Modificar, Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`), Task 3: Clase POO `LearningPlanManager` y Mapa Hexagonal (`app/js/learning-plan-manager.js`), Task 5: Integración UI Híbrida en `app/index.html`, Estilos en `app/css/styles.css` y Orquestación en `app/js/main.js`, Task 6: Suite de Pruebas End-to-End en Playwright (`tests/learning_platform_and_exam.spec.js`) y Actualización de Graphify

### Community 155 - "runWithFS"
Cohesion: 0.33
Nodes (3): runWithFS(), assert(), processPackageData()

### Community 156 - "getStringOrSymbol"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 157 - "getStringOrSymbol"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 158 - "warnOnce"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 159 - "f"
Cohesion: 0.21
Nodes (14): k(), f(), ec(), c(), gc(), kc(), lb(), mb() (+6 more)

### Community 160 - "Global Constraints"
Cohesion: 0.25
Nodes (6): Global Constraints, Plan de Implementación — División de Exámenes (Solo Cámara vs. Solo Adivinar Señas) y Corrección `AÑOS` en Ruta, Task 1: Mostrar `AÑOS` (y nombres legibles) en los nodos de la ruta (`app/js/learning-plan-manager.js`), Task 2: UI del selector previo de modalidad en `app/index.html`, Task 3: Lógica POO de modalidades en `app/js/blind-exam-controller.js` y `app/js/exam-ui-helper.js`, Task 4: Actualizar pruebas unitarias (`tests/test_blind_exam_arena_unit.js`) y verificar todo

### Community 162 - "replace"
Cohesion: 0.06
Nodes (47): addToError(), check(), cleanBrackets(), _emitEvictions(), _entriesAscending(), Gl(), group(), isHack() (+39 more)

### Community 163 - "test_3_screens_flow.spec.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 164 - "pose.js"
Cohesion: 0.10
Nodes (24): Nc(), ac(), bc(), cc(), Fa(), fc(), Ga(), ic() (+16 more)

### Community 168 - "_glGetUniformLocation"
Cohesion: 0.67
Nodes (4): _glGetUniformLocation(), jstoi_q(), webglGetLeftBracePos(), webglPrepareUniformLocationsBeforeFirstUse()

### Community 171 - "Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)"
Cohesion: 0.40
Nodes (4): Lógica y Fases de la Lección, Pruebas, Reglas Obligatorias (AGENTS.md), Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)

### Community 172 - "control_utils.js"
Cohesion: 0.45
Nodes (9): aa(), Ca(), da(), ea(), fa(), ta(), ua(), ya() (+1 more)

### Community 176 - "ha"
Cohesion: 0.25
Nodes (10): E(), G(), ha(), ia(), J(), ja(), b(), c() (+2 more)

### Community 177 - "Kn"
Cohesion: 0.20
Nodes (9): ba(), c(), sa(), U(), v(), va(), wa(), xa() (+1 more)

### Community 178 - "test_vision_rules.js"
Cohesion: 0.33
Nodes (5): code, fs, missing, path, requiredBranches

### Community 181 - "constructor"
Cohesion: 0.20
Nodes (12): constructor(), createTokenizer(), da(), mapResolve(), positionBy(), positionInside(), possible(), prefixeds() (+4 more)

### Community 186 - "r"
Cohesion: 0.28
Nodes (6): ka(), l(), m(), oa(), r(), T()

### Community 189 - "_glGetUniformLocation"
Cohesion: 0.67
Nodes (4): _glGetUniformLocation(), jstoi_q(), webglGetLeftBracePos(), webglPrepareUniformLocationsBeforeFirstUse()

### Community 193 - "Pa"
Cohesion: 0.29
Nodes (11): gb(), hb(), hc(), ib(), jb(), La(), Ma(), xb() (+3 more)

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `f` to `pose_solution_wasm_bin.js`, `hands.js`, `b`, `pose.js`, `Q`, `pose_solution_simd_wasm_bin.js`, `camera_utils.js`, `b`, `ha`, `push`, `hands_solution_simd_wasm_bin.js`, `hands_solution_wasm_bin.js`?**
  _High betweenness centrality (0.325) - this node is a cross-community bridge._
- **Should `pose_solution_wasm_bin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.016297428062133943 - nodes in this community are weakly interconnected._
- **Why does `🌟 Módulos y Características Principales` connect `LessonSessionController` to `FingerFeedbackEngine`, `BlindExamController`, `CameraDeviceManager`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Should `LessonSessionController` be split into smaller, more focused modules?**
  _Cohesion score 0.06317907444668008 - nodes in this community are weakly interconnected._
- **Why does `CameraDeviceManager` connect `CameraDeviceManager` to `LessonSessionController`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `BlindExamController` be split into smaller, more focused modules?**
  _Cohesion score 0.12010796221322537 - nodes in this community are weakly interconnected._
- **Should `CameraDeviceManager` be split into smaller, more focused modules?**
  _Cohesion score 0.06966618287373004 - nodes in this community are weakly interconnected._