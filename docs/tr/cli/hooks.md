---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-04-25T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Ajan kancalarını yönetin (`/new`, `/reset` ve gateway başlangıcı gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Kancalar: [Kancalar](/tr/automation/hooks)
- Plugin kancaları: [Plugin kancaları](/tr/plugins/hooks)

## Tüm Kancaları Listele

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ekstra ve paketlenmiş dizinlerden keşfedilen tüm kancaları listeleyin.
Gateway başlangıcı, en az bir dahili kanca yapılandırılana kadar dahili kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları gösterir (gereksinimler karşılanmış)
- `--json`: JSON olarak çıktı verir
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgi gösterir

**Örnek çıktı:**

```
Kancalar (4/4 hazır)

Hazır:
  🚀 boot-md ✓ - Gateway başlangıcında BOOT.md çalıştır
  📎 bootstrap-extra-files ✓ - Ajan önyüklemesi sırasında ek çalışma alanı önyükleme dosyalarını ekle
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

Belirli bir kanca hakkında ayrıntılı bilgi gösterir.

**Argümanlar:**

- `<name>`: Kanca adı veya kanca anahtarı (ör. `session-memory`)

**Seçenekler:**

- `--json`: JSON olarak çıktı verir

**Örnek:**

```bash
openclaw hooks info session-memory
```

**Çıktı:**

```
💾 session-memory ✓ Hazır

/new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet

Ayrıntılar:
  Kaynak: openclaw-bundled
  Yol: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  İşleyici: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Ana sayfa: https://docs.openclaw.ai/automation/hooks#session-memory
  Olaylar: command:new, command:reset

Gereksinimler:
  Yapılandırma: ✓ workspace.dir
```

## Kanca Uygunluğunu Denetle

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterir (kaç tanesi hazır, kaçı hazır değil).

**Seçenekler:**

- `--json`: JSON olarak çıktı verir

**Örnek çıktı:**

```
Kanca Durumu

Toplam kanca: 4
Hazır: 4
Hazır değil: 0
```

## Bir Kancayı Etkinleştir

```bash
openclaw hooks enable <name>
```

Belirli bir kancayı yapılandırmanıza ekleyerek etkinleştirin (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` olarak görünür ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Etkinleştirilen kanca: 💾 session-memory
```

**Yaptıkları:**

- Kancanın var olup olmadığını ve uygun olup olmadığını denetler
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Kanca `<workspace>/hooks/` içinden geldiyse, Gateway'in onu yüklemesi için
bu isteğe bağlı katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirme ortamında gateway sürecinizi yeniden başlatın).

## Bir Kancayı Devre Dışı Bırak

```bash
openclaw hooks disable <name>
```

Belirli bir kancayı yapılandırmanızı güncelleyerek devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Devre dışı bırakılan kanca: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan `stdout`'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahip Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca Paketlerini Kur

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Birleşik Plugin yükleyicisi üzerinden kanca paketlerini kurun.

`openclaw hooks install` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm belirtimleri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalışır.

Boş belirtimler ve `@latest` kararlı izde kalır. npm bunlardan herhangi birini
bir ön sürüme çözerse, OpenClaw durur ve sizden `@beta`/`@rc` gibi bir
ön sürüm etiketi veya tam bir ön sürüm sürümü ile açıkça katılım sağlamanızı ister.

**Yaptıkları:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Kurulan kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Kurulumu `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel dizini bağlar (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm kurulumlarını `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydeder

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Yerel dizin
openclaw plugins install ./my-hook-pack

# Yerel arşiv
openclaw plugins install ./my-hook-pack.zip

# NPM paketi
openclaw plugins install @openclaw/my-hook-pack

# Kopyalamadan yerel dizini bağla
openclaw plugins install -l ./my-hook-pack
```

Bağlı kanca paketleri, çalışma alanı kancaları olarak değil, operatör tarafından yapılandırılmış
bir dizinden gelen yönetilen kancalar olarak değerlendirilir.

## Kanca Paketlerini Güncelle

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Birleşik Plugin güncelleyicisi üzerinden izlenen npm tabanlı kanca paketlerini güncelleyin.

`openclaw hooks update` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini günceller
- `--dry-run`: Yazmadan neyin değişeceğini gösterir

Kayıtlı bir bütünlük karması varsa ve alınan yapıt karması değişirse,
OpenClaw ilerlemeden önce bir uyarı yazdırır ve onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
genel `--yes` kullanın.

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

`agent:bootstrap` sırasında ek önyükleme dosyalarını (örneğin monorepo yerel `AGENTS.md` / `TOOLS.md`) ekler.

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

Gateway başladığında `BOOT.md` çalıştırır (kanallar başladıktan sonra).

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon kancaları](/tr/automation/hooks)
