---
read_when:
    - Beim Ausführen oder Debuggen des Gateway-Prozesses
    - Beim Untersuchen der Erzwingung einer Einzelinstanz
summary: Gateway-Singleton-Schutz über den Bind des WebSocket-Listeners
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-04-05T12:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Gateway-Sperre

## Warum

- Sicherstellen, dass pro Basis-Port auf demselben Host nur eine Gateway-Instanz läuft; zusätzliche Gateways müssen isolierte Profile und eindeutige Ports verwenden.
- Abstürze/SIGKILL überstehen, ohne veraltete Lock-Dateien zu hinterlassen.
- Schnell mit einem klaren Fehler fehlschlagen, wenn der Control-Port bereits belegt ist.

## Mechanismus

- Das Gateway bindet den WebSocket-Listener (Standard `ws://127.0.0.1:18789`) sofort beim Start mit einem exklusiven TCP-Listener.
- Wenn das Binden mit `EADDRINUSE` fehlschlägt, wirft der Start `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Das Betriebssystem gibt den Listener bei jedem Prozessende automatisch frei, einschließlich Abstürzen und SIGKILL — es ist keine separate Lock-Datei und kein Bereinigungsschritt erforderlich.
- Beim Herunterfahren schließt das Gateway den WebSocket-Server und den zugrunde liegenden HTTP-Server, um den Port schnell freizugeben.

## Fehleroberfläche

- Wenn ein anderer Prozess den Port belegt, wirft der Start `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Andere Bind-Fehler werden als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` ausgegeben.

## Betriebshinweise

- Wenn der Port von _einem anderen_ Prozess belegt ist, ist der Fehler derselbe; geben Sie den Port frei oder wählen Sie einen anderen mit `openclaw gateway --port <port>`.
- Die macOS-App behält weiterhin ihren eigenen leichtgewichtigen PID-Schutz bei, bevor sie das Gateway startet; die Laufzeitsperre wird durch den WebSocket-Bind erzwungen.

## Verwandt

- [Mehrere Gateways](/gateway/multiple-gateways) — mehrere Instanzen mit eindeutigen Ports ausführen
- [Fehlerbehebung](/gateway/troubleshooting) — Diagnose von `EADDRINUSE` und Portkonflikten
