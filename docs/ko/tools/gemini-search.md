---
read_when:
    - web_search에 Gemini를 사용하고 싶습니다
    - '`GEMINI_API_KEY`가 필요합니다'
    - Google Search grounding을 원합니다
summary: Google Search grounding을 사용하는 Gemini 웹 검색
title: Gemini 검색
x-i18n:
    generated_at: "2026-04-24T06:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw는 내장
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)을 사용하는 Gemini 모델을 지원합니다. 이는 실시간 Google Search 결과를 근거로 인용과 함께 AI가 합성한 답변을 반환합니다.

## API 키 받기

<Steps>
  <Step title="키 생성">
    [Google AI Studio](https://aistudio.google.com/apikey)로 가서
    API 키를 생성하세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `GEMINI_API_KEY`를 설정하거나 다음으로 구성하세요:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 구성

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY가 설정되어 있으면 선택 사항
            model: "gemini-2.5-flash", // 기본값
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**환경 변수 대안:** Gateway 환경에 `GEMINI_API_KEY`를 설정하세요.
gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.

## 작동 방식

링크와 스니펫 목록을 반환하는 전통적인 검색 provider와 달리,
Gemini는 Google Search grounding을 사용해 인라인 인용이 포함된
AI 합성 답변을 생성합니다. 결과에는 합성된 답변과 출처
URL이 모두 포함됩니다.

- Gemini grounding의 인용 URL은 Google
  리디렉션 URL에서 직접 URL로 자동 해석됩니다.
- 리디렉션 해석은 최종 인용 URL을 반환하기 전에 SSRF 가드 경로(HEAD + 리디렉션 검사 +
  http/https 검증)를 사용합니다.
- 리디렉션 해석은 엄격한 SSRF 기본값을 사용하므로
  private/internal 대상으로의 리디렉션은 차단됩니다.

## 지원되는 파라미터

Gemini 검색은 `query`를 지원합니다.

공유 `web_search` 호환성을 위해 `count`도 받지만, Gemini grounding은
여전히 N개 결과 목록 대신 인용이 포함된 하나의 합성 답변을 반환합니다.

`country`, `language`, `freshness`,
`domain_filter` 같은 provider별 필터는 지원되지 않습니다.

## 모델 선택

기본 모델은 `gemini-2.5-flash`입니다(빠르고 비용 효율적). grounding을 지원하는 모든 Gemini
모델은
`plugins.entries.google.config.webSearch.model`을 통해 사용할 수 있습니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 스니펫이 포함된 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 구조화된 결과 + 콘텐츠 추출
