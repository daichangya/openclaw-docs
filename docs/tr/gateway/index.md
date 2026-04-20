---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
summary: Gateway hizmeti, yaşam döngüsü ve operasyonlar için runbook
title: Gateway Runbook
x-i18n:
    generated_at: "2026-04-20T09:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Gateway runbook

Gateway hizmetinin ilk gün başlatılması ve ikinci gün operasyonları için bu sayfayı kullanın.

<CardGroup cols={2}>
  <Card title="Derinlemesine sorun giderme" icon="siren" href="/tr/gateway/troubleshooting">
    Belirti odaklı tanılama; tam komut sıraları ve günlük imzalarıyla.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Görev odaklı kurulum kılavuzu + tam yapılandırma başvurusu.
  </Card>
  <Card title="Gizli bilgi yönetimi" icon="key-round" href="/tr/gateway/secrets">
    SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve taşıma/yeniden yükleme işlemleri.
  </Card>
  <Card title="Gizli bilgi planı sözleşmesi" icon="shield-check" href="/tr/gateway/secrets-plan-contract">
    Kesin `secrets apply` hedef/yol kuralları ve yalnızca referanslı auth-profile davranışı.
  </Card>
</CardGroup>

## 5 dakikada yerel başlatma

<Steps>
  <Step title="Gateway'i başlatın">

```bash
openclaw gateway --port 18789
# debug/trace stdio'ya yansıtılır
openclaw gateway --port 18789 --verbose
# seçili bağlantı noktasındaki dinleyiciyi zorla öldür, sonra başlat
openclaw gateway --force
```

  </Step>

  <Step title="Hizmet sağlığını doğrulayın">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Sağlıklı temel durum: `Runtime: running`, `Connectivity probe: ok` ve beklediğinizle eşleşen `Capability: ...`. Yalnızca erişilebilirlik değil, okuma kapsamlı RPC kanıtı gerektiğinde `openclaw gateway status --require-rpc` kullanın.

  </Step>

  <Step title="Kanal hazırlığını doğrulayın">

```bash
openclaw channels status --probe
```

Erişilebilir bir Gateway ile bu, hesap başına canlı kanal yoklamaları ve isteğe bağlı denetimler çalıştırır.
Gateway'e ulaşılamıyorsa, CLI canlı yoklama çıktısı yerine yalnızca yapılandırma tabanlı kanal özetlerine geri döner.

  </Step>
</Steps>

<Note>
Gateway yapılandırma yeniden yükleme özelliği etkin yapılandırma dosyası yolunu izler (profil/durum varsayılanlarından çözümlenir veya ayarlıysa `OPENCLAW_CONFIG_PATH` kullanılır).
Varsayılan mod `gateway.reload.mode="hybrid"` şeklindedir.
İlk başarılı yüklemeden sonra çalışan süreç etkin bellek içi yapılandırma anlık görüntüsünü sunar; başarılı yeniden yükleme bu anlık görüntüyü atomik olarak değiştirir.
</Note>

## Çalışma zamanı modeli

- Yönlendirme, denetim düzlemi ve kanal bağlantıları için her zaman açık tek süreç.
- Şunlar için tek çoklanmış bağlantı noktası:
  - WebSocket denetimi/RPC
  - HTTP API'leri, OpenAI uyumlu (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI ve kancalar
