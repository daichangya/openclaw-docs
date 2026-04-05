---
read_when:
    - Debuggen oder Konfigurieren des WebChat-Zugriffs
summary: Loopback-WebChat-Static-Host und Gateway-WS-Nutzung für die Chat-UI
title: WebChat
x-i18n:
    generated_at: "2026-04-05T12:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (Gateway-WebSocket-UI)

Status: Die SwiftUI-Chat-UI für macOS/iOS kommuniziert direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-UI für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Channels.
- Deterministisches Routing: Antworten gehen immer an WebChat zurück.

## Schnellstart

1. Gateway starten.
2. Die WebChat-UI (macOS-/iOS-App) oder den Chat-Tab der Control UI öffnen.
3. Sicherstellen, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig Shared Secret, auch auf loopback).

## So funktioniert es (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten weglassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` ist außerdem für die Anzeige normalisiert: Inline-Tags für Zustellungsdirektiven wie `[[reply_to_*]]` und `[[audio_as_voice]]`, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Steuertokens des Modells werden aus sichtbarem Text entfernt, und Assistant-Einträge, deren gesamter sichtbarer Text nur aus dem exakten Silent-Token `NO_REPLY` / `no_reply` besteht, werden ausgelassen.
- `chat.inject` hängt direkt eine Assistant-Notiz an das Transkript an und sendet sie an die UI (kein Agent-Lauf).
- Abgebrochene Läufe können partielle Assistant-Ausgaben in der UI sichtbar belassen.
- Das Gateway speichert partielle Assistant-Texte aus abgebrochenen Läufen im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruch-Metadaten.
- Der Verlauf wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Panel für Agent-Tools in der Control UI

- Das Tools-Panel unter `/agents` in der Control UI hat zwei getrennte Ansichten:
  - **Available Right Now** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Core-, Plugin- und Channel-eigener Tools.
  - **Tool Configuration** verwendet `tools.catalog` und bleibt auf Profile, Overrides und Katalogsemantik fokussiert.
- Die Runtime-Verfügbarkeit ist sitzungsbezogen. Das Wechseln von Sitzungen auf demselben Agent kann die Liste **Available Right Now** ändern.
- Der Konfigurationseditor impliziert keine Runtime-Verfügbarkeit; effektiver Zugriff folgt weiterhin der Vorrangreihenfolge der Richtlinien (`allow`/`deny`, Überschreibungen pro Agent sowie Provider/Channel).

## Remotenutzung

- Im Remote-Modus wird das Gateway-WebSocket über SSH/Tailscale getunnelt.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenzahl für Textfelder in Antworten von `chat.history`. Wenn ein Transkripteintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Ein request-spezifisches `maxChars` kann vom Client ebenfalls gesendet werden, um diesen Standardwert für einen einzelnen Aufruf von `chat.history` zu überschreiben.

Verwandte globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung Tailscale-Serve-Identity-Header verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Ziel des entfernten Gateways.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.
