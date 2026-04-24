---
read_when:
    - 사용자가 에이전트가 도구 호출을 반복하면서 멈춘다고 보고했습니다
    - 반복 호출 보호를 조정해야 합니다
    - 에이전트 도구/런타임 정책을 편집하고 있습니다
summary: 반복적인 도구 호출 루프를 감지하는 가드레일을 활성화하고 조정하는 방법
title: 도구 루프 감지
x-i18n:
    generated_at: "2026-04-24T06:40:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw는 에이전트가 반복적인 도구 호출 패턴에 갇히는 것을 방지할 수 있습니다.
이 가드는 기본적으로 **비활성화**되어 있습니다.

설정이 엄격하면 정상적인 반복 호출도 차단할 수 있으므로, 필요한 경우에만 활성화하세요.

## 이 기능이 존재하는 이유

- 진행이 없는 반복 시퀀스 감지
- 빈번한 무결과 루프 감지(같은 도구, 같은 입력, 반복되는 오류)
- 알려진 polling 도구에 대한 특정 반복 호출 패턴 감지

## 구성 블록

전역 기본값:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

에이전트별 재정의(선택 사항):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### 필드 동작

- `enabled`: 마스터 스위치. `false`이면 도구 루프 감지를 수행하지 않습니다.
- `historySize`: 분석을 위해 유지하는 최근 도구 호출 수
- `warningThreshold`: 패턴을 경고 전용으로 분류하기 전 임계값
- `criticalThreshold`: 반복 루프 패턴을 차단하기 위한 임계값
- `globalCircuitBreakerThreshold`: 전역 무진행 차단기 임계값
- `detectors.genericRepeat`: 같은 도구 + 같은 매개변수 반복 패턴 감지
- `detectors.knownPollNoProgress`: 상태 변화 없는 알려진 polling 유사 패턴 감지
- `detectors.pingPong`: 번갈아 반복되는 ping-pong 패턴 감지

## 권장 설정

- `enabled: true`로 시작하고 나머지 기본값은 그대로 두세요.
- 임계값 순서는 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`를 유지하세요.
- false positive가 발생하면:
  - `warningThreshold` 및/또는 `criticalThreshold`를 높이세요
  - (선택적으로) `globalCircuitBreakerThreshold`를 높이세요
  - 문제를 일으키는 detector만 비활성화하세요
  - 과거 컨텍스트를 덜 엄격하게 하려면 `historySize`를 줄이세요

## 로그 및 예상 동작

루프가 감지되면 OpenClaw는 루프 이벤트를 보고하고 심각도에 따라 다음 도구 사이클을 차단하거나 약화시킵니다.
이렇게 하면 정상적인 도구 접근은 유지하면서도 폭주하는 토큰 비용과 멈춤 현상으로부터 사용자를 보호할 수 있습니다.

- 먼저 경고와 임시 억제를 우선하세요.
- 반복된 증거가 누적될 때만 상향 조정하세요.

## 참고

- `tools.loopDetection`은 에이전트 수준 재정의와 병합됩니다.
- 에이전트별 config는 전역 값을 완전히 재정의하거나 확장합니다.
- config가 없으면 가드레일은 꺼진 상태로 유지됩니다.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals)
- [Thinking 수준](/ko/tools/thinking)
- [Sub-agents](/ko/tools/subagents)
