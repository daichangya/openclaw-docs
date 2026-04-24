---
read_when:
    - Gateway-Prozess ausführen oder debuggen
    - Durchsetzung einer Einzelinstanz untersuchen
summary: Gateway-Singleton-Guard mit dem Bind des WebSocket-Listeners
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-04-24T06:37:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Warum

- Stellen Sie sicher, dass pro Basis-Port auf demselben Host nur eine Gateway-Instanz läuft; zusätzliche Gateways müssen isolierte Profile und eindeutige Ports verwenden.
- Abstürze/SIGKILL überstehen, ohne veraltete Sperrdateien zu hinterlassen.
- Schnell mit einer klaren Fehlermeldung fehlschlagen, wenn der Control-Port bereits belegt ist.

## Mechanismus

- Das Gateway bindet beim Start sofort den WebSocket-Listener (Standard `ws://127.0.0.1:18789`) mit einem exklusiven TCP-Listener.
- Wenn das Binden mit `EADDRINUSE` fehlschlägt, löst der Start `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` aus.
- Das Betriebssystem gibt den Listener bei jedem Prozessende automatisch frei, auch bei Abstürzen und SIGKILL — es ist keine separate Sperrdatei oder Bereinigung erforderlich.
- Beim Herunterfahren schließt das Gateway den WebSocket-Server und den zugrunde liegenden HTTP-Server, um den Port schnell freizugeben.

## Fehleroberfläche

- Wenn ein anderer Prozess den Port hält, löst der Start `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` aus.
- Andere Bind-Fehler werden als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` ausgegeben.

## Betriebshinweise

- Wenn der Port von einem _anderen_ Prozess belegt ist, ist der Fehler derselbe; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen.
- Die macOS-App verwendet weiterhin ihren eigenen leichtgewichtigen PID-Guard, bevor sie das Gateway startet; die Laufzeitsperre wird durch den WebSocket-Bind erzwungen.

## Verwandt

- [Multiple Gateways](/de/gateway/multiple-gateways) — mehrere Instanzen mit eindeutigen Ports ausführen
- [Troubleshooting](/de/gateway/troubleshooting) — Diagnose von `EADDRINUSE` und Portkonflikten
