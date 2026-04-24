---
read_when:
    - 웹 검색 provider로 Perplexity를 구성하려는 경우
    - Perplexity API 키 또는 OpenRouter 프록시 설정이 필요한 경우
summary: Perplexity 웹 검색 provider 설정(API 키, 검색 모드, 필터링)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T06:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (웹 검색 provider)

Perplexity Plugin은 Perplexity
Search API 또는 OpenRouter를 통한 Perplexity Sonar를 통해 웹 검색 기능을 제공합니다.

<Note>
이 페이지는 Perplexity **provider** 설정을 다룹니다. Perplexity
**도구**(에이전트가 이를 사용하는 방식)는 [Perplexity tool](/ko/tools/perplexity-search)를 참조하세요.
</Note>

| 속성 | 값 |
| ----------- | ---------------------------------------------------------------------- |
| 유형 | 웹 검색 provider (모델 provider 아님) |
| 인증 | `PERPLEXITY_API_KEY` (직접) 또는 `OPENROUTER_API_KEY` (OpenRouter 경유) |
| 설정 경로 | `plugins.entries.perplexity.config.webSearch.apiKey` |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    대화형 웹 검색 설정 흐름을 실행하세요.

    ```bash
    openclaw configure --section web
    ```

    또는 키를 직접 설정하세요.

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="검색 시작">
    키가 구성되면 에이전트는 웹 검색에 자동으로 Perplexity를 사용합니다.
    추가 단계는 필요 없습니다.
  </Step>
</Steps>

## 검색 모드

Plugin은 API 키 접두사에 따라 전송 방식을 자동 선택합니다.

<Tabs>
  <Tab title="네이티브 Perplexity API (pplx-)">
    키가 `pplx-`로 시작하면 OpenClaw는 네이티브 Perplexity Search
    API를 사용합니다. 이 전송 방식은 구조화된 결과를 반환하며 도메인, 언어,
    날짜 필터를 지원합니다(아래 필터링 옵션 참조).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    키가 `sk-or-`로 시작하면 OpenClaw는 OpenRouter를 통해
    Perplexity Sonar 모델로 라우팅합니다. 이 전송 방식은 인용이 포함된
    AI 합성 답변을 반환합니다.
  </Tab>
</Tabs>

| 키 접두사 | 전송 방식 | 기능 |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-` | 네이티브 Perplexity Search API | 구조화된 결과, 도메인/언어/날짜 필터 |
| `sk-or-` | OpenRouter (Sonar) | 인용이 포함된 AI 합성 답변 |

## 네이티브 API 필터링

<Note>
필터링 옵션은 네이티브 Perplexity API
(`pplx-` 키)를 사용할 때만 사용할 수 있습니다. OpenRouter/Sonar 검색은 이러한 매개변수를 지원하지 않습니다.
</Note>

네이티브 Perplexity API를 사용할 때 검색은 다음 필터를 지원합니다.

| 필터 | 설명 | 예시 |
| -------------- | -------------------------------------- | ----------------------------------- |
| 국가 | 2자리 국가 코드 | `us`, `de`, `jp` |
| 언어 | ISO 639-1 언어 코드 | `en`, `fr`, `zh` |
| 날짜 범위 | 최신성 창 | `day`, `week`, `month`, `year` |
| 도메인 필터 | 허용 목록 또는 거부 목록(최대 20개 도메인) | `example.com` |
| 콘텐츠 예산 | 응답당 / 페이지당 토큰 제한 | `max_tokens`, `max_tokens_per_page` |

## 고급 설정

<AccordionGroup>
  <Accordion title="daemon 프로세스를 위한 환경 변수">
    OpenClaw Gateway가 daemon(launchd/systemd)으로 실행되는 경우
    `PERPLEXITY_API_KEY`가 해당 프로세스에서 사용 가능한지 확인하세요.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경을 명시적으로 가져오지 않는 한 launchd/systemd
    daemon에서 보이지 않습니다. gateway 프로세스가
    읽을 수 있게 하려면 키를 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 프록시 설정">
    Perplexity 검색을 OpenRouter를 통해 라우팅하고 싶다면,
    네이티브 Perplexity 키 대신 `OPENROUTER_API_KEY`(접두사 `sk-or-`)를 설정하세요.
    OpenClaw는 접두사를 감지하고 Sonar 전송 방식으로
    자동 전환합니다.

    <Tip>
    OpenRouter 전송 방식은 이미 OpenRouter 계정이 있고
    여러 provider에 대해 통합 청구를 원할 때 유용합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Perplexity 검색 도구" href="/ko/tools/perplexity-search" icon="magnifying-glass">
    에이전트가 Perplexity 검색을 호출하고 결과를 해석하는 방식
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    Plugin 항목을 포함한 전체 설정 참조
  </Card>
</CardGroup>
