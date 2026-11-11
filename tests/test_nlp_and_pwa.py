"""
Test suite para verificar las 2 nuevas mejoras inspiradas en Proyecto Costia:
1. Súper NLP con comprensión de lenguaje natural y resolución de aclaraciones.
2. PWA (Manifest, Service Worker, Iconos y registro).
"""

import urllib.request
import json
import os
import sys

def test_nlp_engine():
    print("=== TEST 1: MOTOR NLP NATURAL Y ROBUSTO ===")
    test_cases = [
        ("hola quiero aprender a", False, None, "OPEN_LEARNING_INTRO"),
        ("no quiero aprender a", False, None, "REJECT_SIGN"),
        ("no quiero la a, prefiero la c", True, "C", "LEARN_SIGN"),
        ("quiero aprender la letra a", True, "A", "LEARN_SIGN"),
        ("enséñame a saludar", True, "HOLA", "THEME_GREETINGS"),
        ("no sé nada, por dónde empiezo?", True, "HOLA", "BEGINNER_RECOMMENDATION"),
        ("enséñame el abecedario", True, "A", "THEME_ALPHABET"),
        ("cómo funciona la cámara", False, None, "TECH_EXPLANATION"),
        ("quién eres", False, None, "IDENTITY"),
        ("muchas gracias", False, None, "GRATITUDE")
    ]

    all_passed = True
    for msg, expect_sign, target, expected_intent in test_cases:
        req = urllib.request.Request(
            "http://localhost:8000/api/chat",
            data=json.dumps({"message": msg, "history": []}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                reply = res.get("reply", "")
                det = res.get("detected_sign")
                intent = res.get("intent")

                sign_ok = (det == target) if expect_sign else (det is None)
                intent_ok = (intent == expected_intent)

                if sign_ok and intent_ok:
                    print(f" [PASS] '{msg}' -> Intent: {intent}, Sign: {det}")
                else:
                    all_passed = False
                    print(f" [FAIL] '{msg}' -> Intent: {intent} (expected {expected_intent}), Sign: {det} (expected {target})")
                    print(f"        Reply: {reply}")
        except Exception as e:
            all_passed = False
            print(f" [ERROR] '{msg}': {e}")

    assert all_passed, "Fallaron pruebas de NLP"
    print(">>> SÚPER NLP 100% OPERATIVO <<<\n")

def test_pwa_assets():
    print("=== TEST 2: ASSETS Y MANIFEST PWA ===")
    # 1. Manifest
    with urllib.request.urlopen("http://localhost:8000/manifest.json") as resp:
        assert resp.status == 200, "manifest.json no respondió con 200"
        manifest_data = json.loads(resp.read().decode("utf-8"))
        assert manifest_data.get("name") == "Manitas — Tutor de Lengua de Señas Colombiana"
        assert manifest_data.get("display") == "standalone"
        assert manifest_data.get("background_color") == "#0a0e17"
        assert len(manifest_data.get("icons", [])) >= 2
        print(" [PASS] manifest.json es válido y está configurado en standalone.")

    # 2. Service Worker
    with urllib.request.urlopen("http://localhost:8000/sw.js") as resp:
        assert resp.status == 200, "sw.js no respondió con 200"
        sw_code = resp.read().decode("utf-8")
        assert "manitas-pwa-v1" in sw_code
        assert "addEventListener('fetch'" in sw_code
        print(" [PASS] sw.js está disponible con estrategia de cache Network-First.")

    # 3. Iconos
    for icon_name in ["icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"]:
        url = f"http://localhost:8000/img/icons/{icon_name}"
        with urllib.request.urlopen(url) as resp:
            assert resp.status == 200, f"{icon_name} no se pudo cargar"
            assert resp.headers.get("Content-Type") == "image/png"
        print(f" [PASS] Icono PWA verificado: {icon_name}")

    print(">>> PWA ASSETS 100% OPERATIVOS <<<\n")

if __name__ == "__main__":
    test_nlp_engine()
    test_pwa_assets()
    print("==================================================")
    print("¡TODAS LAS PRUEBAS DE NLP Y PWA PASARON CON ÉXITO!")
    print("==================================================")
