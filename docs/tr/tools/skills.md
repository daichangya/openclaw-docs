---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitleme veya yükleme kurallarını değiştirme
summary: 'Skills: yönetilen ve çalışma alanı, geçit kuralları ve yapılandırma/ortam bağlama'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** Skills klasörleri kullanır. Her Skill, YAML frontmatter ve yönergeler içeren bir `SKILL.md` dosyası barındıran bir dizindir. OpenClaw, **paketlenmiş Skills** ile isteğe bağlı yerel geçersiz kılmaları yükler ve bunları yükleme sırasında ortam, yapılandırma ve ikili varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw, Skills öğelerini şu kaynaklardan yükler:

1. **Ek Skill klasörleri**: `skills.load.extraDirs` ile yapılandırılır
2. **Paketlenmiş Skills**: kurulumla birlikte gelir (npm paketi veya OpenClaw.app)
3. **Yönetilen/yerel Skills**: `~/.openclaw/skills`
4. **Kişisel ajan Skills**: `~/.agents/skills`
5. **Proje ajan Skills**: `<workspace>/.agents/skills`
6. **Çalışma alanı Skills**: `<workspace>/skills`

Bir Skill adı çakışırsa öncelik sırası şöyledir:

`<workspace>/skills` (en yüksek) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills → `skills.load.extraDirs` (en düşük)

## Ajan başına ve paylaşılan Skills

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır. Bu şu anlama gelir:

- **Ajan başına Skills** yalnızca o ajan için `<workspace>/skills` altında bulunur.
- **Proje ajan Skills** `<workspace>/.agents/skills` altında bulunur ve
  normal çalışma alanı `skills/` klasöründen önce o çalışma alanına uygulanır.
- **Kişisel ajan Skills** `~/.agents/skills` altında bulunur ve bu makinedeki
  çalışma alanları genelinde uygulanır.
- **Paylaşılan Skills** `~/.openclaw/skills` altında bulunur (yönetilen/yerel) ve
  aynı makinedeki **tüm ajanlar** tarafından görülebilir.
- **Paylaşılan klasörler** ayrıca birden fazla ajan tarafından kullanılan ortak bir
  Skill paketi istiyorsanız `skills.load.extraDirs` üzerinden de eklenebilir (en düşük öncelik).

Aynı Skill adı birden fazla yerde varsa, normal öncelik uygulanır:
çalışma alanı kazanır, ardından proje ajan Skills, sonra kişisel ajan Skills,
sonra yönetilen/yerel, sonra paketlenmiş, sonra ek dizinler.

## Ajan Skill izin listeleri

Skill **konumu** ile Skill **görünürlüğü** ayrı denetimlerdir.

- Konum/öncelik, aynı adlı bir Skill'in hangi kopyasının kazanacağını belirler.
- Ajan izin listeleri, bir ajanın gerçekten hangi görünür Skills öğelerini kullanabileceğini belirler.

