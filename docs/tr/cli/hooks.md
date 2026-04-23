---
read_when:
    - Aracı kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (aracı kancaları)'
title: kancalar
x-i18n:
    generated_at: "2026-04-23T09:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Aracı kancalarını yönetin (`/new`, `/reset` ve Gateway başlatma gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Kancalar: [Hooks](/tr/automation/hooks)
- Plugin kancaları: [Plugin hooks](/tr/plugins/architecture#provider-runtime-hooks)

## Tüm Kancaları Listele

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve paketlenmiş dizinlerden keşfedilen tüm kancaları listeleyin.
Gateway başlatma, en az bir iç kanca yapılandırılana kadar iç kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları göster (gereksinimler karşılanmış)
- `--json`: Çıktıyı JSON olarak ver
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgi göster

**Örnek çıktı:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway başlatıldığında BOOT.md dosyasını çalıştır
  📎 bootstrap-extra-files ✓ - Aracı önyüklemesi sırasında ek çalışma alanı önyükleme dosyalarını ekle
  📝 command-logger ✓ - Tüm komut olaylarını merkezi bir denetim dosyasına kaydet
  💾 session-memory ✓ - /new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet
```

**Örnek (ayrıntılı):**

```bash
openclaw hooks list --verbose
```

Uygun olmayan kancalar için eksik gereksinimleri gösterir.

**Örnek (JSON):**

```bash
openclaw hooks list --json
```

Programatik kullanım için yapılandırılmış JSON döndürür.

## Kanca Bilgilerini Al

```bash
openclaw hooks info <name>
```

Belirli bir kanca hakkında ayrıntılı bilgi gösterin.

**Bağımsız değişkenler:**

- `<name>`: Kanca adı veya kanca anahtarı (ör. `session-memory`)

**Seçenekler:**

- `--json`: Çıktıyı JSON olarak ver

**Örnek:**

```bash
openclaw hooks info session-memory
```

**Çıktı:**

```
💾 session-memory ✓ Ready

/new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Kanca Uygunluğunu Kontrol Et

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterin (kaçının hazır, kaçının hazır olmadığını).

**Seçenekler:**

- `--json`: Çıktıyı JSON olarak ver

**Örnek çıktı:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bir Kancayı Etkinleştir

```bash
openclaw hooks enable <name>
```

Yapılandırmanıza ekleyerek belirli bir kancayı etkinleştirin (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` olarak görünür ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Bağımsız değişkenler:**

- `<name>`: Kanca adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Enabled hook: 💾 session-memory
```

**Yaptıkları:**

- Kancanın var olup olmadığını ve uygun olup olmadığını kontrol eder
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Kanca `<workspace>/hooks/` içinden geldiyse, Gateway'in onu yüklemesi için
bu açık katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın (macOS'te menü çubuğu uygulamasını yeniden başlatın veya geliştirmede Gateway sürecinizi yeniden başlatın).

## Bir Kancayı Devre Dışı Bırak

```bash
openclaw hooks disable <name>
```

Yapılandırmanızı güncelleyerek belirli bir kancayı devre dışı bırakın.

**Bağımsız değişkenler:**

- `<name>`: Kanca adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Disabled hook: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahibi olan Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca Paketlerini Yükle

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Kanca paketlerini birleşik Plugin yükleyicisi üzerinden yükleyin.

`openclaw hooks install` hâlâ bir uyumluluk takma adı olarak çalışır, ancak kullanımdan kaldırma uyarısı yazdırır
ve `openclaw plugins install` komutuna yönlendirir.

Npm belirtimleri **yalnızca kayıt defteri içindir** (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalıştırılır.

Boş belirtimler ve `@latest` kararlı izde kalır. npm bunlardan herhangi birini
bir ön sürüme çözerse, OpenClaw durur ve `@beta`/`@rc` gibi bir
ön sürüm etiketi veya tam bir ön sürüm numarasıyla açıkça katılım yapmanızı ister.

**Yaptıkları:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Yüklenen kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Kurulumu `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel bir dizini bağla (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm kurulumlarını `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydet

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Yerel dizin
openclaw plugins install ./my-hook-pack

# Yerel arşiv
openclaw plugins install ./my-hook-pack.zip

# NPM paketi
openclaw plugins install @openclaw/my-hook-pack

# Kopyalamadan yerel bir dizini bağla
openclaw plugins install -l ./my-hook-pack
```

Bağlanmış kanca paketleri, çalışma alanı kancaları olarak değil,
operatör tarafından yapılandırılmış bir dizinden gelen yönetilen kancalar olarak değerlendirilir.

## Kanca Paketlerini Güncelle

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı kanca paketlerini birleşik Plugin güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` hâlâ bir uyumluluk takma adı olarak çalışır, ancak kullanımdan kaldırma uyarısı yazdırır
ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini güncelle
- `--dry-run`: Yazmadan neyin değişeceğini göster

Kayıtlı bir bütünlük özeti varsa ve getirilen yapıt özeti değişirse,
OpenClaw devam etmeden önce bir uyarı yazdırır ve onay ister. CI/etkileşimsiz çalıştırmalarda
istemleri atlamak için genel `--yes` kullanın.

## Paketlenmiş Kancalar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek önyükleme dosyaları ekler (örneğin monorepo-yerel `AGENTS.md` / `TOOLS.md`).

**Etkinleştir:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Bkz.:** [bootstrap-extra-files belgeleri](/tr/automation/hooks#bootstrap-extra-files)

### command-logger

Tüm komut olaylarını merkezi bir denetim dosyasına kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable command-logger
```

**Çıktı:** `~/.openclaw/logs/commands.log`

**Günlükleri görüntüle:**

```bash
# Son komutlar
tail -n 20 ~/.openclaw/logs/commands.log

# Güzel biçimlendir
cat ~/.openclaw/logs/commands.log | jq .

# Eyleme göre filtrele
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bkz.:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında `BOOT.md` dosyasını çalıştırır (kanallar başladıktan sonra).

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)
