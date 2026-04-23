---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T08:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Durum: paketle gelen Plugin (bot token + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir.
Mattermost, kendi kendine barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için
resmi site olan [mattermost.com](https://mattermost.com)'a bakın.

## Paketle gelen Plugin

Mattermost, mevcut OpenClaw sürümlerinde paketle gelen bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya Mattermost'u hariç tutan özel bir kurulumu kullanıyorsanız,
elle kurun:

CLI ile kurulum (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/mattermost
```

Yerel checkout (bir git deposundan çalıştırılırken):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

1. Mattermost Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten paket halinde sunar.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Bir Mattermost bot hesabı oluşturun ve **bot token** değerini kopyalayın.
3. Mattermost **temel URL**'sini kopyalayın (ör. `https://chat.example.com`).
4. OpenClaw'u yapılandırın ve Gateway'i başlatın.

Asgari yapılandırma:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Yerel slash komutları

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw,
Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve Gateway HTTP sunucusunda geri çağrı POST'larını alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost doğrudan Gateway'e erişemediğinde kullanın (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notlar:

- `native: "auto"` için varsayılan, Mattermost'ta devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
- `callbackUrl` atlanırsa, OpenClaw bunu Gateway host/port + `callbackPath` üzerinden türetir.
- Çok hesaplı kurulumlarda `commands`, üst düzeyde veya
  `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanların üzerine yazar).
- Komut geri çağrıları, OpenClaw `oc_*` komutlarını kaydettiğinde
  Mattermost tarafından döndürülen komut başına token'larla doğrulanır.
- Slash geri çağrıları; kayıt başarısız olduğunda, başlatma kısmi kaldığında veya
  geri çağrı token'ı kayıtlı komutlardan biriyle eşleşmediğinde kapalı kalacak şekilde başarısız olur.
- Erişilebilirlik gereksinimi: geri çağrı uç noktası Mattermost sunucusundan erişilebilir olmalıdır.
  - Mattermost, OpenClaw ile aynı host/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` yapmayın.
  - Bu URL `/api/channels/mattermost/command` isteğini OpenClaw'a reverse-proxy etmiyorsa `callbackUrl` değerini Mattermost temel URL'niz olarak ayarlamayın.
  - Hızlı bir kontrol için `curl https://<gateway-host>/api/channels/mattermost/command` kullanın; bir GET isteği `404` yerine OpenClaw'dan `405 Method Not Allowed` döndürmelidir.
- Mattermost çıkış allowlist gereksinimi:
  - Geri çağrınız private/tailnet/internal adresleri hedefliyorsa, Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ayarını geri çağrı host/domain'ini içerecek şekilde yapılandırın.
  - Tam URL değil, host/domain girdileri kullanın.
    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları Gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerleri kullanmalıdır.

`MATTERMOST_URL`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile denetlenir:

- `oncall` (varsayılan): kanallarda yalnızca @mention yapıldığında yanıt verir.
- `onmessage`: her kanal mesajına yanıt verir.
- `onchar`: bir mesaj tetikleyici önekle başladığında yanıt verir.

Yapılandırma örneği:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notlar:

- `onchar`, açık @mention'lara yine de yanıt verir.
- `channels.mattermost.requireMention`, eski yapılandırmalarda dikkate alınır ancak `chatmode` tercih edilir.

## Threading ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyici gönderinin altında bir thread mi başlatacağını denetlemek için
`channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir thread içindeyse thread içinde yanıt verir.
- `first`: üst düzey kanal/grup gönderileri için bu gönderinin altında bir thread başlatır ve
  konuşmayı thread kapsamlı bir oturuma yönlendirir.
- `all`: bugün Mattermost için `first` ile aynı davranışı gösterir.
- Doğrudan mesajlar bu ayarı yok sayar ve thread olmadan kalır.

Yapılandırma örneği:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notlar:

- Thread kapsamlı oturumlar, tetikleyici gönderi kimliğini thread kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost bir thread köküne sahip olduğunda,
  takip parçaları ve medya aynı thread içinde devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen göndericiler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Açık DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (mention kapılı).
- `channels.mattermost.groupAllowFrom` ile göndericileri allowlist'e ekleyin (kullanıcı kimlikleri önerilir).
- Kanal başına mention geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention`
  altında veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkindir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (mention kapılı).
- Çalışma zamanı notu: `channels.mattermost` tamamen eksikse, çalışma zamanı grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

Örnek:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Giden teslimat için hedefler

Bu hedef biçimlerini `openclaw message send` veya cron/webhook'larla kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API üzerinden çözülür)

Yalın opak kimlikler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı kimliği mi kanal kimliği mi).

OpenClaw bunları **önce kullanıcı** olacak şekilde çözer:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw
  doğrudan kanalı `/api/v4/channels/direct` üzerinden çözerek bir **DM** gönderir.
- Aksi halde kimlik bir **kanal kimliği** olarak ele alınır.

Belirleyici davranışa ihtiyacınız varsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).

## DM kanal yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaparken önce doğrudan kanalı çözmesi gerekiyorsa,
varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost Plugin'i genelinde ayarlamak için `channels.mattermost.dmChannelRetry`,
tek bir hesap için ayarlamak için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notlar:

- Bu yalnızca DM kanal oluşturma (`/api/v4/channels/direct`) için geçerlidir, her Mattermost API çağrısı için değil.
- Yeniden denemeler, hız sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıtın gönderilmesi güvenli olduğunda yerinde tamamlanan tek bir **taslak önizleme gönderisi** içinde akıtır. Önizleme, kanalın parça başına mesajlarla dolmasına neden olmak yerine aynı gönderi kimliğinde güncellenir. Medya/hata final durumları, bekleyen önizleme düzenlemelerini iptal eder ve geçici bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

`channels.mattermost.streaming` ile etkinleştirin:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Notlar:

- `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen tek bir önizleme gönderisi, ardından tam yanıtla tamamlanır.
- `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
- `progress`, üretim sırasında bir durum önizlemesi gösterir ve final yanıta yalnızca tamamlanınca gönderi yapar.
- `off`, önizleme akışını devre dışı bırakır.
- Akış yerinde tamamlanamazsa (örneğin gönderi akış ortasında silinirse), OpenClaw yeni bir final gönderisi yollamaya geri döner; böylece yanıt asla kaybolmaz.
- Yalnızca akıl yürütme içeren payload'lar kanal gönderilerinden bastırılır; buna `> Reasoning:` blok alıntısı olarak gelen metin de dahildir. Diğer yüzeylerde düşünmeyi görmek için `/reasoning on` ayarlayın; Mattermost final gönderisi yalnızca yanıtı tutar.
- Kanal eşleme matrisi için bkz. [Streaming](/tr/concepts/streaming#preview-streaming-modes).

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste işaretleri isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilmiş agent oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Kullanıcı bir düğmeye tıkladığında, agent seçimi alır
ve yanıt verebilir.

Düğmeleri, kanal yeteneklerine `inlineButtons` ekleyerek etkinleştirin:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2B bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

- `text` (gerekli): görüntülenecek etiket.
- `callback_data` (gerekli): tıklamada geri gönderilen değer (eylem kimliği olarak kullanılır).
- `style` (isteğe bağlı): `"default"`, `"primary"` veya `"danger"`.

Bir kullanıcı düğmeye tıkladığında:

1. Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** @user tarafından seçildi").
2. Agent, seçimi gelen bir mesaj olarak alır ve yanıt verir.

Notlar:

- Düğme geri çağrıları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
- Mattermost, API yanıtlarından callback verisini çıkarır (güvenlik özelliği); bu nedenle tüm düğmeler tıklamada kaldırılır
  — kısmi kaldırma mümkün değildir.
- Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir
  (Mattermost yönlendirme sınırlaması).

Yapılandırma:

- `channels.mattermost.capabilities`: yetenek dizeleri dizisi. Agent sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için
  `"inlineButtons"` ekleyin.
- `channels.mattermost.interactions.callbackBaseUrl`: düğme
  geri çağrıları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost
  Gateway'e bağlandığı host üzerinden doğrudan erişemediğinde bunu kullanın.
- Çok hesaplı kurulumlarda, aynı alanı
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
- `interactions.callbackBaseUrl` atlanırsa, OpenClaw geri çağrı URL'sini
  `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
- Erişilebilirlik kuralı: düğme geri çağrı URL'si Mattermost sunucusundan erişilebilir olmalıdır.
  `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ ad alanında çalıştığında işe yarar.
- Geri çağrı hedefiniz private/tailnet/internal ise, host/domain'ini Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, agent'ın `message` aracından geçmek yerine
düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir. Mümkün olduğunda Plugin içinden `buildButtonAttachments()` kullanın;
ham JSON gönderiyorsanız şu kurallara uyun:

**Payload yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // yalnızca alfasayısal — aşağıya bakın
            type: "button", // gerekli, yoksa tıklamalar sessizce yok sayılır
            name: "Approve", // görünen etiket
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme id'siyle eşleşmeli (ad araması için)
                action: "approve",
                // ... özel alanlar ...
                _token: "<hmac>", // aşağıdaki HMAC bölümüne bakın
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Kritik kurallar:**

1. Attachments, üst düzey `attachments` içinde değil `props.attachments` içinde olmalıdır (aksi halde sessizce yok sayılır).
2. Her eylem için `type: "button"` gerekir — aksi halde tıklamalar sessizce yutulur.
3. Her eylem için bir `id` alanı gerekir — Mattermost kimliksiz eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler
   Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (`404` döner). Kullanmadan önce bunları çıkarın.
5. `context.action_id`, onay iletisinde
   ham bir ID yerine düğme adının (ör. "Approve") görünmesi için düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` gereklidir — etkileşim işleyicisi onsuz `400` döndürür.

**HMAC token oluşturma:**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler,
Gateway'in doğrulama mantığıyla eşleşen token'lar üretmelidir:

1. Gizli anahtarı bot token'dan türetin:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Tüm alanlarla birlikte ancak `_token` hariç olacak şekilde context nesnesini oluşturun.
3. **Sıralanmış anahtarlarla** ve **boşluksuz** serileştirin (Gateway,
   sıralanmış anahtarlarla `JSON.stringify` kullanır ve bu da kompakt çıktı üretir).
4. İmzalama: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Ortaya çıkan hex digest'i context içinde `_token` olarak ekleyin.

Python örneği:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Yaygın HMAC tuzakları:

- Python'un `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmesi için
  `separators=(",", ":")` kullanın.
- Her zaman **tüm** context alanlarını (`_token` hariç) imzalayın. Gateway `_token` alanını çıkarır ve
  geriye kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama başarısızlığına neden olur.
- `sort_keys=True` kullanın — Gateway imzalamadan önce anahtarları sıralar ve Mattermost
  payload'ı saklarken context alanlarını yeniden sıralayabilir.
- Gizli anahtarı rastgele baytlardan değil, bot token'dan türetin (deterministik).
  Düğmeleri oluşturan süreç ile doğrulayan Gateway arasında gizli anahtar aynı olmalıdır.

## Dizin bağdaştırıcısı

Mattermost Plugin'i, kanal ve kullanıcı adlarını
Mattermost API üzerinden çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ile cron/Webhook teslimatlarında
`#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez — bağdaştırıcı hesap yapılandırmasındaki bot token'ı kullanır.

## Çok hesap

Mattermost, `channels.mattermost.accounts` altında birden çok hesabı destekler:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Sorun giderme

- Kanallarda yanıt yok: botun kanalda olduğundan emin olun ve ona mention yapın (`oncall`), bir tetikleyici önek kullanın (`onchar`) veya `chatmode: "onmessage"` ayarlayın.
- Kimlik doğrulama hataları: bot token'ı, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
- Çok hesaplı sorunlar: ortam değişkenleri yalnızca `default` hesabı için geçerlidir.
- Yerel slash komutları `Unauthorized: invalid command token.` döndürüyor: OpenClaw
  geri çağrı token'ını kabul etmedi. Yaygın nedenler:
  - slash komut kaydı başarısız oldu veya başlangıçta yalnızca kısmen tamamlandı
  - geri çağrı yanlış Gateway/hesaba gidiyor
  - Mattermost hâlâ önceki bir geri çağrı hedefini işaret eden eski komutlara sahip
  - Gateway, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
- Yerel slash komutları çalışmayı durdurursa, günlüklerde şu kayıtları kontrol edin:
  `mattermost: failed to register slash commands` veya
  `mattermost: native slash commands enabled but no commands could be registered`.
- `callbackUrl` atlanırsa ve günlükler geri çağrının
  `http://127.0.0.1:18789/...` olarak çözüldüğü konusunda uyarıyorsa, bu URL büyük olasılıkla yalnızca
  Mattermost, OpenClaw ile aynı host/ağ ad alanında çalıştığında erişilebilirdir. Bunun yerine
  açık ve dışarıdan erişilebilir bir `commands.callbackUrl` ayarlayın.
- Düğmeler beyaz kutular olarak görünüyorsa: agent bozuk biçimli düğme verisi gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının bulunduğunu kontrol edin.
- Düğmeler görüntüleniyor ama tıklamalar hiçbir şey yapmıyorsa: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` içine `127.0.0.1 localhost` eklendiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
- Düğmeler tıklamada `404` döndürüyorsa: düğme `id` değeri muhtemelen kısa çizgi veya alt çizgi içeriyordur. Mattermost'un eylem yönlendiricisi alfasayısal olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
- Gateway `invalid _token` günlüğü yazıyorsa: HMAC uyuşmazlığı. Tüm context alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
- Gateway `missing _token in context` günlüğü yazıyorsa: düğmenin context'inde `_token` alanı yok. Entegrasyon payload'ını oluştururken bunun eklendiğinden emin olun.
- Onay, düğme adı yerine ham ID gösteriyorsa: `context.action_id`, düğmenin `id` değeriyle eşleşmiyordur. Her ikisini de aynı temizlenmiş değere ayarlayın.
- Agent düğmeleri bilmiyorsa: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
