---
read_when:
    - Implementando hooks de runtime de provedor, ciclo de vida de canal ou pacotes de empacotamento
    - Depurando a ordem de carregamento de plugins ou o estado do registro
    - Adicionando uma nova capacidade de plugin ou plugin de mecanismo de contexto
summary: 'Arquitetura interna de Plugin: pipeline de carregamento, registro, hooks de runtime, rotas HTTP e tabelas de referência'
title: Arquitetura interna de Plugin
x-i18n:
    generated_at: "2026-04-24T08:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para o modelo público de capacidades, formatos de plugins e contratos de
propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a
referência para a mecânica interna: pipeline de carregamento, registro, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de schema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifests de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação para cada candidato
6. carrega módulos nativos habilitados: módulos empacotados e compilados usam um carregador nativo;
   plugins nativos não compilados usam `jiti`
7. chama hooks nativos `register(api)` e coleta os registros no registro de plugins
8. expõe o registro para comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução em runtime. Os candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho tem permissão de escrita global ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento orientado por manifest

O manifest é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da UI de Controle
- exibir metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` do manifest permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem o registro em runtime, `register(...)` ou `setupEntry`.
Os primeiros consumidores de ativação ativa agora usam dicas de comando, canal e provedor do manifest
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI se restringe a plugins que possuem o comando primário solicitado
- a resolução de setup/plugin de canal se restringe a plugins que possuem o id de
  canal solicitado
- a resolução explícita de setup/runtime de provedor se restringe a plugins que possuem o
  id de provedor solicitado

O planejador de ativação expõe tanto uma API somente com ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas do plano informam por que um plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` do fallback de propriedade do manifest,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivos é o limite de compatibilidade:
os metadados de plugin existentes continuam funcionando, enquanto o novo código pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento em runtime.

A descoberta de setup agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Se mais de
um plugin descoberto reivindicar o mesmo id normalizado de provedor de setup ou backend de CLI,
a busca de setup recusa o proprietário ambíguo em vez de depender da ordem de descoberta.

### O que o carregador mantém em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifests
- registros de plugins carregados

