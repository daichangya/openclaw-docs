---
read_when:
    - '`web_search`를 활성화하거나 구성하려고 합니다'
    - '`x_search`를 활성화하거나 구성하려고 합니다'
    - 검색 provider를 선택해야 합니다
    - 자동 감지와 provider 대체 동작을 이해하려고 합니다
sidebarTitle: Web Search
summary: '`web_search`, `x_search`, `web_fetch` -- 웹 검색, X 게시물 검색, 또는 페이지 콘텐츠 가져오기'
title: 웹 검색
x-i18n:
    generated_at: "2026-04-22T04:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# 웹 검색

`web_search` 도구는 구성된 provider를 사용해 웹을 검색하고
결과를 반환합니다. 결과는 쿼리별로 15분 동안 캐시됩니다(구성 가능).

OpenClaw에는 X(구 Twitter) 게시물용 `x_search`와
가벼운 URL 가져오기용 `web_fetch`도 포함되어 있습니다. 현재 단계에서는 `web_fetch`는
로컬에 머무르며, `web_search`와 `x_search`는 내부적으로 xAI Responses를 사용할 수 있습니다.

<Info>
  `web_search`는 브라우저 자동화가 아닌 가벼운 HTTP 도구입니다. JS 사용이 많은 사이트나 로그인에는 [Web Browser](/ko/tools/browser)를 사용하세요. 특정 URL을 가져오려면 [Web Fetch](/ko/tools/web-fetch)를 사용하세요.
</Info>

## 빠른 시작

