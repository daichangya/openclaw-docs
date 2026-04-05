---
read_when:
    - Você quer ver quais Skills estão disponíveis e prontas para executar
    - Você quer pesquisar, instalar ou atualizar Skills do ClawHub
    - Você quer depurar binários/env/config ausentes para Skills
summary: Referência da CLI para `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T12:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Inspecione Skills locais e instale/atualize Skills do ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/tools/skills)
- Configuração de Skills: [Skills config](/tools/skills-config)
- Instalações do ClawHub: [ClawHub](/tools/clawhub)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` usam o ClawHub diretamente e instalam no diretório `skills/` do workspace ativo. `list`/`info`/`check` ainda inspecionam as Skills locais visíveis para o workspace e a configuração atuais.

Este comando `install` da CLI baixa pastas de Skills do ClawHub. Instalações de dependências de Skills acionadas pelo gateway a partir do onboarding ou das configurações de Skills usam, em vez disso, o caminho de solicitação separado `skills.install`.

Observações:

- `search [query...]` aceita uma consulta opcional; omita-a para navegar pelo feed de busca padrão do ClawHub.
- `search --limit <n>` limita os resultados retornados.
- `install --force` sobrescreve uma pasta de Skill existente no workspace para o mesmo slug.
- `update --all` atualiza apenas instalações rastreadas do ClawHub no workspace ativo.
- `list` é a ação padrão quando nenhum subcomando é fornecido.
- `list`, `info` e `check` gravam sua saída renderizada em stdout. Com `--json`, isso significa que o payload legível por máquina permanece em stdout para pipes e scripts.
