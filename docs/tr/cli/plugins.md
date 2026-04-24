---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
summary: '`openclaw plugins` için CLI başvurusu (listeleme, kurulum, pazar yeri, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-24T15:21:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway Plugin'lerini, hook paketlerini ve uyumlu paketleri yönetin.

İlgili:

- Plugin sistemi: [Plugin'ler](/tr/tools/plugin)
- Paket uyumluluğu: [Plugin paketleri](/tr/plugins/bundles)
- Plugin manifesti + şema: [Plugin manifesti](/tr/plugins/manifest)
- Güvenlik sertleştirme: [Güvenlik](/tr/gateway/security)

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

Paket halinde gelen Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paket halindeki model sağlayıcıları, paket halindeki konuşma sağlayıcıları ve paket halindeki tarayıcı Plugin'i); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema ile birlikte `openclaw.plugin.json` içermelidir (`configSchema`, boş olsa bile). Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/info çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini de gösterir.

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

Çıplak paket adları önce ClawHub'a, ardından npm'e karşı kontrol edilir. Güvenlik notu: Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.

`plugins` bölümünüz tek dosyalık bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` işlemleri bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve yan override'lara sahip include'lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Config includes](/tr/gateway/configuration) bölümüne bakın.

Yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Belgelenmiş tek istisna, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğini kabul eden Plugin'ler için dar kapsamlı bir paket Plugin kurtarma yoludur.

`--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulu olan bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yol, arşiv, ClawHub paketi veya npm artifact'inden bilerek yeniden kurarken bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

Zaten kurulu olan bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal bir yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut kurulumu farklı bir kaynaktan gerçekten üzerine yazmak istiyorsanız da `plugins install <package> --force` komutuna yönlendirir.

`--pin` yalnızca npm kurulumları için geçerlidir. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec yerine marketplace kaynak meta verisini kalıcı olarak saklar.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile kurulumun devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **aşmaz** ve tarama başarısızlıklarını da **aşmaz**.

Bu CLI bayrağı Plugin install/update akışları için geçerlidir. Gateway destekli skill bağımlılık kurulumlarında eşleşen `dangerouslyForceUnsafeInstall` istek override'ı kullanılırken, `openclaw skills install` ayrı bir ClawHub skill indirme/kurma akışı olarak kalır.

`plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için paket kurulumunu değil, `openclaw hooks` komutunu kullanın.

Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Bağımlılık kurulumları güvenlik için `--ignore-scripts` ile çalışır.

Çıplak spec'ler ve `@latest`, kararlı iz üzerinde kalır. npm bunlardan birini bir ön sürüme çözerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketi veya `@1.2.3-beta.4` gibi tam bir ön sürüm kullanarak açıkça katılmanızı ister.

Çıplak bir kurulum spec'i paket halindeki bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw paket halindeki Plugin'i doğrudan kurar. Aynı adlı bir npm paketini kurmak için açık bir scoped spec kullanın (örneğin `@scope/diffs`).

Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace kurulumları da desteklenir.

ClawHub kurulumları açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak npm-güvenli Plugin spec'leri için de öncelikle ClawHub'ı tercih eder. Yalnızca ClawHub'da bu paket veya sürüm yoksa npm'e geri döner:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw paket arşivini ClawHub'dan indirir, duyurulan Plugin API / minimum gateway uyumluluğunu denetler, ardından normal arşiv yolu üzerinden kurar. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verisini korur.

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` içindeki yerel registry önbelleğinde varsa `plugin@marketplace` kısayolunu kullanın:

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
- `owner/repo` gibi bir GitHub depo kısayolu
- `https://github.com/owner/repo` gibi bir GitHub depo URL'si
- bir git URL'si

GitHub veya git üzerinden yüklenen uzak marketplace'lerde Plugin girdileri klonlanan marketplace deposunun içinde kalmalıdır. OpenClaw bu depodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve yol dışı diğer Plugin kaynaklarını reddeder.

Yerel yollar ve arşivler için OpenClaw otomatik olarak şunları algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/info/etkinleştir/devre dışı bırak akışına katılır. Bugün paket skill'leri, Claude command-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook dizinleri desteklenmektedir; algılanan diğer paket yetenekleri tanılama/info içinde gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.

### Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Yalnızca yüklenmiş Plugin'leri göstermek için `--enabled` kullanın. Tablo görünümünden Plugin başına ayrıntı satırlarına geçmek için `--verbose` kullanın; burada source/origin/version/activation meta verileri gösterilir. Makine tarafından okunabilir envanter ve registry tanılamaları için `--json` kullanın.

`plugins list`, geçerli CLI ortamı ve yapılandırmadan keşif çalıştırır. Bir Plugin'in etkinleştirilip etkinleştirilmediğini / yüklenebilir olup olmadığını kontrol etmek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı sondası değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --json`, modül yüklü inceleme geçişinden gelen kayıtlı hook'ları ve tanılamaları gösterir.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, servis/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paket halinde gelmeyen konuşma hook'ları (`llm_input`, `llm_output`, `agent_end`) için `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.

Yerel bir dizini kopyalamamak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolu yeniden kullandığından, `--force` ile `--link` desteklenmez.

Varsayılan davranışı sabitlenmemiş halde tutarken çözülmüş tam spec'i (`name@version`) `plugins.installs` içine kaydetmek için npm kurulumlarında `--pin` kullanın.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, `plugins.entries`, `plugins.installs`, Plugin allowlist'i ve uygun olduğunda bağlantılı `plugins.load.paths` girdilerinden Plugin kayıtlarını kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

Varsayılan olarak uninstall, etkin state-dir Plugin kökü altındaki Plugin kurulum dizinini de kaldırır. Dosyaları diskte tutmak için `--keep-files` kullanın.

`--keep-config`, kullanımdan kaldırılmış bir diğer ad olarak `--keep-files` yerine desteklenir.

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, `plugins.installs` içindeki izlenen kurulumlara ve `hooks.internal.installs` içindeki izlenen hook-paket kurulumlarına uygulanır.

Bir Plugin kimliği verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanan dist-tag'lerin ve sabitlenmiş tam sürümlerin sonraki `update <id>` çalıştırmalarında da kullanılmaya devam edeceği anlamına gelir.

Npm kurulumlarında, bir dist-tag veya tam sürümle açık bir npm paket spec'i de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözer, o kurulu Plugin'i günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm spec'ini kaydeder.

Sürüm veya etiket olmadan npm paket adını vermek de izlenen Plugin kaydına geri çözer. Bir Plugin tam bir sürüme sabitlenmişse ve bunu yeniden registry'nin varsayılan sürüm hattına taşımak istiyorsanız bunu kullanın.

Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry meta verilerine göre kontrol eder. Kurulu sürüm ve kaydedilmiş artifact kimliği zaten çözülmüş hedefle eşleşiyorsa, güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

Kayıtlı bir bütünlük hash'i mevcut olduğunda ve getirilen artifact hash'i değiştiğinde, OpenClaw bunu npm artifact kayması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam etme ilkesi sağlamadıkça kapalı şekilde başarısız olur.

`--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taramasındaki yanlış pozitifler için acil durum override'ı olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke engellerini veya tarama başarısızlığı engellemesini aşmaz ve yalnızca Plugin güncellemelerine uygulanır, hook-paket güncellemelerine değil.

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir Plugin için derinlemesine iç gözlem. Kimliği, yükleme durumunu, kaynağı, kaydedilmiş yetenekleri, hook'ları, araçları, komutları, servisleri, gateway yöntemlerini, HTTP yollarını, ilke bayraklarını, tanılamaları, kurulum meta verisini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (örneğin yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (örneğin metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/servisler var ama yetenek yok

Yetenek modeli hakkında daha fazlası için [Plugin shapes](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

`--json` bayrağı, betik yazma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar.

`inspect --all`, shape, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur.

`info`, `inspect` için bir diğer addır.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hatalarında, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek için `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısayolunu, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketini ve ayrıştırılmış marketplace manifesti ile Plugin girdilerini yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin'leri](/tr/plugins/community)
