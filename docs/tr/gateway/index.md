---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonlar için runbook
title: Gateway runbook
x-i18n:
    generated_at: "2026-04-25T13:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Bu sayfayı Gateway hizmetinin 1. gün başlatılması ve 2. gün operasyonları için kullanın.

<CardGroup cols={2}>
  <Card title="Derin sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Belirti öncelikli tanılama; tam komut adımları ve günlük imzalarıyla.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli bilgi planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Tam `secrets apply` hedef/yol kuralları ve yalnızca referans auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikada yerel başlangıç

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# hata ayıklama/izleme stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçilen porttaki dinleyiciyi zorla sonlandır, sonra başlat
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen bir `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazır olma durumunu doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir Gateway ile bu, canlı hesap başına kanal yoklamaları ve isteğe bağlı denetimleri çalıştırır.
Gateway'e ulaşılamıyorsa CLI, canlı yoklama çıktısı yerine yalnızca yapılandırma tabanlı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yüklemesi, etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözülür veya ayarlıysa `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` değeridir.
İlk başarılı yüklemeden sonra çalışan süreç, etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, kontrol düzlemi ve kanal bağlantıları için her zaman açık tek bir süreç.
- Şunlar için tek çoklanmış port:
  - WebSocket kontrol/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI ve hook'lar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli anahtar kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır ve loopback olmayan
  reverse-proxy kurulumları `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw'ın en yüksek etkili uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` yoklaması yapar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Agent tabanlı istemciler giderek daha fazla `/v1/responses` tercih ediyor.

Planlama notu:

- `/v1/models` agent önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, her zaman yapılandırılmış varsayılan agent'a eşlenen kararlı takma addır.
- Bir backend sağlayıcısı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi takdirde seçilen agent'ın normal model ve embedding kurulumu denetimi elinde tutar.

Bunların tümü ana Gateway portunda çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilir operatör kimlik doğrulama sınırını kullanır.

### Port ve bağlama önceliği

| Ayar         | Çözümleme sırası                                             |
| ------------ | ------------------------------------------------------------ |
| Gateway portu | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu | CLI/geçersiz kılma → `gateway.bind` → `loopback`             |

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Yapılandırma yeniden yüklemesi yok        |
| `hot`                 | Yalnızca hot-safe değişiklikleri uygula   |
| `restart`             | Yeniden yükleme gerektiren değişikliklerde yeniden başlat |
| `hybrid` (varsayılan) | Güvenliyse sıcak uygula, gerekirse yeniden başlat |

## Operatör komut kümesi

```bash
openclaw gateway status
openclaw gateway status --deep   # sistem düzeyinde hizmet taraması ekler
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`, daha derin RPC sağlık yoklaması için değil, ek hizmet keşfi (LaunchDaemons/systemd sistem birimleri/schtasks) içindir.

## Birden fazla Gateway (aynı ana makine)

Çoğu kurulum makine başına tek bir Gateway çalıştırmalıdır. Tek bir Gateway birden fazla
agent ve kanal barındırabilir.

Yalnızca özellikle yalıtım veya bir kurtarma botu istediğinizde birden fazla Gateway gerekir.

Yararlı denetimler:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklemeniz gerekenler:

