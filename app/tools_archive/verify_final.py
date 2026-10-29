import os, urllib.request, re

files = [
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\server.py",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\index.html",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\css\styles.css",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\js\avatar-3d.js",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\js\vision-evaluator.js",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\js\signs-data.js",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\js\chat-tutor.js",
    r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\js\main.js"
]

print("=== LINE COUNT CHECK (< 1100 lines) ===")
for f in files:
    with open(f, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    status = "PASS (< 1100)" if len(lines) < 1100 else "FAIL"
    print(f"{os.path.basename(f):25}: {len(lines):4} lines -> {status}")

print("\n=== EMBEDDED CSS / JS CHECK in index.html ===")
with open(r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\index.html", "r", encoding="utf-8") as fp:
    html = fp.read()
inline_styles = re.findall(r"<style[^>]*>", html, re.IGNORECASE)
inline_scripts = re.findall(r"<script(?![^>]*src=)[^>]*>", html, re.IGNORECASE)
print("Inline <style> tags:", len(inline_styles), "-> PASS" if len(inline_styles) == 0 else "FAIL")
print("Inline <script> tags without src:", len(inline_scripts), "-> PASS" if len(inline_scripts) == 0 else "FAIL")

print("\n=== HTTP ENDPOINTS CHECK ===")
try:
    with urllib.request.urlopen("http://localhost:8000/") as resp:
        print("GET /             -> Status:", resp.status)
    with urllib.request.urlopen("http://localhost:8000/favicon.ico") as resp:
        content = resp.read()
        print("GET /favicon.ico  -> Status:", resp.status, f"({len(content)} bytes)")
except Exception as e:
    print("Request error:", e)
