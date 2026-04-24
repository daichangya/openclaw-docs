---
read_when:
    - Sie möchten kürzere Tool-Ergebnisse von `exec` oder `bash` in OpenClaw
    - Sie möchten das gebündelte Plugin Tokenjuice aktivieren
    - Sie müssen verstehen, was Tokenjuice verändert und was unverändert roh bleibt
summary: Rauschende Ergebnisse von Exec- und Bash-Tools mit einem optionalen gebündelten Plugin komprimieren
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T07:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` ist ein optionales gebündeltes Plugin, das rauschende Ergebnisse von `exec`- und `bash`-
Tools komprimiert, nachdem der Befehl bereits ausgeführt wurde.

Es ändert das zurückgegebene `tool_result`, nicht den Befehl selbst. Tokenjuice
schreibt keine Shell-Eingaben um, führt keine Befehle erneut aus und ändert keine Exit-Codes.

Heute gilt dies für eingebettete Pi-Läufe, bei denen Tokenjuice den eingebetteten
`tool_result`-Pfad einhakt und die Ausgabe kürzt, die zurück in die Sitzung geht.

## Das Plugin aktivieren

Schneller Weg:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Entsprechende Alternative:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw liefert das Plugin bereits mit. Es gibt keinen separaten Schritt `plugins install`
oder `tokenjuice install openclaw`.

Wenn Sie die Konfiguration lieber direkt bearbeiten möchten:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Was tokenjuice verändert

- Komprimiert rauschende Ergebnisse von `exec` und `bash`, bevor sie zurück in die Sitzung eingespeist werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Bewahrt exakte Dateiinhalts-Lesevorgänge und andere Befehle, die Tokenjuice roh lassen soll.
- Bleibt Opt-in: Deaktivieren Sie das Plugin, wenn Sie überall wortgetreue Ausgabe möchten.

## Prüfen, ob es funktioniert

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen rauschenden Befehl wie `git status` aus.
4. Prüfen Sie, dass das zurückgegebene Tool-Ergebnis kürzer und strukturierter ist als die rohe Shell-Ausgabe.

## Das Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oder:

```bash
openclaw plugins disable tokenjuice
```

## Verwandt

- [Exec tool](/de/tools/exec)
- [Thinking levels](/de/tools/thinking)
- [Context engine](/de/concepts/context-engine)
