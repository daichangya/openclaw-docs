---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: Import map, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-21T09:02:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, plugin'ler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için başvurudur.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk plugin'iniz mi? [Getting Started](/tr/plugins/building-plugins) ile başlayın
  - Kanal plugin'i mi? [Channel Plugins](/tr/plugins/sdk-channel-plugins) bölümüne bakın
  - Sağlayıcı plugin'i mi? [Provider Plugins](/tr/plugins/sdk-provider-plugins) bölümüne bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlangıcı hızlı tutar ve
döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş üst yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için `openclaw/plugin-sdk/core`
kullanmaya devam edin.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` veya
kanal markalı yardımcı yüzeyler gibi sağlayıcı adlı kolaylık seams'lerini
eklemeyin veya bunlara bağımlı olmayın. Paketle gelen plugin'ler genel
SDK alt yollarını kendi `api.ts` veya `runtime-api.ts` barrel'ları içinde
birleştirmelidir; çekirdek ise ya bu plugin-yerel barrel'ları kullanmalı ya da
gereksinim gerçekten kanallar arasıysa dar bir genel SDK
sözleşmesi eklemelidir.

Üretilen dışa aktarma haritası hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi
paketle gelen plugin yardımcı seams'lerinin küçük bir kümesini içerir. Bu
alt yollar yalnızca paketle gelen plugin bakımı ve uyumluluk için vardır; aşağıdaki yaygın tabloda kasıtlı olarak atlanmıştır ve yeni üçüncü taraf plugin'ler için önerilen içe aktarma yolu değildir.

## Alt yol başvurusu

Amaçlarına göre gruplanmış, en yaygın kullanılan alt yollar. 200+'den fazla alt yolun
üretilmiş tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Ayrılmış paketle gelen plugin yardımcı alt yolları hâlâ o üretilmiş listede görünür.
Bir belge sayfası bunlardan birini açıkça herkese açık olarak öne çıkarmadıkça,
bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                    | Temel dışa aktarımlar                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
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
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, allowlist istemleri, kurulum durum oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı config/action-gate yardımcıları, varsayılan hesap fallback yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan fallback yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketle gelen sözleşme fallback'i ile Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen yönlendirme + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kayıt-et-ve-dağıt yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderim delegesi ve payload planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya payload oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/thread binding, eşleştirme ve yapılandırılmış binding yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı config anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal config şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal config yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin prelude dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt payload normalleştirme/azaltma yardımcıları |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleme, bahsetme ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar bahsetme ilkesi yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşüşler ve typing/ack hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki kablolaması |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar secret-sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI backend varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth auth-result oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı plugin'leri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env var arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model-id normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch config/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme kablolaması gerektirmeyen sağlayıcılar için dar web-search config/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcı/alıcıları gibi dar web-search config/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizliği + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesaj dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding config patch yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç yerel singleton/map/cache yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet action-auth yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/gateway seams'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap binding yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt payload yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması + yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin secret yüzeyleri için dar secret-sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Secret-sözleşmesi/config ayrıştırması için dar `coerceSecretRef` ve SecretRef türlendirme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM denetimi, dış içerik ve secret toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Host allowlist ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş infra çalışma zamanı yüzeyi olmadan dar pinned-dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Secret giriş ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, logger, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komutu/hook/http/etkileşimli yardımcılar |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/iç hook hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi lazy çalışma zamanı içe aktarma/binding yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durum patch yardımcıları |
    | `plugin-sdk/config-runtime` | Config yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketle gelen Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirmesi ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel'ı olmadan dosya başvurusu autolink algılama |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay-yeteneği oluşturucuları, auth/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtma/sonlandırma yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi yönlendirme/oturum anahtarı/hesap binding yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve issue meta veri yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş payload çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarma |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem logger ve redaction yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli dedupe önbellek yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt-dağıtım yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarımları olmadan salt okunur ACP binding çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı config şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ambient proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kaydı/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzey ajan harness'ları için deneysel güvenilir plugin yüzeyi: harness türleri, etkin çalıştırma steer/abort yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonuç yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy ve pinned arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/guarded-fetch içe aktarımları olmadan dispatcher farkındalıklı çalışma zamanı fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış binding yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma binding durumu |
    | `plugin-sdk/session-store-runtime` | Geniş config yazma/bakım içe aktarımları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş config/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Host adı ve SCP host normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme config ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Config destekli dizin sorgusu/dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depo yardımcıları ve medya payload oluşturucuları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin temizleme, Markdown render/parçalama/tablo yardımcıları, redaction yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt, yönerge ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt yardımcıları |
    | `plugin-sdk/image-generation` | Görsel üretimi sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi türleri, failover, auth ve kayıt yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kaydı ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılmış `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/config/dosya/CLI yardımcıları için paketle gelen memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizinleme/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel batch/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe komşu plugin'ler için paylaşılan managed-markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek host durum yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketle gelen memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış bundled-helper alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketle gelen browser plugin destek yardımcıları (`browser-support` uyumluluk barrel'ı olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketle gelen Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketle gelen LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketle gelen IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketle gelen kanal uyumluluk/yardımcı seams'leri |
    | Auth/plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketle gelen özellik/plugin yardımcı seams'leri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarıyor |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` callback'i, şu
yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                        |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük düzey ajan yürütücüsü  |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım backend'i           |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi      |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon  |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görsel üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                         |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                         |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı        |
| `api.registerWebSearchProvider(...)`             | Web araması                           |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                               |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                    |

### Altyapı

| Yöntem                                         | Kaydettiği şey                    |
| ---------------------------------------------- | --------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                       |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası           |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi               |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                    |
| `api.registerService(service)`                 | Arka plan hizmeti                 |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici              |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli belleğe komşu prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma korpusu |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bir plugin daha dar bir gateway yöntem scope'u atamaya çalışsa bile
her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
plugin'e özgü önekleri tercih edin.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)` iki tür üst düzey meta veri kabul eder:

- `commands`: registrar'ın sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve lazy plugin CLI kaydı için ayrıştırma zamanlı komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda lazy-loaded kalmasını istiyorsanız,
o registrar tarafından açığa çıkarılan her üst düzey komut kökünü kapsayan `descriptors`
sağlayın.

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

`commands` değerini tek başına yalnızca lazy kök CLI kaydına ihtiyaç duymadığınızda kullanın.
Bu eager uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanlı lazy yükleme için
descriptor destekli yer tutucular kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel
AI CLI backend'i için varsayılan config'e sahip olmasını sağlar.

- Backend `id`, `codex-cli/gpt-5` gibi model ref'lerinde sağlayıcı öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı config'i yine kazanır. OpenClaw, CLI'yi çalıştırmadan önce
  plugin varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir backend'in birleştirmeden sonra uyumluluk yeniden yazımları gerektirdiği durumlarda
  (örneğin eski bayrak biçimlerini normalleştirmek için) `normalizeConfig` kullanın.

### Ayrıcalıklı yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda yalnızca biri etkin). `assemble()` callback'i, motorun prompt eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucusu                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush planı çözümleyicisi                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                    |

### Bellek embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen ayrıcalıklı bellek-plugin API'sidir.
- `registerMemoryCapability`, tamamlayıcı plugin'lerin
  dışa aktarılan bellek artifact'lerini belirli bir
  bellek plugin'inin özel düzenine uzanmadan `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` da sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski sürümlerle uyumlu ayrıcalıklı bellek-plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin'inin bir
  veya daha fazla embedding bağdaştırıcı kimliğini (örneğin `openai`, `gemini` veya plugin'in tanımladığı
  özel bir kimlik) kaydetmesini sağlar.
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı config'i,
  bu kayıtlı bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                    |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma binding callback'i  |

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici dağıtımı sahiplenirse, daha düşük öncelikli işleyiciler ve varsayılan model dağıtım yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                      |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                |
| `api.name`               | `string`                  | Görünen ad                                                                                    |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                  |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                              |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                            |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                              |
| `api.config`             | `OpenClawConfig`          | Geçerli config anlık görüntüsü (mümkün olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin'e özgü config                                   |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"`, tam giriş öncesi hafif başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümler                                                              |

## İç modül kuralı

Plugin'iniz içinde, içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Dış kullanıcılar için herkese açık dışa aktarımlar
  runtime-api.ts    # Yalnızca iç çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodundan kendi plugin'inizi hiçbir zaman `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. İç içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca dış sözleşmedir.
</Warning>

Facade ile yüklenen paketle gelen plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri herkese açık giriş dosyaları) artık
OpenClaw zaten çalışıyorsa etkin çalışma zamanı config anlık görüntüsünü tercih eder.
Henüz çalışma zamanı anlık görüntüsü yoksa, diskteki çözümlenmiş config dosyasına geri dönerler.

Sağlayıcı plugin'leri, bir yardımcının kasıtlı olarak sağlayıcıya özgü olduğu ve henüz genel bir SDK
alt yoluna ait olmadığı durumlarda dar bir plugin-yerel sözleşme barrel'ı da açığa çıkarabilir.
Güncel paketle gelen örnek: Anthropic sağlayıcısı, Claude
stream yardımcılarını Anthropic beta-header ve `service_tier` mantığını genel bir
`plugin-sdk/*` sözleşmesine taşımak yerine kendi herkese açık `api.ts` / `contract-api.ts` seam'inde tutar.

Diğer güncel paketle gelen örnekler:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucuyu ve
  onboarding/config yardımcılarını dışa aktarır

<Warning>
  Extension üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarımlarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki plugin'i birbirine bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir
  yetenek odaklı yüzey gibi nötr bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Entry Points](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Runtime Helpers](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Setup and Config](/tr/plugins/sdk-setup) — paketleme, manifest'ler, config şemaları
- [Testing](/tr/plugins/sdk-testing) — test yardımcıları ve lint kuralları
- [SDK Migration](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin Internals](/tr/plugins/architecture) — derin mimari ve yetenek modeli
