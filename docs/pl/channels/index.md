---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw.
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych.
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-04-25T13:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, z której już korzystasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi w Telegram zawierające składnię obrazu Markdown, taką jak `![alt](url)`,
  są w miarę możliwości konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej.
- Wieloosobowe wiadomości prywatne w Slack są trasowane jako czaty grupowe, więc do rozmów MPIM mają zastosowanie zasady grup, zachowanie wzmianek
  i reguły sesji grupowych.
- Konfiguracja WhatsApp działa na żądanie przy instalacji: onboarding może pokazać przepływ konfiguracji, zanim zależności wykonawcze Baileys zostaną przygotowane, a Gateway ładuje środowisko wykonawcze WhatsApp tylko wtedy, gdy kanał jest rzeczywiście aktywny.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) — **Zalecane dla iMessage**; używa interfejsu REST API serwera BlueBubbles na macOS z pełną obsługą funkcji (dołączony Plugin; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupami — edycja jest obecnie uszkodzona w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) — API bota Discord + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (dołączony Plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez HTTP Webhook.
- [iMessage (legacy)](/pl/channels/imessage) — starsza integracja z macOS przez CLI imsg (przestarzała, w nowych konfiguracjach używaj BlueBubbles).
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały + wiadomości prywatne z kontrolą parowania/listy dozwolonych.
- [LINE](/pl/channels/line) — bot LINE Messaging API (dołączony Plugin).
- [Matrix](/pl/channels/matrix) — protokół Matrix (dołączony Plugin).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy, wiadomości prywatne (dołączony Plugin).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa środowisk enterprise (dołączony Plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — czat hostowany samodzielnie przez Nextcloud Talk (dołączony Plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości prywatne przez NIP-04 (dołączony Plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i rozbudowane multimedia (dołączony Plugin).
- [Signal](/pl/channels/signal) — `signal-cli`; nacisk na prywatność.
- [Slack](/pl/channels/slack) — SDK Bolt; aplikacje obszaru roboczego.
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez wychodzące i przychodzące Webhooki (dołączony Plugin).
- [Telegram](/pl/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (dołączony Plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (dołączony Plugin).
- [Voice Call](/pl/plugins/voice-call) — telefonia przez Plivo lub Twilio (Plugin instalowany osobno).
- [WebChat](/pl/web/webchat) — interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) — Plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny Plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania kodem QR.
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (dołączony Plugin).
- [Zalo Personal](/pl/channels/zalouser) — konto osobiste Zalo przez logowanie QR (dołączony Plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj wiele z nich, a OpenClaw będzie trasować według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania kodem QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się zależnie od kanału; zobacz [Groups](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są egzekwowane ze względów bezpieczeństwa; zobacz [Security](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są opisani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
