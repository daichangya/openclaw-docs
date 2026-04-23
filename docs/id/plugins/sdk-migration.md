---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda sedang memperbarui Plugin ke arsitektur plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke SDK Plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-04-23T09:25:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrasi SDK Plugin

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin
modern dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum
arsitektur baru, panduan ini membantu Anda melakukan migrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka butuhkan dari satu entry point:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga agar Plugin lama berbasis hook tetap bekerja saat
  arsitektur plugin baru sedang dibangun.
- **`openclaw/extension-api`** — bridge yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen embedded.

Kedua permukaan sekarang **deprecated**. Keduanya masih bekerja saat runtime, tetapi Plugin baru
tidak boleh menggunakannya, dan Plugin yang ada harus bermigrasi sebelum rilis mayor berikutnya menghapus keduanya.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat hal itu terjadi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menimbulkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** — ekspor ulang yang luas memudahkan terciptanya siklus impor
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK Plugin modern memperbaikinya: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak terdokumentasi.

Seam convenience provider lama untuk channel bundled juga sudah hilang. Impor
seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper bermerek channel, dan
`openclaw/plugin-sdk/telegram-core` adalah shortcut mono-repo privat, bukan
kontrak plugin yang stabil. Gunakan subpath SDK generik sempit sebagai gantinya. Di dalam
workspace Plugin bundled, simpan helper milik provider di
`api.ts` atau `runtime-api.ts` milik Plugin itu sendiri.

Contoh provider bundled saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan handler native approval ke fakta kemampuan">
    Plugin channel yang mampu melakukan approval sekarang mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` plus registry runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak publik channel-plugin;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap digunakan hanya untuk alur login/logout channel; hook auth
      approval di sana tidak lagi dibaca oleh inti
    - Daftarkan objek runtime milik channel seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik plugin dari handler approval native;
      inti sekarang memiliki pemberitahuan dirutekan-ke-tempat-lain dari hasil pengiriman yang sebenarnya
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, berikan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kemampuan approval
    saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika Plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper
    `.cmd`/`.bat` Windows yang tidak terselesaikan sekarang gagal tertutup kecuali Anda secara eksplisit memberikan
    `allowShellFallback: true`.

    ```typescript
    // Sebelumnya
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sesudahnya
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Hanya atur ini untuk pemanggil kompatibilitas tepercaya yang memang
      // menerima fallback yang dimediasi shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak memang sengaja bergantung pada fallback shell, jangan atur
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor deprecated">
    Cari di Plugin Anda impor dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke path impor modern tertentu:

    ```typescript
    // Sebelumnya (lapisan kompatibilitas mundur deprecated)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sesudahnya (impor modern yang terfokus)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime Plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Sebelumnya (bridge extension-api deprecated)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sesudahnya (runtime yang diinjeksi)
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

## Referensi path impor

  <Accordion title="Tabel path impor umum">
  | Path impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entry Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang umbrella lama untuk definisi/builder entry channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entry provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entry channel yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard penyiapan bersama | Prompt allowlist, builder status penyiapan |
  | `plugin-sdk/setup-runtime` | Helper runtime saat penyiapan | Adapter patch penyiapan yang aman untuk impor, helper lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter penyiapan | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar akun/config/gerbang aksi |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/aksi akun |
  | `plugin-sdk/channel-setup` | Adapter wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefiks balasan + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema config | Tipe skema config channel |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, trimming deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup draft stream | `createAccountStatusSink`, helper finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper route + builder envelope bersama |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan masuk | Helper pencatatan-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target perpesanan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Pemuatan media outbound bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper delegasi identitas/kirim outbound dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper siklus hidup dan adapter thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/backup/instalasi Plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime sempit | Helper logger/env runtime, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin bersama | Helper perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline Webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, wait, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Klien Gateway dan helper patch channel-status |
  | `plugin-sdk/config-runtime` | Helper config | Helper muat/tulis config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil terhadap fallback saat permukaan kontrak Telegram bundled tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt persetujuan | Payload persetujuan exec/plugin, helper kemampuan/profil persetujuan, helper perutean/runtime persetujuan native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth persetujuan | Resolusi approver, auth aksi same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien persetujuan | Helper profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman persetujuan | Adapter kemampuan/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway persetujuan | Helper resolusi-gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter persetujuan | Helper pemuatan adapter persetujuan native ringan untuk entry point channel panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler persetujuan | Helper runtime handler persetujuan yang lebih luas; lebih pilih seam adapter/gateway yang lebih sempit jika sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target persetujuan | Helper target persetujuan native/binding akun |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan persetujuan | Helper payload balasan persetujuan exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context channel | Helper register/get/watch runtime-context channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, gating DM, konten eksternal, dan pengumpulan secret bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah |
  | `plugin-sdk/command-status` | Renderer status/help perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input secret | Helper input secret |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, Heartbeat, planner balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Helper finalisasi + dispatch provider |
  | `plugin-sdk/reply-history` | Helper reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper potongan balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi | Helper path store + updated-at |
  | `plugin-sdk/state-paths` | Helper path state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper perutean/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default status runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip-permintaan |
  | `plugin-sdk/run-command` | Helper perintah bertiming | Runner perintah bertiming dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target kirim kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path sementara | Helper path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Helper logging | Helper logger subsistem dan redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel markdown | Helper mode tabel markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper penyiapan provider lokal/self-hosted terkurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan provider self-hosted kompatibel OpenAI yang terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API-key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper penyiapan API-key provider | Helper onboarding/API-key penulisan profil |
  | `plugin-sdk/provider-auth-result` | Helper hasil-auth provider | Builder hasil-auth OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-env-vars` | Helper env-var provider | Helper lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
