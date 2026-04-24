---
read_when:
    - Sie möchten `code_execution` aktivieren oder konfigurieren
    - Sie möchten Remote-Analyse ohne lokalen Shell-Zugriff
    - Sie möchten `x_search` oder `web_search` mit Remote-Python-Analyse kombinieren
summary: '`code_execution` -- sandboxed Remote-Python-Analyse mit xAI ausführen'
title: Codeausführung
x-i18n:
    generated_at: "2026-04-24T07:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` führt sandboxed Remote-Python-Analyse über die Responses API von xAI aus.
Das unterscheidet sich von lokalem [`exec`](/de/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Rechner oder Ihrer Node aus
- `code_execution` führt Python in der Remote-Sandbox von xAI aus

Verwenden Sie `code_execution` für:

- Berechnungen
- Tabellierung
- schnelle Statistiken
- diagrammartige Analysen
- Analyse von Daten, die von `x_search` oder `web_search` zurückgegeben werden

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repo oder gekoppelte
Geräte benötigen. Verwenden Sie dafür [`exec`](/de/tools/exec).

## Einrichtung

Sie benötigen einen xAI-API-Schlüssel. Jede dieser Möglichkeiten funktioniert:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Beispiel:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Verwendung

Formulieren Sie natürlich und machen Sie die Analyseabsicht explizit:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Das Tool verwendet intern einen einzelnen Parameter `task`, daher sollte der Agent
die vollständige Analyseanfrage und alle Inline-Daten in einem einzigen Prompt senden.

## Grenzen

- Dies ist Remote-Ausführung über xAI, keine lokale Prozessausführung.
- Es sollte als ephemere Analyse behandelt werden, nicht als persistentes Notebook.
- Gehen Sie nicht davon aus, dass lokale Dateien oder Ihr Workspace zugänglich sind.
- Für aktuelle X-Daten verwenden Sie zuerst [`x_search`](/de/tools/web#x_search).

## Verwandt

- [Exec tool](/de/tools/exec)
- [Exec approvals](/de/tools/exec-approvals)
- [apply_patch tool](/de/tools/apply-patch)
- [Web tools](/de/tools/web)
- [xAI](/de/providers/xai)
