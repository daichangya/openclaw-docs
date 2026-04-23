---
read_when:
    - OpenClaw içinde Matrix kurulumu
    - Matrix E2EE ve doğrulama yapılandırması
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-23T14:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketle birlikte gelen bir kanal plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, başlıkları, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketle birlikte gelen plugin

Matrix, mevcut OpenClaw sürümlerinde paketle birlikte gelen bir plugin olarak sunulur; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Matrix'i içermeyen özel bir kurulumu kullanıyorsanız, manuel olarak kurun:

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
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. homeserver'ınızda bir Matrix hesabı oluşturun.
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
- kimlik doğrulama yöntemi: erişim belirteci veya parola
- kullanıcı kimliği (yalnızca parola ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetlerle otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve bu hesabın kimlik doğrulaması henüz yapılandırmada kaydedilmemişse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM izin listesi girdileri doğrudan `@user:server` kabul eder; görünen adlar yalnızca canlı dizin araması tam olarak bir eşleşme bulduğunda çalışır.
- Oda izin listesi girdileri oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenemeyen adlar çalışma zamanında izin listesi çözümlemesi sırasında yok sayılır.
- Davetle otomatik katılımın izin listesi modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` için varsayılan değer `off`'tur.

Bunu ayarlamazsanız bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle siz önce manuel olarak katılmadıkça yeni gruplarda veya davet edilen DM'lerde görünmez.

Kabul edeceği davetleri kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın ya da her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

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

Belirteç tabanlı minimal kurulum:

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

Parola tabanlı kurulum (oturum açıldıktan sonra belirteç önbelleğe alınır):

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
Bu konumda önbelleğe alınmış kimlik bilgileri varsa, mevcut kimlik doğrulama doğrudan yapılandırmada ayarlanmamış olsa bile OpenClaw, kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış olarak değerlendirir.

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

Matrix, hesap kimliklerindeki noktalama işaretlerini, hesap kapsamlı ortam değişkenlerinde çakışmaları önlemek için kaçışlar.
Örneğin, `-`, `_X2D_` olur; dolayısıyla `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz, ortam değişkeni kısayolunu yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesabın Matrix kimlik doğrulaması yapılandırmada henüz kaydedilmemişse sunar.

`MATRIX_HOMESERVER`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Workspace `.env` files](/tr/gateway/security).

## Yapılandırma örneği

Bu, DM eşleştirme, oda izin listesi ve etkin E2EE içeren pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw, davet anında davet edilen bir odanın DM mi yoksa grup mu olduğunu güvenilir şekilde sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy`, bot katıldıktan ve oda bir DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'un tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve yanıt tamamlandığında sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılandır. OpenClaw son yanıtı bekler ve tek seferde gönderir.
- `streaming: "partial"`, mevcut assistant bloğu için düzenlenebilir bir önizleme mesajı oluşturur ve normal Matrix metin mesajlarını kullanır. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; dolayısıyla standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gönderebilir.
- `streaming: "quiet"`, mevcut assistant bloğu için düzenlenebilir, sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca sonlandırılmış önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda Matrix mevcut blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açık ve `blockStreaming` kapalı olduğunda Matrix canlı taslağı yerinde düzenler ve blok veya dönüş tamamlandığında aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri normal şekilde göndermeye devam eder. Eski bir önizleme artık güvenli şekilde yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrı maliyeti oluşturur. En korumacı hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, taslak önizlemelerini tek başına etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış assistant bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal, bildirim gönderen bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal, bildirim gönderen bir Matrix mesajı olarak gönderir.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Sessiz akış (`streaming: "quiet"`), alıcılara yalnızca bir blok veya dönüş sonlandırıldığında bildirim gönderir — kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam kurulum için [Matrix push rules for quiet previews](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Bottan bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak ajanlar arası Matrix trafiği istiyorsanız `allowBots` kullanın:

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
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda görünür şekilde bu bottan bahsediyorlarsa kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyindeki ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından gönderilmiş" ifadesini "bu OpenClaw gateway'inde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ek ile birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Hiçbir yapılandırma gerekmez — plugin E2EE durumunu otomatik olarak algılar.

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

| Komut                                                          | Amaç                                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Çapraz imzalama ve cihaz doğrulama durumunu denetle                                |
| `openclaw matrix verify status --include-recovery-key --json`  | Saklanan kurtarma anahtarını dahil et                                              |
| `openclaw matrix verify bootstrap`                             | Çapraz imzalama ve doğrulamayı bootstrap et (aşağıya bakın)                        |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Mevcut çapraz imzalama kimliğini at ve yenisini oluştur                            |
| `openclaw matrix verify device "<recovery-key>"`               | Bu cihazı bir kurtarma anahtarıyla doğrula                                         |
| `openclaw matrix verify backup status`                         | Oda anahtarı yedekleme durumunu denetle                                            |
| `openclaw matrix verify backup restore`                        | Oda anahtarlarını sunucu yedeğinden geri yükle                                     |
| `openclaw matrix verify backup reset --yes`                    | Mevcut yedeği sil ve yeni bir temel oluştur (gizli depolamayı yeniden oluşturabilir) |

Çok hesaplı kurulumlarda Matrix CLI komutları, `--account <id>` geçmediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi takdirde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Adlandırılmış bir hesap için şifreleme devre dışıysa veya kullanılamıyorsa Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Doğrulanmış ne anlama gelir">
    OpenClaw, bir cihazı yalnızca sizin kendi çapraz imzalama kimliğiniz onu imzaladığında doğrulanmış kabul eder. `verify status --verbose` üç güven sinyali gösterir:

    - `Locally trusted`: yalnızca bu istemci tarafından güvenilir
    - `Cross-signing verified`: SDK, doğrulamayı çapraz imzalama üzerinden bildirir
    - `Signed by owner`: sizin kendi self-signing anahtarınız tarafından imzalanmış

    `Verified by owner`, yalnızca çapraz imzalama veya sahip imzası mevcut olduğunda `yes` olur. Yalnızca yerel güven yeterli değildir.

  </Accordion>

  <Accordion title="Bootstrap ne yapar">
    `verify bootstrap`, şifrelenmiş hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

    - mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı bootstrap eder
    - çapraz imzalamayı bootstrap eder ve eksik genel çapraz imzalama anahtarlarını yükler
    - mevcut cihazı işaretler ve çapraz imzalar
    - henüz yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

    homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız dener, sonra `m.login.dummy`, ardından `m.login.password` dener (`channels.matrix.password` gerektirir). `--force-reset-cross-signing` seçeneğini yalnızca mevcut kimliği kasıtlı olarak atarken kullanın.

  </Accordion>

  <Accordion title="Yeni yedekleme temeli">
    Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adlandırılmış bir hesabı hedeflemek için `--account <id>` ekleyin. Mevcut yedekleme gizlisi güvenli şekilde yüklenemiyorsa bu işlem gizli depolamayı da yeniden oluşturabilir.

  </Accordion>

  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde self-verification ister, yinelenenleri atlar ve bir bekleme süresi uygular. `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto bootstrap geçişi yürütür. Bootstrap durumu bozuksa OpenClaw, `channels.matrix.password` olmasa bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan şekilde devam eder. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix migration](/tr/install/migrating-matrix) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, katı DM doğrulama odasına doğrulama yaşam döngüsü bildirimlerini `m.notice` mesajları olarak gönderir: istek, hazır (\"Emoji ile doğrula\" yönergesiyle), başlangıç/tamamlama ve mevcut olduğunda SAS (emoji/onluk) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Self-verification için OpenClaw SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar — yine de Matrix istemcinizde karşılaştırmanız ve \"Eşleşiyor\" onayını vermeniz gerekir.

    Doğrulama sistem bildirimleri ajan sohbet hattına iletilmez.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listelemek ve temizlemek için:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile birlikte resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` içine kalıcı olarak yazılır (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında yaşar ve sync store, kripto deposu, kurtarma anahtarı, IDB anlık görüntüsü, başlık bağları ve başlangıç doğrulama durumunu içerir. Belirteç değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw en iyi mevcut kökü yeniden kullanır; böylece önceki durum görünür kalır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix self-profile değerini şununla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. Bir `http://` veya `https://` avatar URL'si verdiğinizde OpenClaw bunu önce Matrix'e yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya seçilen hesap geçersiz kılmasına) geri yazar.

## Başlıklar

Matrix, hem otomatik yanıtlar hem de ileti-aracı gönderimleri için yerel Matrix başlıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderen kapsamlı tutar; böylece birden çok DM odası aynı eşe çözümlendiğinde tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, her Matrix DM odasını kendi oturum anahtarına ayırırken yine de normal DM kimlik doğrulama ve izin listesi denetimlerini kullanır.
- Açık Matrix konuşma bağları yine de `dm.sessionScope` üzerinde önceliklidir; bu nedenle bağlanmış odalar ve başlıklar seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen başlıklı mesajları üst oturumda bırakır.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o başlıktaysa başlık içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici iletiye köklenen bir başlıkta tutar ve o konuşmayı ilk tetikleyici iletiden itibaren eşleşen başlık kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, üst düzey ayarı yalnızca DM'ler için geçersiz kılar. Örneğin, odalardaki başlıkları yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen başlıklı mesajlar, ek ajan bağlamı olarak başlık kök iletisini içerir.
- Hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda, açık bir `threadId` verilmedikçe ileti-aracı gönderimleri mevcut Matrix başlığını otomatik devralır.
- Aynı oturumlu DM kullanıcı hedefi yeniden kullanımı yalnızca mevcut oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi durumda OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumundaki başka bir DM odasıyla çakıştığını gördüğünde, başlık bağları etkinse ve `dm.sessionScope` ipucu mevcutsa o odaya `/focus` kaçış kapağıyla birlikte bir defalık `m.notice` gönderir.
- Çalışma zamanı başlık bağları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve başlığa bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix başlığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix başlığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine o mevcut başlığı bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix başlıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut başlık içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix başlığı içinde `--bind here`, o mevcut başlığı yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here`, alt Matrix başlığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'un alt Matrix başlığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### Başlık bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` içinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix başlığa bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix başlıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix başlıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` tarafından korunur.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için mevcut tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, yalnızca belirtilen emoji tepkisini bot hesabından kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji geri dönüşü

Ack tepki kapsamı şu sırada çözülür:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tepki bildirim modu şu sırada çözülür:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- varsayılan: `own`

Davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları, Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil redaksiyonlar olarak gösterdiği için sistem olaylarına sentezlenmez.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` içine kaç son oda mesajının dahil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlanmamışsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen öğeler içindir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o dönüş için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, başlık kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimlerinin izin verdiği gönderenlere göre filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ancak yine de açıkça alıntılanmış bir yanıtı korur.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini etkilemez.
Tetikleyici yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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

Bahsetme geçitlemesi ve izin listesi davranışı için [Groups](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşzamanını kaybederse, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için mevcut eşlemeyi şununla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şununla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- `m.direct` içinde zaten eşlenmiş katı bir 1:1 DM'yi tercih eder
- bu kullanıcıyla şu anda katılmış olunan herhangi bir katı 1:1 DM'ye geri düşer
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak çalışabilir. Yerel
DM/kanal yönlendirme düğmeleri hâlâ exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri düşer)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onay verenler `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onay vereni çözümleyebildiğinde yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri düşebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi takdirde onay istekleri diğer yapılandırılmış onay yollarına veya onay geri dönüş ilkesine döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal fanout modunu kontrol eder.
- Exec onayları `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içindeki exec onaylayıcı kümesini kullanır.
- Plugin onayları `channels.matrix.dm.allowFrom` içindeki Matrix DM izin listesini kullanır.
- Matrix tepki kısayolları ve ileti güncellemeleri hem exec hem de plugin onayları için geçerlidir.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onay verenlerin DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, onay verenlerin DM'lerine ve kaynak Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajında tepki kısayollarını başlatır:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = etkin exec ilkesi o karara izin veriyorsa her zaman izin ver

Onay verenler bu mesaja tepki verebilir veya geri dönüş slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözülmüş onay verenler onay verebilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

## Slash komutları

Matrix slash komutları (örneğin `/new`, `/reset`, `/model`) doğrudan DM'lerde çalışır. Odalarda OpenClaw ayrıca botun kendi Matrix bahsetmesiyle öneklenen slash komutlarını da tanır; bu nedenle `@bot:server /new`, özel bir bahsetme regex'i gerektirmeden komut yolunu tetikler. Bu, kullanıcı botu komutu yazmadan önce sekmeyle tamamladığında Element ve benzeri istemcilerin ürettiği oda tarzı `@mention /command` gönderilerine botun yanıt vermeye devam etmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenlerin, düz mesajlarda olduğu gibi DM veya oda izin listesi/sahip ilkelerini karşılaması gerekir.

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

Üst düzey `channels.matrix` değerleri, bir hesap tarafından geçersiz kılınmadıkça adlandırılmış hesaplar için varsayılan olarak davranır.
Devralınan oda girdilerini tek bir Matrix hesabına `groups.<room>.account` ile kapsamlayabilirsiniz.
`account` olmayan girdiler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` olan girdiler varsayılan hesap doğrudan üst düzey `channels.matrix.*` altında yapılandırıldığında da çalışmaya devam eder.
Kısmi paylaşımlı kimlik doğrulama varsayılanları kendi başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, üst düzey `default` hesabını yalnızca bu varsayılanın güncel kimlik doğrulaması olduğunda sentezler (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`); adlandırılmış hesaplar ise kimlik doğrulama daha sonra önbelleğe alınmış kimlik bilgileriyle karşılandığında `homeserver` artı `userId` üzerinden keşfedilebilir kalabilir.
Matrix zaten tam olarak bir adlandırılmış hesaba sahipse veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaplıdan çok hesaplıya onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşımlı teslim ilkesi anahtarları üst düzeyde kalır.
OpenClaw'un örtük yönlendirme, yoklama ve CLI işlemleri için adlandırılmış Matrix hesaplarından birini tercih etmesini istediğinizde `defaultAccount` ayarlayın.
Birden çok Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlanmamış olsa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` geçin.
Bu örtük seçimi tek bir komut için geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesaplı desen için [Configuration reference](/tr/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, siz
hesap başına açıkça izin vermedikçe SSRF koruması için özel/dahili Matrix homeserver'larını engeller.

homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adı üzerinde çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` ayarını etkinleştirin:

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

