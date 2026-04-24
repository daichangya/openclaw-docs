---
read_when:
    - WebChat 접근 디버깅 또는 구성하기
summary: 채팅 UI용 loopback WebChat 정적 호스트 및 Gateway WS 사용법
title: WebChat
x-i18n:
    generated_at: "2026-04-24T06:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket과 직접 통신합니다.

## 이것이 무엇인가요

- Gateway용 네이티브 채팅 UI입니다(임베디드 브라우저와 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 응답은 항상 WebChat으로 다시 돌아갑니다.

## 빠른 시작

1. Gateway를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 Gateway 인증 경로가 구성되어 있는지 확인합니다(기본적으로 shared-secret, loopback에서도 동일).

## 작동 방식(동작)

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다: Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터를 생략하며, 너무 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 표시용으로도 정규화됩니다: `[[reply_to_*]]`, `[[audio_as_voice]]` 같은 인라인 전달 지시문 태그, 일반 텍스트 도구 호출 XML 페이로드
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 그리고
  유출된 ASCII/전각 모델 제어 토큰은 표시 텍스트에서 제거되며,
  전체 표시 텍스트가 정확히 무음 토큰
  `NO_REPLY` / `no_reply`뿐인 assistant 항목은 생략됩니다.
- `chat.inject`는 assistant 메모를 전사에 직접 추가하고 이를 UI에 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행은 부분 assistant 출력을 UI에 계속 표시할 수 있습니다.
- 버퍼링된 출력이 있을 경우 Gateway는 중단된 부분 assistant 텍스트를 전사 히스토리에 유지하고, 해당 항목에 abort 메타데이터를 표시합니다.
- 히스토리는 항상 Gateway에서 가져옵니다(로컬 파일 감시 없음).
- Gateway에 도달할 수 없으면 WebChat은 읽기 전용입니다.

## Control UI 에이전트 도구 패널

- Control UI `/agents` Tools 패널에는 두 개의 별도 보기가 있습니다:
  - **Available Right Now**는 `tools.effective(sessionKey=...)`를 사용하며 현재
    세션이 런타임에서 실제로 사용할 수 있는 항목을 보여줍니다. 여기에는 코어, Plugin, 채널 소유 도구가 포함됩니다.
  - **Tool Configuration**은 `tools.catalog`를 사용하며 프로필, 재정의, 카탈로그 의미 체계에 집중합니다.
- 런타임 사용 가능 여부는 세션 범위입니다. 같은 에이전트에서 세션을 바꾸면
  **Available Right Now** 목록이 달라질 수 있습니다.
- 구성 편집기는 런타임 사용 가능 여부를 의미하지 않습니다. 실제 접근은 여전히 정책
  우선순위(`allow`/`deny`, 에이전트별 및 Provider/채널 재정의)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 Gateway WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조 (WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답의 텍스트 필드에 대한 최대 문자 수입니다. 전사 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 잘라내고 너무 큰 메시지를 placeholder로 대체할 수 있습니다. 단일 `chat.history` 호출에 대해 이 기본값을 재정의하려면 클라이언트가 요청별 `maxChars`도 보낼 수 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 인증.
- `gateway.auth.allowTailscale`: 브라우저 Control UI 채팅 탭은 활성화된 경우 Tailscale
  Serve identity 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: identity-aware **non-loopback** 프록시 소스 뒤에 있는 브라우저 클라이언트를 위한 reverse-proxy 인증([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참고).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 Gateway 대상.
- `session.*`: 세션 저장소 및 main key 기본값.

## 관련 문서

- [Control UI](/ko/web/control-ui)
- [Dashboard](/ko/web/dashboard)
