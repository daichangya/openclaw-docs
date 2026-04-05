---
read_when:
    - Sie möchten die automatische Kompaktierung und /compact verstehen
    - Sie debuggen lange Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Kompaktierung
x-i18n:
    generated_at: "2026-04-05T12:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Kompaktierung

Jedes Modell hat ein Kontextfenster -- die maximale Anzahl an Tokens, die es verarbeiten kann.
Wenn sich eine Unterhaltung dieser Grenze nähert, **kompaktiert** OpenClaw ältere Nachrichten
zu einer Zusammenfassung, damit der Chat fortgesetzt werden kann.

## So funktioniert es

1. Ältere Gesprächszüge werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungsprotokoll gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Kompaktierungs-Chunks aufteilt, hält es Assistant-Tool-
Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen. Wenn ein Teilungspunkt
innerhalb eines Tool-Blocks landet, verschiebt OpenClaw die Grenze so, dass das Paar zusammenbleibt und
der aktuelle nicht zusammengefasste Tail erhalten bleibt.

Der vollständige Gesprächsverlauf bleibt auf dem Datenträger erhalten. Die Kompaktierung ändert nur, was das
Modell im nächsten Turn sieht.

## Automatische Kompaktierung

Die automatische Kompaktierung ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung der Kontextgrenze
nähert oder wenn das Modell einen Kontextüberlauffehler zurückgibt (in diesem Fall
kompaktiert OpenClaw und versucht es erneut). Typische Überlaufsignaturen sind
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` und `ollama error: context length
exceeded`.

<Info>
Vor der Kompaktierung erinnert OpenClaw den Agent automatisch daran, wichtige
Notizen in [memory](/concepts/memory)-Dateien zu speichern. Dadurch wird Kontextverlust verhindert.
</Info>

## Manuelle Kompaktierung

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Kompaktierung zu erzwingen. Fügen Sie Anweisungen hinzu, um
die Zusammenfassung zu steuern:

```
/compact Focus on the API design decisions
```

## Ein anderes Modell verwenden

Standardmäßig verwendet die Kompaktierung das primäre Modell Ihres Agents. Sie können ein leistungsfähigeres
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

## Hinweis zum Start der Kompaktierung

Standardmäßig läuft die Kompaktierung still im Hintergrund. Um einen kurzen Hinweis anzuzeigen, wenn die Kompaktierung
startet, aktivieren Sie `notifyUser`:

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

Wenn aktiviert, sieht der Benutzer zu Beginn jedes Kompaktierungslaufs eine kurze Nachricht (zum Beispiel „Kontext wird kompaktiert...“).

## Kompaktierung vs. Pruning

|                  | Kompaktierung                 | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Was es tut**   | Fasst ältere Unterhaltung zusammen | Kürzt alte Tool-Ergebnisse       |
| **Gespeichert?** | Ja (im Sitzungsprotokoll)     | Nein (nur im Speicher, pro Anfrage) |
| **Umfang**       | Gesamte Unterhaltung          | Nur Tool-Ergebnisse              |

[Session pruning](/concepts/session-pruning) ist eine leichtere Ergänzung, die
Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Kompaktierung?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-
Ausgaben sind möglicherweise groß. Versuchen Sie,
[session pruning](/concepts/session-pruning) zu aktivieren.

**Der Kontext fühlt sich nach der Kompaktierung veraltet an?** Verwenden Sie `/compact Focus on <topic>`, um
die Zusammenfassung zu steuern, oder aktivieren Sie den [memory flush](/concepts/memory), damit Notizen
erhalten bleiben.

**Brauchen Sie einen Neuanfang?** `/new` startet eine frische Sitzung ohne Kompaktierung.

Für die erweiterte Konfiguration (Reserve-Tokens, Beibehaltung von Bezeichnern, benutzerdefinierte
Kontext-Engines, serverseitige OpenAI-Kompaktierung) siehe den
[Session Management Deep Dive](/reference/session-management-compaction).

## Verwandt

- [Session](/concepts/session) — Sitzungsverwaltung und Lifecycle
- [Session Pruning](/concepts/session-pruning) — Kürzen von Tool-Ergebnissen
- [Context](/concepts/context) — wie Kontext für Agent-Turns aufgebaut wird
- [Hooks](/automation/hooks) — Hooks für den Kompaktierungs-Lifecycle (before_compaction, after_compaction)
