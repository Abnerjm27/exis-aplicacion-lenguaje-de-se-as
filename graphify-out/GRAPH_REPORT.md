# Graph Report - exis aplicacion lenguaje de señas  (2026-11-06)

## Corpus Check
- 109 files · ~1,099,801 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .woff2 16, .css 6, .glb 4)

## Summary
- 860 nodes · 1439 edges · 55 communities (38 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b939fc02`
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
- .parse
- Dictionary Schema Tests
- ViewRouter
- End-to-End Browser Tests
- Console Error Audit
- server.py
- trajectory-tracker.js
- Letter I Animation Test
- Letter O Animation Test
- Package & Dependency Specs
- Offline PWA & Cache Tests
- Chat Tutor & Ollama Client
- avatar-3d.js
- 4. Prompts Detallados para Copiar y Pegar
- 4. Especificación Técnica de las 5 Nuevas Señas
- video-player.js
- .normalize
- main.js
- ref_path
- test_vision_rules.js
- test_3_screens_flow.spec.js
- test_interactive_lesson_flow.spec.js
- verify_exam_arena_no_video.js
- avatar-3d.js
- signs-data.js
- trajectory-tracker.js
- video-player.js
- sw.js
- tailwind-config.js
- update_index_mascot.py
- 🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC)
- Tareas de Implementación
- Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video
- 🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol"
- Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)
- AnimeCurator
- Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`
- SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md
- Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)
- signs-data.js
- video-player.js
- sw.js

## God Nodes (most connected - your core abstractions)
1. `LessonSessionController` - 49 edges
2. `BlindExamController` - 38 edges
3. `LearningPlanManager` - 34 edges
4. `AuthProfileManager` - 31 edges
5. `playwright` - 29 edges
6. `AuthService` - 23 edges
7. `CameraDeviceManager` - 23 edges
8. `4. Prompts Detallados para Copiar y Pegar` - 21 edges
9. `ViewRouter` - 17 edges
10. `LandingPortalController` - 15 edges

## Surprising Connections (you probably didn't know these)
- `1. Resumen Ejecutivo` --references--> `LessonSessionController`  [INFERRED]
  .superpowers/sdd/2026-11-06-interactive-lesson-quiz/task-1-report.md → app/js/lesson-session.js
- `4. Arquitectura de Componentes y Módulos (POO)` --references--> `LSCHandler`  [INFERRED]
  docs/superpowers/specs/2026-11-05-exis-learning-platform-design.md → server.py
- `EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-3-screens-duolingo-flow-plan.md → app/js/auth-profile-manager.js
- `Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`)` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/plans/2026-11-05-exis-learning-platform-plan.md → app/js/auth-profile-manager.js
- `3. Enfoques Evaluados (Approaches)` --references--> `AuthProfileManager`  [INFERRED]
  docs/superpowers/specs/2026-11-05-exis-learning-platform-design.md → app/js/auth-profile-manager.js

## Import Cycles
- None detected.

## Communities (55 total, 17 thin omitted)

### Community 0 - "MoCap & Landmark Extraction"
Cohesion: 0.06
Nodes (40): curate_sign(), main(), extract_trimmed_frames(), main(), save_mp4(), save_webp(), cv2_imread(), cv2_imwrite() (+32 more)

