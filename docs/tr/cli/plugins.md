---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
summary: '`openclaw plugins` için CLI başvurusu (listeleme, kurma, marketplace, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: plugins
x-i18n:
    generated_at: "2026-04-23T09:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway Plugin'lerini, hook paketlerini ve uyumlu paketleri yönetin.

İlgili:

- Plugin sistemi: [Plugins](/tr/tools/plugin)
- Paket uyumluluğu: [Plugin bundles](/tr/plugins/bundles)
- Plugin manifest + şema: [Plugin manifest](/tr/plugins/manifest)
- Güvenlik sağlamlaştırma: [Security](/tr/gateway/security)

## Komutlar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş browser
Plugin'i); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw Plugin'leri satır içi JSON
Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gelmelidir. Uyumlu paketler bunun yerine kendi paket
manifest'lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı list/info
çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket
yeteneklerini gösterir.

### Kurulum

```bash
openclaw plugins install <package>                      # önce ClawHub, sonra npm
openclaw plugins install clawhub:<package>              # yalnızca ClawHub
openclaw plugins install <package> --force              # mevcut kurulumu üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açık)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Çıplak paket adları önce ClawHub'da, sonra npm'de denetlenir. Güvenlik notu:
Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.

`plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasını ellememiş olur. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirilmek yerine güvenli şekilde başarısız olur. Desteklenen biçimler için [Config includes](/tr/gateway/configuration) sayfasına bakın.

Config geçersizse `plugins install` normalde güvenli şekilde başarısız olur ve önce
`openclaw doctor --fix` çalıştırmanızı söyler. Belgelenmiş tek istisna, açıkça
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar bir
paketlenmiş-Plugin kurtarma yoludur.

`--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulu olan bir
Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artifact'ından bilerek yeniden kurarken kullanın.
Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için
`openclaw plugins update <id-or-npm-spec>` tercih edin.

Zaten kurulu olan bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw
durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna,
geçerli kurulumu farklı bir kaynaktan gerçekten üzerine yazmak istiyorsanız da
`plugins install <package> --force` komutuna yönlendirir.

`--pin` yalnızca npm kurulumları için geçerlidir. `--marketplace` ile desteklenmez,
çünkü marketplace kurulumları bir npm spec'i yerine marketplace kaynak meta verisini kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir.
Yerleşik tarayıcı `critical` bulguları bildirse bile kurulumun sürmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **aşmaz** ve tarama
başarısızlıklarını **aşmaz**.

Bu CLI bayrağı Plugin install/update akışları için geçerlidir. Gateway destekli Skill
bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır, ancak `openclaw skills install` ayrı bir ClawHub Skill
indirme/kurma akışı olarak kalır.

`plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de
kurulum yüzeyidir. Filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için
paket kurulumu değil, `openclaw hooks` kullanın.

Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalıştırılır.

Çıplak spec'ler ve `@latest` kararlı hatta kalır. npm bunlardan birini bir ön sürüme çözümleyerse OpenClaw
durur ve `@beta`/`@rc` gibi bir
ön sürüm etiketi veya `@1.2.3-beta.4` gibi tam bir ön sürüm sürümü ile açık katılım ister.

Çıplak bir kurulum spec'i bir paketlenmiş Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw
paketlenmiş Plugin'i doğrudan kurar. Aynı ada sahip bir npm paketi kurmak için
açık bir kapsamlı spec kullanın (örneğin `@scope/diffs`).

Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace kurulumları da desteklenir.

ClawHub kurulumları açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak npm-güvenli Plugin spec'leri için de ClawHub'ı tercih eder. Yalnızca
ClawHub'da bu paket veya sürüm yoksa npm'ye fallback yapar:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw paket arşivini ClawHub'dan indirir, bildirilen
Plugin API / minimum gateway uyumluluğunu denetler, ardından normal
arşiv yolu üzerinden kurar. Kaydedilen kurulumlar daha sonraki
güncellemeler için ClawHub kaynak meta verilerini korur.

Marketplace adı Claude'un
`~/.claude/plugins/known_marketplaces.json` içindeki yerel registry önbelleğinde varsa `plugin@marketplace` kısa yazımını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça vermek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace kaynakları şunlar olabilir:

- `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen-marketplace adı
- yerel bir marketplace kökü veya `marketplace.json` yolu
- `owner/repo` gibi bir GitHub repo kısa yazımı
- `https://github.com/owner/repo` gibi bir GitHub repo URL'si
- bir git URL'si

GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri
klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw bu repodan göreli yol kaynaklarını kabul eder ve uzak manifest'lerdeki HTTP(S), mutlak-yol, git, GitHub ve diğer yol olmayan
Plugin kaynaklarını reddeder.

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude
  bileşen yerleşimi)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Uyumlu paketler normal Plugin köküne kurulur ve
aynı listeleme/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Günümüzde paket Skills, Claude
command-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` /
manifest tarafından bildirilen `lspServers` varsayılanları, Cursor command-skills ve uyumlu
Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri
tanılama/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.

### Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Yalnızca yüklenmiş Plugin'leri göstermek için `--enabled` kullanın. Tablo görünümünden
kaynak/orijin/sürüm/etkinleştirme
meta verisi içeren Plugin başına ayrıntı satırlarına geçmek için `--verbose` kullanın. Makine tarafından okunabilir envanter artı registry
tanılamaları için `--json` kullanın.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağlı kurulumlar, yönetilen bir kurulum hedefi üzerine kopyalamak yerine
kaynak yolu yeniden kullandığı için `--link` ile `--force` desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenmiş tam spec'i (`name@version`)
`plugins.installs` içine kaydetmek için npm kurulumlarında `--pin` kullanın.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries`, `plugins.installs`,
Plugin allowlist'inden ve uygunsa bağlı `plugins.load.paths` girdilerinden kaldırır.
Active Memory Plugin'leri için bellek yuvası `memory-core` olarak sıfırlanır.

Varsayılan olarak uninstall ayrıca etkin
state-dir Plugin kökü altındaki Plugin kurulum dizinini de kaldırır.
Dosyaları diskte tutmak için
`--keep-files` kullanın.

`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler `plugins.installs` içindeki izlenen kurulumlara ve `hooks.internal.installs` içindeki izlenen hook-pack
kurulumlarına uygulanır.

Bir Plugin kimliği verdiğinizde OpenClaw o
Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, önceden saklanmış `@beta` gibi dist-tag'lerin ve tam sabitlenmiş
sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

Npm kurulumları için bir dist-tag
veya tam sürüm içeren açık bir npm paket spec'i de verebilirsiniz. OpenClaw bu paket adını yeniden izlenen Plugin
kaydıyla eşleştirir, kurulu Plugin'i günceller ve gelecekteki
kimlik tabanlı güncellemeler için yeni npm spec'ini kaydeder.

Sürüm veya etiket olmadan npm paket adını vermek de izlenen
Plugin kaydına geri çözülür. Bir Plugin tam bir sürüme sabitlendiyse ve
onu yeniden registry'nin varsayılan yayın hattına taşımak istediğinizde bunu kullanın.

Canlı bir npm güncellemesinden önce OpenClaw kurulu paket sürümünü
npm registry meta verisiyle denetler. Kurulu sürüm ve kaydedilmiş artifact
kimliği zaten çözümlenmiş hedefle eşleşiyorsa güncelleme indirme,
yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

Saklanmış bir bütünlük hash'i varsa ve getirilen artifact hash'i değişirse,
OpenClaw bunu npm artifact kayması olarak değerlendirir. Etkileşimli
`openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve
devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları
çağıran açık bir devam politikası sağlamadıkça güvenli şekilde başarısız olur.

`--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında
yerleşik tehlikeli kod tarama yanlış pozitifleri için bir
acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke engellerini
veya tarama-başarısızlığı engellemeyi aşmaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack
güncellemelerine değil.

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir Plugin için derin içgözlem. Kimliği, yükleme durumunu, kaynağı,
kayıtlı yetenekleri, hook'ları, tools'ları, komutları, hizmetleri, gateway yöntemlerini,
HTTP yollarını, ilke bayraklarını, tanılamaları, kurulum meta verisini, paket yeteneklerini
ve algılanan MCP veya LSP sunucu desteğini gösterir.

Her Plugin, çalışma zamanında gerçekte ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — tools/commands/services var ama yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin shapes](/tr/plugins/architecture#plugin-shapes) sayfasına bakın.

`--json` bayrağı, betik yazma ve
denetim için uygun makine tarafından okunabilir bir rapor çıktısı verir.

`inspect --all`, şekil, yetenek türleri,
uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo üretir.

`info`, `inspect` için bir takma addır.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve
uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues
detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül-şekli hataları için
tanılama çıktısına kompakt bir dışa-aktarım-şekli özeti eklemek üzere
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir marketplace yolu, bir `marketplace.json` yolu,
`owner/repo` gibi bir GitHub kısa yazımı, bir GitHub repo URL'si veya bir git URL'si kabul eder. `--json`,
çözümlenmiş kaynak etiketini ve ayrıştırılmış marketplace manifest'ini
ve Plugin girdilerini yazdırır.
