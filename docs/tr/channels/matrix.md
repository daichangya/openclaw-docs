---
read_when:
    - OpenClaw içinde Matrix kurulumu
    - Matrix E2EE ve doğrulamasını yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-23T08:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketlenmiş bir kanal plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş plugin

Matrix, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak sunulur; bu yüzden normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Matrix'i dışlayan özel bir kurulumu kullanıyorsanız, onu
elle kurun:

npm'den kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan kurun:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Matrix plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Homeserver'ınızda bir Matrix hesabı oluşturun.
3. `channels.matrix` yapılandırmasını şu seçeneklerden biriyle yapın:
   - `homeserver` + `accessToken`, veya
   - `homeserver` + `userId` + `password`.
4. Gateway'i yeniden başlatın.
5. Bot ile bir DM başlatın veya onu bir odaya davet edin.
   - Yeni Matrix davetleri yalnızca `channels.matrix.autoJoin` buna izin verdiğinde çalışır.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix sihirbazı şunları sorar:

- homeserver URL'si
- kimlik doğrulama yöntemi: access token veya parola
- kullanıcı kimliği (yalnızca parola ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetle otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve o hesap için yapılandırmada kimlik doğrulama zaten kaydedilmemişse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM izin listesi girdileri doğrudan `@user:server` kabul eder; görünen adlar yalnızca canlı dizin araması tam bir eşleşme bulduğunda çalışır.
- Oda izin listesi girdileri oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar çalışma zamanında izin listesi çözümlemesi tarafından yok sayılır.
- Davetle otomatik katılımın izin listesi modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` komutunu kullanın.

<Warning>
`channels.matrix.autoJoin` için varsayılan değer `off`'tur.

Bunu ayarlamazsanız bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle önce elle katılmazsanız yeni gruplarda veya davet edilen DM'lerde görünmez.

Hangi davetleri kabul edeceğini sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

`allowlist` modunda `autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder.
</Warning>

İzin listesi örneği:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Her davete katıl:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Token tabanlı en basit kurulum:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Parola tabanlı kurulum (girişten sonra token önbelleğe alınır):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` içinde depolar.
Varsayılan hesap `credentials.json` kullanır; adlandırılmış hesaplar `credentials-<account>.json` kullanır.
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, geçerli kimlik doğrulama doğrudan yapılandırmada ayarlı olmasa bile OpenClaw, Matrix'i kurulum, doctor ve kanal durumu keşfi için yapılandırılmış olarak değerlendirir.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlı olmadığında kullanılır):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Varsayılan olmayan hesaplar için hesap kapsamlı ortam değişkenlerini kullanın:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

`ops` hesabı için örnek:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Normalize edilmiş hesap kimliği `ops-bot` için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini hesap kapsamlı ortam değişkenlerinde çakışma olmaması için escape eder.
Örneğin, `-`, `_X2D_` olur; bu yüzden `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçili hesap için yapılandırmada Matrix kimlik doğrulaması zaten kaydedilmemişse ortam değişkeni kısayolunu sunar.

`MATRIX_HOMESERVER` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

Bu, DM eşleştirmesi, oda izin listesi ve E2EE etkin olacak şekilde pratik bir temel yapılandırmadır:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw davet anında
davet edilen bir odayı güvenilir şekilde DM veya grup olarak sınıflandıramaz; bu nedenle tüm
davetler önce `autoJoin` üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak
sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde
düzenlemesini ve ardından yanıt tamamlandığında bunu sonlandırmasını istiyorsanız
`channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılandır. OpenClaw son yanıtı bekler ve bir kez gönderir.
- `streaming: "partial"`, geçerli asistan bloğu için normal Matrix metin mesajları kullanarak düzenlenebilir bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; bu nedenle standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gösterebilir.
- `streaming: "quiet"`, geçerli asistan bloğu için düzenlenebilir sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca tamamlanmış önizleme düzenlemeleri için alıcı push kuralları da yapılandırıyorsanız kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda Matrix, geçerli blok için canlı taslağı tutar ve tamamlanan blokları ayrı mesajlar olarak korur.
- Önizleme akışı açıkken `blockStreaming` kapalıysa Matrix canlı taslağı yerinde düzenler ve blok veya dönüş tamamlandığında aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri normal şekilde göndermeye devam eder. Eski bir önizleme artık güvenli şekilde yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakâr hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming` tek başına taslak önizlemelerini etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirim veren bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim veren bir Matrix mesajı olarak gönderir.

### Sessiz tamamlanmış önizlemeler için self-hosted push kuralları

Kendi Matrix altyapınızı çalıştırıyorsanız ve sessiz önizlemelerin yalnızca bir blok veya
son yanıt tamamlandığında bildirim vermesini istiyorsanız `streaming: "quiet"` ayarlayın ve tamamlanmış önizleme düzenlemeleri için kullanıcı başına bir push kuralı ekleyin.

Bu genellikle homeserver genelinde bir yapılandırma değişikliği değil, alıcı kullanıcı kurulumu olur:

Başlamadan önce hızlı eşleştirme:

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının access token'ını kullanın
- push kuralındaki `sender` alanını bot kullanıcısının tam MXID'si ile eşleştirin

1. OpenClaw'ı sessiz önizlemeler kullanacak şekilde yapılandırın:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Alıcı hesabının zaten normal Matrix push bildirimleri aldığından emin olun. Sessiz önizleme
   kuralları yalnızca o kullanıcının çalışan pushers/cihazları zaten varsa çalışır.

3. Alıcı kullanıcının access token'ını alın.
   - Botun token'ını değil, alan kullanıcının token'ını kullanın.
   - Mevcut bir istemci oturum token'ını yeniden kullanmak genellikle en kolay yoldur.
   - Yeni bir token üretmeniz gerekirse standart Matrix Client-Server API üzerinden giriş yapabilirsiniz:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Alıcı hesabının zaten pusher'lara sahip olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Bu çağrı etkin pusher/cihaz döndürmüyorsa, aşağıdaki OpenClaw kuralını eklemeden önce
normal Matrix bildirimlerini düzeltin.

OpenClaw, sonlandırılmış yalnızca metin içeren önizleme düzenlemelerini şu işaretle belirtir:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Bu bildirimleri alması gereken her alıcı hesap için bir override push kuralı oluşturun:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Komutu çalıştırmadan önce şu değerleri değiştirin:

- `https://matrix.example.org`: homeserver temel URL'niz
- `$USER_ACCESS_TOKEN`: alıcı kullanıcının access token'ı
- `openclaw-finalized-preview-botname`: bu alıcı kullanıcı için bu bota özgü bir kural kimliği
- `@bot:example.org`: alıcı kullanıcının MXID'si değil, OpenClaw Matrix botunuzun MXID'si

Çok botlu kurulumlar için önemli:

- Push kuralları `ruleId` ile anahtarlanır. Aynı kural kimliğine karşı `PUT` komutunu yeniden çalıştırmak o tek kuralı günceller.
- Bir alan kullanıcının birden fazla OpenClaw Matrix bot hesabı için bildirim alması gerekiyorsa, her `sender` eşleşmesi için benzersiz bir kural kimliğiyle bot başına bir kural oluşturun.
- Basit bir desen `openclaw-finalized-preview-<botname>` şeklindedir; örneğin `openclaw-finalized-preview-ops` veya `openclaw-finalized-preview-support`.

Kural, olay göndericisine göre değerlendirilir:

- alan kullanıcının token'ı ile kimlik doğrulayın
- `sender` alanını OpenClaw bot MXID'si ile eşleştirin

6. Kuralın var olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme göstermeli ve son
   yerinde düzenleme blok veya dönüş tamamlandığında bir kez bildirim vermelidir.

Daha sonra kuralı kaldırmanız gerekirse, aynı kural kimliğini alan kullanıcının token'ı ile silin:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notlar:

- Kuralı botun token'ı ile değil, alan kullanıcının access token'ı ile oluşturun.
- Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir, bu nedenle ek bir sıralama parametresi gerekmez.
- Bu yalnızca OpenClaw'ın güvenle yerinde sonlandırabildiği yalnızca metin içeren önizleme düzenlemelerini etkiler. Medya yedekleri ve eski önizleme yedekleri yine normal Matrix teslimini kullanır.
- `GET /_matrix/client/v3/pushers` hiçbir pusher göstermiyorsa, kullanıcının bu hesap/cihaz için henüz çalışan Matrix push teslimi yoktur.

#### Synapse

Synapse için yukarıdaki kurulum genellikle tek başına yeterlidir:

- Sonlandırılmış OpenClaw önizleme bildirimleri için özel bir `homeserver.yaml` değişikliği gerekmez.
- Synapse dağıtımınız zaten normal Matrix push bildirimleri gönderiyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı temel kurulum adımıdır.
- Synapse'i bir reverse proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun.
- Synapse worker'ları çalıştırıyorsanız, pusher'ların sağlıklı olduğundan emin olun. Push teslimi ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından gerçekleştirilir.

#### Tuwunel

Tuwunel için yukarıda gösterilen aynı kurulum akışını ve push-rule API çağrısını kullanın:

- Sonlandırılmış önizleme işaretleyicisinin kendisi için Tuwunel'e özgü yapılandırma gerekmez.
- Normal Matrix bildirimleri o kullanıcı için zaten çalışıyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı temel kurulum adımıdır.
- Kullanıcı başka bir cihazda etkinken bildirimler kayboluyor gibi görünüyorsa `suppress_push_when_active` etkin mi kontrol edin. Tuwunel bu seçeneği 12 Eylül 2025'te Tuwunel 1.4.2'de ekledi ve bir cihaz etkinken diğer cihazlara yapılan push'ları bilerek bastırabilir.

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Aracılar arası Matrix trafiğini bilerek istiyorsanız `allowBots` kullanın:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true`, izin verilen odalarda ve DM'lerde yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder.
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyindeki ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" şeklinde değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken sıkı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden resim olayları `thumbnail_file` kullanır; böylece resim önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar yine düz `thumbnail_url` kullanır. Yapılandırma gerekmez — plugin E2EE durumunu otomatik olarak algılar.

Şifrelemeyi etkinleştirin:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Doğrulama durumunu kontrol edin:

```bash
openclaw matrix verify status
```

Ayrıntılı durum (tam tanılama):

```bash
openclaw matrix verify status --verbose
```

Makine tarafından okunabilir çıktıya saklanan kurtarma anahtarını ekleyin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-signing ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanılaması:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap etmeden önce yeni bir cross-signing kimliği sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir kurtarma anahtarı ile doğrulayın:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ayrıntılı cihaz doğrulama bilgileri:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedekleme sağlığını kontrol edin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedekleme sağlığı tanılaması:

```bash
openclaw matrix verify backup status --verbose
```

Sunucu yedeğinden oda anahtarlarını geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedekleme temel çizgisi oluşturun. Saklanan
yedek anahtarı temiz biçimde yüklenemiyorsa, bu sıfırlama gizli depolamayı da yeniden oluşturabilir; böylece
gelecekteki soğuk başlangıçlar yeni yedek anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa çıktılıdır (sessiz dahili SDK günlüğü dahil) ve ayrıntılı tanılamayı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda, Matrix CLI komutları siz `--account <id>` geçmediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi halde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Doğrulanmış" ne demektir

OpenClaw bu Matrix cihazını yalnızca kendi cross-signing kimliğiniz tarafından doğrulandığında doğrulanmış kabul eder.
Pratikte `openclaw matrix verify status --verbose` üç güven sinyali gösterir:

- `Locally trusted`: bu cihaz yalnızca geçerli istemci tarafından güvenilir kabul edilir
- `Cross-signing verified`: SDK cihazı cross-signing aracılığıyla doğrulanmış olarak bildirir
- `Signed by owner`: cihaz kendi self-signing anahtarınız tarafından imzalanmıştır

`Verified by owner`, yalnızca cross-signing doğrulaması veya sahip imzası mevcut olduğunda `yes` olur.
Yerel güven tek başına OpenClaw'ın cihazı tam doğrulanmış olarak değerlendirmesi için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifrelenmiş Matrix hesapları için onarım ve kurulum komutudur.
Sırasıyla şunların tümünü yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı bootstrap eder
- cross-signing'i bootstrap eder ve eksik genel cross-signing anahtarlarını yükler
- geçerli cihazı işaretlemeyi ve cross-signing ile imzalamayı dener
- zaten mevcut değilse yeni bir sunucu tarafı oda anahtarı yedeği oluşturur

Homeserver, cross-signing anahtarlarını yüklemek için etkileşimli kimlik doğrulama gerektiriyorsa OpenClaw önce yüklemeyi kimlik doğrulama olmadan, sonra `m.login.dummy` ile, ardından `channels.matrix.password` yapılandırılmışsa `m.login.password` ile dener.

Geçerli cross-signing kimliğini atmak ve yeni bir tane oluşturmak istiyorsanız `--force-reset-cross-signing` seçeneğini yalnızca bilinçli olarak kullanın.

Geçerli oda anahtarı yedeğini bilinçli olarak atmak ve gelecekteki mesajlar için yeni
bir yedekleme temel çizgisi başlatmak istiyorsanız `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez kalacağını ve OpenClaw'ın geçerli yedek
gizlisi güvenle yüklenemiyorsa gizli depolamayı yeniden oluşturabileceğini kabul ediyorsanız yapın.

### Yeni yedekleme temel çizgisi

Gelecekteki şifreli mesajların çalışmasını sürdürmek ve kurtarılamayan eski geçmişi kaybetmeyi kabul etmek istiyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istiyorsanız her komuta `--account <id>` ekleyin.

### Başlangıç davranışı

`encryption: true` olduğunda Matrix varsayılan olarak `startupVerification` değerini `"if-unverified"` yapar.
Başlangıçta bu cihaz hâlâ doğrulanmamışsa Matrix başka bir Matrix istemcisinde kendi kendini doğrulama isteğinde bulunur,
zaten bekleyen bir istek varken yinelenen istekleri atlar ve yeniden başlatmalardan sonra tekrar denemeden önce yerel bir bekleme süresi uygular.
Başarısız istek denemeleri varsayılan olarak başarılı istek oluşturmalardan daha erken yeniden denenir.
Otomatik başlangıç isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlangıç ayrıca otomatik olarak ihtiyatlı bir kripto bootstrap geçişi de gerçekleştirir.
Bu geçiş önce mevcut gizli depolamayı ve cross-signing kimliğini yeniden kullanmayı dener ve siz açık bir bootstrap onarım akışı çalıştırmadığınız sürece cross-signing'i sıfırlamaktan kaçınır.

Başlangıç hâlâ bozuk bootstrap durumu bulursa, OpenClaw `channels.matrix.password` yapılandırılmamış olsa bile korumalı bir onarım yolu deneyebilir.
Homeserver bu onarım için parola tabanlı UIA gerektiriyorsa OpenClaw bir uyarı kaydeder ve botu durdurmak yerine başlangıcı ölümcül olmayan durumda tutar.
Geçerli cihaz zaten sahip tarafından imzalanmışsa, OpenClaw bu kimliği otomatik olarak sıfırlamak yerine korur.

Tam yükseltme akışı, sınırlar, kurtarma komutları ve yaygın geçiş iletileri için [Matrix geçişi](/tr/install/migrating-matrix) bölümüne bakın.

### Doğrulama bildirimleri

Matrix, doğrulama yaşam döngüsü bildirimlerini doğrudan sıkı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri ("Emoji ile doğrulayın" yönlendirmesi açıkça dahil)
- doğrulama başlangıcı ve tamamlanma bildirimleri
- mevcut olduğunda SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik kabul edilir.
Kendi kendini doğrulama akışlarında OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama isteklerinde OpenClaw isteği otomatik kabul eder ve ardından SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS'ı karşılaştırmanız ve orada "Eşleşiyorlar" onayı vermeniz gerekir.

OpenClaw kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Başlangıç, kendi kendini doğrulama isteği zaten bekliyorsa yeni bir istek oluşturmayı atlar.

Doğrulama protokolü/sistem bildirimleri aracı sohbet hattına iletilmez, bu yüzden `NO_REPLY` üretmezler.

### Cihaz hijyeni

Eski OpenClaw yönetimli Matrix cihazları hesapta birikebilir ve şifreli oda güvenini anlamayı zorlaştırabilir.
Bunları şu komutla listeleyin:

```bash
openclaw matrix devices list
```

Eski OpenClaw yönetimli cihazları şu komutla kaldırın:

```bash
openclaw matrix devices prune-stale
```

### Kripto deposu

Matrix E2EE, Node içinde resmi `matrix-js-sdk` Rust kripto yolunu kullanır; IndexedDB shim'i olarak da `fake-indexeddb` kullanılır. Kripto durumu bir anlık görüntü dosyasına (`crypto-idb-snapshot.json`) kalıcı olarak yazılır ve başlangıçta geri yüklenir. Anlık görüntü dosyası, kısıtlayıcı dosya izinleriyle saklanan hassas çalışma zamanı durumudur.

Şifrelenmiş çalışma zamanı durumu, hesap başına, kullanıcı başına token-hash kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` içinde yaşar.
Bu dizin eşzamanlama deposunu (`bot-storage.json`), kripto deposunu (`crypto/`),
kurtarma anahtarı dosyasını (`recovery-key.json`), IndexedDB anlık görüntüsünü (`crypto-idb-snapshot.json`),
iş parçacığı bağlamalarını (`thread-bindings.json`) ve başlangıç doğrulama durumunu (`startup-verification.json`) içerir.
Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw o hesap/homeserver/kullanıcı üçlüsü için en iyi mevcut
kökü yeniden kullanır; böylece önceki eşzamanlama durumu, kripto durumu, iş parçacığı bağlamaları
ve başlangıç doğrulama durumu görünür kalır.

## Profil yönetimi

Seçilen hesap için Matrix öz profilini şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. Bir `http://` veya `https://` avatar URL'si verdiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçilen hesap geçersiz kılmasına) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderici kapsamlı tutar; böylece birden fazla DM odası aynı eş düzeyine çözülüyorsa tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulama ve izin listesi denetimlerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına yalıtır.
- Açık Matrix konuşma bağlamaları yine de `dm.sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda bırakır.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyen mesaja köklenen bir iş parçacığında tutar ve o konuşmayı ilk tetikleyen mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, üst düzey ayarı yalnızca DM'ler için geçersiz kılar. Örneğin, DM'leri düz tutarken oda iş parçacıklarını yalıtılmış tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, iş parçacığı kök mesajını ek aracı bağlamı olarak içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` verilmedikçe, hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda geçerli Matrix iş parçacığını otomatik olarak devralır.
- Aynı oturumlu DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eş düzeyini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, iş parçacığı bağlamaları etkinken ve `dm.sessionScope` ipucuyla birlikte o odada `/focus` kaçış kapısını içeren bir defalık `m.notice` gönderir.
- Matrix için çalışma zamanı iş parçacığı bağlamaları desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve onu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine geçerli iş parçacığını bağlar.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, bu geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here`, alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'ın alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` içinden devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı spawn bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` ile denetlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, yalnızca belirtilen emoji tepkisini bot hesabından kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji yedeği

Ack tepki kapsamı şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tepki bildirim modu şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- varsayılan: `own`

Davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları, Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil redaksiyonlar olarak sunduğu için sistem olaylarına sentezlenmez.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı aracıyı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısını kontrol eder. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca beklemede olanları içerir: OpenClaw henüz yanıtı tetiklememiş oda mesajlarını tamponlar, ardından bir bahsetme veya başka bir tetikleyici geldiğinde o pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o dönüş için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimleri tarafından izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de tek bir açık alıntı yanıtı tutar.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen iletinin kendisinin yanıtı tetikleyip tetikleyemeyeceğini değil.
Tetikleme yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

## DM ve oda ilkesi

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Bahsetme geçidi ve izin listesi davranışı için [Groups](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra tekrar bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşzaman dışı kalırsa, OpenClaw canlı DM yerine eski tekli odaları işaret eden bayat `m.direct` eşlemeleriyle karşılaşabilir. Bir eş düzeyi için geçerli eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- `m.direct` içinde zaten eşlenmiş katı 1:1 bir DM'yi tercih eder
- aynı kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct`'i yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri döner)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarlı değilse veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa yerel onayları otomatik olarak etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri dönebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya onay yedek ilkesine geri döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal fanout modunu kontrol eder.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içinden gelen exec onaylayıcı kümesini kullanır.
- Plugin onayları, Matrix DM izin listesini `channels.matrix.dm.allowFrom` içinden kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de plugin onaylarına uygulanır.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, onaylayıcı DM'lerine ve kaynak Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajı üzerine tepki kısayolları yerleştirir:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar o mesaja tepki verebilir veya yedek slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec onayları](/tr/tools/exec-approvals)

## Slash komutları

Matrix slash komutları (örneğin `/new`, `/reset`, `/model`) DM'lerde doğrudan çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenen slash komutlarını da tanır; bu nedenle `@bot:server /new`, özel bir mention regex'i gerektirmeden komut yolunu tetikler. Bu, bir kullanıcı komutu yazmadan önce sekme tamamlama ile botu eklediğinde Element ve benzeri istemcilerin gönderdiği oda tarzı `@mention /command` iletilerine botun yanıt vermeye devam etmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz mesajlarda olduğu gibi DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

## Çok hesaplı

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan olarak davranır.
Devralınan oda girdilerini tek bir Matrix hesabına `groups.<room>.account` ile kapsamlayabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` içeren girdiler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında da çalışmaya devam eder.
Kısmi paylaşımlı kimlik doğrulama varsayılanları kendi başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw yalnızca üst düzey `default` hesabını, bu varsayılan yeni kimlik doğrulamaya sahip olduğunda (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar daha sonra önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` artı `userId` üzerinden yine keşfedilebilir kalabilir.
Matrix'in zaten tam olarak bir adlandırılmış hesabı varsa veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaptan çok hesaba onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşımlı teslim ilkesi anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, yoklama ve CLI işlemleri için adlandırılmış Matrix hesaplarından birini tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden fazla Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlı olmasa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` geçin.
Bu örtük seçimi tek bir komut için geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesaplı desen için [Yapılandırma başvurusu](/tr/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, siz hesap başına açıkça izin vermediğiniz sürece SSRF koruması için özel/dahili Matrix homeserver'larını engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana makine adı üzerinde çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` seçeneğini etkinleştirin:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI kurulum örneği:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Bu isteğe bağlı izin yalnızca güvenilen özel/dahili hedeflere izin verir. Şu tür herkese açık düz metin homeserver'lar
`http://matrix.example.org:8008` engellenmiş kalır. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirmek

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa `channels.matrix.proxy` ayarlayın:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Adlandırılmış hesaplar, üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durumu yoklamaları için kullanır.

## Hedef çözümleme

OpenClaw sizden bir oda veya kullanıcı hedefi istediği her yerde Matrix şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açılmış Matrix hesabını kullanır:

- Kullanıcı aramaları o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esaslıdır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana makineye çözülüyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: token tabanlı kimlik doğrulama için access token. `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için env/file/exec sağlayıcıları genelinde düz metin değerleri ve SecretRef değerleri desteklenir. Bkz. [Gizli Yönetimi](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma için cihaz görünen adı.
- `avatarUrl`: profil eşzamanlama ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşzamanlaması sırasında getirilen en fazla olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist` seviyesine yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` seviyesine zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `historyLimit`: grup geçmişi bağlamı olarak dahil edilecek en fazla oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajları ile önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim vermeyen önizleme bildirimleri kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanmış asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik kendi kendini doğrulama isteği modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önceki bekleme süresi.
- `textChunkLimit`: giden mesaj parça boyutu, karakter cinsinden (`chunkMode` değeri `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara başına eklenecek isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davetle otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir.
- `autoJoinAllowlist`: `autoJoin` değeri `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın bildirdiği takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katılıp odayı DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik olarak katılınıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Aynı eş düzeyi olsa bile her Matrix DM odasının ayrı bağlam tutmasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için iş parçacığı ilkesi geçersiz kılması (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix'e özgü yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan olarak davranır.
- `groups`: oda başına ilke haritası. Oda kimliklerini veya takma adları tercih edin; çözümlenmeyen oda adları çalışma zamanında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan tek bir oda girdisini belirli bir Matrix hesabıyla sınırlandırır.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici izin listesi.
- `groups.<room>.tools`: oda başına araç izin/verme veya engelleme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde bahsetme geçidi geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorlar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde sistem istemi parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçidi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
