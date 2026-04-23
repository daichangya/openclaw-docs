---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` uyarısını görüyorsunuz.'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` uyarısını görüyorsunuz.'
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz.
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz.
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'sine geçiş yapın
title: Plugin SDK Geçişi
x-i18n:
    generated_at: "2026-04-23T09:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Geçişi

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı ve belgelenmiş içe aktarmalara sahip modern bir Plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin tek bir giriş noktasından ihtiyaç duydukları
her şeyi içe aktarabilmesini sağlayan iki geniş yüzey sunuyordu:

- **`openclaw/plugin-sdk/compat`** — düzinelerce
  yardımcıyı yeniden dışa aktaran tek bir içe aktarma. Yeni Plugin mimarisi oluşturulurken eski kanca tabanlı Plugin'leri çalışır tutmak için
  getirildi.
- **`openclaw/extension-api`** — Plugin'lere gömülü agent runner gibi
  host tarafı yardımcılarına doğrudan erişim sağlayan bir köprü.

Bu iki yüzey de artık **kullanımdan kaldırılmıştır**. Çalışma zamanında hâlâ çalışırlar, ancak yeni
Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler, bir sonraki
büyük sürüm bunları kaldırmadan önce geçiş yapmalıdır.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Hâlâ bu yüzeylerden içe aktarma yapan Plugin'ler bu olduğunda bozulacaktır.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlangıç** — tek bir yardımcıyı içe aktarmak düzinelerce ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
küçük, kendi kendine yeterli, amacı net ve sözleşmesi belgelenmiş bir modüldür.

Paketli kanallar için eski provider kolaylık seam'leri de artık yok. Şunun gibi içe aktarmalar:
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanal markalı yardımcı seam'leri ve
`openclaw/plugin-sdk/telegram-core`, kararlı Plugin sözleşmeleri değil,
özel mono-repo kısayollarıydı. Bunun yerine dar, genel SDK alt yollarını kullanın. Paketli Plugin çalışma alanı içinde,
provider'a ait yardımcıları o Plugin'in kendi
`api.ts` veya `runtime-api.ts` dosyasında tutun.

