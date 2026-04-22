---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru kaynağı istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: İçe aktarma eşlemesi, kayıt API referansı ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-22T08:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57019e6f9a7fed7842ac575e025b6db41d125f5fa9d0d1de03923fdb1f6bcc3
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, Plugin'ler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınızın** ve **neleri kaydedebileceğinizin** başvuru kaynağıdır.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk Plugin? [Başlangıç](/tr/plugins/building-plugins) ile başlayın
  - Kanal Plugin'i? Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)
  - Sağlayıcı Plugin'i? Bkz. [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlatmayı hızlı tutar
ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlı kullanım kolaylığı sağlayan ayrım noktalarını veya
kanal markalı yardımcı ayrım noktalarını eklemeyin ya da bunlara bağımlı olmayın.
Paketle birlikte gelen Plugin'ler, kendi `api.ts` veya `runtime-api.ts` barrel dosyaları içinde
genel SDK alt yollarını birleştirmelidir; çekirdek ise ya bu Plugin'e yerel barrel dosyalarını
kullanmalı ya da ihtiyaç gerçekten kanallar arasıysa dar, genel bir SDK
sözleşmesi eklemelidir.

Üretilmiş dışa aktarma eşlemesi hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi
az sayıda paketle birlikte gelen Plugin yardımcı ayrım noktasını içerir. Bu
alt yollar yalnızca paketle birlikte gelen Plugin bakımı ve uyumluluk içindir;
aşağıdaki ortak tabloda bilinçli olarak yer verilmemiştir ve yeni üçüncü taraf
Plugin'ler için önerilen içe aktarma yolu değildir.

## Alt yol referansı

En sık kullanılan alt yollar, amaçlarına göre gruplanmıştır. 200'den fazla alt yoldan oluşan
üretilmiş tam liste `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Ayrılmış paketle birlikte gelen Plugin yardımcı alt yolları bu üretilmiş listede
hâlâ görünür. Bir doküman sayfası birini açıkça herkese açık olarak öne çıkarmadıkça,
bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                     | Temel dışa aktarımlar                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketle birlikte gelen sözleşme geri dönüşü ile Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, taslak akış yaşam döngüsü/sonlandırma yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kayıt ve sevk yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderme delegesi ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel türleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimat ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleştirme, mention-policy yardımcıları ve zarf yardımcıları için uyumluluk barrel dosyası |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention-policy yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşüşler ve yazıyor/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/reaksiyon bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş local/self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth auth-result oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı Plugin'leri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env var arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web getirme yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web getirme sağlayıcısı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web arama yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web arama yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web arama sağlayıcısı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/map/önbellek yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyicisi çalışma zamanı yardımcıları; daha dar bağdaştırıcı/gateway ayrım noktaları yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulama + yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılama, harici içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana bilgisayar izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, günlükleyici, zaman aşımı, retry ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komutu/hook/http/etkileşimli yardımcılar |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/iç hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketle birlikte gelen Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma kontrolleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel dosyası olmadan dosya referansı otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalara ayırma, sevk, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt sevk/sonlandırma yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalara ayırma yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve issue meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlamalı komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarma |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yinelenenleri ayıklama önbellek yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt sevk yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlatma içe aktarmaları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkel türleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı ilkel türleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviye ajan harness'leri için deneysel güvenilir Plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/durdurma yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonucu yardımcı araçları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dağıtıcı farkındalıklı çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleme depoları olmadan mevcut konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarmaları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize dönüştürme ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana bilgisayar adı ve SCP ana bilgisayar normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Retry yapılandırması ve retry çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/yinelenenleri ayıklama |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depolama yardımcıları ile medya yükü oluşturucuları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ile sağlayıcıya dönük görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin temizleme, Markdown işleme/parçalara ayırma/tablo yardımcıları, redaksiyon yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalara ayırma yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ile sağlayıcıya dönük directive, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, directive ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel oluşturma sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yol normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/local medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Manager/config/file/CLI yardımcıları için paketle birlikte gelen memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Memory dizini/arama çalışma zamanı yüzeyi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding sözleşmeleri, kayıt defteri erişimi, local sağlayıcı ve genel batch/uzak yardımcıları |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Memory host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Memory host gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Memory host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Memory host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Memory host çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Memory host olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Memory host dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Memory'ye komşu Plugin'ler için paylaşılan yönetilen Markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı yüzeyi |
    | `plugin-sdk/memory-host-status` | Memory host durum yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketle birlikte gelen memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketle birlikte gelen yardımcı alt yollar">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketle birlikte gelen tarayıcı Plugin destek yardımcıları (`browser-support` uyumluluk barrel dosyası olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketle birlikte gelen Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketle birlikte gelen LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketle birlikte gelen IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketle birlikte gelen kanal uyumluluk/yardımcı ayrım noktaları |
    | Kimlik doğrulama/Plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketle birlikte gelen özellik/Plugin yardımcı ayrım noktaları; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarır |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` callback'i, şu
yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Ne kaydeder                           |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviye ajan yürütücüsü |
| `api.registerCliBackend(...)`                    | local CLI çıkarım arka ucu            |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi      |
| `api.registerRealtimeTranscriptionProvider(...)` | Akış tabanlı gerçek zamanlı transkripsiyon |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görsel oluşturma                      |
| `api.registerMusicGenerationProvider(...)`       | Müzik oluşturma                       |
| `api.registerVideoGenerationProvider(...)`       | Video oluşturma                       |
| `api.registerWebFetchProvider(...)`              | Web getirme / scrape sağlayıcısı      |
| `api.registerWebSearchProvider(...)`             | Web arama                             |

### Araçlar ve komutlar

| Yöntem                          | Ne kaydeder                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                    |

### Altyapı

| Yöntem                                          | Ne kaydeder                           |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Olay hook'u                           |
| `api.registerHttpRoute(params)`                 | Gateway HTTP uç noktası               |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC yöntemi                   |
| `api.registerCli(registrar, opts?)`             | CLI alt komutu                        |
| `api.registerService(service)`                  | Arka plan hizmeti                     |
| `api.registerInteractiveHandler(registration)`  | Etkileşimli işleyici                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi embedded-runner uzantı fabrikası   |
| `api.registerMemoryPromptSupplement(builder)`   | Eklemeli Memory'ye komşu prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`   | Eklemeli Memory arama/okuma corpus'u  |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`), bir Plugin daha dar bir gateway yöntemi kapsamı atamaya çalışsa bile
her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
Plugin'e özgü ön ekleri tercih edin.

Bir Plugin OpenClaw gömülü çalıştırmalarında Pi-yerel
olay zamanlamasına ihtiyaç duyuyorsa `api.registerEmbeddedExtensionFactory(...)` kullanın; örneğin,
son araç-sonucu mesajı gönderilmeden önce gerçekleşmesi gereken async `tool_result`
yeniden yazımları gibi.
Bu, bugün paketle birlikte gelen Plugin ayrım noktasıdır: yalnızca paketle birlikte gelen Plugin'ler bir tane kaydedebilir ve
`openclaw.plugin.json` içinde `contracts.embeddedExtensionFactories: ["pi"]`
bildirmelidir.
Bu daha düşük seviye ayrım noktasını gerektirmeyen her şey için normal OpenClaw Plugin hook'larını koruyun.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)` iki tür üst seviye meta veri kabul eder:

- `commands`: registrar'ın sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel Plugin CLI kaydı için
  ayrıştırma zamanında kullanılan komut tanımlayıcıları

Bir Plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını
istiyorsanız, o registrar'ın açığa çıkardığı her üst seviye komut kökünü kapsayan
`descriptors` sağlayın.

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Yalnızca `commands` kullanın; ama sadece tembel kök CLI kaydına ihtiyacınız
yoksa. Bu eager uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanında
tembel yükleme için descriptor destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi local
bir AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasını sağlar.

