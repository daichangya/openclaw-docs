---
read_when:
    - OpenClaw içinde Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix desteği durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-15T08:53:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 631f6fdcfebc23136c1a66b04851a25c047535d13cceba5650b8b421bc3afcf8
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketlenmiş bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş Plugin

Matrix, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Matrix'i dışlayan daha eski bir derlemeyi veya özel bir kurulumu kullanıyorsanız, onu
elle yükleyin:

npm'den yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan yükleyin:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve yükleme kuralları için [Plugins](/tr/tools/plugin) sayfasına bakın.

## Kurulum

1. Matrix Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
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

Matrix sihirbazı şunları ister:

- homeserver URL'si
- kimlik doğrulama yöntemi: access token veya parola
- kullanıcı kimliği (yalnızca parola kimlik doğrulaması)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davet otomatik katılımının yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve bu hesap için yapılandırmada henüz kimlik doğrulama kaydedilmemişse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist girdileri doğrudan `@user:server` kabul eder; görünen adlar yalnızca canlı dizin araması tek bir kesin eşleşme bulduğunda çalışır.
- Oda allowlist girdileri doğrudan oda kimliklerini ve takma adları kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenemeyen adlar allowlist çözümlemesi sırasında çalışma zamanında yok sayılır.
- Davet otomatik katılım allowlist modunda yalnızca kararlı davet hedefleri kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir.

Bunu ayarlamazsanız, bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle önce elle katılmadığınız sürece yeni gruplarda veya davet edilen DM'lerde görünmez.

Kabul ettiği davetleri sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

`allowlist` modunda `autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder.
</Warning>

Allowlist örneği:

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

En az düzeyde token tabanlı kurulum:

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

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` içinde saklar.
Varsayılan hesap `credentials.json` kullanır; adlandırılmış hesaplar `credentials-<account>.json` kullanır.
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, geçerli kimlik doğrulama doğrudan yapılandırmada ayarlanmamış olsa bile OpenClaw, kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış kabul eder.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlanmadığında kullanılır):

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

Normalize edilmiş `ops-bot` hesap kimliği için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini, hesap kapsamlı ortam değişkenlerinin çakışmasız kalmasını sağlamak için kaçışlar.
Örneğin, `-`, `_X2D_` olur; bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz, ortam değişkeni kısayolunu yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesap için yapılandırmada zaten Matrix kimlik doğrulaması kaydedilmemişse sunar.

## Yapılandırma örneği

