---
read_when:
    - OpenClaw가 지원하는 기능의 전체 목록을 원하시는 것입니다
summary: 채널, 라우팅, 미디어, UX 전반에 걸친 OpenClaw 기능.
title: 기능
x-i18n:
    generated_at: "2026-04-24T06:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## 주요 기능

<Columns>
  <Card title="채널" icon="message-square" href="/ko/channels">
    하나의 Gateway로 Discord, Google Chat, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat 등 다양한 채널을 지원합니다.
  </Card>
  <Card title="Plugins" icon="plug" href="/ko/tools/plugin">
    번들 Plugins를 통해 현재 일반 릴리스에서 별도 설치 없이 Matrix, Nextcloud Talk, Nostr, Twitch, Zalo 등을 추가할 수 있습니다.
  </Card>
  <Card title="라우팅" icon="route" href="/ko/concepts/multi-agent">
    격리된 세션을 사용하는 멀티 에이전트 라우팅.
  </Card>
  <Card title="미디어" icon="image" href="/ko/nodes/images">
    이미지, 오디오, 비디오, 문서, 그리고 이미지/비디오 생성.
  </Card>
  <Card title="앱 및 UI" icon="monitor" href="/ko/web/control-ui">
    웹 Control UI와 macOS 컴패니언 앱.
  </Card>
  <Card title="모바일 노드" icon="smartphone" href="/ko/nodes">
    페어링, 음성/채팅, 풍부한 기기 명령을 갖춘 iOS 및 Android 노드.
  </Card>
</Columns>

## 전체 목록

**채널:**

- 내장 채널에는 Discord, Google Chat, iMessage(레거시), IRC, Signal, Slack, Telegram, WebChat, WhatsApp이 포함됩니다
- 번들 Plugin 채널에는 iMessage용 BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal이 포함됩니다
- 선택적으로 별도 설치하는 채널 Plugins에는 Voice Call 및 WeChat 같은 서드파티 패키지가 포함됩니다
- 서드파티 채널 Plugins는 WeChat 같은 방식으로 Gateway를 추가 확장할 수 있습니다
- 멘션 기반 활성화를 통한 그룹 채팅 지원
- 허용 목록과 페어링을 통한 DM 안전성

**에이전트:**

- 도구 스트리밍이 포함된 임베디드 에이전트 런타임
- 워크스페이스 또는 발신자별 격리된 세션을 사용하는 멀티 에이전트 라우팅
- 세션: 다이렉트 채팅은 공유 `main`으로 합쳐지고, 그룹은 격리됩니다
- 긴 응답을 위한 스트리밍 및 청크 처리

**인증 및 provider:**

- 35개 이상의 모델 provider(Anthropic, OpenAI, Google 등)
- OAuth를 통한 구독 인증(예: OpenAI Codex)
- 사용자 정의 및 자체 호스팅 provider 지원(vLLM, SGLang, Ollama, 그리고 모든 OpenAI 호환 또는 Anthropic 호환 엔드포인트)

**미디어:**

- 이미지, 오디오, 비디오, 문서 입출력
- 공유 이미지 생성 및 비디오 생성 기능 표면
- 음성 메모 전사
- 여러 provider를 통한 텍스트 음성 변환

**앱 및 인터페이스:**

- WebChat 및 브라우저 Control UI
- macOS 메뉴 막대 컴패니언 앱
- 페어링, Canvas, 카메라, 화면 녹화, 위치, 음성을 지원하는 iOS 노드
- 페어링, 채팅, 음성, Canvas, 카메라, 기기 명령을 지원하는 Android 노드

**도구 및 자동화:**

- 브라우저 자동화, exec, 샌드박싱
- 웹 검색(Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron 작업 및 Heartbeat 스케줄링
- Skills, Plugins, 워크플로 파이프라인(Lobster)

## 관련

- [실험적 기능](/ko/concepts/experimental-features)
- [에이전트 런타임](/ko/concepts/agent)
