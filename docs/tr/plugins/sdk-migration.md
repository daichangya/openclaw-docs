---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` uyarısını görüyorsunuz'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` uyarısını görüyorsunuz'
    - Bir Plugin'i modern plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'sına geçiş
title: Plugin SDK Geçişi
x-i18n:
    generated_at: "2026-04-21T09:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Geçişi

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarmalara sahip modern bir plugin mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski plugin sistemi, Plugin'lerin tek bir giriş noktasından ihtiyaç duydukları
her şeyi içe aktarmasına izin veren iki geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** — onlarca yardımcıyı yeniden dışa aktaran
  tek bir içe aktarma. Yeni plugin mimarisi inşa edilirken eski kanca tabanlı
  Plugin'lerin çalışmaya devam etmesini sağlamak için tanıtıldı.
- **`openclaw/extension-api`** — Plugin'lere gömülü aracı çalıştırıcısı gibi
  ana makine tarafı yardımcılarına doğrudan erişim veren bir köprü.

Her iki yüzey de artık **deprecated** durumdadır. Çalışma zamanında hâlâ çalışırlar,
ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler bir sonraki
büyük sürüm bunları kaldırmadan önce geçiş yapmalıdır.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan Plugin'ler bu gerçekleştiğinde bozulacaktır.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara yol açıyordu:

- **Yavaş başlangıç** — bir yardımcıyı içe aktarmak, ilişkili olmayan onlarca modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar, içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amaca ve belgelenmiş sözleşmeye sahip küçük, kendi kendine yeterli bir modüldür.

Paketlenmiş kanallar için eski sağlayıcı kolaylık katmanları da kaldırıldı. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanal markalı yardımcı katmanları ve
`openclaw/plugin-sdk/telegram-core` gibi içe aktarmalar, kararlı
plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar,
genel SDK alt yollarını kullanın. Paketlenmiş Plugin çalışma alanı içinde,
sağlayıcıya ait yardımcıları ilgili Plugin'in kendi
`api.ts` veya `runtime-api.ts` dosyasında tutun.

