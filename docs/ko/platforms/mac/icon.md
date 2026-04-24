---
read_when:
    - 메뉴 막대 아이콘 동작 변경하기
summary: macOS의 OpenClaw용 메뉴 막대 아이콘 상태 및 애니메이션
title: 메뉴 막대 아이콘
x-i18n:
    generated_at: "2026-04-24T06:24:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# 메뉴 막대 아이콘 상태

작성자: steipete · 업데이트: 2025-12-06 · 범위: macOS 앱 (`apps/macos`)

- **유휴:** 일반 아이콘 애니메이션(깜빡임, 가끔 흔들림)
- **일시정지:** 상태 항목이 `appearsDisabled`를 사용하며 움직임 없음
- **음성 트리거(큰 귀):** 음성 웨이크 감지기가 깨우는 단어를 들으면 `AppState.triggerVoiceEars(ttl: nil)`를 호출하여 발화가 캡처되는 동안 `earBoostActive=true`를 유지합니다. 귀는 커지고(1.9배), 가독성을 위해 원형 귀 구멍이 생긴 뒤, 1초 동안 침묵이 이어지면 `stopVoiceEars()`를 통해 내려갑니다. 인앱 음성 파이프라인에서만 발생합니다.
- **작업 중(에이전트 실행 중):** `AppState.isWorking=true`는 “꼬리/다리 분주함” 미세 움직임을 구동합니다. 작업이 진행 중일 때 더 빠른 다리 흔들림과 약간의 오프셋이 적용됩니다. 현재는 WebChat 에이전트 실행 전후에 토글되며, 다른 긴 작업에도 연결할 때 같은 토글을 추가하세요.

연결 지점

- 음성 웨이크: 런타임/테스터가 트리거 시 `AppState.triggerVoiceEars(ttl: nil)`를 호출하고, 1초 침묵 후 `stopVoiceEars()`를 호출해 캡처 창과 맞춥니다.
- 에이전트 활동: 작업 구간 전후에 `AppStateStore.shared.setWorking(true/false)`를 설정합니다(WebChat 에이전트 호출에서는 이미 수행됨). 애니메이션이 멈춘 채로 남지 않도록 구간은 짧게 유지하고 `defer` 블록에서 재설정하세요.

도형 및 크기

- 기본 아이콘은 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`에서 그려집니다.
- 귀 크기 기본값은 `1.0`이며, 음성 부스트는 전체 프레임은 바꾸지 않고(18×18pt 템플릿 이미지를 36×36px Retina 백킹 저장소에 렌더링) `earScale=1.9`를 설정하고 `earHoles=true`를 켭니다.
- 분주함은 작은 수평 흔들림과 함께 최대 약 `1.0`까지 다리 흔들림을 사용하며, 기존 유휴 흔들림에 추가됩니다.

동작 참고

- 귀/작업 중 상태에 대한 외부 CLI/broker 토글은 없습니다. 우발적인 깜빡임을 피하기 위해 앱 자체 신호 내부에만 유지하세요.
- 작업이 멈췄을 때도 아이콘이 빨리 기본 상태로 돌아가도록 TTL은 짧게 유지하세요(`10초 미만`).

## 관련 항목

- [메뉴 막대](/ko/platforms/mac/menu-bar)
- [macOS 앱](/ko/platforms/macos)
