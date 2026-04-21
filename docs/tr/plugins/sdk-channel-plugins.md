---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-21T19:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal plugin'i oluşturma sürecini adım adım açıklar. Sonunda DM güvenliği,
eşleştirme, yanıt iş parçacığı oluşturma ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Başlangıç](/tr/plugins/building-plugins)
  bölümünü okuyun.
</Info>

## Kanal plugin'leri nasıl çalışır

Kanal plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracını tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst geri dönüşlerine nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **İş parçacığı oluşturma** — yanıtların nasıl iş parçacığına bağlandığı

Çekirdek; paylaşılan message aracından, prompt bağlantılarından, dış oturum anahtarı biçiminden,
genel `:thread:` kayıt tutmadan ve dağıtımdan sorumludur.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın. Çekirdek, sanal alan yol normalleştirmesi ve giden medya erişim ilkesi için
bu açık listeyi kullanır; böylece plugin'lerin sağlayıcıya özgü
avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı kalmaz.
Tercihen
`{ "set-profile": ["avatarUrl", "avatarPath"] }`
gibi eylem anahtarlı bir eşleme döndürün; böylece alakasız eylemler başka bir eylemin medya argümanlarını devralmaz. Düz bir dizi de, kasıtlı olarak açığa çıkarılan her eylem arasında paylaşılan parametreler için hâlâ çalışır.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
plugin içinde `messaging.resolveSessionConversation(...)` ile yapın. Bu,
`rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine,
açık `baseConversationId` değerine ve varsa `parentConversationCandidates` değerlerine eşlemek için
kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları
en dar üst öğeden en geniş/temel konuşmaya doğru sıralı tutun.

Kayıtlı kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan
paketlenmiş plugin'ler, eşleşen bir
`resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir `session-key-api.ts`
dosyası da açığa çıkarabilir. Çekirdek, çalışma zamanı plugin kayıt defteri henüz kullanılamıyorsa
yalnızca bu önyükleme açısından güvenli yüzeyi kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir plugin'in yalnızca
genel/raw kimliğin üstüne üst geri dönüşlerine ihtiyaç duyduğu durumlar için eski uyumluluk geri dönüşü olarak kullanılmaya devam eder.
Her iki kanca da varsa, çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve
yalnızca kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)`
değerine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek, aynı sohbette `/approve`, paylaşılan onay düğmesi yüklerini ve genel geri dönüş teslimini yönetir.
- Kanal onaya özgü davranış gerektiriyorsa, kanal plugin'inde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimi/yerel işleme/render/yetkilendirme bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca giriş/çıkış içindir; çekirdek artık bu nesneden onay auth kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay auth bağlantı yüzeyidir.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, başlatıcı yüzey/yerel istemci durumu, aynı sohbet onay auth'undan farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek, `enabled` ile `disabled` ayrımını yapmak, başlatıcı kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için bu exec'e özgü kancayı kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay prompt'larını gizleme veya teslim öncesi yazıyor göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` ya da `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirme veya geri dönüş bastırma için kullanılmalıdır.
- Kanala ait yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; böylece çekirdek onay yaşam döngüsünü kurmaya devam ederken çalışma zamanı modülünüzü isteğe bağlı içe aktarabilir.
- Kanalın gerçekten paylaşılan render yerine özel onay yüklerine ihtiyacı varsa yalnızca `approvalCapability.render` kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları render etmelidir.
- Bir kanal mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbette `/approve` kısıtlaması yapmak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanalın yerel onay teslimine ihtiyacı varsa, kanal kodunu hedef normalleştirme ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri `approvalCapability.nativeRuntime` arkasına koyun; tercihen `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile, böylece çekirdek işleyiciyi kurabilir ve istek filtreleme, yönlendirme, tekilleştirme, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerini yönetebilir. `nativeRuntime` birkaç küçük bağlantı yüzeyine ayrılmıştır:
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmeyeceği
- `presentation` — paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel yükler veya son eylemlerle eşlemek
- `transport` — hedefleri hazırlamak ve yerel onay mesajlarını göndermek/güncellemek/silmek
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağla/çöz/eylem temizleme kancaları
- `observe` — isteğe bağlı teslim tanılama kancaları
- Kanalın istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü sarmalayıcı yapıştırma kodu eklemeden kanal başlangıç durumundan yetenek odaklı işleyicileri önyüklemesine izin verir.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` araçlarına yalnızca yetenek odaklı bağlantı yüzeyi henüz yeterince ifade gücüne sahip değilse başvurun.
- Yerel onay kanalları, bu yardımcılar üzerinden hem `accountId` hem de `approvalKind` değerini yönlendirmelidir. `accountId`, çok hesaplı onay ilkesinin doğru bot hesabı kapsamında kalmasını sağlar; `approvalKind` ise exec ile plugin onay davranışının çekirdekte sabit kodlu dallar olmadan kanalda kullanılabilir kalmasını sağlar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerini de yönetiyor. Kanal plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yetenek yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarmalı ve çekirdeğin başlatan sohbete herhangi bir bildirim göndermeden önce gerçek teslimleri toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler,
  exec ile plugin onay yönlendirmesini kanala özgü durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut paketli örnekler:
  - Slack, hem exec hem de plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, auth onay türüne göre farklılaşabilse bile exec
    ve plugin onayları için aynı yerel DM/kanal yönlendirmesini ve reaction UX'ini korur.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod tercih olarak yetenek oluşturucusunu kullanmalı ve plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktalarında, bu ailenin yalnızca tek bir bölümüne
ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Aynı şekilde, daha geniş şemsiye
yüzeye ihtiyacınız olmadığında `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı açısından güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), arama notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  kurulum proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar env farkındalıklı bağdaştırıcı bağlantı yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı kurulum veya auth destekliyorsa ve genel başlangıç/yapılandırma
akışlarının çalışma zamanı yüklenmeden önce bu env adlarını bilmesi gerekiyorsa,
bunları plugin manifest'inde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel sabitleri yalnızca operatöre dönük kopya için saklayın.