Bu, DM pairing, oda allowlist ve etkin E2EE ile pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw,
davet edilen bir odayı davet anında güvenilir biçimde DM veya grup olarak sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin`
üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir canlı önizleme
yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve ardından
yanıt tamamlandığında bunu sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılan değerdir. OpenClaw son yanıtı bekler ve bir kez gönderir.
- `streaming: "partial"`, mevcut asistan bloğu için normal Matrix metin mesajları kullanarak düzenlenebilir bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; bu nedenle standart istemciler bitmiş blok yerine ilk akış önizleme metninde bildirim gönderebilir.
- `streaming: "quiet"`, mevcut asistan bloğu için düzenlenebilir sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca sonlandırılmış önizleme düzenlemeleri için alıcı push kuralları da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda Matrix, mevcut blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken ve `blockStreaming` kapalıyken Matrix, canlı taslağı yerinde düzenler ve blok veya dönüş bittiğinde aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri normal şekilde göndermeye devam eder. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw, son medya yanıtını göndermeden önce bunu redact eder.
- Önizleme düzenlemeleri ek Matrix API çağrıları gerektirir. En tutucu hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming` tek başına taslak önizlemelerini etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` seçeneğini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal, bildirim gönderen bir Matrix mesajı olarak yollar.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal, bildirim gönderen bir Matrix mesajı olarak yollar.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Kendi Matrix altyapınızı çalıştırıyorsanız ve sessiz önizlemelerin yalnızca bir blok veya
son yanıt tamamlandığında bildirim göndermesini istiyorsanız, `streaming: "quiet"` ayarlayın ve sonlandırılmış önizleme düzenlemeleri için kullanıcı başına bir push kuralı ekleyin.

Bu genellikle homeserver genelinde bir yapılandırma değişikliği değil, alıcı kullanıcı kurulumu olur:

Başlamadan önce hızlı eşleme:

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının access token'ını kullanın
- push kuralındaki `sender` değerini bot kullanıcının tam MXID'siyle eşleştirin

1. OpenClaw'ı sessiz önizlemeleri kullanacak şekilde yapılandırın:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Alıcı hesabın zaten normal Matrix push bildirimleri aldığından emin olun. Sessiz önizleme
   kuralları yalnızca bu kullanıcı zaten çalışan pusher'lara/cihazlara sahipse çalışır.

3. Alıcı kullanıcının access token'ını alın.
   - Bot'un token'ını değil, alıcı kullanıcının token'ını kullanın.
   - Mevcut bir istemci oturumu token'ını yeniden kullanmak genellikle en kolay yoldur.
   - Yeni bir token üretmeniz gerekiyorsa, standart Matrix Client-Server API üzerinden giriş yapabilirsiniz:

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

4. Alıcı hesabın zaten pusher'lara sahip olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Bu çağrı etkin pusher/dönüş cihazı döndürmüyorsa, aşağıdaki
OpenClaw kuralını eklemeden önce önce normal Matrix bildirimlerini düzeltin.

OpenClaw, sonlandırılmış yalnızca metin içeren önizleme düzenlemelerini şu şekilde işaretler:

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
- `openclaw-finalized-preview-botname`: bu bot için bu alıcı kullanıcıya özgü bir kural kimliği
- `@bot:example.org`: alıcı kullanıcının MXID'si değil, OpenClaw Matrix bot MXID'niz

Çoklu bot kurulumları için önemli:

- Push kuralları `ruleId` ile anahtarlanır. Aynı kural kimliğine karşı `PUT` işlemini yeniden çalıştırmak, o tek kuralı günceller.
- Bir alıcı kullanıcı birden fazla OpenClaw Matrix bot hesabı için bildirim alacaksa, her `sender` eşleşmesi için benzersiz bir kural kimliğiyle bot başına bir kural oluşturun.
- Basit bir desen `openclaw-finalized-preview-<botname>` şeklindedir; örneğin `openclaw-finalized-preview-ops` veya `openclaw-finalized-preview-support`.

Kural, olayın göndericisine göre değerlendirilir:

- alıcı kullanıcının token'ı ile kimlik doğrulaması yapın
- `sender` değerini OpenClaw bot MXID'siyle eşleştirin

6. Kuralın mevcut olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Akışlı bir yanıtı test edin. Sessiz modda, oda sessiz bir taslak önizleme göstermeli ve son
   yerinde düzenleme blok veya dönüş tamamlandığında bir kez bildirim göndermelidir.

Kuralı daha sonra kaldırmanız gerekirse, aynı kural kimliğini alıcı kullanıcının token'ı ile silin:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notlar:

- Kuralı botun token'ı ile değil, alıcı kullanıcının access token'ı ile oluşturun.
- Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir, bu nedenle ek bir sıralama parametresi gerekmez.
- Bu yalnızca OpenClaw'ın güvenli şekilde yerinde sonlandırabildiği yalnızca metin içeren önizleme düzenlemelerini etkiler. Medya fallback'leri ve eski önizleme fallback'leri yine normal Matrix teslimatını kullanır.
- `GET /_matrix/client/v3/pushers` hiçbir pusher göstermiyorsa, kullanıcı bu hesap/cihaz için henüz çalışan Matrix push teslimatına sahip değildir.

#### Synapse

Synapse için, yukarıdaki kurulum genellikle tek başına yeterlidir:

- Sonlandırılmış OpenClaw önizleme bildirimleri için özel bir `homeserver.yaml` değişikliği gerekmez.
- Synapse dağıtımınız zaten normal Matrix push bildirimleri gönderiyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Synapse'i bir reverse proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun.
- Synapse worker'ları kullanıyorsanız, pusher'ların sağlıklı olduğundan emin olun. Push teslimatı ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir.

#### Tuwunel

Tuwunel için, yukarıda gösterilen aynı kurulum akışını ve push-rule API çağrısını kullanın:

- Sonlandırılmış önizleme işaretleyicisinin kendisi için Tuwunel'e özgü bir yapılandırma gerekmez.
- O kullanıcı için normal Matrix bildirimleri zaten çalışıyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Kullanıcı başka bir cihazda etkinken bildirimler kayboluyor gibi görünüyorsa, `suppress_push_when_active` seçeneğinin etkin olup olmadığını kontrol edin. Tuwunel bu seçeneği 12 Eylül 2025'te Tuwunel 1.4.2 sürümünde ekledi ve bir cihaz etkinken diğer cihazlara gönderilen push'ları kasıtlı olarak bastırabilir.

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak agent'lar arası Matrix trafiği istiyorsanız `allowBots` kullanın:

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
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot işareti sunmaz; OpenClaw, "bot-authored" kavramını "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken sıkı oda allowlist'leri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ek ile birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez — Plugin, E2EE durumunu otomatik olarak algılar.

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

Ayrıntılı durum (tam tanı):

```bash
openclaw matrix verify status --verbose
```

Makine tarafından okunabilir çıktıya saklanan recovery key'i ekleyin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-signing ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanısı:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap öncesinde yeni bir cross-signing kimliği sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir recovery key ile doğrulayın:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ayrıntılı cihaz doğrulama ayrıntıları:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedeği sağlığını kontrol edin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedek sağlığı tanısı:

```bash
openclaw matrix verify backup status --verbose
```

Sunucu yedeğinden oda anahtarlarını geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Ayrıntılı geri yükleme tanısı:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedek temel çizgisi oluşturun. Saklanan
yedek anahtarı temiz biçimde yüklenemiyorsa, bu sıfırlama secret storage'ı da yeniden oluşturabilir; böylece
gelecekteki soğuk başlangıçlar yeni yedek anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa çıktı verir (sessiz dahili SDK günlükleri dahil) ve ayrıntılı tanıyı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda Matrix CLI komutları, `--account <id>` geçmezseniz örtük Matrix varsayılan hesabını kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, önce `channels.matrix.defaultAccount` ayarlayın; aksi halde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Adlandırılmış bir hesap için şifreleme devre dışıysa veya kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Doğrulandı" ne anlama gelir

OpenClaw, bu Matrix cihazını yalnızca kendi cross-signing kimliğiniz tarafından doğrulandığında doğrulanmış olarak kabul eder.
Pratikte `openclaw matrix verify status --verbose`, üç güven sinyali gösterir:

- `Locally trusted`: bu cihaza yalnızca mevcut istemci güvenir
- `Cross-signing verified`: SDK, cihazın cross-signing yoluyla doğrulandığını bildirir
- `Signed by owner`: cihaz, kendi self-signing anahtarınız tarafından imzalanmıştır

`Verified by owner`, yalnızca cross-signing doğrulaması veya owner-signing mevcut olduğunda `yes` olur.
Yalnızca yerel güven, OpenClaw'ın cihazı tam doğrulanmış kabul etmesi için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifreli Matrix hesapları için onarım ve kurulum komutudur.
Sırayla aşağıdakilerin tümünü yapar:

- mümkün olduğunda mevcut recovery key'i yeniden kullanarak secret storage'ı bootstrap eder
- cross-signing'i bootstrap eder ve eksik genel cross-signing anahtarlarını yükler
- mevcut cihazı işaretlemeyi ve cross-sign etmeyi dener
- henüz yoksa sunucu tarafında yeni bir oda anahtarı yedeği oluşturur

Homeserver, cross-signing anahtarlarını yüklemek için etkileşimli kimlik doğrulama gerektiriyorsa OpenClaw önce kimlik doğrulama olmadan, ardından `m.login.dummy` ile, `channels.matrix.password` yapılandırılmışsa da `m.login.password` ile yüklemeyi dener.

`--force-reset-cross-signing` seçeneğini yalnızca mevcut cross-signing kimliğini bilerek atmak ve yenisini oluşturmak istediğinizde kullanın.

Mevcut oda anahtarı yedeğini bilerek atmak ve gelecekteki mesajlar için yeni
bir yedek temel çizgisi başlatmak istiyorsanız, `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez kalacağını ve OpenClaw'ın mevcut yedek
gizlisi güvenle yüklenemiyorsa secret storage'ı yeniden oluşturabileceğini kabul ediyorsanız yapın.

### Yeni yedek temel çizgisi

Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Adlandırılmış bir Matrix hesabını açıkça hedeflemek istediğinizde her komuta `--account <id>` ekleyin.

### Başlangıç davranışı

`encryption: true` olduğunda Matrix varsayılan olarak `startupVerification` değerini `"if-unverified"` yapar.
Başlangıçta bu cihaz hâlâ doğrulanmamışsa Matrix, başka bir Matrix istemcisinde self-verification ister,
biri zaten beklemedeyken yinelenen istekleri atlar ve yeniden başlatmalardan sonra yeniden denemeden önce yerel bir bekleme süresi uygular.
Başarısız istek denemeleri varsayılan olarak başarılı istek oluşturmaya göre daha erken yeniden denenir.
Otomatik başlangıç isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlangıç ayrıca otomatik olarak tutucu bir kripto bootstrap geçişi de yapar.
Bu geçiş önce mevcut secret storage ve cross-signing kimliğini yeniden kullanmayı dener ve açık bir bootstrap onarım akışı çalıştırmadığınız sürece cross-signing'i sıfırlamaktan kaçınır.

Başlangıç bozuk bootstrap durumu bulursa ve `channels.matrix.password` yapılandırılmışsa, OpenClaw daha sıkı bir onarım yolu deneyebilir.
Mevcut cihaz zaten owner-signed ise, OpenClaw bu kimliği otomatik olarak sıfırlamak yerine korur.

