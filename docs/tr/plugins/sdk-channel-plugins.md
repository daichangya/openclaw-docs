---
read_when:
    - Yeni bir mesajlaşma kanal eklentisi oluşturuyorsunuz
    - OpenClaw’u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal eklentisi oluşturmaya yönelik adım adım kılavuz
title: Kanal Eklentileri Oluşturma
x-i18n:
    generated_at: "2026-04-22T08:55:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Eklentileri Oluşturma

Bu kılavuz, OpenClaw’u bir mesajlaşma platformuna bağlayan bir kanal eklentisi
oluşturma sürecinde size yol gösterir. Sonunda DM güvenliği,
eşleştirme, yanıt iş parçacığı oluşturma ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw eklentisi oluşturmadıysanız, temel paket
  yapısı ve bildirim kurulumu için önce [Başlangıç](/tr/plugins/building-plugins)
  bölümünü okuyun.
</Info>

## Kanal eklentileri nasıl çalışır

Kanal eklentilerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw,
çekirdekte tek bir paylaşılan `message` aracını tutar. Eklentinizin sahip olduğu alanlar şunlardır:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum grameri** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, thread kimliklerine ve üst geri dönüşlerine nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **Thread oluşturma** — yanıtların nasıl thread’lendiği
- **Heartbeat yazıyor durumu** — heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan message aracına, prompt bağlamasına, dış oturum anahtarı şekline,
genel `:thread:` kayıt tutmaya ve dağıtıma sahiptir.

Kanalınız gelen yanıtlardan bağımsız yazıyor göstergelerini destekliyorsa,
kanal eklentisi üzerinde `heartbeat.sendTyping(...)` sağlayın. Çekirdek bunu,
heartbeat model çalışması başlamadan önce çözümlenmiş heartbeat teslim hedefiyle çağırır ve
paylaşılan yazıyor keepalive/cleanup yaşam döngüsünü kullanır. Platform açık bir durdurma sinyali gerektiriyorsa
`heartbeat.clearTyping(...)` de ekleyin.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sağlayın. Çekirdek
sandbox yol normalleştirmesi ve giden medya erişim ilkesi için bu açık listeyi kullanır;
böylece eklentiler sağlayıcıya özgü avatar,
ek veya kapak resmi parametreleri için paylaşılan çekirdekte özel durumlara ihtiyaç duymaz.
Tercihen şu gibi eylem anahtarlı bir eşleme döndürün:
`{ "set-profile": ["avatarUrl", "avatarPath"] }`; böylece ilgisiz eylemler başka
bir eylemin medya argümanlarını devralmaz. Tüm açığa çıkarılan eylemler arasında kasıtlı olarak paylaşılan
parametreler için düz bir dizi de çalışır.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
eklenti içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu,
`rawId` değerini temel konuşma kimliğine, isteğe bağlı thread
kimliğine, açık `baseConversationId` değerine ve herhangi bir
`parentConversationCandidates` değerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üstten
en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kaydı başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan bundled plugin’ler,
eşleşen bir `resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir
`session-key-api.ts` dosyası da sağlayabilir. Çekirdek, çalışma zamanı eklenti kaydı henüz mevcut değilse
bu önyükleme açısından güvenli yüzeyi yalnızca o durumda kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir eklenti yalnızca
genel/raw kimliğin üstünde üst geri dönüşlerine ihtiyaç duyduğunda
eski uyumluluk geri dönüşü olarak kullanılmaya devam eder. Her iki kanca da varsa, çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca kanonik kanca
bunları atladığında `resolveParentConversationCandidates(...)` değerine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal eklentisinin onaya özgü koda ihtiyacı yoktur.

- Çekirdek aynı sohbette `/approve`, paylaşılan onay düğmesi payload’ları ve genel geri dönüş teslimine sahiptir.
- Kanal onaya özgü davranış gerektiriyorsa, kanal eklentisinde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimi/yerel işleme/oluşturma/yetkilendirme bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık bu nesneden onay auth kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik approval-auth yüzeyidir.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, başlatan yüzey/yerel istemci durumu aynı sohbet onay auth durumundan farklıysa `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec’e özgü kancayı `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş rehberliğine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` bunu yaygın durum için doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimden önce yazıyor göstergeleri gönderme gibi kanala özgü payload yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` değerini yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanalın sahip olduğu yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu, çekirdeğin onay yaşam döngüsünü yine de bir araya getirmesine izin verirken çalışma zamanı modülünüzü isteğe bağlı içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile yoğun kanal giriş noktalarında tembel tutun.
- Kanal, paylaşılan oluşturucu yerine gerçekten özel onay payload’larına ihtiyaç duyuyorsa yalnızca `approvalCapability.render` kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar oluşturmalıdır.
- Bir kanal mevcut yapılandırmadan kararlı owner benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` erişimini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanalın yerel onay teslimine ihtiyacı varsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanalın özel bilgilerini `approvalCapability.nativeRuntime` arkasına koyun; ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden, böylece çekirdek işleyiciyi bir araya getirebilir ve istek filtreleme, yönlendirme, yinelenen kaldırma, süre sonu, gateway aboneliği ve başka yere yönlendirilmiş bildirimlere sahip olabilir. `nativeRuntime` birkaç küçük yüzeye ayrılmıştır:
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini beklemede/çözümlendi/süresi doldu yerel payload’larına veya son eylemlere eşlemek
- `transport` — hedefleri hazırlamak ve yerel onay mesajlarını göndermek/güncellemek/silmek
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action kancaları
- `observe` — isteğe bağlı teslim tanılama kancaları
- Kanalın istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kaydı, çekirdeğin onaya özgü sarmalayıcı glue eklemeden kanal başlangıç durumundan yetenek odaklı işleyicileri başlatmasına izin verir.
- Yalnızca yetenek odaklı yüzey henüz yeterince ifade edici değilse daha alt düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` kullanımına yönelin.
- Yerel onay kanalları, hem `accountId` hem de `approvalKind` değerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabı kapsamında tutar; `approvalKind` ise çekirdekte sabit dallar olmadan exec ile eklenti onayı davranışını kanal için erişilebilir kılar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerine de sahiptir. Kanal eklentileri `createChannelNativeApprovalRuntime` içinden kendi "onay DM’lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimleri toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler,
  exec ile eklenti onayı yönlendirmesini kanal yerel durumundan tahmin etmemeli
  veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut bundled örnekler:
  - Slack, hem exec hem de eklenti kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, onay türüne göre auth farklılaşmasına izin verirken exec
    ve eklenti onayları için aynı yerel DM/kanal yönlendirmesi ve reaction UX’ini korur.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod capability oluşturucusunu tercih etmeli ve eklentide `approvalCapability` açığa çıkarmalıdır.

Yoğun kanal giriş noktalarında, bu aileden yalnızca bir parçaya ihtiyacınız varsa
daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye
yüzeye ihtiyacınız yoksa `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum patch bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar env-farkındalıklı bağdaştırıcı yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum setup
  oluşturucularını ve birkaç setup-safe ilkel yapıyı kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env tabanlı kurulum veya auth destekliyorsa ve genel başlangıç/config