Esses caches reduzem picos de inicialização e a sobrecarga de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não modificam diretamente globais arbitrários do núcleo. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugins (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao plugin

Os recursos centrais então leem desse registro em vez de falar com módulos de plugin
diretamente. Isso mantém o carregamento em uma única direção:

- módulo de plugin -> registro no registro
- runtime central -> consumo do registro

Essa separação é importante para a manutenção. Isso significa que a maioria das superfícies do núcleo só
precisa de um ponto de integração: “ler o registro”, não “tratar cada módulo de plugin
como caso especial”.

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback após uma solicitação de vínculo
ser aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desvinculação, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado após o término do processamento de aprovação pelo núcleo.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados de manifest** para busca barata antes do runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (legado `discovery`) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de thinking, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda controla o loop genérico do agente, failover, manipulação de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico
de provedor sem precisar de um transporte de inferência totalmente personalizado.

Use `providerAuthEnvVars` do manifest quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de auth/status/seletor de modelo devam enxergar sem carregar o runtime
do plugin. Use `providerAuthAliases` do manifest quando um id de provedor deve reutilizar
as variáveis de ambiente, perfis de autenticação, autenticação baseada em config e a escolha de
onboarding por chave de API de outro id de provedor. Use `providerAuthChoices` do manifest
quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer o id de escolha
do provedor, rótulos de grupo e o encadeamento simples de autenticação por uma única flag sem
carregar o runtime do provedor. Mantenha `envVars` de runtime do provedor para dicas voltadas ao operador,
como rótulos de onboarding ou variáveis de configuração de client-id/client-secret do OAuth.

Use `channelEnvVars` do manifest quando um canal tiver autenticação ou setup orientado por env que
fallback genérico de env do shell, verificações de config/status ou prompts de setup devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna “Quando usar” é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                   | O provedor controla um catálogo ou padrões de URL base                                                                                        |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração controlados pelo provedor durante a materialização da configuração      | Os padrões dependem do modo de autenticação, env ou da semântica da família de modelos do provedor                                          |
| --  | _(busca de modelo interna)_       | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de IDs de modelo antes da busca                                         | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                               |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                        | O provedor controla a limpeza do transporte para IDs de provedor personalizados na mesma família de transporte                               |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve viver com o plugin; helpers empacotados da família Google também reforçam entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                 | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                             |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para provedores de configuração antes do carregamento de autenticação em runtime | O provedor tem resolução de chave de API por marcador de env controlada pelo provedor; `amazon-bedrock` também tem aqui um resolvedor interno de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/hospedada por conta própria ou baseada em configuração sem persistir texto simples    | O provedor pode operar com um marcador de credencial sintética/local                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação controlados pelo provedor; o `persistence` padrão é `runtime-only` para credenciais controladas por CLI/app | O provedor reutiliza credenciais de autenticação externas sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders armazenados de perfis sintéticos atrás de autenticação baseada em env/config              | O provedor armazena perfis placeholder sintéticos que não devem ganhar precedência                                                          |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo controlados pelo provedor que ainda não estão no registro local           | O provedor aceita IDs arbitrários de modelos upstream                                                                                        |
| 12  | `prepareDynamicModel`             | Faz aquecimento assíncrono e depois `resolveDynamicModel` é executado novamente                                | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                 |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor embutido usar o modelo resolvido                                           | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                       |
| 14  | `contributeResolvedModelCompat`   | Contribui com flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível      | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                          |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provedor usados pela lógica compartilhada do núcleo      | O provedor precisa de particularidades de transcrição/família de provedor                                                                   |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes de o executor embutido vê-los                                            | O provedor precisa de limpeza de schema da família de transporte                                                                            |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema controlados pelo provedor após a normalização                                      | O provedor quer avisos de palavra-chave sem ensinar ao núcleo regras específicas do provedor                                                |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de reasoning nativo versus marcado                                                  | O provedor precisa de reasoning marcado/saída final em vez de campos nativos                                                                |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opções de stream                      | O provedor precisa de parâmetros de requisição padrão ou limpeza de parâmetros por provedor                                                 |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                              | O provedor precisa de um protocolo de transporte personalizado, não apenas de um wrapper                                                    |
| 21  | `wrapStreamFn`                    | Wrapper de stream após a aplicação dos wrappers genéricos                                                       | O provedor precisa de wrappers de compatibilidade de headers/corpo/modelo de requisição sem um transporte personalizado                     |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno de transporte                                                      | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                    |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de resfriamento da sessão                                        | O provedor quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                              |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado torna-se a string `apiKey` de runtime                | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                             |
| 25  | `refreshOAuth`                    | Sobrescrita de atualização OAuth para endpoints personalizados de atualização ou política de falha na atualização | O provedor não se encaixa nos atualizadores compartilhados de `pi-ai`                                                                       |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                         | O provedor precisa de orientação de reparo de autenticação controlada pelo provedor após falha de atualização                              |
| 27  | `matchesContextOverflowError`     | Correspondência de estouro de janela de contexto controlada pelo provedor                                       | O provedor tem erros brutos de overflow que as heurísticas genéricas não detectariam                                                       |
| 28  | `classifyFailoverReason`          | Classificação do motivo de failover controlada pelo provedor                                                    | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                  |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                      | O provedor precisa de controle de TTL de cache específico para proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Substituição para a mensagem genérica de recuperação de autenticação ausente                                    | O provedor precisa de uma dica específica do provedor para recuperação de autenticação ausente                                              |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário                             | O provedor precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                           |
| 32  | `augmentModelCatalog`             | Linhas de catálogo sintéticas/finais anexadas após a descoberta                                                 | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                             |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis `/think`, rótulos de exibição e padrão específicos do modelo                                | O provedor expõe uma escala de thinking personalizada ou rótulo binário para modelos selecionados                                          |
| 34  | `isBinaryThinking`                | Hook de compatibilidade de alternância de reasoning ligado/desligado                                            | O provedor expõe apenas thinking binário ligado/desligado                                                                                    |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a reasoning `xhigh`                                                        | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para o nível `/think` padrão                                                            | O provedor controla a política padrão de `/think` para uma família de modelos                                                               |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ativo e seleção de smoke                              | O provedor controla a correspondência de modelo preferido para ativo/smoke                                                                    |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência           | O provedor precisa de uma troca de token ou de uma credencial de requisição de curta duração                                                 |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas                     | O provedor precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                      |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor após a resolução da autenticação              | O provedor precisa de um endpoint de uso específico do provedor ou de um parser de payload                                                  |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embedding controlado pelo provedor para memória/busca                                | O comportamento de embedding de memória pertence ao plugin do provedor                                                                       |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento da transcrição para o provedor                       | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de thinking)                                |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                        | O provedor precisa de reescritas de replay específicas do provedor além dos helpers compartilhados de Compaction                            |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem de turnos de replay antes do executor embutido                                 | O transporte do provedor precisa de validação de turno mais estrita após a sanitização genérica                                             |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção controlados pelo provedor                                              | O provedor precisa de telemetria ou de estado controlado pelo provedor quando um modelo se torna ativo                                      |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provedor correspondente e depois passam pelos outros plugins de provedor com suporte a hooks
até que um deles realmente altere o id do modelo ou o transporte/configuração. Isso mantém
os shims de alias/compatibilidade de provedor funcionando sem exigir que o chamador saiba qual
plugin empacotado controla a reescrita. Se nenhum hook de provedor reescrever uma entrada de
configuração compatível da família Google, o normalizador de configuração Google empacotado ainda aplica
essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de transporte totalmente personalizado ou de um executor de requisição personalizado,
essa é uma classe diferente de extensão. Esses hooks são para comportamento de provedor
que ainda é executado no loop normal de inferência do OpenClaw.

### Exemplo de provedor

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemplos internos

Plugins de provedor empacotados combinam os hooks acima para se adaptar às necessidades de catálogo,
autenticação, thinking, replay e uso de cada fornecedor. O conjunto autoritativo de hooks fica em
cada plugin sob `extensions/`; esta página ilustra os formatos em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poder expor ids de modelo upstream
    antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar a troca de token e a integração com `/usage`.
  </Accordion>
  <Accordion title="Famílias de replay e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores adotem
    a política de transcrição por meio de `buildReplayPolicy` em vez de cada plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência compartilhado.
  </Accordion>
  <Accordion title="Helpers de stream específicos do Anthropic">
    Headers beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    interface pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de na
    SDK genérica.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Plugins podem acessar helpers selecionados do núcleo por meio de `api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Observações:

- `textToSpeech` retorna o payload normal de saída TTS do núcleo para superfícies de arquivo/mensagem de voz.
- Usa a configuração central `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de setup controlados pelo fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores com reconhecimento do provedor.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. Microsoft não.

Plugins também podem registrar provedores de fala por meio de `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Observações:

- Mantenha a política de TTS, fallback e entrega de resposta no núcleo.
- Use provedores de fala para comportamento de síntese controlado pelo fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um único plugin de fornecedor pode controlar
  provedores de texto, fala, imagem e futuras mídias à medida que o OpenClaw adicionar esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um único
provedor tipado de compreensão de mídia em vez de um saco genérico chave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Observações:

- Mantenha orquestração, fallback, configuração e encadeamento de canal no núcleo.
- Mantenha o comportamento do fornecedor no plugin do provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos de resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo controla o contrato de capacidade e o helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de funcionalidade/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de compreensão de mídia, plugins podem chamar:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Para transcrição de áudio, plugins podem usar o runtime de compreensão de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração central de áudio de compreensão de mídia (`tools.media.audio`) e a ordem de fallback do provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não suportada).
- `api.runtime.stt.transcribeAudioFile(...)` continua disponível como alias de compatibilidade.

Plugins também podem iniciar execuções em segundo plano de subagentes por meio de `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Observações:

- `provider` e `model` são substituições opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só considera esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback controladas pelo plugin, operadores devem habilitar explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis continuam funcionando, mas solicitações de substituição são rejeitadas em vez de silenciosamente recorrerem a fallback.

Para busca na web, plugins podem consumir o helper compartilhado de runtime em vez de
acessar diretamente o encadeamento de ferramentas do agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins também podem registrar provedores de busca na web por meio de
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no núcleo.
- Use provedores de busca na web para transportes de busca específicos de fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de funcionalidade/canal que precisam de comportamento de busca sem depender do wrapper de ferramenta do agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagem.
- `listProviders(...)`: lista os provedores de geração de imagem disponíveis e suas capacidades.

## Rotas HTTP do Gateway

Plugins podem expor endpoints HTTP com `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos da rota:

- `path`: caminho da rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir a autenticação normal do gateway, ou `"plugin"` para autenticação/validação de Webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operador. Elas servem para Webhooks/validação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas a helpers do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota do plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) só respeitam `x-openclaw-scopes` quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime recorre a `operator.write`
- Regra prática: não suponha que uma rota de plugin autenticada pelo gateway seja implicitamente uma superfície de administrador. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação da SDK de Plugin

Use subcaminhos estreitos da SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos centrais:

| Subcaminho                         | Finalidade                                         |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivas de registro de plugin                   |
| `openclaw/plugin-sdk/channel-core` | Helpers de entrada/construção de canal             |
| `openclaw/plugin-sdk/core`         | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem em uma família de interfaces estreitas — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability` em vez de se misturar entre campos
não relacionados do plugin. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam em subcaminhos `*-runtime`
correspondentes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — é um shim de compatibilidade para
plugins antigos. O novo código deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin empacotado):

- `index.js` — entrada do plugin empacotado
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de setup do plugin

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro plugin a partir do núcleo ou de outro plugin.
Pontos de entrada carregados por facade preferem o snapshot ativo de configuração de runtime quando ele
existe e depois recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins empacotados os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — consulte a página de referência
da SDK relevante ao depender deles.

## Schemas de ferramentas de mensagem

Plugins devem controlar contribuições de schema `describeMessageTool(...)`
específicas do canal para primitivas que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos de provedor para botões, componentes, blocos ou cartões.
Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedor e checklist para autores de plugins.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos semânticos de apresentação (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O núcleo decide se deve renderizar a apresentação nativamente ou degradá-la para texto.
Não exponha rotas de escape de UI nativa do provedor a partir da ferramenta genérica de mensagem.
Helpers obsoletos da SDK para schemas nativos legados continuam exportados para plugins
de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem controlar semânticas de destino específicas do canal. Mantenha o host
de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se uma
  entrada deve pular direto para resolução semelhante a id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o núcleo precisa de uma resolução final controlada pelo provedor após a normalização ou após uma
  falha de busca no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  buscar pares/grupos.
- Use `looksLikeId` para verificações do tipo “tratar isto como um id de destino explícito/nativo”.
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla em diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos da SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir da configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM controlados por lista de permissão
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório por escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta e normalização de id específicas do canal devem permanecer na
implementação do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin controlar ids de modelo específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos internos do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas relacionadas de provedor
- `late`: última passagem, depois dos outros provedores implícitos

Provedores posteriores vencem em caso de colisão de chave, então plugins podem
intencionalmente sobrescrever uma entrada de provedor interna com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se o seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de
  reparo doctor/config, não devem precisar materializar credenciais de runtime só para
  descrever a configuração.

Comportamento recomendado para `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade
  em modo somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem
  correspondente) é suficiente para comandos de status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem “configurado, mas indisponível neste caminho de comando”
em vez de falhar ou relatar incorretamente a conta como não configurada.

## Pacotes de empacotamento

Um diretório de plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se torna um plugin. Se o pacote listar várias extensões, o id do plugin
se tornará `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` fique disponível (`npm install` / `pnpm install`).

Barreira de segurança: cada entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do plugin em
“JS/TS puro” e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém a inicialização e o setup mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um plugin de canal aderir ao mesmo caminho `setupEntry` durante a
fase de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir completamente a superfície de inicialização que deve existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir durante essa mesma janela

Se sua entrada completa ainda controlar alguma capacidade obrigatória de inicialização, não habilite
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato somente de setup que o núcleo
pode consultar antes de o runtime completo do canal ser carregado. A superfície atual
de promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal com conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta nomeada promovida quando contas nomeadas já existem, e pode preservar uma
chave configurada de conta padrão não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm a descoberta da superfície de contrato empacotada preguiçosa.
O tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso em vez
de reentrar na inicialização do canal empacotado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces de administração do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos
para `operator.admin`, mesmo se um plugin solicitar um escopo mais estreito.

Exemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadados de catálogo de canal

Plugins de canal podem anunciar metadados de setup/descoberta por meio de `openclaw.channel` e
dicas de instalação por meio de `openclaw.install`. Isso mantém os dados do catálogo do núcleo livres de dados.

Exemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (auto-hospedado)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat auto-hospedado via bots de Webhook do Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos úteis de `openclaw.channel` além do exemplo mínimo:

- `detailLabel`: rótulo secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: ids de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: faz o canal aderir ao fluxo padrão `allowFrom` de início rápido
- `forceAccountBinding`: exige vínculo explícito de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem
fatos normalizados da origem de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante,
se os metadados esperados de integridade estão presentes e se uma origem de caminho local
também está disponível. Consumidores devem tratar `installSource` como um campo opcional aditivo para que entradas manuais mais antigas e shims de compatibilidade
não precisem sintetizá-lo. Isso permite que onboarding e diagnósticos expliquem
o estado do plano de origem sem importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes simples de pacote e dist-tags ainda funcionam por
compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa evoluir
para instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma
entrada `plugins.installs` com `source: "path"` e um `sourcePath`
relativo ao workspace, quando possível. O caminho operacional absoluto de carregamento permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos locais da estação de trabalho
em configurações de longa duração. Isso mantém instalações locais de desenvolvimento visíveis para
diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminho do sistema de arquivos.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os no seu plugin com
`api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto
em vez de apenas adicionar busca em memória ou hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se o seu mecanismo **não** controlar o algoritmo de Compaction, mantenha `compact()`
implementado e delegue-o explicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adicionando uma nova capacidade

Quando um plugin precisa de um comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado direto. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o núcleo deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada para canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada de capacidade
   útil.
3. conecte consumidores de núcleo + canal/funcionalidade
   Canais e plugins de funcionalidade devem consumir a nova capacidade por meio do núcleo,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends na capacidade.
5. adicione cobertura de contrato
   Adicione testes para que o formato de propriedade e registro permaneça explícito ao longo do tempo.

É assim que o OpenClaw continua opinativo sem se tornar hardcoded para a visão de mundo
de um único provedor. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- executor central/helper de runtime em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- conexão do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime do plugin em `src/plugins/runtime/*` quando plugins de funcionalidade/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, normalmente isso é um sinal de que a capacidade
ainda não está totalmente integrada.

### Modelo de capacidade

Padrão mínimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Padrão de teste de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Isso mantém a regra simples:

- o núcleo controla o contrato de capacidade + a orquestração
- plugins de fornecedor controlam implementações do fornecedor
- plugins de funcionalidade/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionado

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos da SDK de Plugin](/pt-BR/plugins/sdk-subpaths)
- [Setup da SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
