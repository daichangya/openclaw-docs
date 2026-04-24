---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer auth por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais estrito
summary: Use OpenAI por chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

A OpenAI fornece APIs para desenvolvedores para modelos GPT. O OpenClaw oferece suporte a três rotas da família OpenAI. O prefixo do modelo seleciona a rota:

- **Chave de API** — acesso direto à OpenAI Platform com cobrança por uso (modelos `openai/*`)
- **Assinatura do Codex via PI** — login do ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)
- **Harness app-server do Codex** — execução nativa do app-server do Codex (modelos `openai/*` mais `agents.defaults.embeddedHarness.runtime: "codex"`)

A OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas e fluxos externos como o OpenClaw.

<Note>
O GPT-5.5 está disponível atualmente no OpenClaw por rotas de assinatura/OAuth:
`openai-codex/gpt-5.5` com o executor PI, ou `openai/gpt-5.5` com o
harness app-server do Codex. O acesso direto por chave de API para `openai/gpt-5.5` é
suportado assim que a OpenAI ativar o GPT-5.5 na API pública; até lá, use um
modelo habilitado para API, como `openai/gpt-5.4`, em configurações com `OPENAI_API_KEY`.
</Note>

<Note>
Ativar o Plugin OpenAI, ou selecionar um modelo `openai-codex/*`, não
ativa o Plugin incluído no pacote do app-server do Codex. O OpenClaw ativa esse Plugin apenas
quando você seleciona explicitamente o harness nativo do Codex com
`embeddedHarness.runtime: "codex"` ou usa uma referência de modelo legada `codex/*`.
</Note>

## Cobertura de recursos no OpenClaw

| Capability da OpenAI      | Superfície no OpenClaw                                    | Status                                                  |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses          | provedor de modelo `openai/<model>`                       | Sim                                                     |
| Modelos de assinatura Codex | `openai-codex/<model>` com OAuth `openai-codex`         | Sim                                                     |
| Harness app-server do Codex | `openai/<model>` com `embeddedHarness.runtime: codex`   | Sim                                                     |
| Busca web no lado do servidor | ferramenta nativa OpenAI Responses                    | Sim, quando a busca web está ativada e nenhum provedor está fixado |
| Imagens                   | `image_generate`                                          | Sim                                                     |
| Vídeos                    | `video_generate`                                          | Sim                                                     |
| Texto para fala           | `messages.tts.provider: "openai"` / `tts`                 | Sim                                                     |
| Fala para texto em lote   | `tools.media.audio` / entendimento de mídia               | Sim                                                     |
| Fala para texto por streaming | Voice Call `streaming.provider: "openai"`            | Sim                                                     |
| Voz em tempo real         | Voice Call `realtime.provider: "openai"` / UI de Controle Talk | Sim                                                 |
| Embeddings                | provedor de embeddings de memória                         | Sim                                                     |

## Primeiros passos

