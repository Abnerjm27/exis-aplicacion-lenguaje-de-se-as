# Integración ECC (Everything Claude Code) · Proyecto Manitas (EXIS)

Este documento define la interacción entre los 71 subagentes y 314 skills del plugin **ECC** y las **9 Reglas Duras** del proyecto Manitas (EXIS).

---

## 1. Mapeo de Subagentes ECC al Stack de Manitas

| Subagente ECC | Dominio en Manitas | Tareas Principales |
| :--- | :--- | :--- |
| `ecc:tdd-guide` | Pruebas Automatizadas | Guiar implementación Red-Green-Refactor ejecutando `npm test`. |
| `ecc:e2e-runner` | Playwright E2E | Correr y validar journeys de usuario en `tests/test_playwright.js`. |
| `ecc:python-reviewer` | Backend Python | Revisión de `server.py` y herramientas: PEP 8, POO, proxies Ollama. |
| `ecc:code-reviewer` | Frontend JavaScript | Revisión de módulos ES6+ en `app/js/` garantizando POO y encapsulación. |
| `ecc:security-reviewer` | Seguridad | Auditar endpoints locales de `server.py` (puerto 8000) y proxy `/api/chat`. |
| `ecc:a11y-architect` | Accesibilidad WCAG AAA | Auditar contraste oscuro/ámbar (`#0a0e17` / `#f59e0b`), targets $\ge 44\text{px}$. |
| `ecc:planner` | Planificación | Desglosar épicas, nuevas señas y flujos pedagógicos antes de codificar. |
| `ecc:performance-optimizer` | Rendimiento | Optimizar MediaPipe Hands (30 fps), decodificación WebP/MP4 y VRAM. |

---

## 2. Pautas de Armonización ECC + Reglas Duras EXIS

1. **POO y Encapsulación (Regla 8) vs Inmutabilidad Funcional:**  
   En el frontend (`app/js/`), se exige Programación Orientada a Objetos en clases ES6. La inmutabilidad de ECC se aplica a estructuras de catálogo (`SIGNS_DATA`), pero los componentes de control gestionan su estado protegido mediante `#` o `_` y ciclos de vida uniformes (`init()`, `start()`, `update()`, `reset()`, `destroy()`).
2. **Cero CSS/JS Embebido (Regla 2):**  
   Ningún agente ECC debe insertar etiquetas `<style>` ni scripts inline en `app/index.html`.
3. **Límite de Líneas (Regla 1):**  
   Ningún archivo generado o modificado debe superar las 1,100 líneas. Si se aproxima, subdividir en submódulos cohesivos.
4. **Navegación con Graphify (Regla 9):**  
   Antes de exploraciones masivas o grep indiscriminado, consultar `graphify-out/graph.json` para proteger los *God Nodes*.
5. **Comandos de Verificación:**  
   Antes de dar por terminada una tarea, el agente debe ejecutar `npm test` para asegurar que las pruebas unitarias y de assets multimedia permanezcan en verde.
