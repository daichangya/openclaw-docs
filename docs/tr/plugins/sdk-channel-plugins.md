---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için mesajlaşma kanalı Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-21T09:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'ı bir
mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturmayı adım adım anlatır. Sonunda DM güvenliği,
eşleme, yanıt ileti dizileri ve giden mesajlaşma içeren çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Başlangıç](/tr/plugins/building-plugins) belgesini okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw,
çekirdekte tek bir paylaşılan `message` aracı tutar. Plugin'iniz şunlara sahip olur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve allowlist'ler
- **Eşleme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, ileti dizisi kimliklerine ve üst yedeklere nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **İleti dizileri** — yanıtların nasıl ileti dizisine bağlandığı

Çekirdek; paylaşılan mesaj aracına, prompt bağlamaya, dış oturum-anahtarı biçimine,
genel `:thread:` muhasebesine ve sevke sahiptir.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden ortaya çıkarın. Çekirdek, bu açık listeyi sandbox yol normalizasyonu ve giden medya erişim
ilkesi için kullanır; böylece Plugin'lerin sağlayıcıya özgü
avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı olmaz.
Tercihen şu biçimde eylem anahtarlı bir eşleme döndürün:
`{ "set-profile": ["avatarUrl", "avatarPath"] }`; böylece ilgisiz eylemler başka bir eylemin
medya bağımsız değişkenlerini devralmaz. Düz bir dizi, kasten
ortaya çıkarılan tüm eylemler arasında paylaşılan parametreler için yine çalışır.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini temel konuşma kimliğine, isteğe bağlı ileti dizisi
kimliğine, açık `baseConversationId` değerine ve olası
`parentConversationCandidates` öğelerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları
en dar üstten en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş Plugin'ler,
eşleşen bir `resolveSessionConversation(...)` dışa aktarımı ile üst düzey
bir `session-key-api.ts` dosyası da sunabilir. Çekirdek, çalışma zamanı Plugin kayıt defteri henüz
kullanılabilir değilse yalnızca bu bootstrap-safe yüzeyi kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin yalnızca
genel/raw kimliğin üstünde üst yedeklere ihtiyaç duyduğunda eski uyumluluk yedeği olarak
kullanılmaya devam eder. Her iki kanca da varsa çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca kanonik kanca
bunları atladığında `resolveParentConversationCandidates(...)` kancasına geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek; aynı sohbette `/approve`, paylaşılan onay düğmesi yükleri ve genel yedek teslimata sahiptir.
- Kanalın onaya özgü davranışa ihtiyacı olduğunda, kanal Plugin'i üzerinde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimatı/yerel işleme/auth gerçeklerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık bu nesneden onay auth kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik approval-auth hattıdır.
- Aynı sohbette onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını ortaya çıkarıyorsa, başlatıcı yüzey/yerel istemci durumu aynı sohbet onay auth'undan farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü kancayı `enabled` ve `disabled` ayrımı yapmak, başlatıcı kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci yedek yönergelerine eklemek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizlemek veya teslimat öncesi yazıyor göstergeleri göndermek gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya yedek bastırma için kullanılmalıdır.
- Kanala ait yerel onay gerçekleri için `approvalCapability.nativeRuntime` kullanın. Bunu, sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; bu, çalışma zamanı modülünüzü isteğe bağlı içe aktarırken çekirdeğin onay yaşam döngüsünü kurmasına da izin verir.
- `approvalCapability.render` yalnızca bir kanal paylaşılan işleyici yerine gerçekten özel onay yüklerine ihtiyaç duyuyorsa kullanılmalıdır.
- Yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini devre dışı yol yanıtında açıklamak istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesaplı kanallar, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar göstermelidir.
- Bir kanal mevcut yapılandırmadan kararlı sahip-benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbette `/approve` kısıtlaması yapmak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanal yerel onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum gerçeklerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü gerçekleri `approvalCapability.nativeRuntime` arkasına koyun; ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla, böylece çekirdek işleyiciyi kurabilir ve istek filtreleme, yönlendirme, dedupe, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerine sahip olabilir. `nativeRuntime`, birkaç küçük hatta ayrılmıştır:
- `availability` — hesabın yapılandırılmış olup olmadığı ve bir isteğin ele alınıp alınmaması gerektiği
- `presentation` — paylaşılan onay görünüm modelini beklemede/çözümlenmiş/süresi dolmuş yerel yüklere veya son eylemlere eşleme
- `transport` — hedefleri hazırlama ve yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya reaksiyonlar için isteğe bağlı bind/unbind/clear-action kancaları
- `observe` — isteğe bağlı teslimat tanılama kancaları
- Kanalın istemci, belirteç, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü sarmalayıcı yapıştırıcısı eklemeden kanal başlangıç durumundan yetenek odaklı işleyicileri bootstrap etmesini sağlar.
- Daha düşük düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` araçlarına yalnızca yetenek odaklı hat henüz yeterince ifade gücüne sahip değilse başvurun.
- Yerel onay kanalları, bu yardımcılar üzerinden hem `accountId` hem `approvalKind` yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabına kapsamlı tutar; `approvalKind` ise çekirdekte sabit dallar olmadan exec ve plugin onay davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerine de sahiptir. Kanal Plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini ortaya koyun ve başlatıcı sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimatları toplamasına izin verin.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler,
  exec ve plugin onay yönlendirmesini kanala yerel durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler ortaya çıkarabilir.
  Geçerli paketlenmiş örnekler:
  - Slack, yerel onay yönlendirmesini hem exec hem de plugin kimlikleri için kullanılabilir tutar.
  - Matrix, exec ve plugin onayları için aynı yerel DM/kanal yönlendirmesi ve reaksiyon UX'ini korurken auth'un onay türüne göre farklılaşmasına yine izin verir.
- `createApproverRestrictedNativeApprovalAdapter` uyumluluk sarmalayıcısı olarak hâlâ vardır, ancak yeni kod yetenek oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` ortaya çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu ailenin yalnızca bir parçasına ihtiyaç
duyduğunuzda daha dar çalışma zamanı alt yollarını tercih edin:

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
`openclaw/plugin-sdk/reply-chunking` yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı açısından güvenli kurulum yardımcılarını kapsar:
  import-safe kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar, env farkındalıklı bağdaştırıcı hattıdır
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum setup
  oluşturucularını ve birkaç setup-safe ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı kurulum veya auth destekliyorsa ve genel başlangıç/yapılandırma