- Varsayılan bağlama modu: `loopback`.
- Kimlik doğrulama varsayılan olarak gereklidir. Paylaşılan gizli anahtar kurulumları
  `gateway.auth.token` / `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanır; loopback dışı
  ters vekil kurulumları ise `gateway.auth.mode: "trusted-proxy"` kullanabilir.

## OpenAI uyumlu uç noktalar

OpenClaw’ın en yüksek etkili uyumluluk yüzeyi artık şudur:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Bu kümenin neden önemli olduğu:

- Çoğu Open WebUI, LobeChat ve LibreChat entegrasyonu önce `/v1/models` uç noktasını yoklar.
- Birçok RAG ve bellek hattı `/v1/embeddings` bekler.
- Agent yerel istemciler giderek daha fazla `/v1/responses` tercih ediyor.

Planlama notu:

- `/v1/models` agent önceliklidir: `openclaw`, `openclaw/default` ve `openclaw/<agentId>` döndürür.
- `openclaw/default`, yapılandırılmış varsayılan agent ile her zaman eşlenen kararlı takma addır.
- Arka uç sağlayıcı/model geçersiz kılması istediğinizde `x-openclaw-model` kullanın; aksi takdirde seçili agent'ın normal model ve embedding kurulumu denetimi elinde tutar.

Bunların tümü ana Gateway bağlantı noktasında çalışır ve Gateway HTTP API'sinin geri kalanıyla aynı güvenilen operatör kimlik doğrulama sınırını kullanır.

### Bağlantı noktası ve bağlama önceliği

| Ayar           | Çözümleme sırası                                              |
| -------------- | ------------------------------------------------------------- |
| Gateway portu  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bağlama modu   | CLI/override → `gateway.bind` → `loopback`                    |

### Sıcak yeniden yükleme modları

| `gateway.reload.mode` | Davranış                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Yapılandırma yeniden yükleme yok          |
| `hot`                 | Yalnızca sıcak geçerli değişiklikleri uygula |
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

`gateway status --deep`, daha derin bir RPC sağlık yoklaması için değil,
ek hizmet keşfi (LaunchDaemons/systemd sistem birimleri/schtasks) içindir.

## Birden fazla Gateway (aynı ana makinede)

Çoğu kurulumda makine başına bir gateway çalıştırılmalıdır. Tek bir gateway birden
fazla agent ve kanalı barındırabilir.

Yalnızca kasıtlı olarak yalıtım veya kurtarma botu istediğinizde birden fazla gateway gerekir.

Yararlı kontroller:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Beklemeniz gerekenler:

- `gateway status --deep`, `Other gateway-like services detected (best effort)`
  bildirebilir ve eski launchd/systemd/schtasks kurulumları hâlâ mevcutsa
  temizleme ipuçları yazdırabilir.
- `gateway probe`, birden fazla hedef yanıt verdiğinde `multiple reachable gateways`
  konusunda uyarabilir.
- Bu kasıtlıysa, her gateway için bağlantı noktalarını, yapılandırma/durum dizinlerini ve çalışma alanı köklerini yalıtın.

Ayrıntılı kurulum: [/gateway/multiple-gateways](/tr/gateway/multiple-gateways).

## Uzak erişim

Tercih edilen: Tailscale/VPN.
Yedek seçenek: SSH tüneli.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Ardından istemcileri yerel olarak `ws://127.0.0.1:18789` adresine bağlayın.

<Warning>
SSH tünelleri gateway kimlik doğrulamasını atlatmaz. Paylaşılan gizli anahtar tabanlı kimlik doğrulamada istemciler,
tünel üzerinden bile `token`/`password` göndermelidir. Kimlik taşıyan modlarda ise
isteğin yine de o kimlik doğrulama yolunu karşılaması gerekir.
</Warning>

Bkz.: [Remote Gateway](/tr/gateway/remote), [Authentication](/tr/gateway/authentication), [Tailscale](/tr/gateway/tailscale).

## Gözetim ve hizmet yaşam döngüsü

