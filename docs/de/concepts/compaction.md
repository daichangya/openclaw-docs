---
read_when:
    - Sie möchten Auto-Compaction und /compact verstehen
    - Sie beheben Probleme bei langen Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Konversationen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-04-24T06:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

Jedes Modell hat ein Kontextfenster — die maximale Anzahl an Tokens, die es verarbeiten kann.
Wenn sich eine Konversation diesem Limit nähert, führt OpenClaw eine **Compaction**
älterer Nachrichten zu einer Zusammenfassung durch, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Gesprächs-Turns werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungs-Transcript gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Blöcke aufteilt, hält es Tool-Aufrufe des Assistenten
mit ihren passenden `toolResult`-Einträgen zusammen. Wenn ein Trennpunkt
innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze so, dass das Paar zusammenbleibt und
der aktuelle, nicht zusammengefasste Nachlauf erhalten bleibt.

Der vollständige Konversationsverlauf bleibt auf der Festplatte erhalten. Compaction ändert nur, was das
Modell im nächsten Turn sieht.

## Auto-Compaction

Auto-Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit
nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt (in diesem Fall
führt OpenClaw eine Compaction durch und versucht es erneut). Typische Überlauf-Signaturen sind
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` und `ollama error: context length
exceeded`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige
Notizen in [Memory](/de/concepts/memory)-Dateien zu speichern. Dies verhindert Kontextverlust.
</Info>

Verwenden Sie die Einstellung `agents.defaults.compaction` in Ihrer `openclaw.json`, um das Compaction-Verhalten zu konfigurieren (Modus, Ziel-Tokens usw.).
Die Compaction-Zusammenfassung bewahrt standardmäßig opake Identifikatoren (`identifierPolicy: "strict"`). Sie können dies mit `identifierPolicy: "off"` überschreiben oder mit `identifierPolicy: "custom"` und `identifierInstructions` benutzerdefinierten Text angeben.

Optional können Sie über `agents.defaults.compaction.model` ein anderes Modell für die Compaction-Zusammenfassung angeben. Das ist nützlich, wenn Ihr primäres Modell ein lokales oder kleines Modell ist und Sie möchten, dass Compaction-Zusammenfassungen von einem leistungsfähigeren Modell erzeugt werden. Die Überschreibung akzeptiert jede Zeichenfolge im Format `provider/model-id`:

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

Das funktioniert auch mit lokalen Modellen, zum Beispiel mit einem zweiten Ollama-Modell, das für Zusammenfassungen vorgesehen ist, oder mit einem feinabgestimmten Compaction-Spezialisten:

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

Wenn dies nicht gesetzt ist, verwendet Compaction das primäre Modell des Agenten.

## Austauschbare Compaction-Anbieter

Plugins können über `registerCompactionProvider()` in der Plugin-API einen benutzerdefinierten Compaction-Anbieter registrieren. Wenn ein Anbieter registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die integrierte LLM-Pipeline.

Um einen registrierten Anbieter zu verwenden, setzen Sie die Anbieter-ID in Ihrer Konfiguration:

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

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Anbieter erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Identifikatorbewahrung wie der integrierte Pfad, und OpenClaw bewahrt weiterhin den Kontext aktueller Turns und den Suffix-Kontext von geteilten Turns nach der Ausgabe des Anbieters. Wenn der Anbieter fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw auf die integrierte LLM-Zusammenfassung zurück.

## Auto-Compaction (standardmäßig aktiviert)

Wenn sich eine Sitzung dem Kontextfenster des Modells nähert oder es überschreitet, löst OpenClaw die Auto-Compaction aus und kann die ursprüngliche Anfrage mit dem kompaktierten Kontext erneut versuchen.

Sie sehen:

- `🧹 Auto-compaction complete` im ausführlichen Modus
- `/status` zeigt `🧹 Compactions: <count>`

Vor der Compaction kann OpenClaw einen **silent memory flush**-Turn ausführen, um
dauerhafte Notizen auf die Festplatte zu schreiben. Siehe [Memory](/de/concepts/memory) für Details und Konfiguration.

## Manuelle Compaction

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Compaction zu erzwingen. Fügen Sie Anweisungen hinzu, um
die Zusammenfassung zu steuern:

```
/compact Fokus auf die Entscheidungen zum API-Design
```

## Ein anderes Modell verwenden

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

## Compaction-Hinweise

Standardmäßig läuft Compaction still. Um kurze Hinweise anzuzeigen, wenn Compaction
beginnt und wenn sie abgeschlossen ist, aktivieren Sie `notifyUser`:

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

Wenn aktiviert, sieht der Benutzer kurze Statusmeldungen rund um jeden Compaction-Lauf
(zum Beispiel „Kontext wird kompaktiert...“ und „Compaction abgeschlossen“).

## Compaction vs. Pruning

|                  | Compaction                         | Pruning                                  |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| **Was es macht** | Fasst ältere Konversationen zusammen | Kürzt alte Tool-Ergebnisse               |
| **Gespeichert?** | Ja (im Sitzungs-Transcript)        | Nein (nur im Speicher, pro Anfrage)      |
| **Umfang**       | Gesamte Konversation               | Nur Tool-Ergebnisse                      |

[Session Pruning](/de/concepts/session-pruning) ist eine schlankere Ergänzung, die
Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Compaction erfolgt zu oft?** Das Kontextfenster des Modells könnte klein sein, oder Tool-
Ausgaben könnten groß sein. Versuchen Sie,
[Session Pruning](/de/concepts/session-pruning) zu aktivieren.

**Der Kontext fühlt sich nach der Compaction veraltet an?** Verwenden Sie `/compact Focus on <topic>`, um
die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory Flush](/de/concepts/memory), damit Notizen
erhalten bleiben.

**Sie brauchen einen sauberen Neustart?** `/new` startet eine neue Sitzung ohne Compaction.

Für erweiterte Konfiguration (Reserve-Tokens, Bewahrung von Identifikatoren, benutzerdefinierte
Kontext-Engines, serverseitige OpenAI-Compaction) siehe die
[Deep Dive zur Sitzungsverwaltung und Compaction](/de/reference/session-management-compaction).

## Verwandt

- [Sitzung](/de/concepts/session) — Sitzungsverwaltung und Lebenszyklus
- [Session Pruning](/de/concepts/session-pruning) — Kürzen von Tool-Ergebnissen
- [Kontext](/de/concepts/context) — wie Kontext für Agenten-Turns aufgebaut wird
- [Hooks](/de/automation/hooks) — Compaction-Lifecycle-Hooks (before_compaction, after_compaction)
