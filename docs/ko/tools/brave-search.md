---
read_when:
    - '`web_search`에 Brave Search를 사용하고 싶으신 것입니다'
    - '`BRAVE_API_KEY` 또는 요금제 세부 정보가 필요합니다'
summary: '`web_search`용 Brave Search API 설정'
title: Brave 검색
x-i18n:
    generated_at: "2026-04-24T06:37:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw는 Brave Search API를 `web_search` provider로 지원합니다.

## API 키 받기

1. [https://brave.com/search/api/](https://brave.com/search/api/)에서 Brave Search API 계정을 생성하세요
2. 대시보드에서 **Search** 요금제를 선택하고 API 키를 생성하세요.
3. 키를 구성에 저장하거나 Gateway 환경에 `BRAVE_API_KEY`를 설정하세요.

## 구성 예시

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // 또는 "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

provider별 Brave 검색 설정은 이제 `plugins.entries.brave.config.webSearch.*` 아래에 있습니다.
레거시 `tools.web.search.apiKey`도 호환성 shim을 통해 계속 로드되지만, 더 이상 정식 구성 경로는 아닙니다.

`webSearch.mode`는 Brave 전송 방식을 제어합니다:

- `web` (기본값): 제목, URL, 스니펫이 포함된 일반 Brave 웹 검색
- `llm-context`: grounding용으로 미리 추출된 텍스트 청크와 소스를 제공하는 Brave LLM Context API

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수 (1–10).
</ParamField>

<ParamField path="country" type="string">
2자리 ISO 국가 코드 (예: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
검색 결과용 ISO 639-1 언어 코드 (예: `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave 검색 언어 코드 (예: `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
UI 요소용 ISO 언어 코드.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터 — `day`는 24시간입니다.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후에 게시된 결과만 포함 (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전에 게시된 결과만 포함 (`YYYY-MM-DD`).
</ParamField>

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 최근 결과 (지난 1주)
await web_search({
  query: "AI news",
  freshness: "week",
});

// 날짜 범위 검색
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 참고

- OpenClaw는 Brave **Search** 요금제를 사용합니다. 레거시 구독(예: 월 2,000회 쿼리의 초기 Free 요금제)이 있다면 여전히 유효하지만, LLM Context나 더 높은 rate limit 같은 최신 기능은 포함하지 않습니다.
- 각 Brave 요금제에는 **월 \$5 무료 크레딧**이 포함됩니다(매월 갱신). Search 요금제는 요청 1,000회당 \$5이므로, 이 크레딧으로 월 1,000회 쿼리를 처리할 수 있습니다. 예상치 못한 요금을 피하려면 Brave 대시보드에서 사용 한도를 설정하세요. 현재 요금제는 [Brave API 포털](https://brave.com/search/api/)을 참조하세요.
- Search 요금제에는 LLM Context 엔드포인트와 AI 추론 권한이 포함됩니다. 결과를 저장하여 모델을 학습 또는 튜닝하려면 명시적 저장 권한이 있는 요금제가 필요합니다. Brave [서비스 약관](https://api-dashboard.search.brave.com/terms-of-service)을 참조하세요.
- `llm-context` 모드는 일반 웹 검색 스니펫 형태 대신 grounded source 항목을 반환합니다.
- `llm-context` 모드는 `ui_lang`, `freshness`, `date_after`, `date_before`를 지원하지 않습니다.
- `ui_lang`에는 `en-US`처럼 리전 하위 태그가 포함되어야 합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능).

## 관련

- [웹 검색 개요](/ko/tools/web) -- 모든 provider 및 자동 감지
- [Perplexity Search](/ko/tools/perplexity-search) -- 도메인 필터링이 포함된 구조화 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출이 포함된 신경망 검색