Kanalınız plugin çalışma zamanı başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası salt okunur komut yollarında içe aktarılabilecek kadar güvenli olmalı
ve kanal meta verilerini, kurulum açısından güvenli yapılandırma bağdaştırıcısını, durum bağdaştırıcısını ve bu özetler için gerekli kanal secret hedef meta verilerini döndürmelidir. Kurulum girişinden istemci, dinleyici veya taşıma çalışma zamanlarını başlatmayın.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca şu gibi daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyacınız varsa
  daha geniş `openclaw/plugin-sdk/setup` bağlantı yüzeyini kullanın:
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız kurulum yüzeylerinde yalnızca "önce bu plugin'i yükleyin" bilgisini göstermek istiyorsa,
tercihen `createOptionalChannelSetupSurface(...)` kullanın. Üretilen
bağdaştırıcı/sihirbaz yapılandırma yazımlarında ve sonlandırmada kapalı kalır; ayrıca
doğrulama, sonlandırma ve docs-link kopyası boyunca aynı kurulum gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için de, daha geniş eski
yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dağıt bağlantısı için `openclaw/plugin-sdk/inbound-envelope` ile
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderim delegeleri ve yük planlaması için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- iş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir agent/media
  payload alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalleştirme, yinelenen/çakışma doğrulaması ve geri dönüşte kararlı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth kullanan kanallar genellikle varsayılan yolda durabilir: onayları çekirdek yönetir ve plugin yalnızca giden/auth yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini oluşturmaktansa paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işleme mantığını iki katmana bölünmüş tutun:

- plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel'ına ihtiyaç duyduğunuzda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e özgü mantık için uygun örnekler:

