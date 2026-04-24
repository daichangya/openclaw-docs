---
read_when:
    - OpenClaw에서 Tencent Hy3 프리뷰를 사용하려고 합니다
    - TokenHub API 키 설정이 필요합니다
summary: Hy3 프리뷰용 Tencent Cloud TokenHub 설정
title: Tencent Cloud(TokenHub)
x-i18n:
    generated_at: "2026-04-24T06:32:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud는 OpenClaw에 **번들 provider Plugin**으로 포함되어 있습니다. TokenHub 엔드포인트(`tencent-tokenhub`)를 통해 Tencent Hy3 프리뷰에 접근할 수 있습니다.

이 provider는 OpenAI 호환 API를 사용합니다.

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Default model | `tencent-tokenhub/hy3-preview`             |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | OpenAI 호환 chat completions               |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Global URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## 빠른 시작

<Steps>
  <Step title="TokenHub API 키 생성">
    Tencent Cloud TokenHub에서 API 키를 생성하세요. 키에 제한된 접근 범위를 선택하는 경우 허용 모델에 **Hy3 preview**를 포함해야 합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="모델 확인">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 내장 카탈로그

| Model ref                      | Name                   | Input | Context | Max output | Notes                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | 기본값; reasoning 활성화   |

Hy3 preview는 reasoning, 장문 컨텍스트 지시 따르기, 코드, 에이전트 워크플로를 위한 Tencent Hunyuan의 대형 MoE 언어 모델입니다. Tencent의 OpenAI 호환 예시는 `hy3-preview`를 모델 id로 사용하며 표준 chat-completions 도구 호출과 `reasoning_effort`를 지원합니다.

<Tip>
모델 id는 `hy3-preview`입니다. 이를 Tencent의 `HY-3D-*` 모델과 혼동하지 마세요. 후자는 3D 생성 API이며, 이 provider에서 구성하는 OpenClaw 채팅 모델이 아닙니다.
</Tip>

## 엔드포인트 재정의

OpenClaw는 기본적으로 Tencent Cloud의 `https://tokenhub.tencentmaas.com/v1` 엔드포인트를 사용합니다. Tencent는 국제 TokenHub 엔드포인트도 문서화하고 있습니다.

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

TokenHub 계정이나 지역에서 요구하는 경우에만 엔드포인트를 재정의하세요.

## 참고

- TokenHub 모델 ref는 `tencent-tokenhub/<modelId>` 형식을 사용합니다.
- 번들 카탈로그에는 현재 `hy3-preview`가 포함되어 있습니다.
- Plugin은 Hy3 preview를 reasoning 지원 및 streaming-usage 지원 모델로 표시합니다.
- Plugin에는 계층형 Hy3 가격 메타데이터가 포함되어 있어 수동 가격 재정의 없이도 비용 추정이 채워집니다.
- 가격, 컨텍스트, 엔드포인트 메타데이터는 필요할 때만 `models.providers`에서 재정의하세요.

## 환경 참고

Gateway가 데몬(launchd/systemd)으로 실행되는 경우, 해당 프로세스에서
`TOKENHUB_API_KEY`를 사용할 수 있어야 합니다(예:
`~/.openclaw/.env` 또는 `env.shellEnv`).

## 관련 문서

- [OpenClaw 구성](/ko/gateway/configuration)
- [모델 provider](/ko/concepts/model-providers)
- [Tencent TokenHub 제품 페이지](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub 텍스트 생성](https://cloud.tencent.com/document/product/1823/130079)
- [Hy3 preview용 Tencent TokenHub Cline 설정](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview 모델 카드](https://huggingface.co/tencent/Hy3-preview)
