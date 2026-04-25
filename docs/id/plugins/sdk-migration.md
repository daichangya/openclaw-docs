---
read_when:
    - Anda melihat peringatan `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Anda melihat peringatan `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Anda menggunakan `api.registerEmbeddedExtensionFactory` sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Beralih dari lapisan kompatibilitas mundur lama ke Plugin SDK modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin modern dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum arsitektur baru ini, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua surface yang sangat terbuka yang memungkinkan plugin mengimpor apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan helper. Ini diperkenalkan untuk menjaga plugin berbasis hook yang lebih lama tetap berfungsi saat arsitektur plugin baru sedang dibangun.
- **`openclaw/extension-api`** — jembatan yang memberi plugin akses langsung ke helper sisi host seperti embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook ekstensi bawaan khusus Pi yang telah dihapus, yang dapat mengamati event embedded-runner seperti `tool_result`.

Surface impor yang luas tersebut sekarang **deprecated**. Surface itu masih berfungsi saat runtime, tetapi plugin baru tidak boleh menggunakannya, dan plugin yang sudah ada harus bermigrasi sebelum rilis mayor berikutnya menghapusnya. API pendaftaran embedded extension factory khusus Pi telah dihapus; gunakan middleware hasil tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin yang terdokumentasi dalam perubahan yang sama yang memperkenalkan pengganti. Perubahan kontrak yang bersifat breaking harus terlebih dahulu melalui adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecasi. Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis mayor mendatang.
  Plugin yang masih mengimpor dari surface ini akan rusak ketika itu terjadi.
  Pendaftaran embedded extension factory khusus Pi sudah tidak dimuat lagi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menimbulkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** — ekspor ulang yang luas memudahkan terciptanya siklus impor
- **Surface API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

Plugin SDK modern memperbaiki hal ini: setiap jalur impor (`openclaw/plugin-sdk/\<subpath\>`) adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider lama untuk channel bawaan juga telah dihapus. Impor seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, seam helper bermerek channel, dan `openclaw/plugin-sdk/telegram-core` adalah shortcut mono-repo privat, bukan kontrak plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace plugin bawaan, simpan helper milik provider di `api.ts` atau `runtime-api.ts` milik plugin tersebut sendiri.

Contoh provider bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` / `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di `api.ts` miliknya sendiri

## Kebijakan kompatibilitas

Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

1. tambahkan kontrak baru
2. pertahankan perilaku lama tetap terhubung melalui adapter kompatibilitas
3. keluarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
4. cakup kedua jalur dalam pengujian
5. dokumentasikan deprecasi dan jalur migrasi
6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