| `plugin-sdk/provider-http` | Helper HTTP provider | Helper kemampuan HTTP/endpoint provider generik, termasuk helper multipart form transkripsi audio |
| `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper pendaftaran/cache provider web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helper config web-search provider | Helper config/kredensial web-search sempit untuk provider yang tidak memerlukan wiring pengaktifan Plugin |
| `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak config/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial yang dicakup |
| `plugin-sdk/provider-web-search` | Helper web-search provider | Helper pendaftaran/cache/runtime provider web-search |
| `plugin-sdk/provider-tools` | Helper kompatibilitas tool/skema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
| `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helper transport provider | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream peristiwa transport yang dapat ditulis |
| `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media plus builder payload media |
| `plugin-sdk/media-generation-runtime` | Helper pembuatan media bersama | Helper failover bersama, pemilihan kandidat, dan pesan model-hilang untuk pembuatan gambar/video/musik |
| `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media understanding plus ekspor helper gambar/audio yang menghadap provider |
| `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, utilitas safe-text, dan helper teks/logging terkait |
| `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks outbound |
| `plugin-sdk/speech` | Helper speech | Tipe provider speech plus helper direktif, registry, dan validasi yang menghadap provider |
| `plugin-sdk/speech-core` | Inti speech bersama | Tipe provider speech, registry, direktif, normalisasi |
| `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Tipe provider, helper registry, dan helper sesi WebSocket bersama |
| `plugin-sdk/realtime-voice` | Helper voice realtime | Tipe provider dan helper registry |
| `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe image-generation, failover, auth, dan helper registry |
| `plugin-sdk/music-generation` | Helper pembuatan musik | Tipe provider/permintaan/hasil music-generation |
| `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe music-generation, helper failover, lookup provider, dan parsing model-ref |
| `plugin-sdk/video-generation` | Helper pembuatan video | Tipe provider/permintaan/hasil video-generation |
| `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe video-generation, helper failover, lookup provider, dan parsing model-ref |
| `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
| `plugin-sdk/channel-config-primitives` | Primitif config channel | Primitif config-schema channel sempit |
| `plugin-sdk/channel-config-writes` | Helper penulisan config channel | Helper otorisasi penulisan config channel |
| `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude Plugin channel bersama |
| `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
| `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
| `plugin-sdk/group-access` | Helper akses grup | Helper keputusan group-access bersama |
| `plugin-sdk/direct-dm` | Helper direct-DM | Helper auth/guard direct-DM bersama |
| `plugin-sdk/extension-shared` | Helper extension bersama | Primitif helper passive-channel/status dan ambient proxy |
| `plugin-sdk/webhook-targets` | Helper target Webhook | Helper registry target Webhook dan instalasi rute |
| `plugin-sdk/webhook-path` | Helper path Webhook | Helper normalisasi path Webhook |
| `plugin-sdk/web-media` | Helper web media bersama | Helper pemuatan media remote/lokal |
| `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
| `plugin-sdk/memory-core` | Helper memory-core bundled | Permukaan helper memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memori | Fasad runtime indeks/pencarian memori |
| `plugin-sdk/memory-core-host-engine-foundation` | Engine foundation host memori | Ekspor engine foundation host memori |
| `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memori | Kontrak embedding memori, akses registry, provider lokal, dan helper batch/remote generik; provider remote konkret berada di Plugin pemiliknya |
| `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memori | Ekspor engine QMD host memori |
| `plugin-sdk/memory-core-host-engine-storage` | Engine storage host memori | Ekspor engine storage host memori |
| `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori | Helper multimodal host memori |
| `plugin-sdk/memory-core-host-query` | Helper query host memori | Helper query host memori |
| `plugin-sdk/memory-core-host-secret` | Helper secret host memori | Helper secret host memori |
| `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memori | Helper jurnal peristiwa host memori |
| `plugin-sdk/memory-core-host-status` | Helper status host memori | Helper status host memori |
| `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Helper runtime CLI host memori |
| `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Helper runtime inti host memori |
| `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori | Helper file/runtime host memori |
| `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral-vendor untuk helper runtime inti host memori |
| `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral-vendor untuk helper jurnal peristiwa host memori |
| `plugin-sdk/memory-host-files` | Alias file/runtime host memori | Alias netral-vendor untuk helper file/runtime host memori |
| `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
| `plugin-sdk/memory-host-search` | Fasad pencarian memori aktif | Fasad runtime search-manager Active Memory lazy |
| `plugin-sdk/memory-host-status` | Alias status host memori | Alias netral-vendor untuk helper status host memori |
| `plugin-sdk/memory-lancedb` | Helper memory-lancedb bundled | Permukaan helper memory-lancedb |
| `plugin-sdk/testing` | Utilitas pengujian | Helper dan mock pengujian |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh
permukaan SDK. Daftar lengkap 200+ entry point ada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih mencakup beberapa seam helper Plugin bundled seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Semua itu tetap diekspor untuk
pemeliharaan dan kompatibilitas Plugin bundled, tetapi sengaja
dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode Plugin baru.

Aturan yang sama berlaku untuk keluarga helper bundled lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- permukaan helper/Plugin bundled seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos
permukaan helper token sempit `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan impor tersempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan ekspor,
periksa sumber di `src/plugin-sdk/` atau tanyakan di Discord.

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| **Sekarang**           | Permukaan deprecated mengeluarkan peringatan runtime                   |
| **Rilis mayor berikutnya** | Permukaan deprecated akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin inti sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menonaktifkan peringatan sementara

Atur variabel environment ini saat Anda sedang mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalur pelarian sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — bangun Plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun plugin provider
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest
