---
read_when:
    - Você quer modelos Xiaomi MiMo no OpenClaw
    - Você precisa configurar `XIAOMI_API_KEY`
summary: Use modelos Xiaomi MiMo com OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T12:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

O Xiaomi MiMo é a plataforma de API para modelos **MiMo**. O OpenClaw usa o
endpoint compatível com OpenAI da Xiaomi com autenticação por chave de API. Crie sua chave de API no
[console do Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) e depois configure o
provedor empacotado `xiaomi` com essa chave.

## Catálogo integrado

- URL base: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Autorização: `Bearer $XIAOMI_API_KEY`

| Referência do modelo   | Entrada     | Contexto  | Saída máxima | Observações                  |
| ---------------------- | ----------- | --------- | ------------ | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192        | Modelo padrão                |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000       | Raciocínio habilitado        |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000       | Multimodal com raciocínio habilitado |

## Configuração da CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# ou de forma não interativa
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Trecho de configuração

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Observações

- Referência de modelo padrão: `xiaomi/mimo-v2-flash`.
- Modelos integrados adicionais: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- O provedor é injetado automaticamente quando `XIAOMI_API_KEY` está definido (ou existe um perfil de autenticação).
- Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) para as regras de provedores.
