---
permalink: /security/formal-verification/
read_when:
    - Prüfen von Garantien oder Grenzen formaler Sicherheitsmodelle
    - Reproduzieren oder Aktualisieren von TLA+/TLC-Prüfungen der Sicherheitsmodelle
summary: Maschinell geprüfte Sicherheitsmodelle für die Pfade mit dem höchsten Risiko in OpenClaw.
title: Formale Verifikation (Sicherheitsmodelle)
x-i18n:
    generated_at: "2026-04-24T06:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Diese Seite verfolgt die **formalen Sicherheitsmodelle** von OpenClaw (heute TLA+/TLC; bei Bedarf mehr).

> Hinweis: Einige ältere Links können sich auf den früheren Projektnamen beziehen.

**Ziel (Nordstern):** ein maschinell geprüftes Argument dafür liefern, dass OpenClaw seine
beabsichtigte Sicherheitsrichtlinie (Autorisierung, Sitzungsisolation, Tool-Gating und
Sicherheit bei Fehlkonfigurationen) unter expliziten Annahmen durchsetzt.

**Was das heute ist:** eine ausführbare, angreifergetriebene **Sicherheits-Regressionssuite**:

- Jede Behauptung hat eine ausführbare Modellprüfung über einen endlichen Zustandsraum.
- Viele Behauptungen haben ein gepaartes **negatives Modell**, das eine Gegenbeispiel-Trace für eine realistische Bug-Klasse erzeugt.

**Was das (noch) nicht ist:** ein Beweis, dass „OpenClaw in jeder Hinsicht sicher ist“ oder dass die vollständige TypeScript-Implementierung korrekt ist.

## Wo die Modelle liegen

Die Modelle werden in einem separaten Repo gepflegt: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Wichtige Einschränkungen

- Dies sind **Modelle**, nicht die vollständige TypeScript-Implementierung. Abweichungen zwischen Modell und Code sind möglich.
- Ergebnisse sind durch den von TLC erkundeten Zustandsraum begrenzt; ein „grünes“ Ergebnis impliziert keine Sicherheit über die modellierten Annahmen und Grenzen hinaus.
- Einige Behauptungen beruhen auf expliziten Umweltannahmen (z. B. korrektes Deployment, korrekte Konfigurationseingaben).

## Ergebnisse reproduzieren

Heute werden Ergebnisse reproduziert, indem das Modell-Repo lokal geklont und TLC ausgeführt wird (siehe unten). Eine zukünftige Iteration könnte Folgendes bieten:

- in CI ausgeführte Modelle mit öffentlichen Artefakten (Gegenbeispiel-Traces, Ausführungsprotokolle)
- einen gehosteten Workflow „dieses Modell ausführen“ für kleine, begrenzte Prüfungen

Erste Schritte:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ erforderlich (TLC läuft auf der JVM).
# Das Repo vendort ein gepinntes `tla2tools.jar` (TLA+-Tools) und stellt `bin/tlc` + Make-Ziele bereit.

make <target>
```

### Gateway-Exposition und offene Gateway-Fehlkonfiguration

**Behauptung:** Binden über Loopback hinaus ohne Auth kann eine Remote-Kompromittierung möglich machen / die Exposition erhöhen; Token/Passwort blockiert nicht autorisierte Angreifer (gemäß den Modellannahmen).

- Grüne Läufe:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rot (erwartet):
  - `make gateway-exposure-v2-negative`

Siehe auch: `docs/gateway-exposure-matrix.md` im Modell-Repo.

### Node-Exec-Pipeline (Fähigkeit mit höchstem Risiko)

**Behauptung:** `exec host=node` erfordert (a) Node-Befehls-Allowlist plus deklarierte Befehle und (b) Live-Freigabe, wenn konfiguriert; Freigaben werden tokenisiert, um Replay zu verhindern (im Modell).

- Grüne Läufe:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rot (erwartet):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing-Store (DM-Gating)

**Behauptung:** Pairing-Anfragen beachten TTL und Obergrenzen für ausstehende Anfragen.

- Grüne Läufe:
  - `make pairing`
  - `make pairing-cap`
- Rot (erwartet):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress-Gating (Mentions + Bypass von Steuerbefehlen)

**Behauptung:** In Gruppenkontexten, die eine Mention erfordern, kann ein nicht autorisierter „Steuerbefehl“ das Mention-Gating nicht umgehen.

- Grün:
  - `make ingress-gating`
- Rot (erwartet):
  - `make ingress-gating-negative`

### Routing-/Session-Key-Isolation

**Behauptung:** DMs von verschiedenen Peers kollabieren nicht in dieselbe Sitzung, es sei denn, dies wurde explizit verknüpft/konfiguriert.

- Grün:
  - `make routing-isolation`
- Rot (erwartet):
  - `make routing-isolation-negative`

## v1++: zusätzliche begrenzte Modelle (Konkurrenz, Retries, Trace-Korrektheit)

Dies sind Anschlussmodelle, die die Treue rund um reale Fehlermodi erhöhen (nicht atomare Updates, Retries und Message-Fan-out).

### Konkurrenz / Idempotenz des Pairing-Stores

**Behauptung:** Ein Pairing-Store sollte `MaxPending` und Idempotenz selbst unter Interleavings durchsetzen (d. h. „check-then-write“ muss atomar / gesperrt sein; Refresh sollte keine Duplikate erzeugen).

Was das bedeutet:

- Unter konkurrierenden Anfragen kann `MaxPending` für einen Kanal nicht überschritten werden.
- Wiederholte Anfragen/Refreshes für dieselbe `(channel, sender)` sollten keine doppelten aktiven Pending-Zeilen erzeugen.

- Grüne Läufe:
  - `make pairing-race` (atomare/gesperrte Cap-Prüfung)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rot (erwartet):
  - `make pairing-race-negative` (nicht atomarer Begin/Commit-Cap-Race)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korrelation / Idempotenz von Ingress-Traces

**Behauptung:** Ingestion sollte die Trace-Korrelation über Fan-out hinweg erhalten und unter Provider-Retries idempotent sein.

Was das bedeutet:

- Wenn ein externes Ereignis zu mehreren internen Nachrichten wird, behält jeder Teil dieselbe Trace-/Ereignisidentität.
- Retries führen nicht zu doppelter Verarbeitung.
- Wenn Event-IDs des Providers fehlen, fällt Dedupe auf einen sicheren Schlüssel zurück (z. B. Trace-ID), um zu vermeiden, dass unterschiedliche Ereignisse verworfen werden.

- Grün:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rot (erwartet):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routing dmScope-Vorrang + identityLinks

**Behauptung:** Routing muss DM-Sitzungen standardmäßig isoliert halten und Sitzungen nur dann zusammenführen, wenn dies explizit konfiguriert wurde (Kanal-Vorrang + Identitätslinks).

Was das bedeutet:

- Kanalspezifische dmScope-Überschreibungen müssen Vorrang vor globalen Standards haben.
- identityLinks sollten nur innerhalb explizit verknüpfter Gruppen zusammenführen, nicht über nicht zusammenhängende Peers hinweg.

- Grün:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rot (erwartet):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Verwandt

- [Threat model](/de/security/THREAT-MODEL-ATLAS)
- [Contributing to the threat model](/de/security/CONTRIBUTING-THREAT-MODEL)