Escolha seu método de auth preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Ideal para:** acesso direto à API e cobrança por uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref de modelo | Rota | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Futura rota direta de API quando a OpenAI ativar o GPT-5.5 na API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` é a rota direta por chave de API da OpenAI, a menos que você force explicitamente
    o harness app-server do Codex. O próprio GPT-5.5 atualmente é apenas de assinatura/OAuth;
    use `openai-codex/*` para OAuth do Codex pelo executor PI padrão.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Requisições ativas à API OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Ideal para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O Codex cloud exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callbacks, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador em localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Defina o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref de modelo | Rota | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth do ChatGPT/Codex via PI | login do Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server do Codex | auth do app-server do Codex |

    <Note>
    Continue usando o id do provedor `openai-codex` para comandos de auth/perfil. O
    prefixo de modelo `openai-codex/*` também é a rota PI explícita para OAuth do Codex.
    Ele não seleciona nem ativa automaticamente o harness app-server do Codex incluído no pacote.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth no navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de auth do agente.
    </Note>

    ### Indicador de status

    O `/status` no chat mostra qual harness embutido está ativo para a sessão
    atual. O harness PI padrão aparece como `Runner: pi (embedded)` e não
    adiciona um badge separado. Quando o harness app-server do Codex incluído no pacote é
    selecionado, `/status` acrescenta o id do harness que não é PI ao lado de `Fast`, por exemplo
    `Fast · codex`. Sessões existentes mantêm o id de harness registrado, então use
    `/new` ou `/reset` após alterar `embeddedHarness` se quiser que `/status`
    reflita uma nova escolha de PI/Codex.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai-codex/gpt-5.5` por OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - limite padrão de `contextTokens` do runtime: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
    </Note>

  </Tab>
</Tabs>

## Geração de imagens

O Plugin `openai` incluído no pacote registra geração de imagens por meio da ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens com chave de API da OpenAI quanto à geração de imagens
com OAuth do Codex por meio da mesma referência de modelo `openai/gpt-image-2`.

| Capability                | Chave de API OpenAI                | OAuth do Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref de modelo             | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | login OAuth do OpenAI Codex          |
| Transporte                | API Images da OpenAI               | backend Codex Responses              |
| Máximo de imagens por requisição | 4                           | 4                                    |
| Modo de edição            | Ativado (até 5 imagens de referência) | Ativado (até 5 imagens de referência) |
| Substituições de tamanho  | Suportadas, incluindo tamanhos 2K/4K | Suportadas, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhada para a API OpenAI Images | Mapeada para um tamanho suportado quando seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de imagem a partir de texto da OpenAI quanto para
edição de imagem. `gpt-image-1` continua utilizável como substituição explícita de modelo, mas novos
fluxos de imagem da OpenAI devem usar `openai/gpt-image-2`.

Para instalações com OAuth do Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, o OpenClaw resolve esse token de
acesso OAuth armazenado e envia requisições de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API nessa
requisição. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints internos/privados compatíveis com OpenAI para imagens bloqueados, a menos que esse opt-in esteja
presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Um pôster de lançamento refinado para o OpenClaw no macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve a forma do objeto, mude o material para vidro translúcido" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O Plugin `openai` incluído no pacote registra geração de vídeo por meio da ferramenta `video_generate`.

| Capability       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Substituições de tamanho | Suportadas                                                                 |
| Outras substituições | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt do GPT-5 para execuções da família GPT-5 em diferentes provedores. Ela se aplica por id de modelo, então `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs compatíveis de GPT-5 recebem a mesma sobreposição. Modelos mais antigos GPT-4.x não recebem.

O harness nativo do Codex incluído no pacote usa o mesmo comportamento de GPT-5 e a mesma sobreposição de Heartbeat por meio das instruções de desenvolvedor do app-server do Codex, então sessões `openai/gpt-5.x` forçadas por `embeddedHarness.runtime: "codex"` mantêm a mesma orientação de continuidade e Heartbeat proativo, mesmo que o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento com tags para persistência de persona, segurança de execução, disciplina no uso de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento específico de canal para resposta e mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre ativada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Ativa a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desativa apenas a camada de estilo amigável |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em tempo de execução, então `"Off"` e `"off"` desativam a camada de estilo amigável.
</Tip>

<Note>
O legado `plugins.entries.openai.config.personality` ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O Plugin `openai` incluído no pacote registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, somente `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para mensagens de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base do TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin `openai` incluído no pacote registra fala para texto em lote por meio
    da superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Suportado pelo OpenClaw em qualquer lugar onde a transcrição de áudio de entrada usa
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canais

    Para forçar OpenAI para transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dicas de idioma e prompt são encaminhadas para a OpenAI quando fornecidas pela
    configuração compartilhada de mídia de áudio ou por requisição de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O Plugin `openai` incluído no pacote registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limite VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Esse provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho em lote de transcrição `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O Plugin `openai` incluído no pacote registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Limite VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Oferece suporte ao Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment`. Oferece suporte a chamadas de ferramenta bidirecionais. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

O provedor `openai` incluído no pacote pode direcionar para um recurso Azure OpenAI para geração de imagem
substituindo a URL base. No caminho de geração de imagem, o OpenClaw
detecta hostnames do Azure em `models.providers.openai.baseUrl` e muda para
o formato de requisição do Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz em tempo real**
em [Voz e fala](#voice-and-speech) para as configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato corporativo do Azure OpenAI
- Você precisa de residência de dados regional ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma tenancy Azure existente

### Configuração

Para geração de imagem com Azure por meio do provedor `openai` incluído no pacote, aponte
`models.providers.openai.baseUrl` para seu recurso Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de imagem do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para requisições de geração de imagem em um host Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de deployment (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada requisição

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão
de requisição de imagem da OpenAI.

<Note>
O roteamento Azure para o caminho de geração de imagem do provedor `openai` requer
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão com deployments
de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica preview ou GA do Azure
para o caminho de geração de imagem do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de deployment

O Azure OpenAI vincula modelos a deployments. Para requisições de geração de imagem do Azure
roteadas pelo provedor `openai` incluído no pacote, o campo `model` no OpenClaw
deve ser o **nome do deployment do Azure** que você configurou no portal do Azure, não
o id público do modelo OpenAI.

Se você criar um deployment chamado `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Um pôster limpo" size=1024x1024 count=1
```

A mesma regra de nome de deployment se aplica a chamadas de geração de imagem roteadas pelo
provedor `openai` incluído no pacote.

### Disponibilidade regional

A geração de imagem do Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar um
deployment e confirme se o modelo específico está disponível na sua região.

### Diferenças de parâmetros

Azure OpenAI e OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas
do modelo. Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma requisição ao Azure falhar com um erro de validação, verifique o
conjunto de parâmetros suportado pelo seu deployment e versão de API específicos no
portal do Azure.

<Note>
Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o accordion **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagem), use o
fluxo de onboarding ou uma configuração dedicada de provedor Azure — `openai.baseUrl` por si só
não adota o formato de API/auth do Azure. Existe um provedor separado
`azure-openai-responses/*`; consulte
o accordion Compaction no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força apenas SSE |
    | `"websocket"` | Força apenas WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [API Realtime com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas de API por streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw ativa aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` para reduzir a latência do primeiro turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma chave compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições da sessão têm prioridade sobre a configuração. Limpar a substituição da sessão na UI de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina isso por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores suportados: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (API Responses)">
    Para modelos diretos OpenAI Responses (`openai/*` em `api.openai.com`), o wrapper de stream Pi-harness do Plugin OpenAI ativa automaticamente Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do harness Pi e aos hooks do provedor OpenAI usados por execuções embutidas. O harness nativo do app-server do Codex gerencia seu próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis, como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desativar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agêntico estrito">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução embutida mais estrito:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - Não trata mais um turno apenas de plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Exibe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Limitado apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos `/v1` compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - Omitem reasoning desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Usam schemas de ferramenta estritos por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm modelagem de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Não forçam schemas de ferramenta estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de auth e regras de reutilização de credenciais.
  </Card>
</CardGroup>
