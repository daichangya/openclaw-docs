---
x-i18n:
    generated_at: "2026-04-05T12:51:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Detalhes de endpoint para o provedor qwen empacotado e sua superfície legada de compatibilidade modelstudio"
read_when:

- Você quer detalhes em nível de endpoint para Qwen Cloud / Alibaba DashScope
- Você precisa do histórico de compatibilidade de variáveis de ambiente para o provedor qwen
- Você quer usar o endpoint Standard (pay-as-you-go) ou Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Esta página documenta o mapeamento de endpoints por trás do provedor `qwen`
empacotado do OpenClaw. O provedor mantém IDs de provedor `modelstudio`, IDs de auth-choice e
refs de modelo funcionando como aliases de compatibilidade, enquanto `qwen` se torna a
superfície canônica.

<Info>

Se você precisa de **`qwen3.6-plus`**, prefira **Standard (pay-as-you-go)**. A
disponibilidade do Coding Plan pode ficar atrás do catálogo público do Model Studio, e a
API do Coding Plan pode rejeitar um modelo até que ele apareça na lista de modelos compatíveis do seu plano.

</Info>

- Provedor: `qwen` (alias legado: `modelstudio`)
- Auth: `QWEN_API_KEY`
- Também aceito: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: compatível com OpenAI

## Início rápido

### Standard (pay-as-you-go)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Endpoint global/internacional
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (assinatura)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint global/internacional
openclaw onboard --auth-choice qwen-api-key
```

IDs legados `modelstudio-*` de auth-choice ainda funcionam como aliases de compatibilidade, mas
os IDs canônicos de onboarding são as opções `qwen-*` mostradas acima.

Após o onboarding, defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Tipos de plano e endpoints

| Plano                      | Região | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (assinatura)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (assinatura)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provedor seleciona automaticamente o endpoint com base na sua auth choice. As opções canônicas
usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode
substituir isso com um `baseUrl` personalizado na config.

Os endpoints nativos do Model Studio anunciam compatibilidade de uso de streaming no
transporte compartilhado `openai-completions`. O OpenClaw agora usa as capacidades do endpoint para isso, de modo que IDs personalizados de provedor compatíveis com DashScope que apontam para os
mesmos hosts nativos herdam o mesmo comportamento de uso de streaming, em vez de
exigir especificamente o ID integrado do provedor `qwen`.

## Obtenha sua chave de API

- **Gerenciar chaves**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentação**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Qwen empacotado:

| Ref do modelo              | Entrada     | Contexto  | Observações                                       |
| -------------------------- | ----------- | --------- | ------------------------------------------------- |
| `qwen/qwen3.5-plus`        | text, image | 1,000,000 | Modelo padrão                                     |
| `qwen/qwen3.6-plus`        | text, image | 1,000,000 | Prefira endpoints Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23`| text        | 262,144   | Linha Qwen Max                                    |
| `qwen/qwen3-coder-next`    | text        | 262,144   | Coding                                            |
| `qwen/qwen3-coder-plus`    | text        | 1,000,000 | Coding                                            |
| `qwen/MiniMax-M2.5`        | text        | 1,000,000 | Raciocínio ativado                                |
| `qwen/glm-5`               | text        | 202,752   | GLM                                               |
| `qwen/glm-4.7`             | text        | 202,752   | GLM                                               |
| `qwen/kimi-k2.5`           | text, image | 262,144   | Moonshot AI via Alibaba                           |

A disponibilidade ainda pode variar por endpoint e plano de cobrança, mesmo quando um modelo está
presente no catálogo empacotado.

A compatibilidade de uso de streaming nativo se aplica tanto aos hosts do Coding Plan quanto
aos hosts Standard compatíveis com DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilidade do Qwen 3.6 Plus

`qwen3.6-plus` está disponível nos endpoints Standard (pay-as-you-go) do Model Studio:

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Se os endpoints do Coding Plan retornarem um erro de "unsupported model" para
`qwen3.6-plus`, mude para Standard (pay-as-you-go) em vez do par
endpoint/chave do Coding Plan.

## Observação sobre ambiente

Se o Gateway for executado como daemon (`launchd`/`systemd`), verifique se
`QWEN_API_KEY` está disponível para esse processo (por exemplo, em
`~/.openclaw/.env` ou via `env.shellEnv`).
