---
read_when:
    - Yeni bir mesajlaşma kanal Plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-15T08:53:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal plugin'i oluşturma sürecini adım adım açıklar. Sonunda DM güvenliği, eşleme, yanıt iş parçacığı oluşturma ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Başlangıç](/tr/plugins/building-plugins)
  bölümünü okuyun.
</Info>

## Kanal plugin'leri nasıl çalışır

Kanal plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracını tutar. Plugin'iniz şunlardan sorumludur:

- **Config** — hesap çözümleme ve kurulum sihirbazı
- **Security** — DM ilkesi ve izin listeleri
- **Pairing** — DM onay akışı
- **Session grammar** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst öğe geri dönüşlerine nasıl eşlendiği
- **Outbound** — platforma metin, medya ve anket gönderme
- **Threading** — yanıtların nasıl iş parçacığına alındığı

Çekirdek; paylaşılan message aracından, istem bağlamasından, dış oturum-anahtarı biçiminden, genel `:thread:` kayıtlarından ve dağıtımdan sorumludur.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın.
Çekirdek bu açık listeyi sandbox yol normalleştirmesi ve giden medya erişim
ilkesi için kullanır; böylece plugin'lerin sağlayıcıya özgü avatar,
ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara
ihtiyacı olmaz.
Tercihen
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir eşleme döndürün; böylece ilgisiz eylemler başka bir eylemin medya argümanlarını devralmaz.
Düz bir dizi de, açığa çıkarılan tüm eylemler arasında bilerek paylaşılan
parametreler için çalışmaya devam eder.

Platformunuz konuşma kimlikleri içinde ek kapsam depoluyorsa, bu ayrıştırmayı
plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu,
`rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı
kimliğine, açık `baseConversationId` değerine ve herhangi bir
`parentConversationCandidates` değerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketli
plugin'ler ayrıca eşleşen bir
`resolveSessionConversation(...)` dışa aktarımı içeren üst düzey bir `session-key-api.ts`
dosyası da sunabilir. Çekirdek bu önyükleme açısından güvenli yüzeyi
yalnızca çalışma zamanı plugin kayıt defteri henüz kullanılabilir olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir plugin yalnızca
genel/raw kimliğin üzerine üst öğe geri dönüşlerine ihtiyaç duyduğunda eski
uyumluluk geri dönüşü olarak kullanılmaya devam eder. Her iki kanca da varsa,
çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca kanonik kanca bunları
atlanırsa `resolveParentConversationCandidates(...)` kancasına geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek aynı sohbet içi `/approve`, paylaşılan onay düğmesi payload'ları ve genel geri dönüş teslimatından sorumludur.
- Kanal onaya özgü davranış gerektiriyorsa, kanal plugin'inde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimatı/yerel işleme/görselleştirme/yetkilendirme bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca giriş/çıkış içindir; çekirdek artık bu nesneden onay yetkilendirme kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, onay yetkilendirmesi için kanonik kancadır.
- Aynı sohbet içi onay yetkilendirme kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, başlatıcı yüzey/yerel istemci durumu aynı sohbet içi onay yetkilendirmesinden farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü kancayı `enabled` ile `disabled` durumlarını ayırt etmek, başlatıcı kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` bunu yaygın durum için doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü payload yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanala ait yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; bu, çekirdeğin onay yaşam döngüsünü oluşturmaya devam etmesine izin verirken çalışma zamanı modülünüzü gerektiğinde içe aktarabilir.
- Kanalın paylaşılan oluşturucu yerine gerçekten özel onay payload'larına ihtiyacı olduğunda yalnızca `approvalCapability.render` kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam config ayarlarını açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Bu kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları oluşturmalıdır.
- Bir kanal mevcut config'den kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet içi `/approve` erişimini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Kanalın yerel onay teslimatına ihtiyacı varsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri `approvalCapability.nativeRuntime` arkasına koyun; tercihen `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden. Böylece çekirdek işleyiciyi oluşturabilir ve istek filtreleme, yönlendirme, tekilleştirme, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerini yönetebilir. `nativeRuntime` birkaç küçük parçaya ayrılmıştır:
- `availability` — hesabın yapılandırılmış olup olmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini beklemede/çözümlendi/süresi doldu yerel payload'larına veya son eylemlere eşleme
- `transport` — hedefleri hazırlama ve yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action kancaları
- `observe` — isteğe bağlı teslimat tanılama kancaları
- Kanalın istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü sarmalayıcı yapıştırıcısı eklemeden kanal başlangıç durumundan yetenek odaklı işleyicileri önyüklemesine olanak tanır.
- Yalnızca yetenek odaklı kanca henüz yeterince ifade gücüne sahip değilse daha alt düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` çözümlerine başvurun.
- Yerel onay kanalları, bu yardımcılar üzerinden hem `accountId` hem de `approvalKind` yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabı kapsamına taşır; `approvalKind` ise exec ile plugin onayı davranışını çekirdekte sabit kodlu dallanmalar olmadan kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerinden de sorumludur. Kanal plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarın ve çekirdek, başlatıcı sohbete herhangi bir bildirim göndermeden önce gerçek teslimatları toplasın.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler exec ile plugin onayı yönlendirmesini kanal yerel durumundan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilerek farklı yerel yüzeyler açığa çıkarabilir.
  Güncel paketli örnekler:
  - Slack, hem exec hem de plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, yetkilendirmenin onay türüne göre farklılaşmasına izin verirken exec ve plugin onayları için aynı yerel DM/kanal yönlendirmesi ve tepki kullanıcı deneyimini korur.
- `createApproverRestrictedNativeApprovalAdapter` uyumluluk sarmalayıcısı olarak hâlâ vardır, ancak yeni kod `capability` oluşturucusunu tercih etmeli ve plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu ailenin yalnızca bir parçasına
ihtiyacınız olduğunda daha dar runtime alt yollarını tercih edin:

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

Kurulum için özel olarak:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar, ortam farkındalıklı bağdaştırıcı
  kancasıdır
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız ortam güdümlü kurulum veya yetkilendirme destekliyorsa ve genel başlangıç/config
akışlarının çalışma zamanı yüklenmeden önce bu ortam adlarını bilmesi gerekiyorsa,
bunları plugin manifest içinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars`
veya yerel sabitlerini yalnızca operatöre dönük metinler için kullanın.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/config yardımcılarına da ihtiyaç duyduğunuzda
  daha geniş `openclaw/plugin-sdk/setup` kancasını kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu plugin'i yükleyin" bilgisini
