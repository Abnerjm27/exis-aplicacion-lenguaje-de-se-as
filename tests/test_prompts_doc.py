import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPTS_PATH = os.path.join(BASE_DIR, "referencias_para_gemini", "PROMPTS_GEMINI.md")

with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

required_sections = [
    "ANNOS",
    "LICOR",
    "Seña: D",
    "Seña: E",
    "Seña: U"
]

missing = [s for s in required_sections if s not in content]
if missing:
    print(f"FAIL: Missing sections in PROMPTS_GEMINI.md: {missing}")
    sys.exit(1)
else:
    print("PASSED: All 5 prompt sections present in PROMPTS_GEMINI.md")
