---
read_when:
    - 음성 wake 또는 PTT 경로 작업하기
summary: mac 앱의 음성 wake 및 push-to-talk 모드와 라우팅 세부 사항
title: Voice wake (macOS)
x-i18n:
    generated_at: "2026-04-24T06:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## 모드

- **Wake-word 모드**(기본값): 항상 켜져 있는 Speech 인식기가 트리거 토큰(`swabbleTriggerWords`)을 기다립니다. 일치하면 캡처를 시작하고, partial text와 함께 오버레이를 표시한 뒤, 침묵 후 자동 전송합니다.
- **Push-to-talk (오른쪽 Option 길게 누르기)**: 오른쪽 Option 키를 길게 눌러 즉시 캡처합니다. 트리거가 필요 없습니다. 누르는 동안 오버레이가 표시되며, 놓으면 짧은 지연 후 확정되어 전달되므로 텍스트를 조금 수정할 수 있습니다.

## 런타임 동작(wake-word)

- Speech 인식기는 `VoiceWakeRuntime`에 존재합니다.
- 트리거는 wake word와 다음 단어 사이에 **의미 있는 pause**가 있을 때만 발동합니다(약 0.55초 간격). 오버레이/차임은 명령이 시작되기 전이라도 그 pause 시점에 시작될 수 있습니다.
- 침묵 시간 창: 말이 이어지는 중에는 2.0초, 트리거만 들린 경우에는 5.0초
- 하드 중지: runaway 세션 방지를 위해 120초
- 세션 간 debounce: 350ms
- 오버레이는 `VoiceWakeOverlayController`로 구동되며 committed/volatile 색상을 사용합니다.
- 전송 후 인식기는 다음 트리거를 듣기 위해 깔끔하게 재시작합니다.

## 수명 주기 불변 조건

- Voice Wake가 활성화되어 있고 권한이 부여되었다면, wake-word 인식기는 listening 상태여야 합니다(명시적 push-to-talk 캡처 중인 경우 제외).
- X 버튼으로 수동 dismiss한 경우를 포함해, 오버레이 가시성은 인식기 재개를 절대 막아서는 안 됩니다.

## 오버레이 고착 실패 모드(이전)

이전에는 오버레이가 화면에 고착된 상태에서 수동으로 닫으면 Voice Wake가 “죽은 것처럼” 보일 수 있었습니다. 런타임의 재시작 시도가 오버레이 가시성에 의해 막힐 수 있었고, 이후 재시작이 다시 예약되지 않았기 때문입니다.

보강 내용:

- 이제 wake runtime 재시작은 오버레이 가시성에 의해 차단되지 않습니다.
- 오버레이 dismiss 완료 시 `VoiceSessionCoordinator`를 통해 `VoiceWakeRuntime.refresh(...)`가 트리거되므로, 수동 X-dismiss 후에도 항상 listening이 재개됩니다.

## Push-to-talk 세부 사항

- 핫키 감지는 **오른쪽 Option**용 전역 `.flagsChanged` monitor를 사용합니다(`keyCode 61` + `.option`). 이벤트를 관찰만 하며, 삼키지는 않습니다.
- 캡처 파이프라인은 `VoicePushToTalk`에 있습니다. Speech를 즉시 시작하고, partial을 오버레이로 스트리밍하며, 키를 놓으면 `VoiceWakeForwarder`를 호출합니다.
- push-to-talk가 시작되면 오디오 탭 충돌을 피하기 위해 wake-word runtime을 일시 중지하며, 키를 놓은 후 자동으로 재시작합니다.
- 권한: 마이크 + Speech가 필요하며, 이벤트를 보려면 Accessibility/Input Monitoring 승인이 필요합니다.
- 외장 키보드: 일부는 오른쪽 Option을 예상대로 노출하지 않을 수 있으므로, 사용자가 누락을 보고하면 대체 단축키를 제공하세요.

## 사용자 대상 설정

- **Voice Wake** 토글: wake-word runtime 활성화
- **Hold Cmd+Fn to talk**: push-to-talk monitor 활성화. macOS < 26에서는 비활성화됨.
- 언어 및 마이크 선택기, 실시간 레벨 미터, trigger-word 테이블, tester(로컬 전용, 전달하지 않음)
- 마이크 선택기는 장치가 연결 해제되어도 마지막 선택을 보존하고, disconnected 힌트를 표시하며, 장치가 돌아올 때까지 일시적으로 시스템 기본값으로 대체합니다.
- **Sounds**: 트리거 감지 시와 전송 시 차임을 재생하며, 기본값은 macOS “Glass” 시스템 사운드입니다. 각 이벤트마다 `NSSound`로 로드 가능한 파일(MP3/WAV/AIFF 등)을 선택하거나 **No Sound**를 선택할 수 있습니다.

## 전달 동작

- Voice Wake가 활성화되어 있으면 대화록은 활성 gateway/agent로 전달됩니다(mac 앱의 나머지 부분과 동일한 로컬 vs 원격 모드 사용).
- 응답은 **마지막으로 사용한 main provider**(WhatsApp/Telegram/Discord/WebChat)로 전달됩니다. 전달에 실패하면 오류가 로그에 기록되며, 실행 내용은 여전히 WebChat/session logs를 통해 볼 수 있습니다.

## 전달 payload

- `VoiceWakeForwarder.prefixedTranscript(_:)`는 전송 전에 기계 힌트를 앞에 붙입니다. wake-word 경로와 push-to-talk 경로가 공유합니다.

## 빠른 검증

- push-to-talk를 켜고, Cmd+Fn을 길게 누르고, 말한 뒤, 놓습니다: 오버레이에 partial이 표시된 뒤 전송되어야 합니다.
- 누르고 있는 동안 메뉴 막대 ears는 계속 커진 상태를 유지해야 합니다(`triggerVoiceEars(ttl:nil)` 사용). 놓으면 다시 작아집니다.

## 관련 항목

- [Voice wake](/ko/nodes/voicewake)
- [Voice overlay](/ko/platforms/mac/voice-overlay)
- [macOS app](/ko/platforms/macos)
