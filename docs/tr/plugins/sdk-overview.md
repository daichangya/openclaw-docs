---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: İçe aktarma eşlemi, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK'ye Genel Bakış
x-i18n:
    generated_at: "2026-04-23T09:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK'ye Genel Bakış

Plugin SDK, Plugin'ler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyin içe aktarılacağı** ve **nelerin kaydedilebileceği** için başvurudur.

<Tip>
  **Nasıl yapılır rehberi mi arıyorsunuz?**
  - İlk Plugin mi? [Başlangıç](/tr/plugins/building-plugins) ile başlayın
  - Kanal Plugin'i mi? Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)
  - Sağlayıcı Plugin'i mi? Bkz. [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlangıcı hızlı tutar
ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` yolunu kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlandırılmış kolaylık yüzeyleri veya kanal markalı yardımcı yüzeyler eklemeyin ya da bunlara bağımlı olmayın.
Bundled Plugin'ler, genel
SDK alt yollarını kendi `api.ts` veya `runtime-api.ts` barrel'ları içinde birleştirmelidir ve çekirdek,
ya bu Plugin-yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arasıysa
dar bir genel SDK sözleşmesi eklemelidir.

Üretilmiş dışa aktarma eşlemi hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi
küçük bir bundled-Plugin yardımcı yüzey kümesi içerir. Bu
alt yollar yalnızca bundled-Plugin bakımı ve uyumluluk için vardır; aşağıdaki ortak tabloda
bilerek çıkarılmıştır ve yeni üçüncü taraf Plugin'ler için önerilen içe aktarma yolu değildir.

## Alt yol başvurusu

Amaçlarına göre gruplanmış, en sık kullanılan alt yollar. 200'den fazla alt yolun
üretilmiş tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Ayrılmış bundled-Plugin yardımcı alt yolları yine de bu üretilmiş listede görünür.
Bir belge sayfası açıkça birini herkese açık olarak tanıtmadıkça bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                    | Temel dışa aktarımlar                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                      |

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
    | `plugin-sdk/account-core` | Çoklu hesap yapılandırması/eylem geçidi yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Bundled sözleşme geri dönüşü ile Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, taslak akış yaşam döngüsü/finalleştirme yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme-ve-dağıtma yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderim temsilcisi ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Thread bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/thread bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkelleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazımı yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslim ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleme, mention-ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention-ilkesi yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşmeleri ve yazıyor/ack hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için korunan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazımı yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı Plugin'leri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-ilkesi oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılamaları ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesaj dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/eşleme/önbellek yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbette eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/Gateway yüzeyleri yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulama + yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türlendirme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitleme, dış içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Sunucu izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, logger, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komutu/Hook/http/etkileşimli yardımcılar |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili Hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi lazy çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları ve Plugin yapılandırma arama yardımcıları |
    | `plugin-sdk/telegram-command-config` | Bundled Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, Heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtımı/finalleştirme yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun üst verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçları ile zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedef alanlarını çıkarma |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem logger ve redaction yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo kipi yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli dedupe önbellek yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturumu ve yanıt dağıtım yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağ çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcısı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/derleme/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzey ajan harness'leri için deneysel güvenilen Plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/abort yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonuç yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dispatcher farkındalıklı çalışma zamanı fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağ yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazımları/bakım içe aktarmaları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize zorlaması ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depolama yardımcıları artı medya yükü oluşturucuları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri artı sağlayıcıya dönük görsel/ses yardımcısı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistana görünür metin temizleme, Markdown render/parçalama/tablo yardımcıları, redaction yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri artı sağlayıcıya dönük directive, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, directive ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel üretim sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretim türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretim sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretim türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretim sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretim türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için bundled memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizinleme/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek host durumu yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı yardımcıları için üreticiye bağımlı olmayan takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için üreticiye bağımlı olmayan takma ad |
    | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı yardımcıları için üreticiye bağımlı olmayan takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe komşu Plugin'ler için paylaşılan yönetilen-Markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek host durumu yardımcıları için üreticiye bağımlı olmayan takma ad |
    | `plugin-sdk/memory-lancedb` | Bundled memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış bundled-helper alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Bundled tarayıcı Plugin destek yardımcıları (`browser-support` uyumluluk barrel'ı olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Bundled Matrix yardımcısı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Bundled LINE yardımcısı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Bundled IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Bundled kanal uyumluluğu/yardımcı yüzeyleri |
    | Kimlik doğrulama/Plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Bundled özellik/Plugin yardımcı yüzeyleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarır |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` geri çağırması, şu
yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                          |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                    |
| `api.registerAgentHarness(...)`                  | Deneysel düşük düzey ajan yürütücüsü    |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu              |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                       |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi        |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon    |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi                |
| `api.registerImageGenerationProvider(...)`       | Görsel üretimi                          |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                           |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                           |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı          |
| `api.registerWebSearchProvider(...)`             | Web araması                             |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                 |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

### Altyapı

| Yöntem                                          | Kaydettiği şey                        |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Olay Hook'u                           |
| `api.registerHttpRoute(params)`                 | Gateway HTTP uç noktası               |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC yöntemi                   |
| `api.registerCli(registrar, opts?)`             | CLI alt komutu                        |
| `api.registerService(service)`                  | Arka plan hizmeti                     |
| `api.registerInteractiveHandler(registration)`  | Etkileşimli işleyici                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi gömülü çalıştırıcı eklenti fabrikası |
| `api.registerMemoryPromptSupplement(builder)`   | Toplamsal belleğe komşu istem bölümü  |
| `api.registerMemoryCorpusSupplement(adapter)`   | Toplamsal bellek arama/okuma derlemi  |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak kalır; bir Plugin daha dar bir
Gateway yöntemi kapsamı atamaya çalışsa bile. Plugin'e ait yöntemler için
Plugin'e özgü önekler tercih edin.