Üretime benzer güvenilirlik için gözetimli çalıştırmaları kullanın.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent etiketleri `ai.openclaw.gateway` (varsayılan) veya `ai.openclaw.<profile>` (adlandırılmış profil) şeklindedir. `openclaw doctor`, hizmet yapılandırması sapmalarını denetler ve onarır.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Oturum kapatıldıktan sonra kalıcılık için lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger <user>
```

Özel kurulum yolu gerektiğinde el ile kullanıcı birimi örneği:

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

Yerel Windows yönetilen başlangıcı, `OpenClaw Gateway`
(adlandırılmış profiller için `OpenClaw Gateway (<profile>)`) adlı bir Scheduled Task kullanır. Scheduled Task
oluşturma reddedilirse, OpenClaw durum dizini içindeki `gateway.cmd` dosyasını işaret eden
kullanıcı başına Startup-folder başlatıcısına geri döner.

  </Tab>

  <Tab title="Linux (system service)">

Çok kullanıcılı/her zaman açık ana makineler için bir sistem birimi kullanın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Kullanıcı birimiyle aynı hizmet gövdesini kullanın, ancak bunu
`/etc/systemd/system/openclaw-gateway[-<profile>].service` altına kurun ve
`openclaw` ikiliniz başka bir yerdeyse `ExecStart=` değerini ayarlayın.

  </Tab>
</Tabs>

## Tek bir ana makinede birden fazla Gateway

Çoğu kurulum **bir** Gateway çalıştırmalıdır.
Birden fazla Gateway'i yalnızca katı yalıtım/yedeklilik için kullanın (örneğin bir kurtarma profili).

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

Bkz.: [Multiple gateways](/tr/gateway/multiple-gateways).

### Dev profil hızlı yolu

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Varsayılanlar; yalıtılmış durum/yapılandırma ve temel gateway bağlantı noktası `19001` içerir.

## Protokol hızlı başvuru (operatör görünümü)

- İlk istemci çerçevesi `connect` olmalıdır.
- Gateway, `hello-ok` anlık görüntüsünü döndürür (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events`, çağrılabilir her yardımcı rota için
  üretilmiş bir döküm değil, tutucu bir keşif listesidir.
- İstekler: `req(method, params)` → `res(ok/payload|error)`.
- Yaygın olaylar arasında `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eşleştirme/onay yaşam döngüsü olayları ve `shutdown` bulunur.

Agent çalıştırmaları iki aşamalıdır:

1. Anında kabul onayı (`status:"accepted"`)
2. Arada akış hâlinde `agent` olaylarıyla son tamamlama yanıtı (`status:"ok"|"error"`).

Tam protokol belgeleri için bkz.: [Gateway Protocol](/tr/gateway/protocol).

## Operasyonel kontroller

### Canlılık

- WS açın ve `connect` gönderin.
- Anlık görüntüyle `hello-ok` yanıtı bekleyin.

### Hazırlık

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Boşluk kurtarma

Olaylar yeniden oynatılmaz. Sıra boşluklarında devam etmeden önce durumu yenileyin (`health`, `system-presence`).

## Yaygın hata imzaları

| İmza                                                           | Olası sorun                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Geçerli bir gateway kimlik doğrulama yolu olmadan loopback dışı bağlama         |
| `another gateway instance is already listening` / `EADDRINUSE` | Bağlantı noktası çakışması                                                       |
| `Gateway start blocked: set gateway.mode=local`                | Yapılandırma uzak moda ayarlı veya hasarlı bir yapılandırmada local-mode damgası eksik |
| `unauthorized` during connect                                  | İstemci ile gateway arasında kimlik doğrulama uyuşmazlığı                       |

Tam tanılama sıraları için [Gateway Troubleshooting](/tr/gateway/troubleshooting) bölümünü kullanın.

## Güvenlik garantileri

- Gateway protokol istemcileri, Gateway kullanılamadığında hızlıca başarısız olur (örtük doğrudan kanal geri dönüşü yoktur).
- Geçersiz/`connect` olmayan ilk çerçeveler reddedilir ve bağlantı kapatılır.
- Zarif kapatma, soket kapanmadan önce `shutdown` olayı yayınlar.

---

İlgili:

- [Sorun giderme](/tr/gateway/troubleshooting)
- [Arka Plan Süreci](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Sağlık](/tr/gateway/health)
- [Doctor](/tr/gateway/doctor)
- [Kimlik Doğrulama](/tr/gateway/authentication)