Paylaşılan bir taban için `agents.defaults.skills` kullanın, ardından ajan başına
`agents.list[].skills` ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // Skill yok
    ],
  },
}
```

Kurallar:

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını kullanmayın.
- `agents.defaults.skills` alanını devralmak için `agents.list[].skills` alanını kullanmayın.
- Hiç Skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için son kümedir;
  varsayılanlarla birleşmez.

OpenClaw, etkili ajan Skill kümesini prompt oluşturma, Skill
slash komutu keşfi, sandbox eşitleme ve Skill anlık görüntüleri genelinde uygular.

## Plugin'ler + Skills

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
(kök Plugin dizinine göre yollar) kendi Skills öğelerini gönderebilir. Plugin Skills, Plugin etkin olduğunda yüklenir.
Bu, araç açıklamasına sığmayacak kadar uzun olan ancak
Plugin kurulu olduğunda her zaman kullanılabilir olması gereken araca özgü işletim
kılavuzları için doğru yerdir; örneğin tarayıcı Plugin'i, çok adımlı tarayıcı denetimi için
bir `browser-automation` Skill'i gönderir. Günümüzde bu
dizinler `skills.load.extraDirs` ile aynı düşük öncelikli yolda
birleştirilir, bu nedenle aynı adlı bir paketlenmiş, yönetilen, ajan veya çalışma alanı
Skill'i bunların üzerine yazabilir.
Bunları Plugin'in yapılandırma girdisindeki `metadata.openclaw.requires.config` ile geçitleyebilirsiniz.
Keşif/yapılandırma için [Plugin'ler](/tr/tools/plugin) ve bu Skills öğelerinin öğrettiği
araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Skill Workshop

İsteğe bağlı, deneysel Skill Workshop Plugin'i, ajan çalışması sırasında gözlemlenen
yeniden kullanılabilir prosedürlerden çalışma alanı Skills oluşturabilir veya güncelleyebilir.
Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` altına yazar, oluşturulan içeriği tarar,
bekleyen onayı veya otomatik güvenli yazmayı destekler, güvenli olmayan
önerileri karantinaya alır ve başarılı yazmalardan sonra Skill anlık görüntüsünü yeniler; böylece yeni
Skills, Gateway yeniden başlatılmadan kullanılabilir hale gelebilir.

“Bir dahaki sefere GIF atfını doğrula” gibi düzeltmelerin veya medya QA kontrol listeleri gibi
zor kazanılmış iş akışlarının kalıcı prosedürel yönergeler haline gelmesini istediğinizde bunu kullanın.
Bekleyen onayla başlayın; otomatik yazmaları yalnızca güvenilir çalışma alanlarında, önerilerini inceledikten sonra kullanın.
Tam kılavuz:
[Skill Workshop Plugin](/tr/plugins/skill-workshop).

## ClawHub (kurulum + eşitleme)