- Arka uç `id`, `codex-cli/gpt-5` gibi model ref'lerinde sağlayıcı ön eki olur.
- Arka uç `config`, `agents.defaults.cliBackends.<id>` ile aynı biçimi kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini Plugin varsayılanı üzerine birleştirir.
- Bir arka uç birleştirme sonrası uyumluluk yeniden yazımlarına ihtiyaç duyuyorsa
  (örneğin eski bayrak biçimlerini normalleştirmek), `normalizeConfig` kullanın.

### Ayrıcalıklı yuvalar

| Yöntem                                     | Ne kaydeder                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir tane etkin). `assemble()` callback'i, motorun prompt eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik Memory yeteneği                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Memory prompt bölümü oluşturucusu                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan çözümleyicisi                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Memory çalışma zamanı bağdaştırıcısı                                                                                                                         |

### Memory embedding bağdaştırıcıları

| Yöntem                                         | Ne kaydeder                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için Memory embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen ayrıcalıklı memory-Plugin API'sidir.
- `registerMemoryCapability`, eşlik eden Plugin'lerin dışa aktarılan Memory artefaktlarını
  belirli bir Memory Plugin'inin özel düzenine erişmek yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` da açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski uyumluluğu koruyan ayrıcalıklı memory-Plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin Memory Plugin'inin bir
  veya daha fazla embedding bağdaştırıcı kimliği (örneğin `openai`, `gemini`
  veya Plugin tarafından tanımlanan özel bir kimlik) kaydetmesini sağlar.
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları,
  kaydedilmiş bu bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                      | Ne yapar                     |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Türlendirilmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama callback'i   |

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır).
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır).
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici sevki üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model sevk yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`cancel` alanını hiç vermemekle aynıdır).

### API nesnesi alanları

| Alan                    | Tür                       | Açıklama                                                                                    |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Plugin kimliği                                                                              |
| `api.name`              | `string`                  | Görünen ad                                                                                  |
| `api.version`           | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                |
| `api.description`       | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                            |
| `api.source`            | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`           | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`            | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`      | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma                            |
| `api.runtime`           | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                         |
| `api.logger`            | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`  | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`     | Plugin köküne göre göreli yol çözümleme                                                     |

## İç modül kuralı

Plugin'iniz içinde, içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici tüketiciler için herkese açık dışa aktarımlar
  runtime-api.ts    # Yalnızca iç çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. İç içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketle birlikte gelen Plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri herkese açık giriş dosyaları), OpenClaw
zaten çalışıyorsa artık etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz bir çalışma zamanı anlık görüntüsü yoksa, disk üzerindeki çözümlenmiş yapılandırma dosyasına geri dönerler.

Sağlayıcı Plugin'leri ayrıca, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve
henüz genel bir SDK alt yoluna ait değilse, dar bir Plugin'e yerel sözleşme barrel dosyası da açığa çıkarabilir.
Mevcut paketle birlikte gelen örnek: Anthropic sağlayıcısı Claude
akış yardımcılarını, Anthropic beta-header ve `service_tier` mantığını genel bir
`plugin-sdk/*` sözleşmesine taşımak yerine kendi herkese açık `api.ts` / `contract-api.ts`
ayrım noktasında tutar.

Diğer mevcut paketle birlikte gelen örnekler:

- `@openclaw/openai-provider`: `api.ts` sağlayıcı oluşturucuları,
  varsayılan model yardımcıları ve gerçek zamanlı sağlayıcı oluşturucuları dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts` sağlayıcı oluşturucuyu ve
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Uzantı üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından da kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine
  onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Giriş Noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı referansı
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — paketleme, manifest dosyaları, yapılandırma şemaları
- [Test](/tr/plugins/sdk-testing) — test yardımcı araçları ve lint kuralları
- [SDK Geçişi](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin İç Yapıları](/tr/plugins/architecture) — derin mimari ve yetenek modeli
