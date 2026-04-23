---
read_when:
    - Kanal bağlantısını veya Gateway sağlığını tanılama
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık denetimi komutları ve Gateway sağlık izleme
title: Sağlık Denetimleri
x-i18n:
    generated_at: "2026-04-23T09:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Sağlık Denetimleri (CLI)

Tahmin yürütmeden kanal bağlantısını doğrulamak için kısa rehber.

## Hızlı denetimler

- `openclaw status` — yerel özet: Gateway erişilebilirliği/modu, güncelleme ipucu, bağlantılı kanal kimlik doğrulama yaşı, oturumlar + yakın tarihli etkinlik.
- `openclaw status --all` — tam yerel tanılama (salt okunur, renkli, hata ayıklama için güvenle yapıştırılabilir).
- `openclaw status --deep` — çalışan Gateway'den canlı sağlık yoklaması ister (`probe:true` ile `health`), desteklendiğinde hesap başına kanal yoklamaları da dahil.
- `openclaw health` — çalışan Gateway'den sağlık anlık görüntüsünü ister (yalnızca WS; CLI'den doğrudan kanal soketleri yok).
- `openclaw health --verbose` — canlı sağlık yoklamasını zorlar ve Gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Ajanı çağırmadan durum yanıtı almak için WhatsApp/WebChat'te bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyalarını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

## Derin tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol config'de geçersiz kılınabilir). Sayı ve son alıcılar `status` tarafından gösterilir.
- Yeniden bağlama akışı: günlüklerde 409–515 durum kodları veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR giriş akışı, eşleştirmeden sonra 515 durumu için bir kez otomatik yeniden başlar.)
- Tanılama varsayılan olarak etkindir. `diagnostics.enabled: false` ayarlanmadığı sürece Gateway işletimsel gerçekleri kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Aşırı büyük payload olayları, mümkün olduğunda reddedilen, kısaltılan veya parçalanan öğeyi; ayrıca boyutları ve sınırları kaydeder. Mesaj metnini, ek içeriklerini, Webhook gövdesini, ham istek veya yanıt gövdesini, belirteçleri, çerezleri veya gizli değerleri kaydetmezler. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden erişilebilen sınırlı kararlılık kaydedicisini başlatır. Ölümcül Gateway çıkışları, kapatma zaman aşımları ve yeniden başlatma açılış hataları, olay varsa en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altında kalıcılaştırır; kaydedilmiş en yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve üretilen zip dosyasını ekleyin. Dışa aktarma; Markdown özeti, en yeni kararlılık paketi, arındırılmış günlük meta verileri, arındırılmış Gateway status/health anlık görüntüleri ve config biçimini birleştirir. Paylaşılması amaçlanmıştır: sohbet metni, Webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları ve gizli değerler çıkarılır veya redakte edilir.

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: Gateway'in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: Sağlık izleyici bayat kabul edip yeniden başlatmadan önce bağlı bir kanalın ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya eşit tutun.
- `gateway.channelMaxRestartsPerHour`: kanal/hesap başına sağlık izleyici yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izlemeyi açık bırakırken belirli bir kanal için sağlık izleyici yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kanal düzeyi ayarı geçersiz kılan çoklu hesap geçersiz kılması.
- Bu kanal başına geçersiz kılmalar, bugün bunları açığa çıkaran yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya 409–515 durumu → `openclaw channels logout`, sonra `openclaw channels login` ile yeniden bağlayın.
- Gateway erişilemiyor → başlatın: `openclaw gateway --port 18789` (port meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve gönderenin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için allowlist + bahsetme kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Ayrı `health` komutu

`openclaw health`, çalışan Gateway'den sağlık anlık görüntüsünü ister (CLI'den doğrudan kanal soketleri yoktur). Varsayılan olarak yeni bir önbelleğe alınmış Gateway anlık görüntüsü döndürebilir; ardından Gateway bu önbelleği arka planda yeniler. `openclaw health --verbose` bunun yerine canlı yoklamayı zorlar. Komut, mevcut olduğunda bağlantılı kimlik bilgileri/kimlik doğrulama yaşını, kanal başına yoklama özetlerini, oturum deposu özetini ve yoklama süresini bildirir. Gateway'e ulaşılamazsa veya yoklama başarısız olur/zaman aşımına uğrarsa sıfır olmayan kodla çıkar.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 sn yoklama zaman aşımını geçersiz kılar
- `--verbose`: canlı yoklamayı zorlar ve Gateway bağlantı ayrıntılarını yazdırır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (zaman damgası), `durationMs` (yoklama süresi), kanal başına durum, ajan kullanılabilirliği ve oturum deposu özeti.