### Community 2 - "Gesture Trimming & Processing"
Cohesion: 0.11
Nodes (15): AuthProfileManager, EXIS Learning Platform, AI Paths & Blind Exam Mode Implementation Plan, Global Constraints, Mapa de Archivos a Crear y Modificar, Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`), Task 3: Clase POO `LearningPlanManager` y Mapa Hexagonal (`app/js/learning-plan-manager.js`), Task 4: Clase POO `BlindExamController` — Modo Examen Sin Video (`app/js/blind-exam-controller.js`), Task 5: Integración UI Híbrida en `app/index.html`, Estilos en `app/css/styles.css` y Orquestación en `app/js/main.js` (+7 more)

### Community 4 - "Backend HTTP & Ollama LSC Server"
Cohesion: 0.09
Nodes (13): 1. Identidad y Misión del Proyecto, 2. Reglas Duras de Desarrollo (Hard Rules), 3. Especificación de Hardware y Optimización, 4. Protocolo de Colaboración en Pareja (Evitar Choques), 5. Estructura de Directorios, AGENTS.md — Reglas y Contexto Técnico para Agentes de IA (Proyecto EXIS), Comandos de Instalación para el Agente / Terminal (Windows):, graphify (+5 more)

### Community 5 - "Optical Flow Video Generator"
Cohesion: 0.12
Nodes (7): LearningPlanManager, Global Constraints, Sistema de Lección Interactiva Tipo Test y Práctica con Cámara (Plan de Implementación), Lógica y Fases de la Lección, Pruebas, Reglas Obligatorias (AGENTS.md), Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)

### Community 6 - "Playwright Catalog Tests"
Cohesion: 0.06
Nodes (28): assert, BlindExamController, createMockElement(), fs, gesturePane, getMock(), mockElements, modal (+20 more)

### Community 7 - "Letter I Video Curator"
Cohesion: 0.10
Nodes (5): euler_to_quaternion(), MoCapExtractor, normalize(), quaternion_slerp(), verify_clips_json()

### Community 8 - "Letter O Video Curator"
Cohesion: 0.07
Nodes (26): 01. Seña: HOLA (Saludo Oficial LSC70), 02. Seña: YO (Pronombre Primera Persona), 03. Seña: BUENOS / BUENAS (Cortesía - LSC70), 04. Seña: DÍAS (Tiempo / Amanecer), 05. Seña: NOCHES (Tiempo / Anochecer), 06. Seña: NOMBRE (Identificación), 07. Dactilología: Letra A, 08. Dactilología: Letra B (+18 more)

### Community 9 - "Multimedia Quality Verifier"
Cohesion: 0.08
Nodes (12): devDependencies, playwright, playwright, { chromium }, { chromium }, { chromium }, { chromium }, { chromium } (+4 more)

### Community 10 - ".parse"
Cohesion: 0.05
Nodes (6): detect_sign(), LSCNaturalLanguageParser, LSCParsedIntent, LSCTutorService, TestLiveChatAPI, TestLSCNaturalLanguageParser

### Community 12 - "ViewRouter"
Cohesion: 0.10
Nodes (7): LandingPortalController, ViewRouter, EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan, Global Constraints (`AGENTS.md` + `impeccable` + Emil Kowalski), Task 1: Landing Page Futurista y Portal Auth (`app/landing.html`, `app/css/landing.css`, `app/js/landing.js`), Task 2: Separación en 2 Vistas de Pantalla Completa dentro de `app/index.html` (`ViewRouter` + Mapa Estilo Duolingo vs Cabina de Práctica), Task 3: Verificación E2E de las 3 Pantallas con Playwright y Actualización de Graphify

### Community 13 - "End-to-End Browser Tests"
Cohesion: 0.09
Nodes (14): assert, { chromium }, assert, { chromium }, assert, { chromium }, assert, { chromium } (+6 more)

### Community 14 - "Console Error Audit"
Cohesion: 0.12
Nodes (15): 1. AÑOS (`ANNOS`) — Palabra, 1. Contexto e Intención, 2. LICOR (`LICOR`) — Palabra, 2. Metas y No-Metas, 3. Enfoques Considerados y Selección, 3. Letra D (`D`) — Letra Dactilológica, 4. Especificación Técnica de las 5 Nuevas Señas, 4. Letra E (`E`) — Letra Dactilológica (+7 more)

### Community 15 - "server.py"
Cohesion: 0.07
Nodes (17): download_file(), main(), setup_canvas_confetti(), setup_fonts(), setup_mediapipe(), setup_tailwind(), Task 1: Endpoints Backend de Planes IA (`/api/plan`) y Perfiles (`/api/users`) en `server.py`, build_pedagogical_plan() (+9 more)

### Community 17 - "Letter I Animation Test"
Cohesion: 0.14
Nodes (9): { chromium }, fs, path, { chromium }, fs, path, { chromium }, fs (+1 more)

### Community 19 - "Package & Dependency Specs"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, lang, name, orientation (+4 more)

### Community 20 - "Offline PWA & Cache Tests"
Cohesion: 0.15
Nodes (12): 1. Instalar Git y GitHub Desktop, 2. Instalar Ollama (Tutor de IA Local), 3. Instalar Python (3.10 o superior), 4. Clonar el Repositorio y Puesta en Marcha, 🌟 Características Principales, 🗂️ Catálogo de Señas Disponibles, 📄 Créditos y Licencia, Descargar el modelo del tutor (`qwen2.5:3b`): (+4 more)

### Community 21 - "Chat Tutor & Ollama Client"
Cohesion: 0.17
Nodes (9): assert, documentMock, fs, lessonCode, lessonSessionPath, mockElements, path, signsDataCode (+1 more)

### Community 27 - "video-player.js"
Cohesion: 0.20
Nodes (4): http, { spawn }, assert, http

### Community 29 - ".normalize"
Cohesion: 0.20
Nodes (9): Análisis de Agentes Necesarios, Plan de Implementación: Sistema de Puntos y Trayectorias de Movimiento LSC (Connect-the-Dots), Restricciones Globales (Hard Rules), Tarea 1: Modelado de Datos de Trayectorias en `signs-data.js`, Tarea 2: Creación del Motor `app/js/trajectory-tracker.js`, Tarea 3: Integración en `vision-evaluator.js` y Evaluación Concurrente, Tarea 4: Actualización de UI y Accesibilidad en `index.html`, `styles.css` y `main.js`, Tarea 5: Verificación Funcional, Responsiva y Cero Errores (+1 more)

### Community 30 - "main.js"
Cohesion: 0.20
Nodes (9): 1. Intención y Propósito (The Why), 2. Metas, No-Metas y Anti-Metas, 3. Enfoques Evaluados (Approaches), 4. Arquitectura de Componentes y Módulos (POO), 5. Directrices de Calidad Visual y Pruebas (`impeccable` + `Emil Kowalski` + `Playwright`), Anti-Metas (Anti-Goals — Qué haría fallar el diseño aunque funcione), Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video, Metas (Goals) (+1 more)

### Community 31 - "ref_path"
Cohesion: 0.20
Nodes (5): { chromium }, fs, path, { chromium }, path

### Community 32 - "test_vision_rules.js"
Cohesion: 0.20
Nodes (9): 1. Concepto e Identidad, 2. Anatomía y Silueta Diseñada para Lengua de Señas (LSC), 3. Paleta Cromática Oficial (Color Swatches), 4. Vistas Obligatorias en la Hoja de Referencia (Model Sheet), 5. Cómo Usar esta Hoja como Referencia en Gemini / Kling / Runway, A. Rostro y Cabeza (Componente No Manual), B. Manos y Muñecas (Componente Manual), C. Torso y Contraste de Ropa (+1 more)

### Community 33 - "test_3_screens_flow.spec.js"
Cohesion: 0.20
Nodes (9): 1. Resumen Ejecutivo, 2. Cumplimiento de Reglas Duras (AGENTS.md), 3. Arquitectura y Lógica Implementada, 4. Resultados de Pruebas Unitarias (`node tests/test_lesson_session_unit.js`), 5. Archivos Afectados, A. Estado Privado Encapsulado (`#`), B. Generador de Opciones sin Duplicados, C. Fases Pedagógicas (+1 more)

