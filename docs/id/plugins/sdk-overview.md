---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Import map, referensi API pendaftaran, dan arsitektur SDK
title: Ringkasan SDK Plugin
x-i18n:
    generated_at: "2026-04-22T09:15:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57019e6f9a7fed7842ac575e025b6db41d125f5fa9d0d1de03923fdb1f6bcc3
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ringkasan SDK Plugin

SDK plugin adalah kontrak bertipe antara plugin dan inti. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulai dengan [Getting Started](/id/plugins/building-plugins)
  - Plugin channel? Lihat [Channel Plugins](/id/plugins/sdk-channel-plugins)
  - Plugin provider? Lihat [Provider Plugins](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi sirkular. Untuk helper build/entry khusus channel,
gunakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan tambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan harus menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` milik mereka sendiri, dan inti
sebaiknya menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik sempit
ketika kebutuhannya benar-benar lintas-channel.

Peta ekspor yang dihasilkan masih berisi sejumlah kecil
seam helper plugin bawaan seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath tersebut
hanya ada untuk pemeliharaan dan kompatibilitas plugin bawaan; subpath itu
sengaja dihilangkan dari tabel umum di bawah ini dan bukan path impor yang direkomendasikan
untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan berisi
200+ subpath ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan masih muncul dalam daftar yang dihasilkan tersebut.
Perlakukan itu sebagai detail implementasi/permukaan kompatibilitas kecuali sebuah halaman dokumentasi
secara eksplisit mempromosikannya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor utama                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Pencarian akun + helper fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-aksi akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper sempit gerbang otorisasi perintah |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper lifecycle/finalisasi stream draf |
    | `plugin-sdk/inbound-envelope` | Helper bersama rute inbound + pembuat envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper bersama pencatatan dan dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper bersama pemuatan media outbound |
    | `plugin-sdk/outbound-runtime` | Helper identitas outbound, delegasi pengiriman, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper sempit normalisasi poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper lifecycle dan adapter pengikatan thread |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper pengikatan percakapan/thread, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper bersama snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitive sempit skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper bersama keputusan akses grup |
    | `plugin-sdk/direct-dm` | Helper bersama autentikasi/guard direct-DM |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan helper balasan interaktif lama. Lihat [Message Presentation](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-mention-gating` | Helper sempit kebijakan mention tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-location` | Helper konteks lokasi channel dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging channel untuk inbound yang dibuang dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper aksi pesan channel, plus helper skema native yang sudah deprecated dan dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper sempit kontrak rahasia seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted terfokus yang kompatibel dengan OpenAI |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime resolusi API key untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Pembuat auth-result OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper pencarian env var autentikasi provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper HTTP/kemampuan endpoint provider generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper sempit kontrak konfigurasi/seleksi web-fetch seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper sempit konfigurasi/kredensial web-search untuk provider yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper sempit kontrak konfigurasi/kredensial web-search seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terlingkup |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama untuk Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider native seperti guarded fetch, transformasi pesan transport, dan writable transport event stream |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Pembuat pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter approval exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman approval native |
    | `plugin-sdk/approval-gateway-runtime` | Helper bersama resolusi gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan pemuatan adapter approval native untuk entrypoint channel yang panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime approval yang lebih luas; gunakan seam adapter/gateway yang lebih sempit bila itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target approval native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper autentikasi perintah native + helper target sesi native |
    | `plugin-sdk/command-detection` | Helper bersama deteksi perintah |
    | `plugin-sdk/command-surface` | Normalisasi body perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper sempit pengumpulan kontrak rahasia untuk permukaan rahasia channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper sempit `coerceSecretRef` dan pengetikan SecretRef untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper bersama trust, gerbang DM, konten eksternal, dan pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper sempit pinned-dispatcher tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dijaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper sempit env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generik pendaftaran dan lookup konteks runtime channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper bersama perintah/hook/http/interaktif plugin |
    | `plugin-sdk/hook-runtime` | Helper bersama pipeline Webhook/hook internal |
    | `plugin-sdk/lazy-runtime` | Helper impor/pengikatan runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper eksekusi proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper memuat/menulis konfigurasi |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper approval exec/plugin, pembuat kemampuan approval, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit dispatch/finalisasi balasan |
    | `plugin-sdk/reply-history` | Helper bersama riwayat balasan jendela pendek seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper sempit chunking teks/markdown |
    | `plugin-sdk/session-store-runtime` | Helper path session store + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper bersama ringkasan status channel/akun, default status runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper bersama target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter umum alat/CLI |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Mengekstrak field target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/temp-path` | Helper bersama path unduhan sementara |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP baca-saja tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive sempit skema konfigurasi runtime agen |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper bersama passive-channel, status, dan proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skill |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialize perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, helper steer/abort run aktif, helper jembatan alat OpenClaw, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper event sistem/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper graph error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper wrapped fetch, proxy, dan pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch sadar-dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons terbatas tanpa permukaan media runtime yang luas |
    | `plugin-sdk/session-binding-runtime` | Status binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper sempit record/string coercion dan normalisasi primitive tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/dedupe direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama fetch/transform/store media plus pembuat payload media |
    | `plugin-sdk/media-generation-runtime` | Helper bersama failover generasi media, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media plus ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper bersama teks/markdown/logging seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech plus helper direktif, registri, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Helper bersama tipe provider speech, registri, direktif, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime dan helper registri |
    | `plugin-sdk/realtime-voice` | Tipe provider suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Tipe provider generasi gambar |
    | `plugin-sdk/image-generation-core` | Helper bersama tipe generasi gambar, failover, auth, dan registri |
    | `plugin-sdk/music-generation` | Tipe provider/request/result generasi musik |
    | `plugin-sdk/music-generation-core` | Helper bersama tipe generasi musik, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/request/result generasi video |
    | `plugin-sdk/video-generation-core` | Helper bersama tipe generasi video, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Helper registri target Webhook dan instalasi rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper bersama pemuatan media remote/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memory">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memory, akses registri, provider lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memory |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memory |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memory |
    | `plugin-sdk/memory-core-host-status` | Helper status host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memory |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memory |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memory |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memory |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksudkan |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi barrel kompatibilitas) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper khusus auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Method                                           | Yang didaftarkan                        |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                    |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal             |
