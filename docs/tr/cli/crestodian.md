---
read_when:
    - '`openclaw` komutunu herhangi bir alt komut olmadan çalıştırıyorsunuz ve Crestodian''ı anlamak istiyorsunuz'
    - OpenClaw’ı incelemek veya onarmak için yapılandırmasız güvenli bir yola ihtiyacınız var
    - Mesaj kanalı kurtarma modunu tasarlıyorsunuz veya etkinleştiriyorsunuz
summary: Crestodian için CLI başvurusu ve güvenlik modeli, yapılandırmasız güvenli kurulum ve onarım yardımcısı
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian, OpenClaw’ın yerel kurulum, onarım ve yapılandırma yardımcısıdır. Normal agent yolu bozulduğunda da erişilebilir kalacak şekilde tasarlanmıştır.

`openclaw` komutunu herhangi bir alt komut olmadan çalıştırmak, Crestodian’ı etkileşimli bir terminalde başlatır. `openclaw crestodian` çalıştırmak da aynı yardımcıyı açıkça başlatır.

## Crestodian ne gösterir

Başlangıçta, etkileşimli Crestodian, `openclaw tui` tarafından kullanılan aynı TUI kabuğunu Crestodian sohbet arka ucuyla açar. Sohbet günlüğü kısa bir karşılama ile başlar:

- Crestodian’ın ne zaman başlatılacağı
- Crestodian’ın gerçekten kullandığı model veya deterministik planlayıcı yolu
- yapılandırmanın geçerliliği ve varsayılan agent
- ilk başlangıç yoklamasından elde edilen Gateway erişilebilirliği
- Crestodian’ın atabileceği bir sonraki hata ayıklama eylemi

Başlamak için gizli bilgileri dökmez veya plugin CLI komutlarını yüklemez. TUI yine de normal üstbilgi, sohbet günlüğü, durum satırı, altbilgi, otomatik tamamlama ve düzenleyici denetimlerini sağlar.

Yapılandırma yolu, docs/source yolları, yerel CLI yoklamaları, API anahtarı varlığı, agent’lar, model ve Gateway ayrıntılarını içeren ayrıntılı envanter için `status` kullanın.

Crestodian, normal agent’larla aynı OpenClaw referans keşfini kullanır. Bir Git checkout içinde, kendisini yerel `docs/` ve yerel kaynak ağacına yönlendirir. Bir npm paket kurulumunda ise paketle gelen docs’u kullanır ve
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) adresine bağlanır; docs yeterli olmadığında kaynağı incelemeniz için açık yönlendirme sunar.

## Örnekler

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI içinde:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Güvenli başlangıç

Crestodian’ın başlangıç yolu bilerek küçüktür. Şu durumlarda çalışabilir:

- `openclaw.json` yok
- `openclaw.json` geçersiz
- Gateway kapalı
- plugin komut kaydı kullanılamıyor
- henüz hiçbir agent yapılandırılmamış

`openclaw --help` ve `openclaw --version` yine normal hızlı yolları kullanır.
Etkileşimsiz `openclaw`, kök yardım çıktısını yazdırmak yerine kısa bir iletiyle çıkar; çünkü alt komutsuz ürün Crestodian’dır.

## İşlemler ve onay

Crestodian, yapılandırmayı gelişigüzel düzenlemek yerine türlenmiş işlemler kullanır.

Salt okunur işlemler hemen çalışabilir:

- genel görünümü göster
- agent’ları listele
- model/backend durumunu göster
- `status` veya sağlık denetimleri çalıştır
- Gateway erişilebilirliğini denetle
- etkileşimli düzeltmeler olmadan `doctor` çalıştır
- yapılandırmayı doğrula
- denetim günlüğü yolunu göster

Kalıcı işlemler, etkileşimli modda konuşma içi onay gerektirir; doğrudan komut için `--yes` geçmediğiniz sürece:

