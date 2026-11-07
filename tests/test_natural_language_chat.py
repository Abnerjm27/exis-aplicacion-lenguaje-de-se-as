"""
Test suite de verificación automatizada para el Motor de Lenguaje Natural (NLU) del Tutor Manitas LSC.
Valida el comportamiento semántico contra las frases reportadas por el usuario y casos límite.
"""
import unittest
import urllib.request
import json
import sys
import os

# Asegurar import de server.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from server import LSCNaturalLanguageParser, LSCTutorService, tutor_service

class TestLSCNaturalLanguageParser(unittest.TestCase):
    def test_greeting_with_letter_request(self):
        """Caso 1: 'hola quiero aprender a' debe identificar la letra A y preámbulo hola, no la seña HOLA."""
        parsed = LSCNaturalLanguageParser.parse("hola quiero aprender a")
        self.assertEqual(parsed.intent, "LEARN_SIGN")
        self.assertEqual(parsed.target_sign, "A")
        self.assertEqual(parsed.greeting_preamble, "hola")
        self.assertFalse(parsed.is_clarification)

    def test_clarification_with_letter_request(self):
        """Caso 2: 'no quiero aprender a' debe identificar la letra A como corrección/aclaración."""
        parsed = LSCNaturalLanguageParser.parse("no quiero aprender a")
        self.assertEqual(parsed.intent, "LEARN_SIGN")
        self.assertEqual(parsed.target_sign, "A")
        self.assertTrue(parsed.is_clarification)

    def test_contrast_rejection(self):
        """Caso 3: 'no quiero la a, prefiero la c' debe seleccionar la seña preferida (C)."""
        parsed = LSCNaturalLanguageParser.parse("no quiero la a, prefiero la c")
        self.assertEqual(parsed.intent, "LEARN_SIGN")
        self.assertEqual(parsed.target_sign, "C")
        self.assertTrue(parsed.is_clarification)

    def test_greeting_with_word_request(self):
        """Caso 4: 'buenas tardes me enseñas licor' debe seleccionar LICOR con preámbulo buenas tardes."""
        parsed = LSCNaturalLanguageParser.parse("buenas tardes me enseñas licor")
        self.assertEqual(parsed.intent, "LEARN_SIGN")
        self.assertEqual(parsed.target_sign, "LICOR")
        self.assertEqual(parsed.greeting_preamble, "buenas tardes")

    def test_pure_greeting(self):
        """Caso 5: 'hola' o 'buenas tardes' sin petición no debe forzar la seña HOLA."""
        parsed_hola = LSCNaturalLanguageParser.parse("hola")
        self.assertEqual(parsed_hola.intent, "GREETING")
        self.assertIsNone(parsed_hola.target_sign)

        parsed_bt = LSCNaturalLanguageParser.parse("buenas tardes")
        self.assertEqual(parsed_bt.intent, "GREETING")
        self.assertIsNone(parsed_bt.target_sign)

    def test_catalog_intent(self):
        """Caso 6: Consultas sobre el catálogo disponible."""
        queries = ["qué señas tienes", "cuáles son las opciones", "muéstrame el menú", "catálogo de palabras"]
        for q in queries:
            parsed = LSCNaturalLanguageParser.parse(q)
            self.assertEqual(parsed.intent, "CATALOG", f"Fallo en: {q}")
            self.assertIsNone(parsed.target_sign)

    def test_identity_intent(self):
        """Caso 7: Preguntas sobre la identidad del tutor."""
        queries = ["quién eres", "cómo te llamas", "qué eres"]
        for q in queries:
            parsed = LSCNaturalLanguageParser.parse(q)
            self.assertEqual(parsed.intent, "IDENTITY", f"Fallo en: {q}")
            self.assertIsNone(parsed.target_sign)

    def test_gratitude_intent(self):
        """Caso 8: Agradecimientos."""
        queries = ["gracias", "muchas gracias", "mil gracias zorrito"]
        for q in queries:
            parsed = LSCNaturalLanguageParser.parse(q)
            self.assertEqual(parsed.intent, "GRATITUDE", f"Fallo en: {q}")

    def test_letters_recognition(self):
        """Caso 9: Reconocimiento preciso de letras del alfabeto dactilológico."""
        letters = [('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D'), ('e', 'E'), ('i', 'I'), ('l', 'L'), ('o', 'O'), ('u', 'U'), ('v', 'V')]
        for char, expected in letters:
            parsed = LSCNaturalLanguageParser.parse(f"quiero aprender la letra {char}")
            self.assertEqual(parsed.target_sign, expected, f"Fallo en letra {char}")

    def test_preposition_a_not_confused_with_letter(self):
        """Caso 10: 'quiero aprender a señar' ('a' seguida de verbo) no debe confundirse con la letra A."""
        parsed = LSCNaturalLanguageParser.parse("yo quiero aprender a señar")
        self.assertNotEqual(parsed.target_sign, "A")
        self.assertNotEqual(parsed.target_sign, "YO")


