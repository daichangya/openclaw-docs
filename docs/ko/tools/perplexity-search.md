---
read_when:
    - 웹 검색에 Perplexity Search를 사용하려는 경우
    - '`PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY` 설정이 필요한 경우'
summary: web_search용 Perplexity Search API 및 Sonar/OpenRouter 호환성
title: Perplexity 검색
x-i18n:
    generated_at: "2026-04-24T06:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw는 `web_search` provider로 Perplexity Search API를 지원합니다.
이는 `title`, `url`, `snippet` 필드를 가진 구조화된 결과를 반환합니다.

호환성을 위해 OpenClaw는 레거시 Perplexity Sonar/OpenRouter 설정도 지원합니다.
`OPENROUTER_API_KEY`를 사용하거나, `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 넣거나, `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`을 설정하면, provider는 chat-completions 경로로 전환되고 구조화된 Search API 결과 대신 인용이 있는 AI 합성 응답을 반환합니다.

## Perplexity API 키 받기

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 만드세요
2. 대시보드에서 API 키를 생성하세요
3. config에 키를 저장하거나 Gateway 환경에 `PERPLEXITY_API_KEY`를 설정하세요.

## OpenRouter 호환성

이미 OpenRouter를 Perplexity Sonar용으로 사용 중이었다면, `provider: "perplexity"`를 유지하고 Gateway 환경에 `OPENROUTER_API_KEY`를 설정하거나 `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 저장하세요.

선택적 호환성 제어:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Config 예시

### 네이티브 Perplexity Search API

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

**Config를 통한 방법:** `openclaw configure --section web`를 실행하세요. 키는
`~/.openclaw/openclaw.json`의 `plugins.entries.perplexity.config.webSearch.apiKey` 아래에 저장됩니다.
이 필드는 SecretRef 객체도 받을 수 있습니다.

**환경을 통한 방법:** Gateway 프로세스 환경에 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정하세요. gateway 설치의 경우,
`~/.openclaw/.env`(또는 서비스 환경)에 넣으세요. [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하세요.

`provider: "perplexity"`가 구성되어 있고 env 대체 없이 Perplexity 키 SecretRef가 확인되지 않으면, 시작/재로드가 즉시 실패합니다.

## 도구 매개변수

이 매개변수들은 네이티브 Perplexity Search API 경로에 적용됩니다.

<ParamField path="query" type="string" required>
검색 쿼리.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수(1–10).
</ParamField>

<ParamField path="country" type="string">
2글자 ISO 국가 코드(예: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 언어 코드(예: `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터 — `day`는 24시간입니다.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후에 게시된 결과만 포함(`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전에 게시된 결과만 포함(`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
도메인 allowlist/denylist 배열(최대 20개).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
총 콘텐츠 예산(최대 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
페이지당 토큰 제한.
</ParamField>

레거시 Sonar/OpenRouter 호환 경로의 경우:

- `query`, `count`, `freshness`는 허용됩니다
- 여기서 `count`는 호환성 전용입니다. 응답은 여전히 N개 결과 목록이 아니라 인용이 있는 하나의 합성 응답입니다
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page` 같은 Search API 전용 필터는
  명시적인 오류를 반환합니다

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 최근 결과(지난 주)
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

// 도메인 필터링(allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 도메인 필터링(denylist - 접두사 - 사용)
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
- 하나의 요청에서 allowlist와 denylist를 혼합할 수 없음
- denylist 항목에는 `-` 접두사를 사용(예: `["-reddit.com"]`)

## 참고

- Perplexity Search API는 구조화된 웹 검색 결과(`title`, `url`, `snippet`)를 반환합니다
- OpenRouter 또는 명시적 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`은 호환성을 위해 Perplexity를 다시 Sonar chat completions로 전환합니다
- Sonar/OpenRouter 호환성은 구조화된 결과 행이 아니라 인용이 있는 하나의 합성 응답을 반환합니다
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능)

## 관련

- [웹 검색 개요](/ko/tools/web) -- 모든 provider 및 자동 감지
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- 공식 Perplexity 문서
- [Brave Search](/ko/tools/brave-search) -- 국가/언어 필터가 있는 구조화된 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출이 있는 신경망 검색
