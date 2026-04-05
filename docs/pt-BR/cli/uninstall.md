---
read_when:
    - Você quer remover o serviço do gateway e/ou o estado local
    - Você quer fazer um dry-run primeiro
summary: Referência da CLI para `openclaw uninstall` (remover o serviço do gateway + dados locais)
title: uninstall
x-i18n:
    generated_at: "2026-04-05T12:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Desinstala o serviço do gateway + dados locais (a CLI permanece).

Opções:

- `--service`: remove o serviço do gateway
- `--state`: remove o estado e a configuração
- `--workspace`: remove diretórios de workspace
- `--app`: remove o app do macOS
- `--all`: remove serviço, estado, workspace e app
- `--yes`: ignora prompts de confirmação
- `--non-interactive`: desabilita prompts; exige `--yes`
- `--dry-run`: imprime as ações sem remover arquivos

Exemplos:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Observações:

- Execute `openclaw backup create` primeiro se quiser um snapshot restaurável antes de remover estado ou workspaces.
- `--all` é uma abreviação para remover serviço, estado, workspace e app juntos.
- `--non-interactive` exige `--yes`.
