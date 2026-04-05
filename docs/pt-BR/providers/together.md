---
read_when:
    - Você quer usar Together AI com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T12:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

O [Together AI](https://together.ai) fornece acesso aos principais modelos de código aberto, incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

- Provedor: `together`
- Autenticação: `TOGETHER_API_KEY`
- API: compatível com OpenAI
- URL base: `https://api.together.xyz/v1`

## Início rápido

1. Defina a chave de API (recomendado: armazená-la para o Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Isso definirá `together/moonshotai/Kimi-K2.5` como o modelo padrão.

## Observação sobre o ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `TOGETHER_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Together empacotado:

| Referência do modelo                                        | Nome                                   | Entrada     | Contexto   | Observações                      |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | text, image | 262,144    | Modelo padrão; raciocínio habilitado |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | text        | 202,752    | Modelo de texto de uso geral     |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modelo rápido de instrução       |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | text        | 131,072    | Modelo de texto geral            |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | text        | 131,072    | Modelo de raciocínio             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | text        | 262,144    | Modelo de texto Kimi secundário  |

A predefinição de onboarding define `together/moonshotai/Kimi-K2.5` como o modelo padrão.
