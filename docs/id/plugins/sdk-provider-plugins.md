---
read_when:
    - Anda sedang membangun Plugin provider model baru
    - Anda ingin menambahkan proxy kompatibel OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami auth provider, katalog, dan hook runtime
sidebarTitle: Provider Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin provider model untuk OpenClaw
title: Membangun Plugin Provider
x-i18n:
    generated_at: "2026-04-21T09:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Membangun Plugin Provider

Panduan ini menjelaskan langkah demi langkah membangun plugin provider yang menambahkan provider model
(LLM) ke OpenClaw. Di akhir, Anda akan memiliki provider dengan katalog model,
auth API key, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

<Tip>
  Plugin provider menambahkan model ke loop inferensi normal OpenClaw. Jika model tersebut
  harus dijalankan melalui daemon agent native yang memiliki thread, Compaction, atau event
  tool, pasangkan provider dengan [agent harness](/id/plugins/sdk-agent-harness)
  alih-alih menempatkan detail protokol daemon di core.
</Tip>

## Walkthrough

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
      "description": "Provider model Acme AI",
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
          "choiceLabel": "API key Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "API key Acme AI"
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
    saat varian provider harus menggunakan kembali auth dari provider id lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis plugin provider Anda dari
    model id singkat seperti `acme-large` sebelum hook runtime ada. Jika Anda menerbitkan
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
      description: "Provider model Acme AI",
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
              label: "API key Acme AI",
              hint: "API key dari dashboard Acme AI Anda",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Masukkan API key Acme AI Anda",
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

    Jika provider upstream menggunakan control token yang berbeda dari OpenClaw, tambahkan
    transform teks dua arah kecil alih-alih mengganti jalur stream:

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

    `input` menulis ulang system prompt final dan konten pesan teks sebelum
    transport. `output` menulis ulang delta teks asisten dan teks final sebelum
    OpenClaw mem-parsing penanda kontrolnya sendiri atau pengiriman channel.

    Untuk provider bawaan yang hanya mendaftarkan satu provider teks dengan API-key
    auth plus satu runtime berbasis katalog, pilih helper yang lebih sempit
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider model Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "API key Acme AI",
            hint: "API key dari dashboard Acme AI Anda",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Masukkan API key Acme AI Anda",
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
    model default agent selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint native provider mendukung blok usage streaming pada
    transport `openai-completions` normal, pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih meng-hardcode
    pemeriksaan provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    opt in bahkan saat sebuah plugin menggunakan provider id kustom.

  </Step>

  <Step title="Tambahkan resolusi model dinamis">
    Jika provider Anda menerima model ID arbitrer (seperti proxy atau router),
    tambahkan `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog dari atas

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

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk warm-up
    async — `resolveDynamicModel` dijalankan lagi setelah selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar provider hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan provider Anda.

    Builder helper bersama kini mencakup keluarga replay/tool-compat yang paling umum,
    sehingga plugin biasanya tidak perlu memasang tiap hook satu per satu secara manual:

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

    | Family | Apa yang dipasangkannya |
    | --- | --- |
    | `openai-compatible` | Replay-policy bergaya OpenAI bersama untuk transport kompatibel OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi turn Gemini generik saat transport membutuhkannya |
    | `anthropic-by-model` | Replay-policy yang peka Claude dipilih berdasarkan `modelId`, sehingga transport pesan Anthropic hanya mendapat pembersihan thinking-block khusus Claude saat model yang diselesaikan memang id Claude |
    | `google-gemini` | Replay-policy Gemini native plus sanitasi replay bootstrap dan mode output reasoning bertag |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy kompatibel OpenAI; tidak mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk provider yang mencampur surface model pesan Anthropic dan kompatibel OpenAI dalam satu plugin; penghapusan thinking-block opsional khusus Claude tetap dibatasi pada sisi Anthropic |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, dan `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` dan `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, dan `zai`: `openai-compatible`

    Keluarga stream yang tersedia saat ini:

    | Family | Apa yang dipasangkannya |
    | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan id reasoning proxy yang tidak didukung melewati thinking yang diinjeksi |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari config + level `/think` |
    | `minimax-fast-mode` | Penulisan ulang model fast-mode MiniMax pada jalur stream bersama |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex native bersama: header atribusi, `/fast`/`serviceTier`, verbosity teks, web search Codex native, pembentukan payload reasoning-compat, dan manajemen konteks Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan model yang tidak didukung/lewati `auto` ditangani secara terpusat |
    | `tool-stream-default-on` | Wrapper `tool_stream` default-on untuk provider seperti Z.A.I yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` dan `minimax-portal`: `minimax-fast-mode`
    - `openai` dan `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` juga mengekspor enum replay-family
    plus helper bersama tempat keluarga-keluarga itu dibangun. Ekspor publik umum
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

    `openclaw/plugin-sdk/provider-stream` mengekspos builder family dan
    helper wrapper publik yang digunakan ulang oleh family-family tersebut. Ekspor publik umum
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

    Beberapa helper stream sengaja tetap lokal di provider. Contoh bawaan
    saat ini: `@openclaw/anthropic-provider` mengekspor
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan
    builder wrapper Anthropic level rendah dari seam publik `api.ts` /
    `contract-api.ts` miliknya. Helper tersebut tetap khusus Anthropic karena
    juga mengodekan penanganan beta OAuth Claude dan gating `context1m`.

    Provider bawaan lain juga mempertahankan wrapper khusus transport secara lokal saat
    perilakunya tidak dibagikan dengan bersih lintas family. Contoh saat ini: plugin
    xAI bawaan mempertahankan pembentukan Responses xAI native di
    `wrapStreamFn` miliknya sendiri, termasuk penulisan ulang alias `/fast`, default `tool_stream`,
    pembersihan strict-tool yang tidak didukung, dan penghapusan
    payload reasoning khusus xAI.

    `openclaw/plugin-sdk/provider-tools` saat ini mengekspos satu family
    tool-schema bersama plus helper schema/compat bersama:

    - `ProviderToolCompatFamily` mendokumentasikan inventaris family bersama saat ini.
    - `buildProviderToolCompatFamilyHooks("gemini")` memasang pembersihan schema
      Gemini + diagnostik untuk provider yang memerlukan schema tool aman-Gemini.
    - `normalizeGeminiToolSchemas(...)` dan `inspectGeminiToolSchemas(...)`
      adalah helper schema Gemini publik yang mendasarinya.
    - `resolveXaiModelCompatPatch()` mengembalikan patch kompat xAI bawaan:
      `toolSchemaProfile: "xai"`, keyword schema yang tidak didukung, dukungan
      native `web_search`, dan decoding argumen tool-call entitas HTML.
    - `applyXaiModelCompat(model)` menerapkan patch kompat xAI yang sama ke
      model yang sudah diselesaikan sebelum mencapai runner.

    Contoh bawaan nyata: plugin xAI menggunakan `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` agar metadata kompat itu tetap dimiliki oleh
    provider alih-alih meng-hardcode aturan xAI di core.

    Pola package-root yang sama juga mendukung provider bawaan lain:

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
        Untuk provider yang memerlukan header atau metadata permintaan/sesi native pada
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
      | 2 | `applyConfigDefaults` | Default global milik provider selama materialisasi config |
      | 3 | `normalizeModelId` | Pembersihan alias model-id lama/preview sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` family provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Normalisasi config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompat native streaming-usage untuk provider config |
      | 7 | `resolveConfigApiKey` | Resolusi auth env-marker milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Turunkan placeholder profil tersimpan sintetis di bawah auth env/config |
      | 10 | `resolveDynamicModel` | Terima model ID upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata async sebelum resolusi |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |

    Catatan fallback runtime:

    - `normalizeConfig` memeriksa dulu provider yang cocok, lalu provider plugin
      lain yang mampu melakukan hook sampai ada yang benar-benar mengubah config.
      Jika tidak ada hook provider yang menulis ulang entri config family Google yang didukung,
      normalizer config Google bawaan tetap berlaku.
    - `resolveConfigApiKey` menggunakan hook provider saat tersedia. Jalur
      `amazon-bedrock` bawaan juga memiliki resolver env-marker AWS bawaan di sini,
      meskipun auth runtime Bedrock sendiri masih menggunakan rantai default AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag kompat untuk model vendor di balik transport kompatibel lain |
      | 14 | `capabilities` | Kantong kapabilitas statis lama; hanya kompatibilitas |
      | 15 | `normalizeToolSchemas` | Pembersihan tool-schema milik provider sebelum registrasi |
      | 16 | `inspectToolSchemas` | Diagnostik tool-schema milik provider |
      | 17 | `resolveReasoningOutputMode` | Kontrak output reasoning bertag vs native |
      | 18 | `prepareExtraParams` | Param permintaan default |
      | 19 | `createStreamFn` | Transport StreamFn kustom sepenuhnya |
      | 20 | `wrapStreamFn` | Wrapper header/body kustom pada jalur stream normal |
      | 21 | `resolveTransportTurnState` | Header/metadata native per-giliran |
      | 22 | `resolveWebSocketSessionPolicy` | Header/cool-down sesi WS native |
      | 23 | `formatApiKey` | Bentuk token runtime kustom |
      | 24 | `refreshOAuth` | Refresh OAuth kustom |
      | 25 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 26 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 27 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 28 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 29 | `buildMissingAuthMessage` | Hint auth-hilang kustom |
      | 30 | `suppressBuiltInModel` | Sembunyikan baris upstream yang usang |
      | 31 | `augmentModelCatalog` | Baris forward-compat sintetis |
      | 32 | `resolveThinkingProfile` | Kumpulan opsi `/think` khusus model |
      | 33 | `isBinaryThinking` | Kompatibilitas thinking biner hidup/mati |
      | 34 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 36 | `isModernModelRef` | Pencocokan model live/smoke |
      | 37 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 38 | `resolveUsageAuth` | Parsing kredensial usage kustom |
      | 39 | `fetchUsageSnapshot` | Endpoint usage kustom |
      | 40 | `createEmbeddingProvider` | Adapter embedding milik provider untuk memory/search |
      | 41 | `buildReplayPolicy` | Replay-policy/Compaction transkrip kustom |
      | 42 | `sanitizeReplayHistory` | Penulisan ulang replay khusus provider setelah pembersihan generik |
      | 43 | `validateReplayTurns` | Validasi replay-turn ketat sebelum runner embedded |
      | 44 | `onModelSelected` | Callback pasca-pemilihan (misalnya telemetry) |

      Catatan penyetelan prompt:

      - `resolveSystemPromptContribution` memungkinkan provider menyuntikkan
        panduan system-prompt yang sadar cache untuk family model. Pilih ini daripada
        `before_prompt_build` saat perilaku tersebut milik satu family provider/model
        dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat
      [Internals: Provider Runtime Hooks](/id/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kapabilitas tambahan (opsional)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin provider dapat mendaftarkan speech, transkripsi realtime, voice realtime,
    pemahaman media, generasi gambar, generasi video, web fetch,
    dan web search di samping inferensi teks:

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
        describeImage: async (req) => ({ text: "Sebuah foto tentang..." }),
        transcribeAudio: async (req) => ({ text: "Transkrip..." }),
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
        hint: "Ambil halaman melalui backend rendering Acme.",
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
          description: "Ambil halaman melalui Acme Fetch.",
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

    Untuk generasi video, pilih bentuk kapabilitas yang sadar-mode seperti di atas:
    `generate`, `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
    `maxInputImages`, `maxInputVideos`, dan `maxDurationSeconds` tidak
    cukup untuk mengiklankan dukungan mode transform atau mode yang dinonaktifkan dengan bersih.

    Provider generasi musik sebaiknya mengikuti pola yang sama:
    `generate` untuk generasi hanya-prompt dan `edit` untuk generasi berbasis
    gambar referensi. Field agregat datar seperti `maxInputImages`,
    `supportsLyrics`, dan `supportsFormat` tidak cukup untuk mengiklankan
    dukungan edit; blok `generate` / `edit` eksplisit adalah kontrak yang diharapkan.

  </Step>

  <Step title="Uji">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek config provider Anda dari index.ts atau file khusus
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("menyelesaikan model dinamis", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("mengembalikan katalog saat key tersedia", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("mengembalikan katalog null saat tidak ada key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikasikan ke ClawHub

Plugin provider dipublikasikan dengan cara yang sama seperti plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publish lama khusus skill di sini; paket plugin harus menggunakan
`clawhub package publish`.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest dengan metadata auth provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pengujian
    └── usage.ts              # Endpoint usage (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabung relatif terhadap
provider bawaan:

| Urutan    | Kapan        | Kasus penggunaan                              |
| --------- | ------------ | --------------------------------------------- |
| `simple`  | Lintasan pertama | Provider API-key biasa                    |
| `profile` | Setelah simple | Provider yang digating oleh profil auth     |
| `paired`  | Setelah profile | Mensintesis beberapa entri terkait         |
| `late`    | Lintasan terakhir | Menimpa provider yang ada (menang pada tabrakan) |

## Langkah berikutnya

- [Channel Plugins](/id/plugins/sdk-channel-plugins) — jika plugin Anda juga menyediakan channel
- [SDK Runtime](/id/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [SDK Overview](/id/plugins/sdk-overview) — referensi import subpath lengkap
- [Plugin Internals](/id/plugins/architecture#provider-runtime-hooks) — detail hook dan contoh bawaan