Tam yükseltme akışı, sınırlar, kurtarma komutları ve yaygın geçiş mesajları için [Matrix migration](/tr/install/migrating-matrix) sayfasına bakın.

### Doğrulama bildirimleri

Matrix, doğrulama yaşam döngüsü bildirimlerini doğrudan katı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri (açık "Emoji ile doğrula" yönlendirmesiyle)
- doğrulama başlangıç ve tamamlanma bildirimleri
- varsa SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik olarak kabul edilir.
Self-verification akışları için OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik olarak başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama istekleri için OpenClaw isteği otomatik olarak kabul eder ve ardından SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS'ı karşılaştırmanız ve orada "Eşleşiyorlar"ı onaylamanız gerekir.

OpenClaw, kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Bir self-verification isteği zaten beklemedeyse başlangıç yeni bir istek oluşturmayı atlar.

Doğrulama protokolü/sistem bildirimleri agent sohbet ardışık düzenine iletilmez; bu nedenle `NO_REPLY` üretmezler.

### Cihaz hijyeni

Eski OpenClaw tarafından yönetilen Matrix cihazları hesapta birikebilir ve şifreli oda güveninin anlaşılmasını zorlaştırabilir.
Bunları şu komutla listeleyin:

```bash
openclaw matrix devices list
```

Eski OpenClaw tarafından yönetilen cihazları şu komutla kaldırın:

```bash
openclaw matrix devices prune-stale
```

### Kripto deposu

Matrix E2EE, Node içinde resmi `matrix-js-sdk` Rust kripto yolunu kullanır; IndexedDB shim'i olarak `fake-indexeddb` kullanılır. Kripto durumu bir anlık görüntü dosyasına (`crypto-idb-snapshot.json`) kalıcı olarak yazılır ve başlangıçta geri yüklenir. Anlık görüntü dosyası, kısıtlayıcı dosya izinleriyle saklanan hassas çalışma zamanı durumudur.

