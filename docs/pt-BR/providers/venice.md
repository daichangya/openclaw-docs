---
read_when:
    - Você quer inferência com foco em privacidade no OpenClaw
    - Você quer orientações de configuração da Venice AI
summary: Use modelos focados em privacidade da Venice AI no OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T12:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (destaque da Venice)

**Venice** é o nosso destaque de configuração da Venice para inferência privacy-first com acesso anonimizado opcional a modelos proprietários.

A Venice AI oferece inferência de IA focada em privacidade, com suporte a modelos sem censura e acesso aos principais modelos proprietários por meio do proxy anonimizado deles. Toda inferência é privada por padrão — sem treinamento com seus dados, sem registro em log.

## Por que usar Venice no OpenClaw

- **Inferência privada** para modelos open-source (sem logging).
- **Modelos sem censura** quando você precisa deles.
- **Acesso anonimizado** a modelos proprietários (Opus/GPT/Gemini) quando a qualidade importa.
- Endpoints `/v1` compatíveis com OpenAI.

## Modos de privacidade

A Venice oferece dois níveis de privacidade — entender isso é essencial para escolher seu modelo:

| Modo           | Descrição                                                                                                                          | Modelos                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Totalmente privado. Prompts/respostas **nunca são armazenados nem registrados em log**. Efêmero.                                  | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored etc. |
| **Anonymized** | Encaminhado por proxy pela Venice com metadados removidos. O provedor subjacente (OpenAI, Anthropic, Google, xAI) vê solicitações anonimizadas. | Claude, GPT, Gemini, Grok                                     |

## Recursos

- **Focado em privacidade**: escolha entre os modos "private" (totalmente privado) e "anonymized" (via proxy)
- **Modelos sem censura**: acesso a modelos sem restrições de conteúdo
- **Acesso aos principais modelos**: use Claude, GPT, Gemini e Grok via o proxy anonimizado da Venice
- **API compatível com OpenAI**: endpoints `/v1` padrão para integração fácil
- **Streaming**: ✅ compatível em todos os modelos
- **Function calling**: ✅ compatível em modelos selecionados (verifique as capacidades do modelo)
- **Vision**: ✅ compatível em modelos com capacidade de visão
- **Sem limites rígidos de taxa**: limitação por uso justo pode ser aplicada em casos de uso extremo

## Configuração

### 1. Obtenha a chave de API

