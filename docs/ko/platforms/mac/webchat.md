---
read_when:
    - mac WebChat 뷰 또는 루프백 포트 디버깅하기
summary: mac 앱이 Gateway WebChat을 내장하는 방식과 디버깅 방법
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T06:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

macOS 메뉴 막대 앱은 WebChat UI를 네이티브 SwiftUI 뷰로 내장합니다. 이 뷰는 Gateway에 연결하며, 선택된 에이전트의 **기본 세션**을 기본값으로 사용합니다(다른 세션을 위한 세션 전환기 포함).

- **로컬 모드**: 로컬 Gateway WebSocket에 직접 연결합니다.
- **원격 모드**: SSH를 통해 Gateway control 포트를 전달하고 그
  터널을 데이터 플레인으로 사용합니다.

## 실행 및 디버깅

- 수동: Lobster 메뉴 → “Open Chat”.
- 테스트용 자동 열기:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 로그: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## 연결 방식

- 데이터 플레인: Gateway WS 메서드 `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` 및 이벤트 `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history`는 표시용으로 정규화된 전사 행을 반환합니다. 인라인 directive
  태그는 표시 텍스트에서 제거되고, 일반 텍스트 tool-call XML payload
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, 잘린 tool-call 블록 포함)와
  유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확한
  `NO_REPLY` / `no_reply` 같은 순수 silent-token 어시스턴트 행은
  생략되고, 너무 큰 행은 플레이스홀더로 대체될 수 있습니다.
- 세션: 기본적으로 기본 세션(`main`, 또는 범위가
  global이면 `global`)을 사용합니다. UI에서 세션 간 전환이 가능합니다.
- 온보딩은 전용 세션을 사용하여 첫 실행 설정을 별도로 유지합니다.

## 보안 표면

- 원격 모드는 SSH를 통해 Gateway WebSocket control 포트만 전달합니다.

## 알려진 제한 사항

- UI는 전체 브라우저 샌드박스가 아니라 채팅 세션에 최적화되어 있습니다.

## 관련

- [WebChat](/ko/web/webchat)
- [macOS 앱](/ko/platforms/macos)
