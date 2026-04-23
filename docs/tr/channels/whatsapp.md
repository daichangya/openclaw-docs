---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslim davranışı ve işlemler
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T08:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web kanalı)

Durum: WhatsApp Web (Baileys) üzerinden production-ready. Gateway bağlı oturum(lar)ın sahibidir.

## Kurulum (gerektiğinde)

- İlk kez seçtiğinizde, onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`
  WhatsApp Plugin'ini kurmanızı ister.
- `openclaw channels login --channel whatsapp` da,
  Plugin henüz mevcut değilse kurulum akışını sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: varsayılan olarak `@openclaw/whatsapp` npm paketini kullanır.

Elle kurulum seçeneği kullanılmaya devam eder:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma desenleri ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="WhatsApp erişim ilkesini yapılandırın">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp'ı bağlayın (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

  </Step>

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme modu kullanılıyorsa)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw mümkün olduğunda WhatsApp'ı ayrı bir numara üzerinde çalıştırmanızı önerir. (Kanal üst verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Ayrı numara (önerilir)">
    Bu en temiz operasyon modudur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendinizle sohbet karışıklığı olasılığı daha düşük

    Minimal ilke deseni:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kişisel numara yedeği">
    Onboarding kişisel numara modunu destekler ve self-chat dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında self-chat korumaları, bağlı kendi numaranıza ve `allowFrom` değerine göre çalışır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketi ve yeniden bağlanma döngüsünün sahibidir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıması, Gateway sunucusunda standart proxy ortam değişkenlerini destekler (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özel WhatsApp proxy ayarları yerine sunucu düzeyinde proxy yapılandırmasını tercih edin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy`, doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içine `"*"` eklenmesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalize edilir).

    Çoklu hesap geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), bu hesap için kanal düzeyi varsayılanların önüne geçer.

    Çalışma zamanı davranışı ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcıdır ve yapılandırılmış `allowFrom` ile birleştirilir
    - izin listesi yapılandırılmamışsa, bağlı kendi numarasına varsayılan olarak izin verilir
    - giden `fromMe` DM'leri asla otomatik eşleştirilmez

  </Tab>

  <Tab title="Grup ilkesi + izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` belirtilmezse tüm gruplar uygun kabul edilir
       - `groups` belirtilmişse, grup izin listesi olarak davranır (`"*"` kabul edilir)

    2. **Grup gönderici ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderici izin listesi atlanır
       - `allowlist`: gönderici `groupAllowFrom` ile eşleşmelidir (veya `*`)
       - `disabled`: tüm grup gelenlerini engeller

    Gönderici izin listesi geri dönüşü:

    - `groupAllowFrom` ayarlı değilse, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderici izin listeleri mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiç `channels.whatsapp` bloğu yoksa, çalışma zamanı grup ilkesi geri dönüşü `allowlist` olur (bir uyarı günlüğüyle), `channels.defaults.groupPolicy` ayarlanmış olsa bile.

  </Tab>

  <Tab title="Mention'lar + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğine açık WhatsApp mention'ları
    - yapılandırılmış mention regex desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - örtük bota-yanıt algılama (yanıt göndericisi bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention geçidini karşılar; gönderici yetkilendirmesi vermez
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan göndericiler, izin listesindeki bir kullanıcının mesajını yanıtlasalar bile yine de engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip geçitlidir.

  </Tab>
</Tabs>

## Kişisel numara ve self-chat davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcutsa, WhatsApp self-chat korumaları etkinleşir:

- self-chat dönüşleri için okundu makbuzlarını atla
- aksi takdirde kendinize ping gönderecek olan mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlı değilse, self-chat yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` kullanır

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarfına sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt üst veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderici JID/E.164).

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu gibi yer tutucularla normalize edilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Konum ve kişi yükleri, yönlendirmeden önce metinsel bağlam olarak normalize edilir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için, işlenmemiş mesajlar arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretleyicileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu makbuzları">
    Okundu makbuzları, kabul edilen gelen WhatsApp mesajları için varsayılan olarak etkindir.

    Genel olarak devre dışı bırakmak için:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Hesap başına geçersiz kılma:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Self-chat dönüşleri, genel olarak etkin olsa bile okundu makbuzlarını atlar.

  </Accordion>
</AccordionGroup>

## Teslim, parçalama ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, sonra uzunluk açısından güvenli parçalamaya geri döner
  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görsel, video, ses (PTT sesli not) ve belge yüklerini destekler
    - `audio/ogg`, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak yeniden yazılır
    - hareketli GIF oynatımı, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken açıklamalar ilk medya öğesine uygulanır
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir
  </Accordion>

  <Accordion title="Medya boyut sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görseller sınırlara sığması için otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir
  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer    | Davranış                                                                          |
| -------- | --------------------------------------------------------------------------------- |
| `"auto"` | Sağlayıcı destekliyorsa gelen mesajı alıntılar; aksi halde alıntılamayı atlar     |
| `"on"`   | Her zaman gelen mesajı alıntılar; alıntılama reddedilirse düz gönderime döner     |
| `"off"`  | Asla alıntılamaz; düz mesaj olarak gönderir                                       |

Varsayılan `"auto"` değeridir. Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, ajanın WhatsApp üzerinde emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey        | Ack tepkileri | Ajan başlatımlı tepkiler     | Açıklama                                        |
| ------------ | ------------- | ---------------------------- | ----------------------------------------------- |
| `"off"`      | Hayır         | Hayır                        | Hiç tepki yok                                   |
| `"ack"`      | Evet          | Hayır                        | Yalnızca ack tepkileri (yanıt öncesi alındı)    |
| `"minimal"`  | Evet          | Evet (korumacı)              | Ack + korumacı rehberlikle ajan tepkileri       |
| `"extensive"`| Evet          | Evet (teşvik edilir)         | Ack + teşvik edilen rehberlikle ajan tepkileri  |

Varsayılan: `"minimal"`.

Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.reactionLevel` kullanır.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Onay tepkileri

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alındığında anında ack tepkilerini destekler.
Ack tepkileri `reactionLevel` tarafından geçitlenir — `reactionLevel` değeri `"off"` olduğunda bastırılır.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Davranış notları:

- gelen mesaj kabul edildikten hemen sonra gönderilir (yanıt öncesi)
- hatalar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, mention ile tetiklenen dönüşlerde tepki verir; grup etkinleştirme `always` bu denetim için bypass görevi görür
- WhatsApp, `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa yapılandırılmış ilk hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalize edilir
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - mevcut kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - eski varsayılan kimlik doğrulama `~/.openclaw/credentials/` altında hâlâ tanınır/geçirilir; varsayılan hesap akışları için desteklenir
  </Accordion>

  <Accordion title="Oturum kapatma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde `oauth.json` korunur, Baileys kimlik doğrulama dosyaları kaldırılır.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği, WhatsApp tepki eylemini (`react`) içerir.
- Eylem geçitleri:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı olmadığını bildiriyor.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantı kopuk / yeniden bağlanma döngüsü">
    Belirti: bağlı hesapta tekrarlanan bağlantı kopmaları veya yeniden bağlanma girişimleri.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderimde etkin dinleyici yok">
    Giden gönderimler, hedef hesap için etkin bir Gateway dinleyicisi yoksa hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - mention geçitleme (`requireMention` + mention desenleri)
    - `openclaw.json` içindeki yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` bulundurun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenmiştir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, gruplar ve doğrudan sohbetler için `groups` ve `direct` eşlemeleri üzerinden Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkin `groups` eşlemesi önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, bu değer kök `groups` eşlemesini tamamen değiştirir (deep merge yok). Ardından istem araması, ortaya çıkan bu tek eşleme üzerinde çalışır:

1. **Gruba özel sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkin `direct` eşlemesi önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, bu değer kök `direct` eşlemesini tamamen değiştirir (deep merge yok). Ardından istem araması, ortaya çıkan bu tek eşleme üzerinde çalışır:

1. **Doğrudan sohbete özel sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Not: `dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`); istem geçersiz kılmaları `direct` altında yaşar.

