---
permalink: /security/formal-verification/
read_when:
    - 정형 보안 모델 보장 또는 한계 검토하기
    - TLA+/TLC 보안 모델 검사 재현 또는 업데이트하기
summary: OpenClaw의 최고 위험 경로를 위한 기계 검증 보안 모델.
title: 정형 검증(보안 모델)
x-i18n:
    generated_at: "2026-04-24T06:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

이 페이지는 OpenClaw의 **정형 보안 모델**을 추적합니다(현재는 TLA+/TLC, 필요에 따라 추가 예정).

> 참고: 일부 오래된 링크는 이전 프로젝트 이름을 가리킬 수 있습니다.

**목표(북극성):** OpenClaw가 명시적인 가정 아래에서 의도한 보안 정책(권한 부여, 세션 격리, 도구 게이팅, 잘못된 구성에 대한 안전성)을 실제로 강제한다는 점을 기계 검증된 근거로 제시하는 것입니다.

**현재 이것이 의미하는 것:** 실행 가능한, 공격자 관점의 **보안 회귀 테스트 스위트**입니다.

- 각 주장에는 유한한 상태 공간에 대해 실행 가능한 모델 검사가 있습니다.
- 많은 주장에는 현실적인 버그 종류에 대한 반례 추적을 생성하는 짝이 되는 **부정 모델**이 있습니다.

**아직 이것이 의미하지 않는 것:** “OpenClaw는 모든 면에서 안전하다”는 증명이나 전체 TypeScript 구현이 올바르다는 증명은 아닙니다.

## 모델 위치

모델은 별도 repo에서 관리됩니다: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## 중요한 주의 사항

- 이것들은 전체 TypeScript 구현이 아니라 **모델**입니다. 모델과 코드 사이에 드리프트가 있을 수 있습니다.
- 결과는 TLC가 탐색한 상태 공간에 의해 제한됩니다. “green”이라고 해서 모델링된 가정과 한계를 넘어서는 보안을 뜻하지는 않습니다.
- 일부 주장은 명시적인 환경 가정(예: 올바른 배포, 올바른 구성 입력)에 의존합니다.

## 결과 재현하기

현재 결과는 models repo를 로컬에 clone하고 TLC를 실행하여 재현합니다(아래 참조). 향후에는 다음을 제공할 수 있습니다.

- 공개 아티팩트(반례 추적, 실행 로그)가 포함된 CI 실행 모델
- 작은 범위의 검사에 대해 “이 모델 실행” 같은 호스팅 워크플로

시작하기:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ 필요(TLC는 JVM에서 실행됨).
# 이 repo는 고정된 `tla2tools.jar`(TLA+ 도구)를 포함하고 있고 `bin/tlc`와 Make 타깃을 제공합니다.

make <target>
```

### Gateway 노출과 open gateway 잘못된 구성

**주장:** 인증 없이 loopback 너머로 바인딩하면 원격 침해가 가능해지거나 노출이 증가할 수 있으며, 토큰/비밀번호는 모델 가정 하에서 인증되지 않은 공격자를 차단합니다.

- Green 실행:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Red (예상됨):
  - `make gateway-exposure-v2-negative`

models repo의 `docs/gateway-exposure-matrix.md`도 참조하세요.

### Node exec 파이프라인(최고 위험 capability)

**주장:** `exec host=node`에는 (a) node 명령 허용 목록 + 선언된 명령과 (b) 구성된 경우 실제 승인이 필요하며, 승인은 모델에서 재생 공격 방지를 위해 토큰화됩니다.

- Green 실행:
  - `make nodes-pipeline`
  - `make approvals-token`
- Red (예상됨):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing 저장소(DM 게이팅)

**주장:** pairing 요청은 TTL과 대기 요청 상한을 준수합니다.

- Green 실행:
  - `make pairing`
  - `make pairing-cap`
- Red (예상됨):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 인그레스 게이팅(멘션 + 제어 명령 우회)

**주장:** 멘션이 필요한 그룹 컨텍스트에서는 권한 없는 “제어 명령”이 멘션 게이팅을 우회할 수 없습니다.

- Green:
  - `make ingress-gating`
- Red (예상됨):
  - `make ingress-gating-negative`

### 라우팅/세션 키 격리

**주장:** 명시적으로 연결되거나 구성되지 않은 한, 서로 다른 상대방의 DM은 같은 세션으로 합쳐지지 않습니다.

- Green:
  - `make routing-isolation`
- Red (예상됨):
  - `make routing-isolation-negative`

## v1++: 추가 제한 모델(동시성, 재시도, 추적 정확성)

이것들은 실제 실패 모드(비원자적 업데이트, 재시도, 메시지 fan-out)에 대한 충실도를 높이는 후속 모델입니다.

### Pairing 저장소 동시성 / 멱등성

**주장:** pairing 저장소는 인터리빙 상황에서도 `MaxPending`과 멱등성을 강제해야 합니다(즉, “check-then-write”는 원자적이거나 lock으로 보호되어야 하고, refresh는 중복을 만들면 안 됨).

의미:

- 동시 요청 상황에서도 채널의 `MaxPending`을 초과할 수 없습니다.
- 같은 `(channel, sender)`에 대한 반복 요청/새로고침은 중복된 대기 행을 만들면 안 됩니다.

- Green 실행:
  - `make pairing-race` (원자적/lock 기반 상한 검사)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Red (예상됨):
  - `make pairing-race-negative` (비원자적 begin/commit 상한 경쟁)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 인그레스 추적 상관관계 / 멱등성

**주장:** 수집은 fan-out 전반에서 추적 상관관계를 보존해야 하며 provider 재시도 하에서도 멱등적이어야 합니다.

의미:

- 하나의 외부 이벤트가 여러 내부 메시지가 될 때, 모든 부분이 같은 추적/이벤트 ID를 유지해야 합니다.
- 재시도로 이중 처리가 일어나면 안 됩니다.
- provider 이벤트 ID가 없으면 dedupe는 서로 다른 이벤트를 떨어뜨리지 않도록 안전한 키(예: trace ID)로 폴백해야 합니다.

- Green:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Red (예상됨):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 라우팅 dmScope 우선순위 + identityLinks

**주장:** 라우팅은 기본적으로 DM 세션을 격리 상태로 유지해야 하며, 명시적으로 구성된 경우에만 세션을 합쳐야 합니다(채널 우선순위 + identity link).

의미:

- 채널별 dmScope 재정의는 전역 기본값보다 우선해야 합니다.
- identityLinks는 관련 없는 상대방 간이 아니라 명시적으로 연결된 그룹 안에서만 세션을 합쳐야 합니다.

- Green:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Red (예상됨):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 관련 항목

- [위협 모델](/ko/security/THREAT-MODEL-ATLAS)
- [위협 모델 기여하기](/ko/security/CONTRIBUTING-THREAT-MODEL)
