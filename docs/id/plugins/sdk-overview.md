---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari export SDK tertentu
sidebarTitle: SDK Overview
summary: Peta import, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-09T01:30:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf205af060971931df97dca4af5110ce173d2b7c12f56ad7c62d664a402f2381
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar Plugin SDK

Plugin SDK adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulai dari [Getting Started](/id/plugins/building-plugins)
  - Plugin channel? Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  - Plugin penyedia? Lihat [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi sirkular. Untuk helper entry/build khusus channel,
pilih `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
surface payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan menambahkan atau bergantung pada seam kenyamanan bernama penyedia seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan harus menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` miliknya sendiri, dan core
harus menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik sempit
saat kebutuhannya benar-benar lintas channel.

Peta export yang dihasilkan masih memuat sekumpulan kecil seam helper
plugin bawaan seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut ada hanya untuk pemeliharaan dan kompatibilitas plugin bawaan; sengaja tidak dicantumkan
dalam tabel umum di bawah ini dan bukan jalur impor yang direkomendasikan untuk plugin pihak ketiga baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan berisi
200+ subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan masih muncul dalam daftar yang dihasilkan tersebut.
Perlakukan itu sebagai detail implementasi/surface kompatibilitas kecuali sebuah halaman dokumen
secara eksplisit mempromosikannya sebagai publik.

### Entri plugin

| Subpath                     | Export utama                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, serta `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, builder status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-akun config/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-aksi akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper route inbound + builder envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper pencatatan-dan-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-runtime` | Helper delegasi identitas/kirim outbound |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Builder payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper pengikatan percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi channel yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Export prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard DM langsung bersama |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/reduksi payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Helper debounce inbound, pencocokan mention, kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak rahasia sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

  <Accordion title="Subpath penyedia">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup penyedia lokal/self-hosted terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Helper lookup env var auth penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/seleksi web-fetch sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper sempit konfigurasi/kredensial web search untuk penyedia yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terlingkup |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime penyedia web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/peta/cache lokal proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi approver dan auth aksi same-chat |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter approval exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman approval native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi gateway approval bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan pemuatan adapter approval native untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime approval handler yang lebih luas; pilih seam adapter/gateway yang lebih sempit bila sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target approval native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper auth perintah native + target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-surface` | Helper normalisasi badan perintah dan surface perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia sempit untuk surface rahasia channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper sempit `coerceSecretRef` dan typing SecretRef untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper trust, gating DM, konten eksternal, dan pengumpulan rahasia bersama |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch berpenjaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body request/timeout |
  </Accordion>

  <Accordion title="Subpath runtime dan storage">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper luas runtime/logging/backup/instalasi plugin |
    | `plugin-sdk/runtime-env` | Helper sempit env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generik pendaftaran dan lookup konteks runtime channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper bersama perintah/hook/http/interaktif plugin |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/internal hook bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/pengikatan runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper formatting, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper pemuatan/penulisan konfigurasi |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat surface kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/approval-runtime` | Helper approval exec/plugin, builder kemampuan approval, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit dispatch/finalize balasan |
    | `plugin-sdk/reply-history` | Helper bersama riwayat balasan jendela pendek seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper sempit chunking teks/markdown |
    | `plugin-sdk/session-store-runtime` | Helper path store sesi + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper route/session-key/account binding seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari arg tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper proksi ambient, status, dan passive-channel bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skills |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialize perintah native |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper system event/heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil terbatas |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Grafik error, formatting, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper wrapped fetch, proxy, dan pinned lookup |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama fetch/transform/store media plus builder payload media |
    | `plugin-sdk/media-generation-runtime` | Helper bersama failover pembuatan media, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media plus export helper gambar/audio untuk penyedia |
    | `plugin-sdk/text-runtime` | Helper bersama teks/markdown/logging seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe penyedia speech plus helper directive, registri, dan validasi untuk penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia speech bersama, helper registri, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime dan helper registri |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, auth, dan helper registri |
    | `plugin-sdk/music-generation` | Tipe permintaan/hasil/penyedia pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, lookup penyedia, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, lookup penyedia, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registri target webhook dan helper pemasangan route |
    | `plugin-sdk/webhook-path` | Helper normalisasi path webhook |
    | `plugin-sdk/web-media` | Helper bersama pemuatan media remote/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memory">
    | Subpath | Export utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export engine fondasi host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Export engine embedding host memory |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export engine QMD host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Export engine storage host memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory |
    | `plugin-sdk/memory-core-host-query` | Helper query host memory |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memory |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memory |
    | `plugin-sdk/memory-core-host-status` | Helper status host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime core host memory |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal event host memory |
    | `plugin-sdk/memory-host-files` | Alias netral vendor untuk helper file/runtime host memory |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
    | `plugin-sdk/memory-host-search` | Fasad runtime memory aktif untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral vendor untuk helper status host memory |
    | `plugin-sdk/memory-lancedb` | Surface helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksud |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi barrel kompatibilitas) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam helper/kompatibilitas channel bawaan |
    | Helper khusus auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                 |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)             |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal      |
