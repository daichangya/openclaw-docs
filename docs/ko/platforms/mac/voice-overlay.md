---
read_when:
    - 음성 오버레이 동작 조정하기
summary: 웨이크 워드와 푸시 투 토크가 겹칠 때의 음성 오버레이 수명 주기
title: 음성 오버레이
x-i18n:
    generated_at: "2026-04-24T06:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# 음성 오버레이 수명 주기(macOS)

대상: macOS 앱 기여자. 목표: 웨이크 워드와 푸시 투 토크가 겹칠 때 음성 오버레이를 예측 가능하게 유지하는 것.

## 현재 의도

- 웨이크 워드로 인해 오버레이가 이미 표시된 상태에서 사용자가 핫키를 누르면, 핫키 세션은 텍스트를 재설정하지 않고 기존 텍스트를 _인계받습니다_. 핫키가 눌려 있는 동안 오버레이는 계속 표시됩니다. 사용자가 손을 떼면: 잘린 뒤 남은 텍스트가 있으면 전송하고, 없으면 닫습니다.
- 웨이크 워드만 사용하는 경우에는 침묵 시 자동 전송되고, 푸시 투 토크는 손을 떼는 즉시 전송됩니다.

## 구현 완료(2025년 12월 9일)

- 오버레이 세션은 이제 각 캡처(웨이크 워드 또는 푸시 투 토크)마다 토큰을 가집니다. 토큰이 일치하지 않으면 partial/final/send/dismiss/level 업데이트는 버려져 오래된 콜백을 방지합니다.
- 푸시 투 토크는 현재 표시 중인 오버레이 텍스트를 접두사로 인계받습니다(따라서 웨이크 오버레이가 떠 있는 동안 핫키를 누르면 텍스트를 유지하고 새 음성을 뒤에 붙입니다). 최종 transcript를 최대 1.5초까지 기다린 뒤, 없으면 현재 텍스트로 폴백합니다.
- 차임/오버레이 로깅은 `voicewake.overlay`, `voicewake.ptt`, `voicewake.chime` 카테고리에서 `info` 수준으로 기록됩니다(세션 시작, partial, final, send, dismiss, 차임 사유).

## 다음 단계

1. **VoiceSessionCoordinator (actor)**
   - 한 번에 정확히 하나의 `VoiceSession`만 소유합니다.
   - API(토큰 기반): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - 오래된 토큰을 가진 콜백은 버립니다(오래된 recognizer가 오버레이를 다시 여는 것을 방지).
2. **VoiceSession (모델)**
   - 필드: `token`, `source` (`wakeWord`|`pushToTalk`), committed/volatile 텍스트, 차임 플래그, 타이머(auto-send, idle), `overlayMode` (`display`|`editing`|`sending`), cooldown 마감 시각.
3. **오버레이 바인딩**
   - `VoiceSessionPublisher` (`ObservableObject`)가 활성 세션을 SwiftUI에 미러링합니다.
   - `VoiceWakeOverlayView`는 publisher를 통해서만 렌더링되며, 전역 singleton을 직접 변경하지 않습니다.
   - 오버레이 사용자 작업(`sendNow`, `dismiss`, `edit`)은 세션 토큰과 함께 coordinator로 다시 호출됩니다.
4. **통합 전송 경로**
   - `endCapture` 시: 잘린 텍스트가 비어 있으면 닫고, 아니면 `performSend(session:)`(전송 차임 1회 재생, 전달, 닫기) 실행.
   - 푸시 투 토크: 지연 없음. 웨이크 워드: 자동 전송용 선택적 지연.
   - 푸시 투 토크가 끝난 뒤 짧은 cooldown을 웨이크 런타임에 적용해, 웨이크 워드가 즉시 다시 트리거되지 않게 합니다.
5. **로깅**
   - coordinator는 서브시스템 `ai.openclaw`, 카테고리 `voicewake.overlay` 및 `voicewake.chime`에서 `.info` 로그를 출력합니다.
   - 주요 이벤트: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## 디버깅 체크리스트

- 고정된 오버레이를 재현하면서 로그 스트리밍:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 활성 세션 토큰이 하나뿐인지 확인하세요. 오래된 콜백은 coordinator에 의해 버려져야 합니다.
- 푸시 투 토크 손 떼기 시 항상 활성 토큰으로 `endCapture`가 호출되는지 확인하세요. 텍스트가 비어 있으면 차임이나 전송 없이 `dismiss`가 발생해야 합니다.

## 마이그레이션 단계(권장)

1. `VoiceSessionCoordinator`, `VoiceSession`, `VoiceSessionPublisher` 추가
2. `VoiceWakeRuntime`이 `VoiceWakeOverlayController`를 직접 건드리는 대신 세션을 생성/업데이트/종료하도록 리팩터링
3. `VoicePushToTalk`이 기존 세션을 인계받고 손을 뗄 때 `endCapture`를 호출하도록 리팩터링. 런타임 cooldown 적용
4. `VoiceWakeOverlayController`를 publisher에 연결하고 runtime/PTT에서의 직접 호출 제거
5. 세션 인계, cooldown, 빈 텍스트 dismissal에 대한 통합 테스트 추가

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [음성 웨이크(macOS)](/ko/platforms/mac/voicewake)
- [Talk 모드](/ko/nodes/talk)