### Community 34 - "test_interactive_lesson_flow.spec.js"
Cohesion: 0.22
Nodes (8): Expansión de 5 Nuevas Señas LSC (AÑOS, LICOR, D, E, U) Implementation Plan, Global Constraints, Review Focus, Task 1: Generación y Verificación de Videos y Muestras Multimedia (`app/tools/generate_batch_5_signs.py`), Task 2: Actualización del Catálogo Oficial (`app/js/signs-data.js`), Task 3: Implementación de Reglas de Evaluación MediaPipe (`app/js/vision-evaluator.js`), Task 4: Documentación de Prompts Oficiales Anime IA (`referencias_para_gemini/PROMPTS_GEMINI.md`), Task 5: Verificación Integral del Sistema en Servidor Local

### Community 39 - "signs-data.js"
Cohesion: 0.25
Nodes (5): assert, { chromium }, fs, path, shots

### Community 40 - "trajectory-tracker.js"
Cohesion: 0.25
Nodes (7): code, fs, path, requiredLetters, requiredWords, signsDataPath, window

### Community 41 - "video-player.js"
Cohesion: 0.33
Nodes (3): ChatTutor, cases, LSCClientNLU

### Community 42 - "sw.js"
Cohesion: 0.62
Nodes (6): bindUIEvents(), dismissSuccessModal(), explainSignVoice(), renderSignButtons(), selectSign(), switchCategory()

### Community 43 - "tailwind-config.js"
Cohesion: 0.33
Nodes (4): { chromium }, fs, path, runTests()

### Community 44 - "update_index_mascot.py"
Cohesion: 0.33
Nodes (5): code, fs, missing, path, requiredBranches

### Community 46 - "🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC)"
Cohesion: 0.40
Nodes (4): Estructura Semántica Requerida, Objetivo, Restricciones Duras, Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`

### Community 47 - "Tareas de Implementación"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 48 - "Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 49 - "🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol""
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 50 - "Reporte de Ejecución: Task 1 - Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 51 - "AnimeCurator"
Cohesion: 0.40
Nodes (4): assert, { chromium }, fs, path

### Community 53 - "Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`"
Cohesion: 0.50
Nodes (3): Pre-flight Checklist, SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md, Tasks Status

### Community 54 - "SDD ledger — plan: docs/superpowers/plans/2026-11-06-interactive-lesson-quiz-plan.md"
Cohesion: 0.50
Nodes (3): Objetivo, Requisitos de Diseño, Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mapa de Archivos a Crear y Modificar` connect `Gesture Trimming & Processing` to `Camera Manager & UI Rendering`, `Optical Flow Video Generator`, `server.py`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `LessonSessionController` (e.g. with `Sistema de Lección Interactiva Tipo Test y Práctica con Cámara (Plan de Implementación)` and `Objetivo`) actually correct?**
  _`LessonSessionController` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `MoCap & Landmark Extraction` be split into smaller, more focused modules?**
  _Cohesion score 0.05938375350140056 - nodes in this community are weakly interconnected._
- **Why does `Task 1: Endpoints Backend de Planes IA (`/api/plan`) y Perfiles (`/api/users`) en `server.py`` connect `server.py` to `Gesture Trimming & Processing`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `BlindExamController` (e.g. with `EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan` and `Task 2: Separación en 2 Vistas de Pantalla Completa dentro de `app/index.html` (`ViewRouter` + Mapa Estilo Duolingo vs Cabina de Práctica)`) actually correct?**
  _`BlindExamController` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Anime Video Curation Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.1147086031452359 - nodes in this community are weakly interconnected._
- **Why does `BlindExamController` connect `Camera Manager & UI Rendering` to `Gesture Trimming & Processing`, `ViewRouter`, `Playwright Catalog Tests`, `main.js`?**
  _High betweenness centrality (0.245) - this node is a cross-community bridge._