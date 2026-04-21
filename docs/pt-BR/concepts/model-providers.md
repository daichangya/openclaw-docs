---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de onboarding da CLI para provedores de modelo
summary: Visão geral dos provedores de modelo com configurações de exemplo + fluxos da CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-21T05:36:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafd4d0da950a4ccdec64f85cf485a7da95da6a858588d43be3f7ac5fd0e05b7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provedores de modelo

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelo, consulte [/concepts/models](/pt-BR/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, isso se torna a allowlist.
- Helpers da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Regras de fallback em runtime, sondas de cooldown e persistência de sobrescrita de sessão estão documentadas em [/concepts/model-failover](/pt-BR/concepts/model-failover).
- `models.providers.*.models[].contextWindow` são metadados nativos do modelo;
  `models.providers.*.models[].contextTokens` é o limite efetivo em runtime.
- Plugins de provedor podem injetar catálogos de modelos via `registerProvider({ catalog })`;
  o OpenClaw mescla essa saída em `models.providers` antes de gravar
  `models.json`.
- Manifestos de provedor podem declarar `providerAuthEnvVars` e
  `providerAuthAliases` para que sondas genéricas de autenticação baseadas em env e variantes de provedor
  não precisem carregar o runtime do plugin. O mapa restante de variáveis de ambiente do core agora
  é apenas para provedores não baseados em plugin/do core e alguns casos de precedência genérica, como
  onboarding Anthropic com prioridade para chave de API.
- Plugins de provedor também podem controlar o comportamento de runtime do provedor por meio de
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
  `supportsAdaptiveThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` e
  `onModelSelected`.
- Observação: o `capabilities` de runtime do provedor são metadados compartilhados do runner (família do provedor, particularidades de transcript/tooling, dicas de transporte/cache). Não é o mesmo que o [modelo público de capability](/pt-BR/plugins/architecture#public-capability-model), que descreve o que um plugin registra (inferência de texto, fala etc.).
- O provedor `codex` empacotado é pareado com o harness de agente Codex empacotado.
  Use `codex/gpt-*` quando quiser login controlado pelo Codex, descoberta de modelos, retomada nativa de thread e execução por app-server. Referências simples `openai/gpt-*` continuam usando o provedor OpenAI e o transporte normal de provedor do OpenClaw.
  Implantações somente com Codex podem desabilitar o fallback automático para PI com
  `agents.defaults.embeddedHarness.fallback: "none"`; consulte
  [Codex Harness](/pt-BR/plugins/codex-harness).

## Comportamento de provedor controlado por plugin

Plugins de provedor agora podem controlar a maior parte da lógica específica do provedor, enquanto o OpenClaw mantém
o loop genérico de inferência.

Divisão típica:

- `auth[].run` / `auth[].runNonInteractive`: o provedor controla os fluxos de onboarding/login
  para `openclaw onboard`, `openclaw models auth` e configuração headless
- `wizard.setup` / `wizard.modelPicker`: o provedor controla rótulos de escolha de autenticação,
  aliases legados, dicas de allowlist de onboarding e entradas de configuração nos seletores de onboarding/modelo
- `catalog`: o provedor aparece em `models.providers`
- `normalizeModelId`: o provedor normaliza ids de modelos legados/preview antes
  de lookup ou canonização
- `normalizeTransport`: o provedor normaliza `api` / `baseUrl` da família de transporte
  antes da montagem genérica do modelo; o OpenClaw verifica primeiro o provedor correspondente,
  depois outros plugins de provedor com suporte a hook até que um realmente altere
  o transporte
- `normalizeConfig`: o provedor normaliza a configuração `models.providers.<id>` antes
  de o runtime usá-la; o OpenClaw verifica primeiro o provedor correspondente, depois outros
  plugins de provedor com suporte a hook até que um realmente altere a configuração. Se nenhum
  hook de provedor reescrever a configuração, helpers empacotados da família Google ainda
  normalizam entradas suportadas de provedores Google.
- `applyNativeStreamingUsageCompat`: o provedor aplica reescritas de compatibilidade de uso de streaming nativo orientadas por endpoint para provedores de configuração
- `resolveConfigApiKey`: o provedor resolve autenticação por marcador de env para provedores de configuração
  sem forçar o carregamento completo da autenticação em runtime. `amazon-bedrock` também possui aqui um
  resolvedor interno de marcador de env da AWS, embora a autenticação de runtime do Bedrock use
  a cadeia padrão do SDK da AWS.
- `resolveSyntheticAuth`: o provedor pode expor disponibilidade de autenticação local/self-hosted ou outra
  autenticação baseada em configuração sem persistir segredos em texto puro
- `shouldDeferSyntheticProfileAuth`: o provedor pode marcar placeholders sintéticos armazenados de perfil
  como de precedência menor do que autenticação baseada em env/configuração
- `resolveDynamicModel`: o provedor aceita ids de modelo ainda não presentes no catálogo estático local
- `prepareDynamicModel`: o provedor precisa de uma atualização de metadados antes de tentar novamente
  a resolução dinâmica
- `normalizeResolvedModel`: o provedor precisa de reescritas de transporte ou URL base
- `contributeResolvedModelCompat`: o provedor contribui com flags de compatibilidade para seus
  modelos de fornecedor mesmo quando chegam por outro transporte compatível
- `capabilities`: o provedor publica particularidades de transcript/tooling/família de provedor
- `normalizeToolSchemas`: o provedor limpa schemas de ferramenta antes que o
  runner embutido os veja
- `inspectToolSchemas`: o provedor expõe avisos de schema específicos do transporte
  após a normalização
- `resolveReasoningOutputMode`: o provedor escolhe contratos de saída de raciocínio
  nativos ou marcados com tags
- `prepareExtraParams`: o provedor define padrões ou normaliza parâmetros de requisição por modelo
- `createStreamFn`: o provedor substitui o caminho normal de stream por um transporte
  totalmente customizado
- `wrapStreamFn`: o provedor aplica wrappers de compatibilidade a cabeçalhos/corpo/modelo da requisição
- `resolveTransportTurnState`: o provedor fornece cabeçalhos nativos de transporte por turno
  ou metadados
- `resolveWebSocketSessionPolicy`: o provedor fornece cabeçalhos de sessão nativos para WebSocket
  ou política de cooldown da sessão
- `createEmbeddingProvider`: o provedor controla o comportamento de embedding de memória quando ele
  pertence ao plugin do provedor em vez do switchboard de embedding do core
- `formatApiKey`: o provedor formata perfis de autenticação armazenados na string
  de `apiKey` em runtime esperada pelo transporte
- `refreshOAuth`: o provedor controla a atualização de OAuth quando os refreshers
  compartilhados de `pi-ai` não são suficientes
- `buildAuthDoctorHint`: o provedor acrescenta orientação de reparo quando a atualização de OAuth
  falha
- `matchesContextOverflowError`: o provedor reconhece erros específicos do provedor de
  estouro de janela de contexto que heurísticas genéricas não detectariam
- `classifyFailoverReason`: o provedor mapeia erros brutos específicos do provedor de transporte/API
  para motivos de failover, como rate limit ou sobrecarga
- `isCacheTtlEligible`: o provedor decide quais ids de modelo upstream suportam TTL de prompt-cache
- `buildMissingAuthMessage`: o provedor substitui o erro genérico do auth-store
  por uma dica de recuperação específica do provedor
- `suppressBuiltInModel`: o provedor oculta linhas upstream desatualizadas e pode retornar um
  erro controlado pelo fornecedor para falhas de resolução direta
- `augmentModelCatalog`: o provedor acrescenta linhas sintéticas/finais ao catálogo após
  descoberta e mesclagem de configuração
- `isBinaryThinking`: o provedor controla a UX de thinking binário ligado/desligado
- `supportsXHighThinking`: o provedor habilita `xhigh` para modelos selecionados
- `supportsAdaptiveThinking`: o provedor habilita `adaptive` para modelos selecionados
- `resolveDefaultThinkingLevel`: o provedor controla a política padrão de `/think` para uma
  família de modelos
- `applyConfigDefaults`: o provedor aplica padrões globais específicos do provedor
  durante a materialização da configuração com base no modo de autenticação, env ou família de modelo
- `isModernModelRef`: o provedor controla a correspondência de modelo preferido para live/smoke
- `prepareRuntimeAuth`: o provedor transforma uma credencial configurada em um token de runtime
  de curta duração
- `resolveUsageAuth`: o provedor resolve credenciais de uso/cota para `/usage`
  e superfícies relacionadas de status/relatórios
- `fetchUsageSnapshot`: o provedor controla a busca/análise do endpoint de uso, enquanto o
  core ainda controla o shell de resumo e a formatação
- `onModelSelected`: o provedor executa efeitos colaterais pós-seleção, como
  telemetria ou bookkeeping de sessão controlado pelo provedor

Exemplos empacotados atuais:

- `anthropic`: fallback de compatibilidade futura do Claude 4.6, dicas de reparo de autenticação, busca de endpoint de uso, metadados de TTL de cache/família de provedor e padrões globais de configuração sensíveis à autenticação
- `amazon-bedrock`: correspondência de estouro de contexto controlada pelo provedor e classificação de motivo de failover para erros específicos do Bedrock de throttle/not-ready, além da família compartilhada de replay `anthropic-by-model` para guards de política de replay somente de Claude em tráfego Anthropic
- `anthropic-vertex`: guards de política de replay somente de Claude em tráfego de mensagens Anthropic
- `openrouter`: ids de modelo pass-through, wrappers de requisição, dicas de capability do provedor, sanitização de assinatura de pensamento Gemini em tráfego Gemini via proxy, injeção de raciocínio do proxy por meio da família de stream `openrouter-thinking`, encaminhamento de metadados de roteamento e política de TTL de cache
- `github-copilot`: onboarding/login por dispositivo, fallback de modelo com compatibilidade futura, dicas de transcript de Claude-thinking, troca de token em runtime e busca de endpoint de uso
- `openai`: fallback de compatibilidade futura do GPT-5.4, normalização direta de transporte OpenAI, dicas de autenticação ausente com reconhecimento de Codex, supressão de Spark, linhas sintéticas de catálogo OpenAI/Codex, política de thinking/modelo live, normalização de aliases de token de uso (`input` / `output` e famílias `prompt` / `completion`), a família compartilhada de stream `openai-responses-defaults` para wrappers nativos de OpenAI/Codex, metadados de família de provedor, registro empacotado de provedor de geração de imagem para `gpt-image-1` e registro empacotado de provedor de geração de vídeo para `sora-2`
- `google` e `google-gemini-cli`: fallback de compatibilidade futura do Gemini 3.1, validação nativa de replay Gemini, sanitização de replay de bootstrap, modo de saída de raciocínio com tags, correspondência de modelo moderno, registro empacotado de provedor de geração de imagem para modelos Gemini image-preview e registro empacotado de provedor de geração de vídeo para modelos Veo; o OAuth do Gemini CLI também controla a formatação de token de perfil de autenticação, a análise de token de uso e a busca de endpoint de cota para superfícies de uso
- `moonshot`: transporte compartilhado, normalização de payload de thinking controlada por plugin
- `kilocode`: transporte compartilhado, cabeçalhos de requisição controlados por plugin, normalização de payload de raciocínio, sanitização de assinatura de pensamento de proxy-Gemini e política de TTL de cache
- `zai`: fallback de compatibilidade futura do GLM-5, padrões de `tool_stream`, política de TTL de cache, política de thinking binário/modelo live e autenticação de uso + busca de cota; ids desconhecidos `glm-5*` são sintetizados a partir do template empacotado `glm-4.7`
- `xai`: normalização nativa de transporte Responses, reescritas de alias `/fast` para variantes rápidas do Grok, `tool_stream` padrão, limpeza específica do xAI de schema de ferramenta / payload de raciocínio e registro empacotado de provedor de geração de vídeo para `grok-imagine-video`
- `mistral`: metadados de capability controlados por plugin
- `opencode` e `opencode-go`: metadados de capability controlados por plugin mais sanitização de assinatura de pensamento de proxy-Gemini
- `alibaba`: catálogo de geração de vídeo controlado por plugin para referências diretas de modelo Wan, como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos controlados por plugin mais registro empacotado de provedor de geração de vídeo para modelos Seedance de texto para vídeo/imagem para vídeo
- `fal`: registro empacotado de provedor de geração de vídeo para registro hospedado de terceiros de provedor de geração de imagem para modelos de imagem FLUX mais registro empacotado de provedor de geração de vídeo para modelos de vídeo hospedados de terceiros
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  apenas catálogos controlados por plugin
- `qwen`: catálogos controlados por plugin para modelos de texto mais registros compartilhados de provedor de compreensão de mídia e geração de vídeo para suas superfícies multimodais; a geração de vídeo do Qwen usa os endpoints padrão de vídeo do DashScope com modelos Wan empacotados, como `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registro de provedor de geração de vídeo controlado por plugin para modelos nativos baseados em tarefa do Runway, como `gen4.5`
- `minimax`: catálogos controlados por plugin, registro empacotado de provedor de geração de vídeo para modelos de vídeo Hailuo, registro empacotado de provedor de geração de imagem para `image-01`, seleção híbrida de política de replay Anthropic/OpenAI e lógica de autenticação/snapshot de uso
- `together`: catálogos controlados por plugin mais registro empacotado de provedor de geração de vídeo para modelos de vídeo Wan
- `xiaomi`: catálogos controlados por plugin mais lógica de autenticação/snapshot de uso

O Plugin `openai` empacotado agora controla ambos os ids de provedor: `openai` e
`openai-codex`.

Isso cobre provedores que ainda se encaixam nos transportes normais do OpenClaw. Um provedor
que precisa de um executor de requisição totalmente customizado é uma superfície de extensão
separada e mais profunda.

## Rotação de chave de API

- Suporta rotação genérica de provedor para provedores selecionados.
- Configure várias chaves por meio de:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescrita live única, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave primária)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são tentadas novamente com a próxima chave somente em respostas de rate limit (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não são de rate limit falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final retornado vem da última tentativa.

## Provedores integrados (catálogo pi-ai)

O OpenClaw inclui o catálogo pi‑ai. Esses provedores não exigem configuração em
`models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, além de `OPENCLAW_LIVE_OPENAI_KEY` (sobrescrita única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Sobrescreva por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O warm-up do WebSocket de OpenAI Responses vem habilitado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário do OpenAI pode ser habilitado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições Responses diretas `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um tier explícito em vez do toggle compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas ao tráfego OpenAI nativo para `api.openai.com`, não
  a proxies genéricos compatíveis com OpenAI
- Rotas OpenAI nativas também mantêm `store` de Responses, dicas de prompt-cache e
  modelagem de payload de compatibilidade de raciocínio da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque a API live da OpenAI o rejeita; Spark é tratado como exclusivo do Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, além de `OPENCLAW_LIVE_ANTHROPIC_KEY` (sobrescrita única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições públicas diretas à Anthropic também suportam o toggle compartilhado `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para Anthropic `service_tier` (`auto` vs `standard_only`)
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que a Anthropic publique uma nova política.
- O token de configuração da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Modelo de exemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Sobrescreva por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições Responses nativas do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas ao tráfego Codex nativo para
  `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo toggle `/fast` e a mesma configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` continua disponível quando o catálogo OAuth do Codex o expõe; dependente de entitlement
- `openai-codex/gpt-5.4` mantém `contextWindow = 1050000` nativo e um `contextTokens = 272000` padrão em runtime; sobrescreva o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: o OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.

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

### Outras opções hospedadas no estilo de assinatura

- [Qwen Cloud](/pt-BR/providers/qwen): superfície de provedor Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): acesso MiniMax Coding Plan via OAuth ou chave de API
- [GLM Models](/pt-BR/providers/glm): endpoints Z.AI Coding Plan ou endpoints gerais de API

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (sobrescrita única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas no Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou o legado `cached_content`) para encaminhar um identificador nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se decidir prosseguir.
- O OAuth do Gemini CLI é distribuído como parte do Plugin `google` empacotado.
  - Instale primeiro o Gemini CLI:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Habilite: `openclaw plugins enable google`
  - Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola um client id nem um secret em `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a
    `stats`, com `stats.cached` normalizado em `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Modelo de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticação: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  de runtime.
- O roteamento exato upstream por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway,
  não codificado de forma fixa no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedor empacotados

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de exemplo: `openrouter/auto`
- O OpenClaw aplica os cabeçalhos documentados de atribuição de app do OpenRouter apenas quando
  a requisição realmente aponta para `openrouter.ai`
- Marcadores específicos do OpenRouter de `cache_control` da Anthropic também são limitados a
  rotas OpenRouter verificadas, não a URLs de proxy arbitrárias
- O OpenRouter permanece no caminho de proxy no estilo compatível com OpenAI, então
  modelagem nativa de requisição exclusiva da OpenAI (`serviceTier`, `store` de Responses,
  dicas de prompt-cache, payloads de compatibilidade de raciocínio OpenAI) não é encaminhada
- Referências OpenRouter baseadas em Gemini mantêm apenas a sanitização de assinatura de pensamento de proxy-Gemini;
  a validação nativa de replay Gemini e as reescritas de bootstrap permanecem desativadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/kilo/auto`
- Referências Kilo baseadas em Gemini mantêm o mesmo caminho de sanitização de assinatura de pensamento de proxy-Gemini; dicas de `kilocode/kilo/auto` e outras dicas de proxy sem suporte a raciocínio por proxy ignoram a injeção de raciocínio por proxy
- MiniMax: `minimax` (chave de API) e `minimax-portal` (OAuth)
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de exemplo: `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- O onboarding/configuração por chave de API do MiniMax grava definições explícitas de modelo M2.7 com
  `input: ["text", "image"]`; o catálogo empacotado do provedor mantém as referências de chat
  apenas como texto até que a configuração desse provedor seja materializada
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de exemplo: `moonshot/kimi-k2.6`
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
  - Requisições xAI nativas empacotadas usam o caminho xAI Responses
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
  - Modelos GLM no Cerebras usam ids `zai-glm-4.7` e `zai-glm-4.6`.
  - URL base compatível com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de exemplo do Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulte [Hugging Face (Inference)](/pt-BR/providers/huggingface).

## Provedores via `models.providers` (personalizado/base URL)

Use `models.providers` (ou `models.json`) para adicionar provedores
**personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor empacotados abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` somente quando quiser sobrescrever a
URL base, cabeçalhos ou lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot vem como Plugin de provedor empacotado. Use o provedor integrado por
padrão, e adicione uma entrada explícita `models.providers.moonshot` somente quando
precisar sobrescrever a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic do Moonshot AI:

- Provedor: `kimi`
- Autenticação: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como id de modelo de compatibilidade.

### Volcano Engine (Doubao)

A Volcano Engine (火山引擎) fornece acesso ao Doubao e outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Autenticação: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `volcengine/*`
é registrado ao mesmo tempo.

Nos seletores de onboarding/configuração de modelo, a escolha de autenticação do Volcengine prioriza tanto
linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor com escopo de provedor vazio.

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

### BytePlus (internacional)

O BytePlus ARK fornece acesso aos mesmos modelos da Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (coding: `byteplus-plan`)
- Autenticação: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `byteplus/*`
é registrado ao mesmo tempo.

Nos seletores de onboarding/configuração de modelo, a escolha de autenticação do BytePlus prioriza tanto
linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor com escopo de provedor vazio.

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

O Synthetic fornece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

- Provedor: `synthetic`
- Autenticação: `SYNTHETIC_API_KEY`
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

- OAuth do MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth do MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Chave de API do MiniMax (global): `--auth-choice minimax-global-api`
- Chave de API do MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desabilita thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capability controlada por plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagem é `MiniMax-VL-01` controlado por plugin em ambos os caminhos de autenticação MiniMax
- A pesquisa na web permanece no id de provedor `minimax`

### LM Studio

O LM Studio é distribuído como Plugin de provedor empacotado que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Depois, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa os endpoints nativos do LM Studio `/api/v1/models` e `/api/v1/models/load`
para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão.
Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é distribuído como Plugin de provedor empacotado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma necessária (servidor local)
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

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por isso com
`OLLAMA_API_KEY`, e o Plugin de provedor empacotado adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para onboarding, modo cloud/local e configuração personalizada.

### vLLM

O vLLM é distribuído como Plugin de provedor empacotado para servidores locais/self-hosted
compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como Plugin de provedor empacotado para servidores self-hosted rápidos
compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulte [/providers/sglang](/pt-BR/providers/sglang) para detalhes.

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
        apiKey: "${LM_API_TOKEN}",
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

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa por padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` não suportados.
- Rotas de proxy no estilo compatível com OpenAI também ignoram a modelagem de requisição nativa exclusiva da OpenAI: sem `service_tier`, sem `store` de Responses, sem dicas de prompt-cache, sem modelagem de payload de compatibilidade de raciocínio OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints `openai-completions` não nativos.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Veja também: [/gateway/configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelos e aliases
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de retry
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
