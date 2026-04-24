---
read_when:
    - Firecrawl 기반 웹 추출을 사용하려고 합니다.
    - Firecrawl API key가 필요합니다.
    - Firecrawl를 `web_search` provider로 사용하려고 합니다.
    - '`web_fetch`에 anti-bot 추출을 사용하려고 합니다.'
summary: Firecrawl 검색, 스크레이프 및 web_fetch 대체 경로
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T06:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw는 **Firecrawl**을 세 가지 방식으로 사용할 수 있습니다.

- `web_search` provider로
- 명시적 Plugin 도구로: `firecrawl_search` 및 `firecrawl_scrape`
- `web_fetch`의 fallback 추출기로

이 서비스는 bot 우회와 캐싱을 지원하는 호스팅 검색/추출 서비스로,
JS-heavy 사이트나 일반 HTTP fetch를 차단하는 페이지에 도움이 됩니다.

## API 키 받기

1. Firecrawl 계정을 만들고 API key를 생성합니다.
2. 키를 config에 저장하거나 gateway 환경에 `FIRECRAWL_API_KEY`를 설정합니다.

## Firecrawl 검색 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

참고:

- 온보딩이나 `openclaw configure --section web`에서 Firecrawl을 선택하면 번들 Firecrawl Plugin이 자동으로 활성화됩니다.
- Firecrawl를 사용하는 `web_search`는 `query`와 `count`를 지원합니다.
- `sources`, `categories`, 결과 스크레이핑 같은 Firecrawl 전용 제어가 필요하면 `firecrawl_search`를 사용하세요.
- `baseUrl` 재정의는 `https://api.firecrawl.dev`를 유지해야 합니다.
- `FIRECRAWL_BASE_URL`은 Firecrawl 검색 및 스크레이프 base URL에 대한 공통 env fallback입니다.

## Firecrawl 스크레이프 + web_fetch fallback 구성

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

참고:

- API key(`plugins.entries.firecrawl.config.webFetch.apiKey` 또는 `FIRECRAWL_API_KEY`)가 있을 때만 Firecrawl fallback 시도가 실행됩니다.
- `maxAgeMs`는 캐시된 결과가 허용되는 최대 오래된 정도(ms)를 제어합니다. 기본값은 2일입니다.
- 레거시 `tools.web.fetch.firecrawl.*` config는 `openclaw doctor --fix`가 자동 마이그레이션합니다.
- Firecrawl scrape/base URL 재정의는 `https://api.firecrawl.dev`로 제한됩니다.

`firecrawl_scrape`는 동일한 `plugins.entries.firecrawl.config.webFetch.*` 설정과 env var를 재사용합니다.

## Firecrawl Plugin 도구

### `firecrawl_search`

일반 `web_search` 대신 Firecrawl 전용 검색 제어가 필요할 때 사용합니다.

핵심 매개변수:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

일반 `web_fetch`가 약한 JS-heavy 또는 bot-protected 페이지에 사용합니다.

핵심 매개변수:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / bot 우회

Firecrawl는 bot 우회를 위한 **proxy mode** 매개변수(`basic`, `stealth`, `auto`)를 제공합니다.
OpenClaw는 Firecrawl 요청에 항상 `proxy: "auto"`와 `storeInCache: true`를 사용합니다.
proxy를 생략하면 Firecrawl는 기본값으로 `auto`를 사용합니다. `auto`는 basic 시도가 실패하면 stealth proxy로 재시도하므로,
basic-only 스크레이핑보다 더 많은 credit을 사용할 수 있습니다.

## `web_fetch`에서 Firecrawl을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability (로컬)
2. Firecrawl (선택되었거나 활성 web-fetch fallback으로 자동 감지된 경우)
3. 기본 HTML 정리 (최후 fallback)

선택 설정 키는 `tools.web.fetch.provider`입니다. 이를 생략하면 OpenClaw가
사용 가능한 자격 증명 중 준비된 첫 web-fetch provider를 자동 감지합니다.
현재 번들 provider는 Firecrawl입니다.

## 관련 항목

- [Web Search 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [Web Fetch](/ko/tools/web-fetch) -- Firecrawl fallback이 있는 web_fetch 도구
- [Tavily](/ko/tools/tavily) -- 검색 + 추출 도구