class TestLiveChatAPI(unittest.TestCase):
    API_URL = "http://localhost:8000/api/chat"

    def _send_chat(self, msg):
        req = urllib.request.Request(
            self.API_URL,
            data=json.dumps({"message": msg}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            self.assertEqual(resp.status, 200)
            return json.loads(resp.read().decode('utf-8'))

    def test_live_hola_quiero_aprender_a(self):
        """Verifica la respuesta en vivo para 'hola quiero aprender a'."""
        data = self._send_chat("hola quiero aprender a")
        self.assertEqual(data.get("detected_sign"), "A")
        self.assertEqual(data.get("intent"), "LEARN_SIGN")
        reply = data.get("reply", "")
        self.assertIn("[SELECCIONAR: A]", reply)
        self.assertIn("A", reply)
        # Debe ser un saludo cálido que saluda primero y enseña la A
        self.assertTrue(reply.startswith("¡Hola! Con mucho gusto"))

    def test_live_no_quiero_aprender_a(self):
        """Verifica la respuesta en vivo para 'no quiero aprender a'."""
        data = self._send_chat("no quiero aprender a")
        self.assertEqual(data.get("detected_sign"), "A")
        self.assertEqual(data.get("intent"), "LEARN_SIGN")
        self.assertTrue(data.get("is_clarification"))
        reply = data.get("reply", "")
        self.assertIn("[SELECCIONAR: A]", reply)
        self.assertIn("Enfoquémonos en la seña de 'A'", reply)

    def test_live_pure_greeting(self):
        """Verifica la respuesta en vivo para 'hola'."""
        data = self._send_chat("hola")
        self.assertIsNone(data.get("detected_sign"))
        self.assertEqual(data.get("intent"), "GREETING")
        reply = data.get("reply", "")
        self.assertNotIn("[SELECCIONAR: HOLA]", reply)
        self.assertIn("Soy Zorrito", reply)

    def test_live_sign_licor(self):
        """Verifica la respuesta en vivo para 'buenas tardes me enseñas licor'."""
        data = self._send_chat("buenas tardes me enseñas licor")
        self.assertEqual(data.get("detected_sign"), "LICOR")
        reply = data.get("reply", "")
        self.assertIn("[SELECCIONAR: LICOR]", reply)
        self.assertIn("copa", reply)

    def test_live_catalog_query(self):
        """Verifica la respuesta en vivo para 'qué señas tienes'."""
        data = self._send_chat("qué señas tienes")
        self.assertIsNone(data.get("detected_sign"))
        self.assertEqual(data.get("intent"), "CATALOG")
        reply = data.get("reply", "")
        self.assertIn("HOLA", reply)
        self.assertIn("Alfabeto dactilológico", reply)


if __name__ == '__main__':
    unittest.main(verbosity=2)
