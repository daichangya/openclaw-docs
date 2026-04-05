---
read_when:
    - Ein Benutzer meldet, dass Agents in wiederholten Tool-Aufrufen hängen bleiben
    - Sie müssen den Schutz vor wiederholten Aufrufen abstimmen
    - Sie bearbeiten Richtlinien für Agent-Tools oder die Runtime
summary: So werden Guardrails aktiviert und abgestimmt, die sich wiederholende Tool-Call-Schleifen erkennen
title: Erkennung von Tool-Schleifen
x-i18n:
    generated_at: "2026-04-05T12:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Erkennung von Tool-Schleifen

OpenClaw kann verhindern, dass Agents in wiederholten Tool-Call-Mustern hängen bleiben.
Der Schutz ist **standardmäßig deaktiviert**.

Aktivieren Sie ihn nur dort, wo er gebraucht wird, denn bei strengen Einstellungen kann er legitime wiederholte Aufrufe blockieren.

## Warum es das gibt

- Wiederholte Sequenzen erkennen, die keinen Fortschritt machen.
- Hochfrequente Schleifen ohne Ergebnis erkennen (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
- Spezifische Muster wiederholter Aufrufe für bekannte Polling-Tools erkennen.

## Konfigurationsblock

Globale Standardwerte:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Überschreibung pro Agent (optional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Verhalten der Felder

- `enabled`: Hauptschalter. `false` bedeutet, dass keine Schleifenerkennung durchgeführt wird.
- `historySize`: Anzahl der letzten Tool-Aufrufe, die zur Analyse behalten werden.
- `warningThreshold`: Schwellenwert, bevor ein Muster nur als Warnung eingestuft wird.
- `criticalThreshold`: Schwellenwert zum Blockieren wiederholter Schleifenmuster.
- `globalCircuitBreakerThreshold`: globaler Schwellenwert für den Circuit Breaker bei fehlendem Fortschritt.
- `detectors.genericRepeat`: erkennt wiederholte Muster mit demselben Tool + denselben Parametern.
- `detectors.knownPollNoProgress`: erkennt bekannte pollingartige Muster ohne Zustandsänderung.
- `detectors.pingPong`: erkennt alternierende Ping-Pong-Muster.

## Empfohlene Einrichtung

- Beginnen Sie mit `enabled: true`, die Standardwerte unverändert.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn False Positives auftreten:
  - erhöhen Sie `warningThreshold` und/oder `criticalThreshold`
  - erhöhen Sie optional `globalCircuitBreakerThreshold`
  - deaktivieren Sie nur den Detector, der Probleme verursacht
  - reduzieren Sie `historySize` für einen weniger strengen historischen Kontext

## Logs und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Schleifenereignis und blockiert oder dämpft den nächsten Tool-Zyklus je nach Schweregrad.
Das schützt Benutzer vor unkontrolliertem Token-Verbrauch und Hängern, während normaler Tool-Zugriff erhalten bleibt.

- Bevorzugen Sie zunächst Warnungen und vorübergehende Unterdrückung.
- Eskalieren Sie erst, wenn sich wiederholt Belege ansammeln.

## Hinweise

- `tools.loopDetection` wird mit Überschreibungen auf Agent-Ebene zusammengeführt.
- Konfiguration pro Agent überschreibt oder erweitert globale Werte vollständig.
- Wenn keine Konfiguration existiert, bleiben die Guardrails deaktiviert.
