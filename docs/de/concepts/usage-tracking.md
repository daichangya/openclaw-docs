---
read_when:
    - Sie binden Oberflächen für Provider-Nutzung/Quoten an
    - Sie müssen das Verhalten der Nutzungsverfolgung oder die Authentifizierungsanforderungen erklären
summary: Oberflächen zur Nutzungsverfolgung und Anforderungen an Anmeldedaten
title: Nutzungsverfolgung
x-i18n:
    generated_at: "2026-04-24T06:36:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Was es ist

- Ruft Provider-Nutzung/Quoten direkt von deren Usage-Endpunkten ab.
- Keine geschätzten Kosten; nur die vom Provider gemeldeten Zeitfenster.
- Menschlich lesbare Statusausgabe wird zu `X% left` normalisiert, selbst wenn eine
  Upstream-API verbrauchte Quote, verbleibende Quote oder nur Rohzählungen meldet.
- Sitzungsbezogenes `/status` und `session_status` können auf den neuesten
  Nutzungs-Eintrag des Transkripts zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Dieser
  Fallback füllt fehlende Token-/Cache-Zähler auf, kann das aktive Laufzeit-
  Modell-Label wiederherstellen und bevorzugt den größeren promptorientierten Gesamtwert, wenn Sitzungs-
  metadaten fehlen oder kleiner sind. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: statuskarte mit Emojis und Sitzungs-Token + geschätzten Kosten (nur API-Schlüssel). Provider-Nutzung wird für den **aktuellen Modell-Provider** angezeigt, wenn verfügbar, als normalisiertes Zeitfenster `X% left`.
- `/usage off|tokens|full` in Chats: Nutzungs-Footer pro Antwort (OAuth zeigt nur Token).
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungslogs.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung pro Provider aus.
- CLI: `openclaw channels list` gibt denselben Nutzungs-Snapshot zusammen mit der Provider-Konfiguration aus (verwenden Sie `--no-usage`, um dies zu überspringen).
- macOS-Menüleiste: Abschnitt „Usage“ unter Context (nur wenn verfügbar).

## Provider + Anmeldedaten

- **Anthropic (Claude)**: OAuth-Tokens in Auth-Profilen.
- **GitHub Copilot**: OAuth-Tokens in Auth-Profilen.
- **Gemini CLI**: OAuth-Tokens in Auth-Profilen.
  - JSON-Nutzung fällt auf `stats` zurück; `stats.cached` wird in
    `cacheRead` normalisiert.
- **OpenAI Codex**: OAuth-Tokens in Auth-Profilen (`accountId` wird verwendet, wenn vorhanden).
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Auth-Profil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Quota-
  Oberfläche, bevorzugt gespeichertes MiniMax-OAuth, wenn vorhanden, und fällt andernfalls
  auf `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` zurück.
  Die Rohfelder `usage_percent` / `usagePercent` von MiniMax bedeuten **verbleibende**
  Quote, daher invertiert OpenClaw sie vor der Anzeige; zählungsbasierte Felder haben Vorrang, wenn
  vorhanden.
  - Labels für Coding-Plan-Zeitfenster stammen aus Provider-Feldern für Stunden/Minuten, wenn
    vorhanden, und fallen dann auf den Bereich `start_time` / `end_time` zurück.
  - Wenn der Coding-Plan-Endpunkt `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chat-Modell-Eintrag, leitet das Zeitfenster-Label aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und nimmt den Modell-
    namen in das Plan-Label auf.
- **Xiaomi MiMo**: API-Schlüssel über Umgebung/Konfiguration/Auth-Speicher (`XIAOMI_API_KEY`).
- **z.ai**: API-Schlüssel über Umgebung/Konfiguration/Auth-Speicher.

Die Nutzung wird ausgeblendet, wenn keine verwendbare Usage-Authentifizierung für den Provider aufgelöst werden kann. Provider
können plugin-spezifische Usage-Authentifizierungslogik bereitstellen; andernfalls greift OpenClaw auf
passende OAuth-/API-Schlüssel-Anmeldedaten aus Auth-Profilen, Umgebungsvariablen
oder Konfiguration zurück.

## Verwandt

- [Token use and costs](/de/reference/token-use)
- [API usage and costs](/de/reference/api-usage-costs)
- [Prompt caching](/de/reference/prompt-caching)
