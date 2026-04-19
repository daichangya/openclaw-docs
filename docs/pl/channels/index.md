---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-04-19T01:11:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Kanały czatu

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatowej, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) — **Polecane dla iMessage**; używa interfejsu REST API serwera BlueBubbles na macOS z pełną obsługą funkcji (bundled plugin; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupami — edycja jest obecnie uszkodzona w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (bundled plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez webhook HTTP.
- [iMessage (legacy)](/pl/channels/imessage) — starsza integracja z macOS przez CLI imsg (przestarzałe, w nowych konfiguracjach użyj BlueBubbles).
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały i wiadomości prywatne z mechanizmami parowania/list dozwolonych.
- [LINE](/pl/channels/line) — bot LINE Messaging API (bundled plugin).
- [Matrix](/pl/channels/matrix) — protokół Matrix (bundled plugin).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy, wiadomości prywatne (bundled plugin).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa środowisk enterprise (bundled plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — samodzielnie hostowany czat przez Nextcloud Talk (bundled plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości prywatne przez NIP-04 (bundled plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i rozbudowane multimedia (bundled plugin).
- [Signal](/pl/channels/signal) — signal-cli; rozwiązanie nastawione na prywatność.
- [Slack](/pl/channels/slack) — Bolt SDK; aplikacje dla obszarów roboczych.
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez webhooki wychodzące i przychodzące (bundled plugin).
- [Telegram](/pl/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (bundled plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (bundled plugin).
- [Voice Call](/pl/plugins/voice-call) — telefonia przez Plivo lub Twilio (Plugin, instalowany osobno).
- [WebChat](/web/webchat) — interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) — Plugin Tencent iLink Bot przez logowanie kodem QR; tylko czaty prywatne (zewnętrzny Plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania kodem QR.
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (bundled plugin).
- [Zalo Personal](/pl/channels/zalouser) — konto osobiste Zalo przez logowanie kodem QR (bundled plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj wiele kanałów, a OpenClaw będzie kierować ruch odpowiednio dla każdego czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania kodem QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są egzekwowane ze względów bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
