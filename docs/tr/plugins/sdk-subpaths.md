---
read_when:
    - Bir plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketlenmiş-plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarımların nerede bulunduğu, alana göre gruplandırılmış hali'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-04-25T13:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK, `openclaw/plugin-sdk/` altında bir dizi dar alt yol olarak sunulur.
  Bu sayfa, yaygın olarak kullanılan alt yolları amaca göre gruplandırarak
  kataloglar. 200'den fazla alt yolun tamamını içeren üretilmiş liste
  `scripts/lib/plugin-sdk-entrypoints.json` dosyasında bulunur; ayrılmış
  paketlenmiş-plugin yardımcı alt yolları da orada görünür, ancak bir dokümantasyon
  sayfası onları açıkça önermediği sürece bunlar uygulama ayrıntısıdır.

  Plugin yazma kılavuzu için [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
  sayfasına bakın.

  ## Plugin girişi

  | Alt yol                    | Temel dışa aktarımlar                                                                                                                |
  | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                  |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                     |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, allowlist istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çoklu hesap yapılandırması/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalize etme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşüyle Telegram özel komut normalize etme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, taslak akış yaşam döngüsü/sonlandırma yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve gönderim yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden teslim, kimlik, gönderim delegesi, oturum, biçimlendirme ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalize etme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İleti dizisi bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/ileti dizisi bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin ön hazırlık dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslim ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleştirme, mention-policy yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-inbound-debounce` | Dar gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention-policy ve mention metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konumu bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşürmeler ve typing/ack hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/reaksiyon bağlama |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth auth-result oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı plugin'leri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env var arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalize etme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlamasına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | İşlem-yerel singleton/map/cache yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/Gateway katmanları yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yükü yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni yüklemleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalize etme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırma için dar `coerceSecretRef` ve SecretRef türlendirme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapısı, harici içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine allowlist ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar pinned-dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komut/kanca/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argüman çağrısı ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları ve plugin yapılandırma arama yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalize etme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, gönderim, Heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt gönderimi/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta veri yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözücü yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalize etme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri ayıklama |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş yükleri ayıklama |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedefi alanlarını ayıklama |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve sansürleme yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt gönderim yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarımları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ambient proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'ları için deneysel güvenilir-plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/durdurma yardımcıları, OpenClaw araç köprüsü yardımcıları, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonuç yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı-fetch içe aktarımları olmadan dispatcher-aware çalışma zamanı fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarımları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar ilkel kayıt/dize zorlama ve normalize etme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalize etme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Ortak medya fetch/dönüştürme/depolama yardımcıları ve medya yükü oluşturucuları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma failover yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilir metin ayıklama, Markdown oluşturma/parçalama/tablo yardımcıları, sansürleme yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya dönük directive, kayıt defteri, doğrulama ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, directive, normalize etme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü oluşturma sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalize etme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makinesi foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makinesi embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel batch/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makinesi QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makinesi depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makinesi çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makinesi sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makinesi gizli anahtar yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek ana makinesi olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makinesi durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makinesi CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makinesi olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe bitişik eklentiler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek ana makinesi durum yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    | Aile | Mevcut alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş tarayıcı eklentisi destek yardımcıları. `browser-profiles`, normalleştirilmiş `browser.tabCleanup` şekli için `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` ve `ResolvedBrowserTabCleanupConfig` dışa aktarır. `browser-support` uyumluluk barrel'ı olarak kalır. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluğu/yardımcı geçişleri |
    | Kimlik doğrulama/eklentiye özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/eklenti yardımcı geçişleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarır |
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Eklenti oluşturma](/tr/plugins/building-plugins)
