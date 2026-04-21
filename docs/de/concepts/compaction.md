---
read_when:
    - Sie möchten automatische Compaction und `/compact` verstehen
    - Sie debuggen lange Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-04-21T06:23:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Jedes Modell hat ein Kontextfenster – die maximale Anzahl an Token, die es verarbeiten kann.
Wenn sich eine Unterhaltung dieser Grenze nähert, führt OpenClaw bei älteren Nachrichten eine **Compaction** durch
und fasst sie zu einer Zusammenfassung zusammen, damit der Chat fortgesetzt werden kann.

## So funktioniert es

1. Ältere Gesprächszüge werden in einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungsprotokoll gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Blöcke aufteilt, hält es Assistant-Tool-
Aufrufe mit ihren zugehörigen `toolResult`-Einträgen zusammen. Wenn ein Teilungspunkt
innerhalb eines Tool-Blocks landet, verschiebt OpenClaw die Grenze, damit das Paar
zusammenbleibt und das aktuelle nicht zusammengefasste Ende erhalten bleibt.

Der vollständige Gesprächsverlauf bleibt auf der Festplatte erhalten. Compaction ändert nur, was das
Modell im nächsten Zug sieht.

## Automatische Compaction

Automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung der Kontextgrenze
nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt (in diesem Fall
führt OpenClaw eine Compaction durch und versucht es erneut). Typische Überlauf-Signaturen sind
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` und `ollama error: context length
exceeded`.

<Info>
Bevor eine Compaction ausgeführt wird, erinnert OpenClaw den Agenten automatisch daran, wichtige
Notizen in [Memory](/de/concepts/memory)-Dateien zu speichern. Das verhindert Kontextverlust.
</Info>

Verwenden Sie die Einstellung `agents.defaults.compaction` in Ihrer `openclaw.json`, um das Compaction-Verhalten zu konfigurieren (Modus, Ziel-Token usw.).
Die Zusammenfassung bei der Compaction bewahrt standardmäßig undurchsichtige Bezeichner (`identifierPolicy: "strict"`). Sie können dies mit `identifierPolicy: "off"` überschreiben oder mit `identifierPolicy: "custom"` und `identifierInstructions` eigenen Text angeben.

Optional können Sie über `agents.defaults.compaction.model` ein anderes Modell für die Zusammenfassung bei der Compaction angeben. Das ist nützlich, wenn Ihr primäres Modell ein lokales oder kleines Modell ist und Sie Zusammenfassungen der Compaction lieber von einem leistungsfähigeren Modell erzeugen lassen möchten. Die Überschreibung akzeptiert jeden String im Format `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Das funktioniert auch mit lokalen Modellen, zum Beispiel mit einem zweiten Ollama-Modell, das für Zusammenfassungen reserviert ist, oder einem feinabgestimmten Compaction-Spezialisten:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Wenn nichts festgelegt ist, verwendet die Compaction das primäre Modell des Agenten.

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen benutzerdefinierten Compaction-Provider registrieren. Wenn ein Provider registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die integrierte LLM-Pipeline.

Um einen registrierten Provider zu verwenden, setzen Sie die Provider-ID in Ihrer Konfiguration:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Das Setzen von `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Bezeichner-Erhaltung wie der integrierte Pfad, und OpenClaw bewahrt nach der Ausgabe des Providers weiterhin den Kontext der letzten Züge und des geteilten Zug-Suffixes. Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw auf die integrierte LLM-Zusammenfassung zurück.

## Automatische Compaction (standardmäßig aktiviert)

Wenn sich eine Sitzung dem Kontextfenster des Modells nähert oder es überschreitet, löst OpenClaw automatische Compaction aus und versucht die ursprüngliche Anfrage gegebenenfalls mit dem kompaktierten Kontext erneut.

Sie sehen:

- `🧹 Auto-compaction complete` im ausführlichen Modus
- `/status` zeigt `🧹 Compactions: <count>`

Vor der Compaction kann OpenClaw einen **stillen Memory-Flush**-Zug ausführen, um
dauerhafte Notizen auf der Festplatte zu speichern. Siehe [Memory](/de/concepts/memory) für Details und Konfiguration.

## Manuelle Compaction

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Compaction zu erzwingen. Fügen Sie Anweisungen hinzu, um
die Zusammenfassung zu steuern:

```
/compact Focus on the API design decisions
```

## Verwendung eines anderen Modells

Standardmäßig verwendet Compaction das primäre Modell Ihres Agenten. Sie können ein leistungsfähigeres
Modell für bessere Zusammenfassungen verwenden:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Hinweise zur Compaction

Standardmäßig läuft Compaction still im Hintergrund. Um kurze Hinweise anzuzeigen, wenn die Compaction
startet und wenn sie abgeschlossen ist, aktivieren Sie `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Wenn dies aktiviert ist, sieht der Benutzer kurze Statusmeldungen rund um jeden Compaction-Durchlauf
(zum Beispiel „Kontext wird komprimiert ...“ und „Compaction abgeschlossen“).

## Compaction vs. Pruning

|                  | Compaction                      | Pruning                          |
| ---------------- | ------------------------------- | -------------------------------- |
| **Was es tut**   | Fasst ältere Unterhaltungen zusammen | Kürzt alte Tool-Ergebnisse       |
| **Gespeichert?** | Ja (im Sitzungsprotokoll)       | Nein (nur im Speicher, pro Anfrage) |
| **Umfang**       | Gesamte Unterhaltung            | Nur Tool-Ergebnisse              |

[Session Pruning](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die
Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Compaction?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-
Ausgaben sind möglicherweise groß. Versuchen Sie,
[Session Pruning](/de/concepts/session-pruning) zu aktivieren.

**Der Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um
die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory-Flush](/de/concepts/memory), damit Notizen
erhalten bleiben.

**Sie brauchen einen sauberen Neustart?** `/new` startet eine neue Sitzung ohne Compaction.

Für die erweiterte Konfiguration (Reserve-Token, Bezeichner-Erhaltung, benutzerdefinierte
Kontext-Engines, serverseitige OpenAI-Compaction) siehe den
[Deep Dive zum Sitzungsmanagement](/de/reference/session-management-compaction).

## Verwandt

- [Session](/de/concepts/session) — Sitzungsverwaltung und Lebenszyklus
- [Session Pruning](/de/concepts/session-pruning) — Kürzen von Tool-Ergebnissen
- [Context](/de/concepts/context) — wie Kontext für Agentenzüge aufgebaut wird
- [Hooks](/de/automation/hooks) — Compaction-Lifecycle-Hooks (before_compaction, after_compaction)
