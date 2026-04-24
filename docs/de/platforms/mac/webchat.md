---
read_when:
    - Debugging der WebChat-Ansicht auf dem Mac oder des Loopback-Ports
summary: Wie die Mac-App das Gateway-WebChat einbettet und wie es debuggt wird
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T06:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

Die macOS-Menüleisten-App bettet die WebChat-Benutzeroberfläche als native SwiftUI-Ansicht ein. Sie
verbindet sich mit dem Gateway und verwendet standardmäßig die **Hauptsitzung** für den ausgewählten
Agenten (mit einem Sitzungswechsler für andere Sitzungen).

- **Lokaler Modus**: verbindet sich direkt mit dem lokalen Gateway-WebSocket.
- **Remote-Modus**: leitet den Gateway-Control-Port über SSH weiter und verwendet diesen
  Tunnel als Datenebene.

## Start & Debugging

- Manuell: Lobster-Menü → „Open Chat“.
- Für Tests automatisch öffnen:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (Subsystem `ai.openclaw`, Kategorie `WebChatSwiftUI`).

## Wie es verdrahtet ist

- Datenebene: Gateway-WS-Methoden `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` und Ereignisse `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` gibt anzeige-normalisierte Transcript-Zeilen zurück: Inline-Direktiv-
  Tags werden aus sichtbarem Text entfernt, XML-Payloads von Tool-Aufrufen in Klartext
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` sowie abgeschnittene Tool-Call-Blöcke) und
  geleakte ASCII-/Full-Width-Modell-Steuerungs-Tokens werden entfernt, reine
  Assistentenzeilen mit Silent-Tokens wie exakt `NO_REPLY` / `no_reply` werden
  ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
- Sitzung: verwendet standardmäßig die primäre Sitzung (`main` oder `global`, wenn der Scope
  global ist). Die UI kann zwischen Sitzungen wechseln.
- Das Onboarding verwendet eine dedizierte Sitzung, damit die Einrichtung beim ersten Lauf getrennt bleibt.

## Sicherheitsoberfläche

- Im Remote-Modus wird nur der Gateway-WebSocket-Control-Port über SSH weitergeleitet.

## Bekannte Einschränkungen

- Die UI ist für Chat-Sitzungen optimiert (kein vollständiger Browser-Sandbox).

## Verwandt

- [WebChat](/de/web/webchat)
- [macOS-App](/de/platforms/macos)
