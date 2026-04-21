---
read_when:
    - 같은 머신에서 둘 이상의 Gateway 실행하기
    - 각 Gateway마다 격리된 설정/상태/포트가 필요합니다
summary: 하나의 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트, 프로필)
title: 여러 Gateway
x-i18n:
    generated_at: "2026-04-21T17:45:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 여러 Gateway(같은 호스트)

대부분의 설정에서는 하나의 Gateway를 사용하는 것이 좋습니다. 단일 Gateway로 여러 메시징 연결과 에이전트를 처리할 수 있기 때문입니다. 더 강한 격리나 이중화(예: 구조용 봇)가 필요하다면, 프로필/포트를 격리한 별도의 Gateway를 실행하세요.

## 격리 체크리스트(필수)

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 설정 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, 자격 증명, 캐시
- `agents.defaults.workspace` — 인스턴스별 워크스페이스 루트
- `gateway.port` (또는 `--port`) — 인스턴스별 고유 포트
- 파생 포트(browser/canvas)는 서로 겹치면 안 됩니다

이 항목들을 공유하면 설정 경합과 포트 충돌이 발생합니다.

## 권장 사항: 메인에는 기본 프로필을, 구조용에는 이름 있는 프로필을 사용하세요

프로필은 `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH`를 자동으로 범위 지정하고 서비스 이름에 접미사를 붙입니다. 대부분의 구조용 봇 설정에서는 메인 봇은 기본 프로필에 두고, 구조용 봇에만 `rescue` 같은 이름 있는 프로필을 지정하세요.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

서비스:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

두 Gateway 모두 이름 있는 프로필을 사용하도록 해도 되지만, 필수는 아닙니다.

## 구조용 봇 가이드

권장 설정:

- 메인 봇은 기본 프로필에 유지
- 구조용 봇은 `--profile rescue`에서 실행
- 구조용 계정에는 완전히 별도의 Telegram 봇 사용
- 구조용 봇은 `19001` 같은 다른 기준 포트에서 실행

이렇게 하면 메인 봇이 다운되었을 때 구조용 봇이 메인 봇과 격리된 상태로 디버그하거나 설정 변경을 적용할 수 있습니다. 기준 포트 사이에는 최소 20개 포트를 띄워서 파생되는 browser/canvas/CDP 포트가 절대 충돌하지 않도록 하세요.

### 권장 구조용 채널/계정

대부분의 설정에서는 구조용 프로필에 완전히 별도의 Telegram 봇을 사용하세요.

Telegram을 권장하는 이유:

- 운영자 전용으로 유지하기 쉬움
- 별도의 봇 토큰과 ID 사용
- 메인 봇의 채널/앱 설치와 독립적
- 메인 봇이 고장 났을 때 DM 기반 복구 경로가 단순함

중요한 점은 완전한 독립성입니다. 즉, 별도의 봇 계정, 별도의 자격 증명, 별도의 OpenClaw 프로필, 별도의 워크스페이스, 별도의 포트를 사용해야 합니다.

### 권장 설치 흐름

강한 이유가 있어 다른 방식을 선택하는 경우가 아니라면, 이를 기본 설정으로 사용하세요.

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

`openclaw --profile rescue onboard` 중에는 다음과 같이 하세요.

- 별도의 Telegram 봇 토큰 사용
- `rescue` 프로필 유지
- 메인 봇보다 최소 20 높은 기준 포트 사용
- 이미 직접 관리하는 경우가 아니라면 기본 구조용 워크스페이스 사용

온보딩 과정에서 이미 구조용 서비스를 설치했다면 마지막 `gateway install`은 필요하지 않습니다.

### 온보딩이 변경하는 내용

`openclaw --profile rescue onboard`는 일반 온보딩 흐름을 사용하지만, 모든 내용을 별도의 프로필에 기록합니다.

실제로는 구조용 봇이 다음 각각을 별도로 갖게 됩니다.

- 설정 파일
- 상태 디렉터리
- 워크스페이스(기본값은 `~/.openclaw/workspace-rescue`)
- 관리형 서비스 이름

그 외 프롬프트는 일반 온보딩과 동일합니다.

## 포트 매핑(파생)

기준 포트 = `gateway.port` (또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- 브라우저 제어 서비스 포트 = 기준 포트 + 2 (loopback 전용)
- canvas 호스트는 Gateway HTTP 서버에서 제공됨(`gateway.port`와 같은 포트)
- 브라우저 프로필 CDP 포트는 `browser.controlPort + 9 .. + 108` 범위에서 자동 할당됨

설정이나 env에서 이 값들 중 하나라도 재정의한다면, 인스턴스별로 고유하게 유지해야 합니다.

## 브라우저/CDP 참고 사항(흔한 함정)

- 여러 인스턴스에서 `browser.cdpUrl`을 같은 값으로 **고정하지 마세요**.
- 각 인스턴스에는 자체 브라우저 제어 포트와 CDP 범위가 필요합니다(해당 Gateway 포트에서 파생됨).
- 명시적인 CDP 포트가 필요하다면, 인스턴스별로 `browser.profiles.<name>.cdpPort`를 설정하세요.
- 원격 Chrome: `browser.profiles.<name>.cdpUrl`을 사용하세요(프로필별, 인스턴스별).

## 수동 env 예시

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
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
- `gateway probe`의 `multiple reachable gateways detected` 같은 경고 문구는 의도적으로 둘 이상의 격리된 gateway를 실행하는 경우에만 정상입니다.
