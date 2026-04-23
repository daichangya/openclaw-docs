---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode registrasi pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Import map, referensi API registrasi, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-23T09:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar Plugin SDK

SDK plugin adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang bisa Anda daftarkan**.

<Tip>
  **Mencari panduan how-to?**
  - Plugin pertama? Mulai dari [Getting Started](/id/plugins/building-plugins)
  - Plugin channel? Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  - Plugin provider? Lihat [Plugin Provider](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entry/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan umbrella yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan tambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan harus menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` mereka sendiri, dan core
harus menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhannya benar-benar lintas-channel.

Export map yang dihasilkan masih berisi sekumpulan kecil seam helper plugin bawaan
seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut ada hanya untuk pemeliharaan dan kompatibilitas plugin bawaan; subpath tersebut
sengaja dihilangkan dari tabel umum di bawah dan bukan path impor yang direkomendasikan
untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan
berisi 200+ subpath dan ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan tetap muncul dalam daftar yang dihasilkan itu.
Perlakukan subpath tersebut sebagai detail implementasi/permukaan kompatibilitas kecuali sebuah halaman dokumentasi
secara eksplisit mempromosikannya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor utama                                                                                                                          |
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
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, builder status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-account config/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom-command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper gate otorisasi command yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper lifecycle/finalisasi draft stream |
    | `plugin-sdk/inbound-envelope` | Helper rute inbound + builder envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper record-and-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-runtime` | Helper identitas outbound, delegasi pengiriman, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi poll yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper lifecycle dan adapter thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder payload media agent legacy |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan binding yang dikonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive skema konfigurasi channel yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan helper balasan interaktif legacy. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk inbound debounce, pencocokan mention, helper mention-policy, dan helper envelope |
    | `plugin-sdk/channel-mention-gating` | Helper mention-policy yang sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-location` | Helper konteks dan pemformatan lokasi channel |
    | `plugin-sdk/channel-logging` | Helper logging channel untuk drop inbound dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper message-action channel, plus helper skema native usang yang dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API-key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API-key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper lookup env-var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generic provider HTTP/kapabilitas endpoint, termasuk helper multipart form audio transcription |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/seleksi web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial yang dibatasi scope |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostics skema Gemini, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe stream wrapper, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri command, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan command/help seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper action-auth di obrolan yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native yang ringan untuk entrypoint channel yang panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit jika sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + binding akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper auth command native + target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi command bersama |
    | `plugin-sdk/command-surface` | Helper normalisasi body command dan permukaan command |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper koleksi kontrak secret yang sempit untuk permukaan secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` yang sempit dan helper pengetikan SecretRef untuk parsing kontrak secret/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper trust, gating DM, konten eksternal, dan koleksi secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF host allowlist dan jaringan privat |
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
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan lookup konteks runtime channel generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper client gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper muat/tulis konfigurasi dan helper lookup konfigurasi plugin |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kapabilitas persetujuan, helper auth/profil, helper perutean/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan yang sempit |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path session store + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper rute/key sesi/binding akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command bertempo dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target pengiriman kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP hanya-baca tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive skema konfigurasi runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan dangerous-name |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper passive-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar command Skills |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialize command native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent level rendah: tipe harness, helper steer/abort run aktif, helper bridge tool OpenClaw, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper event sistem/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache terbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper grafik error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan lookup yang dipin |
    | `plugin-sdk/runtime-fetch` | Runtime fetch yang sadar-dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons terbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa perutean binding yang dikonfigurasi atau penyimpanan pairing |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent |
    | `plugin-sdk/directory-runtime` | Kueri/dedupe direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan testing">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper fetch/transform/store media bersama plus builder payload media |
    | `plugin-sdk/media-generation-runtime` | Helper failover generasi media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider media understanding plus ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat assistant, helper render/chunking/tabel markdown, helper redaksi, helper directive-tag, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech plus helper directive, registri, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Tipe provider speech bersama, helper registri, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider realtime transcription, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe provider realtime voice dan helper registri |
    | `plugin-sdk/image-generation` | Tipe provider generasi gambar |
    | `plugin-sdk/image-generation-core` | Tipe generasi gambar bersama, failover, auth, dan helper registri |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil generasi musik |
    | `plugin-sdk/music-generation-core` | Tipe generasi musik bersama, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil generasi video |
    | `plugin-sdk/video-generation-core` | Tipe generasi video bersama, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper instalasi rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media remote/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath Memory">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host Memory, akses registri, provider lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host Memory |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host Memory |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host Memory |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host Memory |
    | `plugin-sdk/memory-core-host-status` | Helper status host Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host Memory |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host Memory |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host Memory |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host Memory |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan Memory |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host Memory |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi barrel kompatibilitas) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API registrasi

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode
berikut:

