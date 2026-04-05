---
read_when:
    - Você quer verificar rapidamente a integridade do Gateway em execução
summary: Referência da CLI para `openclaw health` (snapshot de integridade do gateway via RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T12:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Busca a integridade do Gateway em execução.

Opções:

- `--json`: saída legível por máquina
- `--timeout <ms>`: tempo limite de conexão em milissegundos (padrão `10000`)
- `--verbose`: registro detalhado
- `--debug`: alias para `--verbose`

Exemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Observações:

- O `openclaw health` padrão solicita ao gateway em execução seu snapshot de integridade. Quando o
  gateway já tem um snapshot em cache recente, ele pode retornar esse payload em cache e
  atualizar em segundo plano.
- `--verbose` força uma verificação ao vivo, imprime detalhes da conexão do gateway e expande a
  saída legível por humanos para todas as contas e agentes configurados.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
