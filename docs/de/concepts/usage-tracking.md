---
read_when:
    - Sie Oberflächen für Provider-Nutzung/Kontingent verdrahten
    - Sie das Verhalten der Nutzungsverfolgung oder Auth-Anforderungen erklären müssen
summary: Oberflächen zur Nutzungsverfolgung und Anforderungen an Anmeldedaten
title: Nutzungsverfolgung
x-i18n:
    generated_at: "2026-04-05T12:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Nutzungsverfolgung

## Was es ist

- Ruft Provider-Nutzung/Kontingente direkt von deren Nutzungsendpunkten ab.
- Keine geschätzten Kosten; nur die vom Provider gemeldeten Zeitfenster.
- Menschenlesbare Statusausgabe wird auf `X% left` normalisiert, selbst wenn eine
  Upstream-API verbrauchtes Kontingent, verbleibendes Kontingent oder nur rohe Zählwerte meldet.
- Sitzungsweites `/status` und `session_status` können auf den neuesten
  Nutzungs-Eintrag im Transkript zurückgreifen, wenn der Live-Sitzungs-Snapshot spärlich ist. Dieser
  Fallback füllt fehlende Token-/Cache-Zähler, kann die aktive Laufzeit-
  Modellbezeichnung wiederherstellen und bevorzugt die größere promptorientierte Gesamtsumme, wenn
  Sitzungsmetadaten fehlen oder kleiner sind. Bereits vorhandene Live-Werte ungleich null haben weiterhin Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: statuskarte mit Emojis, Sitzungs-Token + geschätzten Kosten (nur API-Schlüssel). Provider-Nutzung wird für den **aktuellen Modell-Provider** angezeigt, wenn sie als normalisiertes `X% left`-Fenster verfügbar ist.
- `/usage off|tokens|full` in Chats: Nutzungs-Fußzeile pro Antwort (OAuth zeigt nur Token).
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungslogs.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung pro Provider aus.
- CLI: `openclaw channels list` gibt denselben Nutzungs-Snapshot zusammen mit der Provider-Konfiguration aus (verwenden Sie `--no-usage`, um dies zu überspringen).
- macOS-Menüleiste: Abschnitt „Usage“ unter Kontext (nur wenn verfügbar).

## Provider + Anmeldedaten

- **Anthropic (Claude)**: OAuth-Tokens in Auth-Profilen.
- **GitHub Copilot**: OAuth-Tokens in Auth-Profilen.
- **Gemini CLI**: OAuth-Tokens in Auth-Profilen.
  - JSON-Nutzung greift auf `stats` zurück; `stats.cached` wird in
    `cacheRead` normalisiert.
- **OpenAI Codex**: OAuth-Tokens in Auth-Profilen (`accountId` wird verwendet, wenn vorhanden).
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Auth-Profil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingent-
  Oberfläche, bevorzugt gespeichertes MiniMax OAuth, wenn vorhanden, und greift andernfalls
  auf `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` zurück.
  Die rohen Felder `usage_percent` / `usagePercent` von MiniMax bedeuten **verbleibendes**
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählwertbasierte Felder haben Vorrang, wenn
  vorhanden.
  - Bezeichnungen für Coding-Plan-Zeitfenster stammen aus Provider-Feldern für Stunden/Minuten, wenn
    vorhanden, und fallen sonst auf die Spanne aus `start_time` / `end_time` zurück.
  - Wenn der Endpunkt des Coding-Plans `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chat-Modell-Eintrag, leitet die Fensterbezeichnung aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und nimmt den Modellnamen in die
    Planbezeichnung auf.
- **Xiaomi MiMo**: API-Schlüssel über Env/Konfiguration/Auth-Store (`XIAOMI_API_KEY`).
- **z.ai**: API-Schlüssel über Env/Konfiguration/Auth-Store.

Die Nutzung wird ausgeblendet, wenn keine verwendbare Auth für Provider-Nutzung aufgelöst werden kann. Provider
können pluginspezifische Logik für die Nutzungs-Authentifizierung bereitstellen; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Auth-Profilen, Umgebungsvariablen
oder der Konfiguration zurück.