ClawHub, OpenClaw için herkese açık Skills kayıt defteridir. Şuradan göz atın:
[https://clawhub.ai](https://clawhub.ai). Skills keşfetmek/kurmak/güncellemek için yerel `openclaw skills`
komutlarını veya yayımlama/eşitleme iş akışlarına ihtiyaç duyduğunuzda ayrı `clawhub` CLI'ı kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

Yaygın akışlar:

- Çalışma alanınıza bir Skill kurun:
  - `openclaw skills install <skill-slug>`
- Yüklü tüm Skills öğelerini güncelleyin:
  - `openclaw skills update --all`
- Eşitleyin (tara + güncellemeleri yayımla):
  - `clawhub sync --all`

Yerel `openclaw skills install`, etkin çalışma alanının `skills/`
dizinine kurar. Ayrı `clawhub` CLI'ı da mevcut çalışma dizininizin altındaki `./skills` içine kurar
(veya yapılandırılmış OpenClaw çalışma alanına geri döner).
OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak algılar.

## Güvenlik notları

- Üçüncü taraf Skills öğelerini **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
- Güvenilmeyen girdiler ve riskli araçlar için sandbox çalıştırmaları tercih edin. Bkz. [Sandboxing](/tr/gateway/sandboxing).
- Çalışma alanı ve ek dizin Skill keşfi yalnızca çözülmüş realpath'i yapılandırılan kök içinde kalan Skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli Skill bağımlılık kurulumları (`skills.install`, onboarding ve Skills ayarları UI'si), yükleyici meta verilerini çalıştırmadan önce yerleşik tehlikeli kod tarayıcısını çalıştırır. Çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça `critical` bulgular varsayılan olarak engellenir; şüpheli bulgular ise yalnızca uyarı verir.
- `openclaw skills install <slug>` farklıdır: bir ClawHub Skill klasörünü çalışma alanına indirir ve yukarıdaki yükleyici-meta veri yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli bilgileri **host** sürecine
  o ajan turu için enjekte eder (sandbox'a değil). Gizli bilgileri prompt'lardan ve günlüklerden uzak tutun.
- Daha geniş bir tehdit modeli ve kontrol listeleri için bkz. [Güvenlik](/tr/gateway/security).

## Biçim (AgentSkills + Pi uyumlu)

`SKILL.md` en azından şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notlar:

- Düzen/amaç için AgentSkills belirtimini izliyoruz.
- Gömülü ajan tarafından kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter anahtarlarını destekler.
- `metadata`, **tek satırlı bir JSON nesnesi** olmalıdır.
- Skill klasörü yoluna başvurmak için yönergelerde `{baseDir}` kullanın.
- İsteğe bağlı frontmatter anahtarları:
  - `homepage` — macOS Skills UI'sinde “Website” olarak gösterilen URL (`metadata.openclaw.homepage` üzerinden de desteklenir).
  - `user-invocable` — `true|false` (varsayılan: `true`). `true` olduğunda Skill, kullanıcı slash komutu olarak sunulur.
  - `disable-model-invocation` — `true|false` (varsayılan: `false`). `true` olduğunda Skill, model prompt'undan çıkarılır (kullanıcı çağrısıyla yine de kullanılabilir).
  - `command-dispatch` — `tool` (isteğe bağlı). `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan bir araca yönlendirir.
  - `command-tool` — `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
  - `command-arg-mode` — `raw` (varsayılan). Araç yönlendirmesi için ham argüman dizesini araca iletir (çekirdek ayrıştırma yok).

    Araç şu parametrelerle çağrılır:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, Skills öğelerini `metadata` kullanarak yükleme zamanında **filtreler** (`tek satırlı JSON`):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` altındaki alanlar:

- `always: true` — Skill'i her zaman dahil eder (diğer geçitleri atlar).
- `emoji` — macOS Skills UI'si tarafından kullanılan isteğe bağlı emoji.
- `homepage` — macOS Skills UI'sinde “Website” olarak gösterilen isteğe bağlı URL.
- `os` — isteğe bağlı platform listesi (`darwin`, `linux`, `win32`). Ayarlanırsa Skill yalnızca bu işletim sistemlerinde uygundur.
- `requires.bins` — liste; her biri `PATH` üzerinde bulunmalıdır.
- `requires.anyBins` — liste; en az biri `PATH` üzerinde bulunmalıdır.
- `requires.env` — liste; ortam değişkeni mevcut olmalı **veya** yapılandırmada sağlanmış olmalıdır.
- `requires.config` — doğru değer taşıması gereken `openclaw.json` yolları listesi.
- `primaryEnv` — `skills.entries.<name>.apiKey` ile ilişkili ortam değişkeni adı.
- `install` — macOS Skills UI'si tarafından kullanılan isteğe bağlı yükleyici belirtimleri dizisi (brew/node/go/uv/download).

Eski `metadata.clawdbot` blokları, `metadata.openclaw` olmadığında hâlâ kabul edilir;
böylece daha önce kurulmuş Skills, bağımlılık
geçitlerini ve yükleyici ipuçlarını korur. Yeni ve güncellenmiş Skills
`metadata.openclaw` kullanmalıdır.

Sandboxing hakkında not:

- `requires.bins`, Skill yükleme zamanında **host** üzerinde denetlenir.
- Bir ajan sandbox içindeyse ikili ayrıca **container içinde** de bulunmalıdır.
  Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir image) aracılığıyla kurun.
  `setupCommand`, container oluşturulduktan sonra bir kez çalışır.
  Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök dosya sistemi ve sandbox içinde root kullanıcı gerektirir.
  Örnek: `summarize` Skill'i (`skills/summarize/SKILL.md`), orada çalışması için
  sandbox container içinde `summarize` CLI gerektirir.

Yükleyici örneği:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Notlar:

- Birden fazla yükleyici listelenmişse gateway **tek** bir tercih edilen seçenek seçer (varsa brew, aksi halde node).
- Tüm yükleyiciler `download` ise OpenClaw, mevcut yapıtları görebilmeniz için her girdiyi listeler.
- Yükleyici belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
- Node kurulumları, `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun).
  Bu yalnızca **Skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır (WhatsApp/Telegram için Bun önerilmez).
