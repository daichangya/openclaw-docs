---
read_when:
    - self-hosted 웹 검색 Provider를 원합니다
    - '`web_search`에 SearXNG를 사용하려고 합니다'
    - privacy-focused 또는 air-gapped 검색 옵션이 필요합니다
summary: SearXNG 웹 검색 -- self-hosted, 키 없는 메타 검색 Provider
title: SearXNG 검색
x-i18n:
    generated_at: "2026-04-24T06:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw는 [SearXNG](https://docs.searxng.org/)를 **self-hosted, 키 없는** `web_search` Provider로 지원합니다. SearXNG는 Google, Bing, DuckDuckGo 및 기타 소스의 결과를 집계하는 오픈소스 메타 검색 엔진입니다.

장점:

- **무료 및 무제한** -- API 키나 상용 구독이 필요하지 않음
- **개인정보 보호 / air-gap** -- 질의가 네트워크 밖으로 나가지 않음
- **어디서나 동작** -- 상용 검색 API의 지역 제한 없음

## 설정

<Steps>
  <Step title="SearXNG 인스턴스 실행">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    또는 접근 가능한 기존 SearXNG 배포를 사용하세요. 프로덕션 설정은 [SearXNG 문서](https://docs.searxng.org/)를 참고하세요.

  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # Provider로 "searxng" 선택
    ```

    또는 env var를 설정해 자동 감지가 찾게 할 수도 있습니다:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG 인스턴스용 Plugin 수준 설정:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // 선택 사항
            language: "en", // 선택 사항
          },
        },
      },
    },
  },
}
```

`baseUrl` 필드는 SecretRef 객체도 받을 수 있습니다.

전송 규칙:

- `https://`는 공개 또는 private SearXNG 호스트에서 동작
- `http://`는 신뢰된 private-network 또는 loopback 호스트에서만 허용
- 공개 SearXNG 호스트는 반드시 `https://`를 사용해야 함

## 환경 변수

구성 대신 `SEARXNG_BASE_URL`을 설정할 수 있습니다:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL`이 설정되어 있고 명시적 Provider 구성이 없으면, 자동 감지는 SearXNG를 자동 선택합니다(가장 낮은 우선순위 — 키가 있는 API 기반 Provider가 있으면 그것이 먼저 우선).

## Plugin 구성 참조

| 필드 | 설명 |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl` | SearXNG 인스턴스의 base URL (필수) |
| `categories` | `general`, `news`, `science` 같은 쉼표 구분 카테고리 |
| `language` | `en`, `de`, `fr` 같은 결과 언어 코드 |

## 참고

- **JSON API** -- HTML 스크래핑이 아니라 SearXNG의 네이티브 `format=json` 엔드포인트를 사용
- **API 키 없음** -- 어떤 SearXNG 인스턴스와도 즉시 동작
- **Base URL 검증** -- `baseUrl`은 유효한 `http://` 또는 `https://` URL이어야 하며, 공개 호스트는 반드시 `https://`를 사용해야 함
- **자동 감지 순서** -- SearXNG는 자동 감지에서 마지막(순서 200)으로 확인됩니다. 키가 구성된 API 기반 Provider가 먼저 실행되고, 그다음 DuckDuckGo(순서 100), 그다음 Ollama Web Search(순서 110)가 옵니다
- **Self-hosted** -- 인스턴스, 질의, 업스트림 검색 엔진을 직접 제어
- **카테고리**는 구성되지 않으면 기본적으로 `general`

<Tip>
  SearXNG JSON API가 동작하려면 SearXNG 인스턴스의 `settings.yml`에서 `search.formats` 아래에 `json` 형식이 활성화되어 있어야 합니다.
</Tip>

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 Provider 및 자동 감지
- [DuckDuckGo 검색](/ko/tools/duckduckgo-search) -- 또 다른 키 없는 폴백
- [Brave 검색](/ko/tools/brave-search) -- 무료 계층이 있는 구조화된 결과