| `api.registerChannel(...)`                       | Channel perpesanan                      |
| `api.registerSpeechProvider(...)`                | Text-to-speech / sintesis STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming          |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks             |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video             |
| `api.registerImageGenerationProvider(...)`       | Generasi gambar                         |
| `api.registerMusicGenerationProvider(...)`       | Generasi musik                          |
| `api.registerVideoGenerationProvider(...)`       | Generasi video                          |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape             |
| `api.registerWebSearchProvider(...)`             | Pencarian web                           |

### Alat dan perintah

| Method                          | Yang didaftarkan                               |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)    |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                 |

### Infrastruktur

| Method                                          | Yang didaftarkan                        |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook event                              |
| `api.registerHttpRoute(params)`                 | endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | metode RPC Gateway                      |
| `api.registerCli(registrar, opts?)`             | subperintah CLI                         |
| `api.registerService(service)`                  | layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)`  | handler interaktif                      |
| `api.registerEmbeddedExtensionFactory(factory)` | pabrik extension embedded-runner Pi     |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt tambahan yang berdekatan dengan memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/baca memory tambahan   |

Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, bahkan jika sebuah plugin mencoba menetapkan
cakupan metode gateway yang lebih sempit. Gunakan prefiks khusus plugin untuk
metode milik plugin.

Gunakan `api.registerEmbeddedExtensionFactory(...)` ketika sebuah plugin memerlukan
timing event native Pi selama proses embedded OpenClaw, misalnya penulisan ulang
`tool_result` async yang harus terjadi sebelum pesan hasil alat akhir dikirim.
Ini adalah seam plugin bawaan saat ini: hanya plugin bawaan yang boleh mendaftarkannya, dan
mereka harus mendeklarasikan `contracts.embeddedExtensionFactories: ["pi"]` dalam
`openclaw.plugin.json`. Tetap gunakan hook plugin OpenClaw biasa untuk semua hal
yang tidak memerlukan seam tingkat lebih rendah tersebut.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: deskriptor perintah saat parse yang digunakan untuk bantuan CLI root,
  routing, dan pendaftaran CLI plugin lazy

Jika Anda ingin sebuah perintah plugin tetap dimuat secara lazy pada jalur CLI root normal,
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

Gunakan `commands` saja hanya jika Anda tidak memerlukan pendaftaran CLI root lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk pemuatan lazy saat parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan sebuah plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks penyedia dalam ref model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika sebuah backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).

### Slot eksklusif

| Method                                     | Yang didaftarkan                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (hanya satu yang aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` sehingga engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memory terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memory                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memory                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory                                                                                                                                    |

### Adapter embedding memory

| Method                                         | Yang didaftarkan                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memory untuk plugin aktif   |

- `registerMemoryCapability` adalah API plugin memory eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat menggunakan artifact memory yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak privat
  plugin memory tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memory eksklusif yang kompatibel dengan sistem lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memory aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom yang ditentukan plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diresolusikan terhadap id adapter yang terdaftar tersebut.

### Event dan lifecycle

| Method                                       | Fungsinya                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook lifecycle bertipe       |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default akan dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Type                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id Plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                               |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                |
| `api.source`             | `string`                  | Path sumber Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif bila tersedia)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger terlingkup (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Meresolusikan path relatif terhadap root plugin                                             |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime hanya-internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan hanya-setup (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanyalah kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) kini mengutamakan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada
snapshot runtime, permukaan tersebut akan fallback ke file konfigurasi yang telah diresolusikan di disk.

Plugin provider juga dapat mengekspos barrel kontrak lokal-plugin yang sempit ketika sebuah
helper memang khusus provider dan belum layak ditempatkan di subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude
di seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
menaikkan logika header beta Anthropic dan `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider plus
  helper onboarding/konfigurasi

<Warning>
  Kode produksi extension juga sebaiknya menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar dipakai bersama, naikkan helper tersebut ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi pada kapabilitas alih-alih menggabungkan dua plugin secara erat.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/id/plugins/sdk-setup) — packaging, manifes, skema konfigurasi
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah deprecated
- [Plugin Internals](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
