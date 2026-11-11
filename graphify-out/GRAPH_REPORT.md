# Graph Report - ollama_bat_infinite_terminals  (2026-11-07)

## Corpus Check
- 168 files · ~2,781,410 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 39 file(s) not represented in the graph (top: .woff2 16, .css 6, .glb 4)

## Summary
- 2735 nodes · 6223 edges · 113 communities (93 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 237 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b939fc02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cv2
- LessonSessionController
- .parse
- server.py
- test_blind_exam_arena_unit.js
- BlindExamController
- MoCapExtractor
- LearningPlanManager
- CameraDeviceManager
- AuthService
- AuthProfileManager
- playwright
- ViewRouter
- test_mascot_gallery.spec.js
- hands_solution_simd_wasm_bin.js
- ref_path
- AuthPageController
- ref_assert
- test_lesson_session_unit.js
- tailwind.js
- OnboardingQuizController
- MascotGalleryController
- check_console.js
- cdp_verify.py
- AnimeCurator
- AnimeCurator
- test_auth_split_flow.spec.js
- test_signs_data.js
- .normalize
- main.js
- test_playwright.js
- test_vision_rules.js
- test_3_screens_flow.spec.js
- test_interactive_lesson_flow.spec.js
- verify_exam_arena_flow.js
- verify_exam_arena_no_video.js
- avatar-3d.js
- signs-data.js
- trajectory-tracker.js
- video-player.js
- hands_solution_wasm_bin.js
- control_utils.js
- assert
- assert
- add
- os
- throwBindingError
- has
- camera_utils.js
- readLatin1String
- replace
- clone
- decl
- remove
- hands.js
- abort
- subprocess
- throwBindingError
- attachFinalizer
- push
- _t
- 4. Prompts Detallados para Copiar y Pegar
- stringify
- warnOnce
- warnOnce
- Q
- E
- abort
- createWasm
- confetti.browser.min.js
- b
- checkStackCookie
- checkStackCookie
- _strftime
- ExceptionInfo
- _strftime
- ExceptionInfo
- error
- b
- generate_videos.py
- LSCHandler
- 4. Especificación Técnica de las 5 Nuevas Señas
- test_checkpoints_unit.js
- __embind_register_std_string
- v
- hx
- stringToUTF8
- V
- ta
- 🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC)
- f
- emscriptenWebGLGetTexPixelData
- emscriptenWebGLGetTexPixelData
- Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video
- 🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol"
- Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)
- drawing_utils.js
- verify_videos.py
- Review Focus
- Review Focus
- runWithFS
- Nomenclatura Requerida
- vb
- emval_get_global
- emval_get_global
- Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)
- Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`
- _glGetUniformLocation
- SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md
- Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

## God Nodes (most connected - your core abstractions)
1. `push()` - 69 edges
2. `assert()` - 68 edges
3. `assert()` - 68 edges
4. `add()` - 64 edges
5. `LessonSessionController` - 49 edges
6. `replace()` - 49 edges
7. `remove()` - 42 edges
8. `has()` - 40 edges
9. `BlindExamController` - 38 edges
10. `get()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `1. Resumen Ejecutivo` --references--> `LessonSessionController`  [INFERRED]
  .superpowers/sdd/2026-11-06-interactive-lesson-quiz/task-1-report.md → app/js/lesson-session.js
- `1. Contexto e Intención` --references--> `V()`  [INFERRED]
  docs/superpowers/specs/2026-11-02-expansion-5-senas-design.md → app/lib/mediapipe/hands/hands.js
- `4. Arquitectura de Componentes y Módulos (POO)` --references--> `LSCHandler`  [INFERRED]
  docs/superpowers/specs/2026-11-05-exis-learning-platform-design.md → server.py
- `EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-3-screens-duolingo-flow-plan.md → app/js/auth-profile-manager.js
- `Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`)` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-learning-platform-plan.md → app/js/auth-profile-manager.js

## Import Cycles
- None detected.

## Communities (113 total, 20 thin omitted)

### Community 0 - "cv2"
Cohesion: 0.16
Nodes (22): extract_trimmed_frames(), main(), save_mp4(), save_webp(), cv2_imread(), cv2_imwrite(), interpolate_sequence(), load_keyframes() (+14 more)

### Community 2 - ".parse"
Cohesion: 0.06
Nodes (5): LSCNaturalLanguageParser, LSCParsedIntent, LSCTutorService, TestLiveChatAPI, TestLSCNaturalLanguageParser

