---
read_when:
    - 아웃바운드 채널의 Markdown 포맷팅 또는 청크 분할을 변경하고 있습니다
    - 새 채널 포매터 또는 스타일 매핑을 추가하고 있습니다
    - 채널 전반의 포맷팅 회귀를 디버깅하고 있습니다
summary: 아웃바운드 채널용 Markdown 포맷팅 파이프라인
title: Markdown 포맷팅
x-i18n:
    generated_at: "2026-04-24T06:10:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw는 아웃바운드 Markdown을 채널별 출력으로 렌더링하기 전에 공유 중간 표현(IR)으로 변환하여 포맷합니다. IR은 소스 텍스트를 그대로 유지하면서 스타일/링크 span을 함께 담아, 청크 분할과 렌더링이 채널 전반에서 일관되게 유지되도록 합니다.

## 목표

- **일관성:** 한 번 파싱하고 여러 렌더러에서 사용.
- **안전한 청크 분할:** 렌더링 전에 텍스트를 분할하여 인라인 포맷이 청크 경계를 넘어 깨지지 않도록 함.
- **채널 적합성:** Markdown을 다시 파싱하지 않고 동일한 IR을 Slack mrkdwn, Telegram HTML, Signal 스타일 범위로 매핑.

## 파이프라인

1. **Markdown 파싱 -> IR**
   - IR은 일반 텍스트와 스타일 span(굵게/기울임/취소선/코드/스포일러), 링크 span으로 구성됩니다.
   - 오프셋은 UTF-16 코드 유닛 기준이므로 Signal 스타일 범위가 해당 API와 정렬됩니다.
   - 표는 채널이 표 변환을 옵트인한 경우에만 파싱됩니다.
2. **IR 청크 분할(포맷 우선)**
   - 청크 분할은 렌더링 전에 IR 텍스트에서 수행됩니다.
   - 인라인 포맷은 청크 경계를 넘어 분할되지 않으며, span은 청크별로 잘립니다.
3. **채널별 렌더링**
   - **Slack:** mrkdwn 토큰(굵게/기울임/취소선/코드), 링크는 `<url|label>`.
   - **Telegram:** HTML 태그(`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** 일반 텍스트 + `text-style` 범위, 링크는 라벨이 URL과 다를 때 `label (url)`로 변환.

## IR 예시

입력 Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR(개략도):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 사용 위치

- Slack, Telegram, Signal 아웃바운드 어댑터는 IR에서 렌더링합니다.
- 다른 채널(WhatsApp, iMessage, Microsoft Teams, Discord)은 여전히 일반 텍스트 또는 자체 포맷 규칙을 사용하며, 표 변환이 활성화된 경우 청크 분할 전에 Markdown 표 변환을 적용합니다.

## 표 처리

Markdown 표는 채팅 클라이언트 전반에서 일관되게 지원되지 않습니다. 채널별(및 계정별) 변환은 `markdown.tables`로 제어하세요.

- `code`: 표를 코드 블록으로 렌더링(대부분 채널의 기본값).
- `bullets`: 각 행을 글머리표 목록으로 변환(Signal + WhatsApp의 기본값).
- `off`: 표 파싱 및 변환 비활성화, 원시 표 텍스트가 그대로 통과.

config 키:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 청크 분할 규칙

- 청크 제한은 채널 어댑터/config에서 오며 IR 텍스트에 적용됩니다.
- 코드 펜스는 후행 줄바꿈을 포함한 단일 블록으로 보존되어 채널이 올바르게 렌더링할 수 있습니다.
- 목록 접두사와 인용구 접두사는 IR 텍스트의 일부이므로 청크 분할이 접두사 중간에서 나뉘지 않습니다.
- 인라인 스타일(굵게/기울임/취소선/인라인 코드/스포일러)은 절대 청크를 가로질러 분할되지 않으며, 렌더러가 각 청크 안에서 스타일을 다시 엽니다.

채널 간 청크 분할 동작에 대해 더 알고 싶다면 [스트리밍 + 청크 분할](/ko/concepts/streaming)을 참조하세요.

## 링크 정책

- **Slack:** `[label](url)` -> `<url|label>`; 일반 URL은 그대로 유지. 이중 링크 생성을 피하기 위해 파싱 중 autolink는 비활성화됩니다.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`(HTML parse mode).
- **Signal:** `[label](url)` -> 라벨이 URL과 일치하지 않을 때 `label (url)`.

## 스포일러

스포일러 마커(`||spoiler||`)는 Signal에서만 파싱되며, 그곳에서는 SPOILER 스타일 범위로 매핑됩니다. 다른 채널에서는 일반 텍스트로 처리합니다.

## 채널 포매터를 추가하거나 업데이트하는 방법

1. **한 번만 파싱:** 채널에 맞는 옵션(autolink, heading style, blockquote prefix)으로 공유 `markdownToIR(...)` 도우미를 사용합니다.
2. **렌더링:** `renderMarkdownWithMarkers(...)`와 스타일 마커 맵(또는 Signal 스타일 범위)으로 렌더러를 구현합니다.
3. **청크 분할:** 렌더링 전에 `chunkMarkdownIR(...)`를 호출하고 각 청크를 렌더링합니다.
4. **어댑터 연결:** 채널 아웃바운드 어댑터가 새 청커와 렌더러를 사용하도록 업데이트합니다.
5. **테스트:** 포맷 테스트를 추가 또는 업데이트하고, 채널이 청크 분할을 사용한다면 아웃바운드 전달 테스트도 추가합니다.

## 자주 발생하는 함정

- Slack angle-bracket 토큰(`\<@U123>`, `\<#C123>`, `\<https://...>`)은 보존되어야 하며, 원시 HTML은 안전하게 이스케이프해야 합니다.
- Telegram HTML은 깨진 마크업을 피하기 위해 태그 바깥 텍스트를 이스케이프해야 합니다.
- Signal 스타일 범위는 UTF-16 오프셋에 의존하므로 코드 포인트 오프셋을 사용하면 안 됩니다.
- 펜스 코드 블록의 후행 줄바꿈을 보존하여 닫는 마커가 자신의 줄에 오도록 하세요.

## 관련 항목

- [스트리밍 및 청크 분할](/ko/concepts/streaming)
- [시스템 프롬프트](/ko/concepts/system-prompt)
