---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` uyarısını görüyorsunuz'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` uyarısını görüyorsunuz'
    - OpenClaw 2026.4.25 sürümünden önce `api.registerEmbeddedExtensionFactory` kullandınız.
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ya geçin
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-04-25T13:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklanmış, belgelenmiş importlara sahip modern bir Plugin mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin tek bir giriş noktasından ihtiyaç duydukları her şeyi import etmesine izin veren iki geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** — düzinelerce yardımcıyı yeniden dışa aktaran tek bir import. Yeni Plugin mimarisi geliştirilirken eski hook tabanlı Plugin'lerin çalışmaya devam etmesini sağlamak için sunuldu.
- **`openclaw/extension-api`** — Plugin'lere embedded agent runner gibi host tarafı yardımcılarına doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` gibi embedded-runner olaylarını gözlemleyebilen, kaldırılmış, yalnızca Pi'ye özel bir bundled extension hook'u.

Bu geniş import yüzeyleri artık **kullanımdan kaldırılmıştır**. Çalışma zamanında hâlâ çalışırlar, ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler bir sonraki büyük sürüm bunları kaldırmadan önce geçiş yapmalıdır. Yalnızca Pi'ye özel embedded extension factory kayıt API'si kaldırıldı; bunun yerine tool-result middleware kullanın.

OpenClaw, bir yerine koyma sunduğu aynı değişiklik içinde belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz. Sözleşmeyi bozan değişiklikler önce bir uyumluluk bağdaştırıcısından, tanılardan, belgelerden ve bir kullanımdan kaldırma penceresinden geçmelidir. Bu; SDK importları, manifest alanları, setup API'leri, hook'lar ve çalışma zamanı kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ import yapan Plugin'ler bu gerçekleştiğinde bozulacaktır.
  Yalnızca Pi'ye özel embedded extension factory kayıtları zaten artık yüklenmiyor.
</Warning>

## Bunun nedeni nedir

Eski yaklaşım sorunlara neden oluyordu:

- **Yavaş başlangıç** — tek bir yardımcıyı import etmek, birbiriyle ilgisiz düzinelerce modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar import döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarmaların kararlı, hangilerinin iç kullanım için olduğunu ayırt etmenin bir yolu yoktu

Modern Plugin SDK bunu düzeltir: her import yolu (`openclaw/plugin-sdk/\<subpath\>`) açık bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi içinde yeterli bir modüldür.

Bundled channel'lar için eski provider kolaylık yüzeyleri de kaldırıldı. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, channel markalı yardımcı yüzeyler ve `openclaw/plugin-sdk/telegram-core` gibi importlar kararlı Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar kapsamlı genel SDK alt yollarını kullanın. Bundled Plugin çalışma alanı içinde, provider'a ait yardımcıları o Plugin'in kendi `api.ts` veya `runtime-api.ts` dosyasında tutun.

