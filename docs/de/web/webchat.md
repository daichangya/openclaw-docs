---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Loopback-WebChat-Static-Host und Gateway-WS-Nutzung für die Chat-UI
title: WebChat
x-i18n:
    generated_at: "2026-04-24T07:07:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Status: Die SwiftUI-Chat-UI für macOS/iOS kommuniziert direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-UI für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Channels.
- Deterministisches Routing: Antworten gehen immer an WebChat zurück.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-UI (macOS-/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Auth-Pfad konfiguriert ist (standardmäßig Shared Secret,
   auch auf Loopback).

## Funktionsweise (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten weglassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` wird außerdem für die Anzeige normalisiert: Inline-Zustellungsdirektiv-Tags
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, XML-Payloads von Tool-Calls in Klartext
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie
  geleakte ASCII-/Full-Width-Modell-Steuerungstokens werden aus sichtbarem Text entfernt,
  und Assistenteneinträge, deren gesamter sichtbarer Text nur aus dem exakten Silent-Token
  `NO_REPLY` / `no_reply` besteht, werden ausgelassen.
- `chat.inject` hängt direkt eine Assistentennotiz an das Transcript an und sendet sie an die UI (kein Agentenlauf).
- Abgebrochene Läufe können partielle Assistentenausgabe in der UI sichtbar lassen.
- Das Gateway persistiert partielle Assistententexte aus abgebrochenen Läufen im Transcript-Verlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruch-Metadaten.
- Der Verlauf wird immer vom Gateway abgerufen (kein lokales File-Watching).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Tools-Panel für Agenten in der Control UI

- Das Tools-Panel `/agents` in der Control UI hat zwei getrennte Ansichten:
  - **Gerade verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Core-, Plugin- und Channel-eigener Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Overrides und
    Katalogsemantik fokussiert.
- Die Laufzeitverfügbarkeit ist sitzungsbezogen. Das Wechseln von Sitzungen auf demselben Agenten kann die Liste
  **Gerade verfügbar** verändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Priorität
  der Richtlinien (`allow`/`deny`, pro Agent sowie Provider-/Channel-Overrides).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server betreiben.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenzahl für Textfelder in Antworten von `chat.history`. Wenn ein Transcript-Eintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Der Client kann pro Anfrage auch `maxChars` senden, um diesen Standardwert für einen einzelnen Aufruf von `chat.history` zu überschreiben.

Verwandte globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Auth.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung Tailscale
  Serve-Identity-Header verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Auth für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Ziel für das Remote-Gateway.
- `session.*`: Sitzungsspeicher und Standardwerte für den Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