- `gateway status --deep`, `Other gateway-like services detected (best effort)`
  bildirebilir ve hâlâ çevrede bulunan bayat launchd/systemd/schtasks kurulumları için
  temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways`
  uyarısı verebilir.
- Bu kasıtlıysa portları, config/state ve çalışma alanı köklerini Gateway başına yalıtın.

Örnek başına kontrol listesi:

- Benzersiz `gateway.port`
- Benzersiz `OPENCLAW_CONFIG_PATH`
- Benzersiz `OPENCLAW_STATE_DIR`
- Benzersiz `agents.defaults.workspace`

Örnek:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Ayrıntılı kurulum: [/gateway/multiple-gateways](/tr/gateway/multiple-gateways).

## VoiceClaw gerçek zamanlı beyin uç noktası

OpenClaw, `/voiceclaw/realtime` adresinde VoiceClaw uyumlu bir gerçek zamanlı WebSocket uç noktası sunar. Ayrı bir relay sürecinden geçmek yerine bir VoiceClaw masaüstü istemcisinin doğrudan gerçek zamanlı bir OpenClaw beyniyle konuşmasını istediğinizde bunu kullanın.

Uç nokta, gerçek zamanlı ses için Gemini Live kullanır ve OpenClaw araçlarını doğrudan Gemini Live'a açığa çıkararak OpenClaw'ı beyin olarak çağırır. Araç çağrıları, sesli turun duyarlı kalması için hemen bir `working` sonucu döndürür; ardından OpenClaw gerçek aracı eşzamansız olarak yürütür ve sonucu canlı oturuma geri enjekte eder. `GEMINI_API_KEY` değerini Gateway süreç ortamında ayarlayın. Gateway kimlik doğrulaması etkinse masaüstü istemcisi ilk `session.config` mesajında Gateway token'ını veya parolasını gönderir.

Gerçek zamanlı beyin erişimi, sahibi tarafından yetkilendirilmiş OpenClaw agent komutlarını çalıştırır. `gateway.auth.mode: "none"` ayarını yalnızca loopback test örnekleriyle sınırlı tutun. Yerel olmayan gerçek zamanlı beyin bağlantıları Gateway kimlik doğrulaması gerektirir.

Yalıtılmış bir test Gateway'i için kendi portu, yapılandırması ve durumu olan ayrı bir örnek çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Ardından VoiceClaw'ı şu adresi kullanacak şekilde yapılandırın:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Geri dönüş: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri Gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli anahtar kimlik doğrulaması için istemciler tünel üzerinden bile yine `token`/`password` göndermelidir. Kimlik taşıyan modlarda ise istek hâlâ o kimlik doğrulama yolunu karşılamak zorundadır.
</Warning>

Bkz.: [Remote Gateway](/tr/gateway/remote), [Authentication](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

## Denetim ve hizmet yaşam döngüsü

Üretim benzeri güvenilirlik için denetlenen çalıştırmalar kullanın.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) biçimindedir. `openclaw doctor`, hizmet yapılandırması sapmalarını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapattıktan sonra da kalıcılık için lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel kurulum yolu gerektiğinde elle kullanıcı birimi örneği:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Yerel Windows yönetilen başlangıcı `OpenClaw Gateway` adlı bir Scheduled Task kullanır (adlandırılmış profiller için `OpenClaw Gateway (<profile>)`). Scheduled Task oluşturma reddedilirse OpenClaw, durum dizini içindeki `gateway.cmd` dosyasını işaret eden kullanıcı başına Startup klasörü başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (system service)">

Çok kullanıcılı/her zaman açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikili dosyanız başka yerdeyse `ExecStart=` değerini buna göre ayarlayın.

  </Tab>
</Tabs>

## Geliştirme profili hızlı yol

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar yalıtılmış state/config ve temel Gateway portu `19001` içerir.

## Protokol hızlı başvuru (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, `hello-ok` anlık görüntüsü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı yolun üretilmiş dökümü değil, korumacı bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Agent çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akışlı `agent` olaylarıyla son tamamlama yanıtı (`status:"ok"|"error"`)

Tam protokol belgeleri: [Gateway Protocol](/tr/gateway/protocol).

## Operasyonel denetimler

### Canlılık

- WS açın ve `connect` gönderin.
- Anlık görüntü içeren `hello-ok` yanıtını bekleyin.

### Hazır olma

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu yenileyin (`health`, `system-presence`).

## Yaygın arıza imzaları

| İmza                                                           | Olası sorun                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Geçerli bir Gateway auth yolu olmadan loopback dışı bağlama                    |
| `another gateway instance is already listening` / `EADDRINUSE` | Port çakışması                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlı veya hasarlı bir yapılandırmada yerel mod damgası eksik |
| `unauthorized` during connect                                  | İstemci ile Gateway arasında auth uyumsuzluğu                                  |

Tam tanılama adımları için [Gateway Troubleshooting](/tr/gateway/troubleshooting) kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri, Gateway kullanılamadığında hızlıca başarısız olur (örtük doğrudan kanal geri dönüşü yoktur).
- Geçersiz/ilk `connect` olmayan çerçeveler reddedilir ve bağlantı kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı gönderir.

---

İlgili:

- [Sorun giderme](/tr/gateway/troubleshooting)
- [Arka Plan Süreci](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Sağlık](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik Doğrulama](/tr/gateway/authentication)

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Uzak erişim](/tr/gateway/remote)
- [Gizli bilgi yönetimi](/tr/gateway/secrets)