Bir Plugin, OpenClaw gömülü çalıştırmaları sırasında Pi-yerel
olay zamanlamasına ihtiyaç duyduğunda `api.registerEmbeddedExtensionFactory(...)` kullanın; örneğin
nihai araç-sonuç mesajı yayılmadan önce gerçekleşmesi gereken eşzamansız `tool_result`
yeniden yazımları gibi.
Bu bugün bir bundled-Plugin yüzeyidir: yalnızca bundled Plugin'ler bir tane kaydedebilir ve
`openclaw.plugin.json` içinde `contracts.embeddedExtensionFactories: ["pi"]`
bildirmelidir. Bu daha düşük düzey yüzeyi gerektirmeyen her şey için normal OpenClaw Plugin Hook'larını koruyun.

### CLI kayıt üst verisi

`api.registerCli(registrar, opts?)`, iki tür üst düzey üst veri kabul eder:

- `commands`: registrar'ın sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve lazy Plugin CLI kaydı için kullanılan ayrıştırma zamanı komut tanımlayıcıları

Bir Plugin komutunun normal kök CLI yolunda lazy yüklü kalmasını istiyorsanız,
bu registrar tarafından açığa çıkarılan her üst düzey komut kökünü kapsayan `descriptors` sağlayın.

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

Lazy kök CLI kaydına ihtiyaç duymadığınızda yalnızca `commands` kullanın.
Bu eager uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı lazy yükleme için
descriptor destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi yerel
bir AI CLI arka ucunun varsayılan yapılandırmasına sahip olmasını sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine üstün gelir. OpenClaw, CLI'yi çalıştırmadan önce
  Plugin varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir arka uç birleşmeden sonra uyumluluk yeniden yazımları gerektiriyorsa
  `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalleştirmek).

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir aktif). `assemble()` geri çağırması, motorun istem eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek temizleme planı çözümleyicisi                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                     |

### Bellek embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen özel bellek-Plugin API'sidir.
- `registerMemoryCapability`, yardımcı Plugin'lerin dışa aktarılan bellek eserlerini
  belirli bir bellek Plugin'inin özel yerleşimine girmeden
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` da sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu özel bellek-Plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin'inin bir
  veya daha fazla embedding bağdaştırıcı kimliği kaydetmesini sağlar (örneğin `openai`, `gemini` veya Plugin tarafından tanımlanmış özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırması, kaydedilen bu
  bağdaştırıcı kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                      | Ne yapar                     |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Türlendirilmiş yaşam döngüsü Hook'u |
| `api.onConversationBindingResolved(handler)`| Konuşma bağlama geri çağırması |

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek, geçersiz kılma olarak değil karar yokmuş gibi kabul edilir (`block` alanını hiç vermemekle aynıdır).
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek, geçersiz kılma olarak değil karar yokmuş gibi kabul edilir (`block` alanını hiç vermemekle aynıdır).
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici dağıtımı sahiplendiğinde daha düşük öncelikli işleyiciler ve varsayılan model dağıtım yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek, geçersiz kılma olarak değil karar yokmuş gibi kabul edilir (`cancel` alanını hiç vermemekle aynıdır).
- `message_received`: gelen thread/topic yönlendirmesine ihtiyaç duyduğunuzda türlendirilmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ekstralar için koruyun.
- `message_sending`: kanala özgü `metadata` alanına geri dönmeden önce türlendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` Hook'larına güvenmek yerine Gateway'e ait başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                  |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                            |
| `api.name`               | `string`                  | Görünen ad                                                                                |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                              |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                          |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                        |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                          |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcutsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki Plugin'e özgü yapılandırma                         |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                       |
| `api.logger`             | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme kipi; `"setup-runtime"`, tam girişten önceki hafif başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yol çözümler                                                           |

## Dahili modül kuralı

Plugin'iniz içinde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Dış tüketiciler için herkese açık dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca dış sözleşmedir.
</Warning>

Cepheden yüklenen bundled Plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer herkese açık giriş dosyaları) artık OpenClaw
zaten çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz çalışma zamanı anlık görüntüsü yoksa, diskte çözümlenen yapılandırma dosyasına geri dönerler.

Sağlayıcı Plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz
genel bir SDK alt yoluna ait değilse, dar bir Plugin-yerel sözleşme barrel'ı da açığa çıkarabilir.
Geçerli bundled örnek: Anthropic sağlayıcısı Claude
akış yardımcılarını Anthropic beta-header ve `service_tier` mantığını genel
bir `plugin-sdk/*` sözleşmesine yükseltmek yerine kendi herkese açık `api.ts` / `contract-api.ts` yüzeyinde tutar.

Diğer geçerli bundled örnekleri:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu ve ayrıca
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Extension üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

- [Giriş Noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — paketleme, manifest'ler, yapılandırma şemaları
- [Test](/tr/plugins/sdk-testing) — test yardımcıları ve lint kuralları
- [SDK Geçişi](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin Dahili Yapısı](/tr/plugins/architecture) — derin mimari ve yetenek modeli
