---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar SDK Plugin

SDK plugin adalah kontrak bertipe antara plugin dan inti. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulai dengan [Getting Started](/id/plugins/building-plugins)
  - Plugin saluran? Lihat [Channel Plugins](/id/plugins/sdk-channel-plugins)
  - Plugin penyedia? Lihat [Provider Plugins](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang berdiri sendiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi sirkular. Untuk helper entri/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan umbrella yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan menambahkan atau bergantung pada seam kemudahan bernama penyedia seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek saluran. Plugin bawaan sebaiknya menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` milik mereka sendiri, dan inti
sebaiknya menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik
yang sempit saat kebutuhannya benar-benar lintas saluran.

Peta ekspor yang dihasilkan masih berisi sejumlah kecil
seam helper bundled-plugin seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut ada hanya untuk pemeliharaan dan kompatibilitas bundled-plugin; subpath tersebut
sengaja dihilangkan dari tabel umum di bawah dan bukan jalur impor
yang direkomendasikan untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan berisi
lebih dari 200 subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper bundled-plugin yang dicadangkan masih muncul dalam daftar yang dihasilkan tersebut.
Anggap itu sebagai detail implementasi/permukaan kompatibilitas kecuali halaman dokumen
secara eksplisit mempromosikan salah satunya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor utama                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath saluran">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, prompt allowlist, builder status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Pencarian akun + helper fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit untuk daftar akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi saluran |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback bundled-contract |
    | `plugin-sdk/command-gating` | Helper sempit untuk gerbang otorisasi perintah |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper bersama untuk route inbound + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper bersama untuk mencatat dan mendispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper bersama untuk memuat media outbound |
    | `plugin-sdk/outbound-runtime` | Helper identitas outbound/delegasi pengiriman |
    | `plugin-sdk/poll-runtime` | Helper sempit untuk normalisasi polling |
    | `plugin-sdk/thread-bindings-runtime` | Helper siklus hidup thread-binding dan adapter |
    | `plugin-sdk/agent-media-payload` | Builder payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper bersama untuk snapshot/ringkasan status saluran |
    | `plugin-sdk/channel-config-primitives` | Primitive skema konfigurasi saluran yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi saluran |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin saluran bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper bersama untuk keputusan akses grup |
    | `plugin-sdk/direct-dm` | Helper bersama untuk auth/guard direct-DM |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/reduksi payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention yang sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-location` | Helper konteks lokasi saluran dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging saluran untuk inbound drop dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak saluran |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Helper pencarian env var auth penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terlingkup |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama untuk Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper action-auth chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper bersama untuk resolusi gateway persetujuan |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan untuk memuat adapter persetujuan native bagi entrypoint saluran panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit jika itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper auth perintah native + session-target native |
    | `plugin-sdk/command-detection` | Helper bersama untuk deteksi perintah |
    | `plugin-sdk/command-surface` | Normalisasi body perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan secret-contract yang sempit untuk permukaan secret saluran/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing secret-contract/config |
    | `plugin-sdk/security-runtime` | Helper bersama untuk trust, DM gating, konten eksternal, dan pengumpulan secret |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF untuk allowlist host dan jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dilindungi SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper sempit untuk env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generik untuk pendaftaran dan lookup konteks runtime saluran |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper bersama untuk perintah/hook/http/interaktif plugin |
    | `plugin-sdk/hook-runtime` | Helper bersama untuk pipeline hook Webhook/internal |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan, penantian, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway dan patch status saluran |
    | `plugin-sdk/config-runtime` | Helper muat/tulis konfigurasi |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kemampuan persetujuan, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit untuk dispatch/finalisasi balasan |
    | `plugin-sdk/reply-history` | Helper bersama untuk riwayat balasan jendela pendek seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper sempit untuk chunking teks/markdown |
    | `plugin-sdk/session-store-runtime` | Helper jalur penyimpanan sesi + updated-at |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/routing` | Helper binding route/session-key/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper bersama untuk ringkasan status saluran/akun, default status runtime, dan helper metadata isu |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimed dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param umum untuk tool/CLI |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper bersama untuk jalur unduhan sementara |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil untuk baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper ACP runtime/sesi dan reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP hanya-baca tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper bersama untuk passive-channel, status, dan proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah `/models`/penyedia |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah skill |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agen level rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, dan utilitas hasil upaya |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper event sistem/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Graf error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan pinned lookup |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons terbatas tanpa permukaan media runtime yang luas |
    | `plugin-sdk/session-binding-runtime` | Status binding percakapan saat ini tanpa routing configured-binding atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper sempit untuk koersi dan normalisasi primitive record/string tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Kueri/dedupe direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk fetch/transform/store media ditambah builder payload media |
    | `plugin-sdk/media-generation-runtime` | Helper bersama untuk failover pembuatan media, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia media understanding ditambah ekspor helper gambar/audio yang menghadap penyedia |
    | `plugin-sdk/text-runtime` | Helper bersama untuk teks/markdown/logging seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel Markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe penyedia speech ditambah helper directive, registri, dan validasi yang menghadap penyedia |
    | `plugin-sdk/speech-core` | Helper bersama untuk tipe penyedia speech, registri, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime dan helper registri |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Helper bersama untuk tipe, failover, auth, dan registri image-generation |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Helper bersama untuk tipe music-generation, failover, lookup penyedia, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Helper bersama untuk tipe video-generation, failover, lookup penyedia, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper instalasi route |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur Webhook |
    | `plugin-sdk/web-media` | Helper bersama untuk memuat media remote/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manajer/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registri, penyedia lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memori |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksudkan |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus saluran | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper saluran bawaan |
    | Helper auth/plugin khusus | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Method                                           | Yang didaftarkan                       |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                  | Eksekutor agen level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                       | Saluran perpesanan                     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / sintesis STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime duplex             |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                       |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                        |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                        |
| `api.registerWebFetchProvider(...)`              | Penyedia fetch / scrape web            |
| `api.registerWebSearchProvider(...)`             | Pencarian web                          |

### Tool dan perintah

| Method                          | Yang didaftarkan                                |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agen (wajib atau `{ optional: true }`)     |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                  |

### Infrastruktur

| Method                                         | Yang didaftarkan                     |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook event                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                   |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                      |
| `api.registerService(service)`                 | Layanan latar belakang               |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                   |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan |

Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, meskipun plugin mencoba menetapkan
cakupan metode Gateway yang lebih sempit. Utamakan prefix khusus plugin untuk
metode yang dimiliki plugin.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah saat parse yang digunakan untuk bantuan CLI root,
  routing, dan pendaftaran CLI plugin secara lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
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
        description: "Kelola akun Matrix, verifikasi, perangkat, dan status profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran CLI root secara lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk lazy loading saat parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk
backend CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefix penyedia dalam model ref seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Method                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (hanya satu yang aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar engine dapat menyesuaikan penambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                   |

### Adapter embedding memori

| Method                                         | Yang didaftarkan                             |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang diutamakan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan sistem lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau lebih ID adapter embedding (misalnya `openai`, `gemini`, atau ID khusus
  yang didefinisikan plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diresolusikan terhadap ID adapter
  yang terdaftar tersebut.

### Event dan siklus hidup

| Method                                       | Fungsinya                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe    |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan  |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Type                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                               |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                         |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif bila tersedia)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger dengan cakupan terbatas (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolusikan jalur relatif terhadap root plugin                                              |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan khusus penyiapan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui fasad (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) sekarang mengutamakan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, permukaan tersebut akan menggunakan fallback ke file konfigurasi yang telah diresolusikan di disk.

Plugin penyedia juga dapat mengekspos barrel kontrak lokal plugin yang sempit ketika
helper memang sengaja khusus untuk penyedia dan belum layak dimasukkan ke subpath
SDK generik. Contoh bawaan saat ini: penyedia Anthropic menyimpan helper stream Claude
di seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
menaikkan logika header beta Anthropic dan `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder penyedia serta
  helper onboarding/konfigurasi

<Warning>
  Kode produksi extension juga sebaiknya menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika suatu helper benar-benar digunakan bersama, pindahkan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau
  permukaan lain yang berorientasi kapabilitas alih-alih menggabungkan dua plugin secara erat.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/id/plugins/sdk-setup) — packaging, manifes, skema konfigurasi
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah usang
- [Plugin Internals](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
