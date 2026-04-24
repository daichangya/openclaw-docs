---
read_when:
    - '`web_search`에 Ollama를 사용하려고 합니다'
    - API 키가 필요 없는 `web_search` provider를 원합니다
    - Ollama Web Search 설정 안내가 필요합니다
summary: 구성된 Ollama 호스트를 통한 Ollama Web Search
title: Ollama 웹 검색
x-i18n:
    generated_at: "2026-04-24T06:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw는 **Ollama Web Search**를 번들 `web_search` provider로 지원합니다.
이 provider는 Ollama의 실험적 웹 검색 API를 사용하며, 제목, URL, 스니펫이 포함된 구조화된 결과를 반환합니다.

Ollama 모델 provider와 달리, 이 설정은 기본적으로 API 키가 필요하지 않습니다.
대신 다음이 필요합니다.

- OpenClaw에서 접근할 수 있는 Ollama 호스트
- `ollama signin`

## 설정

<Steps>
  <Step title="Ollama 시작">
    Ollama가 설치되어 있고 실행 중인지 확인하세요.
  </Step>
  <Step title="로그인">
    다음을 실행하세요.

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search 선택">
    다음을 실행하세요.

    ```bash
    openclaw configure --section web
    ```

    그런 다음 provider로 **Ollama Web Search**를 선택하세요.

  </Step>
</Steps>

이미 모델용으로 Ollama를 사용 중이라면, Ollama Web Search는 같은
구성된 호스트를 재사용합니다.

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

선택적 Ollama 호스트 재정의:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

명시적인 Ollama base URL이 설정되지 않았으면 OpenClaw는 `http://127.0.0.1:11434`를 사용합니다.

Ollama 호스트가 bearer auth를 기대하는 경우, OpenClaw는 웹 검색 요청에도
`models.providers.ollama.apiKey`(또는 일치하는 env 기반 provider auth)를 재사용합니다.

## 참고

- 이 provider에는 웹 검색 전용 API 키 필드가 필요하지 않습니다.
- Ollama 호스트가 인증으로 보호되어 있으면, OpenClaw는 사용 가능한 경우 일반 Ollama
  provider API 키를 재사용합니다.
- OpenClaw는 설정 중 Ollama에 접근할 수 없거나 로그인되지 않았을 때 경고를 표시하지만,
  선택을 막지는 않습니다.
- 런타임 자동 감지는 우선순위가 더 높은
  자격 증명 기반 provider가 구성되어 있지 않으면 Ollama Web Search로 폴백할 수 있습니다.
- 이 provider는 Ollama의 실험적 `/api/experimental/web_search`
  엔드포인트를 사용합니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider 및 자동 감지
- [Ollama](/ko/providers/ollama) -- Ollama 모델 설정 및 cloud/local 모드
