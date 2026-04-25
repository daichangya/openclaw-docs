---
read_when:
    - Güvenli ikilileri veya özel safe-bin profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikililer, yorumlayıcı bağlama, onay yönlendirme, yerel teslimat'
title: Exec onayları — gelişmiş
x-i18n:
    generated_at: "2026-04-25T13:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Gelişmiş exec onay konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı
bağlama ve onayların sohbet kanallarına yönlendirilmesi (yerel teslimat dahil).
Temel ilke ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikililer (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi modunda **açık izin listesi girdileri
olmadan** çalışabilen küçük bir **yalnızca stdin** ikili listesi tanımlar (örneğin
`cut`). Güvenli ikililer konumsal dosya argümanlarını ve yol benzeri belirteçleri
reddeder, bu nedenle yalnızca gelen akış üzerinde çalışabilirler. Bunu genel bir
güven listesi olarak değil, akış filtreleri için dar bir hızlı yol olarak değerlendirin.

<Warning>
Yorumlayıcı veya çalışma zamanı ikililerini (örneğin `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) `safeBins` içine **eklemeyin**. Bir komut kod
değerlendirebiliyor, alt komutlar çalıştırabiliyor veya tasarım gereği dosya okuyabiliyorsa,
açık izin listesi girdilerini tercih edin ve onay istemlerini etkin tutun.
Özel güvenli ikililer, `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikililer:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları isteğe bağlı olarak etkinleştirirseniz,
stdin dışı iş akışları için açık açık izin listesi girdilerini koruyun. `grep` için güvenli ikili modunda,
deseni `-e`/`--regexp` ile verin; konumsal desen biçimi reddedilir,
böylece dosya işlenenleri belirsiz konumsal argümanlar olarak gizlice geçirilemez.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv biçiminden belirleyici olarak yapılır (ana makine dosya sistemi varlık
kontrolü yoktur), bu da izin/verme farklarından kaynaklanan dosya varlığı oracle davranışını
önler. Dosya odaklı seçenekler varsayılan güvenli ikililer için reddedilir; uzun
seçenekler hata durumunda kapalı olacak şekilde doğrulanır (bilinmeyen bayraklar ve belirsiz
kısaltmalar reddedilir).

Güvenli ikili profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikililer ayrıca çalışma zamanında argv belirteçlerini **gerçek metin** olarak
değerlendirilmeye zorlar (glob genişletmesi ve `$VARS` genişletmesi yoktur), böylece `*`
veya `$HOME/...` gibi desenler dosya okumalarını gizlice geçirmek için kullanılamaz.

### Güvenilen ikili dizinleri

Güvenli ikililer güvenilen ikili dizinlerinden çözülmelidir (sistem varsayılanları artı
isteğe bağlı `tools.exec.safeBinTrustedDirs`). `PATH` girdilerine asla otomatik olarak güvenilmez.
Varsayılan güvenilen dizinler bilerek minimum tutulur: `/bin`, `/usr/bin`. Eğer
güvenli ikili yürütülebilir dosyanız paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları
`tools.exec.safeBinTrustedDirs` içine açıkça ekleyin.

### Kabuk zincirleme, sarmalayıcılar ve çoklayıcılar

Her üst düzey bölüm açık izin listesini karşılıyorsa (güvenli ikililer veya Skills otomatik izni dahil),
kabuk zincirlemeye (`&&`, `||`, `;`) izin verilir. Yönlendirmeler açık izin listesi modunda
desteklenmez. Komut ikamesi (`$()` / ters tırnaklar) açık izin listesi ayrıştırması sırasında,
çift tırnak içinde olsa bile reddedilir; gerçek `$()` metnine ihtiyacınız varsa tek tırnak kullanın.

macOS yardımcı uygulama onaylarında, kabuk denetim veya genişletme sözdizimi içeren ham kabuk metni
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
kabuk ikilisinin kendisi açık izin listesinde değilse bir açık izin listesi kaçırması olarak değerlendirilir.

Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı ortam geçersiz kılmaları
küçük ve açık bir açık izin listesine indirilir (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Açık izin listesi modunda `allow-always` kararları için, bilinen dağıtım sarmalayıcıları (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolunu değil, içteki yürütülebilir dosya yolunu
kalıcı hale getirir. Kabuk çoklayıcıları (`busybox`, `toybox`) kabuk applet'leri (`sh`, `ash` vb.)
için aynı şekilde açılır. Bir sarmalayıcı veya çoklayıcı güvenli şekilde açılamazsa, hiçbir
açık izin listesi girdisi otomatik olarak kalıcı hale getirilmez.

`python3` veya `node` gibi yorumlayıcıları açık izin listesine alırsanız,
satır içi değerlendirme yine de açık onay gerektirsin diye `tools.exec.strictInlineEval=true`
tercih edin. Katı modda `allow-always`, zararsız yorumlayıcı/betik çağrılarını yine de
kalıcı hale getirebilir, ancak satır içi değerlendirme taşıyıcıları otomatik olarak kalıcı hale getirilmez.

### Güvenli ikililer ve açık izin listesi karşılaştırması

| Konu             | `tools.exec.safeBins`                                | Açık izin listesi (`exec-approvals.json`)                                        |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerini otomatik olarak izinli kılmak | Belirli yürütülebilir dosyalara açıkça güvenmek                                   |
| Eşleşme türü     | Yürütülebilir ad + güvenli ikili argv ilkesi         | Çözümlenmiş yürütülebilir yol glob'u veya `PATH` ile çağrılan komutlar için yalın komut adı glob'u |
| Argüman kapsamı  | Güvenli ikili profili ve gerçek belirteç kurallarıyla kısıtlı | Yalnızca yol eşleşmesi; diğer açılardan argümanlar sizin sorumluluğunuzdadır      |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'ler                                   |
| En iyi kullanım  | Boru hatlarında düşük riskli metin dönüşümleri       | Daha geniş davranışa veya yan etkilere sahip her araç                             |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya ajan başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya ajan başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya ajan başına `agents.list[].tools.exec.safeBinProfiles`). Ajan başına profil anahtarları genel anahtarları geçersiz kılar.
- Açık izin listesi girdileri ana makineye yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında bulunur (veya Control UI / `openclaw approvals allowlist ...` aracılığıyla).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikilileri açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` uyarısı verir.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikilileri otomatik olarak iskeletlenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq` öğesini açıkça `safeBins` içine alırsanız, OpenClaw güvenli ikili modunda `env` yerleşik öğesini
yine de reddeder; böylece `jq -n env`, açık bir izin listesi yolu
veya onay istemi olmadan ana makine süreç ortamını dökemez.

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları bilerek muhafazakârdır:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosyası biçimleri, mümkün olduğunda tek bir somut
  yerel dosya anlık görüntüsüne bağlanır.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri
  (örneğin `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw, bir yorumlayıcı/çalışma zamanı komutu için tam olarak tek bir somut yerel dosyayı
  belirleyemiyorsa (örneğin paket betikleri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri
  veya belirsiz çok dosyalı biçimler), onay destekli yürütme, sahip olmadığı anlamsal kapsamı
  varmış gibi göstermemek için reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı
  anlamlarını kabul ettiği açık güvenilir açık izin listesi/tam iş akışı tercih edin.

Onaylar gerektiğinde exec aracı bir onay kimliğiyle hemen döner. Daha sonraki sistem olaylarını
(`Exec finished` / `Exec denied`) ilişkilendirmek için bu kimliği kullanın. Zaman aşımından önce
karar gelmezse, istek bir onay zaman aşımı olarak değerlendirilir ve red nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylanmış async exec tamamlandıktan sonra OpenClaw aynı oturuma takip eden bir `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi bu kanalı kullanır.
- Yalnızca webchat veya harici hedefi olmayan iç oturum akışlarında takip teslimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran açıkça katı harici teslim ister ve çözümlenebilir harici kanal yoksa istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir harici kanal çözümlenemiyorsa, teslim başarısız olmak yerine yalnızca oturum moduna düşürülür.

## Onayları sohbet kanallarına yönlendirme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dahil) yönlendirebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim boru hattını kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıt verin:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse,
otomatik olarak Plugin onaylarını da kontrol eder.

### Plugin onayı yönlendirme

Plugin onayı yönlendirme, exec onaylarıyla aynı teslim boru hattını kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak
diğerini etkilemez.
__OC_I18N_900003__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de
Plugin onayları için aynı onay düğmelerini gösterir. Paylaşılan etkileşimli UI'si olmayan kanallar,
`/approve` yönergeleri içeren düz metne geri döner.

### Herhangi bir kanalda aynı sohbetten onaylar

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden geldiğinde, aynı sohbet artık
varsayılan olarak bunu `/approve` ile onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak
Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin komutu yolu, o konuşma için normal kanal kimlik doğrulama modelini kullanır. Kaynak
sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin beklemede kalması için artık
ayrı bir yerel teslim bağdaştırıcısına ihtiyacı yoktur.

Discord ve Telegram da aynı sohbetten `/approve` desteği sunar, ancak yerel onay teslimi devre dışı olsa bile
bu kanallar yetkilendirme için çözümlenmiş onaylayıcı listelerini kullanmaya devam eder.

Gateway'i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için,
bu geri dönüş bilerek "onay bulunamadı" hatalarıyla sınırlıdır. Gerçek bir
exec onayı red/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbet
`/approve` akışının üzerine onaylayıcı DM'leri, kaynak sohbet fanout'u ve kanala özgü etkileşimli onay UX'i ekler.

Yerel onay kartları/düğmeleri mevcut olduğunda, bu yerel UI ajan açısından birincil
yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya geriye kalan tek
yolun manuel onay olduğunu söylemediği sürece, ajan ayrıca yinelenen bir düz sohbet
`/approve` komutunu da göndermemelidir.

Genel model:

- ana makine exec ilkesi, exec onayının gerekli olup olmadığına yine de karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine yönlendirilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmayacağını denetler

Yerel onay istemcileri, aşağıdakilerin tümü doğru olduğunda DM öncelikli teslimi otomatik etkinleştirir:

- kanal yerel onay teslimini destekliyorsa
- onaylayıcılar açık `execApprovals.approvers` veya o kanalın belgelenmiş geri dönüş kaynaklarından çözümlenebiliyorsa
- `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise

Bir yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayıcılar çözümlendiğinde
zorla etkinleştirmek için `enabled: true` ayarlayın. Genel kaynak sohbet teslimi
`channels.<channel>.execApprovals.target` üzerinden açık şekilde kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı sohbet `/approve` akışı ve paylaşılan onay düğmelerinin
üzerine DM yönlendirmesi ve isteğe bağlı kanal fanout'u ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler, aynı sohbet `/approve` için
  normal kanal kimlik doğrulama modelini kullanır
- bir yerel onay istemcisi otomatik etkinleştiğinde, varsayılan yerel teslim hedefi onaylayıcı DM'leridir
- Discord ve Telegram için yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir
- Discord onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Telegram onaylayıcıları açık olabilir (`execApprovals.approvers`) veya mevcut sahip yapılandırmasından çıkarılabilir (`allowFrom`, ayrıca desteklenen yerlerde doğrudan mesaj `defaultTo`)
- Slack onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur, böylece `plugin:` kimlikleri ikinci bir Slack yerel geri dönüş katmanı olmadan Plugin onaylarını çözebilir
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de Plugin onaylarını işler;
  Plugin yetkilendirmesi yine de `channels.matrix.dm.allowFrom` üzerinden gelir
- isteği yapan kişinin onaylayıcı olması gerekmez
- kaynak sohbet zaten komutları ve yanıtları destekliyorsa, `/approve` ile doğrudan onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri
  doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri, `/approve` ile aynı sınırlı exec-to-plugin geri dönüşünü izler
- yerel `target`, kaynak sohbet teslimini etkinleştirdiğinde, onay istemleri komut metnini içerir
- bekleyen exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar
- hiçbir operatör UI'si veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa, istem `askFallback` olarak geri döner

Telegram varsayılan olarak onaylayıcı DM'lerini kullanır (`target: "dm"`). Onay istemlerinin
kaynak Telegram sohbetinde/konusunda da görünmesini istiyorsanız `channel` veya `both` olarak
değiştirebilirsiniz. Telegram forum konuları için OpenClaw, onay istemi ve onay sonrası takip
için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix soket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş kontrolü.
- Challenge/response (nonce + HMAC token + istek hash'i) + kısa TTL.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — temel ilke ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — Skill destekli otomatik izin davranışı
