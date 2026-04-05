---
read_when:
    - mac-WebChat-Ansicht oder local loopback-Port debuggen
summary: Wie die Mac-App das Gateway-WebChat einbettet und wie Sie es debuggen
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T12:49:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (macOS-App)

Die macOS-Menüleisten-App bettet die WebChat-Benutzeroberfläche als native SwiftUI-Ansicht ein. Sie
verbindet sich mit dem Gateway und verwendet standardmäßig die **Hauptsitzung** für den ausgewählten
Agenten (mit einem Sitzungsumschalter für andere Sitzungen).

- **Lokaler Modus**: Verbindet sich direkt mit dem lokalen Gateway-WebSocket.
- **Remote-Modus**: Leitet den Gateway-Kontrollport über SSH weiter und verwendet
  diesen Tunnel als Datenebene.

## Starten und Debuggen

- Manuell: Lobster-Menü → „Chat öffnen“.
- Automatisches Öffnen für Tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Protokolle: `./scripts/clawlog.sh` (Subsystem `ai.openclaw`, Kategorie `WebChatSwiftUI`).

## Wie es verdrahtet ist

- Datenebene: Gateway-WS-Methoden `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` und Ereignisse `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` gibt für die Anzeige normalisierte Transkriptzeilen zurück: Inline-Direktiv-
  Tags werden aus sichtbarem Text entfernt, XML-Nutzlasten von Tool-Aufrufen im Klartext
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie
  durchgesickerte ASCII-/vollbreite Modell-Kontroll-Token werden entfernt, reine
  stille-Token-Assistentenzeilen wie exaktes `NO_REPLY` / `no_reply` werden
  ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
- Sitzung: Standardmäßig wird die primäre Sitzung verwendet (`main` oder `global`, wenn der Geltungsbereich
  global ist). Die Benutzeroberfläche kann zwischen Sitzungen wechseln.
- Das Onboarding verwendet eine dedizierte Sitzung, damit die Ersteinrichtung getrennt bleibt.

## Sicherheitsoberfläche

- Der Remote-Modus leitet nur den Gateway-WebSocket-Kontrollport über SSH weiter.

## Bekannte Einschränkungen

- Die Benutzeroberfläche ist für Chat-Sitzungen optimiert (kein vollständiger Browser-Sandbox).
