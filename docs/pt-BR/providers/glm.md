---
read_when:
    - Você quer modelos GLM no OpenClaw
    - Você precisa da convenção de nomenclatura dos modelos e da configuração
summary: Visão geral da família de modelos GLM + como usá-la no OpenClaw
title: Modelos GLM
x-i18n:
    generated_at: "2026-04-05T12:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Modelos GLM

GLM é uma **família de modelos** (não uma empresa) disponível pela plataforma Z.AI. No OpenClaw, os modelos GLM
são acessados por meio do provedor `zai` e de IDs de modelo como `zai/glm-5`.

## Configuração da CLI

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## Trecho de configuração

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` permite que o OpenClaw detecte o endpoint Z.AI correspondente a partir da chave e
aplique automaticamente a URL base correta. Use as opções regionais explícitas quando
quiser forçar uma superfície específica do Coding Plan ou da API geral.

## Modelos GLM empacotados atuais

O OpenClaw atualmente inicializa o provedor empacotado `zai` com estas referências GLM:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Observações

- As versões e a disponibilidade do GLM podem mudar; consulte a documentação da Z.AI para ver as informações mais recentes.
- A referência de modelo empacotado padrão é `zai/glm-5`.
- Para detalhes do provedor, consulte [/providers/zai](/providers/zai).
