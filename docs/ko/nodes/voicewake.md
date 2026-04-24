---
read_when:
    - 음성 웨이크 워드 동작 또는 기본값 변경하기
    - 웨이크 워드 동기화가 필요한 새 Node 플랫폼 추가하기
summary: 전역 웨이크 워드(Gateway 소유)와 Node 간 동기화 방식
title: 음성 웨이크
x-i18n:
    generated_at: "2026-04-24T06:23:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw는 **웨이크 워드**를 **Gateway**가 소유하는 **단일 전역 목록**으로 취급합니다.

- **Node별 커스텀 웨이크 워드는 없습니다.**
- **어떤 Node/앱 UI든** 이 목록을 수정할 수 있으며, 변경 사항은 Gateway에 저장되고 모두에게 브로드캐스트됩니다.
- macOS와 iOS는 로컬 **Voice Wake 활성화/비활성화** 토글을 유지합니다(로컬 UX와 권한이 다름).
- Android는 현재 Voice Wake를 꺼 두고 Voice 탭에서 수동 마이크 흐름을 사용합니다.

## 저장 위치(Gateway 호스트)

웨이크 워드는 Gateway 머신의 다음 경로에 저장됩니다:

- `~/.openclaw/settings/voicewake.json`

형태:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 프로토콜

### 메서드

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` (파라미터 `{ triggers: string[] }`) → `{ triggers: string[] }`

참고:

- 트리거는 정규화됩니다(앞뒤 공백 제거, 빈 값 삭제). 빈 목록은 기본값으로 폴백합니다.
- 안전을 위해 제한이 적용됩니다(개수/길이 상한).

### 이벤트

- `voicewake.changed` payload `{ triggers: string[] }`

수신 대상:

- 모든 WebSocket 클라이언트(macOS 앱, WebChat 등)
- 모든 연결된 Node(iOS/Android), 그리고 Node 연결 시 초기 “현재 상태” 푸시로도 전송됨

## 클라이언트 동작

### macOS 앱

- 전역 목록을 사용해 `VoiceWakeRuntime` 트리거를 게이트합니다.
- Voice Wake 설정의 “Trigger words” 편집은 `voicewake.set`를 호출하고, 이후 다른 클라이언트와 동기화를 유지하기 위해 브로드캐스트에 의존합니다.

### iOS Node

- `VoiceWakeManager` 트리거 감지에 전역 목록을 사용합니다.
- 설정에서 Wake Words를 편집하면(`Gateway WS`를 통해) `voicewake.set`를 호출하고, 로컬 웨이크 워드 감지도 계속 반응하도록 유지합니다.

### Android Node

- Voice Wake는 현재 Android 런타임/설정에서 비활성화되어 있습니다.
- Android 음성은 웨이크 워드 트리거 대신 Voice 탭에서 수동 마이크 캡처를 사용합니다.

## 관련

- [Talk 모드](/ko/nodes/talk)
- [오디오와 음성 노트](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