akışlarının çalışma zamanı yüklenmeden önce bu env adlarını bilmesi gerekiyorsa,
bunları eklenti manifestinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı
`envVars` veya yerel sabitlerini yalnızca operatöre yönelik metinler için kullanın.

Kanalınız eklenti çalışma zamanı başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine
`openclaw.setupEntry` ekleyin. Bu giriş noktası salt okunur komut yollarında içe aktarılmak için güvenli olmalı
ve bu özetler için gerekli kanal metadata’sını, setup-safe config bağdaştırıcısını,
status bağdaştırıcısını ve kanal secret hedef metadata’sını döndürmelidir. Kurulum girişinden
istemcileri, dinleyicileri veya taşıma çalışma zamanlarını başlatmayın.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan setup/config yardımcılarına da ihtiyacınız varsa
  daha geniş `openclaw/plugin-sdk/setup` yüzeyini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu eklentiyi kurun" bilgisini
duyurmak istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen
bağdaştırıcı/sihirbaz config yazımlarında ve sonlandırmada kapalı başarısız olur,
ayrıca doğrulama, sonlandırma ve docs-link metinlerinde aynı kurulum gerekli
mesajını yeniden kullanır.

Diğer yoğun kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dağıt bağlaması için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderme delegeleri ve payload planlaması için
  `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- giden bir rota açık bir
  `replyToId`/`threadId` değerini korumalıysa veya temel oturum anahtarı hâlâ eşleşirken mevcut
  `:thread:` oturumunu geri kazanmalıysa,
  `openclaw/plugin-sdk/channel-core` içinden
  `buildThreadAwareOutboundSessionRoute(...)`.
  Sağlayıcı eklentileri, platformlarının yerel thread teslim semantiği varsa
  önceliği, sonek davranışını ve thread kimliği normalleştirmesini geçersiz kılabilir.
- thread-binding yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir agent/media
  payload alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalleştirmesi, yinelenen/çakışma doğrulaması ve geri dönüş açısından kararlı bir komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth kullanan kanallar genellikle varsayılan yolda durabilir: çekirdek onayları yönetir ve eklenti yalnızca giden/auth yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini oluşturmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işlemeyi iki katmana ayrılmış halde tutun:

- eklentinin sahip olduğu kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel’ına ihtiyacınız olduğunda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Eklenti yerel mantığı için uygun örnekler:

- bota yanıt algılama
- bottan alıntı algılama
- thread katılımı kontrolleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platform yerel önbellekleri

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut bypass
- son atlama kararı

Tercih edilen akış:

1. Yerel mention bilgilerini hesaplayın.
2. Bu bilgileri `resolveInboundMentionDecision({ facts, policy })` içine geçin.
3. Gelen geçidinizde `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` kullanın.

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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağımlı olan
bundled kanal eklentileri için aynı paylaşılan mention yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa,
ilgili olmayan gelen çalışma zamanı yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` üzerinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları yalnızca
uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod,
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım açıklama

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart eklenti dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal eklentisi olmasını sağlar. Tam paket metadata yüzeyi için
    bkz. [Eklenti Kurulumu ve Yapılandırma](/tr/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
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
      "description": "Acme Chat channel plugin",
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

  <Step title="Kanal eklentisi nesnesini oluşturun">
    `ChannelPlugin` arayüzü birçok isteğe bağlı bağdaştırıcı yüzeyine sahiptir. En
    azıyla başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

    `src/channel.ts` oluşturun:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
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
      Düşük seviyeli bağdaştırıcı arayüzlerini el ile uygulamak yerine,
      bildirime dayalı seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değişimi ile metin tabanlı DM eşleştirme akışı |
      | `threading` | Reply-to modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç metadata’sı döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetim gerekiyorsa bildirime dayalı seçenekler yerine ham bağdaştırıcı
      nesneleri de geçebilirsiniz.
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
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımında gösterebilir;
    normal tam yüklemeler ise gerçek komut
    kaydı için aynı tanımlayıcıları almaya devam eder. `registerFull(...)` değerini yalnızca çalışma zamanı işi için tutun.
    Eğer `registerFull(...)` gateway RPC yöntemleri kaydediyorsa,
    eklentiye özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak işler. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Bir setup girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışı olduğunda
    veya yapılandırılmadığında tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun içe çekilmesini önler.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere ayıran bundled çalışma alanı kanalları,
    açık bir kurulum zamanı çalışma zamanı ayarlayıcısına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Eklentinizin platformdan mesaj alması ve bunları
    OpenClaw’a iletmesi gerekir. Tipik desen, isteği doğrulayan ve
    bunu kanalınızın gelen işleyicisi üzerinden dağıtan bir Webhook’tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // eklenti tarafından yönetilen auth (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw’a dağıtır.
          // Kesin bağlama platform SDK’nıza bağlıdır —
          // gerçek bir örnek için bundled Microsoft Teams veya Google Chat eklenti paketine bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özeldir. Her kanal eklentisi
      kendi gelen işlem hattına sahiptir. Gerçek örüntüler için bundled kanal eklentilerine
      (örneğin Microsoft Teams veya Google Chat eklenti paketine) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde birlikte konumlandırılmış testler yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Paylaşılan test yardımcıları için bkz. [Testing](/tr/plugins/sdk-testing).

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Yapılandırma şemasını içeren manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Genel dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # Dahili çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin üzerinden ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekirse)
```

## İleri konular

<CardGroup cols={2}>
  <Card title="Thread oluşturma seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, alt agent
  </Card>
</CardGroup>

<Note>
Bazı bundled yardımcı yüzeyler, bundled plugin bakımı ve
uyumluluk için hâlâ vardır. Bunlar yeni kanal eklentileri için önerilen örüntü değildir;
o bundled plugin ailesini doğrudan sürdürmüyorsanız ortak SDK
yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — eklentiniz modeller de sağlıyorsa
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması
