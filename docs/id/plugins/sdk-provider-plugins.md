---
read_when:
    - Anda sedang membangun Plugin provider model baru
    - Anda ingin menambahkan proxy yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami auth provider, katalog, dan hook runtime
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membangun Plugin provider model untuk OpenClaw
title: Membangun Plugin provider
x-i18n:
    generated_at: "2026-04-25T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Panduan ini memandu Anda membangun Plugin provider yang menambahkan provider model
(LLM) ke OpenClaw. Di akhir, Anda akan memiliki provider dengan katalog model,
auth API key, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

<Tip>
  Plugin provider menambahkan model ke loop inferensi normal OpenClaw. Jika model
  harus berjalan melalui daemon agen native yang memiliki thread, Compaction, atau event tool,
  pasangkan provider dengan [agent harness](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Panduan langkah demi langkah

<Steps>
  <Step title="Package and manifest">
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
    kredensial tanpa memuat runtime Plugin Anda. Tambahkan `providerAuthAliases`
    saat sebuah varian provider harus menggunakan ulang auth milik ID provider lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis Plugin provider Anda dari
    model shorthand seperti `acme-large` sebelum hook runtime ada. Jika Anda memublikasikan
    provider di ClawHub, field `openclaw.compat` dan `openclaw.build` tersebut
    wajib ada di `package.json`.

  </Step>

  <Step title="Register the provider">
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

    Itu sudah menjadi provider yang berfungsi. Pengguna sekarang dapat
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    Jika provider upstream menggunakan token kontrol yang berbeda dari OpenClaw, tambahkan
    transformasi teks dua arah kecil alih-alih mengganti seluruh jalur stream:

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

    `input` menulis ulang system prompt akhir dan konten pesan teks sebelum
    transport. `output` menulis ulang delta teks asisten dan teks akhir sebelum
    OpenClaw mem-parsing marker kontrol miliknya sendiri atau pengiriman channel.

    Untuk provider bawaan yang hanya mendaftarkan satu provider teks dengan
    auth API key plus satu runtime berbasis katalog, gunakan helper yang lebih sempit
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` adalah jalur katalog live yang digunakan saat OpenClaw dapat me-resolve auth provider nyata. Jalur ini dapat melakukan discovery khusus provider. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum auth
    dikonfigurasi; fungsi ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` milik OpenClaw saat ini mengeksekusi katalog statis
    hanya untuk Plugin provider bawaan, dengan config kosong, env kosong, dan tanpa
    path agen/workspace.

    Jika alur auth Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen saat onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint native provider mendukung blok penggunaan ter-stream pada
    transport `openai-completions` normal, pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih melakukan hardcode pemeriksaan
    provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta bahkan saat Plugin menggunakan ID provider kustom.

  </Step>

  <Step title="Add dynamic model resolution">
    Jika provider Anda menerima ID model arbitrer (seperti proxy atau router),
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

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk
    warm-up asinkron — `resolveDynamicModel` berjalan lagi setelah warm-up selesai.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Sebagian besar provider hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan provider Anda.

    Shared helper builder kini mencakup keluarga replay/tool-compat yang paling umum,
    sehingga Plugin biasanya tidak perlu menghubungkan setiap hook satu per satu secara manual:

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

    | Family | Apa yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `openai-compatible` | Kebijakan replay bergaya OpenAI bersama untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi giliran Gemini generik saat transport memerlukannya | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan replay yang sadar Claude dan dipilih berdasarkan `modelId`, sehingga transport pesan Anthropic hanya mendapatkan pembersihan thinking-block khusus Claude saat model yang di-resolve benar-benar merupakan ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Kebijakan replay Gemini native plus sanitasi replay bootstrap dan mode output reasoning bertag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy yang kompatibel dengan OpenAI; tidak mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk provider yang mencampur surface model pesan Anthropic dan yang kompatibel dengan OpenAI dalam satu Plugin; pembuangan thinking-block yang opsional dan khusus Claude tetap dibatasi di sisi Anthropic | `minimax` |

    Keluarga stream yang tersedia saat ini:

    | Family | Apa yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan ID reasoning proxy yang tidak didukung melewati thinking yang diinjeksi | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari config + level `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model fast-mode MiniMax pada jalur stream bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex native bersama: header attribution, `/fast`/`serviceTier`, verbosity teks, Web search Codex native, pembentukan payload reasoning-compat, dan manajemen context Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan penanganan terpusat untuk model yang tidak didukung/skip `auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` default-on untuk provider seperti Z.AI yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="SDK seam yang mendukung family builder">
      Setiap family builder disusun dari helper publik tingkat lebih rendah yang diekspor dari package yang sama, yang dapat Anda gunakan saat provider perlu keluar dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan builder replay mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) dan helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ditambah wrapper OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) dan wrapper proxy/provider bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper schema Gemini di bawahnya (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), dan helper kompatibilitas xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI bawaan menggunakan `normalizeResolvedModel` + `contributeResolvedModelCompat` dengan helper ini agar aturan xAI tetap dimiliki oleh provider.

      Beberapa helper stream sengaja tetap lokal pada provider. `@openclaw/anthropic-provider` menyimpan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper Anthropic tingkat lebih rendah dalam seam publik `api.ts` / `contract-api.ts` miliknya sendiri karena helper tersebut mengenkode penanganan beta Claude OAuth dan gating `context1m`. Plugin xAI juga menyimpan pembentukan Responses xAI native dalam `wrapStreamFn` miliknya sendiri (alias `/fast`, default `tool_stream`, pembersihan strict-tool yang tidak didukung, penghapusan payload reasoning khusus xAI).

      Pola package-root yang sama juga mendukung `@openclaw/openai-provider` (builder provider, helper model default, builder provider realtime) dan `@openclaw/openrouter-provider` (builder provider plus helper onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Untuk provider yang membutuhkan pertukaran token sebelum setiap pemanggilan inferensi:

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
      <Tab title="Custom headers">
        Untuk provider yang membutuhkan header permintaan kustom atau modifikasi body:

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
      <Tab title="Native transport identity">
        Untuk provider yang membutuhkan header atau metadata request/session native pada
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
      <Tab title="Usage and billing">
        Untuk provider yang mengekspos data penggunaan/penagihan:

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
      | 2 | `applyConfigDefaults` | Default global milik provider saat materialisasi config |
      | 3 | `normalizeModelId` | Pembersihan alias model-id legacy/preview sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalkan config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompatibilitas streaming-usage native untuk provider config |
      | 7 | `resolveConfigApiKey` | Resolusi auth env-marker milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder stored-profile sintetis di bawah auth env/config |
      | 10 | `resolveDynamicModel` | Menerima ID model upstream arbitrer |
      | 11 | `prepareDynamicModel` | Fetch metadata asinkron sebelum resolve |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |
      | 13 | `contributeResolvedModelCompat` | Flag kompatibilitas untuk model vendor di balik transport kompatibel lain |
      | 14 | `capabilities` | Kantong kapabilitas statis legacy; hanya kompatibilitas |
      | 15 | `normalizeToolSchemas` | Pembersihan schema tool milik provider sebelum pendaftaran |
      | 16 | `inspectToolSchemas` | Diagnostik schema tool milik provider |
      | 17 | `resolveReasoningOutputMode` | Kontrak output reasoning bertag vs native |
      | 18 | `prepareExtraParams` | Parameter request default |
      | 19 | `createStreamFn` | Transport StreamFn kustom sepenuhnya |
      | 20 | `wrapStreamFn` | Wrapper header/body kustom pada jalur stream normal |
      | 21 | `resolveTransportTurnState` | Header/metadata native per giliran |
      | 22 | `resolveWebSocketSessionPolicy` | Header sesi WS native/cool-down |
      | 23 | `formatApiKey` | Bentuk token runtime kustom |
      | 24 | `refreshOAuth` | Refresh OAuth kustom |
      | 25 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 26 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 27 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 28 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 29 | `buildMissingAuthMessage` | Hint missing-auth kustom |
      | 30 | `suppressBuiltInModel` | Menyembunyikan baris upstream yang usang |
      | 31 | `augmentModelCatalog` | Baris sintetis forward-compat |
      | 32 | `resolveThinkingProfile` | Kumpulan opsi `/think` khusus model |
      | 33 | `isBinaryThinking` | Kompatibilitas thinking biner on/off |
      | 34 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 36 | `isModernModelRef` | Pencocokan model live/smoke |
      | 37 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 38 | `resolveUsageAuth` | Parsing kredensial penggunaan kustom |
      | 39 | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | 40 | `createEmbeddingProvider` | Adapter embedding milik provider untuk memori/pencarian |
      | 41 | `buildReplayPolicy` | Kebijakan replay/Compaction transkrip kustom |
      | 42 | `sanitizeReplayHistory` | Penulisan ulang replay khusus provider setelah pembersihan generik |
      | 43 | `validateReplayTurns` | Validasi replay-turn ketat sebelum runner embedded |
      | 44 | `onModelSelected` | Callback pasca-pemilihan (misalnya telemetri) |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa provider yang cocok terlebih dahulu, lalu Plugin provider lain yang memiliki hook sampai salah satunya benar-benar mengubah config. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung, normalizer config Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook provider saat diekspos. Jalur `amazon-bedrock` bawaan juga memiliki resolver env-marker AWS bawaan di sini, meskipun auth runtime Bedrock sendiri masih menggunakan rantai default AWS SDK.
      - `resolveSystemPromptContribution` memungkinkan provider menyuntikkan panduan system-prompt yang sadar cache untuk keluarga model. Pilih hook ini daripada `before_prompt_build` saat perilaku tersebut milik satu keluarga provider/model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi mendetail dan contoh dunia nyata, lihat [Internals: Provider Runtime Hooks](/id/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    Plugin provider dapat mendaftarkan speech, transkripsi realtime, voice realtime, pemahaman media, pembuatan gambar, pembuatan video, Web fetch,
    dan Web search di samping inferensi teks. OpenClaw mengklasifikasikan ini sebagai
    Plugin **hybrid-capability** — pola yang direkomendasikan untuk Plugin perusahaan
    (satu Plugin per vendor). Lihat
    [Internals: Capability Ownership](/id/plugins/architecture#capability-ownership-model).

    Daftarkan setiap kapabilitas di dalam `register(api)` di samping
    pemanggilan `api.registerProvider(...)` yang sudah ada. Pilih hanya tab yang Anda perlukan:

    <Tabs>
      <Tab title="Speech (TTS)">
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

        Gunakan `assertOkOrThrowProviderError(...)` untuk kegagalan HTTP provider agar
        Plugin berbagi pembacaan body error yang dibatasi, parsing error JSON, dan
        sufiks request-id.
      </Tab>
      <Tab title="Realtime transcription">
        Pilih `createRealtimeTranscriptionWebSocketSession(...)` — helper bersama ini
        menangani penangkapan proxy, reconnect backoff, close flushing, handshake siap,
        antrean audio, dan diagnostik close-event. Plugin Anda hanya memetakan event upstream.

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

        Provider batch STT yang melakukan POST audio multipart sebaiknya menggunakan
        `buildAudioTranscriptionFormData(...)` dari
        `openclaw/plugin-sdk/provider-http`. Helper ini menormalkan nama file
        unggahan, termasuk unggahan AAC yang memerlukan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
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
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Foto dari..." }),
          transcribeAudio: async (req) => ({ text: "Transkrip..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        Kapabilitas video menggunakan bentuk **mode-aware**: `generate`,
        `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` tidak
        cukup untuk mengiklankan dukungan mode transform atau mode yang dinonaktifkan dengan bersih.
        Pembuatan musik mengikuti pola yang sama dengan blok `generate` /
        `edit` yang eksplisit.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* hasil gambar */ }),
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
      <Tab title="Web fetch and search">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek config provider Anda dari index.ts atau file khusus
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("me-resolve model dinamis", () => {
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

Plugin provider dipublikasikan dengan cara yang sama seperti Plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publish lama yang hanya untuk skill di sini; paket Plugin harus menggunakan
`clawhub package publish`.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest dengan metadata auth provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pengujian
    └── usage.ts              # Endpoint penggunaan (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap
provider bawaan:

| Order     | Kapan         | Kasus penggunaan                              |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Pass pertama  | Provider API-key biasa                        |
| `profile` | Setelah simple | Provider yang dibatasi pada auth profile     |
| `paired`  | Setelah profile | Sintesis beberapa entri terkait            |
| `late`    | Pass terakhir | Override provider yang sudah ada (menang saat collision) |

## Langkah berikutnya

- [Channel Plugins](/id/plugins/sdk-channel-plugins) — jika Plugin Anda juga menyediakan channel
- [SDK Runtime](/id/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Internals](/id/plugins/architecture-internals#provider-runtime-hooks) — detail hook dan contoh bawaan

## Terkait

- [Plugin SDK setup](/id/plugins/sdk-setup)
- [Building plugins](/id/plugins/building-plugins)
- [Building channel plugins](/id/plugins/sdk-channel-plugins)
