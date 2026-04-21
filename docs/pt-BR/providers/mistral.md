---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você precisa de onboarding da chave de API do Mistral e referências de modelo
summary: Use modelos Mistral e transcrição Voxtral com OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T13:37:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte ao Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em entendimento de mídia.
O Mistral também pode ser usado para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provedor: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API no [Console do Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passe a chave diretamente:

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

## Catálogo de LLM integrado

Atualmente, o OpenClaw inclui este catálogo Mistral integrado:

| Ref. do modelo                    | Entrada     | Contexto | Saída máx. | Observações                                                      |
| --------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384     | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096      | Código                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000     | Com raciocínio habilitado                                        |

## Transcrição de áudio (Voxtral)

Use Voxtral para transcrição de áudio pelo pipeline de entendimento de mídia.

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
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão para Mistral é `voxtral-mini-latest`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` corresponde ao Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions por meio de `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` expõe rastros completos de pensamento antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API do Mistral:

    | Nível de thinking do OpenClaw                   | `reasoning_effort` do Mistral |
    | ----------------------------------------------- | ----------------------------- |
    | **off** / **minimal**                           | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Outros modelos do catálogo Mistral integrado não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo do Mistral priorizando raciocínio.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    O Mistral pode servir embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e URL base">
    - A autenticação do Mistral usa `MISTRAL_API_KEY`.
    - A URL base do provedor é, por padrão, `https://api.mistral.ai/v1`.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - Z.AI usa autenticação Bearer com sua chave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Entendimento de mídia" href="/tools/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
