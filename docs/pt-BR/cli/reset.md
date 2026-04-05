---
read_when:
    - Você quer apagar o estado local enquanto mantém a CLI instalada
    - Você quer uma simulação do que seria removido
summary: Referência da CLI para `openclaw reset` (redefinir estado/configuração local)
title: reset
x-i18n:
    generated_at: "2026-04-05T12:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Redefina a configuração/estado local (mantém a CLI instalada).

Opções:

- `--scope <scope>`: `config`, `config+creds+sessions` ou `full`
- `--yes`: ignorar prompts de confirmação
- `--non-interactive`: desabilitar prompts; requer `--scope` e `--yes`
- `--dry-run`: imprimir ações sem remover arquivos

Exemplos:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Observações:

- Execute `openclaw backup create` primeiro se quiser um snapshot restaurável antes de remover o estado local.
- Se você omitir `--scope`, `openclaw reset` usa um prompt interativo para escolher o que remover.
- `--non-interactive` só é válido quando `--scope` e `--yes` estão ambos definidos.
