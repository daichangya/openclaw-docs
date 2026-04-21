---
read_when:
    - OpenClaw içinde Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-21T08:56:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketle birlikte gelen bir kanal plugin'idir.
Resmî `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketle gelen plugin

Matrix, güncel OpenClaw sürümlerinde paketle birlikte gelen bir plugin olarak sunulur; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Matrix'i içermeyen özel bir kurulumu kullanıyorsanız, onu manuel olarak kurun:

npm üzerinden kurun:

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
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
   - Eski/özel kurulumlar, yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
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
- kullanıcı kimliği (`password` kimlik doğrulaması için)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetlerde otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve bu hesap için yapılandırmada zaten kayıtlı kimlik doğrulama yoksa, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları, hesap kimliğine göre normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist girdileri doğrudan `@user:server` kabul eder; görünen adlar yalnızca canlı dizin araması tek bir tam eşleşme bulduğunda çalışır.
- Oda allowlist girdileri doğrudan oda kimliklerini ve takma adları kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar allowlist çözümlemesi sırasında çalışma anında yok sayılır.
- Davetlerde otomatik katılımın allowlist modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Oda adlarını kaydetmeden önce çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` için varsayılan değer `off`'tur.

Bunu ayarlamazsanız bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle önce manuel olarak katılmadığınız sürece yeni gruplarda veya davet edilen DM'lerde görünmez.

Kabul ettiği davetleri kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

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

En düşük düzeyde token tabanlı kurulum:

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

Parola tabanlı kurulum (oturum açtıktan sonra token önbelleğe alınır):

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

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` içinde depolar.
Varsayılan hesap `credentials.json` kullanır; adlandırılmış hesaplar `credentials-<account>.json` kullanır.
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, OpenClaw mevcut kimlik doğrulama doğrudan yapılandırmada ayarlı olmasa bile kurulum, doctor ve channel-status keşfi için Matrix'i yapılandırılmış kabul eder.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlı değilse kullanılır):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Varsayılan olmayan hesaplar için, hesaba kapsamlı ortam değişkenlerini kullanın:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

`ops` hesabı için örnek:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Normalize edilmiş hesap kimliği `ops-bot` için şunu kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesaba kapsamlı ortam değişkenlerinde çakışma olmamasını sağlamak için hesap kimliklerindeki noktalama işaretlerini kaçışlar.
Örneğin `-`, `_X2D_` olur; dolayısıyla `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz, ortam değişkeni kısayolunu yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesabın yapılandırmasında zaten kayıtlı Matrix kimlik doğrulaması yoksa sunar.

## Yapılandırma örneği

