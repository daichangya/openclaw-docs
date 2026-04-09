---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke plugin SDK modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-04-09T01:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60cbb6c8be30d17770887d490c14e3a4538563339a5206fb419e51e0558bbc07
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrasi Plugin SDK

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin
modern dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum
arsitektur baru, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga plugin berbasis hook yang lebih lama tetap berfungsi saat
  arsitektur plugin baru sedang dibangun.
- **`openclaw/extension-api`** — sebuah jembatan yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen tersemat.

Kedua permukaan kini **deprecated**. Keduanya masih berfungsi saat runtime, tetapi plugin
baru tidak boleh menggunakannya, dan plugin yang ada harus bermigrasi sebelum rilis mayor
berikutnya menghapusnya.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak ketika itu terjadi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** — ekspor ulang yang luas memudahkan pembuatan siklus impor
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

Plugin SDK modern memperbaikinya: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider lama untuk kanal bawaan juga sudah tidak ada. Impor
seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper bermerek kanal, dan
`openclaw/plugin-sdk/telegram-core` adalah pintasan mono-repo privat, bukan
kontrak plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam
workspace plugin bawaan, simpan helper milik provider di
`api.ts` atau `runtime-api.ts` plugin tersebut.

Contoh provider bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider
  realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan handler native approval ke capability facts">
    Plugin kanal yang mendukung approval sekarang mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` ditambah registry konteks runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak publik channel-plugin;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap ada hanya untuk alur login/logout kanal; hook auth approval
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik kanal seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan pengalihan milik plugin dari handler approval native;
      core kini menangani pemberitahuan dialihkan-ke-tempat-lain dari hasil pengiriman aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk
    tata letak capability approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal secara tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Sebelum
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sesudah
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Hanya setel ini untuk pemanggil kompatibilitas tepercaya yang memang
      // menerima fallback melalui shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak secara sengaja bergantung pada fallback shell, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang deprecated">
    Cari di plugin Anda impor dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke path impor modern tertentu:

    ```typescript
    // Sebelum (lapisan kompatibilitas mundur deprecated)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sesudah (impor modern yang terfokus)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang disuntikkan alih-alih mengimpor
    secara langsung:

    ```typescript
    // Sebelum (jembatan extension-api deprecated)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sesudah (runtime yang disuntikkan)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan lama lainnya:

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
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/builder entri kanal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor schema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri kanal yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adapter patch setup yang aman untuk impor, helper catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup yang didelegasikan |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/config/gerbang-tindakan akun |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper pencarian akun | Helper pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun yang sempit | Helper daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefiks balasan + pengetikan | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Pabrik adapter config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder schema config | Tipe schema config kanal |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pelacakan status akun | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper route bersama + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan masuk | Helper rekam-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime keluar | Helper identitas keluar/delegasi kirim |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Siklus hidup thread-binding dan helper adapter |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime kanal lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime yang luas | Helper runtime/logging/backup/instalasi plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime yang sempit | Logger/env runtime, timeout, retry, dan helper backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, waits, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper gateway | Helper klien gateway dan patch status kanal |
  | `plugin-sdk/config-runtime` | Helper config | Helper muat/tulis config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram stabil-fallback saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Payload approval exec/plugin, helper capability/profile approval, helper routing/runtime approval native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profile/filter approval exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman approval | Adapter capability/pengiriman approval native |
  | `plugin-sdk/approval-gateway-runtime` | Helper gateway approval | Helper bersama resolusi gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approval | Helper pemuatan adapter approval native yang ringan untuk entrypoint kanal hot |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approval | Helper runtime handler approval yang lebih luas; utamakan seam adapter/gateway yang lebih sempit jika itu sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper binding target/akun approval native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper konteks runtime kanal | Helper generik register/get/watch konteks runtime kanal |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, DM gating, konten eksternal, dan pengumpulan secret bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher tersemat, fetch terlindungi, helper kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, pelaksana kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input secret | Helper input secret |
  | `plugin-sdk/webhook-ingress` | Helper permintaan webhook | Utilitas target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan yang sempit | Helper finalize + dispatch provider |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper session store | Helper path store + updated-at |
  | `plugin-sdk/state-paths` | Helper path status | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status kanal | Builder ringkasan status kanal/akun, default status runtime, helper metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip request |
  | `plugin-sdk/run-command` | Helper perintah terwaktu | Runner perintah terwaktu dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca parameter | Pembaca parameter tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target kirim kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path sementara | Helper path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper markdown-table | Helper mode tabel markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted terkurasi | Helper penemuan/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted kompatibel OpenAI yang terfokus | Helper penemuan/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API key provider | Helper onboarding/tulis profil API key |
  | `plugin-sdk/provider-auth-result` | Helper hasil auth provider | Builder hasil auth OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-env-vars` | Helper env var provider | Helper pencarian env var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper generik kemampuan HTTP/endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper config web-search provider | Helper config/kredensial web-search sempit untuk provider yang tidak memerlukan wiring enable plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak config/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskala |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompat schema/tool provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan schema Gemini + diagnostik, dan helper kompat xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media plus builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper media-generation bersama | Helper failover bersama, pemilihan kandidat, dan pesan model hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media-understanding plus ekspor helper gambar/audio untuk provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, utilitas teks aman, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks keluar |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech plus ekspor helper direktif, registry, dan validasi untuk provider |
  | `plugin-sdk/speech-core` | Core speech bersama | Tipe provider speech, registry, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Tipe provider dan helper registry |
  | `plugin-sdk/realtime-voice` | Helper suara realtime | Tipe provider dan helper registry |
  | `plugin-sdk/image-generation-core` | Core image-generation bersama | Tipe image-generation, failover, auth, dan helper registry |
  | `plugin-sdk/music-generation` | Helper music-generation | Tipe provider/permintaan/hasil music-generation |
  | `plugin-sdk/music-generation-core` | Core music-generation bersama | Tipe music-generation, helper failover, pencarian provider, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Helper video-generation | Tipe provider/permintaan/hasil video-generation |
  | `plugin-sdk/video-generation-core` | Core video-generation bersama | Tipe video-generation, helper failover, pencarian provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitive config kanal | Primitive channel config-schema yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan config kanal | Helper otorisasi penulisan config kanal |
  | `plugin-sdk/channel-plugin-common` | Prelude kanal bersama | Ekspor prelude plugin kanal bersama |
  | `plugin-sdk/channel-status` | Helper status kanal | Helper snapshot/ringkasan status kanal bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper DM langsung | Helper auth/guard DM langsung bersama |
  | `plugin-sdk/extension-shared` | Helper ekstensi bersama | Primitive helper kanal/status pasif dan proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper target webhook | Registry target webhook dan helper instalasi route |
  | `plugin-sdk/webhook-path` | Helper path webhook | Helper normalisasi path webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Permukaan helper memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memory | Fasad runtime indeks/pencarian memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine foundation host memory | Ekspor engine foundation host memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memory | Ekspor engine embedding host memory |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memory | Ekspor engine QMD host memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine storage host memory | Ekspor engine storage host memory |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory | Helper multimodal host memory |
  | `plugin-sdk/memory-core-host-query` | Helper query host memory | Helper query host memory |
  | `plugin-sdk/memory-core-host-secret` | Helper secret host memory | Helper secret host memory |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memory | Helper jurnal peristiwa host memory |
  | `plugin-sdk/memory-core-host-status` | Helper status host memory | Helper status host memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memory | Helper runtime CLI host memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memory | Helper runtime core host memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory | Helper file/runtime host memory |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memory | Alias netral-vendor untuk helper runtime core host memory |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memory | Alias netral-vendor untuk helper jurnal peristiwa host memory |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memory | Alias netral-vendor untuk helper file/runtime host memory |
  | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
  | `plugin-sdk/memory-host-search` | Fasad pencarian memory aktif | Fasad runtime lazy active-memory search-manager |
  | `plugin-sdk/memory-host-status` | Alias status host memory | Alias netral-vendor untuk helper status host memory |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb bawaan | Permukaan helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas pengujian | Helper dan mock pengujian |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh
permukaan SDK. Daftar lengkap 200+ entrypoint berada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih mencakup beberapa seam helper bundled-plugin seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Semuanya tetap diekspor untuk
pemeliharaan bundled-plugin dan kompatibilitas, tetapi sengaja
dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode plugin baru.

Aturan yang sama berlaku untuk keluarga bundled-helper lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- permukaan helper/plugin bawaan seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos
permukaan helper token yang sempit `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan impor tersempit yang sesuai dengan pekerjaan. Jika Anda tidak dapat menemukan ekspor,
periksa sumber di `src/plugin-sdk/` atau tanyakan di Discord.

## Linimasa penghapusan

| Kapan | Apa yang terjadi |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang** | Permukaan deprecated memancarkan peringatan runtime |
| **Rilis mayor berikutnya** | Permukaan deprecated akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin core sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menyembunyikan peringatan sementara

Setel variabel environment ini saat Anda sedang mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — buat plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Kanal](/id/plugins/sdk-channel-plugins) — membangun plugin kanal
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun plugin provider
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi schema manifest