### Community 3 - "server.py"
Cohesion: 0.08
Nodes (10): euler_to_quaternion(), quaternion_slerp(), verify_clips_json(), build_pedagogical_plan(), detect_sign(), ensure_ollama_service(), free_port(), load_users_db() (+2 more)

### Community 4 - "test_blind_exam_arena_unit.js"
Cohesion: 0.12
Nodes (17): assert, BlindExamController, createMockElement(), fs, gesturePane, getMock(), mockElements, modal (+9 more)

### Community 8 - "CameraDeviceManager"
Cohesion: 0.09
Nodes (13): 1. Identidad y Misión del Proyecto, 2. Reglas Duras de Desarrollo (Hard Rules), 3. Especificación de Hardware y Optimización, 4. Protocolo de Colaboración en Pareja (Evitar Choques), 5. Estructura de Directorios, AGENTS.md — Reglas y Contexto Técnico para Agentes de IA (Proyecto EXIS), Comandos de Instalación para el Agente / Terminal (Windows):, graphify (+5 more)

### Community 10 - "AuthProfileManager"
Cohesion: 0.14
Nodes (9): AuthProfileManager, EXIS Learning Platform, AI Paths & Blind Exam Mode Implementation Plan, Global Constraints, Mapa de Archivos a Crear y Modificar, Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`), Task 3: Clase POO `LearningPlanManager` y Mapa Hexagonal (`app/js/learning-plan-manager.js`), Task 4: Clase POO `BlindExamController` — Modo Examen Sin Video (`app/js/blind-exam-controller.js`), Task 5: Integración UI Híbrida en `app/index.html`, Estilos en `app/css/styles.css` y Orquestación en `app/js/main.js` (+1 more)

### Community 11 - "playwright"
Cohesion: 0.10
Nodes (9): devDependencies, playwright, playwright, { chromium }, { chromium }, { chromium }, { chromium }, { chromium } (+1 more)

### Community 12 - "ViewRouter"
Cohesion: 0.10
Nodes (7): LandingPortalController, ViewRouter, EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan, Global Constraints (`AGENTS.md` + `impeccable` + Emil Kowalski), Task 1: Landing Page Futurista y Portal Auth (`app/landing.html`, `app/css/landing.css`, `app/js/landing.js`), Task 2: Separación en 2 Vistas de Pantalla Completa dentro de `app/index.html` (`ViewRouter` + Mapa Estilo Duolingo vs Cabina de Práctica), Task 3: Verificación E2E de las 3 Pantallas con Playwright y Actualización de Graphify

### Community 13 - "test_mascot_gallery.spec.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 14 - "hands_solution_simd_wasm_bin.js"
Cohesion: 0.02
Nodes (58): alignMemory(), convertI32PairToI53(), convertI32PairToI53Checked(), doCallback(), done(), doReadv(), doWritev(), _emscripten_get_heap_max() (+50 more)

### Community 15 - "ref_path"
Cohesion: 0.09
Nodes (14): { chromium }, fs, path, { chromium }, fs, path, { chromium }, fs (+6 more)

### Community 17 - "ref_assert"
Cohesion: 0.15
Nodes (8): assert, { chromium }, assert, { chromium }, assert, { chromium }, assert, { chromium }

### Community 18 - "test_lesson_session_unit.js"
Cohesion: 0.17
Nodes (9): assert, documentMock, fs, lessonCode, lessonSessionPath, mockElements, path, signsDataCode (+1 more)

### Community 19 - "tailwind.js"
Cohesion: 0.02
Nodes (104): aa(), ac(), Ak(), applyVariantOffset(), Ba(), bd(), bk(), blueGray() (+96 more)

### Community 22 - "check_console.js"
Cohesion: 0.20
Nodes (4): http, { spawn }, assert, http

### Community 23 - "cdp_verify.py"
Cohesion: 0.18
Nodes (8): recv_cdp_msg(), send_cdp(), download_file(), main(), setup_canvas_confetti(), setup_fonts(), setup_mediapipe(), setup_tailwind()

### Community 26 - "test_auth_split_flow.spec.js"
Cohesion: 0.25
Nodes (5): assert, { chromium }, fs, path, shots

### Community 27 - "test_signs_data.js"
Cohesion: 0.25
Nodes (7): code, fs, path, requiredLetters, requiredWords, signsDataPath, window

### Community 28 - ".normalize"
Cohesion: 0.33
Nodes (3): ChatTutor, cases, LSCClientNLU

### Community 29 - "main.js"
Cohesion: 0.62
Nodes (6): bindUIEvents(), dismissSuccessModal(), explainSignVoice(), renderSignButtons(), selectSign(), switchCategory()

### Community 30 - "test_playwright.js"
Cohesion: 0.33
Nodes (4): { chromium }, fs, path, runTests()

### Community 31 - "test_vision_rules.js"
Cohesion: 0.33
Nodes (5): code, fs, missing, path, requiredBranches

### Community 32 - "test_3_screens_flow.spec.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 33 - "test_interactive_lesson_flow.spec.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 34 - "verify_exam_arena_flow.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 35 - "verify_exam_arena_no_video.js"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 43 - "hands_solution_wasm_bin.js"
Cohesion: 0.02
Nodes (45): alignMemory(), convertI32PairToI53Checked(), doReadv(), doWritev(), _environ_get(), _environ_sizes_get(), _fd_read(), _fd_seek() (+37 more)

### Community 44 - "control_utils.js"
Cohesion: 0.06
Nodes (52): aa(), b(), ba(), c(), c(), Ca(), D(), da() (+44 more)

### Community 45 - "assert"
Cohesion: 0.04
Nodes (92): addRunDependency(), assert(), asyncLoad(), convertI32PairToI53(), createExportWrapper(), doCallback(), done(), dynCall() (+84 more)

### Community 46 - "assert"
Cohesion: 0.04
Nodes (85): assert(), createExportWrapper(), dynCall(), dynCallLegacy(), makeDynCaller(), _emscripten_webgl_init_context_attributes(), _emscripten_webgpu_export_bind_group_layout(), _emscripten_webgpu_export_device() (+77 more)

### Community 47 - "add"
Cohesion: 0.06
Nodes (61): add(), l(), o(), already(), au(), B(), Bh(), br() (+53 more)

### Community 48 - "os"
Cohesion: 0.07
Nodes (7): curate_sign(), main(), process_buenos(), process_c(), process_hola(), cleanup_temp_files(), process_video()

### Community 49 - "throwBindingError"
Cohesion: 0.09
Nodes (49): constNoSmartPtrRawPointerToWireType(), craftInvokerFunction(), onDone(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+41 more)

### Community 50 - "has"
Cohesion: 0.06
Nodes (51): b2(), ca(), Cl(), cs(), d2(), DC(), delete(), _deleteIfExpired() (+43 more)

### Community 51 - "camera_utils.js"
Cohesion: 0.11
Nodes (18): b(), C(), D(), e(), H(), I(), J(), b() (+10 more)

### Community 52 - "readLatin1String"
Cohesion: 0.09
Nodes (44): craftInvokerFunction(), onDone(), createNamedFunction(), __embind_finalize_value_object(), __embind_register_bool(), __embind_register_class(), __embind_register_class_class_function(), unboundTypesHandler() (+36 more)

### Community 53 - "replace"
Cohesion: 0.06
Nodes (45): addToError(), Cc(), constructor(), createTokenizer(), da(), group(), isStretch(), Jn() (+37 more)

### Community 54 - "clone"
Cohesion: 0.10
Nodes (43): _a(), applyParallelOffset(), as(), clone(), cloneAfter(), $d(), dr(), each() (+35 more)

### Community 55 - "decl"
Cohesion: 0.07
Nodes (44): An(), atrule(), beforeAfter(), block(), body(), calcBefore(), cleanBrackets(), comment() (+36 more)

### Community 56 - "remove"
Cohesion: 0.08
Nodes (41): _2(), Ae(), before(), check(), cy(), Dl(), dy(), E2() (+33 more)

### Community 57 - "hands.js"
Cohesion: 0.10
Nodes (24): bc(), cc(), Fa(), Ga(), gc(), Ha(), hb(), ib() (+16 more)

### Community 58 - "abort"
Cohesion: 0.07
Nodes (37): abort(), addOnInit(), addRunDependency(), ___assert_fail(), asyncLoad(), checkIncomingModuleAPI(), convertFrameToPC(), createWasm() (+29 more)

### Community 59 - "subprocess"
Cohesion: 0.06
Nodes (5): test_pose(), test_hand_shape(), capture(), test_pose(), check_viewport()

### Community 60 - "throwBindingError"
Cohesion: 0.09
Nodes (33): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), constNoSmartPtrRawPointerToWireType(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+25 more)

### Community 61 - "attachFinalizer"
Cohesion: 0.08
Nodes (29): attachFinalizer(), ClassHandle_clone(), ClassHandle_delete(), ClassHandle_deleteLater(), createNamedFunction(), detachFinalizer(), downcastPointer(), __embind_create_inheriting_constructor() (+21 more)

### Community 62 - "push"
Cohesion: 0.11
Nodes (28): after(), Ah(), append(), BC(), c2(), cloneDiv(), Co(), colorStops() (+20 more)

### Community 63 - "_t"
Cohesion: 0.11
Nodes (26): ax(), Bf(), clear(), ea(), every(), jf(), Ks(), lx() (+18 more)

### Community 64 - "4. Prompts Detallados para Copiar y Pegar"
Cohesion: 0.07
Nodes (26): 01. Seña: HOLA (Saludo Oficial LSC70), 02. Seña: YO (Pronombre Primera Persona), 03. Seña: BUENOS / BUENAS (Cortesía - LSC70), 04. Seña: DÍAS (Tiempo / Amanecer), 05. Seña: NOCHES (Tiempo / Anochecer), 06. Seña: NOMBRE (Identificación), 07. Dactilología: Letra A, 08. Dactilología: Letra B (+18 more)

### Community 65 - "stringify"
Cohesion: 0.13
Nodes (25): async(), catch(), content(), css(), dp(), finally(), getAsyncError(), getIterator() (+17 more)

### Community 66 - "warnOnce"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 67 - "warnOnce"
Cohesion: 0.10
Nodes (22): checkUnflushedContent(), demangle(), demangleAll(), _emscripten_webgl_do_create_context(), emscriptenWebGLGet(), exitJS(), ExitStatus(), findCanvasEventTarget() (+14 more)

### Community 68 - "Q"
Cohesion: 0.18
Nodes (15): ac(), Eb(), fc(), lb(), mb(), nb(), P(), pb() (+7 more)

### Community 69 - "E"
Cohesion: 0.25
Nodes (16): A(), aa(), cd(), E(), ea(), ed(), fd(), gd() (+8 more)

### Community 70 - "abort"
Cohesion: 0.12
Nodes (19): abort(), ___assert_fail(), checkIncomingModuleAPI(), convertFrameToPC(), __dlopen_js(), __dlsym_js(), _emscripten_asm_const_int(), _emscripten_pc_get_function() (+11 more)

### Community 71 - "createWasm"
Cohesion: 0.14
Nodes (19): addOnInit(), createWasm(), instantiateArrayBuffer(), instantiateAsync(), receiveInstance(), receiveInstantiationResult(), _emscripten_get_heap_max(), emscripten_realloc_buffer() (+11 more)

### Community 72 - "confetti.browser.min.js"
Cohesion: 0.21
Nodes (16): A(), b(), b(), M(), p(), c(), c(), e() (+8 more)

### Community 73 - "b"
Cohesion: 0.22
Nodes (6): G(), p(), b(), Cb(), M(), r()

### Community 74 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 75 - "checkStackCookie"
Cohesion: 0.14
Nodes (18): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), callUserCallback(), checkStackCookie(), _emscripten_set_main_loop_timing(), handleException(), initRuntime() (+10 more)

### Community 76 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 78 - "_strftime"
Cohesion: 0.15
Nodes (16): __addDays(), __arraySum(), __gmtime_js(), __isLeapYear(), __localtime_js(), __mktime_js(), readI53FromI64(), _strftime() (+8 more)

### Community 80 - "error"
Cohesion: 0.13
Nodes (17): ao(), error(), fromOffset(), jC(), NC(), OA(), Once(), origin() (+9 more)

### Community 81 - "b"
Cohesion: 0.18
Nodes (16): ab(), D(), dc(), dd(), c(), lc(), oc(), uc() (+8 more)

### Community 82 - "generate_videos.py"
Cohesion: 0.18
Nodes (7): build_smooth_loop(), interpolate_pair(), main(), process_sign(), read_image_safe(), save_animated_webp(), save_mp4()

### Community 83 - "LSCHandler"
Cohesion: 0.17
Nodes (3): Task 1: Endpoints Backend de Planes IA (`/api/plan`) y Perfiles (`/api/users`) en `server.py`, LSCHandler, RangeFileWrapper

### Community 84 - "4. Especificación Técnica de las 5 Nuevas Señas"
Cohesion: 0.12
Nodes (15): 1. AÑOS (`ANNOS`) — Palabra, 1. Contexto e Intención, 2. LICOR (`LICOR`) — Palabra, 2. Metas y No-Metas, 3. Enfoques Considerados y Selección, 3. Letra D (`D`) — Letra Dactilológica, 4. Especificación Técnica de las 5 Nuevas Señas, 4. Letra E (`E`) — Letra Dactilológica (+7 more)

### Community 85 - "test_checkpoints_unit.js"
Cohesion: 0.13
Nodes (11): assert, BlindExamController, counterEl, cp1Config, demoVideo, elements, fs, fullPlanConfig (+3 more)

### Community 86 - "__embind_register_std_string"
Cohesion: 0.17
Nodes (11): allocateUTF8(), __embind_register_std_string(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8() (+3 more)

### Community 87 - "v"
Cohesion: 0.14
Nodes (15): arbitraryProperty(), cr(), create(), Eh(), forVariant(), negative(), $o(), Oh() (+7 more)

### Community 88 - "hx"
Cohesion: 0.18
Nodes (15): cx(), dx(), ec(), fx(), gx(), Hs(), hx(), jr() (+7 more)

### Community 89 - "stringToUTF8"
Cohesion: 0.18
Nodes (10): allocateUTF8(), _glGetShaderInfoLog(), _glGetString(), intArrayFromString(), LazyUint8Array(), lengthBytesUTF8(), stringToNewUTF8(), stringToUTF8() (+2 more)

### Community 90 - "V"
Cohesion: 0.17
Nodes (12): U(), V(), Análisis de Agentes Necesarios, Plan de Implementación: Sistema de Puntos y Trayectorias de Movimiento LSC (Connect-the-Dots), Restricciones Globales (Hard Rules), Tarea 1: Modelado de Datos de Trayectorias en `signs-data.js`, Tarea 2: Creación del Motor `app/js/trajectory-tracker.js`, Tarea 3: Integración en `vision-evaluator.js` y Evaluación Concurrente (+4 more)

### Community 91 - "ta"
Cohesion: 0.29
Nodes (8): oa(), pa(), qa(), ra(), sa(), ta(), ua(), va()

### Community 92 - "🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC)"
Cohesion: 0.17
Nodes (11): 1. Instalar Git y GitHub Desktop, 2. Instalar Ollama (Tutor de IA Local), 3. Instalar Python (3.10 o superior), 4. Clonar el Repositorio y Puesta en Marcha, 🌟 Características Principales, 📄 Créditos y Licencia, Descargar el modelo del tutor (`qwen2.5:3b`):, 🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC) (+3 more)

### Community 93 - "f"
Cohesion: 0.24
Nodes (7): f(), c(), hc(), wc(), xc(), yc(), zc()

### Community 94 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 95 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.36
Nodes (9): __colorChannelsInGlTextureFormat(), computeUnpackAlignedImageSize(), emscriptenWebGLGetTexPixelData(), _glReadPixels(), _glTexImage2D(), _glTexSubImage2D(), _glTexSubImage3D(), heapAccessShiftForWebGLHeap() (+1 more)

### Community 96 - "Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video"
Cohesion: 0.20
Nodes (9): 1. Intención y Propósito (The Why), 2. Metas, No-Metas y Anti-Metas, 3. Enfoques Evaluados (Approaches), 4. Arquitectura de Componentes y Módulos (POO), 5. Directrices de Calidad Visual y Pruebas (`impeccable` + `Emil Kowalski` + `Playwright`), Anti-Metas (Anti-Goals — Qué haría fallar el diseño aunque funcione), Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video, Metas (Goals) (+1 more)

### Community 97 - "🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol""
Cohesion: 0.20
Nodes (9): 1. Concepto e Identidad, 2. Anatomía y Silueta Diseñada para Lengua de Señas (LSC), 3. Paleta Cromática Oficial (Color Swatches), 4. Vistas Obligatorias en la Hoja de Referencia (Model Sheet), 5. Cómo Usar esta Hoja como Referencia en Gemini / Kling / Runway, A. Rostro y Cabeza (Componente No Manual), B. Manos y Muñecas (Componente Manual), C. Torso y Contraste de Ropa (+1 more)

### Community 98 - "Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)"
Cohesion: 0.20
Nodes (9): 1. Resumen Ejecutivo, 2. Cumplimiento de Reglas Duras (AGENTS.md), 3. Arquitectura y Lógica Implementada, 4. Resultados de Pruebas Unitarias (`node tests/test_lesson_session_unit.js`), 5. Archivos Afectados, A. Estado Privado Encapsulado (`#`), B. Generador de Opciones sin Duplicados, C. Fases Pedagógicas (+1 more)

### Community 100 - "verify_videos.py"
Cohesion: 0.33
Nodes (4): check_mp4_video(), check_webp_anim(), main(), test_media_assets()

### Community 101 - "Review Focus"
Cohesion: 0.22
Nodes (8): Expansión de 5 Nuevas Señas LSC (AÑOS, LICOR, D, E, U) Implementation Plan, Global Constraints, Review Focus, Task 1: Generación y Verificación de Videos y Muestras Multimedia (`app/tools/generate_batch_5_signs.py`), Task 2: Actualización del Catálogo Oficial (`app/js/signs-data.js`), Task 3: Implementación de Reglas de Evaluación MediaPipe (`app/js/vision-evaluator.js`), Task 4: Documentación de Prompts Oficiales Anime IA (`referencias_para_gemini/PROMPTS_GEMINI.md`), Task 5: Verificación Integral del Sistema en Servidor Local

### Community 102 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Sistema de Lección Interactiva Tipo Test y Práctica con Cámara (Plan de Implementación), Task 1: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`), Task 2: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`), Task 3: Estructura HTML del Contenedor de Lección en `app/index.html`, Task 4: Integración con la Ruta Duolingo (`app/js/learning-plan-manager.js` y `app/js/main.js`), Task 5: Pruebas E2E Automatizadas con Playwright y Verificación

### Community 103 - "runWithFS"
Cohesion: 0.33
Nodes (3): runWithFS(), assert(), processPackageData()

### Community 104 - "Nomenclatura Requerida"
Cohesion: 0.33
Nodes (5): Integración con la Aplicación Web, Letras:, Nomenclatura Requerida, Palabras:, Videos Anime IA — Proyecto EXIS

### Community 105 - "vb"
Cohesion: 0.70
Nodes (5): L(), ob(), ub(), vb(), Ya()

### Community 106 - "emval_get_global"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 107 - "emval_get_global"
Cohesion: 0.40
Nodes (4): __emval_call_void_method(), emval_get_global(), __emval_new_cstring(), getStringOrSymbol()

### Community 108 - "Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)"
Cohesion: 0.40
Nodes (4): Lógica y Fases de la Lección, Pruebas, Reglas Obligatorias (AGENTS.md), Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)

### Community 109 - "Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`"
Cohesion: 0.40
Nodes (4): Estructura Semántica Requerida, Objetivo, Restricciones Duras, Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`

### Community 110 - "_glGetUniformLocation"
Cohesion: 0.67
Nodes (4): _glGetUniformLocation(), jstoi_q(), webglGetLeftBracePos(), webglPrepareUniformLocationsBeforeFirstUse()

### Community 111 - "SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md"
Cohesion: 0.50
Nodes (3): Pre-flight Checklist, SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md, Tasks Status

### Community 112 - "Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)"
Cohesion: 0.50
Nodes (3): Objetivo, Requisitos de Diseño, Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

## Knowledge Gaps
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `f` to `hands_solution_wasm_bin.js`, `control_utils.js`, `hands_solution_simd_wasm_bin.js`, `add`, `b`, `camera_utils.js`, `hands.js`?**
  _High betweenness centrality (0.388) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `add()` (e.g. with `n()` and `i()`) actually correct?**
  _`add()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `LessonSessionController` be split into smaller, more focused modules?**
  _Cohesion score 0.1147086031452359 - nodes in this community are weakly interconnected._
- **Why does `BlindExamController` connect `BlindExamController` to `Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video`, `AuthProfileManager`, `ViewRouter`, `test_checkpoints_unit.js`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Should `.parse` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `B()` connect `add` to `tailwind.js`, `clone`, `remove`, `f`, `push`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Should `server.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0846774193548387 - nodes in this community are weakly interconnected._