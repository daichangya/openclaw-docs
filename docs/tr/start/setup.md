---
read_when:
    - Yeni bir makineyi kurma
    - Kişisel kurulumunuzu bozmadan “en yeni + en iyi” sürümü istiyorsunuz
summary: OpenClaw için gelişmiş kurulum ve geliştirme iş akışları
title: Kurulum
x-i18n:
    generated_at: "2026-04-19T08:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Kurulum

<Note>
İlk kez kurulum yapıyorsanız, [Başlangıç](/tr/start/getting-started) ile başlayın.
Onboarding ayrıntıları için [Onboarding (CLI)](/tr/start/wizard) bölümüne bakın.
</Note>

## Kısa özet

- **Özelleştirmeler repo dışında yaşar:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Kararlı iş akışı:** macOS uygulamasını yükleyin; paketlenmiş Gateway’i onun çalıştırmasına izin verin.
- **En güncel iş akışı:** Gateway’i `pnpm gateway:watch` ile kendiniz çalıştırın, ardından macOS uygulamasının Yerel modda bağlanmasına izin verin.

## Önkoşullar (kaynaktan)

- Node 24 önerilir (Node 22 LTS, şu anda `22.14+`, hâlâ destekleniyor)
- `pnpm` tercih edilir (veya [Bun iş akışı](/tr/install/bun) kullanıyorsanız Bun)
- Docker (isteğe bağlı; yalnızca container tabanlı kurulum/e2e için — bkz. [Docker](/tr/install/docker))

## Özelleştirme stratejisi (böylece güncellemeler zarar vermez)

Hem “bana %100 uyarlanmış” hem de kolay güncellemeler istiyorsanız, özelleştirmelerinizi burada tutun:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5 benzeri)
- **Workspace:** `~/.openclaw/workspace` (Skills, istemler, anılar; bunu özel bir git reposu yapın)

Bir kez başlatın:

```bash
openclaw setup
```

Bu repo içinden yerel CLI girişini kullanın:

```bash
openclaw setup
```

Henüz global bir kurulumunuz yoksa, `pnpm openclaw setup` ile çalıştırın (veya Bun iş akışını kullanıyorsanız `bun run openclaw setup`).

## Gateway’i bu repodan çalıştırma

`pnpm build` sonrasında, paketlenmiş CLI’ı doğrudan çalıştırabilirsiniz:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Kararlı iş akışı (önce macOS uygulaması)

1. **OpenClaw.app**’i yükleyin ve başlatın (menü çubuğu).
2. Onboarding/izin kontrol listesini tamamlayın (TCC istemleri).
3. Gateway’in **Yerel** olduğundan ve çalıştığından emin olun (uygulama bunu yönetir).
4. Yüzeyleri bağlayın (örnek: WhatsApp):

```bash
openclaw channels login
```

5. Temel kontrol:

```bash
openclaw health
```

Derlemenizde onboarding mevcut değilse:

- `openclaw setup` komutunu çalıştırın, ardından `openclaw channels login` komutunu çalıştırın, sonra Gateway’i manuel olarak başlatın (`openclaw gateway`).

## En güncel iş akışı (bir terminalde Gateway)

Amaç: TypeScript Gateway üzerinde çalışmak, hot reload almak ve macOS uygulaması arayüzünü bağlı tutmak.

### 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın

macOS uygulamasının da en güncel sürümde olmasını istiyorsanız:

```bash
./scripts/restart-mac.sh
```

### 1) Geliştirme Gateway’ini başlatın

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/workspace sıfırlandıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`, gateway’i izleme modunda çalıştırır ve ilgili kaynak,
config ve paketlenmiş plugin meta verisi değişikliklerinde yeniden yükler.
`pnpm openclaw setup`, yeni bir checkout için tek seferlik yerel config/workspace başlatma adımıdır.
`pnpm gateway:watch`, `dist/control-ui` dosyasını yeniden derlemez; bu yüzden `ui/` değişikliklerinden sonra `pnpm ui:build` komutunu yeniden çalıştırın veya Control UI geliştirirken `pnpm ui:dev` kullanın.

Bun iş akışını özellikle kullanıyorsanız, eşdeğer komutlar şunlardır:

```bash
bun install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/workspace sıfırlandıktan sonra)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS uygulamasını çalışan Gateway’inize yönlendirin

**OpenClaw.app** içinde:

- Bağlantı Modu: **Yerel**
  Uygulama, yapılandırılmış port üzerindeki çalışan gateway’e bağlanacaktır.

### 3) Doğrulama

- Uygulama içi Gateway durumu **“Using existing gateway …”** olarak görünmelidir
- Veya CLI ile:

```bash
openclaw health
```

### Yaygın tuzaklar

- **Yanlış port:** Gateway WS varsayılanı `ws://127.0.0.1:18789` şeklindedir; uygulama ve CLI aynı portu kullanmalıdır.
- **Durumun bulunduğu yer:**
  - Kanal/sağlayıcı durumu: `~/.openclaw/credentials/`
  - Model kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Oturumlar: `~/.openclaw/agents/<agentId>/sessions/`
  - Günlükler: `/tmp/openclaw/`

## Kimlik bilgisi depolama haritası

Kimlik doğrulamayı hata ayıklarken veya neyi yedeklemeniz gerektiğine karar verirken bunu kullanın:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token’ı**: config/env veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink’ler reddedilir)
- **Discord bot token’ı**: config/env veya SecretRef (env/file/exec sağlayıcıları)
- **Slack token’ları**: config/env (`channels.slack.*`)
- **Eşleme izin listeleri**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (varsayılan hesap)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (varsayılan olmayan hesaplar)
- **Model kimlik doğrulama profilleri**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dosya destekli sır yükü (isteğe bağlı)**: `~/.openclaw/secrets.json`
- **Eski OAuth içe aktarma**: `~/.openclaw/credentials/oauth.json`
  Daha fazla ayrıntı: [Güvenlik](/tr/gateway/security#credential-storage-map).

## Güncelleme (kurulumunuzu bozmadan)

- `~/.openclaw/workspace` ve `~/.openclaw/` dizinlerini “size ait şeyler” olarak tutun; kişisel istemlerinizi/config bilgilerinizi `openclaw` reposuna koymayın.
- Kaynağı güncelleme: `git pull` + seçtiğiniz paket yöneticisi kurulum adımı (varsayılan olarak `pnpm install`; Bun iş akışı için `bun install`) + eşleşen `gateway:watch` komutunu kullanmaya devam edin.

## Linux (systemd kullanıcı hizmeti)

Linux kurulumları systemd **kullanıcı** hizmeti kullanır. Varsayılan olarak systemd, çıkış yapıldığında/boşta kalındığında kullanıcı
hizmetlerini durdurur; bu da Gateway’i kapatır. Onboarding, sizin için
linger özelliğini etkinleştirmeyi dener (sudo isteyebilir). Hâlâ kapalıysa, şunu çalıştırın:

```bash
sudo loginctl enable-linger $USER
```

Her zaman açık veya çok kullanıcılı sunucular için, kullanıcı hizmeti yerine bir **sistem** hizmeti
düşünün (linger gerekmez). systemd notları için [Gateway çalışma kılavuzu](/tr/gateway) bölümüne bakın.

## İlgili belgeler

- [Gateway çalışma kılavuzu](/tr/gateway) (bayraklar, denetim, portlar)
- [Gateway yapılandırması](/tr/gateway/configuration) (config şeması + örnekler)
- [Discord](/tr/channels/discord) ve [Telegram](/tr/channels/telegram) (yanıt etiketleri + replyToMode ayarları)
- [OpenClaw assistant kurulumu](/tr/start/openclaw)
- [macOS uygulaması](/tr/platforms/macos) (gateway yaşam döngüsü)