<Steps>
  <Step title="provider 선택">
    provider를 선택하고 필요한 설정을 완료하세요. 일부 provider는
    키가 필요 없고, 다른 provider는 API 키를 사용합니다. 자세한 내용은 아래
    provider 페이지를 참고하세요.
  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    ```
    그러면 provider와 필요한 자격 증명이 저장됩니다. API 기반
    provider의 경우 env var(예: `BRAVE_API_KEY`)를 설정하고 이 단계를 건너뛸 수도 있습니다.
  </Step>
  <Step title="사용">
    이제 에이전트가 `web_search`를 호출할 수 있습니다:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X 게시물에는 다음을 사용하세요:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## provider 선택

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ko/tools/brave-search">
    스니펫이 포함된 구조화된 결과를 제공합니다. `llm-context` 모드, 국가/언어 필터를 지원합니다. 무료 등급을 사용할 수 있습니다.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ko/tools/duckduckgo-search">
    키가 필요 없는 대체 provider입니다. API 키가 필요 없습니다. 비공식 HTML 기반 통합입니다.
  </Card>
  <Card title="Exa" icon="brain" href="/ko/tools/exa-search">
    콘텐츠 추출(하이라이트, 텍스트, 요약)을 지원하는 신경망 + 키워드 검색입니다.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ko/tools/firecrawl">
    구조화된 결과를 제공합니다. 깊이 있는 추출에는 `firecrawl_search` 및 `firecrawl_scrape`와 함께 사용하는 것이 가장 좋습니다.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ko/tools/gemini-search">
    Google Search grounding을 통한 인용 포함 AI 종합 답변입니다.
  </Card>
  <Card title="Grok" icon="zap" href="/ko/tools/grok-search">
    xAI 웹 grounding을 통한 인용 포함 AI 종합 답변입니다.
  </Card>
  <Card title="Kimi" icon="moon" href="/ko/tools/kimi-search">
    Moonshot 웹 검색을 통한 인용 포함 AI 종합 답변입니다.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ko/tools/minimax-search">
    MiniMax Coding Plan 검색 API를 통한 구조화된 결과입니다.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ko/tools/ollama-search">
    구성된 Ollama 호스트를 통한 키 없는 검색입니다. `ollama signin`이 필요합니다.
  </Card>
  <Card title="Perplexity" icon="search" href="/ko/tools/perplexity-search">
    콘텐츠 추출 제어 및 도메인 필터링을 갖춘 구조화된 결과입니다.
  </Card>
  <Card title="SearXNG" icon="server" href="/ko/tools/searxng-search">
    셀프 호스팅 메타 검색입니다. API 키가 필요 없습니다. Google, Bing, DuckDuckGo 등을 집계합니다.
  </Card>
  <Card title="Tavily" icon="globe" href="/ko/tools/tavily">
    검색 깊이, 주제 필터링, URL 추출용 `tavily_extract`를 갖춘 구조화된 결과입니다.
  </Card>
</CardGroup>

### provider 비교

| Provider | 결과 스타일 | 필터 | API 키 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ko/tools/brave-search)              | 구조화된 스니펫        | 국가, 언어, 시간, `llm-context` 모드      | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ko/tools/duckduckgo-search)    | 구조화된 스니펫        | --                                               | 없음 (키 불필요)                                                                  |
| [Exa](/ko/tools/exa-search)                  | 구조화 + 추출됨     | 신경망/키워드 모드, 날짜, 콘텐츠 추출    | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ko/tools/firecrawl)             | 구조화된 스니펫        | `firecrawl_search` 도구를 통해                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ko/tools/gemini-search)            | AI 종합 + 인용 | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/ko/tools/grok-search)                | AI 종합 + 인용 | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/ko/tools/kimi-search)                | AI 종합 + 인용 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ko/tools/minimax-search)   | 구조화된 스니펫        | 지역 (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ko/tools/ollama-search) | 구조화된 스니펫        | --                                               | 기본적으로 없음; `ollama signin` 필요, Ollama provider bearer auth 재사용 가능 |
| [Perplexity](/ko/tools/perplexity-search)    | 구조화된 스니펫        | 국가, 언어, 시간, 도메인, 콘텐츠 제한 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ko/tools/searxng-search)          | 구조화된 스니펫        | 카테고리, 언어                             | 없음 (셀프 호스팅)                                                               |
| [Tavily](/ko/tools/tavily)                   | 구조화된 스니펫        | `tavily_search` 도구를 통해                         | `TAVILY_API_KEY`                                                                 |

## 자동 감지

## Native Codex 웹 검색

Codex 지원 모델은 OpenClaw의 관리형 `web_search` 함수 대신 provider 기본 Responses `web_search` 도구를 선택적으로 사용할 수 있습니다.

- `tools.web.search.openaiCodex` 아래에서 구성합니다
- Codex 지원 모델에서만 활성화됩니다(`openai-codex/*` 또는 `api: "openai-codex-responses"`를 사용하는 provider)
- 관리형 `web_search`는 비-Codex 모델에 계속 적용됩니다
- `mode: "cached"`가 기본값이며 권장 설정입니다
- `tools.web.search.enabled: false`는 관리형 검색과 기본 검색을 모두 비활성화합니다

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

기본 Codex 검색이 활성화되어 있어도 현재 모델이 Codex 지원이 아니면, OpenClaw는 일반 관리형 `web_search` 동작을 유지합니다.

## 웹 검색 설정

문서와 설정 흐름의 provider 목록은 알파벳순입니다. 자동 감지는 별도의
우선순위 순서를 유지합니다.

`provider`가 설정되지 않으면, OpenClaw는 다음 순서로 provider를 확인하고 준비된
첫 번째 provider를 사용합니다:

먼저 API 기반 provider:

1. **Brave** -- `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey` (순서 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey` (순서 15)
3. **Gemini** -- `GEMINI_API_KEY` 또는 `plugins.entries.google.config.webSearch.apiKey` (순서 20)
4. **Grok** -- `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey` (순서 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey` (순서 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey` (순서 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey` (순서 60)
8. **Exa** -- `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey` (순서 65)
9. **Tavily** -- `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey` (순서 70)

그 후 키가 필요 없는 대체 provider:

10. **DuckDuckGo** -- 계정이나 API 키가 필요 없는 키 없는 HTML 대체 provider (순서 100)
11. **Ollama Web Search** -- 구성된 Ollama 호스트를 통한 키 없는 대체 provider. Ollama에 연결 가능해야 하고 `ollama signin`으로 로그인되어 있어야 하며, 호스트에 필요하면 Ollama provider bearer auth를 재사용할 수 있습니다 (순서 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl` (순서 200)

감지된 provider가 없으면 Brave로 대체됩니다(구성하라는 메시지와 함께 키 누락
오류가 표시됩니다).

<Note>
  모든 provider 키 필드는 SecretRef 객체를 지원합니다. `plugins.entries.<plugin>.config.webSearch.apiKey` 아래의 plugin 범위 SecretRef는
  provider가 `tools.web.search.provider`를 통해 명시적으로 선택되든
  자동 감지를 통해 선택되든, 번들 Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity, Tavily
  provider에 대해 확인됩니다. 자동 감지 모드에서는 OpenClaw가 선택된
  provider 키만 확인하므로, 선택되지 않은 SecretRef는 비활성 상태로 남습니다. 따라서
  사용하지 않는 provider에 대한 확인 비용을 지불하지 않고도 여러 provider를 구성해 둘 수 있습니다.
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 기본값: true
        provider: "brave", // 또는 자동 감지를 위해 생략
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider별 config(API 키, base URL, 모드)는
`plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다. 예시는
provider 페이지를 참고하세요.

`web_fetch` 대체 provider 선택은 별도입니다:

- `tools.web.fetch.provider`로 선택하세요
- 또는 해당 필드를 생략하고, 사용 가능한 자격 증명 중 준비된 첫 번째 web-fetch
  provider를 OpenClaw가 자동 감지하게 하세요
- 현재 번들 web-fetch provider는 Firecrawl이며,
  `plugins.entries.firecrawl.config.webFetch.*` 아래에서 구성합니다

`openclaw onboard` 또는
`openclaw configure --section web` 중에 **Kimi**를 선택하면, OpenClaw는 추가로 다음을 물을 수 있습니다:

- Moonshot API 지역 (`https://api.moonshot.ai/v1` 또는 `https://api.moonshot.cn/v1`)
- 기본 Kimi 웹 검색 모델 (기본값 `kimi-k2.6`)

`x_search`의 경우 `plugins.entries.xai.config.xSearch.*`를 구성하세요. 이는
Grok 웹 검색과 동일한 `XAI_API_KEY` 대체 경로를 사용합니다.
레거시 `tools.web.x_search.*` config는 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.
`openclaw onboard` 또는 `openclaw configure --section web` 중에 Grok을 선택하면,
OpenClaw는 동일한 키를 사용한 선택적 `x_search` 설정도 제공할 수 있습니다.
이는 Grok 경로 내부의 별도 후속 단계이며, 별도의 최상위
웹 검색 provider 선택 항목이 아닙니다. 다른 provider를 선택하면 OpenClaw는
`x_search` 프롬프트를 표시하지 않습니다.

### API 키 저장

<Tabs>
  <Tab title="config 파일">
    `openclaw configure --section web`를 실행하거나 키를 직접 설정하세요:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="환경 변수">
    Gateway 프로세스 환경에서 provider env var를 설정하세요:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.
    자세한 내용은 [Env vars](/ko/help/faq#env-vars-and-env-loading)를 참고하세요.

  </Tab>
</Tabs>

## 도구 파라미터

| 파라미터 | 설명 |
| --------------------- | ----------------------------------------------------- |
| `query`               | 검색 쿼리(필수)                               |
| `count`               | 반환할 결과 수(1-10, 기본값: 5)                  |
| `country`             | 2자리 ISO 국가 코드(예: `"US"`, `"DE"`)           |
| `language`            | ISO 639-1 언어 코드(예: `"en"`, `"de"`)             |
| `search_lang`         | 검색 언어 코드(Brave 전용)                     |
| `freshness`           | 시간 필터: `day`, `week`, `month`, 또는 `year`        |
| `date_after`          | 이 날짜 이후 결과(YYYY-MM-DD)                  |
| `date_before`         | 이 날짜 이전 결과(YYYY-MM-DD)                 |
| `ui_lang`             | UI 언어 코드(Brave 전용)                         |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(Perplexity 전용)     |
| `max_tokens`          | 총 콘텐츠 예산, 기본값 25000 (Perplexity 전용) |
| `max_tokens_per_page` | 페이지별 토큰 제한, 기본값 2048 (Perplexity 전용)  |

<Warning>
  모든 파라미터가 모든 provider에서 작동하는 것은 아닙니다. Brave `llm-context` 모드는
  `ui_lang`, `freshness`, `date_after`, `date_before`를 거부합니다.
  Gemini, Grok, Kimi는 인용이 포함된 하나의 종합 답변을 반환합니다. 이들은
  공통 도구 호환성을 위해 `count`를 허용하지만,
  grounding된 답변 형태는 바뀌지 않습니다.
  Perplexity도 Sonar/OpenRouter
  호환 경로(`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 또는 `OPENROUTER_API_KEY`)를 사용할 때 동일하게 동작합니다.
  SearXNG는 신뢰할 수 있는 사설 네트워크 또는 loopback 호스트에 대해서만 `http://`를 허용하며,
  공개 SearXNG 엔드포인트는 `https://`를 사용해야 합니다.
  Firecrawl과 Tavily는 `web_search`를 통해서는 `query`와 `count`만 지원합니다.
  고급 옵션에는 전용 도구를 사용하세요.
</Warning>

## x_search

`x_search`는 xAI를 사용해 X(구 Twitter) 게시물을 조회하고
인용이 포함된 AI 종합 답변을 반환합니다. 자연어 쿼리와
선택적 구조화 필터를 받을 수 있습니다. OpenClaw는 이 도구 호출을 처리하는 요청에서만
내장 xAI `x_search` 도구를 활성화합니다.

<Note>
  xAI 문서에 따르면 `x_search`는 키워드 검색, 의미 기반 검색, 사용자
  검색, 스레드 가져오기를 지원합니다. 리포스트,
  답글, 북마크, 조회수 같은 게시물별 참여 통계에는 정확한 게시물 URL
  또는 status ID를 대상으로 한 조회를 우선하세요. 광범위한 키워드 검색도
  올바른 게시물을 찾을 수는 있지만 게시물별 메타데이터가 덜 완전할 수 있습니다.
  좋은 패턴은 먼저 게시물을 찾고, 그 다음 정확한 게시물에 집중한 두 번째
  `x_search` 쿼리를 실행하는 것입니다.
</Note>

### x_search config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### x_search 파라미터

| 파라미터 | 설명 |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 검색 쿼리(필수)                                |
| `allowed_x_handles`          | 결과를 특정 X 핸들로 제한                 |
| `excluded_x_handles`         | 특정 X 핸들 제외                             |
| `from_date`                  | 이 날짜 이후(포함) 게시물만 포함(YYYY-MM-DD)  |
| `to_date`                    | 이 날짜 이전(포함) 게시물만 포함(YYYY-MM-DD) |
| `enable_image_understanding` | xAI가 일치하는 게시물에 첨부된 이미지를 검사하도록 허용      |
| `enable_video_understanding` | xAI가 일치하는 게시물에 첨부된 비디오를 검사하도록 허용      |

### x_search 예시

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 게시물별 통계: 가능하면 정확한 status URL 또는 status ID를 사용하세요
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 예시

```javascript
// 기본 검색
await web_search({ query: "OpenClaw plugin SDK" });

// 독일 전용 검색
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 최근 결과(지난 1주)
await web_search({ query: "AI developments", freshness: "week" });

// 날짜 범위
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 도메인 필터링(Perplexity 전용)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 도구 프로필

도구 프로필 또는 허용 목록을 사용한다면 `web_search`, `x_search`, 또는 `group:web`를 추가하세요:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 또는: allow: ["group:web"]  (web_search, x_search, web_fetch 포함)
  },
}
```

## 관련 항목

- [Web Fetch](/ko/tools/web-fetch) -- URL을 가져와 읽기 쉬운 콘텐츠를 추출
- [Web Browser](/ko/tools/browser) -- JS 사용이 많은 사이트를 위한 전체 브라우저 자동화
- [Grok Search](/ko/tools/grok-search) -- `web_search` provider로서의 Grok
- [Ollama Web Search](/ko/tools/ollama-search) -- Ollama 호스트를 통한 키 없는 웹 검색
