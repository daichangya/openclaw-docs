---
read_when:
    - Você quer autocompletar do shell para zsh/bash/fish/PowerShell
    - Você precisa armazenar em cache scripts de autocompletar no estado do OpenClaw
summary: Referência de CLI para `openclaw completion` (gerar/instalar scripts de autocompletar do shell)
title: completion
x-i18n:
    generated_at: "2026-04-05T12:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Gere scripts de autocompletar do shell e, opcionalmente, instale-os no perfil do seu shell.

## Uso

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opções

- `-s, --shell <shell>`: destino do shell (`zsh`, `bash`, `powershell`, `fish`; padrão: `zsh`)
- `-i, --install`: instala o autocompletar adicionando uma linha `source` ao perfil do seu shell
- `--write-state`: grava script(s) de autocompletar em `$OPENCLAW_STATE_DIR/completions` sem imprimir em stdout
- `-y, --yes`: ignora prompts de confirmação de instalação

## Observações

- `--install` grava um pequeno bloco "OpenClaw Completion" no perfil do seu shell e o aponta para o script em cache.
- Sem `--install` ou `--write-state`, o comando imprime o script em stdout.
- A geração de autocompletar carrega de forma antecipada as árvores de comandos para que subcomandos aninhados sejam incluídos.