### Registrasi kapabilitas

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Executor agent level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Channel pesan                         |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi voice realtime dupleks           |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video           |
| `api.registerImageGenerationProvider(...)`       | Generasi gambar                       |
| `api.registerMusicGenerationProvider(...)`       | Generasi musik                        |
| `api.registerVideoGenerationProvider(...)`       | Generasi video                        |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                         |

### Tools dan command

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Command kustom (melewati LLM)                |

### Infrastruktur

| Method                                          | What it registers                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook event                              |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | Metode RPC Gateway                      |
| `api.registerCli(registrar, opts?)`             | Subperintah CLI                         |
| `api.registerService(service)`                  | Layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)`  | Handler interaktif                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory ekstensi Pi embedded-runner     |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt tambahan yang berdekatan dengan Memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/baca tambahan untuk Memory |

Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, bahkan jika plugin mencoba menetapkan
scope metode gateway yang lebih sempit. Utamakan prefiks khusus plugin untuk
metode milik plugin.

Gunakan `api.registerEmbeddedExtensionFactory(...)` saat plugin memerlukan
timing event Pi-native selama run embedded OpenClaw, misalnya penulisan ulang
`tool_result` async yang harus terjadi sebelum pesan hasil tool final dikeluarkan.
Saat ini ini adalah seam plugin bawaan: hanya plugin bawaan yang boleh mendaftarkannya, dan
mereka harus mendeklarasikan `contracts.embeddedExtensionFactories: ["pi"]` di
`openclaw.plugin.json`. Pertahankan hook plugin OpenClaw normal untuk semua hal yang
tidak memerlukan seam level lebih rendah tersebut.

### Metadata registrasi CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root command eksplisit yang dimiliki registrar
- `descriptors`: deskriptor command pada waktu parse yang digunakan untuk bantuan CLI root,
  perutean, dan registrasi CLI plugin lazy

Jika Anda ingin command plugin tetap lazy-loaded di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root command tingkat atas yang diekspos oleh
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

Gunakan `commands` saja hanya saat Anda tidak memerlukan registrasi CLI root yang lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak menginstal
placeholder berbasis descriptor untuk lazy loading pada waktu parse.

### Registrasi backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks provider dalam model ref seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas default
  plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).

### Slot eksklusif

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (hanya satu aktif pada suatu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` sehingga engine dapat menyesuaikan penambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas Memory terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt Memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush Memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime Memory                                                                                                                                     |

### Adapter embedding Memory

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding Memory untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin Memory eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga plugin pendamping dapat menggunakan artefak Memory yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat
  plugin Memory tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin Memory eksklusif yang kompatibel dengan legacy.
- `registerMemoryEmbeddingProvider` memungkinkan plugin Memory aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id khusus plugin kustom).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` di-resolve terhadap id adapter terdaftar tersebut.

### Event dan lifecycle

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook lifecycle bertipe        |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan   |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `cancel`), bukan sebagai override.
- `message_received`: gunakan field `threadId` bertipe saat Anda memerlukan perutean inbound thread/topic. Simpan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk state startup milik gateway alih-alih bergantung pada hook internal `gateway:startup`.

### Field objek API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                               |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Path source plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime in-memory aktif saat tersedia)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger dengan scope (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan pra-entri-penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path relatif terhadap root plugin                                                   |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan khusus setup (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanyalah kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) kini lebih mengutamakan
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika snapshot
runtime belum ada, permukaan ini fallback ke file konfigurasi yang telah di-resolve di disk.

Plugin provider juga dapat mengekspos barrel kontrak lokal-plugin yang sempit saat sebuah
helper memang khusus provider dan belum layak dimasukkan ke subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude
dalam seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
mempromosikan header beta Anthropic dan logika `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider plus
  helper onboarding/konfigurasi

<Warning>
  Kode produksi extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar bersifat bersama, promosikan helper tersebut ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lainnya alih-alih mengikat dua plugin bersama.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/id/plugins/sdk-setup) — packaging, manifest, skema konfigurasi
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah deprecated
- [Plugin Internals](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