Geçerli paketlenmiş sağlayıcı örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` katmanında tutar
- OpenAI, sağlayıcı oluşturucularını, varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucusunu ve onboarding/yapılandırma yardımcılarını kendi
  `api.ts` dosyasında tutar

## Nasıl geçiş yapılır

<Steps>
  <Step title="Yerel onay işleyicilerini yetenek gerçeklerine taşıyın">
    Onay yetenekli kanal Plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan runtime-context kaydı üzerinden açığa çıkarır.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` kullanımını
      `approvalCapability.nativeRuntime` ile değiştirin
    - Onaya özgü auth/teslimat bağlantılarını eski `plugin.auth` /
      `plugin.approvals` yapısından `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, genel kanal-Plugin
      sözleşmesinden kaldırıldı; delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth`, yalnızca kanal login/logout akışları için kalır; oradaki
      onay auth kancaları artık çekirdek tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      çekirdek artık başka yere yönlendirildi bildirimlerini gerçek teslimat sonuçlarından yönetir
    - `channelRuntime` değerini `createChannelManager(...)` içine geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay yeteneği düzeni için bkz. `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Windows wrapper geri dönüş davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmemiş Windows
    `.cmd`/`.bat` wrapper'ları artık siz açıkça `allowShellFallback: true`
    geçmediğiniz sürece güvenli biçimde kapalı başarısız olur.

    ```typescript
    // Önce
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sonra
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Bunu yalnızca shell aracılı geri dönüşü bilinçli olarak kabul eden
      // güvenilir uyumluluk çağıranları için ayarlayın.
      allowShellFallback: true,
    });
    ```

    Çağıranınız bilinçli olarak shell geri dönüşüne dayanmıyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Deprecated içe aktarmaları bulun">
    Plugin'inizde deprecated yüzeylerden herhangi birine ait içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Bunları odaklı içe aktarmalarla değiştirin">
    Eski yüzeydeki her dışa aktarma, belirli bir modern içe aktarma yoluna eşlenir:

    ```typescript
    // Önce (deprecated geriye dönük uyumluluk katmanı)
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

    Ana makine tarafı yardımcıları için, doğrudan içe aktarmak yerine eklenmiş
    plugin çalışma zamanını kullanın:

    ```typescript
    // Önce (deprecated extension-api köprüsü)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sonra (eklenmiş çalışma zamanı)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğer |
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
  | `plugin-sdk/plugin-entry` | Kanonik plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | İzin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarma açısından güvenli kurulum yama bağdaştırıcıları, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcısı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araçlama yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listeleme/yapılandırma/eylem geçidi yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar hesap yardımcıları | Hesap listeleme/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + yazıyor bağlantısı | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Kanal yapılandırma şeması türleri |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu takibi | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydetme ve dağıtma yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden kimlik/gönderim temsilcisi ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için aracı medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Deprecated uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcıları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/plugin-kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı yardımcıları | Logger/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcılar |
  | `plugin-sdk/hook-runtime` | Kanca işlem hattı yardımcıları | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve kanal-durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Yapılandırma yardımcıları | Yapılandırma yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında geri dönüş açısından kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümleme, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimat yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/Gateway katmanları yeterliyse onları tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Exec/plugin onay yanıt yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal runtime-context yardımcıları | Genel kanal runtime-context kaydetme/alma/izleme yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçitleme, harici içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dispatcher, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarılmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | İzin listesi girdi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen-yetkilendirme yardımcıları, komut kayıt yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma | Gizli girdi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcıları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım yardımcıları | Sonlandırma + sağlayıcı dağıtım yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parça yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellendi-zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarma |
  | `plugin-sdk/run-command` | Zamanlı komut yardımcıları | Normalize stdout/stderr ile zamanlı komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Yaygın araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarımı | Araç sonuç nesnelerinden normalize yükleri çıkarma |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarımı | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarma |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem logger ve sansürleme yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi kendine barındırılan sağlayıcı kurulum yardımcıları | Kendi kendine barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi kendine barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi kendine barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı onboarding/profil-yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı auth-result yardımcıları | Standart OAuth auth-result oluşturucu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli login yardımcıları | Paylaşılan etkileşimli login yardımcıları |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı env-var yardımcıları | Sağlayıcı auth env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/tekrar oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Sağlayıcı onboarding yamaları | Onboarding yapılandırma yardımcıları |
| `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
| `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
| `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search yapılandırma yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
| `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
| `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
| `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
| `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
| `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
| `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
| `plugin-sdk/keyed-async-queue` | Sıralı async kuyruk | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/dönüştürme/depolama yardımcıları ve medya yükü oluşturucuları |
| `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yardımcıları | Görsel/video/müzik üretimi için paylaşılan hata durumunda geçiş yardımcıları, aday seçimi ve eksik model mesajlaşması |
| `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görsel/ses yardımcı dışa aktarmaları |
| `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistan tarafından görülebilen metin temizleme, markdown işleme/parçalama/tablo yardımcıları, sansürleme yardımcıları, yönerge etiketi yardımcıları, güvenli metin yardımcıları ve ilgili metin/günlükleme yardımcıları |
| `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
| `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt ve doğrulama yardımcıları |
| `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt, yönergeler, normalleştirme |
| `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri ve kayıt yardımcıları |
| `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri ve kayıt yardımcıları |
| `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi çekirdeği | Görsel üretimi türleri, hata durumunda geçiş, kimlik doğrulama ve kayıt yardımcıları |
| `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
| `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, hata durumunda geçiş yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
| `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
| `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, hata durumunda geçiş yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
| `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
| `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkel öğeleri | Dar kanal config-schema ilkel öğeleri |
| `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
| `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıç bölümü | Paylaşılan kanal plugin başlangıç dışa aktarmaları |
| `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
| `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
| `plugin-sdk/group-access` | Grup erişim yardımcıları | Paylaşılan grup erişim kararı yardımcıları |
| `plugin-sdk/direct-dm` | Doğrudan-DM yardımcıları | Paylaşılan doğrudan-DM auth/koruma yardımcıları |
| `plugin-sdk/extension-shared` | Paylaşılan eklenti yardımcıları | Pasif kanal/durum ve ortam proxy yardımcısı ilkel öğeleri |
| `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kaydı ve rota-kurulum yardımcıları |
| `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalleştirme yardımcıları |
| `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
| `plugin-sdk/zod` | Zod yeniden dışa aktarma | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
| `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Memory yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
| `plugin-sdk/memory-core-engine-runtime` | Memory motoru çalışma zamanı cephesi | Memory dizin/aramanın çalışma zamanı cephesi |
| `plugin-sdk/memory-core-host-engine-foundation` | Memory ana makine temel motoru | Memory ana makine temel motoru dışa aktarmaları |
| `plugin-sdk/memory-core-host-engine-embeddings` | Memory ana makine embedding motoru | Memory embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi Plugin'lerinde bulunur |
| `plugin-sdk/memory-core-host-engine-qmd` | Memory ana makine QMD motoru | Memory ana makine QMD motoru dışa aktarmaları |
| `plugin-sdk/memory-core-host-engine-storage` | Memory ana makine depolama motoru | Memory ana makine depolama motoru dışa aktarmaları |
| `plugin-sdk/memory-core-host-multimodal` | Memory ana makine çok modlu yardımcıları | Memory ana makine çok modlu yardımcıları |
| `plugin-sdk/memory-core-host-query` | Memory ana makine sorgu yardımcıları | Memory ana makine sorgu yardımcıları |
| `plugin-sdk/memory-core-host-secret` | Memory ana makine gizli bilgi yardımcıları | Memory ana makine gizli bilgi yardımcıları |
| `plugin-sdk/memory-core-host-events` | Memory ana makine olay günlüğü yardımcıları | Memory ana makine olay günlüğü yardımcıları |
| `plugin-sdk/memory-core-host-status` | Memory ana makine durum yardımcıları | Memory ana makine durum yardımcıları |
| `plugin-sdk/memory-core-host-runtime-cli` | Memory ana makine CLI çalışma zamanı | Memory ana makine CLI çalışma zamanı yardımcıları |
| `plugin-sdk/memory-core-host-runtime-core` | Memory ana makine çekirdek çalışma zamanı | Memory ana makine çekirdek çalışma zamanı yardımcıları |
| `plugin-sdk/memory-core-host-runtime-files` | Memory ana makine dosya/çalışma zamanı yardımcıları | Memory ana makine dosya/çalışma zamanı yardımcıları |
| `plugin-sdk/memory-host-core` | Memory ana makine çekirdek çalışma zamanı takma adı | Memory ana makine çekirdek çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
| `plugin-sdk/memory-host-events` | Memory ana makine olay günlüğü takma adı | Memory ana makine olay günlüğü yardımcıları için üreticiden bağımsız takma ad |
| `plugin-sdk/memory-host-files` | Memory ana makine dosya/çalışma zamanı takma adı | Memory ana makine dosya/çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
| `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Memory ile ilişkili Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
| `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Tembel active-memory search-manager çalışma zamanı cephesi |
| `plugin-sdk/memory-host-status` | Memory ana makine durum takma adı | Memory ana makine durum yardımcıları için üreticiden bağımsız takma ad |
| `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
| `plugin-sdk/testing` | Test yardımcı programları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo kasıtlı olarak tam SDK yüzeyi değil, yaygın geçiş alt kümesidir.
200+'dan fazla giriş noktasının tam listesi
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Bu liste hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı paketlenmiş-Plugin
yardımcı katmanlarını içerir. Bunlar paketlenmiş-Plugin bakımı ve uyumluluk için
dışa aktarılmaya devam eder, ancak kasıtlı olarak yaygın geçiş tablosuna dahil
edilmezler ve yeni plugin kodu için önerilen hedef değildirler.

Aynı kural diğer paketlenmiş yardımcı aileleri için de geçerlidir; örneğin:

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
  `plugin-sdk/thread-ownership` ve `plugin-sdk/voice-call` gibi paketlenmiş yardımcı/Plugin yüzeyleri

`plugin-sdk/github-copilot-token` şu anda dar belirteç-yardımcısı
yüzeyi olan `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını sunar.

İşe en uygun en dar içe aktarmayı kullanın. Bir dışa aktarma bulamıyorsanız,
`src/plugin-sdk/` altındaki kaynağı kontrol edin veya Discord'da sorun.

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| **Şimdi**              | Deprecated yüzeyler çalışma zamanında uyarı üretir                    |
| **Bir sonraki büyük sürüm** | Deprecated yüzeyler kaldırılır; bunları hâlâ kullanan Plugin'ler başarısız olur |

Tüm çekirdek Plugin'ler zaten geçirilmiştir. Harici Plugin'ler bir sonraki büyük
sürüme kadar geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış yoludur, kalıcı bir çözüm değildir.

## İlgili

- [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) — mimariye derinlemesine bakış
- [Plugin Manifest'i](/tr/plugins/manifest) — manifest şeması başvurusu