Şifrelenmiş çalışma zamanı durumu, hesap başına ve kullanıcı token-hash kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
dizininde bulunur.
Bu dizin sync deposunu (`bot-storage.json`), kripto deposunu (`crypto/`),
recovery key dosyasını (`recovery-key.json`), IndexedDB anlık görüntüsünü (`crypto-idb-snapshot.json`),
iş parçacığı bağlarını (`thread-bindings.json`) ve başlangıç doğrulama durumunu (`startup-verification.json`) içerir.
Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw o hesap/homeserver/kullanıcı üçlüsü için
mevcut en iyi kökü yeniden kullanır; böylece önceki sync durumu, kripto durumu, iş parçacığı bağları
ve başlangıç doğrulama durumu görünür kalır.

## Profil yönetimi

Seçilen hesap için Matrix self-profile'ını şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçilen hesap geçersiz kılmasına) yazar.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderici kapsamlı tutar; böylece aynı eşe çözümlendiklerinde birden fazla DM odası tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulama ve allowlist kontrollerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına izole eder.
- Açık Matrix konuşma bağları yine de `dm.sessionScope` ayarına üstün gelir; bu nedenle bağlanmış odalar ve iş parçacıkları seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda tutar.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici mesaja köklenen bir iş parçacığında tutar ve o konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki iş parçacıklarını izole ederken DM'leri düz tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, iş parçacığının kök mesajını ek agent bağlamı olarak içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` verilmediği sürece hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda mevcut Matrix iş parçacığını otomatik olarak devralır.
- Aynı oturumlu DM kullanıcı hedefi yeniden kullanımı yalnızca mevcut oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi durumda OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumundaki başka bir DM odasıyla çakıştığını gördüğünde, iş parçacığı bağları etkinse ve `dm.sessionScope` ipucu varsa o odaya `/focus` kaçış kapağıyla tek seferlik bir `m.notice` gönderir.
- Çalışma zamanı iş parçacığı bağları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve onu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine o mevcut iş parçacığını bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, o mevcut iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here` alt bir Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'ın alt bir Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` içinden devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` ile denetlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için mevcut tepki özetini listeler.
- `emoji=""`, bot hesabının o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, yalnızca bot hesabındaki belirtilen emoji tepkisini kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent kimliği emoji fallback'i

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
- Tepki kaldırmaları sistem olaylarına dönüştürülmez; çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaction olarak gösterir.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı agent'ı tetiklediğinde kaç son oda mesajının `InboundHistory` olarak dahil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine fallback yapar; ikisi de ayarlanmazsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen mesajlardan oluşur: OpenClaw henüz yanıt tetiklememiş oda mesajlarını tamponlar, sonra bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Mevcut tetikleyici mesaj `InboundHistory` içine dahil edilmez; o dönüş için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist kontrolleri tarafından izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de tek bir açık alıntı yanıtı korur.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen iletinin kendisinin bir yanıtı tetikleyip tetikleyemeyeceğini etkilemez.
Tetikleyici yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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

Mention geçitleme ve allowlist davranışı için [Groups](/tr/channels/groups) sayfasına bakın.

Matrix DM'leri için pairing örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen pairing kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM pairing akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) sayfasına bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışına çıkarsa, OpenClaw canlı DM yerine eski tekli odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için mevcut eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş olan katı 1:1 DM'yi tercih eder
- bu kullanıcıyla mevcutta katılınmış herhangi bir katı 1:1 DM'ye fallback yapar
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` eşlemesini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine fallback yapar)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayanlar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir onaylayan çözümlenebiliyorsa Matrix yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine fallback yapabilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya onay fallback ilkesine geri düşer.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal fanout modunu kontrol eder.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içinden gelen exec onaylayan kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM allowlist'ini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de Plugin onayları için geçerlidir.

Teslimat kuralları:

