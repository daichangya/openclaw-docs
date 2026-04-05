---
read_when:
    - Você precisa de uma referência de configuração de modelo por provider
    - Você quer exemplos de configuração ou comandos de onboarding da CLI para providers de modelo
summary: Visão geral de providers de modelo com exemplos de configuração + fluxos da CLI
title: Providers de modelo
x-i18n:
    generated_at: "2026-04-05T12:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Providers de modelo

Esta página cobre **providers de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelo, consulte [/concepts/models](/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, isso se tornará a allowlist.
- Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- As regras de runtime de fallback, probes de cooldown e persistência de substituição por sessão estão
  documentadas em [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` é metadado nativo do modelo;
  `models.providers.*.models[].contextTokens` é o limite efetivo em runtime.
- Plugins de provider podem injetar catálogos de modelos via `registerProvider({ catalog })`;
  o OpenClaw mescla essa saída em `models.providers` antes de gravar
  `models.json`.
- Manifestos de provider podem declarar `providerAuthEnvVars` para que probes genéricos de
  autenticação baseados em env não precisem carregar o runtime do plugin. O mapa restante
  de variáveis de ambiente centrais agora é apenas para providers centrais/não plugin e alguns casos de precedência genérica, como onboarding da Anthropic com API key em primeiro lugar.
- Plugins de provider também podem ser proprietários do comportamento de runtime do provider via
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` e
  `onModelSelected`.
- Observação: `capabilities` do runtime do provider é um metadado compartilhado do executor (família de provider, particularidades de transcrição/ferramentas, dicas de transporte/cache). Não é o mesmo que o [modelo público de capacidades](/plugins/architecture#public-capability-model), que descreve o que um plugin registra (inferência de texto, fala etc.).

## Comportamento de provider de propriedade do plugin

Plugins de provider agora podem ser proprietários da maior parte da lógica específica do provider, enquanto o OpenClaw mantém
o loop genérico de inferência.

Divisão típica:

- `auth[].run` / `auth[].runNonInteractive`: o provider é proprietário dos fluxos de onboarding/login
  para `openclaw onboard`, `openclaw models auth` e configuração headless
- `wizard.setup` / `wizard.modelPicker`: o provider é proprietário dos rótulos de escolha de autenticação,
  aliases legados, dicas de allowlist no onboarding e entradas de configuração nos seletores de onboarding/modelo
- `catalog`: o provider aparece em `models.providers`
- `normalizeModelId`: o provider normaliza IDs de modelo legados/preview antes da
  busca ou canonização
- `normalizeTransport`: o provider normaliza a família de transporte `api` / `baseUrl`
  antes da montagem genérica do modelo; o OpenClaw verifica primeiro o provider correspondente
  e depois outros plugins de provider com suporte a hook até que um realmente altere o
  transporte
- `normalizeConfig`: o provider normaliza a configuração `models.providers.<id>` antes de
  o runtime usá-la; o OpenClaw verifica primeiro o provider correspondente e depois outros
  plugins de provider com suporte a hook até que um realmente altere a configuração. Se nenhum
  hook de provider reescrever a configuração, os auxiliares incluídos da família Google ainda
  normalizam entradas compatíveis de providers Google.
- `applyNativeStreamingUsageCompat`: o provider aplica reescritas de compatibilidade de uso de streaming nativo orientadas por endpoint para providers de config
- `resolveConfigApiKey`: o provider resolve autenticação de marcador env para providers de config
  sem forçar o carregamento completo da autenticação de runtime. `amazon-bedrock` também tem um
  resolvedor integrado de marcador AWS env aqui, embora a autenticação de runtime do Bedrock use
  a cadeia padrão do SDK da AWS.
- `resolveSyntheticAuth`: o provider pode expor disponibilidade de autenticação local/auto-hospedada
  ou outra autenticação baseada em config sem persistir segredos em texto simples
- `shouldDeferSyntheticProfileAuth`: o provider pode marcar placeholders sintéticos armazenados de perfil
  como de menor precedência do que autenticação com suporte de env/config
- `resolveDynamicModel`: o provider aceita IDs de modelo que ainda não estão presentes no catálogo estático local
- `prepareDynamicModel`: o provider precisa de atualização de metadados antes de tentar novamente a resolução dinâmica
- `normalizeResolvedModel`: o provider precisa de reescritas de transporte ou base URL
- `contributeResolvedModelCompat`: o provider contribui com flags de compatibilidade para seus
  modelos do fornecedor mesmo quando chegam por outro transporte compatível
- `capabilities`: o provider publica particularidades de transcrição/ferramentas/família do provider
- `normalizeToolSchemas`: o provider limpa schemas de ferramentas antes que o executor incorporado os veja
- `inspectToolSchemas`: o provider expõe avisos de schema específicos do transporte
  após a normalização
- `resolveReasoningOutputMode`: o provider escolhe contratos nativos vs marcados
  de saída de raciocínio
- `prepareExtraParams`: o provider define padrões ou normaliza parâmetros de requisição por modelo
- `createStreamFn`: o provider substitui o caminho normal de stream por um transporte
  totalmente personalizado
- `wrapStreamFn`: o provider aplica wrappers de compatibilidade para cabeçalhos/corpo/modelo da requisição
- `resolveTransportTurnState`: o provider fornece cabeçalhos nativos ou metadados
  do transporte por turno
- `resolveWebSocketSessionPolicy`: o provider fornece cabeçalhos nativos de sessão WebSocket
  ou política de cooldown de sessão
- `createEmbeddingProvider`: o provider é proprietário do comportamento de embedding de memória quando ele
  pertence ao plugin do provider em vez do switchboard central de embedding
- `formatApiKey`: o provider formata perfis de autenticação armazenados na string
  `apiKey` esperada pelo transporte em runtime
- `refreshOAuth`: o provider é proprietário da renovação de OAuth quando os renovadores compartilhados
  `pi-ai` não são suficientes
- `buildAuthDoctorHint`: o provider acrescenta orientação de reparo quando a renovação de OAuth
  falha
- `matchesContextOverflowError`: o provider reconhece erros de estouro de janela de contexto
  específicos do provider que heurísticas genéricas deixariam passar
- `classifyFailoverReason`: o provider mapeia erros brutos específicos do provider de transporte/API
  para motivos de failover como rate limit ou sobrecarga
- `isCacheTtlEligible`: o provider decide quais IDs de modelo upstream oferecem suporte a TTL de cache de prompt
- `buildMissingAuthMessage`: o provider substitui a mensagem genérica de erro do armazenamento de autenticação
  por uma dica de recuperação específica do provider
- `suppressBuiltInModel`: o provider oculta linhas upstream obsoletas e pode retornar um
  erro de propriedade do fornecedor para falhas de resolução direta
- `augmentModelCatalog`: o provider acrescenta linhas sintéticas/finais de catálogo após
  descoberta e mesclagem de config
- `isBinaryThinking`: o provider é proprietário da UX binária de pensamento ligado/desligado
- `supportsXHighThinking`: o provider inclui modelos selecionados em `xhigh`
- `resolveDefaultThinkingLevel`: o provider é proprietário da política padrão de `/think` para uma
  família de modelos
- `applyConfigDefaults`: o provider aplica padrões globais específicos do provider
  durante a materialização da config com base no modo de autenticação, env ou família de modelo
- `isModernModelRef`: o provider é proprietário da correspondência de modelo preferido em live/smoke
- `prepareRuntimeAuth`: o provider transforma uma credencial configurada em um token de runtime
  de curta duração
- `resolveUsageAuth`: o provider resolve credenciais de uso/cota para `/usage`
  e superfícies relacionadas de status/relatório
- `fetchUsageSnapshot`: o provider é proprietário da busca/análise do endpoint de uso enquanto o
  core ainda é proprietário da estrutura de resumo e da formatação
- `onModelSelected`: o provider executa efeitos colaterais pós-seleção, como
  telemetria ou bookkeeping de sessão de propriedade do provider

Exemplos incluídos atuais:

- `anthropic`: fallback de compatibilidade futura para Claude 4.6, dicas de reparo de autenticação, busca de
  endpoint de uso, metadados de TTL de cache/família de provider e padrões globais de config sensíveis à autenticação
- `amazon-bedrock`: correspondência de estouro de contexto e classificação de motivo de failover de propriedade do provider para erros específicos do Bedrock de throttle/not-ready, além da família compartilhada de replay `anthropic-by-model` para guardas de política de replay apenas para Claude em tráfego Anthropic
- `anthropic-vertex`: guardas de política de replay apenas para Claude em tráfego
  de mensagens Anthropic
- `openrouter`: IDs de modelo pass-through, wrappers de requisição, dicas de capacidade de provider, sanitização de assinatura de pensamento Gemini em tráfego Gemini via proxy, injeção de raciocínio via proxy pela família de stream `openrouter-thinking`, encaminhamento de metadados de roteamento e política de TTL de cache
- `github-copilot`: onboarding/login do dispositivo, fallback de compatibilidade futura de modelo, dicas de transcrição de pensamento Claude, troca de token em runtime e busca de endpoint de uso
- `openai`: fallback de compatibilidade futura para GPT-5.4, normalização direta de transporte OpenAI, dicas de autenticação ausente com reconhecimento de Codex, supressão de Spark, linhas sintéticas de catálogo OpenAI/Codex, política de thinking/live-model, normalização de aliases de token de uso (`input` / `output` e famílias `prompt` / `completion`), a família compartilhada de stream `openai-responses-defaults` para wrappers nativos OpenAI/Codex e metadados de família de provider
- `google` e `google-gemini-cli`: fallback de compatibilidade futura para Gemini 3.1, validação nativa de replay Gemini, sanitização de replay bootstrap, modo de saída de raciocínio com marcação e correspondência de modelo moderno; o OAuth do Gemini CLI também é proprietário da formatação de token de perfil de autenticação, análise de token de uso e busca de endpoint de cota para superfícies de uso
- `moonshot`: transporte compartilhado, normalização de payload de thinking de propriedade do plugin
- `kilocode`: transporte compartilhado, cabeçalhos de requisição de propriedade do plugin, normalização de payload de raciocínio, sanitização de assinatura de pensamento Gemini via proxy e política de TTL de cache
- `zai`: fallback de compatibilidade futura para GLM-5, padrões `tool_stream`, política de TTL de cache, política de binary-thinking/live-model e autenticação de uso + busca de cota; IDs desconhecidos `glm-5*` são sintetizados a partir do modelo incluído `glm-4.7`
- `xai`: normalização nativa do transporte Responses, reescritas de alias `/fast` para variantes rápidas do Grok, padrão `tool_stream` e limpeza específica do xAI de schema de ferramenta / payload de raciocínio
- `mistral`: metadados de capacidade de propriedade do plugin
- `opencode` e `opencode-go`: metadados de capacidade de propriedade do plugin mais sanitização de assinatura de pensamento Gemini via proxy
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` e `volcengine`: apenas catálogos de propriedade do plugin
- `qwen`: catálogos de propriedade do plugin para modelos de texto mais registros compartilhados de provider para media-understanding e geração de vídeo em suas superfícies multimodais; a geração de vídeo do Qwen usa os endpoints padrão de vídeo DashScope com modelos Wan incluídos, como `wan2.6-t2v` e `wan2.7-r2v`
- `minimax`: catálogos de propriedade do plugin, seleção híbrida de política de replay Anthropic/OpenAI e lógica de autenticação/snapshot de uso
- `xiaomi`: catálogos de propriedade do plugin mais lógica de autenticação/snapshot de uso

O plugin incluído `openai` agora é proprietário de ambos os IDs de provider: `openai` e
`openai-codex`.

Isso cobre providers que ainda se encaixam nos transportes normais do OpenClaw. Um provider
que precisa de um executor de requisição totalmente personalizado é uma superfície de extensão
separada e mais profunda.

## Rotação de API key

- Oferece suporte a rotação genérica de provider para providers selecionados.
- Configure várias chaves via:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave primária)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para providers Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são repetidas com a próxima chave apenas em respostas de rate limit (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não sejam de rate limit falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final é retornado a partir da última tentativa.

## Providers integrados (catálogo pi-ai)

O OpenClaw vem com o catálogo pi-ai. Esses providers não exigem configuração em
`models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O warm-up do WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas `openai/*` de Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser uma camada explícita em vez do alternador compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas ao tráfego nativo OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas OpenAI também mantêm `store` de Responses, dicas de cache de prompt e modelagem de payload de compatibilidade de raciocínio da OpenAI; rotas via proxy não mantêm
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque a API live da OpenAI o rejeita; Spark é tratado como apenas Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` ou `openclaw onboard --auth-choice anthropic-cli`
- Requisições públicas diretas da Anthropic oferecem suporte ao alternador compartilhado `/fast` e `params.fastMode`, incluindo tráfego autenticado por API key e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para Anthropic `service_tier` (`auto` vs `standard_only`)
- Observação de cobrança: a documentação pública do Claude Code da Anthropic ainda inclui o uso direto do Claude Code no terminal nos limites do plano Claude. Separadamente, a Anthropic notificou usuários do OpenClaw em **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que o caminho **OpenClaw** com login Claude conta como uso de harness de terceiros e exige **Extra Usage**, cobrado separadamente da assinatura.
- O setup-token da Anthropic está disponível novamente como um caminho legado/manual do OpenClaw. Use-o esperando que a Anthropic informou aos usuários do OpenClaw que esse caminho exige **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Modelo de exemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas ao tráfego nativo Codex para
  `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` continua disponível quando o catálogo OAuth do Codex o expõe; depende de entitlement
- `openai-codex/gpt-5.4` mantém `contextWindow = 1050000` nativo e um `contextTokens = 272000` padrão em runtime; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: OAuth do OpenAI Codex é explicitamente compatível para ferramentas/fluxos de trabalho externos como o OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Outras opções hospedadas no estilo assinatura

- [Qwen Cloud](/providers/qwen): superfície de provider Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/providers/minimax): OAuth do MiniMax Coding Plan ou acesso por API key
- [GLM Models](/providers/glm): Z.AI Coding Plan ou endpoints gerais de API

### OpenCode

- Auth: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provider de runtime Zen: `opencode`
- Provider de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou o legado `cached_content`) para encaminhar um identificador nativo do provider
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` do OpenClaw

### Google Vertex e Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por continuar.
- O OAuth do Gemini CLI é distribuído como parte do plugin incluído `google`.
  - Instale o Gemini CLI primeiro:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Ative: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3.1-pro-preview`
  - Observação: você **não** cola um client id nem secret em `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a
    `stats`, com `stats.cached` normalizado em `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelo de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  em runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é de propriedade do Kilo Gateway,
  não codificado rigidamente no OpenClaw.

Consulte [/providers/kilocode](/providers/kilocode) para detalhes de configuração.

### Outros plugins de provider incluídos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de exemplo: `openrouter/auto`
- O OpenClaw aplica os cabeçalhos documentados de atribuição de app do OpenRouter apenas quando
  a requisição realmente tem como destino `openrouter.ai`
- Marcadores específicos do OpenRouter de `cache_control` da Anthropic também são restritos a
  rotas OpenRouter verificadas, não a URLs de proxy arbitrárias
- O OpenRouter permanece no caminho em estilo proxy compatível com OpenAI, então modelagem de requisição exclusivamente nativa OpenAI (`serviceTier`, `store` de Responses,
  dicas de cache de prompt, payloads de compatibilidade de raciocínio OpenAI) não é encaminhada
- Referências OpenRouter com suporte Gemini mantêm apenas a sanitização de assinatura de pensamento Gemini via proxy;
  validação nativa de replay Gemini e reescritas bootstrap continuam desativadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/kilo/auto`
- Referências Kilo com suporte Gemini mantêm o mesmo caminho de sanitização de assinatura
  de pensamento Gemini via proxy; `kilocode/kilo/auto` e outras dicas sem suporte a raciocínio por proxy ignoram a injeção de raciocínio por proxy
- MiniMax: `minimax` (API key) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de exemplo: `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- O onboarding/configuração por API key do MiniMax grava definições explícitas do modelo M2.7 com
  `input: ["text", "image"]`; o catálogo incluído do provider mantém as referências de chat
  apenas texto até que essa configuração do provider seja materializada
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de exemplo: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` ou `KIMICODE_API_KEY`)
- Modelo de exemplo: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modelo de exemplo: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` ou `DASHSCOPE_API_KEY`)
- Modelo de exemplo: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modelo de exemplo: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelos de exemplo: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modelo de exemplo: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modelo de exemplo: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Requisições xAI nativas incluídas usam o caminho xAI Responses
  - `/fast` ou `params.fastMode: true` reescrevem `grok-3`, `grok-3-mini`,
    `grok-4` e `grok-4-0709` para suas variantes `*-fast`
  - `tool_stream` vem ativado por padrão; defina
    `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
    desativá-lo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de exemplo: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modelos GLM no Cerebras usam IDs `zai-glm-4.7` e `zai-glm-4.6`.
  - Base URL compatível com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de exemplo do Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulte [Hugging Face (Inference)](/providers/huggingface).

## Providers via `models.providers` (personalizado/base URL)

Use `models.providers` (ou `models.json`) para adicionar providers **personalizados** ou
proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provider incluídos abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a
base URL, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

A Moonshot é distribuída como um plugin de provider incluído. Use o provider integrado por
padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando
precisar substituir a base URL ou metadados do modelo:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como ID de modelo de compatibilidade.

### Volcano Engine (Doubao)

A Volcano Engine (火山引擎) oferece acesso ao Doubao e outros modelos na China.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície coding, mas o catálogo geral `volcengine/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação da Volcengine prefere ambos
os conjuntos `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provider.

Modelos disponíveis:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Internacional)

O BytePlus ARK oferece acesso aos mesmos modelos da Volcano Engine para usuários internacionais.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície coding, mas o catálogo geral `byteplus/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação do BytePlus prefere ambos
os conjuntos `byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provider.

Modelos disponíveis:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

A Synthetic fornece modelos compatíveis com Anthropic por trás do provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Modelo de exemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

O MiniMax é configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/providers/minimax) para detalhes de configuração, opções de modelo e snippets de config.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidades de propriedade do plugin:

- Padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagem é `MiniMax-VL-01` de propriedade do plugin em ambos os caminhos de autenticação MiniMax
- A busca na web permanece no ID de provider `minimax`

### Ollama

O Ollama é distribuído como um plugin de provider incluído e usa a API nativa do Ollama:

- Provider: `ollama`
- Auth: nenhuma necessária (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e depois baixe um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você faz opt-in com
`OLLAMA_API_KEY`, e o plugin de provider incluído adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/providers/ollama)
para onboarding, modo cloud/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um plugin de provider incluído para servidores locais/auto-hospedados compatíveis com OpenAI:

- Provider: `vllm`
- Auth: opcional (depende do seu servidor)
- Base URL padrão: `http://127.0.0.1:8000/v1`

Para fazer opt-in na descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como um plugin de provider incluído para servidores auto-hospedados rápidos compatíveis com OpenAI:

- Provider: `sglang`
- Auth: opcional (depende do seu servidor)
- Base URL padrão: `http://127.0.0.1:30000/v1`

Para fazer opt-in na descoberta automática localmente (qualquer valor funciona se seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulte [/providers/sglang](/providers/sglang) para detalhes.

### Proxies locais (LM Studio, vLLM, LiteLLM etc.)

Exemplo (compatível com OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Observações:

- Para providers personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa como padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provider por papéis `developer` sem suporte.
- Rotas em estilo proxy compatíveis com OpenAI também ignoram modelagem de requisição exclusivamente nativa OpenAI: sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt, sem modelagem de payload de compatibilidade de raciocínio OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints não nativos `openai-completions`.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [/gateway/configuration](/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/concepts/models) — configuração de modelo e aliases
- [Model Failover](/concepts/model-failover) — cadeias de fallback e comportamento de retry
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
- [Providers](/providers) — guias de configuração por provider