Mevcut paketli provider örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` seam'inde tutar
- OpenAI, provider oluşturucuları, varsayılan model yardımcılarını ve gerçek zamanlı provider
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, provider oluşturucu ile onboarding/yapılandırma yardımcılarını kendi
  `api.ts` dosyasında tutar

## Nasıl geçiş yapılır

<Steps>
  <Step title="Yerel onay işleyicilerini yetenek olgularına geçirin">
    Onay yapabilen kanal Plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan runtime-context kayıt defteri üzerinden sunar.

    Ana değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü kimlik doğrulama/teslim davranışını eski `plugin.auth` /
      `plugin.approvals` bağlamasından alıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, herkese açık kanal-Plugin
      sözleşmesinden kaldırıldı; teslim/yerel/görüntüleme alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth`, yalnızca kanal login/logout akışları için kalır; oradaki
      onay kimlik doğrulama kancaları artık çekirdek tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      çekirdek artık yönlendirilen-başka-yerde bildirimlerinin sahibidir ve bunları gerçek teslim sonuçlarından üretir
    - `channelRuntime` değerini `createChannelManager(...)` içine geçirirken
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay yeteneği
    düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper geri dönüş davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmemiş Windows
    `.cmd`/`.bat` wrapper'ları artık açıkça `allowShellFallback: true` geçirmediğiniz sürece kapalı kalacak şekilde başarısız olur.

    ```typescript
    // Önce
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sonra
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Bunu yalnızca shell aracılı geri dönüşü bilerek kabul eden güvenilir
      // uyumluluk çağıranları için ayarlayın.
      allowShellFallback: true,
    });
    ```

    Çağıranınız bilerek shell geri dönüşüne dayanmıyorsa
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarmaları bulun">
    Plugin'inizde kullanımdan kaldırılmış iki yüzeyden birinden gelen içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı içe aktarmalarla değiştirin">
    Eski yüzeydeki her dışa aktarma belirli bir modern içe aktarma yoluna eşlenir:

    ```typescript
    // Önce (kullanımdan kaldırılmış geriye dönük uyumluluk katmanı)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sonra (modern odaklı içe aktarmalar)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Host tarafı yardımcılar için doğrudan içe aktarmak yerine enjekte edilen
    Plugin çalışma zamanını kullanın:

    ```typescript
    // Önce (kullanımdan kaldırılmış extension-api köprüsü)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sonra (enjekte edilen çalışma zamanı)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğeri |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Derleyin ve test edin">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## İçe aktarma yolu başvurusu

  <Accordion title="Yaygın içe aktarma yolu tablosu">
  | İçe aktarma yolu | Amaç | Temel dışa aktarmalar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarması | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek provider giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Allowlist istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarması güvenli kurulum patch bağdaştırıcıları, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcısı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/yapılandırma/eylem geçidi yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalizasyonu |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel yapıları | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + yazıyor wiring'i | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı factory'leri | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Kanal yapılandırma şeması türleri |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalizasyonu, açıklama kırpma, yinelenen/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme tamamlama yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet-ve-dağıt yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden kimlik/gönderim delegesi ve payload planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | Thread-binding yardımcıları | Thread-binding yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya payload yardımcıları | Eski alan düzenleri için agent medya payload oluşturucusu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcıları |
  | `plugin-sdk/channel-send-result` | Gönderim sonuç türleri | Yanıt sonuç türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar çalışma zamanı env yardımcıları | Logger/çalışma zamanı env, zaman aşımı, yeniden deneme ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcılar |
  | `plugin-sdk/hook-runtime` | Kanca işlem hattı yardımcıları | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve kanal-durumu patch yardımcıları |
  | `plugin-sdk/config-runtime` | Yapılandırma yardımcıları | Yapılandırma yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketli Telegram sözleşme yüzeyi kullanılamadığında geri dönüşte kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/Plugin onay payload'ı, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümleme, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemci yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslim yardımcıları | Yerel onay yeteneği/teslim bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; daha dar bağdaştırıcı/Gateway seam'leri yeterliyse onları tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedef yardımcıları | Yerel onay hedefi/hesap binding yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıt yardımcıları | Exec/Plugin onay yanıt payload yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal runtime-context yardımcıları | Genel kanal runtime-context register/get/watch yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM kapılama, harici içerik ve secret toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Host allowlist ve private network ilke yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Pinned-dispatcher, guarded fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama kapılama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Host normalizasyon yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | Allowlist biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist girdi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut kapılama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderici yetkilendirme yardımcıları, komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım renderer'ları | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Secret girdi ayrıştırma | Secret girdi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde guard yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalara ayırma |
  | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım yardımcıları | Tamamlama + provider dağıtım yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalara ayırma yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizin yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalizasyon yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özet oluşturucuları, çalışma zamanı durum varsayılanları, issue metadata yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözücü yardımcıları | Paylaşılan hedef çözücü yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalizasyon yardımcıları | Slug/dize normalizasyon yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarın |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalize stdout/stderr ile zamanlanmış komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Param okuyucular | Yaygın araç/CLI param okuyucuları |
  | `plugin-sdk/tool-payload` | Araç payload çıkarımı | Araç sonuç nesnelerinden normalize payload'ları çıkarın |
  | `plugin-sdk/tool-send` | Araç gönderimi çıkarımı | Araç bağımsız değişkenlerinden kanonik gönderim hedef alanlarını çıkarın |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem logger ve sansürleme yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt payload türleri |
  | `plugin-sdk/provider-setup` | Özenle seçilmiş yerel/kendi kendine barındırılan provider kurulum yardımcıları | Kendi kendine barındırılan provider keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi kendine barındırılan provider kurulum yardımcıları | Aynı kendi kendine barındırılan provider keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Provider çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Provider API anahtarı kurulum yardımcıları | API anahtarı onboarding/profile-write yardımcıları |
  | `plugin-sdk/provider-auth-result` | Provider auth-result yardımcıları | Standart OAuth auth-result oluşturucusu |
  | `plugin-sdk/provider-auth-login` | Provider etkileşimli login yardımcıları | Paylaşılan etkileşimli login yardımcıları |
  | `plugin-sdk/provider-env-vars` | Provider env-var yardımcıları | Provider auth env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan provider model/replay yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, provider-endpoint yardımcıları ve model-id normalizasyon yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan provider katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider onboarding patch'leri | Onboarding yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Provider HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel provider HTTP/uç nokta yeteneği yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Provider web-fetch yardımcıları | Web-fetch provider kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Provider web-search yapılandırma yardımcıları | Plugin etkinleştirme wiring'ine ihtiyaç duymayan provider'lar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Provider web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi setter/getter'ları gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Provider web-search yardımcıları | Web-search provider kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Provider araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
  | `plugin-sdk/provider-usage` | Provider kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer provider kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Provider akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Provider taşıma yardımcıları | Guarded fetch, taşıma mesaj dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel provider taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı eşzamansız kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/dönüştürme/depolama yardımcıları artı medya payload oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görüntü/video/müzik oluşturma için paylaşılan failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama provider türleri artı provider tarafına dönük görüntü/ses yardımcı dışa aktarmaları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Assistant-visible-text temizleme, markdown render/parçalara ayırma/tablo yardımcıları, sansürleme yardımcıları, directive-tag yardımcıları, safe-text yardımcı programları ve ilgili metin/günlükleme yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalara ayırma yardımcıları | Giden metin parçalara ayırma yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma provider türleri artı provider tarafına dönük directive, kayıt defteri ve doğrulama yardımcıları |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma provider türleri, kayıt defteri, directive'ler, normalizasyon |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Provider türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Provider türleri ve kayıt defteri yardımcıları |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma çekirdeği | Görüntü oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik oluşturma yardımcıları | Müzik oluşturma provider/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma çekirdeği | Müzik oluşturma türleri, failover yardımcıları, provider arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video oluşturma yardımcıları | Video oluşturma provider/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma çekirdeği | Video oluşturma türleri, failover yardımcıları, provider arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt payload normalizasyonu/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkel yapıları | Dar kanal config-schema ilkel yapıları |
  | `plugin-sdk/channel-config-writes` | Kanal config-write yardımcıları | Kanal config-write yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal prelude'u | Paylaşılan kanal Plugin prelude dışa aktarmaları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırma yardımcıları | Allowlist yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişim yardımcıları | Paylaşılan grup erişim karar yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM kimlik doğrulama/guard yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan extension yardımcıları | Passive-channel/status ve ambient proxy yardımcı ilkel yapıları |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve route-install yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalizasyon yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarması | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Paketli memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek indeks/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motoru | Bellek host temel motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding motoru | Bellek embedding sözleşmeleri, kayıt defteri erişimi, yerel provider ve genel batch/uzak yardımcılar; somut uzak provider'lar bunlara sahip olan Plugin'lerde yaşar |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host multimodal yardımcıları | Bellek host multimodal yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları | Bellek host secret yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları | Bellek host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları | Bellek host durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı takma adı | Bellek host çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü takma adı | Bellek host olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı takma adı | Bellek host dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Bellek komşusu Plugin'ler için paylaşılan yönetilen-markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Tembel active-memory search-manager çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Bellek host durum takma adı | Bellek host durum yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-lancedb` | Paketli memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
  | `plugin-sdk/testing` | Test yardımcı programları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo kasıtlı olarak tam SDK yüzeyi değil, yaygın geçiş alt kümesidir.
200+'den fazla giriş noktasının tam listesi
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Bu listede hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı paketli-Plugin yardımcı seam'leri bulunur. Bunlar paketli-Plugin bakımı ve uyumluluğu için dışa aktarılmış halde kalır, ancak kasıtlı olarak
yaygın geçiş tablosunda yer almaz ve yeni Plugin kodu için
önerilen hedef değildir.

Aynı kural diğer paketli yardımcı aileleri için de geçerlidir; örneğin:

- browser destek yardımcıları: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` ve `plugin-sdk/voice-call` gibi paketli yardımcı/Plugin yüzeyleri

`plugin-sdk/github-copilot-token` şu anda dar token yardımcı yüzeyini sunar:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken`.

Yapılan işe uyan en dar içe aktarmayı kullanın. Bir dışa aktarma bulamıyorsanız,
`src/plugin-sdk/` altındaki kaynağı kontrol edin veya Discord'da sorun.

## Kaldırma takvimi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler çalışma zamanında uyarılar üretir      |
| **Bir sonraki büyük sürüm** | Kullanımdan kaldırılmış yüzeyler kaldırılır; bunları hâlâ kullanan Plugin'ler başarısız olur |

Tüm çekirdek Plugin'ler zaten taşındı. Harici Plugin'ler
bir sonraki büyük sürümden önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin'inizi geliştirin
- [SDK'ye Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri geliştirme
- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — provider Plugin'leri geliştirme
- [Plugin İç Yapıları](/tr/plugins/architecture) — mimariye derin bakış
- [Plugin Manifest'i](/tr/plugins/manifest) — manifest şema başvurusu