Jika sebuah field manifest masih diterima, penulis plugin dapat tetap menggunakannya sampai dokumentasi dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih pengganti yang terdokumentasi, tetapi plugin yang ada tidak boleh rusak dalam rilis minor biasa.

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan ekstensi hasil tool Pi ke middleware">
    Plugin bawaan harus mengganti handler hasil tool `api.registerEmbeddedExtensionFactory(...)` khusus Pi dengan middleware yang netral terhadap runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Perbarui manifest plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin eksternal tidak dapat mendaftarkan middleware hasil tool karena middleware itu dapat menulis ulang output tool dengan tingkat kepercayaan tinggi sebelum model melihatnya.

  </Step>

  <Step title="Migrasikan handler native approval ke fakta kapabilitas">
    Plugin channel yang mendukung approval kini mengekspos perilaku approval native melalui `approvalCapability.nativeRuntime` ditambah registry konteks runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus approval dari wiring lama `plugin.auth` / `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak plugin channel publik; pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap ada hanya untuk alur login/logout channel; hook auth approval di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti client, token, atau app Bolt melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan pengalihan milik plugin dari handler native approval; core sekarang menangani pemberitahuan dialihkan-ke-tempat-lain dari hasil pengiriman yang sebenarnya
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan surface `createPluginRuntime().channel` yang nyata. Stub parsial akan ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal secara tertutup kecuali Anda secara eksplisit meneruskan `allowShellFallback: true`.

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

    Jika pemanggil Anda tidak secara sengaja bergantung pada shell fallback, jangan set `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang deprecated">
    Cari di plugin Anda impor dari salah satu surface deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari surface lama dipetakan ke jalur impor modern tertentu:

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

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi alih-alih mengimpor secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan lama lainnya:

    | Impor lama | Ekuivalen modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper penyimpanan sesi | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang umbrella lama untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime pada waktu setup | Adapter patch setup yang aman diimpor, helper catatan lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tool setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/config/action-gate akun |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/aksi akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefiks balasan + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema config | Primitive skema config channel bersama; ekspor skema bernama bundled-channel hanya untuk kompatibilitas lama |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, trimming deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup aliran draft | `createAccountStatusSink`, helper finalisasi pratinjau draft |
  | `plugin-sdk/inbound-envelope` | Helper envelope inbound | Helper route bersama + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan inbound | Helper record-and-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Pemuatan media outbound bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper pengiriman outbound, identity/send delegate, sesi, pemformatan, dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper siklus hidup thread-binding dan adapter |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/backup/instalasi plugin |
  | `plugin-sdk/runtime-env` | Helper environment runtime sempit | Helper logger/environment runtime, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper perintah/hook/http/interaktif plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline hook internal/Webhook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, wait, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper klien Gateway dan patch status channel |
  | `plugin-sdk/config-runtime` | Helper config | Helper load/write config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil sebagai fallback saat surface kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Helper payload approval exec/plugin, helper kapabilitas/profil approval, helper perutean/runtime approval native, dan pemformatan jalur tampilan approval terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth aksi same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profil/filter approval exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman approval | Adapter kapabilitas/pengiriman approval native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approval | Helper resolusi Gateway approval bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approval | Helper pemuatan adapter approval native ringan untuk entrypoint channel hot |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approval | Helper runtime handler approval yang lebih luas; utamakan seam adapter/Gateway yang lebih sempit jika sudah memadai |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper binding target/akun approval native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper konteks runtime channel | Helper register/get/watch konteks runtime channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, gating DM, konten eksternal, dan pengumpulan rahasia bersama |
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
  | `plugin-sdk/command-auth` | Gating perintah dan helper surface perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Renderer status/help perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Helper input rahasia |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch inbound, Heartbeat, planner balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Finalisasi, dispatch provider, dan helper label percakapan |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi | Helper path penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Helper path state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip request |
  | `plugin-sdk/run-command` | Helper perintah bertimer | Runner perintah bertimer dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target kirim kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path sementara | Helper path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel markdown | Helper mode tabel markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API key provider | Helper onboarding/penulisan profil API key |
  | `plugin-sdk/provider-auth-result` | Helper hasil auth provider | Builder hasil auth OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-selection-runtime` | Helper pemilihan provider | Pemilihan provider yang terkonfigurasi-atau-otomatis dan penggabungan config provider mentah |
  | `plugin-sdk/provider-env-vars` | Helper env var provider | Helper lookup env var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper capability HTTP/endpoint provider generik, termasuk helper multipart form transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper config web-search provider | Helper config/kredensial web-search sempit untuk provider yang tidak memerlukan wiring pengaktifan plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak config/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berscope |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompat schema/tool provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan schema Gemini + diagnostik, dan helper kompat xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper transport provider | Helper transport provider native seperti guarded fetch, transform message transport, dan stream event transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media ditambah builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper pembuatan media bersama | Helper failover bersama, pemilihan kandidat, dan pesan model-hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media understanding ditambah ekspor helper gambar/audio untuk provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, utilitas safe-text, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks outbound |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech ditambah helper direktif, registry, dan validasi untuk provider |
  | `plugin-sdk/speech-core` | Core speech bersama | Tipe provider speech, registry, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Tipe provider, helper registry, dan helper sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Helper suara realtime | Tipe provider, helper registry/resolusi, dan helper sesi bridge |
  | `plugin-sdk/image-generation-core` | Core pembuatan gambar bersama | Tipe pembuatan gambar, failover, auth, dan helper registry |
  | `plugin-sdk/music-generation` | Helper pembuatan musik | Tipe provider/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Core pembuatan musik bersama | Tipe pembuatan musik, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Helper pembuatan video | Tipe provider/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Core pembuatan video bersama | Tipe pembuatan video, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitive config channel | Primitive channel config-schema sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan config channel | Helper otorisasi penulisan config channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude plugin channel bersama |
  | `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper DM langsung | Helper auth/guard DM langsung bersama |
  | `plugin-sdk/extension-shared` | Helper ekstensi bersama | Primitive helper passive-channel/status dan ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper target Webhook | Registry target Webhook dan helper instalasi route |
  | `plugin-sdk/webhook-path` | Helper path Webhook | Helper normalisasi path Webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Surface helper memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine fondasi host memori | Ekspor engine fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memori | Kontrak embedding memori, akses registry, provider lokal, dan helper batch/remote generik; provider remote konkret berada di plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memori | Ekspor engine QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine storage host memori | Ekspor engine storage host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori | Helper multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Helper query host memori | Helper query host memori |
  | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori | Helper rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori | Helper jurnal event host memori |
  | `plugin-sdk/memory-core-host-status` | Helper status host memori | Helper status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Helper runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memori | Helper runtime core host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori | Helper file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memori | Alias netral-vendor untuk helper runtime core host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal event host memori | Alias netral-vendor untuk helper jurnal event host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memori | Alias netral-vendor untuk helper file/runtime host memori |
  | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian Active Memory | Fasad runtime lazy active-memory search-manager |
  | `plugin-sdk/memory-host-status` | Alias status host memori | Alias netral-vendor untuk helper status host memori |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb bawaan | Surface helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas pengujian | Helper dan mock pengujian |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh surface SDK. Daftar lengkap 200+ entrypoint ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih mencakup beberapa seam helper bundled-plugin seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Surface tersebut tetap diekspor untuk pemeliharaan bundled-plugin dan kompatibilitas, tetapi sengaja dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk kode plugin baru.

