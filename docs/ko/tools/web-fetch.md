---
read_when:
    - URL을 가져와 읽을 수 있는 콘텐츠를 추출하려는 경우
    - web_fetch 또는 해당 Firecrawl fallback을 구성해야 하는 경우
    - web_fetch 제한 사항과 캐싱을 이해하려는 경우
sidebarTitle: Web Fetch
summary: web_fetch 도구 -- 읽을 수 있는 콘텐츠 추출이 포함된 HTTP fetch
title: 웹 가져오기
x-i18n:
    generated_at: "2026-04-24T06:43:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

`web_fetch` 도구는 일반 HTTP GET을 수행하고 읽을 수 있는 콘텐츠를 추출합니다
(HTML을 markdown 또는 text로 변환). JavaScript는 **실행하지 않습니다**.

JS가 많은 사이트나 로그인 보호 페이지의 경우
[웹 브라우저](/ko/tools/browser)를 사용하세요.

## 빠른 시작

`web_fetch`는 **기본적으로 활성화**되어 있으므로 별도 구성이 필요 없습니다. 에이전트는
즉시 이를 호출할 수 있습니다.

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 도구 매개변수

<ParamField path="url" type="string" required>
가져올 URL. `http(s)`만 지원합니다.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
주요 콘텐츠 추출 후 출력 형식.
</ParamField>

<ParamField path="maxChars" type="number">
출력을 이 문자 수만큼 잘라냅니다.
</ParamField>

## 동작 방식

<Steps>
  <Step title="가져오기">
    Chrome 유사 User-Agent와 `Accept-Language`
    헤더를 사용해 HTTP GET을 보냅니다. private/internal 호스트 이름은 차단하고 리디렉션도 다시 점검합니다.
  </Step>
  <Step title="추출">
    HTML 응답에 대해 Readability(주요 콘텐츠 추출)를 실행합니다.
  </Step>
  <Step title="대체(fallback, 선택 사항)">
    Readability가 실패하고 Firecrawl이 구성되어 있으면,
    bot-circumvention 모드로 Firecrawl API를 통해 다시 시도합니다.
  </Step>
  <Step title="캐시">
    같은 URL의 반복 fetch를 줄이기 위해 결과를 15분 동안 캐시합니다(구성 가능).
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 기본값: true
        provider: "firecrawl", // 선택 사항; 자동 감지를 원하면 생략
        maxChars: 50000, // 최대 출력 문자 수
        maxCharsCap: 50000, // maxChars 매개변수의 하드 상한
        maxResponseBytes: 2000000, // 잘라내기 전 최대 다운로드 크기
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability 추출 사용
        userAgent: "Mozilla/5.0 ...", // User-Agent 재정의
      },
    },
  },
}
```

## Firecrawl fallback

Readability 추출이 실패하면, `web_fetch`는
bot-circumvention과 더 나은 추출을 위해 [Firecrawl](/ko/tools/firecrawl)로 fallback할 수 있습니다.

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 선택 사항; 사용 가능한 자격 증명에서 자동 감지를 원하면 생략
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // FIRECRAWL_API_KEY가 설정되어 있으면 선택 사항
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // 캐시 기간 (1일)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey`는 SecretRef 객체를 지원합니다.
레거시 `tools.web.fetch.firecrawl.*` config는 `openclaw doctor --fix`가 자동 마이그레이션합니다.

<Note>
  Firecrawl이 활성화되어 있고 env의 `FIRECRAWL_API_KEY` fallback 없이
  SecretRef가 확인되지 않으면, gateway 시작이 즉시 실패합니다.
</Note>

<Note>
  Firecrawl `baseUrl` 재정의는 엄격하게 제한됩니다. `https://`와
  공식 Firecrawl 호스트(`api.firecrawl.dev`)를 사용해야 합니다.
</Note>

현재 런타임 동작:

- `tools.web.fetch.provider`는 fetch fallback provider를 명시적으로 선택합니다.
- `provider`를 생략하면, OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 web-fetch
  provider를 자동 감지합니다. 현재 번들 provider는 Firecrawl입니다.
- Readability가 비활성화되면 `web_fetch`는 선택된
  provider fallback으로 바로 이동합니다. 사용 가능한 provider가 없으면 fail closed됩니다.

## 제한 및 안전성

- `maxChars`는 `tools.web.fetch.maxCharsCap`으로 제한됩니다
- 응답 본문은 파싱 전에 `maxResponseBytes`로 제한되며, 너무 큰
  응답은 경고와 함께 잘립니다
- private/internal 호스트 이름은 차단됩니다
- 리디렉션은 `maxRedirects`에 따라 점검되고 제한됩니다
- `web_fetch`는 최선의 노력 방식입니다. 일부 사이트는 [웹 브라우저](/ko/tools/browser)가 필요합니다

## 도구 프로필

도구 프로필이나 allowlist를 사용하는 경우 `web_fetch` 또는 `group:web`을 추가하세요.

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 또는: allow: ["group:web"]  (web_fetch, web_search, x_search 포함)
  },
}
```

## 관련

- [웹 검색](/ko/tools/web) -- 여러 provider로 웹 검색하기
- [웹 브라우저](/ko/tools/browser) -- JS가 많은 사이트용 전체 브라우저 자동화
- [Firecrawl](/ko/tools/firecrawl) -- Firecrawl 검색 및 스크래핑 도구