akışlarının bu env adlarını çalışma zamanı yüklenmeden önce bilmesi gerekiyorsa,
bunları Plugin manifest içinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel
sabitleri yalnızca operatör odaklı kopya için kullanın.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da
  ihtiyacınız olduğunda daha geniş `openclaw/plugin-sdk/setup` hattını kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu Plugin'i kur" bilgisini
reklam etmek istiyorsa `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen
bağdaştırıcı/sihirbaz, yapılandırma yazımları ve sonlandırmada fail-closed davranır ve doğrulama, finalize ve belge bağlantısı
kopyasında aynı kurulum-gerekli iletisini yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski
yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap yedeği için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-sevk bağlaması için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderim delegeleri ve yük planlaması için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- ileti dizisi bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski agent/media
  yük alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalizasyonu, yinelenen/çakışma doğrulaması ve yedek-kararlı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth kullanan kanallar genellikle varsayılan yolda durabilir: çekirdek onayları ele alır ve Plugin yalnızca giden/auth yeteneklerini ortaya çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıyıcıları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemeyi iki katmana bölünmüş tutun:

- Plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel'ine yalnızca ihtiyaç duyduğunuzda `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun alanlar:

- bota yanıt algılama
- alıntılanan bot algılama
- ileti dizisine katılım kontrolleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü yerel önbellekler

Paylaşılan yardımcı için uygun alanlar:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme allowlist'i
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel bahsetme gerçeklerini hesaplayın.
2. Bu gerçekleri `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağlı olan
paketlenmiş kanal Plugin'leri için aynı paylaşılan bahsetme yardımcılarını ortaya çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekli ise,
ilgili olmayan gelen çalışma zamanı
yardımcılarını yüklememek için `openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk dışa aktarımları olarak `openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod,
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Kılavuz

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal Plugin'i yapan şeydir. Tam paket meta veri yüzeyi için
    bkz. [Plugin Kurulumu ve Yapılandırması](/tr/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "OpenClaw'ı Acme Chat'e bağlayın."
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
      "description": "Acme Chat kanal Plugin'i",
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

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünde birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En azından
    `id` ve `setup` ile başlayın, sonra ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

      // DM security: bot'a kimin mesaj gönderebileceği
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: yeni DM kişileri için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Eşleme kodu: ${code}`);
          },
        },
      },

      // Threading: yanıtların nasıl teslim edildiği
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: platforma mesaj gönderme
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
      Düşük düzey bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirimsel seçenekler verirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod alışverişli metin tabanlı DM eşleme akışı |
      | `threading` | Reply-to-mode çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa, bildirimsel seçenekler yerine ham bağdaştırıcı nesneleri de
      geçebilirsiniz.
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
      description: "Acme Chat kanal Plugin'i",
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

    Kanala ait CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler ise gerçek komut
    kaydı için aynı tanımlayıcıları almaya devam eder. `registerFull(...)` yalnızca çalışma zamanı işi için kalsın.
    `registerFull(...)`, Gateway RPC yöntemleri kaydediyorsa
    Plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` çözümüne gider.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak ele alır. Tüm
    seçenekler için bkz. [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Bir setup girişi ekleyin">
    İlk katılım sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışı bırakıldığında
    veya yapılandırılmadığında tam giriş yerine bunu yükler. Bu, kurulum akışları sırasında ağır çalışma zamanı kodunu çekmekten kaçınır.
    Ayrıntılar için bkz. [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry).

    Setup-safe dışa aktarımları yan modüllere ayıran paketlenmiş çalışma alanı kanalları,
    açık bir kurulum zamanı çalışma zamanı ayarlayıcısına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik örüntü, isteği doğrulayan ve
    kanalınızın gelen işleyicisi üzerinden sevk eden bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin tarafından yönetilen auth (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a sevk eder.
          // Tam bağlama, platform SDK'nıza bağlıdır —
          // gerçek örnek için paketlenmiş Microsoft Teams veya Google Chat Plugin paketine bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özgüdür. Her kanal Plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek örüntüler için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Eş konumlu testleri `src/channel.test.ts` içine yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("hesaptan yapılandırmayı çözümler", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("gizli değerleri somutlaştırmadan hesabı inceler", () => {
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

    Paylaşılan test yardımcıları için bkz. [Testing](/tr/plugins/sdk-testing).

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verisi
├── openclaw.plugin.json      # Yapılandırma şemalı manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Herkese açık dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # İç çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin ile ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekirse)
```

## İleri konular

<CardGroup cols={2}>
  <Card title="İleti dizisi seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya, subagent
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı hatları, paketlenmiş Plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen örüntü değildir;
o paketlenmiş Plugin ailesini doğrudan sürdürmüyorsanız, ortak SDK
yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — Plugin'iniz ayrıca modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması
