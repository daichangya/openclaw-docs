---
read_when:
    - Beim Debuggen von Health-Indikatoren der Mac-App
summary: Wie die macOS-App Zustände für Gateway-/Baileys-Health meldet
title: Health-Checks (macOS)
x-i18n:
    generated_at: "2026-04-05T12:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Health-Checks auf macOS

So sehen Sie in der Menüleisten-App, ob der verknüpfte Kanal gesund ist.

## Menüleiste

- Der Statuspunkt spiegelt jetzt den Baileys-Health-Zustand wider:
  - Grün: verknüpft + Socket wurde vor Kurzem geöffnet.
  - Orange: verbindet sich / versucht erneut.
  - Rot: abgemeldet oder Probe fehlgeschlagen.
- Die sekundäre Zeile zeigt „linked · auth 12m“ oder den Fehlergrund.
- Der Menüeintrag „Run Health Check“ löst eine Probe bei Bedarf aus.

## Einstellungen

- Der Tab Allgemein erhält eine Health-Karte mit: Alter der verknüpften Auth, Pfad/Anzahl des Session-Stores, Zeitpunkt der letzten Prüfung, letzter Fehler/Statuscode sowie Buttons für Run Health Check / Reveal Logs.
- Verwendet einen gecachten Snapshot, damit die UI sofort lädt und offline graceful zurückfällt.
- **Der Tab Channels** zeigt Kanalstatus + Steuerelemente für WhatsApp/Telegram an (Login-QR, Logout, Probe, letzte Trennung/letzter Fehler).

## So funktioniert die Probe

- Die App führt `openclaw health --json` über `ShellExecutor` etwa alle 60 Sekunden und bei Bedarf aus. Die Probe lädt Credentials und meldet den Status, ohne Nachrichten zu senden.
- Cachen Sie den letzten guten Snapshot und den letzten Fehler getrennt, um Flackern zu vermeiden; zeigen Sie den Zeitstempel von beiden an.

## Im Zweifel

- Sie können weiterhin den CLI-Ablauf unter [Gateway health](/gateway/health) verwenden (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) und `/tmp/openclaw/openclaw-*.log` auf `web-heartbeat` / `web-reconnect` überwachen.
