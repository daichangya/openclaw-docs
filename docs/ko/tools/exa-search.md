---
read_when:
    - web_search에 Exa를 사용하고 싶습니다
    - '`EXA_API_KEY`가 필요합니다'
    - 신경망 검색 또는 콘텐츠 추출을 원합니다
summary: Exa AI 검색 -- 콘텐츠 추출을 포함한 신경망 및 키워드 검색
title: Exa 검색
x-i18n:
    generated_at: "2026-04-24T06:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw는 [Exa AI](https://exa.ai/)를 `web_search` provider로 지원합니다. Exa는 내장 콘텐츠 추출(하이라이트, 텍스트, 요약)을 포함한 신경망, 키워드, 하이브리드 검색 모드를 제공합니다.

## API 키 받기

<Steps>
  <Step title="계정 생성">
    [exa.ai](https://exa.ai/)에서 가입하고 대시보드에서 API 키를 생성하세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `EXA_API_KEY`를 설정하거나 다음으로 구성하세요:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // EXA_API_KEY가 설정되어 있으면 선택 사항
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**환경 변수 대안:** Gateway 환경에 `EXA_API_KEY`를 설정하세요.
gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.

## 도구 파라미터

<ParamField path="query" type="string" required>
검색 쿼리.
</ParamField>

<ParamField path="count" type="number">
반환할 결과 수(1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
검색 모드.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후 결과(`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전 결과(`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
콘텐츠 추출 옵션(아래 참조).
</ParamField>

### 콘텐츠 추출

Exa는 검색 결과와 함께 추출된 콘텐츠를 반환할 수 있습니다. 활성화하려면 `contents`
객체를 전달하세요:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // 전체 페이지 텍스트
    highlights: { numSentences: 3 }, // 핵심 문장
    summary: true, // AI 요약
  },
});
```

| 콘텐츠 옵션  | 타입                                                                  | 설명                    |
| ------------ | --------------------------------------------------------------------- | ----------------------- |
| `text`       | `boolean \| { maxCharacters }`                                        | 전체 페이지 텍스트 추출 |
| `highlights` | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 핵심 문장 추출          |
| `summary`    | `boolean \| { query }`                                                | AI 생성 요약            |

### 검색 모드

| 모드              | 설명                                 |
| ----------------- | ------------------------------------ |
| `auto`            | Exa가 최적의 모드 선택(기본값)       |
| `neural`          | 의미/시맨틱 기반 검색                |
| `fast`            | 빠른 키워드 검색                     |
| `deep`            | 철저한 심층 검색                     |
| `deep-reasoning`  | 추론이 포함된 심층 검색              |
| `instant`         | 가장 빠른 결과                       |

## 참고

- `contents` 옵션이 제공되지 않으면 Exa는 기본적으로 `{ highlights: true }`를 사용하므로 결과에 핵심 문장 발췌가 포함됩니다
- 결과는 가능한 경우 Exa API
  응답의 `highlightScores`와 `summary` 필드를 보존합니다
- 결과 설명은 하이라이트를 우선하고, 그다음 요약, 그다음 전체 텍스트 순으로 해석됩니다 — 사용 가능한 것 중 하나를 사용합니다
- `freshness`와 `date_after`/`date_before`는 함께 사용할 수 없습니다 — 하나의 시간 필터 모드만 사용하세요
- 쿼리당 최대 100개의 결과를 반환할 수 있습니다(Exa 검색 유형 제한 적용 가능)
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능)
- Exa는 구조화된 JSON 응답을 제공하는 공식 API 통합입니다

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 국가/언어 필터가 있는 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 도메인 필터링이 있는 구조화된 결과
