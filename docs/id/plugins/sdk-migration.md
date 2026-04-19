---
read_when:
    - Anda melihat peringatan `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Anda melihat peringatan `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Anda sedang memperbarui sebuah Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke Plugin SDK modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrasi Plugin SDK

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur Plugin modern dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum arsitektur baru ini, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem Plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan Plugin mengimpor apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan helper. Ini diperkenalkan untuk menjaga Plugin berbasis hook yang lebih lama tetap berfungsi saat arsitektur Plugin baru sedang dibangun.
- **`openclaw/extension-api`** — sebuah jembatan yang memberi Plugin akses langsung ke helper sisi host seperti embedded agent runner.

Kedua permukaan ini sekarang **deprecated**. Keduanya masih berfungsi saat runtime, tetapi Plugin baru tidak boleh menggunakannya, dan Plugin yang sudah ada harus bermigrasi sebelum rilis mayor berikutnya menghapusnya.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak ketika itu terjadi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menimbulkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul lain yang tidak terkait
- **Circular dependency** — ekspor ulang yang luas memudahkan terciptanya siklus impor
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

Plugin SDK modern memperbaikinya: setiap jalur impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider lama untuk channel bawaan juga sudah dihapus. Impor
seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper bermerek channel, dan
`openclaw/plugin-sdk/telegram-core` adalah shortcut mono-repo privat, bukan
kontrak Plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam
workspace Plugin bawaan, simpan helper milik provider di `api.ts` atau `runtime-api.ts`
Plugin tersebut sendiri.

