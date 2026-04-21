---
read_when:
    - 같은 머신에서 둘 이상의 Gateway 실행하기
    - 각 Gateway마다 격리된 구성/상태/포트가 필요합니다
summary: 한 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트, 프로필)
title: 여러 Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 여러 Gateway(같은 호스트)

대부분의 설정에서는 하나의 Gateway를 사용하는 것이 좋습니다. 단일 Gateway로 여러 메시징 연결과 에이전트를 처리할 수 있기 때문입니다. 더 강한 격리나 이중화(예: 복구 봇)가 필요하다면, 프로필과 포트를 격리한 별도의 Gateway를 실행하세요.

## 가장 권장되는 설정

대부분의 사용자에게 가장 간단한 복구 봇 설정은 다음과 같습니다.

- 메인 봇은 기본 프로필에서 유지
- 복구 봇은 `--profile rescue`로 실행
- 복구 계정에는 완전히 별도의 Telegram 봇 사용
- 복구 봇은 `19789` 같은 다른 기본 포트에서 유지

이렇게 하면 복구 봇이 메인 봇과 격리되므로, 기본 봇이 다운되었을 때도 디버그를 하거나 구성 변경을 적용할 수 있습니다. 파생된 browser/canvas/CDP 포트가 절대 충돌하지 않도록 기본 포트 사이에는 최소 20개 포트 간격을 두세요.

## 복구 봇 빠른 시작

특별한 이유가 없다면 이것을 기본 경로로 사용하세요.

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

메인 봇이 이미 실행 중이라면, 보통 이것만으로 충분합니다.

`openclaw --profile rescue onboard` 중에는 다음을 따르세요.

- 별도의 Telegram 봇 토큰 사용
- `rescue` 프로필 유지
- 메인 봇보다 최소 20 높은 기본 포트 사용
- 이미 직접 관리하는 것이 아니라면 기본 복구 workspace를 수락

온보딩이 이미 복구 서비스를 설치했다면, 마지막 `gateway install`은 필요하지 않습니다.

## 이것이 작동하는 이유

복구 봇은 다음을 각각 따로 가지므로 독립적으로 유지됩니다.

- 프로필/구성
- 상태 디렉터리
- workspace
- 기본 포트(및 파생 포트)
- Telegram 봇 토큰

대부분의 설정에서는 복구 프로필에 완전히 별도의 Telegram 봇을 사용하세요.

- 운영자 전용으로 유지하기 쉬움
- 별도의 봇 토큰과 ID
- 메인 봇의 채널/앱 설치와 독립적
- 메인 봇이 망가졌을 때 간단한 DM 기반 복구 경로 제공

## `--profile rescue onboard`가 변경하는 내용

`openclaw --profile rescue onboard`는 일반 온보딩 흐름을 사용하지만, 모든 내용을 별도의 프로필에 기록합니다.

실제로는 복구 봇이 다음을 각각 따로 갖게 된다는 뜻입니다.

- 구성 파일
- 상태 디렉터리
- workspace(기본값 `~/.openclaw/workspace-rescue`)
- 관리형 서비스 이름

그 외의 프롬프트는 일반 온보딩과 동일합니다.

## 일반적인 다중 Gateway 설정

위의 복구 봇 레이아웃이 가장 쉬운 기본값이지만, 같은 격리 패턴은 한 호스트에서 어떤 Gateway 쌍이나 그룹에도 적용됩니다.

더 일반적인 설정에서는, 추가 Gateway마다 고유한 이름의 프로필과 고유한 기본 포트를 지정하세요.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

두 Gateway 모두 이름 있는 프로필을 사용하도록 해도 괜찮습니다.

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

서비스도 같은 패턴을 따릅니다.

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

대체 운영 경로가 필요하다면 복구 봇 빠른 시작을 사용하세요. 서로 다른 채널, 테넌트, workspace, 또는 운영 역할을 위해 여러 장기 실행 Gateway가 필요하다면 일반 프로필 패턴을 사용하세요.

## 격리 체크리스트

Gateway 인스턴스마다 다음 항목은 고유하게 유지하세요.

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 구성 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, 자격 증명, 캐시
- `agents.defaults.workspace` — 인스턴스별 workspace 루트
- `gateway.port` (또는 `--port`) — 인스턴스별 고유 값
- 파생된 browser/canvas/CDP 포트

이 항목들을 공유하면 구성 경합과 포트 충돌이 발생합니다.

## 포트 매핑(파생)

기본 포트 = `gateway.port` (또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser control service 포트 = 기본 포트 + 2 (loopback 전용)
- canvas host는 Gateway HTTP 서버에서 제공됨 (`gateway.port`와 같은 포트)
- Browser 프로필 CDP 포트는 `browser.controlPort + 9 .. + 108` 범위에서 자동 할당됨

구성이나 env에서 이 값들 중 하나라도 재정의한다면, 인스턴스마다 고유하게 유지해야 합니다.

## Browser/CDP 참고 사항(흔한 실수)

- 여러 인스턴스에서 `browser.cdpUrl`을 같은 값으로 고정하지 마세요.
- 각 인스턴스에는 자체 browser control 포트와 CDP 범위가 필요합니다(Gateway 포트에서 파생됨).
- 명시적인 CDP 포트가 필요하다면, 인스턴스별로 `browser.profiles.<name>.cdpPort`를 설정하세요.
- 원격 Chrome에는 `browser.profiles.<name>.cdpUrl`을 사용하세요(프로필별, 인스턴스별).

## 수동 env 예시

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 빠른 확인

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

해석:

- `gateway status --deep`는 이전 설치에서 남은 오래된 launchd/systemd/schtasks 서비스를 찾아내는 데 도움이 됩니다.
- `gateway probe` 경고 텍스트(예: `multiple reachable gateways detected`)는 의도적으로 둘 이상의 격리된 gateway를 실행할 때에만 정상입니다.
