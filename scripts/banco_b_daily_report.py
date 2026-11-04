#!/usr/bin/env python3
"""Relatório diário somente leitura da Análise Pré do Banco B."""
import datetime as dt
import os
import smtplib
import ssl
import urllib.parse
import urllib.request
from email.message import EmailMessage
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/Sao_Paulo")

def today_br():
    return dt.datetime.now(TZ).date().isoformat()

def fetch_games(base_url, service_key, day):
    query = urllib.parse.urlencode({
        "select": "data,confronto,campeonato,temporada,rodada",
        "data": f"eq.{day}",
        "order": "campeonato.asc,confronto.asc",
        "limit": "5000",
    })
    url = base_url.rstrip("/") + "/rest/v1/pre_analysis_games?" + query
    req = urllib.request.Request(url, headers={
        "apikey": service_key,
        "Authorization": "Bearer " + service_key,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as response:
        import json
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError("Resposta inesperada do Supabase.")
    return payload

def build_message(games, day):
    msg = EmailMessage()
    msg["Subject"] = f"Banco B | Partidas da Análise Pré | {day}"
    msg.set_content("Relatório diário — Banco B / Análise Pré\n"
                    f"Data: {day}\nPartidas encontradas: {len(games)}\n\n"
                    + ("\n".join(
                        f"- {g.get('campeonato') or 'Sem campeonato'} | "
                        f"{g.get('confronto') or 'Confronto não informado'}"
                        + (f" | Rodada {g['rodada']}" if g.get("rodada") else "")
                        for g in games
                    ) if games else "Nenhuma partida cadastrada na Análise Pré para hoje.\n")
                    + "\n\nNesta primeira etapa, os horários ainda não são enriquecidos. "
                    "A integração com a fonte secundária será feita na próxima fase.")
    return msg

def send_email(message):
    host = os.environ["SMTP_HOST"]
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.environ["SMTP_USER"]
    password = os.environ["SMTP_PASSWORD"]
    sender = os.getenv("ALERT_EMAIL_FROM", username)
    recipient = os.environ["ALERT_EMAIL_TO"]
    message["From"] = sender
    message["To"] = recipient
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=30) as smtp:
            smtp.login(username, password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.starttls(context=ssl.create_default_context())
            smtp.login(username, password)
            smtp.send_message(message)

def main():
    day = os.getenv("REPORT_DATE") or today_br()
    games = fetch_games(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"], day)
    message = build_message(games, day)
    print(message.get_content())
    if os.getenv("DRY_RUN", "false").lower() == "true":
        print(f"DRY_RUN: {len(games)} partida(s); e-mail não enviado.")
        return
    send_email(message)
    print(f"E-mail enviado: {len(games)} partida(s), data {day}.")

if __name__ == "__main__":
    main()