Aturan yang sama juga berlaku untuk keluarga helper bundled lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- surface helper/plugin bundled seperti `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos surface helper token sempit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan impor yang paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan sebuah ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan di Discord.

## Deprecasi aktif

Deprecasi yang lebih sempit yang berlaku di seluruh Plugin SDK, kontrak provider, surface runtime, dan manifest. Masing-masing masih berfungsi hari ini tetapi akan dihapus pada rilis mayor mendatang. Entri di bawah setiap item memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="builder help command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor
    yang sama — hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspor ulang semuanya sebagai stub compat.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper gating mention → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` — mengembalikan
    satu objek keputusan alih-alih dua pemanggilan terpisah.

    Plugin channel downstream (Slack, Discord, Matrix, Microsoft Teams) sudah
    beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan helper action channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk plugin
    channel lama. Jangan impor dari situ dalam kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions` di-deprecate
    bersama ekspor channel "actions" mentah. Sebagai gantinya, ekspos kapabilitas
    melalui surface `presentation` yang semantik — plugin channel mendeklarasikan
    apa yang mereka render (card, button, select), bukan nama action mentah yang
    mereka terima.

  </Accordion>

  <Accordion title="Helper tool() provider web search → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi memerlukan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt
    plaintext datar dari pesan channel inbound.

    **Baru**: `BodyForAgent` ditambah blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topik, reply-to, reaksi)
    sebagai field bertipe alih-alih menggabungkannya ke dalam string prompt.
    Helper `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis yang
    menghadap asisten, tetapi envelope plaintext inbound sedang dihentikan.

    Area yang terdampak: `inbound_claim`, `message_received`, dan plugin channel
    kustom apa pun yang memproses ulang teks `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery sekarang menjadi wrapper tipis di atas tipe era
    katalog:

    | Alias lama                 | Tipe baru                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah static bag `ProviderCapabilities` lama — plugin provider
    sebaiknya melampirkan fakta kapabilitas melalui kontrak runtime provider
    alih-alih objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar level berperingkat. OpenClaw secara otomatis menurunkan nilai
    tersimpan yang kedaluwarsa berdasarkan peringkat profil.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    jendela deprecasi tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Fallback provider OAuth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan `resolveExternalOAuthProfiles(...)` tanpa
    mendeklarasikan provider di manifest plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`. Jalur "auth
    fallback" lama memunculkan peringatan saat runtime dan akan dihapus.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env var provider → setup.providers[].envVars">
    **Field manifest lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari perlunya menyalakan runtime plugin hanya untuk
    menjawab lookup env var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
    sampai jendela deprecasi ditutup.

  </Accordion>

  <Accordion title="Registrasi plugin memori → registerMemoryCapability">
    **Lama**: tiga pemanggilan terpisah —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu pemanggilan pada API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu pemanggilan registrasi. Helper memori aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) tidak terpengaruh.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diganti namanya">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                           | Baru                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` di-deprecate dan digantikan oleh
    `getSessionMessages`. Signature-nya sama; metode lama meneruskan pemanggilan
    ke metode baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor TaskFlow live.

    **Baru**: `runtime.tasks.flows` (jamak) mengembalikan akses TaskFlow berbasis DTO,
    yang aman untuk diimpor dan tidak memerlukan seluruh runtime task untuk dimuat.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → middleware hasil tool agen">
    Dibahas dalam "Cara bermigrasi → Migrasikan ekstensi hasil tool Pi ke
    middleware" di atas. Disertakan di sini untuk kelengkapan: jalur
    `api.registerEmbeddedExtensionFactory(...)` khusus Pi yang telah dihapus
    digantikan oleh `api.registerAgentToolResultMiddleware(...)` dengan daftar
    runtime eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` kini
    merupakan alias satu baris untuk `OpenClawConfig`. Gunakan nama kanonisnya.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecasi tingkat ekstensi (di dalam plugin channel/provider bawaan di bawah
`extensions/`) dilacak di barrel `api.ts` dan `runtime-api.ts` milik masing-masing.
Deprecasi tersebut tidak memengaruhi kontrak plugin pihak ketiga dan tidak
dicantumkan di sini. Jika Anda menggunakan barrel lokal plugin bawaan secara
langsung, baca komentar deprecasi di barrel tersebut sebelum melakukan upgrade.
</Note>

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Surface yang deprecated memunculkan peringatan saat runtime             |
| **Rilis mayor berikutnya** | Surface yang deprecated akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin core sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menonaktifkan peringatan untuk sementara

Setel variabel environment ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah celah sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — bangun plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun plugin provider
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest
