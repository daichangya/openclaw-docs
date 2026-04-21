---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Her Gateway için yalıtılmış yapılandırma/durum/bağlantı noktaları gerekir
summary: Tek bir ana makinede birden fazla OpenClaw Gateway çalıştırma (yalıtım, bağlantı noktaları ve profiller)
title: Birden Fazla Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Birden Fazla Gateway (aynı ana makinede)

Çoğu kurulumda tek bir Gateway kullanılmalıdır çünkü tek bir Gateway birden fazla mesajlaşma bağlantısını ve agent'ı yönetebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (örneğin, bir kurtarma botu), yalıtılmış profiller/bağlantı noktalarıyla ayrı Gateway'ler çalıştırın.

## En Çok Önerilen Kurulum

Çoğu kullanıcı için en basit kurtarma botu kurulumu şudur:

- ana botu varsayılan profilde tutun
- kurtarma botunu `--profile rescue` ile çalıştırın
- kurtarma hesabı için tamamen ayrı bir Telegram botu kullanın
- kurtarma botunu `19789` gibi farklı bir temel bağlantı noktasında tutun

Bu, birincil bot devre dışı kaldığında hata ayıklayabilmesi veya yapılandırma değişiklikleri uygulayabilmesi için kurtarma botunu ana bottan yalıtılmış tutar. Türetilmiş tarayıcı/canvas/CDP bağlantı noktalarının asla çakışmaması için temel bağlantı noktaları arasında en az 20 bağlantı noktası bırakın.

## Kurtarma Botu Hızlı Başlangıç

Başka bir şey yapmak için güçlü bir nedeniniz yoksa bunu varsayılan yol olarak kullanın:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Ana botunuz zaten çalışıyorsa, genellikle ihtiyacınız olan tek şey budur.

`openclaw --profile rescue onboard` sırasında:

- ayrı Telegram bot belirtecini kullanın
- `rescue` profilini koruyun
- ana bottan en az 20 daha yüksek bir temel bağlantı noktası kullanın
- zaten kendiniz yönetmiyorsanız varsayılan kurtarma çalışma alanını kabul edin

Onboarding kurtarma hizmetini sizin için zaten kurduysa, son `gateway install` gerekli değildir.

## Bu Neden Çalışır

Kurtarma botu bağımsız kalır çünkü kendine ait şunlara sahiptir:

- profil/yapılandırma
- durum dizini
- çalışma alanı
- temel bağlantı noktası (artı türetilmiş bağlantı noktaları)
- Telegram bot belirteci

Çoğu kurulum için, kurtarma profili adına tamamen ayrı bir Telegram botu kullanın:

- yalnızca operatöre açık tutması kolaydır
- ayrı bot belirteci ve kimliği vardır
- ana botun kanal/uygulama kurulumundan bağımsızdır
- ana bot bozulduğunda DM tabanlı basit bir kurtarma yolu sağlar

## `--profile rescue onboard` Neleri Değiştirir

`openclaw --profile rescue onboard` normal onboarding akışını kullanır, ancak her şeyi ayrı bir profile yazar.

Pratikte bu, kurtarma botunun kendine ait şu bileşenleri aldığı anlamına gelir:

- yapılandırma dosyası
- durum dizini
- çalışma alanı (varsayılan olarak `~/.openclaw/workspace-rescue`)
- yönetilen hizmet adı

Bunun dışındaki istemler normal onboarding ile aynıdır.

## Genel Çoklu Gateway Kurulumu

Yukarıdaki kurtarma botu düzeni en kolay varsayılandır, ancak aynı yalıtım deseni tek bir ana makinedeki herhangi bir Gateway çifti veya grubu için de geçerlidir.

Daha genel bir kurulum için, her ek Gateway'ye kendi adlı profilini ve kendi temel bağlantı noktasını verin:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Her iki Gateway'nin de adlandırılmış profiller kullanmasını istiyorsanız, bu da çalışır:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Hizmetler de aynı deseni izler:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Yedek bir operatör hattı istediğinizde kurtarma botu hızlı başlangıcını kullanın. Farklı kanallar, kiracılar, çalışma alanları veya operasyonel roller için birden fazla uzun ömürlü Gateway istediğinizde genel profil desenini kullanın.

## Yalıtım Kontrol Listesi

Bunları her Gateway örneği için benzersiz tutun:

- `OPENCLAW_CONFIG_PATH` — örnek başına yapılandırma dosyası
- `OPENCLAW_STATE_DIR` — örnek başına oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örnek başına çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- türetilmiş tarayıcı/canvas/CDP bağlantı noktaları

Bunlar paylaşılırsa yapılandırma yarışları ve bağlantı noktası çakışmaları yaşarsınız.

## Bağlantı noktası eşlemesi (türetilmiş)

Temel bağlantı noktası = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- tarayıcı denetim hizmeti bağlantı noktası = temel + 2 (yalnızca loopback)
- canvas host, Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı bağlantı noktası)
- Tarayıcı profil CDP bağlantı noktaları `browser.controlPort + 9 .. + 108` aralığından otomatik atanır

Bunlardan herhangi birini yapılandırma veya env içinde geçersiz kılarsanız, örnek başına benzersiz tutmanız gerekir.

## Tarayıcı/CDP notları (yaygın tuzak)

- Birden fazla örnekte `browser.cdpUrl` değerini aynı değerlere **sabitlemeyin**.
- Her örneğin kendi tarayıcı denetim bağlantı noktasına ve CDP aralığına ihtiyacı vardır (Gateway bağlantı noktasından türetilir).
- Açık CDP bağlantı noktalarına ihtiyacınız varsa, örnek başına `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome: `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

## Manuel env örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep`, eski kurulumlardan kalmış bayat launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `gateway probe` uyarı metni, örneğin `multiple reachable gateways detected`, yalnızca kasıtlı olarak birden fazla yalıtılmış gateway çalıştırdığınızda beklenir.