Bu, DM eşleştirme, oda allowlist'i ve E2EE etkin durumda olan pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw, davet anında davet edilen bir odayı güvenilir biçimde DM veya grup olarak sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin` üzerinden geçer. Bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra `dm.policy` uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'un tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve yanıt tamamlandığında bunu sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılandır. OpenClaw son yanıtı bekler ve onu bir kez gönderir.
- `streaming: "partial"`, geçerli asistan bloğu için düzenlenebilir bir önizleme mesajı oluşturur ve normal Matrix metin mesajlarını kullanır. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; dolayısıyla standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gönderebilir.
- `streaming: "quiet"`, geçerli asistan bloğu için düzenlenebilir sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca sonlandırılmış önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda Matrix, geçerli blok için canlı taslağı korur ve tamamlanmış blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıksa ve `blockStreaming` kapalıysa Matrix canlı taslağı yerinde düzenler ve blok ya da sıra bittiğinde aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları yine normal şekilde ek gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce bunu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En temkinli rate-limit davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, taslak önizlemelerini tek başına etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` ayarını kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirim gönderen bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim gönderen bir Matrix mesajı olarak gönderir.

### Kendi barındırdığınız push kuralları ile sessiz sonlandırılmış önizlemeler

Kendi Matrix altyapınızı çalıştırıyorsanız ve sessiz önizlemelerin yalnızca bir blok veya son yanıt tamamlandığında bildirim göndermesini istiyorsanız, `streaming: "quiet"` ayarlayın ve sonlandırılmış önizleme düzenlemeleri için kullanıcı başına bir push kuralı ekleyin.

Bu genellikle homeserver genelinde bir yapılandırma değişikliği değil, alıcı kullanıcı yapılandırmasıdır:

Başlamadan önce hızlı eşleme:

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının access token'ını kullanın
- push kuralındaki `sender` değerini bot kullanıcısının tam MXID'si ile eşleştirin

1. OpenClaw'u sessiz önizlemeleri kullanacak şekilde yapılandırın:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Alıcı hesabın zaten normal Matrix push bildirimleri aldığından emin olun. Sessiz önizleme kuralları yalnızca bu kullanıcının çalışan pushers/cihazları zaten varsa çalışır.

3. Alıcı kullanıcının access token'ını alın.
   - Botun token'ını değil, alıcı kullanıcının token'ını kullanın.
   - Var olan bir istemci oturum token'ını yeniden kullanmak genellikle en kolay yoldur.
   - Yeni bir token üretmeniz gerekiyorsa, standart Matrix Client-Server API üzerinden oturum açabilirsiniz:

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

4. Alıcı hesabın zaten pushers'a sahip olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Bu, etkin bir pusher/cihaz döndürmüyorsa, aşağıdaki OpenClaw kuralını eklemeden önce önce normal Matrix bildirimlerini düzeltin.

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
- `openclaw-finalized-preview-botname`: bu alıcı kullanıcı için bu bota özgü bir kural kimliği
- `@bot:example.org`: alıcı kullanıcının MXID'si değil, OpenClaw Matrix bot MXID'niz

Çok botlu kurulumlar için önemli:

- Push kuralları `ruleId` ile anahtarlanır. Aynı kural kimliğine karşı `PUT` işlemini yeniden çalıştırmak, o tek kuralı günceller.
- Bir alıcı kullanıcının birden fazla OpenClaw Matrix bot hesabı için bildirim alması gerekiyorsa, her `sender` eşleşmesi için benzersiz bir kural kimliğiyle bot başına bir kural oluşturun.
- Basit bir desen `openclaw-finalized-preview-<botname>` biçimidir; örneğin `openclaw-finalized-preview-ops` veya `openclaw-finalized-preview-support`.

Kural, olay gönderenine göre değerlendirilir:

- alıcı kullanıcının token'ı ile kimlik doğrulaması yapın
- `sender` değerini OpenClaw bot MXID'siyle eşleştirin

6. Kuralın mevcut olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme göstermeli ve son yerinde düzenleme, blok veya sıra tamamlandığında bir kez bildirim göndermelidir.

Daha sonra kuralı kaldırmanız gerekirse, aynı kural kimliğini alıcı kullanıcının token'ı ile silin:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notlar:

- Kuralı botun access token'ı ile değil, alıcı kullanıcının access token'ı ile oluşturun.
- Yeni kullanıcı tanımlı `override` kuralları, varsayılan bastırma kurallarının önüne eklenir; bu nedenle ek bir sıralama parametresi gerekmez.
- Bu yalnızca OpenClaw'un güvenle yerinde sonlandırabildiği yalnızca metin içeren önizleme düzenlemelerini etkiler. Medya fallback'leri ve eski önizleme fallback'leri yine normal Matrix teslimatını kullanır.
- `GET /_matrix/client/v3/pushers` hiçbir pusher göstermiyorsa, kullanıcının bu hesap/cihaz için henüz çalışan Matrix push teslimatı yoktur.

#### Synapse

Synapse için yukarıdaki kurulum genellikle tek başına yeterlidir:

- Sonlandırılmış OpenClaw önizleme bildirimleri için özel bir `homeserver.yaml` değişikliği gerekmez.
- Synapse dağıtımınız zaten normal Matrix push bildirimleri gönderiyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Synapse'i bir reverse proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun.
- Synapse worker'ları kullanıyorsanız, pusher'ların sağlıklı olduğundan emin olun. Push teslimatı ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir.

#### Tuwunel

Tuwunel için yukarıda gösterilen aynı kurulum akışını ve push-rule API çağrısını kullanın:

- Sonlandırılmış önizleme işaretleyicisinin kendisi için Tuwunel'e özgü bir yapılandırma gerekmez.
- O kullanıcı için normal Matrix bildirimleri zaten çalışıyorsa, kullanıcı token'ı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Kullanıcı başka bir cihazda etkin durumdayken bildirimler kayboluyor gibi görünüyorsa, `suppress_push_when_active` etkin mi kontrol edin. Tuwunel bu seçeneği 12 Eylül 2025'te Tuwunel 1.4.2 sürümünde ekledi ve bir cihaz etkin durumdayken diğer cihazlara yapılan push'ları kasıtlı olarak bastırabilir.

## Bottan-bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak ajanlar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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
- `groups.<room>.allowBots`, bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda bottan-bota trafiği etkinleştirirken katı oda allowlist'leri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ek ile birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez — plugin E2EE durumunu otomatik olarak algılar.

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

Saklanan recovery key'i makine tarafından okunabilir çıktıya dahil edin:

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

Bootstrap işleminden önce yeni bir cross-signing kimlik sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir recovery key ile doğrulayın:

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

Oda anahtarlarını sunucu yedeğinden geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedekleme temeli oluşturun. Saklanan
yedekleme anahtarı temiz biçimde yüklenemiyorsa, bu sıfırlama secret storage'ı da yeniden oluşturabilir; böylece
gelecekteki cold start'lar yeni yedekleme anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa çıktı verir (sessiz iç SDK günlükleri dahil) ve ayrıntılı tanılamayı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda, `--account <id>` belirtmediğiniz sürece Matrix CLI komutları örtük Matrix varsayılan hesabını kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi hâlde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarına işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Verified" ne anlama gelir

OpenClaw bu Matrix cihazını yalnızca kendi cross-signing kimliğiniz tarafından doğrulandığında doğrulanmış kabul eder.
Uygulamada `openclaw matrix verify status --verbose`, üç güven sinyali gösterir:

- `Locally trusted`: bu cihaza yalnızca geçerli istemci güveniyor
- `Cross-signing verified`: SDK, cihazın cross-signing üzerinden doğrulandığını bildiriyor
- `Signed by owner`: cihaz, sizin self-signing anahtarınız tarafından imzalanmış

`Verified by owner`, yalnızca cross-signing doğrulaması veya owner-signing mevcut olduğunda `yes` olur.
Yalnızca yerel güven, OpenClaw'un cihazı tamamen doğrulanmış kabul etmesi için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifrelenmiş Matrix hesapları için onarım ve kurulum komutudur.
Aşağıdakilerin tümünü sırayla yapar:

- mümkün olduğunda mevcut recovery key'i yeniden kullanarak secret storage'ı bootstrap eder
- cross-signing'i bootstrap eder ve eksik genel cross-signing anahtarlarını yükler
- geçerli cihazı işaretlemeyi ve cross-signing ile imzalamayı dener
- henüz mevcut değilse yeni bir sunucu tarafı oda anahtarı yedeği oluşturur

Homeserver, cross-signing anahtarlarını yüklemek için etkileşimli kimlik doğrulaması gerektiriyorsa OpenClaw yüklemeyi önce kimlik doğrulaması olmadan, sonra `m.login.dummy` ile, `channels.matrix.password` yapılandırılmışsa daha sonra `m.login.password` ile dener.

Geçerli cross-signing kimliğini kasıtlı olarak atmak ve yeni bir kimlik oluşturmak istiyorsanız yalnızca `--force-reset-cross-signing` kullanın.

Geçerli oda anahtarı yedeğini kasıtlı olarak atmak ve gelecekteki mesajlar için yeni
bir yedekleme temeli başlatmak istiyorsanız `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez kalacağını ve
OpenClaw'un geçerli yedekleme sırrı güvenle yüklenemiyorsa secret storage'ı yeniden oluşturabileceğini kabul ediyorsanız yapın.

### Yeni yedekleme temeli

Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde her komuta `--account <id>` ekleyin.

### Başlangıç davranışı

`encryption: true` olduğunda Matrix, `startupVerification` için varsayılan olarak `"if-unverified"` kullanır.
Başlangıçta bu cihaz hâlâ doğrulanmamışsa Matrix başka bir Matrix istemcisinde kendini doğrulama ister,
zaten bekleyen bir istek varken yinelenen istekleri atlar ve yeniden başlatmalardan sonra tekrar denemeden önce yerel bir bekleme süresi uygular.
Başarısız istek denemeleri, varsayılan olarak başarılı istek oluşturmadan daha erken yeniden denenir.
Otomatik başlangıç isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlangıç ayrıca otomatik olarak temkinli bir kripto bootstrap geçişi yapar.
Bu geçiş önce mevcut secret storage ve cross-signing kimliğini yeniden kullanmaya çalışır ve açık bir bootstrap onarım akışı çalıştırmadığınız sürece cross-signing'i sıfırlamaktan kaçınır.

Başlangıç hâlâ bozuk bootstrap durumu bulursa, OpenClaw `channels.matrix.password` yapılandırılmamış olsa bile korumalı bir onarım yolunu deneyebilir.
Homeserver bu onarım için parola tabanlı UIA gerektiriyorsa, OpenClaw botu durdurmak yerine bir uyarı günlüğe kaydeder ve başlangıcı ölümcül olmayan durumda tutar.
Geçerli cihaz zaten owner-signed ise OpenClaw bunu otomatik olarak sıfırlamak yerine o kimliği korur.