| `api.registerChannel(...)`                       | Channel pesan                    |
| `api.registerSpeechProvider(...)`                | Text-to-speech / sintesis STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video      |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                 |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                  |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                  |
| `api.registerWebFetchProvider(...)`              | Penyedia fetch / scrape web      |
| `api.registerWebSearchProvider(...)`             | Pencarian web                    |

### Alat dan perintah

| Metode                          | Yang didaftarkan                               |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)    |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                 |

### Infrastruktur

| Metode                                         | Yang didaftarkan                    |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP gateway                |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC gateway                   |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                      |
| `api.registerService(service)`                 | Layanan latar belakang               |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                   |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt memory-adjacent aditif |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memory aditif  |

Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, meskipun plugin mencoba menetapkan scope
metode gateway yang lebih sempit. Pilih prefiks khusus plugin untuk
metode milik plugin.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata level teratas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: deskriptor perintah saat parse-time yang digunakan untuk bantuan CLI root,
  routing, dan pendaftaran CLI plugin lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah level teratas yang diekspos oleh
registrar tersebut.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Kelola akun Matrix, verifikasi, perangkat, dan state profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran CLI root lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk pemuatan lazy pada parse-time.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memory terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory                                                                                                                                    |

### Adapter embedding memory

| Metode                                         | Yang didaftarkan                               |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memory untuk plugin aktif    |

- `registerMemoryCapability` adalah API plugin memory eksklusif yang direkomendasikan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat mengonsumsi artefak memory yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat
  plugin memory tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memory eksklusif yang kompatibel dengan versi lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memory aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id khusus plugin kustom).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter terdaftar tersebut.

### Event dan siklus hidup

| Metode                                       | Fungsinya                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe     |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Path sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif jika tersedia)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger terlingkup (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan path relatif terhadap root plugin                                             |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Export publik untuk konsumen eksternal
  runtime-api.ts    # Export runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan khusus setup (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Surface publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) kini memilih
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika snapshot runtime
belum ada, surface tersebut menggunakan fallback ke file konfigurasi ter-resolve di disk.

Plugin penyedia juga dapat mengekspos barrel kontrak lokal plugin yang sempit ketika sebuah
helper memang khusus penyedia dan belum layak dimasukkan ke subpath SDK generik.
Contoh bawaan saat ini: penyedia Anthropic menyimpan helper stream Claude di seam
publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih mempromosikan logika
header beta Anthropic dan `service_tier` ke kontrak generik
`plugin-sdk/*`.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder penyedia plus
  helper onboarding/konfigurasi

<Warning>
  Kode produksi extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau surface
  berorientasi kapabilitas lainnya alih-alih menggabungkan dua plugin secara erat.
</Warning>

## Terkait

- [Titik Entri](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Helper Runtime](/id/plugins/sdk-runtime) — referensi lengkap namespace `api.runtime`
- [Setup dan Konfigurasi](/id/plugins/sdk-setup) — packaging, manifes, skema konfigurasi
- [Pengujian](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [Migrasi SDK](/id/plugins/sdk-migration) — migrasi dari surface yang deprecated
- [Internal Plugin](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