Bu isteğe bağlı izin yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi
genel düz metin homeserver'ları engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirmek

Matrix kurulumunuz açık bir giden HTTP(S) proxy gerektiriyorsa, `channels.matrix.proxy` ayarlayın:

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

OpenClaw sizden bir oda veya kullanıcı hedefi istediğinde Matrix aşağıdaki hedef biçimlerini her yerde kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin çözümlemesi oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılmış oda adlarında aramaya geri düşer.
- Katılmış oda adı araması en iyi çabayladır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana bilgisayar adına çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin değerleri ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma için cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için saklanan kendi avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en yüksek olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist` olarak yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` olmaya zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği izin listesi. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `historyLimit`: grup geçmiş bağlamı olarak dahil edilecek en fazla oda mesajı. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlanmamışsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim üretmeyen önizleme bildirimleri kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanan assistant blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: başlığa bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önce beklenecek süre.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode`, `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtların başına eklenecek isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepkisi geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davetle otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin`, `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın iddia ettiği takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katılıp onu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik olarak katılıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimliği izin listesi. Tam Matrix kullanıcı kimlikleri en güvenli seçenektir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmeyen adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam tutmasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM'lere yönelik başlık ilkesi geçersiz kılması (`off`, `inbound`, `always`). DM'lerde hem yanıt yerleşimi hem de oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onay verenleri tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan olarak davranır.
- `groups`: oda başına ilke eşlemesi. Oda kimliklerini veya takma adları tercih edin; çözümlenmeyen oda adları çalışma zamanında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici izin listesi.
- `groups.<room>.tools`: oda başına araç izin/verme-engelleme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde bahsetme geçitlemesi geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: oda düzeyinde isteğe bağlı Skills filtresi.
- `groups.<room>.systemPrompt`: oda düzeyinde isteğe bağlı system prompt parçası.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçitlemesi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
