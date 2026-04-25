---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslim davranışı ve işlemler
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Durum: WhatsApp Web (Baileys) üzerinden production-ready. Bağlı oturum(lar) Gateway tarafından yönetilir.

## Kurulum (gerektiğinde)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`, WhatsApp Plugin'ini ilk kez seçtiğinizde kurulum istemi gösterir.
- `openclaw channels login --channel whatsapp` da Plugin henüz mevcut değilse kurulum akışını sunar.
- Dev kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: varsayılan olarak npm paketi `@openclaw/whatsapp` kullanılır.

Elle kurulum seçeneği kullanılmaya devam edebilir:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşlemedir.
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

    Girişten önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini eklemek için:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

  </Step>

  <Step title="İlk eşleme isteğini onaylayın (eşleme modu kullanılıyorsa)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleme isteklerinin süresi 1 saat sonra dolur. Bekleyen istekler kanal başına en fazla 3 ile sınırlandırılır.

  </Step>
</Steps>

<Note>
OpenClaw mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilen)">
    Bu, operasyonel olarak en temiz moddur:

    - OpenClaw için ayrı bir WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendi kendine sohbet karmaşası olasılığının daha düşük olması

    En düşük ilke deseni:

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
    Onboarding, kişisel numara modunu destekler ve self-chat dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom`, kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında self-chat korumaları, bağlı self numarası ve `allowFrom` üzerinden anahtarlanır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet-kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp socket'i ve yeniden bağlanma döngüsünü yönetir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıma katmanı, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özel WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.

## Plugin hook'ları ve gizlilik

Gelen WhatsApp mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum ilişkilendirme alanları içerebilir. Bu nedenle,
özellikle izin vermediğiniz sürece WhatsApp, gelen `message_received` hook payload'larını Plugin'lere yayınlamaz:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Bu izin vermeyi tek bir hesaba göre sınırlayabilirsiniz:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Bunu yalnızca gelen WhatsApp mesaj içeriğini ve tanımlayıcılarını almasına güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy`, doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom`, E.164 biçemli numaraları kabul eder (dahili olarak normalize edilir).

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), bu hesap için kanal düzeyindeki varsayılanlara göre önceliklidir.

    Çalışma zamanı davranışı ayrıntıları:

    - eşlemeler kanal izin deposunda kalıcılaştırılır ve yapılandırılmış `allowFrom` ile birleştirilir
    - hiçbir izin listesi yapılandırılmamışsa bağlı self numarasına varsayılan olarak izin verilir
    - OpenClaw hiçbir zaman giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajlar) otomatik eşlemez

  </Tab>

  <Tab title="Grup ilkesi + izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` belirtilmemişse tüm gruplar uygun kabul edilir
       - `groups` mevcutsa grup izin listesi olarak işlev görür (`"*"` kabul edilir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen, `groupAllowFrom` ile (veya `*`) eşleşmelidir
       - `disabled`: tüm gelen grup trafiğini engeller

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa çalışma zamanı, mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiç `channels.whatsapp` bloğu yoksa çalışma zamanı grup ilkesi yedeği, `channels.defaults.groupPolicy` ayarlanmış olsa bile `allowlist` olur (uyarı günlüğü ile).

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılaması şunları içerir:

    - bot kimliğine yönelik açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex desenleri (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - örtük bota yanıt algılaması (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkilendirmesi vermez
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler, izinli bir kullanıcının mesajına yanıt verseler bile yine engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Kişisel numara ve self-chat davranışı

Bağlı self numarası `allowFrom` içinde de varsa, WhatsApp self-chat korumaları etkinleşir:

- self-chat dönüşlerinde okundu bilgilerini atla
- aksi halde kendinizi pingleyecek olan mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa self-chat yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarfı + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarfı içinde sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar, şu gibi yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ile kişi/vCard ayrıntıları, satır içi istem metni olarak değil, çitlenmiş güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için işlenmemiş mesajlar tamponlanabilir ve bot nihayet tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretleyicileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Okundu bilgileri, kabul edilen gelen WhatsApp mesajları için varsayılan olarak etkindir.

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

    Genel olarak etkin olsa bile self-chat dönüşlerinde okundu bilgileri atlanır.

  </Accordion>
</AccordionGroup>

## Teslim, parçalara bölme ve medya

<AccordionGroup>
  <Accordion title="Metni parçalara bölme">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalara bölmeye geri döner
  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görsel, video, ses (PTT sesli not) ve belge payload'larını destekler
    - yanıt payload'ları `audioAsVoice` değerini korur; WhatsApp ses medyasını Baileys PTT sesli notları olarak gönderir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT tesliminden önce Ogg/Opus'a dönüştürülür
    - yerel Ogg/Opus ses, sesli not uyumluluğu için `audio/ogg; codecs=opus` ile gönderilir
    - hareketli GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt payload'ları gönderilirken açıklamalar ilk medya öğesine uygulanır
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir
  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranışı">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görseller sınırlara sığması için otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, sessizce yanıtı düşürmek yerine ilk öğe yedeği bir metin uyarısı gönderir
  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer      | Davranış                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `"off"`    | Asla alıntılama; düz mesaj olarak gönder                                 |
| `"first"`  | Yalnızca ilk giden yanıt parçasını alıntıla                              |
| `"all"`    | Her giden yanıt parçasını alıntıla                                       |
| `"batched"`| Anlık yanıtları alıntısız bırakırken kuyruğa alınmış toplu yanıtları alıntıla |

Varsayılan değer `"off"` şeklindedir. Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, ajanın WhatsApp'ta emoji tepkilerini ne kadar geniş kullandığını kontrol eder:

| Düzey        | Onay tepkileri | Ajan başlatımlı tepkiler | Açıklama                                       |
| ------------ | -------------- | ------------------------ | ---------------------------------------------- |
| `"off"`      | Hayır          | Hayır                    | Hiç tepki yok                                  |
| `"ack"`      | Evet           | Hayır                    | Yalnızca onay tepkileri (yanıt öncesi alındı)  |
| `"minimal"`  | Evet           | Evet (temkinli)          | Onay + temkinli yönlendirmeyle ajan tepkileri  |
| `"extensive"`| Evet           | Evet (teşvik edilir)     | Onay + teşvik edilen yönlendirmeyle ajan tepkileri |

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

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alımı anında onay tepkileriyle destekler.
Onay tepkileri `reactionLevel` tarafından kapılanır — `reactionLevel` değeri `"off"` olduğunda bastırılırlar.

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

- gelen kabul edildikten hemen sonra gönderilir (yanıt öncesi)
- başarısızlıklar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetme ile tetiklenen dönüşlerde tepki verir; grup etkinleştirmesi `always` ise bu denetimi baypas eder
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, aksi halde yapılandırılmış ilk hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalize edilir
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski sürüm uyumluluğu">
    - mevcut kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır
  </Accordion>

  <Accordion title="Çıkış yapma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde `oauth.json` korunur, Baileys kimlik doğrulama dosyaları ise kaldırılır.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği, WhatsApp tepki eylemini (`react`) içerir.
- Eylem kapıları:
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

  <Accordion title="Bağlı ama bağlantısı kesilmiş / yeniden bağlanma döngüsü">
    Belirti: tekrar eden bağlantı kopmaları veya yeniden bağlanma girişimleri olan bağlı hesap.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderimde etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapılaması (`requireMention` + bahsetme desenleri)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girdiler öncekinin üzerine yazar, bu yüzden kapsam başına yalnızca tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, grup ve doğrudan sohbetler için `groups` ve `direct` haritaları aracılığıyla Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada hiç yoksa veya varsa ama `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek harita üzerinde çalışır:

1. **Doğrudan sohbete özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Doğrudan sohbet joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada hiç yoksa veya varsa ama `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Not: `dms`, hafif DM başına geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`); istem geçersiz kılmaları `direct` altında yaşar.

**Telegram çoklu hesap davranışından farkı:** Telegram'da kök `groups`, çoklu hesap kurulumunda tüm hesaplar için bilerek bastırılır — kendi `groups` değerini tanımlamayan hesaplarda bile — bunun amacı botun üyesi olmadığı gruplardan grup mesajları almasını önlemektir. WhatsApp bu korumayı uygulamaz: hesap düzeyinde geçersiz kılma tanımlamayan hesaplar için, kaç hesap yapılandırılmış olduğuna bakılmaksızın kök `groups` ve kök `direct` her zaman miras alınır. Çoklu hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan istemler istiyorsanız, kök düzey varsayılanlara güvenmek yerine tam haritayı her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma haritasıdır hem de sohbet düzeyindeki grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` yalnızca zaten o kapsamın tüm grupları kabul etmesini istediğinizde eklenmelidir. Yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilen grupların kümesini genişletir, ancak tek başına bu gruplardaki her gönderene yetki vermez. Gönderen erişimi hâlâ ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` ile kontrol edilir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile birlikte `allowFrom` veya eşleme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Yalnızca kök kapsamda tüm gruplar kabul edilmeliyse kullanın.
        // Kendi groups haritasını tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm gruplar için varsayılan istem." },
      },
      direct: {
        // Kendi direct haritasını tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm doğrudan sohbetler için varsayılan istem." },
      },
      accounts: {
        work: {
          groups: {
            // Bu hesap kendi groups değerini tanımlar, bu yüzden kök groups
            // tamamen değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca bu hesapta tüm gruplar kabul edilmeliyse kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct değerini tanımlar, bu yüzden kök direct girdileri
            // tamamen değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş doğrudan sohbeti için istem." },
            "*": { systemPrompt: "İş doğrudan sohbetleri için varsayılan istem." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/tr/gateway/config-channels#whatsapp)

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
