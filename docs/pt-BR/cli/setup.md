---
read_when:
    - Você está fazendo a configuração de primeira execução sem o onboarding completo da CLI
    - Você quer definir o caminho padrão do workspace
summary: Referência da CLI para `openclaw setup` (inicializar configuração + workspace)
title: setup
x-i18n:
    generated_at: "2026-04-05T12:38:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inicializa `~/.openclaw/openclaw.json` e o workspace do agente.

Relacionados:

- Primeiros passos: [Getting started](/pt-BR/start/getting-started)
- Onboarding da CLI: [Onboarding (CLI)](/pt-BR/start/wizard)

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opções

- `--workspace <dir>`: diretório do workspace do agente (armazenado como `agents.defaults.workspace`)
- `--wizard`: executar o onboarding
- `--non-interactive`: executar o onboarding sem prompts
- `--mode <local|remote>`: modo de onboarding
- `--remote-url <url>`: URL WebSocket do Gateway remoto
- `--remote-token <token>`: token do Gateway remoto

Para executar o onboarding via setup:

```bash
openclaw setup --wizard
```

Observações:

- `openclaw setup` simples inicializa configuração + workspace sem o fluxo completo de onboarding.
- O onboarding é executado automaticamente quando qualquer flag de onboarding está presente (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
