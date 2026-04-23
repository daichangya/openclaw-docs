---
read_when:
    - Yeni bir model sağlayıcı Plugin'i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel LLM eklemek istiyorsunuz
    - Sağlayıcı auth, kataloglar ve çalışma zamanı kancalarını anlamanız gerekiyor
sidebarTitle: Provider Plugins
summary: OpenClaw için bir model sağlayıcı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Sağlayıcı Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-23T09:07:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Sağlayıcı Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'a bir model sağlayıcısı
(LLM) ekleyen bir sağlayıcı Plugin'i oluşturmayı adım adım açıklar. Sonunda model kataloğu,
API anahtarı auth'u ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız,
  temel paket
  yapısı ve manifest kurulumu için önce [Başlarken](/tr/plugins/building-plugins) sayfasını okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, modelleri OpenClaw'ın normal çıkarım döngüsüne ekler. Eğer model;
  thread'lere, Compaction'a veya araç
  olaylarına sahip yerel bir aracı daemon'u üzerinden çalışmak zorundaysa, daemon protokol ayrıntılarını çekirdeğe koymak yerine
  sağlayıcıyı bir [aracı harness](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## Adım adım

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
    Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` bildirir. Bir sağlayıcı varyantının başka bir sağlayıcı kimliğinin auth'unu yeniden kullanması gerekiyorsa `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve OpenClaw'ın çalışma zamanı kancaları henüz yokken `acme-large` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi otomatik yüklemesini sağlar. Sağlayıcıyı ClawHub üzerinde yayımlıyorsanız, bu `openclaw.compat` ve `openclaw.build` alanları
    `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    En küçük çalışan sağlayıcı için `id`, `label`, `auth` ve `catalog` gerekir:

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
    `openclaw onboard --acme-ai-api-key <key>` çalıştırabilir ve model olarak
    `acme-ai/acme-large` seçebilir.

    Yukarı akış sağlayıcı OpenClaw'dan farklı denetim token'ları kullanıyorsa,
    akış yolunu değiştirmek yerine
    küçük bir iki yönlü metin dönüşümü ekleyin:

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

    `input`, taşıma öncesinde son sistem istemini ve metin ileti içeriğini yeniden yazar.
    `output`, yardımcı metin deltalarını ve son metni, OpenClaw kendi
    denetim işaretleyicilerini veya kanal teslimini ayrıştırmadan önce yeniden yazar.

    Yalnızca API anahtarı
    auth'una sahip tek bir metin sağlayıcısı ve katalog destekli tek bir çalışma zamanı kaydeden paketlenmiş sağlayıcılar için
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
    sağlayıcı auth'unu çözümleyebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif yapabilir. `buildStaticProvider` yalnızca auth
    yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanılmalıdır; kimlik bilgileri gerektirmemeli veya ağ istekleri yapmamalıdır.
    OpenClaw'ın `models list --all` görünümü şu anda statik katalogları
    yalnızca paketlenmiş sağlayıcı Plugin'leri için boş bir yapılandırma, boş bir env ve
    aracı/çalışma alanı yolları olmadan yürütür.

    Auth akışınızın onboarding sırasında ayrıca `models.providers.*`,
    takma adları ve aracı varsayılan modelini yamalaması gerekiyorsa,
    `openclaw/plugin-sdk/provider-onboard` içindeki ön ayar yardımcılarını kullanın. En dar yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` yardımcılarıdır.

    Bir sağlayıcının yerel uç noktası normal
    `openai-completions` taşıması üzerinde akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği denetimlerini sabit yazmak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği uç nokta yetenek eşleminden algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar, bir Plugin özel bir sağlayıcı kimliği kullanıyor olsa bile yine katılım yapar.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız keyfi model kimliklerini kabul ediyorsa (proxy veya router gibi),
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

    Çözümleme bir ağ çağrısı gerektiriyorsa eşzamansız
    ısındırma için `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı kancaları ekleyin (gerektikçe)">
    Çoğu sağlayıcı için yalnızca `catalog` + `resolveDynamicModel` yeterlidir. Sağlayıcınız gerektirdikçe
    kancaları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat
    ailelerini kapsar; bu nedenle Plugin'lerin genellikle her kancayı tek tek elle bağlaması gerekmez:

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

    Bugün kullanılabilen replay aileleri:

    | Aile | Bağladıkları |
    | --- | --- |
    | `openai-compatible` | Araç çağrısı kimliği temizleme, yardımcı-önce sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerde genel Gemini tur doğrulaması dahil olmak üzere OpenAI uyumlu taşımalar için paylaşılan OpenAI tarzı replay ilkesi |
    | `anthropic-by-model` | Claude farkındalıklı replay ilkesi; `modelId` ile seçilir, böylece Anthropic message taşımaları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking-block temizliğini alır |
    | `google-gemini` | Yerel Gemini replay ilkesi artı bootstrap replay temizliği ve etiketli akıl yürütme çıktısı modu |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca Claude'a özgü thinking-block bırakma davranışı Anthropic tarafıyla sınırlı kalır |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` ve `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` ve `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` ve `zai`: `openai-compatible`

    Bugün kullanılabilen akış aileleri:

    | Aile | Bağladıkları |
    | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini thinking yükü normalleştirme |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo akıl yürütme sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy akıl yürütme kimlikleri eklenmiş thinking'i atlar |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili native-thinking yükü eşleme |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax fast-mode model yeniden yazımı |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: atıf üst bilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning-compat yük şekillendirme ve Responses bağlam yönetimi |
    | `openrouter-thinking` | Proxy yolları için OpenRouter akıl yürütme sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak ele alınır |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadıkça araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan açık `tool_stream` sarmalayıcısı |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` ve `minimax-portal`: `minimax-fast-mode`
    - `openai` ve `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` ayrıca replay-family
    enum'unu ve bu ailelerin kurulduğu paylaşılan yardımcıları da dışa aktarır. Yaygın genel
    dışa aktarımlar şunlardır:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` ve
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` gibi paylaşılan replay oluşturucuları
    - `sanitizeGoogleGeminiReplayHistory(...)`
      ve `resolveTaggedReasoningOutputMode()` gibi Gemini replay yardımcıları
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` ve
      `normalizeNativeXaiModelId(...)` gibi uç nokta/model yardımcıları

    `openclaw/plugin-sdk/provider-stream`, hem aile oluşturucusunu hem de
    bu ailelerin yeniden kullandığı genel sarmalayıcı yardımcılarını açığa çıkarır. Yaygın genel dışa aktarımlar
    şunlardır:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` ve
      `createCodexNativeWebSearchWrapper(...)` gibi paylaşılan OpenAI/Codex sarmalayıcıları
    - `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` ve `createMinimaxFastModeWrapper(...)` gibi paylaşılan proxy/sağlayıcı sarmalayıcıları

    Bazı akış yardımcıları bilerek sağlayıcıya yerel tutulur. Mevcut paketlenmiş
    örnek: `@openclaw/anthropic-provider`, genel `api.ts` /
    `contract-api.ts` yüzeyi üzerinden
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha alt seviyeli Anthropic sarmalayıcı oluşturucularını dışa aktarır. Bu yardımcılar Anthropic'e özgü olarak kalır çünkü
    Claude OAuth beta işleme ve `context1m` denetimini de kodlarlar.

    Diğer paketlenmiş sağlayıcılar da, davranış
    aileler arasında temiz biçimde paylaşılamadığında taşımaya özgü sarmalayıcıları yerel tutar. Mevcut örnek: paketlenmiş xAI Plugin'i, `/fast` takma ad yeniden yazımları, varsayılan `tool_stream`,
    desteklenmeyen strict-tool temizliği ve xAI'ye özgü reasoning-payload
    kaldırma dahil olmak üzere yerel xAI Responses şekillendirmesini kendi
    `wrapStreamFn` içinde tutar.

    `openclaw/plugin-sdk/provider-tools` şu anda bir paylaşılan
    tool-schema ailesi ile paylaşılan şema/uyumluluk yardımcılarını açığa çıkarır:

    - `ProviderToolCompatFamily`, bugün paylaşılan aile envanterini belgeler.
    - `buildProviderToolCompatFamilyHooks("gemini")`, Gemini-güvenli araç şemalarına ihtiyaç duyan sağlayıcılar için Gemini şema
      temizliği + tanılamayı bağlar.
    - `normalizeGeminiToolSchemas(...)` ve `inspectGeminiToolSchemas(...)`,
      alttaki genel Gemini şema yardımcılarıdır.
    - `resolveXaiModelCompatPatch()`, paketlenmiş xAI uyumluluk yamasını döndürür:
      `toolSchemaProfile: "xai"`, desteklenmeyen şema anahtar sözcükleri, yerel
      `web_search` desteği ve HTML varlığı araç çağrısı bağımsız değişken çözümleme.
    - `applyXaiModelCompat(model)`, aynı xAI uyumluluk yamasını
      çözümlenmiş modele, yürütücüye ulaşmadan önce uygular.

    Gerçek paketlenmiş örnek: xAI Plugin'i, bu uyumluluk meta verisini çekirdekte xAI kurallarını sabit yazmak yerine
    sağlayıcının sahipliğinde tutmak için
    `normalizeResolvedModel` ile birlikte `contributeResolvedModelCompat` kullanır.

    Aynı paket kökü deseni diğer paketlenmiş sağlayıcıları da destekler:

    - `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
      varsayılan model yardımcılarını ve realtime sağlayıcı oluşturucularını dışa aktarır
    - `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu
      artı onboarding/yapılandırma yardımcılarını dışa aktarır

    <Tabs>
      <Tab title="Token değişimi">
        Her çıkarım çağrısından önce token değişimi gerektiren sağlayıcılar için:

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
      <Tab title="Özel üst bilgiler">
        Özel istek üst bilgileri veya gövde değişiklikleri gerektiren sağlayıcılar için:

        ```typescript
        // wrapStreamFn, ctx.streamFn'den türetilmiş bir StreamFn döndürür
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
        Genel HTTP veya WebSocket taşımalarında yerel istek/oturum üst bilgilerine veya meta verilere ihtiyaç duyan sağlayıcılar için:

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
      <Tab title="Kullanım ve faturalandırma">
        Kullanım/faturalandırma verilerini açığa çıkaran sağlayıcılar için:

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

    <Accordion title="Kullanılabilen tüm sağlayıcı kancaları">
      OpenClaw kancaları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Kanca | Ne zaman kullanılmalı |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya `baseUrl` varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma materyalleştirmesi sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Arama öncesinde eski/önizleme model kimliği takma ad temizliği |
      | 4 | `normalizeTransport` | Genel model birleştirme öncesinde sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalize et |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akışlı kullanım uyumluluk yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env-marker auth çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/kendi kendine barındırılan veya yapılandırma destekli sentetik auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik depolanmış profil yer tutucularını env/yapılandırma auth'unun altına indir |
      | 10 | `resolveDynamicModel` | Keyfi upstream model kimliklerini kabul et |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Yürütücü öncesi taşıma yeniden yazımları |

    Çalışma zamanı geri dönüş notları:

    - `normalizeConfig`, önce eşleşen sağlayıcıyı, sonra
      başka kanca destekli sağlayıcı Plugin'lerini, yalnızca biri gerçekten yapılandırmayı değiştirirse denetler.
      Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa,
      paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
    - `resolveConfigApiKey`, açığa çıkarıldığında sağlayıcı kancasını kullanır. Paketlenmiş
      `amazon-bedrock` yolu ayrıca burada yerleşik bir AWS env-marker çözümleyicisine sahiptir,
      ancak Bedrock çalışma zamanı auth'unun kendisi hâlâ AWS SDK varsayılan
      zincirini kullanır.
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları |
      | 14 | `capabilities` | Eski statik yetenek torbası; yalnızca uyumluluk için |
      | 15 | `normalizeToolSchemas` | Kayıt öncesi sağlayıcıya ait tool-schema temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcıya ait tool-schema tanılaması |
      | 17 | `resolveReasoningOutputMode` | Etiketli ve yerel akıl yürütme çıktısı sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn taşıması |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel üst bilgi/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel tur başına üst bilgi/meta veri |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum üst bilgileri/soğuma süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı token şekli |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Auth onarım rehberliği |
      | 26 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılaması |
      | 27 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | Prompt cache TTL denetimi |
      | 29 | `buildMissingAuthMessage` | Özel eksik auth ipucu |
      | 30 | `suppressBuiltInModel` | Eski upstream satırlarını gizle |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 33 | `isBinaryThinking` | İkili thinking açık/kapalı uyumluluğu |
      | 34 | `supportsXHighThinking` | `xhigh` akıl yürütme desteği uyumluluğu |
      | 35 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 36 | `isModernModelRef` | Canlı/smoke model eşleştirmesi |
      | 37 | `prepareRuntimeAuth` | Çıkarımdan önce token değişimi |
      | 38 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 39 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 40 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding bağdaştırıcısı |
      | 41 | `buildReplayPolicy` | Özel döküm replay/Compaction ilkesi |
      | 42 | `sanitizeReplayHistory` | Genel temizlemeden sonra sağlayıcıya özgü replay yeniden yazımları |
      | 43 | `validateReplayTurns` | Gömülü yürütücü öncesi katı replay tur doğrulaması |
      | 44 | `onModelSelected` | Seçim sonrası callback (ör. telemetri) |

      Prompt tuning notu:

      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için
        önbellek farkındalıklı sistem istemi yönlendirmesi eklemesine izin verir. Davranış tek bir sağlayıcı/model
        ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde
        `before_prompt_build` yerine bunu tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için
      [İç Yapılar: Sağlayıcı Çalışma Zamanı Kancaları](/tr/plugins/architecture#provider-runtime-hooks) sayfasına bakın.
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    <a id="step-5-add-extra-capabilities"></a>
    Bir sağlayıcı Plugin'i, metin çıkarımının yanı sıra konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görsel oluşturma, video oluşturma, web getirme
    ve web araması kaydedebilir:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Sayfaları Acme'nin işleme arka ucu üzerinden getir.",
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
          description: "Bir sayfayı Acme Fetch üzerinden getir.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw bunu bir **hybrid-capability** Plugin'i olarak sınıflandırır. Bu,
    şirket Plugin'leri için önerilen desendir (satıcı başına bir Plugin). Bkz.
    [İç Yapılar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Video oluşturma için yukarıda gösterilen mod farkındalıklı yetenek şeklini tercih edin:
    `generate`, `imageToVideo` ve `videoToVideo`. `maxInputImages`, `maxInputVideos` ve `maxDurationSeconds` gibi düz toplam alanlar,
    dönüştürme modu desteğini veya devre dışı modları temiz biçimde bildirmek için
    yeterli değildir.

    Akışlı STT sağlayıcıları için paylaşılan WebSocket yardımcısını tercih edin. Bu,
    proxy yakalamayı, yeniden bağlanma backoff'unu, kapanışta temiz boşaltmayı, hazır el sıkışmalarını, ses
    kuyruğa almayı ve close-event tanılamasını sağlayıcılar arasında tutarlı kılar; sağlayıcı kodunun
    yalnızca yukarı akış olay eşlemesinden sorumlu kalmasını sağlar.

    Çok parçalı ses POST eden toplu STT sağlayıcıları,
    `openclaw/plugin-sdk/provider-http` içindeki
    `buildAudioTranscriptionFormData(...)` yardımcısını sağlayıcı HTTP istek
    yardımcılarıyla birlikte kullanmalıdır. Form yardımcısı, uyumlu transkripsiyon API'leri için M4A tarzı dosya adına ihtiyaç duyan AAC yüklemeleri dahil olmak üzere yükleme dosya adlarını normalleştirir.

    Müzik oluşturma sağlayıcıları da aynı deseni izlemelidir:
    yalnızca isteme dayalı oluşturma için `generate`, başvuru görseli tabanlı
    oluşturma için `edit`. `maxInputImages`,
    `supportsLyrics` ve `supportsFormat` gibi düz toplam alanlar düzenleme
    desteğini bildirmek için yeterli değildir; beklenen sözleşme açık `generate` / `edit` bloklarıdır.

  </Step>

  <Step title="Test edin">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı yapılandırma nesnenizi index.ts veya ayrı bir dosyadan dışa aktarın
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

## ClawHub'a yayımlayın

Sağlayıcı Plugin'leri, diğer tüm harici kod Plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca-Skills yayımlama takma adını kullanmayın; Plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers meta verisi
├── openclaw.plugin.json      # Sağlayıcı auth meta verisi içeren manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik
sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Ne zaman      | Kullanım durumu                                |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarı sağlayıcıları                 |
| `profile` | simple sonrası | Auth profilleriyle denetlenen sağlayıcılar    |
| `paired`  | profile sonrası | Birden çok ilişkili girdiyi sentezle         |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kıl (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — Plugin'iniz aynı zamanda bir kanal da sağlıyorsa
- [SDK Çalışma Zamanı](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt aracı)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol import başvurusu
- [Plugin İç Yapıları](/tr/plugins/architecture#provider-runtime-hooks) — kanca ayrıntıları ve paketlenmiş örnekler
