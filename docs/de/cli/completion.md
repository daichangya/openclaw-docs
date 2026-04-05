---
read_when:
    - Sie Shell-Completions für zsh/bash/fish/PowerShell möchten
    - Sie Completion-Skripte unter dem OpenClaw-Status zwischenspeichern müssen
summary: CLI-Referenz für `openclaw completion` (Shell-Completion-Skripte generieren/installieren)
title: completion
x-i18n:
    generated_at: "2026-04-05T12:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Generieren Sie Shell-Completion-Skripte und installieren Sie sie optional in Ihr Shell-Profil.

## Verwendung

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Optionen

- `-s, --shell <shell>`: Shell-Ziel (`zsh`, `bash`, `powershell`, `fish`; Standard: `zsh`)
- `-i, --install`: Completion installieren, indem eine Source-Zeile zu Ihrem Shell-Profil hinzugefügt wird
- `--write-state`: Completion-Skript(e) nach `$OPENCLAW_STATE_DIR/completions` schreiben, ohne sie auf stdout auszugeben
- `-y, --yes`: Bestätigungsabfragen bei der Installation überspringen

## Hinweise

- `--install` schreibt einen kleinen Block „OpenClaw Completion“ in Ihr Shell-Profil und verweist dabei auf das zwischengespeicherte Skript.
- Ohne `--install` oder `--write-state` gibt der Befehl das Skript auf stdout aus.
- Bei der Generierung der Completions werden Befehlsbäume eager geladen, sodass verschachtelte Unterbefehle enthalten sind.
