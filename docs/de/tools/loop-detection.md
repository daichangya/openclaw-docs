---
read_when:
    - Ein Benutzer meldet, dass Agenten bei wiederholten Tool-Calls hängen bleiben
    - Sie müssen den Schutz vor repetitiven Aufrufen abstimmen
    - Sie bearbeiten Richtlinien für Agenten-Tools/Runtime
summary: Wie Guardrails aktiviert und abgestimmt werden, die repetitive Tool-Call-Schleifen erkennen
title: Tool-Loop-Erkennung
x-i18n:
    generated_at: "2026-04-24T07:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw kann verhindern, dass Agenten in wiederholten Tool-Call-Mustern hängen bleiben.
Der Guard ist **standardmäßig deaktiviert**.

Aktivieren Sie ihn nur dort, wo er nötig ist, da er bei strengen Einstellungen legitime wiederholte Aufrufe blockieren kann.

## Warum es das gibt

- Repetitive Sequenzen erkennen, die keinen Fortschritt machen.
- Schleifen mit hoher Frequenz und ohne Ergebnis erkennen (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
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

- `enabled`: Hauptschalter. `false` bedeutet, dass keine Loop-Erkennung durchgeführt wird.
- `historySize`: Anzahl der aktuellen Tool-Aufrufe, die für die Analyse vorgehalten werden.
- `warningThreshold`: Schwelle, bevor ein Muster nur als Warnung eingestuft wird.
- `criticalThreshold`: Schwelle zum Blockieren repetitiver Loop-Muster.
- `globalCircuitBreakerThreshold`: globale Schwelle für einen No-Progress-Circuit-Breaker.
- `detectors.genericRepeat`: erkennt wiederholte Muster mit demselben Tool + denselben Parametern.
- `detectors.knownPollNoProgress`: erkennt bekannte polling-ähnliche Muster ohne Zustandsänderung.
- `detectors.pingPong`: erkennt alternierende Ping-Pong-Muster.

## Empfohlenes Setup

- Beginnen Sie mit `enabled: true`, ohne die Standardwerte zu ändern.
- Halten Sie die Schwellen in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn False Positives auftreten:
  - erhöhen Sie `warningThreshold` und/oder `criticalThreshold`
  - erhöhen Sie (optional) `globalCircuitBreakerThreshold`
  - deaktivieren Sie nur den Detector, der Probleme verursacht
  - reduzieren Sie `historySize` für einen weniger strengen historischen Kontext

## Logs und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Loop-Ereignis und blockiert oder dämpft den nächsten Tool-Zyklus je nach Schweregrad.
Das schützt Benutzer vor ausufernden Token-Kosten und Lockups und bewahrt gleichzeitig normalen Tool-Zugriff.

- Bevorzugen Sie zuerst Warnungen und vorübergehende Unterdrückung.
- Eskalieren Sie erst dann, wenn sich wiederholte Evidenz ansammelt.

## Hinweise

- `tools.loopDetection` wird mit Überschreibungen auf Agentenebene zusammengeführt.
- Konfiguration pro Agent überschreibt globale Werte vollständig oder erweitert sie.
- Wenn keine Konfiguration existiert, bleiben die Guardrails deaktiviert.

## Verwandt

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Thinking-Levels](/de/tools/thinking)
- [Unteragenten](/de/tools/subagents)
