---
read_when:
    - Anda sedang membangun plugin provider model baru
    - Anda ingin menambahkan proxy yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami auth provider, katalog, dan hook runtime
sidebarTitle: Provider Plugins
summary: Panduan langkah demi langkah untuk membangun plugin provider model untuk OpenClaw
title: Membangun Plugin Provider
x-i18n:
    generated_at: "2026-04-09T01:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38d9af522dc19e49c81203a83a4096f01c2398b1df771c848a30ad98f251e9e1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Membangun Plugin Provider

Panduan ini memandu Anda membangun plugin provider yang menambahkan provider model
(LLM) ke OpenClaw. Pada akhirnya Anda akan memiliki provider dengan katalog model,
auth API key, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
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

    Manifest mendeklarasikan `providerAuthEnvVars` agar OpenClaw dapat mendeteksi
    kredensial tanpa memuat runtime plugin Anda. Tambahkan `providerAuthAliases`
    saat sebuah varian provider harus menggunakan ulang auth milik id provider lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis plugin provider Anda dari shorthand
    model id seperti `acme-large` sebelum hook runtime tersedia. Jika Anda menerbitkan
    provider di ClawHub, field `openclaw.compat` dan `openclaw.build` tersebut
    wajib ada di `package.json`.

  </Step>

  <Step title="Daftarkan provider">
    Provider minimal memerlukan `id`, `label`, `auth`, dan `catalog`:

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

    Itu adalah provider yang berfungsi. Pengguna sekarang dapat
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    Untuk provider bawaan yang hanya mendaftarkan satu provider teks dengan API-key
    auth ditambah satu runtime berbasis katalog, pilih helper yang lebih sempit
    `defineSingleProviderPluginEntry(...)`:

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
        },
      },
    });
    ```

    Jika alur auth Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint native provider mendukung blok usage streaming pada
    transport `openai-completions` normal, pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih melakukan hardcode pemeriksaan
    provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta meskipun plugin menggunakan id provider kustom.

  </Step>

  <Step title="Tambahkan resolusi model dinamis">
    Jika provider Anda menerima model ID arbitrer (seperti proxy atau router),
    tambahkan `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, dan catalog dari atas

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

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk
    warm-up async — `resolveDynamicModel` berjalan lagi setelah itu selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar provider hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan provider Anda.

    Builder helper bersama sekarang mencakup keluarga replay/tool-compat yang paling umum,
    sehingga plugin biasanya tidak perlu menghubungkan setiap hook satu per satu secara manual:

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

    Keluarga replay yang tersedia saat ini:

    | Family | Yang dihubungkan |
    | --- | --- |
    | `openai-compatible` | Kebijakan replay bergaya OpenAI bersama untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi turn Gemini generik saat transport memerlukannya |
    | `anthropic-by-model` | Kebijakan replay sadar-Claude yang dipilih berdasarkan `modelId`, sehingga transport pesan Anthropic hanya menerima pembersihan thinking-block spesifik Claude saat model yang di-resolve benar-benar merupakan id Claude |
    | `google-gemini` | Kebijakan replay Gemini native ditambah sanitasi replay bootstrap dan mode reasoning-output bertag |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy yang kompatibel dengan OpenAI; tidak mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap |
    | `hybrid-anthropic-openai` | Kebijakan hybrid untuk provider yang mencampurkan permukaan model pesan Anthropic dan yang kompatibel dengan OpenAI dalam satu plugin; penghapusan thinking-block khusus Claude yang opsional tetap dibatasi ke sisi Anthropic |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, dan `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` dan `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, dan `zai`: `openai-compatible`

    Keluarga stream yang tersedia saat ini:

    | Family | Yang dihubungkan |
    | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada path stream bersama |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada path stream proxy bersama, dengan `kilo/auto` dan id reasoning proxy yang tidak didukung melewati thinking yang diinjeksi |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari config + level `/think` |
    | `minimax-fast-mode` | Penulisan ulang model fast-mode MiniMax pada path stream bersama |
    | `openai-responses-defaults` | Wrapper native OpenAI/Codex Responses bersama: attribution headers, `/fast`/`serviceTier`, text verbosity, web search Codex native, pembentukan payload reasoning-compat, dan manajemen konteks Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk route proxy, dengan skip unsupported-model/`auto` ditangani secara terpusat |
    | `tool-stream-default-on` | Wrapper `tool_stream` default aktif untuk provider seperti Z.AI yang menginginkan tool streaming kecuali dinonaktifkan secara eksplisit |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` dan `minimax-portal`: `minimax-fast-mode`
    - `openai` dan `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` juga mengekspor enum replay-family
    plus helper bersama yang menjadi dasar keluarga tersebut. Ekspor publik yang umum
    mencakup:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builder replay bersama seperti `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, dan
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper replay Gemini seperti `sanitizeGoogleGeminiReplayHistory(...)`
      dan `resolveTaggedReasoningOutputMode()`
    - helper endpoint/model seperti `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, dan
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` mengekspos builder keluarga dan
    helper wrapper publik yang digunakan ulang oleh keluarga tersebut. Ekspor publik umum
    mencakup:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrapper OpenAI/Codex bersama seperti
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, dan
      `createCodexNativeWebSearchWrapper(...)`
    - wrapper proxy/provider bersama seperti `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, dan `createMinimaxFastModeWrapper(...)`

    Beberapa helper stream sengaja tetap lokal pada provider. Contoh bawaan
    saat ini: `@openclaw/anthropic-provider` mengekspor
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan
    builder wrapper Anthropic level rendah dari seam publik `api.ts` /
    `contract-api.ts`. Helper tersebut tetap spesifik Anthropic karena
    juga mengodekan penanganan beta Claude OAuth dan gating `context1m`.

    Provider bawaan lain juga menjaga wrapper spesifik transport tetap lokal saat
    perilakunya tidak dapat dibagikan dengan bersih lintas keluarga. Contoh saat ini: plugin xAI
    bawaan menyimpan pembentukan Responses xAI native di
    `wrapStreamFn` miliknya sendiri, termasuk penulisan ulang alias `/fast`, `tool_stream`
    default, pembersihan strict-tool yang tidak didukung, dan penghapusan
    payload reasoning khusus xAI.

    `openclaw/plugin-sdk/provider-tools` saat ini mengekspos satu
    keluarga tool-schema bersama plus helper schema/compat bersama:

    - `ProviderToolCompatFamily` mendokumentasikan inventaris keluarga bersama saat ini.
    - `buildProviderToolCompatFamilyHooks("gemini")` menghubungkan pembersihan schema Gemini
      + diagnostik untuk provider yang memerlukan schema tool yang aman untuk Gemini.
    - `normalizeGeminiToolSchemas(...)` dan `inspectGeminiToolSchemas(...)`
      adalah helper schema Gemini publik yang mendasarinya.
    - `resolveXaiModelCompatPatch()` mengembalikan patch compat xAI bawaan:
      `toolSchemaProfile: "xai"`, keyword schema yang tidak didukung, dukungan
      `web_search` native, dan dekode argumen tool-call entitas HTML.
    - `applyXaiModelCompat(model)` menerapkan patch compat xAI yang sama itu pada
      model yang di-resolve sebelum mencapai runner.

    Contoh bawaan nyata: plugin xAI menggunakan `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` untuk menjaga metadata compat itu tetap dimiliki oleh
    provider alih-alih melakukan hardcode aturan xAI di core.

    Pola package-root yang sama juga mendukung provider bawaan lainnya:

    - `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
      helper model default, dan builder provider realtime
    - `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider
      plus helper onboarding/config

    <Tabs>
      <Tab title="Pertukaran token">
        Untuk provider yang memerlukan pertukaran token sebelum setiap panggilan inferensi:

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
      <Tab title="Header kustom">
        Untuk provider yang memerlukan header permintaan kustom atau modifikasi body:

        ```typescript
        // wrapStreamFn mengembalikan StreamFn yang diturunkan dari ctx.streamFn
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
      <Tab title="Identitas transport native">
        Untuk provider yang memerlukan header atau metadata request/session native pada
        transport HTTP atau WebSocket generik:

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
      <Tab title="Usage dan penagihan">
        Untuk provider yang mengekspos data usage/penagihan:

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

    <Accordion title="Semua hook provider yang tersedia">
      OpenClaw memanggil hook dalam urutan ini. Sebagian besar provider hanya menggunakan 2-3:

      | # | Hook | Kapan digunakan |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog model atau default base URL |
      | 2 | `applyConfigDefaults` | Default global milik provider selama materialisasi konfigurasi |
      | 3 | `normalizeModelId` | Pembersihan alias model-id lama/pratinjau sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalisasi konfigurasi `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang compat streaming-usage native untuk provider config |
      | 7 | `resolveConfigApiKey` | Resolusi auth env-marker milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Turunkan placeholder profil tersimpan sintetis di bawah auth env/config |
      | 10 | `resolveDynamicModel` | Menerima model ID upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata async sebelum resolusi |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa provider yang cocok terlebih dahulu, lalu
        plugin provider lain yang mampu menangani hook sampai salah satunya benar-benar
        mengubah konfigurasi.
        Jika tidak ada hook provider yang menulis ulang entri konfigurasi keluarga Google yang didukung,
        normalizer konfigurasi Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook provider saat diekspos. Path bawaan
        `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini,
        meskipun auth runtime Bedrock sendiri masih menggunakan rantai default AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag compat untuk model vendor di balik transport kompatibel lain |
      | 14 | `capabilities` | Kumpulan kapabilitas statis lama; hanya untuk kompatibilitas |
      | 15 | `normalizeToolSchemas` | Pembersihan tool-schema milik provider sebelum registrasi |
      | 16 | `inspectToolSchemas` | Diagnostik tool-schema milik provider |
      | 17 | `resolveReasoningOutputMode` | Kontrak reasoning-output bertag vs native |
      | 18 | `prepareExtraParams` | Parameter request default |
      | 19 | `createStreamFn` | Transport StreamFn kustom sepenuhnya |
      | 20 | `wrapStreamFn` | Wrapper header/body kustom pada path stream normal |
      | 21 | `resolveTransportTurnState` | Header/metadata native per-turn |
      | 22 | `resolveWebSocketSessionPolicy` | Header/cool-down sesi WS native |
      | 23 | `formatApiKey` | Bentuk token runtime kustom |
      | 24 | `refreshOAuth` | Refresh OAuth kustom |
      | 25 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 26 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 27 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 28 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 29 | `buildMissingAuthMessage` | Petunjuk auth yang hilang kustom |
      | 30 | `suppressBuiltInModel` | Sembunyikan baris upstream usang |
      | 31 | `augmentModelCatalog` | Baris kompatibilitas maju sintetis |
      | 32 | `isBinaryThinking` | Thinking biner aktif/nonaktif |
      | 33 | `supportsXHighThinking` | Dukungan reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Kebijakan default `/think` |
      | 35 | `isModernModelRef` | Pencocokan model live/smoke |
      | 36 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 37 | `resolveUsageAuth` | Parsing kredensial usage kustom |
      | 38 | `fetchUsageSnapshot` | Endpoint usage kustom |
      | 39 | `createEmbeddingProvider` | Adapter embedding milik provider untuk memory/search |
      | 40 | `buildReplayPolicy` | Kebijakan replay/pemadatan transkrip kustom |
      | 41 | `sanitizeReplayHistory` | Penulisan ulang replay spesifik provider setelah pembersihan generik |
      | 42 | `validateReplayTurns` | Validasi replay-turn ketat sebelum runner tertanam |
      | 43 | `onModelSelected` | Callback pasca-pemilihan (misalnya telemetri) |

      Catatan tuning prompt:

      - `resolveSystemPromptContribution` memungkinkan provider menyuntikkan
        panduan system-prompt yang sadar-cache untuk keluarga model. Pilih ini alih-alih
        `before_prompt_build` saat perilaku tersebut milik satu keluarga provider/model
        dan harus mempertahankan pemisahan cache stable/dynamic yang stabil.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat
      [Internals: Provider Runtime Hooks](/id/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kapabilitas tambahan (opsional)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin provider dapat mendaftarkan speech, transkripsi realtime, voice realtime,
    pemahaman media, pembuatan gambar, pembuatan video, web fetch,
    dan web search bersama inferensi teks:

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
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
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
    }
    ```

    OpenClaw mengklasifikasikan ini sebagai plugin **hybrid-capability**. Ini adalah
    pola yang direkomendasikan untuk plugin perusahaan (satu plugin per vendor). Lihat
    [Internals: Capability Ownership](/id/plugins/architecture#capability-ownership-model).

    Untuk pembuatan video, pilih bentuk kapabilitas yang sadar mode seperti ditunjukkan di atas:
    `generate`, `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
    `maxInputImages`, `maxInputVideos`, dan `maxDurationSeconds` tidak
    cukup untuk mengiklankan dukungan mode transform atau mode yang dinonaktifkan dengan jelas.

    Provider pembuatan musik harus mengikuti pola yang sama:
    `generate` untuk pembuatan berbasis prompt saja dan `edit` untuk
    pembuatan berbasis gambar referensi. Field agregat datar seperti `maxInputImages`,
    `supportsLyrics`, dan `supportsFormat` tidak cukup untuk mengiklankan dukungan
    edit; blok `generate` / `edit` eksplisit adalah kontrak yang diharapkan.

  </Step>

  <Step title="Uji">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek konfigurasi provider Anda dari index.ts atau file khusus
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Terbitkan ke ClawHub

Plugin provider diterbitkan dengan cara yang sama seperti plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publish lama yang khusus Skills di sini; paket plugin harus menggunakan
`clawhub package publish`.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest dengan metadata auth provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tes
    └── usage.ts              # Endpoint usage (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap
provider bawaan:

| Order     | Kapan         | Kasus penggunaan                               |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pass pertama  | Provider API-key biasa                         |
| `profile` | Setelah simple | Provider yang digating pada profil auth       |
| `paired`  | Setelah profile | Menyintesis beberapa entri terkait           |
| `late`    | Pass terakhir | Menimpa provider yang ada (menang saat bentrok) |

## Langkah berikutnya

- [Channel Plugins](/id/plugins/sdk-channel-plugins) — jika plugin Anda juga menyediakan channel
- [SDK Runtime](/id/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Internals](/id/plugins/architecture#provider-runtime-hooks) — detail hook dan contoh bawaan