- Gateway destekli yükleyici seçimi yalnızca node odaklı değil, tercihe dayalıdır:
  yükleme belirtimleri türleri karışık olduğunda OpenClaw, `skills.install.preferBrew`
  etkinse ve `brew` mevcutsa Homebrew'i, ardından `uv`, sonra yapılandırılan
  node yöneticisini, sonra `go` veya `download` gibi diğer geri dönüşleri tercih eder.
- Her yükleme belirtimi `download` ise OpenClaw, tek tercih edilen yükleyiciye indirgemek yerine
  tüm indirme seçeneklerini gösterir.
- Go kurulumları: `go` eksikse ve `brew` mevcutsa, gateway önce Go'yu Homebrew ile kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'in `bin` dizinine ayarlar.
- İndirme kurulumları: `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılanırsa otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw` yoksa Skill her zaman uygundur (`config` içinde devre dışı bırakılmadıkça veya paketlenmiş Skills için `skills.allowBundled` tarafından engellenmedikçe).

## Yapılandırma geçersiz kılmaları (`~/.openclaw/openclaw.json`)

Paketlenmiş/yönetilen Skills açılıp kapatılabilir ve ortam değerleri verilebilir:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Not: Skill adı kısa çizgi içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı anahtarlara izin verir).

OpenClaw'un kendi içinde standart görsel oluşturma/düzenleme istiyorsanız, paketlenmiş
bir Skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki Skill örnekleri özel veya üçüncü taraf iş akışları içindir.

Yerel görsel analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
Yerel görsel oluşturma/düzenleme için `agents.defaults.imageGenerationModel` ile
`image_generate` kullanın. `openai/*`, `google/*`,
`fal/*` veya başka bir sağlayıcıya özgü görsel model seçerseniz, o sağlayıcının kimlik doğrulama/API
anahtarını da ekleyin.

Yapılandırma anahtarları varsayılan olarak **Skill adıyla** eşleşir. Bir Skill
`metadata.openclaw.skillKey` tanımlıyorsa, `skills.entries` altında
o anahtarı kullanın.

Kurallar:

- `enabled: false`, Skill paketlenmiş/kurulu olsa bile onu devre dışı bırakır.
- `env`: değişken süreçte zaten ayarlı değilse **yalnızca o zaman** enjekte edilir.
- `apiKey`: `metadata.openclaw.primaryEnv` bildiren Skills için kolaylıktır.
  Düz metin dizeyi veya SecretRef nesnesini destekler (`{ source, provider, id }`).
- `config`: özel Skill başına alanlar için isteğe bağlı torba; özel anahtarlar burada bulunmalıdır.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlanırsa,
  yalnızca listedeki paketlenmiş Skills uygundur (yönetilen/çalışma alanı Skills etkilenmez).

## Ortam enjeksiyonu (ajan çalıştırması başına)

Bir ajan çalıştırması başladığında OpenClaw:

1. Skill meta verilerini okur.
2. Herhangi bir `skills.entries.<key>.env` veya `skills.entries.<key>.apiKey` değerini
   `process.env` içine uygular.
3. Sistem prompt'unu **uygun** Skills ile oluşturur.
4. Çalıştırma sona erdikten sonra özgün ortamı geri yükler.

Bu, genel bir shell ortamı değil, **ajan çalıştırması kapsamındadır**.

Paketle gelen `claude-cli` arka ucu için OpenClaw, aynı
uygun anlık görüntüyü geçici bir Claude Code Plugin'i olarak da somutlaştırır ve bunu
`--plugin-dir` ile geçirir. Böylece Claude Code kendi yerel Skill çözücüsünü kullanabilirken
OpenClaw yine de öncelik, ajan başına izin listeleri, geçitleme ve
`skills.entries.*` env/API anahtarı enjeksiyonunun sahibi olur. Diğer CLI arka uçları yalnızca
prompt kataloğunu kullanır.