- yapılandırma yazma
- `config set` çalıştırma
- `config set-ref` üzerinden desteklenen SecretRef değerlerini ayarlama
- kurulum/onboarding bootstrap çalıştırma
- varsayılan modeli değiştirme
- Gateway’i başlatma, durdurma veya yeniden başlatma
- agent oluşturma
- yapılandırmayı veya durumu yeniden yazan `doctor` onarımlarını çalıştırma

Uygulanan yazmalar şuraya kaydedilir:

```text
~/.openclaw/audit/crestodian.jsonl
```

Keşif işlemleri denetlenmez. Yalnızca uygulanan işlemler ve yazmalar günlüğe alınır.

`openclaw onboard --modern`, modern onboarding önizlemesi olarak Crestodian’ı başlatır.
Düz `openclaw onboard` hâlâ klasik onboarding’i çalıştırır.

## Kurulum Bootstrap

`setup`, sohbet öncelikli onboarding bootstrap’idir. Yalnızca türlenmiş yapılandırma işlemleri üzerinden yazar ve önce onay ister.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Hiçbir model yapılandırılmamışsa, setup bu sırayla ilk kullanılabilir backend’i seçer ve size ne seçtiğini söyler:

- zaten yapılandırılmışsa mevcut açık model
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Hiçbiri kullanılabilir değilse, setup yine de varsayılan çalışma alanını yazar ve modeli ayarsız bırakır. Codex/Claude Code kurun veya giriş yapın ya da `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` sağlayın, ardından setup’ı yeniden çalıştırın.

## Model destekli planlayıcı

Crestodian her zaman deterministik modda başlar. Deterministik ayrıştırıcının anlamadığı belirsiz komutlar için yerel Crestodian, OpenClaw’ın normal çalışma zamanı yolları üzerinden tek bir sınırlı planlayıcı turu yapabilir. Önce yapılandırılmış OpenClaw modelini kullanır. Henüz yapılandırılmış bir model kullanılamıyorsa, makinede zaten bulunan yerel çalışma zamanlarına geri dönebilir:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` ile `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Model destekli planlayıcı yapılandırmayı doğrudan değiştiremez. İsteği Crestodian’ın türlenmiş komutlarından birine çevirmelidir; ardından normal onay ve denetim kuralları uygulanır. Crestodian, herhangi bir şeyi çalıştırmadan önce kullandığı modeli ve yorumlanan komutu yazdırır. Yapılandırmasız geri dönüş planlayıcı turları geçicidir, çalışma zamanının desteklediği yerlerde araçlar devre dışıdır ve geçici bir çalışma alanı/oturum kullanır.

Mesaj kanalı kurtarma modu model destekli planlayıcıyı kullanmaz. Uzak kurtarma deterministik kalır; böylece bozuk veya ele geçirilmiş normal agent yolu yapılandırma düzenleyicisi olarak kullanılamaz.

## Bir agent’a geçiş

