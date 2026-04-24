---
read_when:
    - Sie sehen einen Konfigurationsschlüssel `.experimental` und möchten wissen, ob er stabil ist
    - Sie möchten Vorschau-Laufzeitfunktionen ausprobieren, ohne sie mit normalen Standards zu verwechseln
    - Sie möchten einen zentralen Ort für die derzeit dokumentierten experimentellen Flags
summary: Was experimentelle Flags in OpenClaw bedeuten und welche derzeit dokumentiert sind
title: Experimentelle Funktionen
x-i18n:
    generated_at: "2026-04-24T06:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Experimentelle Funktionen in OpenClaw sind **opt-in Vorschau-Oberflächen**. Sie
stehen hinter expliziten Flags, weil sie noch reale Nutzungserfahrung brauchen, bevor sie
einen stabilen Standard oder einen langlebigen öffentlichen Vertrag verdienen.

Behandeln Sie sie anders als normale Konfiguration:

- Lassen Sie sie standardmäßig **deaktiviert**, es sei denn, die zugehörige Dokumentation empfiehlt ausdrücklich, eines auszuprobieren.
- Rechnen Sie damit, dass sich **Struktur und Verhalten** schneller ändern als bei stabiler Konfiguration.
- Bevorzugen Sie zuerst den stabilen Pfad, wenn bereits einer existiert.
- Wenn Sie OpenClaw breit ausrollen, testen Sie experimentelle Flags zunächst in einer kleineren
  Umgebung, bevor Sie sie in eine gemeinsame Baseline übernehmen.

## Derzeit dokumentierte Flags

| Oberfläche               | Schlüssel                                                | Verwenden Sie ihn, wenn                                                                                         | Mehr                                                                                          |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale Modell-Laufzeit   | `agents.defaults.experimental.localModelLean`            | Ein kleineres oder strengeres lokales Backend an der vollständigen Standard-Tool-Oberfläche von OpenClaw scheitert | [Lokale Modelle](/de/gateway/local-models)                                                       |
| Speichersuche            | `agents.defaults.memorySearch.experimental.sessionMemory`| Sie möchten, dass `memory_search` frühere Sitzungstranskripte indiziert und akzeptieren die zusätzlichen Speicher-/Indexierungskosten | [Konfigurationsreferenz für Memory](/de/reference/memory-config#session-memory-search-experimental) |
| Strukturiertes Planungstool | `tools.experimental.planTool`                         | Sie möchten das strukturierte Tool `update_plan` für die Nachverfolgung mehrstufiger Arbeit in kompatiblen Laufzeiten und UIs verfügbar machen | [Gateway-Konfigurationsreferenz](/de/gateway/config-tools#toolsexperimental)                     |

## Lean-Modus für lokale Modelle

`agents.defaults.experimental.localModelLean: true` ist ein Entlastungsventil
für schwächere Setups mit lokalen Modellen. Es entfernt gewichtige Standard-Tools wie
`browser`, `cron` und `message`, sodass die Prompt-Struktur kleiner und weniger fragil
für Backends mit kleinem Kontextfenster oder strengere OpenAI-kompatible Backends wird.

Das ist absichtlich **nicht** der normale Pfad. Wenn Ihr Backend die vollständige
Laufzeit sauber verarbeitet, lassen Sie dies deaktiviert.

## Experimentell bedeutet nicht verborgen

Wenn eine Funktion experimentell ist, sollte OpenClaw das in der Dokumentation und im
Konfigurationspfad selbst klar sagen. Was es **nicht** tun sollte, ist Vorschauverhalten in einen
stabil wirkenden Standard-Schalter hineinzuschmuggeln und so zu tun, als sei das normal. So werden
Konfigurationsoberflächen unübersichtlich.

## Verwandt

- [Funktionen](/de/concepts/features)
- [Release-Kanäle](/de/install/development-channels)