## Oturum anlık görüntüsü (performans)

OpenClaw, bir oturum başladığında uygun Skills öğelerinin anlık görüntüsünü alır ve aynı oturumdaki sonraki turlar için bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler bir sonraki yeni oturumda etkili olur.

Skills, Skills izleyicisi etkin olduğunda veya yeni bir uygun uzak Node göründüğünde oturum ortasında da yenilenebilir (aşağıya bakın). Bunu bir **hot reload** olarak düşünün: yenilenen liste bir sonraki ajan turunda alınır.

Bu oturum için etkili ajan Skill izin listesi değişirse, OpenClaw
görünür Skills öğeleri geçerli ajanla uyumlu kalsın diye anlık görüntüyü yeniler.

## Uzak macOS Node'ları (Linux Gateway)

Gateway Linux üzerinde çalışıyorsa ancak **`system.run` izni verilmiş** bir **macOS Node**
bağlıysa (Exec approvals güvenliği `deny` olarak ayarlı değilse), OpenClaw gerekli
ikili dosyalar o Node üzerinde mevcut olduğunda yalnızca macOS'a özgü Skills öğelerini uygun olarak değerlendirebilir.
Ajan bu Skills öğelerini `host=node` ile `exec` aracı üzerinden çalıştırmalıdır.

Bu, Node'un komut desteğini bildirmesine ve `system.run` aracılığıyla bir ikili yoklamasına dayanır. macOS Node daha sonra çevrimdışı olursa, Skills görünür kalır; çağrılar Node yeniden bağlanana kadar başarısız olabilir.

## Skills izleyicisi (otomatik yenileme)

Varsayılan olarak OpenClaw, Skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde Skills anlık görüntüsünü yükseltir. Bunu `skills.load` altında yapılandırın:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Token etkisi (Skills listesi)

Skills uygun olduğunda OpenClaw, kullanılabilir Skills öğelerinin kompakt bir XML listesini sistem prompt'una enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` aracılığıyla). Maliyet belirleyicidir:

- **Temel ek yük (yalnızca ≥1 Skill olduğunda):** 195 karakter.
- **Skill başına:** 97 karakter + XML-escape uygulanmış `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notlar:

- XML escape, `& < > " '` karakterlerini varlıklara genişletir (`&amp;`, `&lt;` vb.) ve uzunluğu artırır.
- Token sayıları model tokenizer'ına göre değişir. Yaklaşık OpenAI tarzı tahmin ~4 karakter/token şeklindedir; dolayısıyla **97 karakter ≈ 24 token** her Skill için, artı gerçek alan uzunluklarınız.

## Yönetilen Skills yaşam döngüsü

OpenClaw, kurulumun (npm paketi veya OpenClaw.app) bir parçası olarak
temel bir Skill kümesini **paketlenmiş Skills** olarak gönderir. `~/.openclaw/skills`, yerel
geçersiz kılmalar için vardır (örneğin paketlenmiş kopyayı değiştirmeden bir Skill'i
sabitlemek/yamamak). Çalışma alanı Skills kullanıcıya aittir ve ad çakışmalarında her ikisinin de üzerine yazar.

## Yapılandırma başvurusu

Tam yapılandırma şeması için [Skills yapılandırması](/tr/tools/skills-config) bölümüne bakın.

## Daha fazla Skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın.

---

## İlgili

- [Skills oluşturma](/tr/tools/creating-skills) — özel Skills oluşturma
- [Skills yapılandırması](/tr/tools/skills-config) — Skill yapılandırma başvurusu
- [Slash komutları](/tr/tools/slash-commands) — kullanılabilir tüm slash komutları
- [Plugin'ler](/tr/tools/plugin) — Plugin sistemi genel bakışı