Crestodian’dan çıkmak ve normal TUI’yi açmak için doğal dil seçicisi kullanın:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` ve `openclaw terminal` yine doğrudan normal agent TUI’sini açar. Crestodian’ı başlatmazlar.

Normal TUI’ye geçtikten sonra Crestodian’a dönmek için `/crestodian` kullanın.
İsterseniz devam isteği ekleyebilirsiniz:

```text
/crestodian
/crestodian restart gateway
```

TUI içindeki agent geçişleri, `/crestodian` seçeneğinin mevcut olduğunu belirten bir iz bırakır.

## Mesaj kurtarma modu

Mesaj kurtarma modu, Crestodian için mesaj kanalı giriş noktasıdır. Normal agent’ınız öldüğünde ama WhatsApp gibi güvenilir bir kanal hâlâ komut alabiliyorsa bunun içindir.

Desteklenen metin komutu:

- `/crestodian <request>`

Operatör akışı:

```text
Siz, güvenilir bir sahip DM içinde: /crestodian status
OpenClaw: Crestodian kurtarma modu. Gateway erişilebilir: hayır. Yapılandırma geçerli: hayır.
Siz: /crestodian restart gateway
OpenClaw: Plan: Gateway'i yeniden başlat. Uygulamak için /crestodian yes ile yanıt verin.
Siz: /crestodian yes
OpenClaw: Uygulandı. Denetim kaydı yazıldı.
```

Agent oluşturma işlemi, yerel istemden veya kurtarma modundan da kuyruğa alınabilir:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Uzak kurtarma modu bir yönetici yüzeyidir. Normal sohbet gibi değil, uzak yapılandırma onarımı gibi ele alınmalıdır.

Uzak kurtarma için güvenlik sözleşmesi:

- Sandbox etkin olduğunda devre dışıdır. Bir agent/oturum sandbox içindeyse, Crestodian uzak kurtarmayı reddetmeli ve yerel CLI onarımının gerektiğini açıklamalıdır.
- Varsayılan etkin durum `auto`dur: uzak kurtarmaya yalnızca çalışma zamanının zaten sandbox’sız yerel yetkiye sahip olduğu güvenilir YOLO işletiminde izin verilir.
- Açık bir sahip kimliği gerekir. Kurtarma; joker gönderici kurallarını, açık grup ilkesini, kimliği doğrulanmamış Webhook’ları veya anonim kanalları kabul etmemelidir.
- Varsayılan olarak yalnızca sahip DM’leri. Grup/kanal kurtarması açık katılım gerektirir ve yine de onay istemlerini sahip DM’sine yönlendirmelidir.
- Uzak kurtarma yerel TUI’yi açamaz veya etkileşimli bir agent oturumuna geçemez. Agent devri için yerel `openclaw` kullanın.
- Kalıcı yazmalar, kurtarma modunda bile yine onay gerektirir.
- Kanal, hesap, gönderici, oturum anahtarı, işlem, önceki yapılandırma karması ve sonraki yapılandırma karması dahil olmak üzere uygulanan her kurtarma işlemi denetlenmelidir.
- Gizli bilgileri asla yankılamayın. SecretRef incelemesi değerleri değil, kullanılabilirliği bildirmelidir.
- Gateway canlıysa, Gateway türlenmiş işlemleri tercih edin. Gateway ölü ise yalnızca normal agent döngüsüne bağımlı olmayan en küçük yerel onarım yüzeyini kullanın.

Yapılandırma biçimi:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` şu değerleri kabul etmelidir:

- `"auto"`: varsayılan. Yalnızca etkin çalışma zamanı YOLO ise ve sandbox kapalıysa izin ver.
- `false`: mesaj kanalı kurtarmasına asla izin verme.
- `true`: sahip/kanal denetimleri geçerse kurtarmaya açıkça izin ver. Bu yine de sandbox reddini atlamamalıdır.

Varsayılan `"auto"` YOLO duruşu şöyledir:

- sandbox modu `off` olarak çözülür
- `tools.exec.security` `full` olarak çözülür
- `tools.exec.ask` `off` olarak çözülür

Uzak kurtarma şu Docker lane ile kapsanır:

```bash
pnpm test:docker:crestodian-rescue
```

Yapılandırmasız yerel planlayıcı geri dönüşü şu testle kapsanır:

```bash
pnpm test:docker:crestodian-planner
```

İsteğe bağlı canlı kanal komut yüzeyi smoke testi, `/crestodian status` artı
kurtarma işleyicisi üzerinden kalıcı bir onay gidiş-dönüşünü denetler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian üzerinden taze yapılandırmasız kurulum şu testle kapsanır:

```bash
pnpm test:docker:crestodian-first-run
```

Bu lane boş bir durum diziniyle başlar, çıplak `openclaw` çağrısını Crestodian’a yönlendirir,
varsayılan modeli ayarlar, ek bir agent oluşturur, Discord’u
plugin etkinleştirmesi artı token SecretRef üzerinden yapılandırır, yapılandırmayı doğrular ve denetim
günlüğünü kontrol eder. QA Lab ayrıca aynı Ring 0 akışı için repo destekli bir senaryoya sahiptir:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## İlgili

- [CLI reference](/tr/cli)
- [Doctor](/tr/cli/doctor)
- [TUI](/tr/cli/tui)
- [Sandbox](/tr/cli/sandbox)
- [Security](/tr/cli/security)