Tam yükseltme akışı, sınırlar, recovery komutları ve yaygın geçiş iletileri için [Matrix migration](/tr/install/migrating-matrix) bölümüne bakın.

### Doğrulama bildirimleri

Matrix, doğrulama yaşam döngüsü bildirimlerini doğrudan katı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri (açık "Verify by emoji" yönlendirmesi ile)
- doğrulama başlangıç ve tamamlanma bildirimleri
- mevcut olduğunda SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik kabul edilir.
Kendini doğrulama akışlarında OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik olarak başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama isteklerinde OpenClaw isteği otomatik kabul eder ve ardından SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS'ı karşılaştırmanız ve orada "They match" onayı vermeniz gerekir.

OpenClaw, kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Bir kendini doğrulama isteği zaten bekliyorsa başlangıç yeni bir istek oluşturmayı atlar.

Doğrulama protokolü/sistem bildirimleri ajan sohbet hattına iletilmez; bu nedenle `NO_REPLY` üretmezler.

### Cihaz hijyeni

OpenClaw tarafından yönetilen eski Matrix cihazları hesapta birikebilir ve şifreli odalardaki güveni anlamayı zorlaştırabilir.
Şunlarla listeleyin:

```bash
openclaw matrix devices list
```

Eski OpenClaw tarafından yönetilen cihazları şunlarla kaldırın:

```bash
openclaw matrix devices prune-stale
```

### Kripto deposu

Matrix E2EE, Node içinde resmî `matrix-js-sdk` Rust kripto yolunu kullanır ve IndexedDB shim'i olarak `fake-indexeddb` kullanır. Kripto durumu bir anlık görüntü dosyasına (`crypto-idb-snapshot.json`) kalıcı olarak yazılır ve başlangıçta geri yüklenir. Anlık görüntü dosyası, kısıtlayıcı dosya izinleriyle saklanan hassas çalışma zamanı durumudur.

Şifrelenmiş çalışma zamanı durumu, hesap başına, kullanıcı başına token-hash kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
içinde bulunur.
Bu dizin sync deposunu (`bot-storage.json`), kripto deposunu (`crypto/`),
recovery key dosyasını (`recovery-key.json`), IndexedDB anlık görüntüsünü (`crypto-idb-snapshot.json`),
thread bağlarını (`thread-bindings.json`) ve başlangıç doğrulama durumunu (`startup-verification.json`) içerir.
Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw o hesap/homeserver/kullanıcı üçlüsü için en uygun mevcut
kökü yeniden kullanır; böylece önceki sync durumu, kripto durumu, thread bağları
ve başlangıç doğrulama durumu görünür kalır.

## Profil yönetimi

Seçilen hesap için Matrix öz profilini şununla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde, OpenClaw bunu önce Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçilen hesap geçersiz kılmasına) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de message-tool gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderici kapsamlı tutar; böylece birden fazla DM odası aynı eşe çözümlendiğinde tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, her Matrix DM odasını kendi oturum anahtarına izole ederken normal DM kimlik doğrulaması ve allowlist denetimlerini kullanmaya devam eder.
- Açık Matrix konuşma bağları yine de `dm.sessionScope` ayarına üstün gelir; bu nedenle bağlı odalar ve iş parçacıkları seçilmiş hedef oturumlarını korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda bırakır.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici mesajın kök aldığı bir iş parçacığında tutar ve bu konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki iş parçacıklarını izole tutarken DM'leri düz tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, ek ajan bağlamı olarak iş parçacığının kök mesajını içerir.
- Message-tool gönderimleri, açık bir `threadId` verilmediği sürece, hedef aynı odaysa veya aynı DM kullanıcı hedefiyse geçerli Matrix iş parçacığını otomatik olarak devralır.
- Aynı oturumlu DM kullanıcı-hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabında aynı DM eşini kanıtladığında devreye girer; aksi durumda OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, thread bağları etkinse ve `dm.sessionScope` ipucu varsa, o odaya `/focus` kaçış yolunu içeren tek seferlik bir `m.notice` gönderir.
- Çalışma zamanı thread bağları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve thread'e bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve onu hedef oturuma bağlar.
- Var olan bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine geçerli iş parçacığını bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Var olan bir Matrix iş parçacığı içinde `--bind here`, o geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here`, alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'un alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### Thread bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı spawn bayrakları isteğe bağlıdır:

- Üst düzey `/focus` işleminin yeni Matrix iş parçacıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` işleminin ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` tarafından denetlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, bot hesabından yalnızca belirtilen emoji tepkisini kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji fallback'i

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
- Tepki kaldırmaları sistem olaylarına sentezlenmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil redaction olarak gösterir.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` olarak eklenen son oda mesajı sayısını kontrol eder. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca pending durumundadır: OpenClaw henüz yanıtı tetiklememiş oda mesajlarını arabelleğe alır, ardından bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o sıra için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, thread kökleri ve pending geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist denetimleri tarafından izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açık bir alıntılanmış yanıtı tutar.

