---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do gateway)
title: update
x-i18n:
    generated_at: "2026-04-05T12:39:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualizando](/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opções

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o alvo do pacote somente para esta atualização. Para instalações por pacote, `main` é mapeado para `github:openclaw/openclaw#main`.
- `--dry-run`: visualiza as ações de atualização planejadas (canal/tag/alvo/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON legível por máquina de `UpdateRunResult`.
- `--timeout <seconds>`: timeout por etapa (o padrão é 1200s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade)

Observação: downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts de código-fonte), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: timeout para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o Gateway
deve ser reiniciado após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: timeout para cada etapa de atualização (padrão `1200`)

## O que ele faz

Quando você troca explicitamente de canal (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere o dist-tag `beta` do npm, mas recai para `latest` quando `beta` está
  ausente ou é mais antigo que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando ativado via configuração) reutiliza esse mesmo caminho de atualização.

## Fluxo de checkout git

Canais:

- `stable`: faz checkout da tag não beta mais recente e depois executa build + doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recai para a tag stable mais recente
  quando `beta` está ausente ou é mais antiga.
- `dev`: faz checkout de `main` e depois fetch + rebase.

Visão geral:

1. Exige um worktree limpo (sem alterações não commitadas).
2. Alterna para o canal selecionado (tag ou branch).
3. Faz fetch do upstream (somente dev).
4. Somente dev: executa lint de preflight + build TypeScript em um worktree temporário; se a ponta falhar, volta até 10 commits para encontrar o build limpo mais recente.
5. Faz rebase sobre o commit selecionado (somente dev).
6. Instala dependências (preferência por pnpm; fallback para npm; bun continua disponível como fallback secundário de compatibilidade).
7. Executa build + build da UI de controle.
8. Executa `openclaw doctor` como verificação final de “atualização segura”.
9. Sincroniza plugins com o canal ativo (dev usa extensões empacotadas; stable/beta usam npm) e atualiza plugins instalados por npm.

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de launcher).

## Veja também

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/install/development-channels)
- [Atualizando](/install/updating)
- [Referência da CLI](/cli)