**Telegram çoklu hesap davranışından farkı:** Telegram'da kök `groups`, çoklu hesap kurulumunda tüm hesaplar için kasıtlı olarak bastırılır — kendi `groups` değerini tanımlamayan hesaplarda bile — botun ait olmadığı gruplardan grup mesajı almasını önlemek için. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çoklu hesaplı bir WhatsApp kurulumunda, hesap başına grup veya doğrudan istemler istiyorsanız, kök düzey varsayılanlara güvenmek yerine tam eşlemeyi açıkça her hesabın altında tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca o kapsamın zaten tüm grupları kabul etmesini istediğinizde ekleyin. Yalnızca sabit bir grup kimliği kümesinin uygun kalmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderici yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme ulaşabilecek grup kümesini genişletir, ancak bu tek başına bu gruplardaki her göndericiyi yetkilendirmez. Gönderici erişimi yine ayrıca `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile birlikte `allowFrom` veya eşleştirme deposu kuralları tarafından kabul edildikten sonra varsayılan doğrudan sohbet yapılandırması sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Bunu yalnızca tüm grupların kök kapsamda kabul edilmesi gerekiyorsa kullanın.
        // Kendi groups eşlemesini tanımlamayan tüm hesaplar için geçerlidir.
        "*": { systemPrompt: "Tüm gruplar için varsayılan istem." },
      },
      direct: {
        // Kendi direct eşlemesini tanımlamayan tüm hesaplar için geçerlidir.
        "*": { systemPrompt: "Tüm doğrudan sohbetler için varsayılan istem." },
      },
      accounts: {
        work: {
          groups: {
            // Bu hesap kendi groups değerini tanımlar, bu yüzden kök groups tamamen
            // değiştirilir. Jokeri korumak için burada da "*" değerini açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Bunu yalnızca bu hesapta tüm grupların kabul edilmesi gerekiyorsa kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct eşlemesini tanımlar, bu yüzden kök direct girdileri
            // tamamen değiştirilir. Jokeri korumak için burada da "*" değerini açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş doğrudan sohbeti için istem." },
            "*": { systemPrompt: "İş doğrudan sohbetleri için varsayılan istem." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma başvurusu işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/tr/gateway/configuration-reference#whatsapp)

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
