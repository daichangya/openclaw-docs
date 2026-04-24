---
read_when:
    - API 키가 필요 없는 웹 검색 provider를 원합니다
    - '`web_search`에 DuckDuckGo를 사용하려고 합니다'
    - 구성 없이 바로 쓸 수 있는 검색 폴백이 필요합니다
summary: DuckDuckGo 웹 검색 -- 키 없는 폴백 provider(실험적, HTML 기반)
title: DuckDuckGo 검색
x-i18n:
    generated_at: "2026-04-24T06:39:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw는 DuckDuckGo를 **키 없는** `web_search` provider로 지원합니다. API
키나 계정이 필요하지 않습니다.

<Warning>
  DuckDuckGo는 DuckDuckGo의 비JavaScript 검색 페이지에서 결과를 가져오는 **실험적 비공식** 통합입니다. 공식 API가 아닙니다. 봇 챌린지 페이지나 HTML 변경으로 인해 가끔 깨질 수 있습니다.
</Warning>

## 설정

API 키가 필요 없습니다. provider로 DuckDuckGo만 설정하면 됩니다.

<Steps>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # provider로 "duckduckgo" 선택
    ```
  </Step>
</Steps>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

지역 및 SafeSearch용 선택적 Plugin 수준 설정:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo 지역 코드
            safeSearch: "moderate", // "strict", "moderate", 또는 "off"
          },
        },
      },
    },
  },
}
```

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수(1–10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 지역 코드(예: `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 수준.
</ParamField>

지역 및 SafeSearch는 Plugin config에서도 설정할 수 있습니다(위 참조). 도구
매개변수는 쿼리별로 config 값을 재정의합니다.

## 참고

- **API 키 없음** — 별도 설정 없이 즉시 동작
- **실험적** — 공식 API나 SDK가 아니라 DuckDuckGo의 비JavaScript HTML
  검색 페이지에서 결과를 수집
- **봇 챌린지 위험** — DuckDuckGo는 과도하거나 자동화된 사용에서
  CAPTCHA를 제공하거나 요청을 차단할 수 있음
- **HTML 파싱** — 결과는 예고 없이 바뀔 수 있는 페이지 구조에 의존함
- **자동 감지 순서** — DuckDuckGo는 자동 감지에서 첫 번째 키 없는 폴백입니다
  (순서 100). 키가 구성된 API 기반 provider가 먼저 실행되고,
  그 다음 Ollama Web Search(순서 110), 그 다음 SearXNG(순서 200)가 실행됩니다
- 구성되지 않았을 때 **SafeSearch 기본값은 moderate**

<Tip>
  프로덕션 용도라면 [Brave Search](/ko/tools/brave-search)(무료 등급 제공)나
  다른 API 기반 provider를 고려하세요.
</Tip>

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 무료 등급이 있는 구조화된 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출을 포함한 신경망 검색
