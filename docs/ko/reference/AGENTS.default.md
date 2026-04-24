---
read_when:
    - 새 OpenClaw 에이전트 세션 시작하기
    - 기본 Skills 활성화 또는 감사하기
summary: 개인 비서 설정을 위한 기본 OpenClaw 에이전트 지침 및 Skills 명단
title: 기본 AGENTS.md
x-i18n:
    generated_at: "2026-04-24T06:33:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw 개인 비서(기본값)

## 첫 실행(권장)

OpenClaw는 에이전트를 위해 전용 워크스페이스 디렉터리를 사용합니다. 기본값: `~/.openclaw/workspace` (`agents.defaults.workspace`를 통해 구성 가능).

1. 워크스페이스 생성(아직 없다면):

```bash
mkdir -p ~/.openclaw/workspace
```

2. 기본 워크스페이스 템플릿을 워크스페이스로 복사:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 선택 사항: 개인 비서 Skills 명단을 원한다면 AGENTS.md를 이 파일로 교체:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 선택 사항: `agents.defaults.workspace`를 설정해 다른 워크스페이스 선택(`~` 지원):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 기본 안전 설정

- 디렉터리나 시크릿을 채팅에 덤프하지 마세요.
- 명시적으로 요청받지 않은 한 파괴적인 명령을 실행하지 마세요.
- 외부 메시징 표면에 부분/스트리밍 응답을 보내지 마세요(최종 응답만).

## 세션 시작(필수)

- `SOUL.md`, `USER.md`, 그리고 `memory/`의 오늘+어제를 읽으세요.
- 존재하면 `MEMORY.md`를 읽으세요.
- 응답하기 전에 수행하세요.

## Soul(필수)

- `SOUL.md`는 정체성, 말투, 경계를 정의합니다. 최신 상태로 유지하세요.
- `SOUL.md`를 변경하면 사용자에게 알리세요.
- 당신은 각 세션마다 새로운 인스턴스이며, 연속성은 이 파일들에 있습니다.

## 공유 공간(권장)

- 당신은 사용자의 목소리가 아닙니다. 그룹 채팅이나 공개 채널에서는 신중하게 행동하세요.
- 개인 데이터, 연락처 정보, 내부 메모를 공유하지 마세요.

## 메모리 시스템(권장)

- 일일 로그: `memory/YYYY-MM-DD.md` (`memory/`가 필요하면 생성)
- 장기 메모리: 지속되는 사실, 선호도, 결정은 `MEMORY.md`
- 소문자 `memory.md`는 레거시 복구 입력 전용입니다. 의도적으로 두 개의 루트 파일을 모두 유지하지 마세요.
- 세션 시작 시 오늘 + 어제 + 존재하는 경우 `MEMORY.md`를 읽으세요.
- 기록할 항목: 결정, 선호도, 제약, 열린 루프.
- 명시적으로 요청받지 않은 한 시크릿은 피하세요.

## 도구 및 Skills

- 도구는 Skills 안에 있습니다. 필요할 때 각 skill의 `SKILL.md`를 따르세요.
- 환경별 메모는 `TOOLS.md`(Notes for Skills)에 보관하세요.

## 백업 팁(권장)

이 워크스페이스를 Clawd의 “메모리”로 다룬다면 git 저장소로 만드세요(가능하면 비공개). 그러면 `AGENTS.md`와 메모리 파일을 백업할 수 있습니다.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 선택 사항: 비공개 remote 추가 + push
```

## OpenClaw가 하는 일

- WhatsApp gateway + Pi 코딩 에이전트를 실행하여 비서가 채팅을 읽고/쓰고, 컨텍스트를 가져오고, 호스트 Mac을 통해 Skills를 실행할 수 있게 합니다.
- macOS 앱은 권한(screen recording, notifications, microphone)을 관리하고 번들 바이너리를 통해 `openclaw` CLI를 노출합니다.
- 직접 채팅은 기본적으로 에이전트의 `main` 세션으로 합쳐지고, 그룹은 `agent:<agentId>:<channel>:group:<id>`로 격리되며(룸/채널: `agent:<agentId>:<channel>:channel:<id>`), Heartbeat가 백그라운드 작업을 계속 살려 둡니다.

## 핵심 Skills(Settings → Skills에서 활성화)

- **mcporter** — 외부 skill 백엔드를 관리하는 도구 서버 런타임/CLI
- **Peekaboo** — 선택적 AI vision 분석이 있는 빠른 macOS 스크린샷
- **camsnap** — RTSP/ONVIF 보안 카메라에서 프레임, 클립 또는 모션 알림 캡처
- **oracle** — 세션 재생 및 브라우저 제어가 있는 OpenAI 준비형 에이전트 CLI
- **eightctl** — 터미널에서 수면 제어
- **imsg** — iMessage 및 SMS 전송, 읽기, 스트리밍
- **wacli** — WhatsApp CLI: 동기화, 검색, 전송
- **discord** — Discord 작업: 반응, 스티커, 투표. `user:<id>` 또는 `channel:<id>` 대상을 사용하세요(숫자 ID만 단독으로 쓰면 모호함)
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts
- **spotify-player** — 검색/큐잉/재생 제어를 위한 터미널 Spotify 클라이언트
- **sag** — mac 스타일 say UX를 가진 ElevenLabs speech. 기본적으로 스피커로 스트리밍
- **Sonos CLI** — 스크립트에서 Sonos 스피커 제어(탐색/상태/재생/볼륨/그룹화)
- **blucli** — 스크립트에서 BluOS 플레이어 재생, 그룹화, 자동화
- **OpenHue CLI** — 장면 및 자동화를 위한 Philips Hue 조명 제어
- **OpenAI Whisper** — 빠른 받아쓰기와 음성메일 전사를 위한 로컬 speech-to-text
- **Gemini CLI** — 빠른 Q&A를 위한 터미널의 Google Gemini 모델
- **agent-tools** — 자동화 및 헬퍼 스크립트를 위한 유틸리티 툴킷

## 사용 참고

- 스크립팅에는 `openclaw` CLI를 우선 사용하세요. mac 앱이 권한을 처리합니다.
- 설치는 Skills 탭에서 실행하세요. 바이너리가 이미 있으면 버튼을 숨깁니다.
- 비서가 알림 예약, 받은편지함 모니터링, 카메라 캡처 트리거를 할 수 있도록 Heartbeat를 활성화해 두세요.
- Canvas UI는 네이티브 오버레이와 함께 전체 화면으로 실행됩니다. 중요한 제어를 왼쪽 위/오른쪽 위/아래쪽 가장자리에 두지 마세요. 레이아웃에 명시적 여백을 추가하고 safe-area inset에 의존하지 마세요.
- 브라우저 기반 검증에는 OpenClaw가 관리하는 Chrome 프로필과 함께 `openclaw browser`(tabs/status/screenshot)를 사용하세요.
- DOM 검사에는 `openclaw browser eval|query|dom|snapshot`을 사용하세요(기계 출력이 필요하면 `--json`/`--out` 사용).
- 상호작용에는 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`을 사용하세요(click/type은 snapshot ref 필요, CSS selector에는 `evaluate` 사용).

## 관련

- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [에이전트 런타임](/ko/concepts/agent)
