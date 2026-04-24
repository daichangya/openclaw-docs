---
read_when:
    - OpenClaw.app 패키징하기
    - macOS Gateway launchd 서비스 디버깅하기
    - macOS용 Gateway CLI 설치하기
summary: macOS의 Gateway 런타임(외부 launchd 서비스)
title: macOS의 Gateway
x-i18n:
    generated_at: "2026-04-24T06:24:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app은 더 이상 Node/Bun 또는 Gateway 런타임을 번들로 포함하지 않습니다. macOS app은
외부 **`openclaw` CLI 설치**를 기대하며, Gateway를
자식 프로세스로 실행하지 않고, Gateway를 계속 실행 상태로 유지하기 위해 사용자별 launchd 서비스를 관리합니다
(또는 이미 실행 중인 기존 로컬 Gateway가 있으면 여기에 연결합니다).

## CLI 설치(로컬 모드에 필수)

Mac의 기본 런타임은 Node 24입니다. 호환성을 위해 Node 22 LTS(현재 `22.14+`)도 계속 동작합니다. 그런 다음 `openclaw`를 전역으로 설치합니다.

```bash
npm install -g openclaw@<version>
```

macOS app의 **Install CLI** 버튼은 앱이
내부적으로 사용하는 것과 동일한 전역 설치 흐름을 실행합니다. npm을 먼저 선호하고, 그다음 pnpm, 그리고 감지된
패키지 관리자가 bun뿐일 때만 bun을 사용합니다. 권장되는 Gateway 런타임은 계속 Node입니다.

## launchd (LaunchAgent로서의 Gateway)

레이블:

- `ai.openclaw.gateway`(또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`가 남아 있을 수 있음)

plist 위치(사용자별):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (또는 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

관리 주체:

- Local 모드에서 LaunchAgent 설치/업데이트는 macOS app이 담당합니다.
- CLI로도 설치할 수 있습니다: `openclaw gateway install`

동작:

- “OpenClaw Active”가 LaunchAgent를 활성화/비활성화합니다.
- 앱을 종료해도 gateway는 중지되지 않습니다(launchd가 계속 살아 있게 유지함).
- 구성된 포트에서 Gateway가 이미 실행 중이면, app은
  새로 시작하는 대신 여기에 연결합니다.

로깅:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## 버전 호환성

macOS app은 gateway 버전을 자신의 버전과 비교해 확인합니다. 서로
호환되지 않으면 앱 버전에 맞게 전역 CLI를 업데이트하세요.

## 스모크 체크

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

그런 다음:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 관련 항목

- [macOS app](/ko/platforms/macos)
- [Gateway runbook](/ko/gateway)
