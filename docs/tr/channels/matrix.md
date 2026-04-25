---
read_when:
    - OpenClaw içinde Matrix kurma
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix, OpenClaw için paketlenmiş bir kanal Plugin'idir.
Resmî `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş Plugin

Matrix, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Matrix'i içermeyen özel bir kurulumu kullanıyorsanız,
onu manuel olarak yükleyin:

npm'den yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan yükleyin:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve kurulum kuralları için bkz. [Plugins](/tr/tools/plugin).

## Kurulum

1. Matrix Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketlenmiş olarak içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. Homeserver'ınızda bir Matrix hesabı oluşturun.
3. `channels.matrix` öğesini şu seçeneklerden biriyle yapılandırın:
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
- kullanıcı kimliği (yalnızca parola kimlik doğrulaması)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişiminin ve davet otomatik katılımının yapılandırılıp yapılandırılmayacağı

Temel sihirbaz davranışları:

- Matrix kimlik doğrulama env değişkenleri zaten varsa ve bu hesabın yapılandırmada zaten kaydedilmiş kimlik doğrulaması yoksa, sihirbaz kimlik doğrulamayı env değişkenlerinde tutmak için bir env kısayolu sunar.
- Hesap adları hesap kimliğine göre normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist girdileri `@user:server` biçimini doğrudan kabul eder; görünen adlar yalnızca canlı dizin araması tam olarak bir eşleşme bulduğunda çalışır.
- Oda allowlist girdileri oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar çalışma zamanında allowlist çözümleme tarafından yok sayılır.
- Davet otomatik katılımı allowlist modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Oda adlarını kaydetmeden önce çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir.

Bunu ayarsız bırakırsanız, bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle siz önce manuel olarak katılmadığınız sürece yeni gruplarda veya davet edilen DM'lerde görünmez.

Hangi davetleri kabul edeceğini sınırlamak için `autoJoinAllowlist` ile birlikte `autoJoin: "allowlist"` ayarlayın ya da her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

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

Token tabanlı en düşük kurulum:

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

Parola tabanlı kurulum (giriş yaptıktan sonra token önbelleğe alınır):

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
Orada önbelleğe alınmış kimlik bilgileri mevcut olduğunda, mevcut kimlik doğrulama doğrudan yapılandırmada ayarlanmamış olsa bile OpenClaw, kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış kabul eder.

Ortam değişkeni eşdeğerleri (config anahtarı ayarlanmadığında kullanılır):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Varsayılan olmayan hesaplar için, hesaba özgü env değişkenlerini kullanın:

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

Matrix, hesaba özgü env değişkenlerini çakışmasız tutmak için hesap kimliklerindeki noktalama işaretlerini kaçar.
Örneğin, `-`, `_X2D_` olur; bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` eşlemesine gider.

Etkileşimli sihirbaz, bu kimlik doğrulama env değişkenleri zaten mevcutsa ve seçilen hesap için Matrix kimlik doğrulaması yapılandırmada zaten kaydedilmemişse env değişkeni kısayolunu sunar.

`MATRIX_HOMESERVER`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Workspace `.env` files](/tr/gateway/security).

## Yapılandırma örneği