- bot'a yanıt tespiti
- alıntılanan bot tespiti
- iş parçacığı katılımı kontrolleri
- servis/sistem mesajı dışlamaları
- bot katılımını kanıtlamak için gereken platformun yerel önbellekleri

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel mention olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
3. Gelen kapınızda `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` değerlerini kullanın.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions`, çalışma zamanı ekleme bağımlılığı zaten olan
paketlenmiş kanal plugin'leri için aynı paylaşılan mention yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` kullanmanız gerekiyorsa,
ilgisiz gelen çalışma zamanı yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalmaya devam eder. Yeni kod,
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım anlatım

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal plugin'i olmasını sağlar. Tam paket meta verisi yüzeyi için
    [Plugin Kurulumu ve Yapılandırma](/tr/plugins/sdk-setup#openclaw-channel)
    bölümüne bakın:

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "OpenClaw'u Acme Chat'e bağlayın."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat kanal plugin'i",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Kanal plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzü birçok isteğe bağlı bağdaştırıcı yüzeyi içerir. En
    düşük seviyeden başlayın — `id` ve `setup` — ve ihtiyacınız oldukça bağdaştırıcılar ekleyin.

    `src/channel.ts` oluşturun:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // platform API istemciniz

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token gerekli");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM güvenliği: bota kim mesaj gönderebilir
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Eşleştirme: yeni DM kişileri için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Eşleştirme kodu: ${code}`);
          },
        },
      },

      // İş parçacığı oluşturma: yanıtlar nasıl teslim edilir
      threading: { topLevelReplyToMode: "reply" },

      // Giden: platforma mesaj gönder
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük seviyeli bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirimsel seçenekler verirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözücüsü |
      | `pairing.text` | Kod değişimiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Reply-to-mode çözücüsü (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim fonksiyonları (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa, bildirimsel seçenekler yerine ham
      bağdaştırıcı nesneleri de geçebilirsiniz.
    </Accordion>

  </Step>

  <Step title="Giriş noktasını bağlayın">
    `index.ts` oluşturun:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat kanal plugin'i",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat yönetimi");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat yönetimi",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Kanala ait CLI tanımlayıcılarını `registerCliMetadata(...)` içinde tutun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler de gerçek komut
    kaydı için aynı tanımlayıcıları almaya devam eder. `registerFull(...)` yalnızca çalışma zamanına özel işler için kullanılmalıdır.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry)
    bölümüne bakın.

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışı olduğunda
    veya yapılandırılmadığında tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunu içeri çekmeyi önler.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere ayıran paketli çalışma alanı kanalları,
    açık bir kurulum zamanı runtime setter'a da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan ve
    bunu kanalınızın gelen işleyicisi üzerinden dağıtan bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen auth (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dağıtır.
          // Tam bağlantı platform SDK'nıza bağlıdır —
          // gerçek bir örnek için paketlenmiş Microsoft Teams veya Google Chat plugin paketine bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özeldir. Her kanal plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek desenler için paketlenmiş kanal plugin'lerine
      (örneğin Microsoft Teams veya Google Chat plugin paketi)
      bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde birlikte konumlandırılmış testler yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("hesabı yapılandırmadan çözümler", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("gizli bilgileri somutlaştırmadan hesabı inceler", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("eksik yapılandırmayı bildirir", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Paylaşılan test yardımcıları için [Test](/tr/plugins/sdk-testing) bölümüne bakın.

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verileri
├── openclaw.plugin.json      # Yapılandırma şemalı manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Genel dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # Dahili çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin ile ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekiyorsa)
```

## İleri konular

<CardGroup cols={2}>
  <Card title="İş parçacığı oluşturma seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, subagent
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı bağlantı yüzeyleri, paketlenmiş plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal plugin'leri için önerilen desen değildir;
o paketlenmiş plugin ailesini doğrudan sürdürmüyorsanız, ortak SDK
yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — plugin'iniz aynı zamanda modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Test](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması
