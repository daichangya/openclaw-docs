---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına ilişkin hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'un bağlanabildiği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-04-25T13:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Teslim notları

- `![alt](url)` gibi markdown görsel sözdizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'ler grup sohbeti olarak yönlendirilir; bu nedenle grup ilkesi, mention
  davranışı ve grup oturumu kuralları MPIM konuşmaları için geçerlidir.
- WhatsApp kurulumu isteğe bağlı yükleme şeklindedir: onboarding, Baileys çalışma zamanı bağımlılıkları
  hazırlanmeden önce kurulum akışını gösterebilir ve Gateway, WhatsApp
  çalışma zamanını yalnızca kanal gerçekten etkin olduğunda yükler.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) — **iMessage için önerilir**; BlueBubbles macOS sunucusu REST API'sini tam özellik desteğiyle kullanır (paketlenmiş plugin; düzenleme, geri gönderimi kaldırma, efektler, tepkiler, grup yönetimi — düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/tr/channels/discord) — Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) — WebSocket üzerinden Feishu/Lark botu (paketlenmiş plugin).
- [Google Chat](/tr/channels/googlechat) — HTTP Webhook üzerinden Google Chat API uygulaması.
- [iMessage (legacy)](/tr/channels/imessage) — `imsg` CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırıldı, yeni kurulumlarda BlueBubbles kullanın).
- [IRC](/tr/channels/irc) — Klasik IRC sunucuları; eşleştirme/izin listesi denetimleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) — LINE Messaging API botu (paketlenmiş plugin).
- [Matrix](/tr/channels/matrix) — Matrix protokolü (paketlenmiş plugin).
- [Mattermost](/tr/channels/mattermost) — Bot API + WebSocket; kanallar, gruplar, DM'ler (paketlenmiş plugin).
- [Microsoft Teams](/tr/channels/msteams) — Bot Framework; kurumsal destek (paketlenmiş plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) — Nextcloud Talk üzerinden self-hosted sohbet (paketlenmiş plugin).
- [Nostr](/tr/channels/nostr) — NIP-04 üzerinden merkeziyetsiz DM'ler (paketlenmiş plugin).
- [QQ Bot](/tr/channels/qqbot) — QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketlenmiş plugin).
- [Signal](/tr/channels/signal) — `signal-cli`; gizlilik odaklı.
- [Slack](/tr/channels/slack) — Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) — giden+gelen Webhook'lar üzerinden Synology NAS Chat (paketlenmiş plugin).
- [Telegram](/tr/channels/telegram) — `grammY` üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) — Urbit tabanlı mesajlaşma uygulaması (paketlenmiş plugin).
- [Twitch](/tr/channels/twitch) — IRC bağlantısı üzerinden Twitch sohbeti (paketlenmiş plugin).
- [Voice Call](/tr/plugins/voice-call) — Plivo veya Twilio üzerinden telefon hizmeti (plugin, ayrı yüklenir).
- [WebChat](/tr/web/webchat) — WebSocket üzerinden Gateway WebChat UI.
- [WeChat](/tr/channels/wechat) — QR giriş üzerinden Tencent iLink Bot plugin'i; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) — En popüler seçenek; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Zalo](/tr/channels/zalo) — Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketlenmiş plugin).
- [Zalo Personal](/tr/channels/zalouser) — QR giriş üzerinden kişisel Zalo hesabı (paketlenmiş plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet bazında yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot belirteci). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Groups](/tr/channels/groups).
- Güvenlik için DM eşleştirmesi ve izin listeleri zorunlu tutulur; bkz. [Security](/tr/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Providers](/tr/providers/models).