Bu, DM eşleme, oda allowlist'i ve E2EE etkinleştirilmiş pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw, davet anında
davet edilen bir odayı güvenilir biçimde DM veya grup olarak sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin`
üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

Model metin üretirken OpenClaw'ın tek bir canlı önizleme yanıtı göndermesini,
bu önizlemeyi yerinde düzenlemesini ve ardından yanıt tamamlandığında tamamlamasını istediğinizde
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
- `streaming: "partial"`, geçerli asistan bloğu için normal Matrix metin mesajları kullanarak düzenlenebilir tek bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; bu yüzden standart istemciler bitmiş blok yerine ilk akış önizleme metninde bildirim gösterebilir.
- `streaming: "quiet"`, geçerli asistan bloğu için düzenlenebilir tek bir sessiz önizleme bildirimi oluşturur. Bunu yalnızca sonlandırılmış önizleme düzenlemeleri için alıcı push kuralları da yapılandırıyorsanız kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda, Matrix geçerli blok için canlı taslağı korur ve tamamlanmış blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken `blockStreaming` kapalıysa, Matrix canlı taslağı yerinde düzenler ve blok veya tur bittiğinde aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa, OpenClaw önizleme akışını durdurur ve normal son teslim davranışına geri döner.
- Medya yanıtları ekleri normal şekilde göndermeye devam eder. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa, OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakâr rate-limit davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, taslak önizlemeleri tek başına etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslim için `streaming` kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, biten her bloğu normal bildirim gönderen bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim gönderen bir Matrix mesajı olarak gönderir.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Sessiz akış (`streaming: "quiet"`), alıcılara yalnızca bir blok veya tur sonlandırıldığında bildirim gönderir — kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam kurulum (alıcı token'ı, pusher kontrolü, kural kurulumu, homeserver başına notlar) için bkz. [Matrix push rules for quiet previews](/tr/channels/matrix-push-rules).

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak aracılar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak yorumlar.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda allowlist'leri ve mention gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez — Plugin E2EE durumunu otomatik olarak algılar.

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

Doğrulama komutları (hepsi tanılama için `--verbose` ve makine tarafından okunabilir çıktı için `--json` alır):

```bash
openclaw matrix verify status
```

Ayrıntılı durum (tam tanılama):

```bash
openclaw matrix verify status --verbose
```

Saklanan kurtarma anahtarını makine tarafından okunabilir çıktıya dahil edin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-signing ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanılama:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap işleminden önce yeni bir cross-signing kimlik sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir kurtarma anahtarıyla doğrulayın:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Bu komut üç ayrı durumu bildirir:

- `Recovery key accepted`: Matrix, kurtarma anahtarını gizli depolama veya cihaz güveni için kabul etti.
- `Backup usable`: oda anahtarı yedeği güvenilir kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: geçerli OpenClaw cihazı tam Matrix cross-signing kimlik güvenine sahiptir.

Ayrıntılı veya JSON çıktısındaki `Signed by owner` yalnızca tanılama amaçlıdır. OpenClaw,
`Cross-signing verified` de `yes` olmadığı sürece bunu yeterli kabul etmez.

Tam Matrix kimlik güveni eksik olduğunda komut yine de sıfır olmayan bir çıkış koduyla biter;
kurtarma anahtarı yedek materyalini açabiliyor olsa bile. Bu durumda,
başka bir Matrix istemcisinden kendini doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

İsteği başka bir Matrix istemcisinde kabul edin, SAS emoji'lerini veya ondalık sayıları karşılaştırın
ve yalnızca eşleşiyorlarsa `yes` yazın. Komut, Matrix
`Cross-signing verified: yes` bildirmeden başarılı şekilde çıkmaz.

`verify bootstrap --force-reset-cross-signing` seçeneğini yalnızca mevcut
cross-signing kimliğini bilerek değiştirmek istediğinizde kullanın.

Ayrıntılı cihaz doğrulama ayrıntıları:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedeği sağlığını kontrol edin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedek sağlığı tanılaması:

```bash
openclaw matrix verify backup status --verbose
```

Oda anahtarlarını sunucu yedeğinden geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Etkileşimli kendini doğrulama akışı:

```bash
openclaw matrix verify self
```

Daha düşük düzeyli veya gelen doğrulama istekleri için şunu kullanın:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Bir isteği iptal etmek için `openclaw matrix verify cancel <id>` kullanın.

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedek temel durumu oluşturun. Depolanan
yedek anahtarı temiz şekilde yüklenemiyorsa, bu sıfırlama gizli depolamayı da yeniden oluşturarak
gelecekteki soğuk başlangıçların yeni yedek anahtarını yükleyebilmesini sağlayabilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısadır (sessiz dahili SDK günlükleme dâhil) ve ayrıntılı tanılama yalnızca `--verbose` ile gösterilir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda, Matrix CLI komutları siz `--account <id>` vermediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız, önce `channels.matrix.defaultAccount` ayarlayın; aksi takdirde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarına işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Doğrulanmış ne anlama gelir">
    OpenClaw, bir cihazı yalnızca sizin kendi cross-signing kimliğiniz onu imzaladığında doğrulanmış kabul eder. `verify status --verbose` üç güven sinyali gösterir:

    - `Locally trusted`: yalnızca bu istemci tarafından güvenilir
    - `Cross-signing verified`: SDK, doğrulamayı cross-signing üzerinden bildiriyor
    - `Signed by owner`: sizin kendi self-signing anahtarınız tarafından imzalanmış

    `Verified by owner`, yalnızca cross-signing doğrulaması mevcut olduğunda `yes` olur.
    Yerel güven veya tek başına sahip imzası, OpenClaw'ın
    cihazı tam olarak doğrulanmış kabul etmesi için yeterli değildir.

  </Accordion>

  <Accordion title="Bootstrap ne yapar">
    `verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

    - gizli depolamayı bootstrap eder, mümkün olduğunda mevcut kurtarma anahtarını yeniden kullanır
    - cross-signing'i bootstrap eder ve eksik herkese açık cross-signing anahtarlarını yükler
    - geçerli cihazı işaretler ve cross-signing ile imzalar
    - mevcut değilse sunucu taraflı bir oda anahtarı yedeği oluşturur

    Homeserver, cross-signing anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız dener, sonra `m.login.dummy`, ardından `m.login.password` dener (`channels.matrix.password` gerektirir). `--force-reset-cross-signing` seçeneğini yalnızca mevcut kimliği bilerek atarken kullanın.

  </Accordion>

  <Accordion title="Yeni yedek temel durumu">
    Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adlandırılmış bir hesabı hedeflemek için `--account <id>` ekleyin. Geçerli yedek sırrı güvenli şekilde yüklenemiyorsa bu işlem gizli depolamayı da yeniden oluşturabilir.

  </Accordion>

  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde kendini doğrulama ister; yinelenenleri atlar ve bir bekleme süresi uygular. `startupVerificationCooldownHours` ile ince ayar yapın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca, mevcut gizli depolama ve cross-signing kimliğini yeniden kullanan korumacı bir kripto bootstrap geçişi çalıştırır. Bootstrap durumu bozuksa, OpenClaw `channels.matrix.password` olmasa bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa, başlangıç bir uyarı kaydeder ve ölümcül olmaz. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için bkz. [Matrix migration](/tr/install/migrating-matrix).

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır (\"Emoji ile doğrula\" yönergesiyle), başlatma/tamamlama ve mümkün olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Kendini doğrulama için OpenClaw, SAS akışını otomatik başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar — sizin yine de Matrix istemcinizde karşılaştırıp \"Eşleşiyorlar\" onayı vermeniz gerekir.

    Doğrulama sistem bildirimleri aracı sohbet hattına iletilmez.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve temizleyin:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmî `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` içine kalıcı olarak kaydedilir (kısıtlayıcı dosya izinleri).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında yaşar ve sync deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlarını ve başlangıç doğrulama durumunu içerir. Token değişip hesap kimliği aynı kaldığında, OpenClaw önceki durum görünür kalacak şekilde mevcut en iyi kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix öz profilini şununla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde, OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçili hesap geçersiz kılmasına) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj-aracı göndermeleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderen kapsamlı tutar; böylece aynı eşe çözülüyorsa birden çok DM odası tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulama ve allowlist kontrollerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına ayırır.
- Açık Matrix konuşma bağları yine de `dm.sessionScope` üzerinde önceliklidir; dolayısıyla bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları ana oturumda tutar.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici mesaja köklenen bir iş parçacığında tutar ve bu konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki iş parçacıklarını yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, ek aracı bağlamı olarak iş parçacığı kök mesajını içerir.
- Mesaj-aracı göndermeleri, açık bir `threadId` sağlanmadıkça, hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda geçerli Matrix iş parçacığını otomatik devralır.
- Aynı oturumlu DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi hâlde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, iş parçacığı bağları etkinse ve `dm.sessionScope` ipucuyla birlikte, o odada bir defalık `/focus` kaçış kapağını içeren bir `m.notice` gönderir.
- Çalışma zamanı iş parçacığı bağları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve onu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak ise bunun yerine o mevcut iş parçacığını bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, bu mevcut iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here`, alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

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

- Giden tepki araçları `channels["matrix"].actions.reactions` tarafından denetlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bu olay üzerindeki bot hesabının kendi tepkilerini kaldırır.
- `remove: true`, yalnızca bot hesabındaki belirtilen emoji tepkisini kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji geri dönüşü

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
- Tepki kaldırmaları bağımsız sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak gösterir.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı aracıyı tetiklediğinde `InboundHistory` olarak kaç son oda mesajının ekleneceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmadıysa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen mesajlar içindir: OpenClaw henüz yanıtı tetiklememiş oda mesajlarını arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen içerikte kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist kontrolleri tarafından izin verilen gönderenlere göre filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de bir açık alıntılanmış yanıtı korur.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen mesajın kendisinin yanıtı tetikleyip tetikleyemeyeceğini etkilemez.
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

Mention kapılaması ve allowlist davranışı için bkz. [Groups](/tr/channels/groups).

Matrix DM'leri için eşleme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleme kodunu yeniden kullanır ve yeni bir kod basmak yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleme akışı ve depolama düzeni için bkz. [Pairing](/tr/channels/pairing).

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışına çıkarsa, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle karşı karşıya kalabilir. Bir eş için geçerli eşlemeyi şununla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şununla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş olan katı bir 1:1 DM'yi tercih eder
- bunun yokluğunda, o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. `enabled` ayarsız veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde Matrix yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri dönebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi durumda onay istekleri diğer yapılandırılmış onay yollarına veya onay geri dönüş ilkesine geri döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal fanout modunu denetler.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içinden gelen exec onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM allowlist'ini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de Plugin onayları için geçerlidir.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, hem onaylayıcı DM'lerine hem de kaynak Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajına tepki kısayolları yerleştirir:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkili exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar o mesaja tepki verebilir veya geri dönüş slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onay verebilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

## Slash komutları

Matrix slash komutları (örneğin `/new`, `/reset`, `/model`) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenmiş slash komutlarını da tanır; bu nedenle `@bot:server /new`, özel bir mention regex'i gerektirmeden komut yolunu tetikler. Bu, bir kullanıcı komutu yazmadan önce sekme tamamlama ile botu eklediğinde Element ve benzeri istemcilerin ürettiği oda tarzı `@mention /command` gönderilerine botun yanıt verebilir kalmasını sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz mesajlarda olduğu gibi DM veya oda allowlist/sahip ilkelerini karşılamalıdır.

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılan görevi görür.
Devralınan oda girdilerini `groups.<room>.account` ile tek bir Matrix hesabına kapsamlayabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşılmış kalır ve `account: "default"` içeren girdiler varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında yine çalışır.
Kısmi paylaşılan kimlik doğrulama varsayılanları tek başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, üst düzey `default` hesabını yalnızca bu varsayılan hesapta yeni kimlik doğrulama varsa (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri daha sonra kimlik doğrulamayı karşıladığında `homeserver` artı `userId` üzerinden keşfedilebilir kalabilir.
Matrix zaten tam olarak bir adlandırılmış hesaba sahipse veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaplıdan çok hesaplıya onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, yoklama ve CLI işlemleri için adlandırılmış bir Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden çok Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarsız olsa bile OpenClaw o hesabı örtük olarak kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` verin.
Bir komut için bu örtük seçimi geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesaplı desen için bkz. [Configuration reference](/tr/gateway/config-channels#multi-account-all-channels).

## Özel/LAN homeserver'lar

Varsayılan olarak, OpenClaw SSRF koruması için özel/dahili Matrix homeserver'ları
hesap başına açıkça izin vermediğiniz sürece engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adı üzerinde çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` etkinleştirin:

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

Bu katılım yalnızca güvenilir özel/dahili hedeflere izin verir. Şu gibi herkese açık düz metin homeserver'lar:
`http://matrix.example.org:8008` engelli kalır. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy gerektiriyorsa `channels.matrix.proxy` ayarlayın:

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

Adlandırılmış hesaplar üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esaslıdır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı allowlist çözümlemesi sırasında yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana bilgisayar adına çözülüyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: token tabanlı kimlik doğrulama için access token. Düz metin değerleri ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma için cihaz görünen adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonu sırasında getirilen en fazla olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist`e yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dâhil) `allowlist`e zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken allowlist değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `historyLimit`: grup geçmişi bağlamı olarak eklenecek en fazla oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmadıysa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push kuralı kurulumları için bildirim göndermeyen önizleme bildirimlerini kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: taslak önizleme akışı etkin olduğunda `true`, tamamlanmış asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik kendini doğrulama isteği modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önceki bekleme süresi.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode` değeri `length` olduğunda geçerlidir).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtların başına eklenen isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davet otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dâhil tüm Matrix davetleri için geçerlidir.
- `autoJoinAllowlist`: `autoJoin` değeri `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın bildirdiği takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve onu DM olarak sınıflandırdıktan sonra DM erişimini denetler. Bir davetin otomatik olarak katılıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimliği allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken allowlist değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Aynı eş olsa bile her Matrix DM odasının ayrı bağlam korumasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için iş parçacığı ilkesi geçersiz kılması (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan görevi görür.
- `groups`: oda başına ilke eşlemi. Oda kimliklerini veya takma adları tercih edin; çözümlenmeyen oda adları çalışma zamanında yok sayılır. Çözümlemeden sonra oturum/grup kimliği kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot gönderenler için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderen allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde mention kapılama geçersiz kılması. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde sistem prompt parçası.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç denetimi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention kapılaması
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
