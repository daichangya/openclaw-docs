---
read_when:
    - Você quer usar o Chutes com o OpenClaw
    - Você precisa do fluxo de configuração com OAuth ou chave de API
    - Você quer o modelo padrão, aliases ou comportamento de descoberta
summary: Configuração do Chutes (OAuth ou chave de API, descoberta de modelos, aliases)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T12:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

O [Chutes](https://chutes.ai) expõe catálogos de modelos open-source por meio de uma
API compatível com OpenAI. O OpenClaw oferece suporte tanto a OAuth no navegador quanto à autenticação direta por chave de API
para o provedor empacotado `chutes`.

- Provedor: `chutes`
- API: compatível com OpenAI
- URL base: `https://llm.chutes.ai/v1`
- Autenticação:
  - OAuth via `openclaw onboard --auth-choice chutes`
  - Chave de API via `openclaw onboard --auth-choice chutes-api-key`
  - Variáveis de ambiente de runtime: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Início rápido

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

O OpenClaw inicia o fluxo do navegador localmente, ou mostra uma URL + fluxo de colar o redirecionamento
em hosts remotos/headless. Os tokens OAuth são atualizados automaticamente por meio dos perfis de autenticação do OpenClaw.

Substituições opcionais de OAuth:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### Chave de API

```bash
openclaw onboard --auth-choice chutes-api-key
```

Obtenha sua chave em
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Ambos os caminhos de autenticação registram o catálogo Chutes empacotado e definem o modelo padrão
como `chutes/zai-org/GLM-4.7-TEE`.

## Comportamento de descoberta

Quando a autenticação do Chutes está disponível, o OpenClaw consulta o catálogo do Chutes com essa
credencial e usa os modelos descobertos. Se a descoberta falhar, o OpenClaw volta para um catálogo estático empacotado
para que o onboarding e a inicialização continuem funcionando.

## Aliases padrão

O OpenClaw também registra três aliases de conveniência para o catálogo Chutes
empacotado:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Catálogo inicial integrado

O catálogo de fallback empacotado inclui referências atuais do Chutes, como:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Observações

- Ajuda de OAuth e requisitos do app de redirecionamento: [documentação OAuth do Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
- A descoberta por chave de API e por OAuth usam o mesmo ID de provedor `chutes`.
- Os modelos do Chutes são registrados como `chutes/<model-id>`.
