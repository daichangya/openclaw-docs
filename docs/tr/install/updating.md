---
read_when:
    - OpenClaw'ı güncelleme
    - Bir güncellemeden sonra bir şeyler bozuluyor
summary: OpenClaw'ı güvenli şekilde güncelleme (genel kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-25T13:49:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

OpenClaw'ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` komutunu çalıştırır ve Gateway'i yeniden başlatır.

```bash
openclaw update
```

Kanal değiştirmek veya belirli bir sürümü hedeflemek için:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # uygulamadan önizleme yap
```

`--channel beta`, beta sürümünü tercih eder, ancak çalışma zamanı
beta etiketi yoksa veya en son kararlı sürümden daha eskiyse stable/latest sürümüne geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag'ini istiyorsanız `--tag beta` kullanın.

Kanal anlamları için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Kaynak kurulumları için `--install-method git --no-onboard` geçin.

## Alternatif: elle npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Genel npm kurulumları ve çalışma zamanı bağımlılıkları

OpenClaw, mevcut kullanıcının genel paket dizinine yazma izni olsa bile paketlenmiş genel kurulumları çalışma zamanında salt okunur kabul eder. Paketle gelen Plugin çalışma zamanı bağımlılıkları, paket ağacını değiştirmek yerine yazılabilir bir çalışma zamanı dizinine yerleştirilir. Bu, `openclaw update` komutunun aynı kurulum sırasında Plugin bağımlılıklarını onaran çalışan bir Gateway veya yerel ajanla yarışmasını önler.

Bazı Linux npm kurulumları genel paketleri `/usr/lib/node_modules/openclaw` gibi root sahipli dizinlere kurar. OpenClaw aynı harici yerleştirme yolu üzerinden bu düzeni de destekler.

Sıkılaştırılmış systemd birimleri için `ReadWritePaths` içine dahil edilen yazılabilir bir yerleştirme dizini ayarlayın:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmamışsa OpenClaw, systemd bunu sağladığında `$STATE_DIRECTORY` değerini kullanır, ardından `~/.openclaw/plugin-runtime-deps` yoluna geri döner.

### Paketle gelen Plugin çalışma zamanı bağımlılıkları

Paketlenmiş kurulumlar, paketle gelen Plugin çalışma zamanı bağımlılıklarını salt okunur paket ağacının dışında tutar. Başlangıçta ve `openclaw doctor --fix` sırasında OpenClaw çalışma zamanı bağımlılıklarını yalnızca config içinde etkin olan, eski kanal config'i üzerinden etkin olan veya paketle gelen manifest varsayılanı tarafından etkinleştirilen Plugin'ler için onarır.

Açık devre dışı bırakma kazanır. Devre dışı bırakılmış bir Plugin veya kanal, pakette bulunduğu için çalışma zamanı bağımlılıklarını onarmaz. Harici Plugin'ler ve özel yükleme yolları yine de `openclaw plugins install` veya `openclaw plugins update` kullanır.

## Otomatik güncelleyici

Otomatik güncelleyici varsayılan olarak kapalıdır. Bunu `~/.openclaw/openclaw.json` içinde etkinleştirin:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal    | Davranış                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` boyunca deterministik jitter ile uygular (aşamalı dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` saatte bir kontrol eder (varsayılan: saatlik) ve hemen uygular.              |
| `dev`    | Otomatik uygulama yok. `openclaw update` komutunu elle kullanın.                                           |

Gateway ayrıca başlangıçta bir güncelleme ipucu da günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Config'i taşır, DM ilkelerini denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway'i yeniden başlatın

```bash
openclaw gateway restart
```

### Doğrulayın

```bash
openclaw health
```

</Steps>

## Geri alma

### Bir sürümü sabitleyin (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

İpucu: `npm view openclaw version`, şu anda yayımlanmış sürümü gösterir.

### Bir commit'i sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu tekrar çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'yi otomatik olarak önyükler. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm`'yi elle kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Şurayı kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Doctor](/tr/gateway/doctor) — güncellemelerden sonra sağlık denetimleri
- [Taşıma](/tr/install/migrating) — ana sürüm taşıma kılavuzları
