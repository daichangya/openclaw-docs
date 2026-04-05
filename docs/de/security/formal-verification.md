---
permalink: /security/formal-verification/
read_when:
    - Prüfen formaler Garantien oder Grenzen von Sicherheitsmodellen
    - Reproduzieren oder Aktualisieren von TLA+/TLC-Prüfungen für Sicherheitsmodelle
summary: Maschinell geprüfte Sicherheitsmodelle für die risikoreichsten Pfade von OpenClaw.
title: Formale Verifikation (Sicherheitsmodelle)
x-i18n:
    generated_at: "2026-04-05T12:55:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Formale Verifikation (Sicherheitsmodelle)

Diese Seite verfolgt die **formalen Sicherheitsmodelle** von OpenClaw (heute TLA+/TLC; bei Bedarf mehr).

> Hinweis: Einige ältere Links können sich auf den früheren Projektnamen beziehen.

**Ziel (Leitstern):** ein maschinell geprüftes Argument dafür bereitstellen, dass OpenClaw seine
beabsichtigte Sicherheitsrichtlinie durchsetzt (Autorisierung, Sitzungsisolation, Tool-Gating und
Sicherheit bei Fehlkonfigurationen), unter expliziten Annahmen.

**Was dies (heute) ist:** eine ausführbare, angriffsgetriebene **Sicherheits-Regressionssuite**:

- Jede Behauptung hat eine ausführbare Modellprüfung über einen endlichen Zustandsraum.
- Viele Behauptungen haben ein gepaartes **negatives Modell**, das einen Gegenbeispiel-Trace für eine realistische Fehlerklasse erzeugt.

**Was dies (noch) nicht ist:** ein Beweis dafür, dass „OpenClaw in jeder Hinsicht sicher ist“ oder dass die vollständige TypeScript-Implementierung korrekt ist.

## Wo sich die Modelle befinden

Die Modelle werden in einem separaten Repository gepflegt: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Wichtige Vorbehalte

- Dies sind **Modelle**, nicht die vollständige TypeScript-Implementierung. Abweichungen zwischen Modell und Code sind möglich.
- Die Ergebnisse sind durch den von TLC untersuchten Zustandsraum begrenzt; ein „grün“ impliziert keine Sicherheit über die modellierten Annahmen und Grenzen hinaus.
- Einige Behauptungen beruhen auf expliziten Umgebungsannahmen (z. B. korrekte Bereitstellung, korrekte Konfigurationseingaben).

## Ergebnisse reproduzieren

Derzeit werden Ergebnisse reproduziert, indem das Modell-Repository lokal geklont und TLC ausgeführt wird (siehe unten). Eine zukünftige Iteration könnte Folgendes anbieten:

- in CI ausgeführte Modelle mit öffentlichen Artefakten (Gegenbeispiel-Traces, Ausführungsprotokolle)
- einen gehosteten Workflow „dieses Modell ausführen“ für kleine, begrenzte Prüfungen

Erste Schritte:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ erforderlich (TLC läuft auf der JVM).
# Das Repo vendort ein fixiertes `tla2tools.jar` (TLA+-Tools) und stellt `bin/tlc` + Make-Ziele bereit.

make <target>
```

### Gateway-Exposition und Fehlkonfiguration eines offenen Gateway

**Behauptung:** Bindung über loopback hinaus ohne Auth kann eine Remote-Kompromittierung ermöglichen / die Exposition erhöhen; Token/Passwort blockieren nicht authentifizierte Angreifer (gemäß den Modellannahmen).

- Grüne Läufe:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rot (erwartet):
  - `make gateway-exposure-v2-negative`

Siehe auch: `docs/gateway-exposure-matrix.md` im Modell-Repository.

### Node-Exec-Pipeline (Funktion mit dem höchsten Risiko)

**Behauptung:** `exec host=node` erfordert (a) eine Node-Befehls-Allowlist plus deklarierte Befehle und (b) eine Live-Genehmigung, wenn konfiguriert; Genehmigungen sind tokenisiert, um Replay zu verhindern (im Modell).

- Grüne Läufe:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rot (erwartet):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing-Speicher (DM-Gating)

**Behauptung:** Pairing-Anfragen respektieren TTL und Begrenzungen für ausstehende Anfragen.

- Grüne Läufe:
  - `make pairing`
  - `make pairing-cap`
- Rot (erwartet):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress-Gating (Erwähnungen + Umgehung durch Steuerbefehle)

**Behauptung:** In Gruppenkontexten, die eine Erwähnung erfordern, kann ein nicht autorisierter „Steuerbefehl“ das Erwähnungs-Gating nicht umgehen.

- Grün:
  - `make ingress-gating`
- Rot (erwartet):
  - `make ingress-gating-negative`

### Routing-/Session-Key-Isolation

**Behauptung:** DMs von unterschiedlichen Peers fallen nicht in dieselbe Sitzung zusammen, sofern sie nicht explizit verknüpft/konfiguriert sind.

- Grün:
  - `make routing-isolation`
- Rot (erwartet):
  - `make routing-isolation-negative`

## v1++: zusätzliche begrenzte Modelle (Nebenläufigkeit, Wiederholungen, Trace-Korrektheit)

Dies sind Anschlussmodelle, die die Genauigkeit in Bezug auf reale Fehlermodi verschärfen (nicht atomare Updates, Wiederholungen und Nachrichten-Fan-out).

### Nebenläufigkeit / Idempotenz des Pairing-Speichers

**Behauptung:** Ein Pairing-Speicher sollte `MaxPending` und Idempotenz auch bei Interleavings durchsetzen (d. h. „prüfen-dann-schreiben“ muss atomar / gesperrt sein; Aktualisierung sollte keine Duplikate erzeugen).

Was das bedeutet:

- Bei gleichzeitigen Anfragen kann `MaxPending` für einen Kanal nicht überschritten werden.
- Wiederholte Anfragen/Aktualisierungen für denselben `(channel, sender)` sollten keine doppelten aktiven ausstehenden Zeilen erzeugen.

- Grüne Läufe:
  - `make pairing-race` (atomare/gesperrte Cap-Prüfung)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rot (erwartet):
  - `make pairing-race-negative` (nicht atomarer Begin-/Commit-Cap-Race)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korrelation / Idempotenz von Ingress-Traces

**Behauptung:** Ingestion sollte die Trace-Korrelation über Fan-out hinweg bewahren und unter Wiederholungen durch Provider idempotent sein.

Was das bedeutet:

- Wenn aus einem externen Ereignis mehrere interne Nachrichten werden, behält jeder Teil dieselbe Trace-/Ereignisidentität.
- Wiederholungen führen nicht zu doppelter Verarbeitung.
- Wenn Provider-Ereignis-IDs fehlen, greift Deduplizierung auf einen sicheren Schlüssel zurück (z. B. Trace-ID), um das Verwerfen unterschiedlicher Ereignisse zu vermeiden.

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

### Priorität von Routing-dmScope + identityLinks

**Behauptung:** Routing muss DM-Sitzungen standardmäßig isoliert halten und Sitzungen nur dann zusammenführen, wenn dies explizit konfiguriert ist (Kanalpriorität + identityLinks).

Was das bedeutet:

- Kanalspezifische `dmScope`-Überschreibungen müssen Vorrang vor globalen Standardwerten haben.
- `identityLinks` sollten nur innerhalb explizit verknüpfter Gruppen zusammenführen, nicht über nicht zusammenhängende Peers hinweg.

- Grün:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rot (erwartet):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