Güncel bundled provider örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` / `contract-api.ts` yüzeyinde tutar
- OpenAI, provider builder'ları, varsayılan model yardımcılarını ve realtime provider builder'larını kendi `api.ts` dosyasında tutar
- OpenRouter, provider builder ve onboarding/config yardımcılarını kendi `api.ts` dosyasında tutar

## Uyumluluk ilkesi

Harici Plugin'ler için uyumluluk çalışmaları şu sırayı izler:

1. yeni sözleşmeyi ekleyin
2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tutun
3. eski yolu ve yerine geçeni adlandıran bir tanı veya uyarı yayınlayın
4. her iki yolu da testlerde kapsayın
5. kullanımdan kaldırma ve geçiş yolunu belgeleyin
6. yalnızca duyurulan geçiş penceresinden sonra kaldırın; bu genellikle büyük bir sürümde olur

Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları belgeler ve tanılar aksini söyleyene kadar onu kullanmaya devam edebilir. Yeni kod belgelenmiş yerine geçeni tercih etmelidir, ancak mevcut Plugin'ler sıradan küçük sürümler sırasında bozulmamalıdır.

## Nasıl geçiş yapılır

<Steps>
  <Step title="Pi tool-result extension'larını middleware'e taşıyın">
    Bundled Plugin'ler, yalnızca Pi'ye özel
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler'larını
    çalışma zamanından bağımsız middleware ile değiştirmelidir.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Plugin manifest'ini aynı anda güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Harici Plugin'ler tool-result middleware kaydedemez, çünkü bu yapı
    model görmeden önce yüksek güvene sahip araç çıktısını yeniden yazabilir.

  </Step>

  <Step title="Approval-native handler'ları capability facts yapısına taşıyın">
    Approval yeteneğine sahip channel Plugin'leri artık yerel approval davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan runtime-context registry üzerinden açığa çıkarıyor.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Approval'a özgü auth/delivery mantığını eski `plugin.auth` /
      `plugin.approvals` bağlantısından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, genel channel-plugin
      sözleşmesinden kaldırıldı; delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca channel login/logout akışları için kalır; buradaki approval auth
      hook'ları artık core tarafından okunmaz
    - Client'lar, token'lar veya Bolt
      uygulamaları gibi channel'a ait runtime nesnelerini `openclaw/plugin-sdk/channel-runtime-context`
      üzerinden kaydedin
    - Yerel approval handler'larından Plugin'e ait reroute bildirimleri göndermeyin;
      core artık yönlendirilen başka yer bildirimlerini gerçek delivery sonuçlarından sahiplenir
    - `createChannelManager(...)` içine `channelRuntime` geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Güncel approval capability düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa,
    çözümlenemeyen Windows `.cmd`/`.bat` wrapper'ları artık açıkça
    `allowShellFallback: true` geçmediğiniz sürece fail-closed davranır.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Çağıran tarafınız shell fallback davranışına bilinçli olarak bağlı değilse,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış importları bulun">
    Plugin'inizde kullanımdan kaldırılmış yüzeylerden herhangi birinden yapılan importları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklanmış importlarla değiştirin">
    Eski yüzeydeki her dışa aktarma, belirli bir modern import yoluna eşlenir:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Host tarafı yardımcıları için doğrudan import etmek yerine
    enjekte edilen Plugin runtime'ını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski import | Modern eşdeğeri |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Derleyin ve test edin">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import yolu başvurusu

  <Accordion title="Yaygın import yolu tablosu">
  | Import path | Amaç | Temel dışa aktarmalar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Channel giriş tanımları/builder'ları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök config şeması dışa aktarması | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek provider giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklanmış channel giriş tanımları ve builder'ları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Allowlist istemleri, kurulum durumu builder'ları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı runtime yardımcıları | Import-safe setup patch adapter'ları, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Setup adapter yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Setup araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap liste/config/action-gate yardımcıları |
  | `plugin-sdk/account-id` | Account-id yardımcıları | `DEFAULT_ACCOUNT_ID`, account-id normalizasyonu |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan fallback yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/account-action yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı adapter'ları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel bileşenleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + typing bağlantısı | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Config adapter factory'leri | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Config şeması builder'ları | Paylaşılan channel config şeması ilkel bileşenleri; bundled-channel-adlı şema dışa aktarmaları yalnızca eski uyumluluk içindir |
  | `plugin-sdk/telegram-command-config` | Telegram komut config yardımcıları | Komut adı normalizasyonu, açıklama kırpma, yinelenen/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Group/DM ilke çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan route + zarf builder yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydetme ve dispatch yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-runtime` | Giden runtime yardımcıları | Giden teslimat, identity/send delegate, session, biçimlendirme ve payload planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | Thread-binding yardımcıları | Thread-binding yaşam döngüsü ve adapter yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya payload yardımcıları | Eski alan düzenleri için agent medya payload builder'ı |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski channel runtime yardımcıları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonuç türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş runtime yardımcıları | Runtime/logging/backup/plugin-install yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı runtime env yardımcıları | Logger/runtime env, timeout, retry ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin runtime yardımcıları | Plugin komutları/hook'lar/http/interactive yardımcıları |
  | `plugin-sdk/hook-runtime` | Hook pipeline yardımcıları | Paylaşılan Webhook/internal hook pipeline yardımcıları |
  | `plugin-sdk/lazy-runtime` | Lazy runtime yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Process yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI runtime yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve channel-status patch yardımcıları |
  | `plugin-sdk/config-runtime` | Config yardımcıları | Config yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Bundled Telegram sözleşme yüzeyi kullanılamadığında fallback-stable Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Approval istem yardımcıları | Exec/plugin approval payload, approval capability/profile yardımcıları, native approval routing/runtime yardımcıları ve yapılandırılmış approval görüntüleme yolu biçimlendirmesi |
  | `plugin-sdk/approval-auth-runtime` | Approval auth yardımcıları | Approver çözümleme, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | Approval istemci yardımcıları | Native exec approval profile/filter yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Approval delivery yardımcıları | Native approval capability/delivery adapter'ları |
  | `plugin-sdk/approval-gateway-runtime` | Approval Gateway yardımcıları | Paylaşılan approval Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Approval adapter yardımcıları | Sıcak channel entrypoint'leri için hafif native approval adapter yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Approval handler yardımcıları | Daha geniş approval handler runtime yardımcıları; yeterli olduklarında daha dar adapter/Gateway yüzeylerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Approval hedef yardımcıları | Native approval target/account binding yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Approval yanıt yardımcıları | Exec/plugin approval reply payload yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Channel runtime-context yardımcıları | Genel channel runtime-context register/get/watch yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan trust, DM gating, external-content ve secret-collection yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilke yardımcıları | Host allowlist ve private-network ilke yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime yardımcıları | Pinned-dispatcher, guarded fetch, SSRF ilke yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı cache yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanı geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Host normalizasyon yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | Allowlist biçimlendirmesi | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist girdi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut registry yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım render'ları | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Secret girdi ayrıştırma | Secret girdi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcıları |
  | `plugin-sdk/webhook-request-guards` | Webhook body koruma yardımcıları | İstek body okuma/limit yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt runtime'ı | Gelen dispatch, Heartbeat, yanıt planlayıcı, parçalara bölme |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt dispatch yardımcıları | Sonlandırma, provider dispatch ve conversation-label yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parça yardımcıları | Metin/markdown parçalara bölme yardımcıları |
  | `plugin-sdk/session-store-runtime` | Session store yardımcıları | Store yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizin yardımcıları |
  | `plugin-sdk/routing` | Routing/session-key yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key normalizasyon yardımcıları |
  | `plugin-sdk/status-helpers` | Channel durum yardımcıları | Channel/account durum özeti builder'ları, runtime-state varsayılanları, issue metadata yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözücü yardımcıları | Paylaşılan hedef çözücü yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | String normalizasyon yardımcıları | Slug/string normalizasyon yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | Request benzeri girdilerden string URL çıkarma |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalize edilmiş stdout/stderr ile zamanlanmış komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Param okuyucuları | Yaygın tool/CLI param okuyucuları |
  | `plugin-sdk/tool-payload` | Tool payload çıkarma | Tool sonuç nesnelerinden normalize edilmiş payload çıkarma |
  | `plugin-sdk/tool-send` | Tool gönderim çıkarma | Tool argümanlarından kanonik gönderim hedefi alanlarını çıkarma |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Logging yardımcıları | Alt sistem logger ve redaction yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablosu yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt payload türleri |
  | `plugin-sdk/provider-setup` | Düzenlenmiş local/self-hosted provider kurulum yardımcıları | Self-hosted provider keşif/config yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu self-hosted provider kurulum yardımcıları | Aynı self-hosted provider keşif/config yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Provider runtime auth yardımcıları | Runtime API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Provider API anahtarı kurulum yardımcıları | API anahtarı onboarding/profile-write yardımcıları |
  | `plugin-sdk/provider-auth-result` | Provider auth-result yardımcıları | Standart OAuth auth-result builder'ı |
  | `plugin-sdk/provider-auth-login` | Provider interactive login yardımcıları | Paylaşılan interactive login yardımcıları |
  | `plugin-sdk/provider-selection-runtime` | Provider seçimi yardımcıları | Yapılandırılmış veya otomatik provider seçimi ve ham provider config birleştirme |
  | `plugin-sdk/provider-env-vars` | Provider env-var yardımcıları | Provider auth env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan provider model/replay yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy builder'ları, provider-endpoint yardımcıları ve model-id normalizasyon yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan provider katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider onboarding patch'leri | Onboarding config yardımcıları |
  | `plugin-sdk/provider-http` | Provider HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel provider HTTP/endpoint capability yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Provider web-fetch yardımcıları | Web-fetch provider kayıt/cache yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Provider web-search config yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan provider'lar için dar kapsamlı web-search config/credential yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Provider web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı credential setter/getter'lar gibi dar kapsamlı web-search config/credential sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Provider web-search yardımcıları | Web-search provider kayıt/cache/runtime yardımcıları |
  | `plugin-sdk/provider-tools` | Provider tool/schema compat yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılar ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI compat yardımcıları |
  | `plugin-sdk/provider-usage` | Provider kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer provider kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Provider akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Provider taşıma yardımcıları | Guarded fetch, transport mesaj dönüşümleri ve yazılabilir transport olay akışları gibi yerel provider transport yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı async kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/transform/store yardımcıları ve medya payload builder'ları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan media-generation yardımcıları | Görsel/video/müzik üretimi için paylaşılan failover yardımcıları, aday seçimi ve eksik model mesajları |
  | `plugin-sdk/media-understanding` | Media-understanding yardımcıları | Media understanding provider türleri ve provider'a yönelik görsel/ses yardımcı dışa aktarmaları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistan tarafından görülebilen metin temizleme, markdown render/parçalama/tablo yardımcıları, redaction yardımcıları, directive-tag yardımcıları, safe-text yardımcıları ve ilgili metin/logging yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma provider türleri ve provider'a yönelik directive, registry ve doğrulama yardımcıları |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma provider türleri, registry, directive'ler, normalizasyon |
  | `plugin-sdk/realtime-transcription` | Realtime transcription yardımcıları | Provider türleri, registry yardımcıları ve paylaşılan WebSocket session yardımcısı |
  | `plugin-sdk/realtime-voice` | Realtime voice yardımcıları | Provider türleri, registry/çözümleme yardımcıları ve bridge session yardımcıları |
  | `plugin-sdk/image-generation-core` | Paylaşılan image-generation çekirdeği | Image-generation türleri, failover, auth ve registry yardımcıları |
  | `plugin-sdk/music-generation` | Music-generation yardımcıları | Music-generation provider/request/result türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan music-generation çekirdeği | Music-generation türleri, failover yardımcıları, provider arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video-generation yardımcıları | Video-generation provider/request/result türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video-generation çekirdeği | Video-generation türleri, failover yardımcıları, provider arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Interactive reply yardımcıları | Interactive reply payload normalizasyonu/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Channel config ilkel bileşenleri | Dar kapsamlı channel config-schema ilkel bileşenleri |
  | `plugin-sdk/channel-config-writes` | Channel config-write yardımcıları | Channel config-write yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan channel prelude | Paylaşılan channel Plugin prelude dışa aktarmaları |
  | `plugin-sdk/channel-status` | Channel durum yardımcıları | Paylaşılan channel durum anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | Allowlist config yardımcıları | Allowlist config düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Group access yardımcıları | Paylaşılan group-access karar yardımcıları |
  | `plugin-sdk/direct-dm` | Direct-DM yardımcıları | Paylaşılan direct-DM auth/guard yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan extension yardımcıları | Passive-channel/status ve ambient proxy yardımcı ilkel bileşenleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef registry ve route-install yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalizasyon yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarması | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Bundled memory-core yardımcıları | Memory manager/config/file/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Memory engine runtime cephesi | Memory index/search runtime cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine | Memory host foundation engine dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding engine | Memory embedding sözleşmeleri, registry erişimi, local provider ve genel batch/remote yardımcıları; somut remote provider'lar sahip Plugin'lerinde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine | Memory host QMD engine dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine | Memory host storage engine dışa aktarmaları |
  | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal yardımcıları | Memory host multimodal yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Memory host sorgu yardımcıları | Memory host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Memory host secret yardımcıları | Memory host secret yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Memory host olay günlüğü yardımcıları | Memory host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Memory host durum yardımcıları | Memory host durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime | Memory host CLI runtime yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime | Memory host core runtime yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory host dosya/runtime yardımcıları | Memory host dosya/runtime yardımcıları |
  | `plugin-sdk/memory-host-core` | Memory host core runtime takma adı | Memory host core runtime yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Memory host olay günlüğü takma adı | Memory host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Memory host dosya/runtime takma adı | Memory host dosya/runtime yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Memory ile ilişkili Plugin'ler için paylaşılan managed-markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Lazy active-memory search-manager runtime cephesi |
  | `plugin-sdk/memory-host-status` | Memory host durum takma adı | Memory host durum yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-lancedb` | Bundled memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
  | `plugin-sdk/testing` | Test yardımcı programları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo, tam SDK yüzeyi değil, özellikle yaygın geçiş alt kümesi olacak şekilde hazırlanmıştır. 200'den fazla entrypoint'in yer aldığı tam liste
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Bu listede hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı bundled-Plugin yardımcı yüzeyleri yer alır. Bunlar bundled-Plugin bakımı ve uyumluluk için dışa aktarılmaya devam eder, ancak bilinçli olarak yaygın geçiş tablosuna dahil edilmemiştir ve yeni Plugin kodu için önerilen hedef değildir.

Aynı kural diğer bundled-helper aileleri için de geçerlidir; örneğin:

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
  `plugin-sdk/thread-ownership` ve `plugin-sdk/voice-call` gibi
  bundled helper/Plugin yüzeyleri

`plugin-sdk/github-copilot-token` şu anda dar kapsamlı token-helper
yüzeyi `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` değerlerini açığa çıkarır.

Yapılacak işe en uygun en dar import'u kullanın. Bir dışa aktarma bulamazsanız,
`src/plugin-sdk/` altındaki kaynağı kontrol edin veya Discord'da sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, provider sözleşmesi,
runtime yüzeyi ve manifest genelinde geçerli olan daha dar kapsamlı kullanımdan kaldırmalar. Bunların her biri bugün hâlâ çalışır, ancak gelecekteki bir büyük sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API'yi onun kanonik yerine geçen karşılığına eşler.

<AccordionGroup>
  <Accordion title="command-auth help builder'ları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    dışa aktarmalar — yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları compat stub'ları olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating yardımcıları → resolveInboundMentionDecision">
    **Eski**: `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`;
    `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` — iki ayrı çağrı yerine
    tek bir karar nesnesi döndürür.

    Aşağı akış channel Plugin'leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Channel runtime shim'i ve channel actions yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski
    channel Plugin'leri için bir uyumluluk shim'idir. Yeni kodda onu import etmeyin;
    runtime nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*` yardımcıları,
    ham "actions" channel dışa aktarmalarıyla birlikte kullanımdan kaldırılmıştır. Bunun yerine
    capability'leri anlamsal `presentation` yüzeyi üzerinden açığa çıkarın — channel Plugin'leri
    hangi ham action adlarını kabul ettiklerini değil, ne render ettiklerini
    (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web search provider tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içindeki `tool()` factory'si.

    **Yeni**: `createTool(...)` doğrudan provider Plugin'i üzerinde uygulanır.
    OpenClaw artık tool sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç duymuyor.

  </Accordion>

  <Accordion title="Düz metin channel zarfları → BodyForAgent">
    **Eski**: gelen channel mesajlarından düz, düz metin bir istem
    zarfı oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` ile yapılandırılmış user-context blokları.
    Channel Plugin'leri yönlendirme metadata'sını (thread, topic, reply-to, reactions)
    bunları bir istem dizesine birleştirmek yerine tiplenmiş alanlar olarak ekler.
    `formatAgentEnvelope(...)` yardımcısı sentezlenmiş,
    asistana yönelik zarflar için hâlâ desteklenmektedir, ancak gelen düz metin zarflar
    artık kullanım dışına çıkmaktadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen tüm özel
    channel Plugin'leri.

  </Accordion>

  <Accordion title="Provider discovery türleri → provider katalog türleri">
    Dört discovery türü takma adı artık katalog dönemi türleri üzerinde ince sarmalayıcılardır:

    | Eski takma ad             | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası — provider Plugin'leri
    capability fact'lerini statik bir nesne yerine provider runtime sözleşmesi
    üzerinden eklemelidir.

  </Accordion>

  <Accordion title="Thinking policy hook'ları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerindeki üç ayrı hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve
    sıralı seviye listesi döndüren tek bir `resolveThinkingProfile(ctx)`,
    yani bir `ProviderThinkingProfile`.

    OpenClaw eski saklanan değerleri profil sırasına göre otomatik olarak
    düşürür.

    Üç hook yerine tek bir hook uygulayın. Eski hook'lar
    kullanımdan kaldırma penceresi boyunca çalışmaya devam eder, ancak profil sonucu ile birlikte
    bileştirilmez.

  </Accordion>

  <Accordion title="Harici OAuth provider fallback → contracts.externalAuthProviders">
    **Eski**: Plugin manifest'inde provider'ı bildirmeden
    `resolveExternalOAuthProfiles(...)` uygulamak.

    **Yeni**: Plugin manifest'inde `contracts.externalAuthProviders` bildirin
    **ve** `resolveExternalAuthProfiles(...)` uygulayın. Eski "auth
    fallback" yolu çalışma zamanında bir uyarı yayınlar ve kaldırılacaktır.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var araması → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı env-var aramasını manifest üzerindeki `setup.providers[].envVars`
    içine yansıtın. Bu, setup/status env metadata'sını tek bir
    yerde birleştirir ve yalnızca env-var aramalarına cevap verebilmek için
    Plugin runtime'ını başlatma ihtiyacını ortadan kaldırır.

    `providerAuthEnvVars`, kullanımdan kaldırma penceresi kapanana kadar bir uyumluluk bağdaştırıcısı
    üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Memory Plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: memory-state API üzerinde tek çağrı —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı slot'lar, tek kayıt çağrısı. Eklemeli memory yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) etkilenmez.

  </Accordion>

  <Accordion title="Subagent session message türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür takma adı:

    | Eski                        | Yeni                             |
    | --------------------------- | -------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Runtime yöntemi `readSession`, `getSessionMessages`
    lehine kullanımdan kaldırılmıştır. Aynı imza; eski yöntem
    yeni olana yönlenir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir TaskFlow erişimcisi döndürüyordu.

    **Yeni**: `runtime.tasks.flows` (çoğul), import-safe olan ve
    tam görev runtime'ının yüklenmesini gerektirmeyen DTO tabanlı TaskFlow erişimi döndürür.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory'leri → agent tool-result middleware">
    Yukarıda "Nasıl geçiş yapılır → Pi tool-result extension'larını
    middleware'e taşıyın" bölümünde ele alındı. Tamlık için burada da yer verildi:
    kaldırılmış, yalnızca Pi'ye özel
    `api.registerEmbeddedExtensionFactory(...)` yolu yerine
    `contracts.agentToolResultMiddleware` içinde açık bir runtime
    listesiyle `api.registerAgentToolResultMiddleware(...)` kullanılır.
  </Accordion>

  <Accordion title="OpenClawSchemaType takma adı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden dışa aktarılan `OpenClawSchemaType`,
    artık `OpenClawConfig` için tek satırlık bir takma addır. Kanonik adı tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` altındaki bundled channel/provider Plugin'leri içindeki
extension düzeyindeki kullanımdan kaldırmalar, kendi `api.ts` ve `runtime-api.ts`
barrel dosyalarında izlenir. Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez ve burada
listelenmez. Bir bundled Plugin'in yerel barrel dosyasını doğrudan tüketiyorsanız,
yükseltmeden önce o barrel içindeki kullanımdan kaldırma yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman              | Ne olur                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| **Şimdi**             | Kullanımdan kaldırılmış yüzeyler çalışma zamanı uyarıları yayınlar      |
| **Bir sonraki büyük sürüm** | Kullanımdan kaldırılmış yüzeyler kaldırılır; bunları hâlâ kullanan Plugin'ler başarısız olur |

Tüm core Plugin'ler zaten taşındı. Harici Plugin'ler bir sonraki büyük sürümden
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol import başvurusu
- [Channel Plugin'leri](/tr/plugins/sdk-channel-plugins) — channel Plugin'leri oluşturma
- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — provider Plugin'leri oluşturma
- [Plugin Dahili Yapısı](/tr/plugins/architecture) — mimariye derinlemesine bakış
- [Plugin Manifest'i](/tr/plugins/manifest) — manifest şeması başvurusu
