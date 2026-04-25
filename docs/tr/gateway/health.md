---
read_when:
    - Kanal bağlantısını veya Gateway sağlığını tanılama
    - Sağlık denetimi CLI komutlarını ve seçeneklerini anlama
summary: Sağlık denetimi komutları ve Gateway sağlık izleme
title: Sağlık denetimleri
x-i18n:
    generated_at: "2026-04-25T13:47:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Tahmin yürütmeden kanal bağlantısını doğrulamak için kısa kılavuz.

## Hızlı denetimler

- `openclaw status` — yerel özet: Gateway erişilebilirliği/modu, güncelleme ipucu, bağlı kanal auth yaşı, oturumlar + son etkinlik.
- `openclaw status --all` — tam yerel tanılama (salt okunur, renkli, hata ayıklama için paylaşması güvenli).
- `openclaw status --deep` — çalışan Gateway’den canlı bir sağlık yoklaması ister (`probe:true` ile `health`), destekleniyorsa hesap başına kanal yoklamaları da dahil.
- `openclaw health` — çalışan Gateway’den sağlık anlık görüntüsünü ister (yalnızca WS; CLI’dan doğrudan kanal soketleri yoktur).
- `openclaw health --verbose` — canlı bir sağlık yoklamasını zorlar ve Gateway bağlantı ayrıntılarını yazdırır.
- `openclaw health --json` — makine tarafından okunabilir sağlık anlık görüntüsü çıktısı.
- Agent’ı çağırmadan durum yanıtı almak için WhatsApp/WebChat içinde bağımsız bir mesaj olarak `/status` gönderin.
- Günlükler: `/tmp/openclaw/openclaw-*.log` dosyalarını izleyin ve `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` için filtreleyin.

## Derin tanılama

- Diskteki kimlik bilgileri: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` değeri yakın tarihli olmalıdır).
- Oturum deposu: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (yol config içinde geçersiz kılınabilir). Sayı ve son alıcılar `status` aracılığıyla gösterilir.
- Yeniden bağlama akışı: günlüklerde 409–515 durum kodları veya `loggedOut` göründüğünde `openclaw channels logout && openclaw channels login --verbose`. (Not: QR giriş akışı, eşleştirmeden sonra 515 durumu için bir kez otomatik olarak yeniden başlar.)
- Tanılama varsayılan olarak etkindir. `diagnostics.enabled: false` ayarlanmadıkça Gateway operasyonel gerçekleri kaydeder. Bellek olayları RSS/heap bayt sayılarını, eşik baskısını ve büyüme baskısını kaydeder. Aşırı büyük payload olayları, varsa boyutlar ve sınırlarla birlikte neyin reddedildiğini, kısaltıldığını veya parçalara ayrıldığını kaydeder. Mesaj metnini, ek içeriklerini, Webhook gövdesini, ham istek veya yanıt gövdesini, token'ları, cookie'leri veya gizli değerleri kaydetmez. Aynı Heartbeat, `openclaw gateway stability` veya `diagnostics.stability` Gateway RPC üzerinden erişilebilen sınırlı kararlılık kaydedicisini başlatır. Ölümcül Gateway çıkışları, kapatma zaman aşımı ve yeniden başlatma başlangıç hataları, olaylar varsa en son kaydedici anlık görüntüsünü `~/.openclaw/logs/stability/` altına kalıcı olarak yazar; kaydedilmiş en yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- Hata raporları için `openclaw gateway diagnostics export` çalıştırın ve oluşturulan zip dosyasını ekleyin. Dışa aktarma, bir Markdown özeti, en yeni kararlılık paketi, temizlenmiş günlük meta verileri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve yapılandırma biçimini birleştirir. Paylaşılmak üzere tasarlanmıştır: sohbet metni, Webhook gövdeleri, araç çıktıları, kimlik bilgileri, cookie'ler, hesap/mesaj tanımlayıcıları ve gizli değerler çıkarılır veya sansürlenir. Bkz. [Diagnostics Export](/tr/gateway/diagnostics).

## Sağlık izleyici yapılandırması

- `gateway.channelHealthCheckMinutes`: Gateway’in kanal sağlığını ne sıklıkla denetlediği. Varsayılan: `5`. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın.
- `gateway.channelStaleEventThresholdMinutes`: Sağlık izleyicinin onu bayat kabul edip yeniden başlatmadan önce bağlı bir kanalın ne kadar süre boşta kalabileceği. Varsayılan: `30`. Bunu `gateway.channelHealthCheckMinutes` değerine eşit veya ondan büyük tutun.
- `gateway.channelMaxRestartsPerHour`: Kanal/hesap başına sağlık izleyici yeniden başlatmaları için kayan bir saatlik üst sınır. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: Genel izlemeyi açık bırakırken belirli bir kanal için sağlık izleyici yeniden başlatmalarını devre dışı bırakır.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Kanal düzeyindeki ayarı geçen çoklu hesap geçersiz kılması.
- Kanal başına bu geçersiz kılmalar, bugün bunları sunan yerleşik kanal izleyicilerine uygulanır: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram ve WhatsApp.

## Bir şey başarısız olduğunda

- `logged out` veya 409–515 durum kodu → `openclaw channels logout`, ardından `openclaw channels login` ile yeniden bağlayın.
- Gateway’e ulaşılamıyor → başlatın: `openclaw gateway --port 18789` (port meşgulse `--force` kullanın).
- Gelen mesaj yok → bağlı telefonun çevrimiçi olduğunu ve göndericinin izinli olduğunu doğrulayın (`channels.whatsapp.allowFrom`); grup sohbetleri için izin listesi + mention kurallarının eşleştiğinden emin olun (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Adanmış `health` komutu

`openclaw health`, çalışan Gateway’den sağlık anlık görüntüsünü ister (CLI’dan doğrudan kanal soketi yoktur). Varsayılan olarak yeni bir önbelleklenmiş Gateway anlık görüntüsü döndürebilir; ardından Gateway bu önbelleği arka planda yeniler. `openclaw health --verbose` bunun yerine canlı bir yoklamayı zorlar. Komut, varsa bağlı kimlik bilgilerini/auth yaşını, kanal başına yoklama özetlerini, oturum deposu özetini ve yoklama süresini bildirir. Gateway’e ulaşılamazsa veya yoklama başarısız olursa/zaman aşımına uğrarsa sıfır olmayan çıkış koduyla sonlanır.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON çıktısı
- `--timeout <ms>`: varsayılan 10 sn yoklama zaman aşımını geçersiz kılar
- `--verbose`: canlı bir yoklamayı zorlar ve Gateway bağlantı ayrıntılarını yazdırır
- `--debug`: `--verbose` için takma ad

Sağlık anlık görüntüsü şunları içerir: `ok` (boolean), `ts` (zaman damgası), `durationMs` (yoklama süresi), kanal başına durum, agent kullanılabilirliği ve oturum deposu özeti.

## İlgili

- [Gateway runbook](/tr/gateway)
- [Diagnostics export](/tr/gateway/diagnostics)
- [Gateway troubleshooting](/tr/gateway/troubleshooting)
