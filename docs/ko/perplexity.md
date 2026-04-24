---
read_when:
    - 웹 검색에 Perplexity Search를 사용하려고 합니다
    - '`PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정해야 합니다'
summary: web_search를 위한 Perplexity Search API 및 Sonar/OpenRouter 호환성
title: Perplexity 검색(레거시 경로)
x-i18n:
    generated_at: "2026-04-24T06:23:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw는 `web_search` 제공자로 Perplexity Search API를 지원합니다.
이 API는 `title`, `url`, `snippet` 필드가 포함된 구조화된 결과를 반환합니다.

호환성을 위해 OpenClaw는 레거시 Perplexity Sonar/OpenRouter 구성도 지원합니다.
`OPENROUTER_API_KEY`를 사용하거나, `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 사용하거나, `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`을 설정하면 제공자가 chat-completions 경로로 전환되며, 구조화된 Search API 결과 대신 인용이 포함된 AI 합성 응답을 반환합니다.

## Perplexity API 키 받기

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 만듭니다.
2. 대시보드에서 API 키를 생성합니다.
3. 키를 config에 저장하거나 Gateway 환경에 `PERPLEXITY_API_KEY`를 설정합니다.

## OpenRouter 호환성

이미 OpenRouter를 Perplexity Sonar에 사용 중이었다면 `provider: "perplexity"`를 유지하고 Gateway 환경에 `OPENROUTER_API_KEY`를 설정하거나, `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 저장하세요.

선택적 호환성 제어 항목:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## config 예시

### 기본 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 호환성

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 키 설정 위치

**config를 통해:** `openclaw configure --section web`를 실행하세요. 그러면 키가
`~/.openclaw/openclaw.json`의 `plugins.entries.perplexity.config.webSearch.apiKey` 아래에 저장됩니다.
이 필드는 SecretRef 객체도 허용합니다.

**환경을 통해:** Gateway 프로세스 환경에 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정하세요.
Gateway 설치의 경우 이를
`~/.openclaw/.env`(또는 서비스 환경)에 넣으세요. 자세한 내용은 [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하세요.

`provider: "perplexity"`가 구성되어 있고 Perplexity 키 SecretRef가 확인되지 않았으며 env 폴백도 없으면, 시작/리로드는 즉시 실패합니다.

## 도구 매개변수

이 매개변수들은 기본 Perplexity Search API 경로에 적용됩니다.

| Parameter             | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `query`               | 검색 쿼리(필수)                                      |
| `count`               | 반환할 결과 수(1-10, 기본값: 5)                      |
| `country`             | 2자리 ISO 국가 코드(예: `"US"`, `"DE"`)              |
| `language`            | ISO 639-1 언어 코드(예: `"en"`, `"de"`, `"fr"`)      |
| `freshness`           | 시간 필터: `day`(24시간), `week`, `month`, `year`    |
| `date_after`          | 이 날짜 이후에 게시된 결과만 포함(YYYY-MM-DD)        |
| `date_before`         | 이 날짜 이전에 게시된 결과만 포함(YYYY-MM-DD)        |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(최대 20개)           |
| `max_tokens`          | 전체 콘텐츠 예산(기본값: 25000, 최대: 1000000)       |
| `max_tokens_per_page` | 페이지당 토큰 한도(기본값: 2048)                     |

레거시 Sonar/OpenRouter 호환 경로의 경우:

- `query`, `count`, `freshness`가 허용됩니다.
- 여기서 `count`는 호환성 전용이며, 응답은 여전히 N개 결과 목록이 아니라
  인용이 포함된 하나의 합성 응답입니다.
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page` 같은 Search API 전용 필터는
  명시적 오류를 반환합니다.

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 최근 결과(지난주)
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

// 도메인 필터링(허용 목록)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 도메인 필터링(차단 목록 - 앞에 - 추가)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 더 많은 콘텐츠 추출
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 도메인 필터 규칙

- 필터당 최대 20개 도메인
- 동일한 요청에서 허용 목록과 차단 목록을 함께 사용할 수 없음
- 차단 목록 항목에는 `-` 접두사를 사용(예: `["-reddit.com"]`)

## 참고

- Perplexity Search API는 구조화된 웹 검색 결과(`title`, `url`, `snippet`)를 반환합니다.
- OpenRouter 또는 명시적인 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 설정은 호환성을 위해 Perplexity를 다시 Sonar chat completions로 전환합니다.
- Sonar/OpenRouter 호환성은 구조화된 결과 행이 아니라 인용이 포함된 하나의 합성 응답을 반환합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능).

전체 `web_search` 구성은 [웹 도구](/ko/tools/web)를 참조하세요.
자세한 내용은 [Perplexity Search API 문서](https://docs.perplexity.ai/docs/search/quickstart)를 참조하세요.

## 관련 항목

- [Perplexity 검색](/ko/tools/perplexity-search)
- [웹 검색](/ko/tools/web)
