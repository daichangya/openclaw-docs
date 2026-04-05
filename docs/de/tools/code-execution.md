---
read_when:
    - Sie möchten code_execution aktivieren oder konfigurieren
    - Sie möchten entfernte Analyse ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit entfernter Python-Analyse kombinieren
summary: code_execution -- abgeschirmte entfernte Python-Analyse mit xAI ausführen
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T12:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` führt abgeschirmte entfernte Python-Analyse über die Responses API von xAI aus.
Dies unterscheidet sich von lokalem [`exec`](/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Rechner oder Node aus
- `code_execution` führt Python in der entfernten Sandbox von xAI aus

Verwenden Sie `code_execution` für:

- Berechnungen
- Tabellierung
- schnelle Statistik
- diagrammartige Analyse
- Analyse von Daten, die von `x_search` oder `web_search` zurückgegeben werden

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repo oder gekoppelte
Geräte benötigen. Verwenden Sie dafür [`exec`](/tools/exec).

## Einrichtung

Sie benötigen einen xAI-API-Schlüssel. Einer der folgenden funktioniert:

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

Fragen Sie natürlich und machen Sie die Analyseabsicht ausdrücklich:

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
die vollständige Analyseanfrage und alle Inline-Daten in einem Prompt senden.

## Grenzen

- Dies ist entfernte xAI-Ausführung, keine lokale Prozessausführung.
- Es sollte als flüchtige Analyse behandelt werden, nicht als persistentes Notebook.
- Gehen Sie nicht davon aus, dass Zugriff auf lokale Dateien oder Ihren Workspace besteht.
- Für aktuelle X-Daten verwenden Sie zuerst [`x_search`](/tools/web#x_search).

## Siehe auch

- [Web-Tools](/tools/web)
- [Exec](/tools/exec)
- [xAI](/providers/xai)
