---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição em tempo real do Voxtral para Voice Call
    - Você precisa de onboarding de chave de API da Mistral e referências de modelo
summary: Use modelos Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T05:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8aec3c47fee12588b28ea2b652b89f0ff136399d25ca47174d7cb6e7b5d5d97f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte à Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em compreensão de mídia.
A Mistral também pode ser usada para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provedor: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API no [Console da Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou informe a chave diretamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Defina um modelo padrão">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo interno de LLM

Atualmente, o OpenClaw inclui este catálogo empacotado da Mistral:

| Ref do modelo | Entrada | Contexto | Saída máxima | Observações |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest` | text, image | 262,144 | 16,384 | Modelo padrão |
| `mistral/mistral-medium-2508` | text, image | 262,144 | 8,192 | Mistral Medium 3.1 |
| `mistral/mistral-small-latest` | text, image | 128,000 | 16,384 | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest` | text, image | 128,000 | 32,768 | Pixtral |
| `mistral/codestral-latest` | text | 256,000 | 4,096 | Coding |
| `mistral/devstral-medium-latest` | text | 262,144 | 32,768 | Devstral 2 |
| `mistral/magistral-small` | text | 128,000 | 40,000 | Com raciocínio habilitado |

## Transcrição de áudio (Voxtral)

Use Voxtral para transcrição de áudio em lote por meio do pipeline de
compreensão de mídia.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão da Mistral é `voxtral-mini-latest`.
</Tip>

## STT em streaming do Voice Call

O plugin empacotado `mistral` registra Voxtral Realtime como provedor de
STT em streaming do Voice Call.

| Configuração | Caminho de configuração | Padrão |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa fallback para `MISTRAL_API_KEY` |
| Modelo | `...mistral.model` | `voxtral-mini-transcribe-realtime-2602` |
| Codificação | `...mistral.encoding` | `pcm_mulaw` |
| Taxa de amostragem | `...mistral.sampleRate` | `8000` |
| Atraso alvo | `...mistral.targetStreamingDelayMs` | `800` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
O OpenClaw usa por padrão STT em tempo real da Mistral com `pcm_mulaw` a 8 kHz para que o Voice Call
possa encaminhar frames de mídia do Twilio diretamente. Use `encoding: "pcm_s16le"` e uma
`sampleRate` correspondente apenas se seu stream upstream já for PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` mapeia para Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` exibe rastros completos de pensamento antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw | `reasoning_effort` da Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal** | `none` |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high` |

    <Note>
    Outros modelos do catálogo empacotado da Mistral não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral voltado primeiro para raciocínio.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    A Mistral pode fornecer embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e URL base">
    - A auth da Mistral usa `MISTRAL_API_KEY`.
    - A URL base do provedor é `https://api.mistral.ai/v1` por padrão.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - Z.AI usa auth Bearer com sua chave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/tools/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