1. Cadastre-se em [venice.ai](https://venice.ai)
2. Vá para **Settings → API Keys → Create new key**
3. Copie sua chave de API (formato: `vapi_xxxxxxxxxxxx`)

### 2. Configure o OpenClaw

**Opção A: variável de ambiente**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Opção B: configuração interativa (recomendado)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Isso irá:

1. Solicitar sua chave de API (ou usar `VENICE_API_KEY` existente)
2. Mostrar todos os modelos Venice disponíveis
3. Permitir que você escolha seu modelo padrão
4. Configurar o provedor automaticamente

**Opção C: não interativo**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Verifique a configuração

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Seleção de modelo

Após a configuração, o OpenClaw mostra todos os modelos Venice disponíveis. Escolha com base nas suas necessidades:

- **Modelo padrão**: `venice/kimi-k2-5` para raciocínio privado forte com vision.
- **Opção de alta capacidade**: `venice/claude-opus-4-6` para o caminho anonimizado Venice mais forte.
- **Privacidade**: escolha modelos "private" para inferência totalmente privada.
- **Capacidade**: escolha modelos "anonymized" para acessar Claude, GPT, Gemini via o proxy da Venice.

Altere seu modelo padrão a qualquer momento:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Liste todos os modelos disponíveis:

```bash
openclaw models list | grep venice
```

## Configure via `openclaw configure`

1. Execute `openclaw configure`
2. Selecione **Model/auth**
3. Escolha **Venice AI**

## Qual modelo devo usar?

| Caso de uso                 | Modelo recomendado              | Motivo                                       |
| --------------------------- | ------------------------------- | -------------------------------------------- |
| **Chat geral (padrão)**     | `kimi-k2-5`                     | Raciocínio privado forte com vision          |
| **Melhor qualidade geral**  | `claude-opus-4-6`               | Opção Venice anonimizada mais forte          |
| **Privacidade + coding**    | `qwen3-coder-480b-a35b-instruct`| Modelo privado de coding com contexto grande |
| **Vision privada**          | `kimi-k2-5`                     | Suporte a vision sem sair do modo private    |
| **Rápido + barato**         | `qwen3-4b`                      | Modelo leve de raciocínio                    |
| **Tarefas privadas complexas** | `deepseek-v3.2`               | Raciocínio forte, mas sem suporte a ferramentas da Venice |
| **Sem censura**             | `venice-uncensored`             | Sem restrições de conteúdo                   |

## Modelos disponíveis (41 no total)

### Modelos Private (26) - Totalmente privados, sem logging

| ID do modelo                           | Nome                                | Contexto | Recursos                   |
| -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Padrão, raciocínio, vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Raciocínio                 |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Geral                      |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Geral                      |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Geral, ferramentas desativadas |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Raciocínio                 |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Geral                      |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Coding                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Coding                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Raciocínio, vision         |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Geral                      |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Rápido, raciocínio         |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Raciocínio, ferramentas desativadas |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Sem censura, ferramentas desativadas |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Geral                      |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Geral                      |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Raciocínio                 |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Geral                      |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Raciocínio                 |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Raciocínio                 |
| `zai-org-glm-5`                        | GLM 5                               | 198k     | Raciocínio                 |
| `minimax-m21`                          | MiniMax M2.1                        | 198k     | Raciocínio                 |
| `minimax-m25`                          | MiniMax M2.5                        | 198k     | Raciocínio                 |

### Modelos Anonymized (15) - Via proxy da Venice

| ID do modelo                        | Nome                           | Contexto | Recursos                 |
| ----------------------------------- | ------------------------------ | -------- | ------------------------ |
| `claude-opus-4-6`                   | Claude Opus 4.6 (via Venice)   | 1M       | Raciocínio, vision       |
| `claude-opus-4-5`                   | Claude Opus 4.5 (via Venice)   | 198k     | Raciocínio, vision       |
| `claude-sonnet-4-6`                 | Claude Sonnet 4.6 (via Venice) | 1M       | Raciocínio, vision       |
| `claude-sonnet-4-5`                 | Claude Sonnet 4.5 (via Venice) | 198k     | Raciocínio, vision       |
| `openai-gpt-54`                     | GPT-5.4 (via Venice)           | 1M       | Raciocínio, vision       |
| `openai-gpt-53-codex`               | GPT-5.3 Codex (via Venice)     | 400k     | Raciocínio, vision, coding |
| `openai-gpt-52`                     | GPT-5.2 (via Venice)           | 256k     | Raciocínio               |
| `openai-gpt-52-codex`               | GPT-5.2 Codex (via Venice)     | 256k     | Raciocínio, vision, coding |
| `openai-gpt-4o-2024-11-20`          | GPT-4o (via Venice)            | 128k     | Vision                   |
| `openai-gpt-4o-mini-2024-07-18`     | GPT-4o Mini (via Venice)       | 128k     | Vision                   |
| `gemini-3-1-pro-preview`            | Gemini 3.1 Pro (via Venice)    | 1M       | Raciocínio, vision       |
| `gemini-3-pro-preview`              | Gemini 3 Pro (via Venice)      | 198k     | Raciocínio, vision       |
| `gemini-3-flash-preview`            | Gemini 3 Flash (via Venice)    | 256k     | Raciocínio, vision       |
| `grok-41-fast`                      | Grok 4.1 Fast (via Venice)     | 1M       | Raciocínio, vision       |
| `grok-code-fast-1`                  | Grok Code Fast 1 (via Venice)  | 256k     | Raciocínio, coding       |

## Descoberta de modelos

O OpenClaw descobre automaticamente modelos a partir da API da Venice quando `VENICE_API_KEY` está definido. Se a API estiver inacessível, ele recorre a um catálogo estático.

O endpoint `/models` é público (não requer auth para listagem), mas a inferência exige uma chave de API válida.

## Suporte a streaming e ferramentas

| Recurso              | Suporte                                                 |
| -------------------- | ------------------------------------------------------- |
| **Streaming**        | ✅ Todos os modelos                                     |
| **Function calling** | ✅ A maioria dos modelos (verifique `supportsFunctionCalling` na API) |
| **Vision/Images**    | ✅ Modelos marcados com o recurso "Vision"              |
| **Modo JSON**        | ✅ Compatível via `response_format`                     |

## Preços

A Venice usa um sistema baseado em créditos. Consulte [venice.ai/pricing](https://venice.ai/pricing) para os preços atuais:

- **Modelos Private**: custo geralmente mais baixo
- **Modelos Anonymized**: semelhante ao preço da API direta + pequena taxa da Venice

## Comparação: Venice vs API direta

| Aspecto      | Venice (Anonymized)            | API direta          |
| ------------ | ------------------------------ | ------------------- |
| **Privacidade** | Metadados removidos, anonimizado | Sua conta vinculada |
| **Latência** | +10-50ms (proxy)               | Direta              |
| **Recursos** | A maioria dos recursos compatível | Recursos completos  |
| **Cobrança** | Créditos Venice                | Cobrança do provedor |

## Exemplos de uso

```bash
# Use o modelo private padrão
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use modelo sem censura
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use modelo com vision com imagem
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use modelo de coding
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Solução de problemas

### Chave de API não reconhecida

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Verifique se a chave começa com `vapi_`.

### Modelo não disponível

O catálogo de modelos da Venice é atualizado dinamicamente. Execute `openclaw models list` para ver os modelos disponíveis no momento. Alguns modelos podem ficar temporariamente offline.

### Problemas de conexão

A API da Venice está em `https://api.venice.ai/api/v1`. Verifique se sua rede permite conexões HTTPS.

## Exemplo de arquivo de config

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Links

- [Venice AI](https://venice.ai)
- [Documentação da API](https://docs.venice.ai)
- [Preços](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
