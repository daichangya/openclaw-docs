---
read_when:
    - 같은 머신에서 둘 이상의 Gateway 실행하기
    - Gateway별로 격리된 구성/상태/포트가 필요합니다
summary: 하나의 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트, 프로필)
title: 다중 Gateway
x-i18n:
    generated_at: "2026-04-24T06:15:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 다중 Gateway(같은 호스트)

대부분의 설정에서는 하나의 Gateway로 충분합니다. 하나의 Gateway가 여러 메시징 연결과 에이전트를 처리할 수 있기 때문입니다. 더 강한 격리 또는 이중화(예: 구조용 봇)가 필요하면 격리된 프로필/포트로 별도의 Gateway를 실행하세요.

## 가장 권장되는 설정

대부분의 사용자에게 가장 간단한 구조용 봇 설정은 다음과 같습니다.

- 메인 봇은 기본 프로필에 유지
- 구조용 봇은 `--profile rescue`에서 실행
- 구조용 계정에는 완전히 별도의 Telegram 봇 사용
- 구조용 봇은 `19789` 같은 다른 기본 포트에 유지

이렇게 하면 메인 봇과 구조용 봇이 격리되므로 기본 봇이 다운되었을 때
구조용 봇이 구성 변경을 디버깅하거나 적용할 수 있습니다. 파생된 browser/canvas/CDP 포트가 절대 충돌하지 않도록
기본 포트 간에는 최소 20포트를 두세요.

## 구조용 봇 빠른 시작

강한 이유가 없다면 이것을 기본 경로로 사용하세요.

```bash
# 구조용 봇(별도 Telegram 봇, 별도 프로필, 포트 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

메인 봇이 이미 실행 중이라면 보통 이것만으로 충분합니다.

`openclaw --profile rescue onboard` 중에는:

- 별도의 Telegram 봇 토큰을 사용하세요
- `rescue` 프로필을 유지하세요
- 메인 봇보다 최소 20 높은 기본 포트를 사용하세요
- 이미 직접 관리 중인 경우가 아니라면 기본 구조용 워크스페이스를 수락하세요

온보딩이 이미 구조용 서비스를 설치했다면 마지막
`gateway install`은 필요하지 않습니다.

## 왜 이것이 작동하는가

구조용 봇은 다음을 각각 별도로 가지므로 독립성을 유지합니다.

- 프로필/구성
- 상태 디렉터리
- 워크스페이스
- 기본 포트(및 파생 포트)
- Telegram 봇 토큰

대부분의 설정에서는 구조용 프로필에 완전히 별도의 Telegram 봇을 사용하세요.

- 운영자 전용으로 유지하기 쉬움
- 별도의 봇 토큰과 identity
- 메인 봇의 채널/앱 설치와 독립적
- 메인 봇이 고장 났을 때 간단한 DM 기반 복구 경로 제공

## `--profile rescue onboard`가 변경하는 것

`openclaw --profile rescue onboard`는 일반 온보딩 흐름을 사용하지만
모든 내용을 별도의 프로필에 기록합니다.

실제로는 구조용 봇이 다음을 각각 따로 가지게 됨을 의미합니다.

- 구성 파일
- 상태 디렉터리
- 워크스페이스(기본값 `~/.openclaw/workspace-rescue`)
- 관리 서비스 이름

그 외 프롬프트는 일반 온보딩과 동일합니다.

## 일반 다중 Gateway 설정

위의 구조용 봇 레이아웃이 가장 쉬운 기본값이지만, 같은 격리
패턴은 한 호스트의 어떤 Gateway 쌍 또는 그룹에도 적용됩니다.

더 일반적인 설정을 위해 각 추가 Gateway에 고유한 이름의 프로필과
고유한 기본 포트를 부여하세요.

```bash
# main (기본 프로필)
openclaw setup
openclaw gateway --port 18789

# 추가 Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

두 Gateway 모두 이름이 있는 프로필을 사용하고 싶다면 그것도 가능합니다.

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

대체 운영 경로가 필요하면 구조용 봇 빠른 시작을 사용하세요. 서로 다른
채널, 테넌트, 워크스페이스, 운영 역할을 위해 여러 장기 실행 Gateway가 필요하면
일반 프로필 패턴을 사용하세요.

## 격리 점검표

각 Gateway 인스턴스마다 다음을 고유하게 유지하세요.

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 구성 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, 자격 증명, 캐시
- `agents.defaults.workspace` — 인스턴스별 워크스페이스 루트
- `gateway.port` (또는 `--port`) — 인스턴스별 고유 값
- 파생 browser/canvas/CDP 포트

이들이 공유되면 구성 경쟁 및 포트 충돌이 발생합니다.

## 포트 매핑(파생)

기본 포트 = `gateway.port` (또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser control 서비스 포트 = 기본 + 2(loopback 전용)
- canvas 호스트는 Gateway HTTP 서버에서 제공됨(`gateway.port`와 동일한 포트)
- Browser profile CDP 포트는 `browser.controlPort + 9 .. + 108` 범위에서 자동 할당

구성 또는 env에서 이들 중 하나라도 재정의한다면 인스턴스별로 고유하게 유지해야 합니다.

## Browser/CDP 참고(흔한 함정)

- 여러 인스턴스에서 `browser.cdpUrl`을 동일한 값으로 고정하지 마세요.
- 각 인스턴스는 자체 browser control 포트와 CDP 범위가 필요합니다(해당 Gateway 포트에서 파생됨).
- 명시적 CDP 포트가 필요하면 인스턴스별로 `browser.profiles.<name>.cdpPort`를 설정하세요.
- 원격 Chrome은 `browser.profiles.<name>.cdpUrl`을 사용하세요(프로필별, 인스턴스별).

## 수동 env 예시

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 빠른 점검

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

해석:

- `gateway status --deep`는 이전 설치에서 남아 있는 오래된 launchd/systemd/schtasks 서비스를 포착하는 데 도움이 됩니다.
- `gateway probe` 경고 텍스트(예: `multiple reachable gateways detected`)는 의도적으로 둘 이상의 격리된 gateway를 실행할 때만 정상입니다.

## 관련

- [Gateway runbook](/ko/gateway)
- [Gateway lock](/ko/gateway/gateway-lock)
- [구성](/ko/gateway/configuration)
