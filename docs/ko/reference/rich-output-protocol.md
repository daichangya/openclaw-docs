---
read_when:
    - Control UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, `MEDIA:`, reply 또는 오디오 프레젠테이션 지시문 디버깅하기'
summary: 임베드, 미디어, 오디오 힌트, 응답을 위한 리치 출력 shortcode 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-04-24T06:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

어시스턴트 출력은 소수의 전달/렌더링 지시문을 담을 수 있습니다.

- 첨부 전달용 `MEDIA:`
- 오디오 프레젠테이션 힌트용 `[[audio_as_voice]]`
- 응답 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

이 지시문들은 서로 별개입니다. `MEDIA:`와 reply/voice 태그는 전달 메타데이터로 남고, `[embed ...]`는 웹 전용 리치 렌더 경로입니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 에이전트 대상 리치 렌더 문법입니다.

self-closing 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 더 이상 새 출력에 유효하지 않습니다.
- embed shortcode는 어시스턴트 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- block-form 인라인 HTML embed shortcode는 렌더링되지 않습니다.
- 웹 UI는 visible text에서 shortcode를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장된 렌더링 형태

정규화/저장된 어시스턴트 콘텐츠 블록은 구조화된 `canvas` 항목입니다.

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

저장/렌더링된 리치 블록은 이 `canvas` 형태를 직접 사용합니다. `present_view`는 인식되지 않습니다.

## 관련

- [RPC adapters](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