- `target: "dm"`, onay istemlerini onaylayan DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix oda veya DM'ye geri gönderir
- `target: "both"`, onaylayan DM'lerine ve kaynak Matrix oda veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajında tepki kısayollarını başlatır:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayanlar bu mesaja tepki verebilir veya fallback slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayanlar onay verebilir veya reddedebilir. Exec onaylarında kanal teslimatı komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan görevi görür.
Devralınan oda girdilerini bir Matrix hesabına `groups.<room>.account` ile kapsamlandırabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşılmış kalır ve `account: "default"` içeren girdiler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında yine çalışır.
Kısmi paylaşılan kimlik doğrulama varsayılanları kendi başlarına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw üst düzey `default` hesabını yalnızca o varsayılan hesapta yeni kimlik doğrulama varsa (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar ise önbelleğe alınmış kimlik bilgileri daha sonra kimlik doğrulamayı karşıladığında `homeserver` artı `userId` ile keşfedilebilir kalabilir.
Matrix'te zaten tam olarak bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaptan çok hesaba onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşılan teslimat ilkesi anahtarları üst düzeyde kalır.
Örtük yönlendirme, probing ve CLI işlemleri için OpenClaw'ın adlandırılmış Matrix hesaplarından birini tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden fazla Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlanmamış olsa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` geçin.
Bu örtük seçimi tek bir komut için geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesaplı desen için [Configuration reference](/tr/gateway/configuration-reference#multi-account-all-channels) sayfasına bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını engeller; siz
hesap başına açıkça izin vermedikçe bağlanmaz.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir host adı üzerinde çalışıyorsa,
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

Bu açık katılım yalnızca güvenilen özel/dahili hedeflere izin verir. Aşağıdaki gibi herkese açık düz metin homeserver'lar
`http://matrix.example.org:8008` yine engellenir. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirmek

Matrix dağıtımınız açık bir giden HTTP(S) proxy gerektiriyorsa, `channels.matrix.proxy` ayarlayın:

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
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durum probing işlemleri için kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması, oturum açılmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarını aramaya fallback yapar.
- Katılınmış oda adı araması best-effort çalışır. Bir oda adı oda kimliğine veya takma ada çözümlenemiyorsa, çalışma zamanı allowlist çözümlemesi sırasında yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana makineye çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` ayarlarıyla geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: token tabanlı kimlik doğrulama için access token. Düz metin değerler ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerler ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma için cihaz görünen adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için depolanan self-avatar URL'si.
- `initialSyncLimit`: başlangıç sync sırasında getirilen en yüksek olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda, `open` oda ilkesini `allowlist` olarak yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` olmaya zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği allowlist'i. Girdiler tam Matrix kullanıcı kimlikleri olmalıdır; çözümlenmemiş adlar çalışma zamanında yok sayılır.
- `historyLimit`: grup geçmiş bağlamı olarak dahil edilecek en yüksek oda mesajı sayısı. `messages.groupChat.historyLimit` değerine fallback yapar; ikisi de ayarlanmazsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim göndermeyen önizleme bildirimlerini kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanmış asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama istekleri yeniden denenmeden önceki bekleme süresi.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode`, `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara eklenen isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davet otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir.
- `autoJoinAllowlist`: `autoJoin`, `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw, davet edilen oda tarafından bildirilen takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katılıp onu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik katılıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: girdiler, siz bunları canlı dizin aramasıyla zaten çözümlemediyseniz tam Matrix kullanıcı kimlikleri olmalıdır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam korumasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM'lere yönelik iş parçacığı ilkesi geçersiz kılması (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum izolasyonu için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix'e özgü yerel exec onayı teslimatı (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayanları tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan görevi görür.
- `groups`: oda başına ilke eşlemesi. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma zamanında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda tek bir devralınmış oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme veya reddetme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde mention geçitleme geçersiz kılması. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde system prompt parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçitleme (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve pairing akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitleme
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