duyurmak istiyorsa, `createOptionalChannelSetupSurface(...)` çözümünü tercih edin. Üretilen
bağdaştırıcı/sihirbaz config yazımlarında ve sonlandırmada güvenli biçimde başarısız olur
ve doğrulama, sonlandırma ve docs-link
metinlerinde aynı yükleme gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine daha dar
yardımcıları tercih edin:

- çok hesaplı config ve
  varsayılan hesap geri dönüşü için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dağıt bağlaması için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderim delegeleri için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- iş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski agent/media
  payload alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalizasyonu, yinelenen/çakışan doğrulama ve geri dönüş açısından kararlı komut
  config sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca yetkilendirme kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve plugin yalnızca outbound/auth yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işlemeyi iki katmana bölünmüş tutun:

- plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Paylaşılan katman için `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun örnekler:

- bot'a yanıt algılama
- bot alıntısı algılama
- iş parçacığı katılımı kontrolleri
- servis/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü önbellekler

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel mention bilgilerini hesaplayın.
2. Bu bilgileri `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağımlı olan
paketlenmiş kanal plugin'leri için aynı paylaşılan mention yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalmaya devam eder. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım örnek

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı
    bunun bir kanal plugin'i olmasını sağlar. Tam paket meta verisi yüzeyi için
    bkz. [Plugin Kurulumu ve Config](/tr/plugins/sdk-setup#openclaw-channel):

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
    `ChannelPlugin` arayüzü birçok isteğe bağlı bağdaştırıcı yüzeyine sahiptir. En az
    gereksinimle başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

    `src/channel.ts` dosyasını oluşturun:

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

      // DM güvenliği: bota kim mesaj gönderebilir
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Eşleme: yeni DM kişileri için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Eşleme kodu: ${code}`);
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
      bildirime dayalı seçenekler verirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Config alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod alışverişiyle metin tabanlı DM eşleme akışı |
      | `threading` | Reply-to modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim fonksiyonları (mesaj kimlikleri) |

      Tam denetime ihtiyaç duyarsanız bildirime dayalı seçenekler yerine ham
      bağdaştırıcı nesneleri de geçebilirsiniz.
    </Accordion>

  </Step>

  <Step title="Giriş noktasını bağlayın">
    `index.ts` dosyasını oluşturun:

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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler de gerçek komut kaydı için aynı tanımlayıcıları alır.
    `registerFull(...)` yöntemini çalışma zamanına özgü işler için kullanın.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` çözümüne gider.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için bkz.
    [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıysa
    veya yapılandırılmamışsa tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun yüklenmesini önler.
    Ayrıntılar için bkz. [Kurulum ve Config](/tr/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan
    ve kanalınızın gelen işleyicisi üzerinden dağıtan bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen auth (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dağıtır.
          // Tam bağlama platform SDK'nıza bağlıdır —
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
      Gelen mesaj işleme kanala özgüdür. Her kanal plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek desenler için paketlenmiş kanal plugin'lerine
      (örneğin Microsoft Teams veya Google Chat plugin paketi)
      bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde aynı yerde testler yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("config içinden hesabı çözümler", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("gizli verileri somutlaştırmadan hesabı inceler", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("eksik config'i bildirir", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Paylaşılan test yardımcıları için bkz. [Test](/tr/plugins/sdk-testing).

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verileri
├── openclaw.plugin.json      # Config şemalı manifest
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

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="İş parçacığı seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, alt ajan
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı kancalar, paketlenmiş plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal plugin'leri için önerilen desen değildir;
o paketlenmiş plugin ailesini doğrudan siz bakımını yapmıyorsanız,
ortak SDK yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — plugin'iniz aynı zamanda modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Test](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) — tam manifest şeması
