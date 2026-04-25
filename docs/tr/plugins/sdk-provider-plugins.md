---
read_when:
    - Yeni bir model sağlayıcı Plugin'i oluşturuyorsunuz
    - OpenAI uyumlu bir proxy veya özel LLM'yi OpenClaw'a eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekiyor
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin'i oluşturma adım adım kılavuzu
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-25T13:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Bu kılavuz, OpenClaw'a bir model sağlayıcısı
(LLM) ekleyen bir sağlayıcı Plugin'i oluşturmayı adım adım anlatır. Sonunda model kataloğu,
API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri modelleri OpenClaw'ın normal çıkarım döngüsüne ekler. Eğer modelin
  thread'lere, Compaction'a veya araç
  olaylarına sahip olan yerel bir ajan daemon'ı üzerinden çalışması gerekiyorsa, daemon protokol ayrıntılarını çekirdeğe koymak yerine sağlayıcıyı bir [ajan bağlayıcısı](/tr/plugins/sdk-agent-harness)
  ile eşleştirin.
</Tip>

## Adım adım

<Steps>
  <Step title="Paket ve manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifest, OpenClaw'ın
    Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` bildirir.
    Bir sağlayıcı varyantının başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanması gerektiğinde `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı kancaları var olmadan önce
    `acme-large` gibi kısaltılmış model kimliklerinden sağlayıcı Plugin'inizi OpenClaw'ın otomatik yüklemesine izin verir. Sağlayıcıyı ClawHub'da yayımlarsanız, bu `openclaw.compat` ve `openclaw.build` alanları
    `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydet">
    Minimal bir sağlayıcı için `id`, `label`, `auth` ve `catalog` gerekir:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Bu çalışan bir sağlayıcıdır. Kullanıcılar artık
    `openclaw onboard --acme-ai-api-key <key>` komutunu çalıştırabilir ve
    modelleri olarak `acme-ai/acme-large` seçebilir.

    Yukarı akış sağlayıcı OpenClaw'dan farklı denetim token'ları kullanıyorsa, akış yolunu değiştirmek yerine
    küçük bir çift yönlü metin dönüşümü ekleyin:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input`, son sistem istemini ve metin mesaj içeriğini
    taşımadan önce yeniden yazar. `output`, asistan metin deltalarını ve son metni, OpenClaw kendi
    denetim işaretleyicilerini veya kanal teslimini ayrıştırmadan önce yeniden yazar.

    Yalnızca API anahtarı
    kimlik doğrulamasına sahip bir metin sağlayıcısı ve tek katalog destekli çalışma zamanı kaydeden paketlenmiş sağlayıcılar için,
    daha dar `defineSingleProviderPluginEntry(...)` yardımcısını tercih edin:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider`, OpenClaw gerçek
    sağlayıcı kimlik doğrulamasını çözebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif yapabilir. Kimlik doğrulama
    yapılandırılmadan önce gösterilmesi güvenli çevrimdışı satırlar için yalnızca `buildStaticProvider` kullanın; kimlik bilgileri gerektirmemeli veya ağ isteği yapmamalıdır.
    OpenClaw'ın `models list --all` görüntüsü şu anda statik katalogları
    yalnızca paketlenmiş sağlayıcı Plugin'leri için, boş bir yapılandırma, boş ortam ve
    ajan/çalışma alanı yolları olmadan yürütür.

    Kimlik doğrulama akışınızın ilk kurulum sırasında `models.providers.*`, takma adlar ve
    ajan varsayılan modelini de yamalaması gerekiyorsa,
    `openclaw/plugin-sdk/provider-onboard` içindeki ön ayar yardımcılarını kullanın. En dar yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` yardımcılarıdır.

    Bir sağlayıcının yerel uç noktası normal
    `openai-completions` taşıması üzerinde akışlı kullanım bloklarını desteklediğinde, sağlayıcı kimliği denetimlerini sabit kodlamak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)` desteği
    uç nokta yetenek eşlemesinden algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar, bir Plugin özel bir sağlayıcı kimliği kullanıyor olsa bile
    yine katılım sağlar.

  </Step>

  <Step title="Dinamik model çözümleme ekle">
    Sağlayıcınız keyfi model kimliklerini kabul ediyorsa (bir proxy veya yönlendirici gibi),
    `resolveDynamicModel` ekleyin:

    ```typescript
    api.registerProvider({
      // ... yukarıdaki id, label, auth, catalog

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Çözümleme bir ağ çağrısı gerektiriyorsa, eşzamansız
    ön ısıtma için `prepareDynamicModel` kullanın — `resolveDynamicModel`, bu tamamlandıktan sonra yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı kancaları ekle (gerektikçe)">
    Çoğu sağlayıcının yalnızca `catalog` + `resolveDynamicModel` gerekir. Sağlayıcınız gerektirdikçe
    kancaları artımlı olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın yeniden oynatma/araç uyumluluğu
    ailelerini kapsıyor; bu nedenle Plugin'lerin genellikle her kancayı tek tek elle bağlaması gerekmez:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Bugün kullanılabilen yeniden oynatma aileleri:

    | Aile | Bağladıkları | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşımalar için paylaşılan OpenAI tarzı yeniden oynatma ilkesi; araç çağrısı kimliği temizleme, asistan önce sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerde genel Gemini dönüş doğrulaması dahil | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude farkındalıklı yeniden oynatma ilkesi; böylece Anthropic message taşımaları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking blok temizliğini alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini yeniden oynatma ilkesi artı bootstrap yeniden oynatma temizliği ve etiketli reasoning-output modu | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca Claude thinking blok düşürme davranışı Anthropic tarafıyla sınırlı kalır | `minimax` |

    Bugün kullanılabilen akış aileleri:

    | Aile | Bağladıkları | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini thinking payload normalleştirmesi | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri eklenen thinking'i atlayacak şekilde | `kilocode` |
    | `moonshot-thinking` | Yapılandırma + `/think` seviyesinden Moonshot ikili yerel thinking payload eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax fast-mode model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: attribution başlıkları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning uyumluluk payload şekillendirmesi ve Responses bağlam yönetimi | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy yolları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadıkça araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile oluşturucularını besleyen SDK seam'leri">
      Her aile oluşturucu, aynı paketten dışa aktarılan daha düşük seviyeli genel yardımcıların bileşiminden oluşur; bir sağlayıcının ortak desenin dışına çıkması gerektiğinde bunlara başvurabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham yeniden oynatma oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini yeniden oynatma yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` ve paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) ile paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, alttaki Gemini şema yardımcıları (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) ve xAI uyumluluk yardımcıları (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Paketlenmiş xAI Plugin'i, xAI kurallarının sağlayıcıya ait kalmasını sağlamak için bunlarla birlikte `normalizeResolvedModel` + `contributeResolvedModelCompat` kullanır.

      Bazı akış yardımcıları bilerek sağlayıcıya yerel kalır. `@openclaw/anthropic-provider`, Claude OAuth beta işleme ve `context1m` kapılamasını kodladıkları için `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük seviyeli Anthropic sarmalayıcı oluşturucularını kendi genel `api.ts` / `contract-api.ts` seam'i içinde tutar. xAI Plugin'i de yerel xAI Responses şekillendirmesini kendi `wrapStreamFn` içinde tutar (`/fast` takma adları, varsayılan `tool_stream`, desteklenmeyen strict-tool temizliği, xAI'ye özgü reasoning payload kaldırma).

      Aynı paket kökü deseni `@openclaw/openai-provider` (sağlayıcı oluşturucuları, varsayılan model yardımcıları, realtime sağlayıcı oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucusu ile ilk kurulum/yapılandırma yardımcıları) için de temel sağlar.
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Her çıkarım çağrısından önce token exchange gerektiren sağlayıcılar için:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Özel başlıklar">
        Özel istek başlıklarına veya gövde değişikliklerine ihtiyaç duyan sağlayıcılar için:

        ```typescript
        // wrapStreamFn, ctx.streamFn'den türetilen bir StreamFn döndürür
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Yerel taşıma kimliği">
        Genel HTTP veya WebSocket taşımaları üzerinde yerel istek/oturum başlıkları veya meta veri gerektiren sağlayıcılar için:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Kullanım ve faturalama">
        Kullanım/faturalama verisi açığa çıkaran sağlayıcılar için:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Kullanılabilir tüm sağlayıcı kancaları">
      OpenClaw kancaları şu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Kanca | Ne zaman kullanılmalı |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya base URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Arama öncesi eski/preview model-id takma adı temizliği |
      | 4 | `normalizeTransport` | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştirme |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanım uyumluluğu yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env-marker kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/self-hosted veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik saklı profil yer tutucularını env/config auth arkasına düşürme |
      | 10 | `resolveDynamicModel` | Keyfi yukarı akış model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümleme öncesi eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce taşıma yeniden yazımları |
      | 13 | `contributeResolvedModelCompat` | Başka uyumlu bir taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları |
      | 14 | `capabilities` | Eski statik yetenek paketi; yalnızca uyumluluk için |
      | 15 | `normalizeToolSchemas` | Kayıt öncesi sağlayıcıya ait araç şeması temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcıya ait araç şeması tanılamaları |
      | 17 | `resolveReasoningOutputMode` | Etiketli ve yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn taşıması |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel başlık/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel dönüş başına başlıklar/meta veri |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum başlıkları/soğuma süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı token biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım kılavuzu |
      | 26 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | İstem önbelleği TTL kapılaması |
      | 29 | `buildMissingAuthMessage` | Özel eksik auth ipucu |
      | 30 | `suppressBuiltInModel` | Bayat yukarı akış satırlarını gizleme |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 33 | `isBinaryThinking` | İkili thinking açık/kapalı uyumluluğu |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning desteği uyumluluğu |
      | 35 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 36 | `isModernModelRef` | Canlı/smoke model eşleştirmesi |
      | 37 | `prepareRuntimeAuth` | Çıkarım öncesi token exchange |
      | 38 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 39 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 40 | `createEmbeddingProvider` | Memory/arama için sağlayıcıya ait gömme bağdaştırıcısı |
      | 41 | `buildReplayPolicy` | Özel transcript yeniden oynatma/Compaction ilkesi |
      | 42 | `sanitizeReplayHistory` | Genel temizlemeden sonra sağlayıcıya özgü yeniden oynatma yeniden yazımları |
      | 43 | `validateReplayTurns` | Gömülü çalıştırıcı öncesi katı yeniden oynatma dönüş doğrulaması |
      | 44 | `onModelSelected` | Seçim sonrası callback (ör. telemetri) |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig`, eşleşen sağlayıcıyı önce, ardından yapılandırmayı gerçekten değiştiren bir sağlayıcı bulunana kadar diğer kanca destekli sağlayıcı Plugin'lerini denetler. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, açığa çıkarıldığında sağlayıcı kancasını kullanır. Paketlenmiş `amazon-bedrock` yolu da burada yerleşik bir AWS env-marker çözümleyicisine sahiptir; ancak Bedrock çalışma zamanı kimlik doğrulaması hâlâ AWS SDK varsayılan zincirini kullanır.
      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için önbellek farkındalıklı sistem istemi kılavuzu eklemesine izin verir. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde `before_prompt_build` yerine bunu tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için bkz. [İç Yapılar: Sağlayıcı Çalışma Zamanı Kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekle (isteğe bağlı)">
    Bir sağlayıcı Plugin'i, metin çıkarımının yanında konuşma, realtime transcription, realtime
    voice, medya anlama, görsel üretimi, video üretimi, web getirme
    ve web arama kaydedebilir. OpenClaw bunu
    **hibrit yetenekli** Plugin olarak sınıflandırır — şirket Plugin'leri için önerilen desen budur
    (satıcı başına bir Plugin). Bkz.
    [İç Yapılar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği, mevcut
    `api.registerProvider(...)` çağrınızın yanında `register(api)` içine kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

    <Tabs>
      <Tab title="Konuşma (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Sağlayıcı HTTP hataları için `assertOkOrThrowProviderError(...)` kullanın; böylece
        Plugin'ler sınırlandırılmış hata gövdesi okumalarını, JSON hata ayrıştırmasını ve
        request-id soneklerini paylaşır.
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` yardımcı fonksiyonunu tercih edin — paylaşılan
        yardımcı proxy yakalama, yeniden bağlanma geri çekilmesi, kapanışta flush, hazır
        el sıkışmaları, ses kuyruğa alma ve close-event tanılamalarını işler. Plugin'iniz yalnızca yukarı akış olaylarını eşler.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Multipart ses POST eden toplu STT sağlayıcıları
        `openclaw/plugin-sdk/provider-http` içindeki
        `buildAudioTranscriptionFormData(...)` yardımcı fonksiyonunu kullanmalıdır. Bu yardımcı,
        uyumlu transcription API'leri için M4A tarzı dosya adı gereken AAC yüklemeleri dahil
        yükleme dosya adlarını normalleştirir.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="Medya anlama">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Görsel ve video üretimi">
        Video yetenekleri **mod farkındalıklı** bir yapı kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` gibi düz toplu alanlar, dönüştürme modu desteğini veya devre dışı bırakılmış modları temiz şekilde ilan etmek için yeterli değildir.
        Müzik üretimi de açık `generate` /
        `edit` bloklarıyla aynı deseni izler.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web getirme ve arama">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test et">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı yapılandırma nesnenizi index.ts veya ayrılmış bir dosyadan dışa aktarın
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("dinamik modelleri çözümler", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("anahtar mevcut olduğunda katalog döndürür", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("anahtar yoksa null katalog döndürür", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHub'a yayımla

Sağlayıcı Plugin'leri, diğer tüm harici kod Plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca skill yayımlama takma adını kullanmayın; Plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers meta verisi
├── openclaw.plugin.json      # Sağlayıcı kimlik doğrulama meta verisine sahip manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik
sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Ne zaman      | Kullanım durumu                                 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarlı sağlayıcılar                  |
| `profile` | Simple sonrası | Auth profillerine bağlı sağlayıcılar           |
| `paired`  | Profile sonrası | Birden fazla ilişkili girdiyi sentezleme      |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — Plugin'iniz aynı zamanda bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt ajan)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Plugin İç Yapıları](/tr/plugins/architecture-internals#provider-runtime-hooks) — kanca ayrıntıları ve paketlenmiş örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
