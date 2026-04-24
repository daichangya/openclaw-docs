---
read_when:
    - '`.experimental` config 키를 보고 이것이 안정적인지 알고 싶습니다'
    - 일반 기본값과 혼동하지 않고 미리보기 런타임 기능을 사용해 보고 싶습니다
    - 현재 문서화된 experimental 플래그를 한곳에서 찾고 싶습니다
summary: OpenClaw에서 experimental 플래그의 의미와 현재 문서화된 항목들
title: 실험적 기능
x-i18n:
    generated_at: "2026-04-24T06:10:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

OpenClaw의 실험적 기능은 **옵트인 미리보기 표면**입니다. 안정적인 기본값이나 오래 유지되는 공개 계약으로 만들기 전에 실제 환경에서의 사용 경험이 더 필요하기 때문에 명시적인 플래그 뒤에 있습니다.

일반 config와는 다르게 취급하세요.

- 관련 문서에서 사용해 보라고 안내하지 않는 한 기본적으로는 **꺼 둡니다**.
- 안정적인 config보다 **형태와 동작이 더 빠르게 바뀔 수 있음**을 예상하세요.
- 이미 안정적인 경로가 있다면 먼저 그 경로를 우선하세요.
- OpenClaw를 넓게 배포하려면 experimental 플래그를 공용 기준 구성에 넣기 전에 더 작은 환경에서 먼저 테스트하세요.

## 현재 문서화된 플래그

| 표면                    | 키                                                        | 사용 시점                                                                                                      | 자세히                                                                                       |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 로컬 모델 런타임        | `agents.defaults.experimental.localModelLean`             | 더 작거나 더 엄격한 로컬 백엔드가 OpenClaw의 전체 기본 도구 표면을 감당하지 못할 때                           | [로컬 모델](/ko/gateway/local-models)                                                           |
| 메모리 검색             | `agents.defaults.memorySearch.experimental.sessionMemory` | `memory_search`가 이전 세션 transcript를 인덱싱하고 추가 저장소/인덱싱 비용을 감수하길 원할 때                | [메모리 구성 참조](/ko/reference/memory-config#session-memory-search-experimental)             |
| 구조화된 계획 도구      | `tools.experimental.planTool`                             | 호환되는 런타임 및 UI에서 다단계 작업 추적을 위해 구조화된 `update_plan` 도구를 노출하고 싶을 때              | [Gateway 구성 참조](/ko/gateway/config-tools#toolsexperimental)                                |

## 로컬 모델 lean 모드

`agents.defaults.experimental.localModelLean: true`는 더 약한 로컬 모델 설정을 위한 완화 장치입니다. `browser`, `cron`, `message` 같은 무거운 기본 도구를 줄여 프롬프트 형태를 더 작고 덜 취약하게 만들어, 작은 컨텍스트 또는 더 엄격한 OpenAI 호환 백엔드에 맞춥니다.

이는 의도적으로 **일반 경로가 아닙니다**. 백엔드가 전체 런타임을 문제없이 처리할 수 있다면 이 설정은 꺼 두세요.

## experimental은 숨김을 의미하지 않습니다

어떤 기능이 experimental이라면 OpenClaw는 문서와 config 경로 자체에서 이를 분명히 밝혀야 합니다. 하지 말아야 할 것은 미리보기 동작을 안정적으로 보이는 기본 노브에 몰래 섞어 넣고 그것이 정상인 것처럼 가장하는 일입니다. 그렇게 되면 config 표면이 지저분해집니다.

## 관련 항목

- [기능](/ko/concepts/features)
- [릴리스 채널](/ko/install/development-channels)
