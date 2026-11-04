import unittest
from banco_b_daily_report import build_message

class ReportTests(unittest.TestCase):
    def test_subject_and_count(self):
        msg = build_message([
            {"campeonato":"Brasileirão","confronto":"Time A x Time B","rodada":12}
        ], "2026-11-03")
        self.assertIn("2026-11-03", msg["Subject"])
        self.assertIn("Partidas encontradas: 1", msg.get_content())
        self.assertIn("Time A x Time B", msg.get_content())
        self.assertIn("Rodada 12", msg.get_content())

    def test_empty_day(self):
        msg = build_message([], "2026-11-03")
        self.assertIn("Nenhuma partida", msg.get_content())

if __name__ == "__main__":
    unittest.main()