Bu ayar ek bağlam görünürlüğünü etkiler; gelen iletinin kendisinin yanıtı tetikleyip tetikleyemeyeceğini etkilemez.
Tetikleme yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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

Bahsetme denetimi ve allowlist davranışı için [Groups](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışına çıkarsa, OpenClaw canlı DM yerine eski tekli odalara işaret eden bayat `m.direct` eşlemeleriyle karşılaşabilir. Bir eş için geçerli eşlemeyi şununla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şununla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş olan katı 1:1 DM'yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir direct oda oluşturur ve `m.direct` değerini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri döner)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar, `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarlanmadığında veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde yerel onayları otomatik olarak etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri dönebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi takdirde onay istekleri diğer yapılandırılmış onay yollarına veya onay fallback ilkesine geri döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal yayılma modunu kontrol eder.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içinden gelen exec onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM allowlist'ini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de plugin onaylarına uygulanır.

Teslimat kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi kaynağın Matrix odasına veya DM'sine geri gönderir
- `target: "both"`, hem onaylayıcı DM'lerine hem de kaynağın Matrix odasına veya DM'sine gönderir

Matrix onay istemleri, birincil onay mesajında tepki kısayolları başlatır:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar bu mesaja tepki verebilir veya fallback slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimatı komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

## Çok hesap

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
Devralınan oda girdilerini `groups.<room>.account` ile tek bir Matrix hesabına kapsamlayabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` içeren girdiler de varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında çalışmaya devam eder.
Kısmi paylaşımlı kimlik doğrulama varsayılanları tek başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, üst düzey `default` hesabını yalnızca o varsayılanın yeni kimlik doğrulaması olduğunda (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar ise önbelleğe alınmış kimlik bilgileri daha sonra kimlik doğrulamayı karşıladığında `homeserver` artı `userId` üzerinden keşfedilebilir kalabilir.
Matrix zaten tam olarak bir adlandırılmış hesaba sahipse veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaplıdan çok hesaplıya onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşımlı teslimat ilkesi anahtarları üst düzeyde kalır.
Örtük yönlendirme, yoklama ve CLI işlemleri için OpenClaw'un adlandırılmış bir Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden fazla Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlı olmasa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` geçin.
Bunu tek bir komut için geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesap düzeni için [Configuration reference](/tr/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, hesap başına
açıkça izin vermediğiniz sürece SSRF koruması için özel/iç Matrix homeserver'larını engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya iç bir host adı üzerinde çalışıyorsa,
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

Bu isteğe bağlı etkinleştirme yalnızca güvenilen özel/iç hedeflere izin verir. Şunun gibi
genel açık metin homeserver'lar: `http://matrix.example.org:8008`, engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

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
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için kullanır.

## Hedef çözümleme

Matrix, OpenClaw'un sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esaslıdır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı allowlist çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/iç homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi iç bir host adına çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: token tabanlı kimlik doğrulama için access token. Düz metin değerleri ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma için cihaz görünen adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonu sırasında getirilen en fazla olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist` seviyesine yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` olmaya zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken allowlist değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `historyLimit`: grup geçmişi bağlamı olarak dahil edilecek en fazla oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown oluşturma yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, kendi barındırdığınız push-rule kurulumları için bildirim üretmeyen önizleme bildirimleri kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanmış asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: thread'e bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik kendini doğrulama isteği modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önceki bekleme süresi.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode` değeri `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara eklenecek isteğe bağlı dizge.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyut sınırı.
- `autoJoin`: davetlerde otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir.
- `autoJoinAllowlist`: `autoJoin` değeri `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın bildirdiği takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve bunu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik olarak katılınıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken allowlist değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam tutmasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için thread ilkesi geçersiz kılması (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix yerel exec onay teslimatı (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları belirliyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan olarak davranır.
- `groups`: oda başına ilke haritası. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma anında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme veya engelleme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde bahsetme denetimi geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde sistem istemi parçası.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç denetimi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
