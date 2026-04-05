---
read_when:
    - Atualizar a UI de configurações de Skills no macOS
    - Alterar o gating ou o comportamento de instalação de Skills
summary: UI de configurações de Skills no macOS e status respaldado pelo gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

O app macOS expõe as Skills do OpenClaw por meio do gateway; ele não analisa Skills localmente.

## Fonte de dados

- `skills.status` (gateway) retorna todas as Skills, além da qualificação e dos requisitos ausentes
  (incluindo blocos de allowlist para Skills integradas).
- Os requisitos são derivados de `metadata.openclaw.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.openclaw.install` define opções de instalação (brew/node/go/uv).
- O app chama `skills.install` para executar instaladores no host do gateway.
- Achados `critical` integrados de código perigoso bloqueiam `skills.install` por padrão; achados suspeitos ainda apenas geram aviso. A substituição de perigoso existe na solicitação ao gateway, mas o fluxo padrão do app permanece fechado por padrão em caso de falha.
- Se todas as opções de instalação forem `download`, o gateway expõe todas as
  opções de download.
- Caso contrário, o gateway escolhe um instalador preferencial usando as preferências
  atuais de instalação e os binários do host: Homebrew primeiro quando
  `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o
  gerenciador de node configurado em `skills.install.nodeManager`, depois
  alternativas posteriores como `go` ou `download`.
- Os rótulos de instalação do Node refletem o gerenciador de node configurado, incluindo `yarn`.

## Chaves de ambiente/API

- O app armazena as chaves em `~/.openclaw/openclaw.json` em `skills.entries.<skillKey>`.
- `skills.update` aplica patches em `enabled`, `apiKey` e `env`.

## Modo remoto

- As atualizações de instalação + configuração acontecem no host do gateway (não no Mac local).