Contoh provider bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider
  realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan handler native approval ke capability fact">
    Plugin channel yang mendukung approval kini mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` ditambah registri runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/delivery khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak publik channel-plugin;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap digunakan hanya untuk alur login/logout channel; hook auth
      approval di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti client, token, atau Bolt
      app melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik Plugin dari handler approval native;
      core sekarang memiliki pemberitahuan diarahkan-ke-tempat-lain dari hasil delivery yang sebenarnya
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial akan ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak capability approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika Plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan kini gagal secara tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak memang secara sengaja bergantung pada shell fallback, jangan set
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang deprecated">
    Cari di Plugin Anda untuk impor dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke jalur impor modern tertentu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime Plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper bridge lama lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Tabel jalur impor umum">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper titik masuk Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang umbrella lama untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime pada saat setup | Adapter patch setup yang aman diimpor, helper catatan lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/config/action-gate akun |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper pencarian akun | Helper pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun yang sempit | Helper daftar akun/aksi akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primtif pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefiks balasan + pengetikan | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema config | Tipe skema config channel |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pelacakan status akun | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper route bersama + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan masuk | Helper pencatatan-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime keluar | Helper identitas/delegasi pengiriman keluar |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Siklus hidup thread-binding dan helper adapter |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agent untuk layout field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime yang luas | Helper runtime/logging/backup/instalasi Plugin |
  | `plugin-sdk/runtime-env` | Helper environment runtime yang sempit | Logger/runtime env, helper timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin bersama | Helper perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Helper format perintah, wait, versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper klien Gateway dan patch status channel |
  | `plugin-sdk/config-runtime` | Helper config | Helper muat/tulis config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang fallback-stable saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Payload approval exec/Plugin, helper capability/profil approval, helper routing/runtime approval native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth aksi same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profil/filter approval exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper delivery approval | Adapter capability/delivery approval native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approval | Helper resolusi-Gateway approval bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approval | Helper pemuatan adapter approval native ringan untuk entrypoint channel hot |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approval | Helper runtime handler approval yang lebih luas; utamakan seam adapter/Gateway yang lebih sempit jika itu sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper binding target/akun approval native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context channel | Helper daftar/dapat/watch runtime-context channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, DM gating, konten eksternal, dan pengumpulan secret bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | `pinned-dispatcher`, guarded fetch, helper kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registri perintah |
  | `plugin-sdk/command-status` | Renderer status/help perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input secret | Helper input secret |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, Heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan yang sempit | Helper finalize + dispatch provider |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper session store | Helper path store + updated-at |
  | `plugin-sdk/state-paths` | Helper path state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip-permintaan |
  | `plugin-sdk/run-command` | Helper perintah bertimer | Runner perintah bertimer dengan stdout/stderr yang dinormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload yang dinormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path sementara | Helper path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel markdown | Helper mode tabel markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted kompatibel OpenAI yang terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API key provider | Helper onboarding/penulisan profil API key |
  | `plugin-sdk/provider-auth-result` | Helper hasil auth provider | Builder hasil auth OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-env-vars` | Helper env-var provider | Helper lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper kapabilitas HTTP/endpoint provider generik |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper config web-search provider | Helper config/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring pengaktifan Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak config/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terlingkup |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompatibilitas tool/skema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostik skema Gemini, serta helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, serta helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper transport provider | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media serta builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper generation media bersama | Helper failover bersama, pemilihan kandidat, dan pesan model yang hilang untuk generation gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media understanding serta ekspor helper gambar/audio yang menghadap ke provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, utilitas safe-text, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks keluar |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech serta helper direktif, registri, dan validasi yang menghadap ke provider |
  | `plugin-sdk/speech-core` | Core speech bersama | Tipe provider speech, registri, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Tipe provider dan helper registri |
  | `plugin-sdk/realtime-voice` | Helper voice realtime | Tipe provider dan helper registri |
  | `plugin-sdk/image-generation-core` | Core generation gambar bersama | Tipe generation gambar, failover, auth, dan helper registri |
  | `plugin-sdk/music-generation` | Helper generation musik | Tipe provider/permintaan/hasil generation musik |
  | `plugin-sdk/music-generation-core` | Core generation musik bersama | Tipe generation musik, helper failover, pencarian provider, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Helper generation video | Tipe provider/permintaan/hasil generation video |
  | `plugin-sdk/video-generation-core` | Core generation video bersama | Tipe generation video, helper failover, pencarian provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primtif config channel | Primtif config-schema channel yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan config channel | Helper otorisasi penulisan config channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude Plugin channel bersama |
  | `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Helper auth/guard Direct-DM bersama |
  | `plugin-sdk/extension-shared` | Helper extension bersama | Primtif helper passive-channel/status dan ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper target Webhook | Registri target Webhook dan helper instalasi route |
  | `plugin-sdk/webhook-path` | Helper path Webhook | Helper normalisasi path Webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen Plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Permukaan helper manajer/config/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine fondasi host memori | Ekspor engine fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memori | Kontrak embedding memori, akses registri, provider lokal, dan helper batch/remote generik; provider remote konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memori | Ekspor engine QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine penyimpanan host memori | Ekspor engine penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori | Helper multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Helper kueri host memori | Helper kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Helper secret host memori | Helper secret host memori |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori | Helper jurnal event host memori |
  | `plugin-sdk/memory-core-host-status` | Helper status host memori | Helper status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Helper runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memori | Helper runtime core host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori | Helper file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memori | Alias netral-vendor untuk helper runtime core host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal event host memori | Alias netral-vendor untuk helper jurnal event host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memori | Alias netral-vendor untuk helper file/runtime host memori |
  | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian Active Memory | Fasad runtime lazy active-memory search-manager |
  | `plugin-sdk/memory-host-status` | Alias status host memori | Alias netral-vendor untuk helper status host memori |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb bawaan | Permukaan helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas pengujian | Helper uji dan mock |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh
permukaan SDK. Daftar lengkap 200+ entrypoint ada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih mencakup beberapa seam helper Plugin bawaan seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Semuanya masih diekspor untuk
pemeliharaan dan kompatibilitas Plugin bawaan, tetapi sengaja dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode Plugin baru.

Aturan yang sama berlaku untuk keluarga helper bawaan lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- helper bawaan/permukaan Plugin seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos permukaan helper token yang sempit
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan impor yang paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan sebuah ekspor,
periksa sumbernya di `src/plugin-sdk/` atau tanyakan di Discord.

## Linimasa penghapusan

| Kapan | Apa yang terjadi |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang** | Permukaan deprecated mengeluarkan peringatan runtime |
| **Rilis mayor berikutnya** | Permukaan deprecated akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin core sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menyembunyikan peringatan untuk sementara

Set environment variable ini saat Anda sedang mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah celah sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — buat Plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun Plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun Plugin provider
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest
