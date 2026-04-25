---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Her Gateway için yalıtılmış yapılandırma/durum/portlara ihtiyacınız var
summary: Tek bir host üzerinde birden fazla OpenClaw Gateway çalıştırma (yalıtım, portlar ve profiller)
title: Birden fazla gateway
x-i18n:
    generated_at: "2026-04-25T13:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

Çoğu kurulum tek bir Gateway kullanmalıdır; çünkü tek bir Gateway birden fazla mesajlaşma bağlantısını ve ajanı yönetebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (ör. bir kurtarma botu), yalıtılmış profiller/portlarla ayrı Gateway'ler çalıştırın.

## En çok önerilen kurulum

Çoğu kullanıcı için en basit kurtarma botu kurulumu şudur:

- ana botu varsayılan profilde tutun
- kurtarma botunu `--profile rescue` ile çalıştırın
- kurtarma hesabı için tamamen ayrı bir Telegram botu kullanın
- kurtarma botunu `19789` gibi farklı bir temel portta tutun

Bu, birincil bot çalışmıyorsa kurtarma botunun onu ayıklayabilmesi veya yapılandırma değişiklikleri uygulayabilmesi için ana bottan yalıtılmış kalmasını sağlar. Türetilmiş browser/canvas/CDP portlarının asla çakışmaması için temel portlar arasında en az 20 port bırakın.

## Kurtarma botu hızlı başlangıç

Başka bir şey yapmanız için güçlü bir nedeniniz yoksa bunu varsayılan yol olarak kullanın:

```bash
# Kurtarma botu (ayrı Telegram botu, ayrı profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Ana botunuz zaten çalışıyorsa, genellikle ihtiyacınız olan tek şey budur.

`openclaw --profile rescue onboard` sırasında:

- ayrı Telegram bot token'ını kullanın
- `rescue` profilini koruyun
- ana bottan en az 20 daha yüksek bir temel port kullanın
- zaten kendiniz yönetmiyorsanız varsayılan kurtarma çalışma alanını kabul edin

İlk kurulum kurtarma hizmetini sizin için zaten kurduysa, son
`gateway install` gerekmez.

## Bu neden çalışır

Kurtarma botu bağımsız kalır çünkü kendine ait şunları kullanır:

- profil/yapılandırma
- durum dizini
- çalışma alanı
- temel port (ve türetilmiş portlar)
- Telegram bot token'ı

Çoğu kurulum için kurtarma profili adına tamamen ayrı bir Telegram botu kullanın:

- yalnızca operatöre açık tutması kolaydır
- ayrı bot token'ı ve kimliği vardır
- ana botun kanal/uygulama kurulumundan bağımsızdır
- ana bot bozulduğunda basit bir DM tabanlı kurtarma yoludur

## `--profile rescue onboard` neyi değiştirir

`openclaw --profile rescue onboard` normal ilk kurulum akışını kullanır, ancak
her şeyi ayrı bir profile yazar.

Pratikte bu, kurtarma botunun kendine ait şu öğelere sahip olduğu anlamına gelir:

- yapılandırma dosyası
- durum dizini
- çalışma alanı (varsayılan olarak `~/.openclaw/workspace-rescue`)
- yönetilen hizmet adı

Bunun dışındaki istemler normal ilk kurulumla aynıdır.

## Genel çoklu Gateway kurulumu

Yukarıdaki kurtarma botu düzeni en kolay varsayılandır, ancak aynı yalıtım
deseni tek bir host üzerindeki herhangi bir Gateway çifti veya grubu için de çalışır.

Daha genel bir kurulum için, her ek Gateway'e kendi adlandırılmış profilini ve kendi
temel portunu verin:

```bash
# ana (varsayılan profil)
openclaw setup
openclaw gateway --port 18789

# ek gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Her iki Gateway'in de adlandırılmış profil kullanmasını istiyorsanız, bu da çalışır:

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

Yedek bir operatör hattı istediğinizde kurtarma botu hızlı başlangıcını kullanın. Farklı
kanallar, kiracılar, çalışma alanları veya operasyonel roller için birden fazla uzun ömürlü Gateway istediğinizde
genel profil desenini kullanın.

## Yalıtım kontrol listesi

Bunları her Gateway örneği için benzersiz tutun:

- `OPENCLAW_CONFIG_PATH` — örnek başına yapılandırma dosyası
- `OPENCLAW_STATE_DIR` — örnek başına oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örnek başına çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- türetilmiş browser/canvas/CDP portları

Bunlar paylaşılırsa yapılandırma yarışları ve port çakışmaları yaşarsınız.

## Port eşleme (türetilmiş)

Temel port = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser denetim hizmeti portu = temel + 2 (yalnızca loopback)
- canvas host, Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı port)
- Browser profil CDP portları `browser.controlPort + 9 .. + 108` aralığından otomatik ayrılır

Bunlardan herhangi birini yapılandırma veya ortam değişkeniyle geçersiz kılarsanız, her örnek için benzersiz tutmanız gerekir.

## Browser/CDP notları (yaygın tuzak)

- Birden fazla örnekte `browser.cdpUrl` değerini aynı değerlere **sabitlemeyin**.
- Her örneğin kendi browser denetim portuna ve kendi CDP aralığına ihtiyacı vardır (gateway portundan türetilir).
- Açık CDP portlarına ihtiyacınız varsa, örnek başına `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome: `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

## El ile ortam değişkeni örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Hızlı denetimler

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Yorumlama:

- `gateway status --deep`, eski kurulumlardan kalan bayat launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `gateway probe` içindeki `multiple reachable gateways detected` gibi uyarı metni, yalnızca kasıtlı olarak birden fazla yalıtılmış gateway çalıştırdığınızda beklenir.

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway lock](/tr/gateway/gateway-lock)
- [Yapılandırma](/tr/gateway/configuration)
