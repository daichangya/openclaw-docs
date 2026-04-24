---
read_when:
    - web_search에 MiniMax를 사용하고 싶습니다
    - MiniMax Coding Plan 키가 필요합니다
    - MiniMax CN/global 검색 호스트 안내가 필요합니다
summary: Coding Plan 검색 API를 통한 MiniMax Search
title: MiniMax 검색
x-i18n:
    generated_at: "2026-04-24T06:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw는 MiniMax Coding Plan 검색 API를 통해 MiniMax를 `web_search` provider로 지원합니다. 구조화된 검색 결과(제목, URL,
스니펫, 관련 쿼리)를 반환합니다.

## Coding Plan 키 받기

<Steps>
  <Step title="키 만들기">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)에서
    MiniMax Coding Plan 키를 만들거나 복사하세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`를 설정하거나, 다음을 통해 구성하세요:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw는 env 별칭으로 `MINIMAX_CODING_API_KEY`도 허용합니다. `MINIMAX_API_KEY`도
이미 coding-plan 토큰을 가리키는 경우 호환성 폴백으로 계속 읽습니다.

## 구성

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MINIMAX_CODE_PLAN_KEY가 설정되어 있으면 선택 사항
            region: "global", // 또는 "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**환경 변수 대안:** Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`를 설정하세요.
Gateway 설치에서는 `~/.openclaw/.env`에 넣으세요.

## 리전 선택

MiniMax Search는 다음 엔드포인트를 사용합니다:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region`이 설정되지 않으면, OpenClaw는
다음 순서로 리전을 확인합니다:

1. `tools.web.search.minimax.region` / Plugin 소유 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

즉, CN 온보딩 또는 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
를 사용하면 MiniMax Search도 자동으로 CN 호스트를 유지합니다.

OAuth `minimax-portal` 경로로 MiniMax를 인증한 경우에도,
웹 검색은 여전히 provider id `minimax`로 등록됩니다. OAuth provider base URL은
CN/global 호스트 선택을 위한 리전 힌트로만 사용됩니다.

## 지원되는 매개변수

MiniMax Search는 다음을 지원합니다:

- `query`
- `count` (OpenClaw는 반환된 결과 목록을 요청한 count에 맞게 잘라냄)

provider별 필터는 현재 지원되지 않습니다.

## 관련

- [웹 검색 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [MiniMax](/ko/providers/minimax) -- 모델, 이미지, 음성, 인증 설정
