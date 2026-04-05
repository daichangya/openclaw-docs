---
read_when:
    - Você quer usar o Volcano Engine ou modelos Doubao com o OpenClaw
    - Você precisa configurar a chave de API do Volcengine
summary: Configuração do Volcano Engine (modelos Doubao, endpoints gerais e de coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T12:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

O provider Volcengine dá acesso a modelos Doubao e a modelos de terceiros
hospedados no Volcano Engine, com endpoints separados para cargas de trabalho
gerais e de coding.

- Providers: `volcengine` (geral) + `volcengine-plan` (coding)
- Autenticação: `VOLCANO_ENGINE_API_KEY`
- API: compatível com OpenAI

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providers e endpoints

| Provider          | Endpoint                                  | Caso de uso      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos gerais   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de coding |

Ambos os providers são configurados a partir de uma única chave de API. A configuração registra ambos
automaticamente.

## Modelos disponíveis

Provider geral (`volcengine`):

| Model ref                                    | Name                            | Entrada     | Contexto |
| -------------------------------------------- | ------------------------------- | ----------- | -------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256.000  |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256.000  |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256.000  |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200.000  |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128.000  |

Provider de coding (`volcengine-plan`):

| Model ref                                         | Name                     | Entrada | Contexto |
| ------------------------------------------------- | ------------------------ | ------- | -------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text    | 256.000  |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text    | 256.000  |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text    | 200.000  |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text    | 256.000  |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text    | 256.000  |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text    | 256.000  |

`openclaw onboard --auth-choice volcengine-api-key` atualmente define
`volcengine-plan/ark-code-latest` como modelo padrão, ao mesmo tempo que registra
o catálogo geral `volcengine`.

Durante a seleção de modelo no onboarding/configuração, a escolha de autenticação do Volcengine prioriza
linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não
estiverem carregados, o OpenClaw volta ao catálogo sem filtro em vez de mostrar
um seletor vazio com escopo de provider.

## Observação sobre ambiente

Se o Gateway for executado como daemon (launchd/systemd), verifique se
`VOLCANO_ENGINE_API_KEY` está disponível para esse processo (por exemplo, em
`~/.openclaw/.env` ou via `env.shellEnv`).
