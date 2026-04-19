---
read_when:
    - OpenClaw용 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼에 대한 빠른 개요가 필요합니다
summary: OpenClaw이 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# 채팅 채널

OpenClaw은 이미 사용 중인 어떤 채팅 앱에서든 여러분과 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 어디서나 지원되며, 미디어와 반응은 채널마다 다릅니다.

## 지원되는 채널

- [BlueBubbles](/ko/channels/bluebubbles) — **iMessage에 권장**; 전체 기능 지원과 함께 BlueBubbles macOS 서버 REST API를 사용합니다(번들 Plugin; 편집, 보내기 취소, 효과, 반응, 그룹 관리 — 편집은 현재 macOS 26 Tahoe에서 작동하지 않음).
- [Discord](/ko/channels/discord) — Discord Bot API + Gateway; 서버, 채널, DM을 지원합니다.
- [Feishu](/ko/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇(번들 Plugin).
- [Google Chat](/ko/channels/googlechat) — HTTP Webhook을 통한 Google Chat API 앱.
- [iMessage (legacy)](/ko/channels/imessage) — imsg CLI를 통한 레거시 macOS 통합(지원 중단 예정, 새 설정에는 BlueBubbles 사용).
- [IRC](/ko/channels/irc) — 클래식 IRC 서버; 페어링/허용 목록 제어가 있는 채널 + DM.
- [LINE](/ko/channels/line) — LINE Messaging API 봇(번들 Plugin).
- [Matrix](/ko/channels/matrix) — Matrix 프로토콜(번들 Plugin).
- [Mattermost](/ko/channels/mattermost) — Bot API + WebSocket; 채널, 그룹, DM(번들 Plugin).
- [Microsoft Teams](/ko/channels/msteams) — Bot Framework; 엔터프라이즈 지원(번들 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) — Nextcloud Talk를 통한 셀프 호스팅 채팅(번들 Plugin).
- [Nostr](/ko/channels/nostr) — NIP-04를 통한 분산형 DM(번들 Plugin).
- [QQ Bot](/ko/channels/qqbot) — QQ Bot API; 개인 채팅, 그룹 채팅, 리치 미디어(번들 Plugin).
- [Signal](/ko/channels/signal) — signal-cli; 개인정보 보호 중심.
- [Slack](/ko/channels/slack) — Bolt SDK; 워크스페이스 앱.
- [Synology Chat](/ko/channels/synology-chat) — 발신+수신 Webhook을 통한 Synology NAS Chat(번들 Plugin).
- [Telegram](/ko/channels/telegram) — grammY를 통한 Bot API; 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) — Urbit 기반 메신저(번들 Plugin).
- [Twitch](/ko/channels/twitch) — IRC 연결을 통한 Twitch 채팅(번들 Plugin).
- [Voice Call](/ko/plugins/voice-call) — Plivo 또는 Twilio를 통한 전화 통신(Plugin, 별도 설치).
- [WebChat](/web/webchat) — WebSocket을 통한 Gateway WebChat UI.
- [WeChat](/ko/channels/wechat) — QR 로그인 방식의 Tencent iLink Bot Plugin; 개인 채팅만 지원(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) — 가장 인기 있음; Baileys를 사용하며 QR 페어링이 필요합니다.
- [Zalo](/ko/channels/zalo) — Zalo Bot API; 베트남에서 인기 있는 메신저(번들 Plugin).
- [Zalo Personal](/ko/channels/zalouser) — QR 로그인을 통한 Zalo 개인 계정(번들 Plugin).

## 참고

- 채널은 동시에 실행할 수 있으며, 여러 개를 구성하면 OpenClaw이 채팅별로 라우팅합니다.
- 가장 빠른 설정은 보통 **Telegram**입니다(간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하며
  디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [Groups](/ko/channels/groups)를 참고하세요.
- 안전을 위해 DM 페어링과 허용 목록이 적용됩니다. [Security](/ko/gateway/security)를 참고하세요.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [Model Providers](/ko/providers/models)를 참고하세요.
