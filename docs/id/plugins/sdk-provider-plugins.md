---
read_when:
    - Anda sedang membangun plugin provider model baru
    - Anda ingin menambahkan proxy yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami auth provider, katalog, dan hook runtime
sidebarTitle: Provider Plugins
summary: Panduan langkah demi langkah untuk membangun plugin provider model untuk OpenClaw
title: Membangun Plugin Provider
x-i18n:
    generated_at: "2026-04-23T09:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
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

<Tip>
  Plugin provider menambahkan model ke loop inferensi OpenClaw normal. Jika model
  harus dijalankan melalui daemon agent native yang memiliki thread, Compaction, atau
  peristiwa tool, pasangkan provider dengan [agent harness](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Langkah-langkah

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
    saat varian provider harus menggunakan ulang auth id provider lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis plugin provider Anda dari
    model id singkat seperti `acme-large` sebelum hook runtime ada. Jika Anda memublikasikan
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

    Itu sudah merupakan provider yang berfungsi. Pengguna kini dapat
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    Jika provider upstream menggunakan token kontrol yang berbeda dari OpenClaw, tambahkan
    transformasi teks dua arah kecil alih-alih mengganti jalur stream:

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
    transport. `output` menulis ulang delta teks assistant dan teks akhir sebelum
    OpenClaw mengurai marker kontrolnya sendiri atau delivery channel.

    Untuk provider bawaan yang hanya mendaftarkan satu provider teks dengan auth
    API key plus satu runtime berbasis katalog, pilih helper
    `defineSingleProviderPluginEntry(...)` yang lebih sempit:

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

    `buildProvider` adalah jalur katalog live yang digunakan saat OpenClaw dapat menyelesaikan auth provider
    nyata. Jalur ini dapat melakukan discovery khusus provider. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum auth
    dikonfigurasi; jalur ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini menjalankan katalog statis
    hanya untuk plugin provider bawaan, dengan konfigurasi kosong, env kosong, dan tanpa
    path agent/workspace.

    Jika alur auth Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agent selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint native suatu provider mendukung blok penggunaan streaming pada
    transport `openai-completions` normal, pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih mengeraskan pemeriksaan provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari peta kemampuan endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta bahkan saat plugin menggunakan provider id kustom.

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

    Jika penyelesaiannya memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk
    warm-up async — `resolveDynamicModel` berjalan lagi setelah selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar provider hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan provider Anda.

    Builder helper bersama kini mencakup keluarga replay/tool-compat yang paling umum,
    sehingga plugin biasanya tidak perlu merangkai sendiri tiap hook satu per satu:

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

    | Family | Apa yang dirangkai |
    | --- | --- |
    | `openai-compatible` | Kebijakan replay bergaya OpenAI bersama untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi giliran Gemini generik saat transport memerlukannya |
    | `anthropic-by-model` | Kebijakan replay sadar Claude yang dipilih berdasarkan `modelId`, sehingga transport pesan Anthropic hanya mendapatkan pembersihan blok thinking khusus Claude saat model yang diselesaikan memang merupakan id Claude |
    | `google-gemini` | Kebijakan replay Gemini native plus sanitasi replay bootstrap dan mode output reasoning bertag |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy yang kompatibel dengan OpenAI; tidak mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk provider yang mencampur surface model pesan Anthropic dan yang kompatibel dengan OpenAI dalam satu plugin; penghapusan blok thinking opsional khusus Claude tetap dibatasi ke sisi Anthropic |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, dan `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` dan `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, dan `zai`: `openai-compatible`

    Keluarga stream yang tersedia saat ini:

    | Family | Apa yang dirangkai |
    | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan reasoning id proxy yang tidak didukung melewati thinking yang disuntikkan |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari konfigurasi + level `/think` |
    | `minimax-fast-mode` | Penulisan ulang model fast-mode MiniMax pada jalur stream bersama |
    | `openai-responses-defaults` | Wrapper native OpenAI/Codex Responses bersama: header attribution, `/fast`/`serviceTier`, verbosity teks, web search Codex native, pembentukan payload compat reasoning, dan manajemen konteks Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan skip model-tidak-didukung/`auto` ditangani secara terpusat |
    | `tool-stream-default-on` | Wrapper `tool_stream` default aktif untuk provider seperti Z.AI yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit |

    Contoh bawaan nyata:

    - `google` dan `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` dan `minimax-portal`: `minimax-fast-mode`
    - `openai` dan `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` juga mengekspor enum replay-family
    plus helper bersama yang membangun keluarga-keluarga tersebut. Ekspor publik
    umum meliputi:

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
    helper wrapper publik yang digunakan ulang oleh family tersebut. Ekspor publik umum
    meliputi:

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
    `contract-api.ts`-nya. Helper itu tetap khusus Anthropic karena
    juga mengodekan penanganan beta OAuth Claude dan gating `context1m`.

    Provider bawaan lain juga menjaga wrapper khusus transport tetap lokal saat
    perilakunya tidak dibagi dengan bersih lintas family. Contoh saat ini: plugin xAI
    bawaan menyimpan pembentukan Responses xAI native di
    `wrapStreamFn` miliknya sendiri, termasuk penulisan ulang alias `/fast`, default `tool_stream`,
    pembersihan strict-tool yang tidak didukung, dan penghapusan payload reasoning
    khusus xAI.

    `openclaw/plugin-sdk/provider-tools` saat ini mengekspos satu
    family tool-schema bersama plus helper schema/compat bersama:

    - `ProviderToolCompatFamily` mendokumentasikan inventaris family bersama saat ini.
    - `buildProviderToolCompatFamilyHooks("gemini")` merangkai pembersihan schema Gemini
      + diagnostik untuk provider yang memerlukan tool schema aman-Gemini.
    - `normalizeGeminiToolSchemas(...)` dan `inspectGeminiToolSchemas(...)`
      adalah helper schema Gemini publik yang mendasarinya.
    - `resolveXaiModelCompatPatch()` mengembalikan patch compat xAI bawaan:
      `toolSchemaProfile: "xai"`, kata kunci schema yang tidak didukung, dukungan native
      `web_search`, dan decoding argumen pemanggilan tool entitas HTML.
    - `applyXaiModelCompat(model)` menerapkan patch compat xAI yang sama ke model
      yang telah diselesaikan sebelum mencapai runner.

    Contoh bawaan nyata: plugin xAI menggunakan `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` untuk menjaga metadata compat itu tetap dimiliki oleh
    provider alih-alih mengeraskan aturan xAI di core.

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
      <Tab title="Penggunaan dan penagihan">
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
      | 2 | `applyConfigDefaults` | Default global milik provider selama materialisasi konfigurasi |
      | 3 | `normalizeModelId` | Pembersihan alias model-id lama/pratinjau sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` family-provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalkan konfigurasi `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang compat streaming-usage native untuk provider konfigurasi |
      | 7 | `resolveConfigApiKey` | Resolusi auth marker-env milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis konfigurasi |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di bawah auth env/config |
      | 10 | `resolveDynamicModel` | Menerima model ID upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata async sebelum resolusi |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |

    Catatan fallback runtime:

    - `normalizeConfig` memeriksa provider yang cocok terlebih dahulu, lalu provider
      plugin berkemampuan hook lainnya sampai salah satunya benar-benar mengubah konfigurasi.
      Jika tidak ada hook provider yang menulis ulang entri konfigurasi family Google yang didukung,
      normalizer konfigurasi Google bawaan tetap diterapkan.
    - `resolveConfigApiKey` menggunakan hook provider saat diekspos. Jalur
      `amazon-bedrock` bawaan juga memiliki resolver marker-env AWS bawaan di sini,
      meskipun auth runtime Bedrock sendiri masih menggunakan rantai default AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag compat untuk model vendor di balik transport kompatibel lain |
      | 14 | `capabilities` | Kumpulan kemampuan statis lama; hanya kompatibilitas |
      | 15 | `normalizeToolSchemas` | Pembersihan tool-schema milik provider sebelum pendaftaran |
      | 16 | `inspectToolSchemas` | Diagnostik tool-schema milik provider |
      | 17 | `resolveReasoningOutputMode` | Kontrak output reasoning bertag vs native |
      | 18 | `prepareExtraParams` | Parameter permintaan default |
      | 19 | `createStreamFn` | Transport StreamFn kustom penuh |
      | 20 | `wrapStreamFn` | Wrapper header/body kustom pada jalur stream normal |
      | 21 | `resolveTransportTurnState` | Header/metadata native per giliran |
      | 22 | `resolveWebSocketSessionPolicy` | Header/cool-down sesi WS native |
      | 23 | `formatApiKey` | Bentuk token runtime kustom |
      | 24 | `refreshOAuth` | Refresh OAuth kustom |
      | 25 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 26 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 27 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 28 | `isCacheTtlEligible` | Gating TTL prompt cache |
      | 29 | `buildMissingAuthMessage` | Petunjuk auth hilang kustom |
      | 30 | `suppressBuiltInModel` | Sembunyikan baris upstream usang |
      | 31 | `augmentModelCatalog` | Baris kompatibilitas maju sintetis |
      | 32 | `resolveThinkingProfile` | Set opsi `/think` khusus model |
      | 33 | `isBinaryThinking` | Kompatibilitas thinking biner on/off |
      | 34 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 36 | `isModernModelRef` | Pencocokan model live/smoke |
      | 37 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 38 | `resolveUsageAuth` | Parsing kredensial penggunaan kustom |
      | 39 | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | 40 | `createEmbeddingProvider` | Adaptor embedding milik provider untuk memory/search |
      | 41 | `buildReplayPolicy` | Kebijakan replay/Compaction transkrip kustom |
      | 42 | `sanitizeReplayHistory` | Penulisan ulang replay khusus provider setelah pembersihan generik |
      | 43 | `validateReplayTurns` | Validasi replay-turn ketat sebelum runner tersemat |
      | 44 | `onModelSelected` | Callback pasca-pemilihan (misalnya telemetri) |

      Catatan tuning prompt:

      - `resolveSystemPromptContribution` memungkinkan provider menyuntikkan
        panduan system prompt yang sadar cache untuk suatu family model. Pilih ini dibanding
        `before_prompt_build` saat perilaku tersebut memang milik satu family
        provider/model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat
      [Internal: Hook Runtime Provider](/id/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kemampuan tambahan (opsional)">
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
          audioBuffer: Buffer.from(/* data PCM */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Transkripsi Realtime Acme",
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
        label: "Voice Realtime Acme",
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
        describeImage: async (req) => ({ text: "Foto dari..." }),
        transcribeAudio: async (req) => ({ text: "Transkrip..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* hasil gambar */ }),
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
    [Internal: Kepemilikan Kemampuan](/id/plugins/architecture#capability-ownership-model).

    Untuk generasi video, pilih bentuk kemampuan yang sadar mode seperti di atas:
    `generate`, `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
    `maxInputImages`, `maxInputVideos`, dan `maxDurationSeconds` tidak
    cukup untuk mengiklankan dukungan mode transform atau mode yang dinonaktifkan dengan bersih.

    Pilih helper WebSocket bersama untuk provider STT streaming. Helper ini menjaga
    proxy capture, reconnect backoff, close flushing, ready handshake, audio
    queueing, dan diagnostik close-event tetap konsisten lintas provider sambil
    membiarkan kode provider hanya bertanggung jawab atas pemetaan peristiwa upstream.

    Provider STT batch yang melakukan POST audio multipart harus menggunakan
    `buildAudioTranscriptionFormData(...)` dari
    `openclaw/plugin-sdk/provider-http` bersama helper permintaan HTTP
    provider. Helper form menormalkan nama file upload, termasuk upload AAC
    yang memerlukan nama file bergaya M4A untuk API transkripsi yang kompatibel.

    Provider generasi musik harus mengikuti pola yang sama:
    `generate` untuk generasi hanya prompt dan `edit` untuk generasi berbasis
    gambar referensi. Field agregat datar seperti `maxInputImages`,
    `supportsLyrics`, dan `supportsFormat` tidak cukup untuk mengiklankan dukungan edit; blok `generate` / `edit` yang eksplisit adalah kontrak
    yang diharapkan.

  </Step>

  <Step title="Uji">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek konfigurasi provider Anda dari index.ts atau file khusus
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
    └── usage.ts              # Endpoint penggunaan (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap
provider bawaan:

| Order     | Kapan         | Kasus penggunaan                               |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pass pertama  | Provider API-key biasa                         |
| `profile` | Setelah simple | Provider yang digate pada auth profile        |
| `paired`  | Setelah profile | Mensintesis banyak entri terkait            |
| `late`    | Pass terakhir | Menimpa provider yang ada (menang saat konflik) |

## Langkah berikutnya

- [Plugin Channel](/id/plugins/sdk-channel-plugins) — jika plugin Anda juga menyediakan channel
- [Runtime SDK](/id/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi import subpath lengkap
- [Internal Plugin](/id/plugins/architecture#provider-runtime-hooks) — detail hook dan contoh bawaan
