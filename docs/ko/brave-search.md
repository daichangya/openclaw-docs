---
read_when:
    - '`web_search`에 Brave Search를 사용하려고 합니다.'
    - '`BRAVE_API_KEY` 또는 요금제 세부 정보가 필요합니다.'
summary: '`web_search`를 위한 Brave Search API 설정'
title: Brave 검색(레거시 경로)
x-i18n:
    generated_at: "2026-04-24T06:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw는 `web_search` 제공자로 Brave Search API를 지원합니다.

## API 키 받기

1. [https://brave.com/search/api/](https://brave.com/search/api/)에서 Brave Search API 계정을 만듭니다.
2. 대시보드에서 **Search** 요금제를 선택하고 API 키를 생성합니다.
3. 키를 config에 저장하거나 Gateway 환경에 `BRAVE_API_KEY`를 설정합니다.

## config 예시

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

이제 제공자별 Brave 검색 설정은 `plugins.entries.brave.config.webSearch.*` 아래에 있습니다.
레거시 `tools.web.search.apiKey`도 호환성 shim을 통해 계속 로드되지만, 더 이상 표준 config 경로는 아닙니다.

`webSearch.mode`는 Brave 전송 방식을 제어합니다.

- `web` (기본값): 제목, URL, 스니펫이 포함된 일반 Brave 웹 검색
- `llm-context`: 그라운딩을 위해 미리 추출된 텍스트 청크와 소스를 제공하는 Brave LLM Context API

## 도구 매개변수

| Parameter     | 설명                                                                  |
| ------------- | --------------------------------------------------------------------- |
| `query`       | 검색 쿼리(필수)                                                       |
| `count`       | 반환할 결과 수(1-10, 기본값: 5)                                       |
| `country`     | 2자리 ISO 국가 코드(예: `"US"`, `"DE"`)                               |
| `language`    | 검색 결과용 ISO 639-1 언어 코드(예: `"en"`, `"de"`, `"fr"`)           |
| `search_lang` | Brave 검색 언어 코드(예: `en`, `en-gb`, `zh-hans`)                    |
| `ui_lang`     | UI 요소용 ISO 언어 코드                                               |
| `freshness`   | 시간 필터: `day`(24시간), `week`, `month`, `year`                     |
| `date_after`  | 이 날짜 이후에 게시된 결과만 포함(YYYY-MM-DD)                         |
| `date_before` | 이 날짜 이전에 게시된 결과만 포함(YYYY-MM-DD)                         |

**예시:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 참고

- OpenClaw는 Brave **Search** 요금제를 사용합니다. 레거시 구독(예: 월 2,000쿼리를 제공하던 기존 Free 요금제)이 있는 경우 계속 유효하지만, LLM Context나 더 높은 속도 제한 같은 최신 기능은 포함되지 않습니다.
- 각 Brave 요금제에는 **월 \$5의 무료 크레딧**이 포함되며(매월 갱신), Search 요금제는 요청 1,000건당 \$5입니다. 따라서 이 크레딧으로 월 1,000쿼리를 처리할 수 있습니다. 예상치 못한 요금이 발생하지 않도록 Brave 대시보드에서 사용량 한도를 설정하세요. 현재 요금제는 [Brave API 포털](https://brave.com/search/api/)을 참조하세요.
- Search 요금제에는 LLM Context 엔드포인트와 AI 추론 권한이 포함됩니다. 모델 학습이나 튜닝을 위해 결과를 저장하려면 명시적인 저장 권한이 포함된 요금제가 필요합니다. 자세한 내용은 Brave [서비스 약관](https://api-dashboard.search.brave.com/terms-of-service)을 참조하세요.
- `llm-context` 모드는 일반적인 웹 검색 스니펫 형식 대신 근거가 있는 소스 항목을 반환합니다.
- `llm-context` 모드는 `ui_lang`, `freshness`, `date_after`, `date_before`를 지원하지 않습니다.
- `ui_lang`에는 `en-US`처럼 지역 하위 태그가 포함되어야 합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 설정 가능).

전체 `web_search` 구성은 [Web 도구](/ko/tools/web)를 참조하세요.

## 관련 항목

- [Brave 검색](/ko/tools/brave-search)
