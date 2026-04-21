---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Her Gateway için yalıtılmış yapılandırma/durum/bağlantı noktaları gerekir
summary: Tek bir ana bilgisayarda birden fazla OpenClaw Gateway çalıştırın (yalıtım, bağlantı noktaları ve profiller)
title: Birden Fazla Gateway
x-i18n:
    generated_at: "2026-04-21T17:45:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Birden Fazla Gateway (aynı ana bilgisayar)

Çoğu kurulumda tek bir Gateway kullanılmalıdır çünkü tek bir Gateway birden fazla mesajlaşma bağlantısını ve agent'ı yönetebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (ör. bir kurtarma botu), yalıtılmış profiller/bağlantı noktalarıyla ayrı Gateway'ler çalıştırın.

## Yalıtım kontrol listesi (zorunlu)

- `OPENCLAW_CONFIG_PATH` — örnek başına yapılandırma dosyası
- `OPENCLAW_STATE_DIR` — örnek başına oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örnek başına çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- Türetilmiş bağlantı noktaları (browser/canvas) çakışmamalıdır

Bunlar paylaşılırsa, yapılandırma yarışları ve bağlantı noktası çakışmaları yaşarsınız.

## Önerilen: ana örnek için varsayılan profili, kurtarma için adlandırılmış bir profili kullanın

Profiller `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` değerlerini otomatik olarak kapsamlandırır ve hizmet adlarına sonek ekler. Çoğu kurtarma botu kurulumu için, ana botu varsayılan profilde tutun ve yalnızca kurtarma botuna `rescue` gibi adlandırılmış bir profil verin.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Hizmetler:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Her iki Gateway'nin de adlandırılmış profiller kullanmasını istiyorsanız bu da çalışır, ancak gerekli değildir.

## Kurtarma botu kılavuzu

Önerilen kurulum:

- ana botu varsayılan profilde tutun
- kurtarma botunu `--profile rescue` ile çalıştırın
- kurtarma hesabı için tamamen ayrı bir Telegram botu kullanın
- kurtarma botunu `19001` gibi farklı bir temel bağlantı noktasında tutun

Bu, ana bot çalışmıyorsa kurtarma botunun hata ayıklayabilmesi veya yapılandırma değişiklikleri uygulayabilmesi için onu ana bottan yalıtılmış tutar. Türetilmiş browser/canvas/CDP bağlantı noktalarının asla çakışmaması için temel bağlantı noktaları arasında en az 20 bağlantı noktası bırakın.

### Önerilen kurtarma kanalı/hesabı

Çoğu kurulum için, kurtarma profili adına tamamen ayrı bir Telegram botu kullanın.

Telegram neden önerilir:

- yalnızca operatöre açık tutulması kolaydır
- ayrı bot token'ı ve kimliği
- ana botun kanalı/uygulama kurulumundan bağımsızdır
- ana bot bozulduğunda DM tabanlı basit bir kurtarma yolu sağlar

Önemli olan kısım tam bağımsızlıktır: ayrı bot hesabı, ayrı kimlik bilgileri, ayrı OpenClaw profili, ayrı çalışma alanı ve ayrı bağlantı noktası.

### Önerilen kurulum akışı

Bunu, farklı bir şey yapmak için güçlü bir nedeniniz yoksa varsayılan kurulum olarak kullanın:

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

`openclaw --profile rescue onboard` sırasında:

- ayrı Telegram bot token'ını kullanın
- `rescue` profilini koruyun
- ana bottan en az 20 daha yüksek bir temel bağlantı noktası kullanın
- zaten kendiniz yönetmiyorsanız varsayılan kurtarma çalışma alanını kabul edin

Onboarding kurtarma hizmetini zaten sizin için kurduysa, son `gateway install` gerekli değildir.

### Onboarding neyi değiştirir

`openclaw --profile rescue onboard` normal onboarding akışını kullanır, ancak her şeyi ayrı bir profile yazar.

Pratikte bu, kurtarma botunun kendine ait şu bileşenlere sahip olduğu anlamına gelir:

- yapılandırma dosyası
- durum dizini
- çalışma alanı (varsayılan olarak `~/.openclaw/workspace-rescue`)
- yönetilen hizmet adı

Bunun dışındaki istemler normal onboarding ile aynıdır.

## Bağlantı noktası eşlemesi (türetilmiş)

Temel bağlantı noktası = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser denetim hizmeti bağlantı noktası = temel + 2 (yalnızca loopback)
- canvas host, Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı bağlantı noktası)
- Browser profil CDP bağlantı noktaları `browser.controlPort + 9 .. + 108` aralığından otomatik olarak ayrılır

Bunlardan herhangi birini yapılandırma veya ortam değişkenlerinde geçersiz kılarsanız, örnek başına benzersiz kalmalarını sağlamalısınız.

## Browser/CDP notları (yaygın hata kaynağı)

- Birden fazla örnekte `browser.cdpUrl` değerini aynı değerlere **sabitlemeyin**.
- Her örnek kendi browser denetim bağlantı noktasına ve CDP aralığına ihtiyaç duyar (gateway bağlantı noktasından türetilir).
- Açık CDP bağlantı noktalarına ihtiyacınız varsa, örnek başına `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome: `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

## El ile ortam değişkeni örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Hızlı kontroller

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Yorumlama:

- `gateway status --deep`, eski kurulumlardan kalmış launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `gateway probe` uyarı metni; örneğin `multiple reachable gateways detected`, yalnızca kasıtlı olarak birden fazla yalıtılmış gateway çalıştırdığınızda beklenir.
