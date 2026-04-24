---
read_when:
    - 모델 provider로 GitHub Copilot을 사용하려는 경우
    - '`openclaw models auth login-github-copilot` 흐름이 필요한 경우'
summary: 기기 흐름을 사용해 OpenClaw에서 GitHub Copilot에 로그인하기
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T06:30:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot은 GitHub의 AI 코딩 비서입니다. GitHub 계정과 요금제에 맞는 Copilot
모델에 접근할 수 있게 해줍니다. OpenClaw는 Copilot을 모델
provider로 두 가지 방식으로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 두 가지 방법

<Tabs>
  <Tab title="내장 provider (github-copilot)">
    네이티브 기기 로그인 흐름을 사용해 GitHub 토큰을 얻은 뒤, OpenClaw가 실행될 때 이를
    Copilot API 토큰으로 교환합니다. 이것이 **기본값**이자 가장 단순한 경로이며,
    VS Code가 필요하지 않습니다.

    <Steps>
      <Step title="로그인 명령 실행">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL에 방문해 일회용 코드를 입력하라는 프롬프트가 표시됩니다. 완료될 때까지
        터미널을 열어 두세요.
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        또는 설정에서:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code extension을 로컬 브리지로 사용합니다. OpenClaw는
    프록시의 `/v1` 엔드포인트와 통신하며, 거기에서 구성한 모델 목록을 사용합니다.

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행하고 있거나 이를 통해 라우팅해야 할 때 이 방식을 선택하세요.
    Plugin을 활성화하고 VS Code extension이 계속 실행 중이어야 합니다.
    </Note>

  </Tab>
</Tabs>

## 선택적 플래그

| 플래그 | 설명 |
| --------------- | --------------------------------------------------- |
| `--yes` | 확인 프롬프트 건너뛰기 |
| `--set-default` | provider의 권장 기본 모델도 함께 적용 |

```bash
# 확인 건너뛰기
openclaw models auth login-github-copilot --yes

# 로그인과 기본 모델 설정을 한 번에 수행
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="대화형 TTY 필요">
    기기 로그인 흐름에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI 파이프라인이 아니라
    터미널에서 직접 실행하세요.
  </Accordion>

  <Accordion title="모델 사용 가능 여부는 요금제에 따라 달라집니다">
    Copilot 모델 사용 가능 여부는 GitHub 요금제에 따라 달라집니다. 모델이
    거부되면 다른 ID를 시도하세요(예: `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="전송 방식 선택">
    Claude 모델 ID는 자동으로 Anthropic Messages 전송 방식을 사용합니다. GPT,
    o-series, Gemini 모델은 OpenAI Responses 전송 방식을 유지합니다. OpenClaw는
    모델 ref를 기준으로 올바른 전송 방식을 선택합니다.
  </Accordion>

  <Accordion title="환경 변수 확인 순서">
    OpenClaw는 다음 우선순위로 환경 변수에서 Copilot 인증을 확인합니다.

    | 우선순위 | 변수 | 참고 |
    | -------- | --------------------- | -------------------------------- |
    | 1 | `COPILOT_GITHUB_TOKEN` | 가장 높은 우선순위, Copilot 전용 |
    | 2 | `GH_TOKEN` | GitHub CLI 토큰(대체값) |
    | 3 | `GITHUB_TOKEN` | 표준 GitHub 토큰(가장 낮음) |

    여러 변수가 설정되어 있으면 OpenClaw는 가장 우선순위가 높은 값을 사용합니다.
    기기 로그인 흐름(`openclaw models auth login-github-copilot`)은
    토큰을 auth profile 저장소에 저장하며, 모든 환경
    변수보다 우선합니다.

  </Accordion>

  <Accordion title="토큰 저장">
    로그인은 GitHub 토큰을 auth profile 저장소에 저장하고, OpenClaw가 실행될 때
    이를 Copilot API 토큰으로 교환합니다. 사용자가 직접 토큰을
    관리할 필요는 없습니다.
  </Accordion>
</AccordionGroup>

<Warning>
대화형 TTY가 필요합니다. 로그인 명령은 헤드리스 스크립트나 CI 작업 내부가 아니라
터미널에서 직접 실행하세요.
</Warning>

## 메모리 검색 임베딩

GitHub Copilot은
[메모리 검색](/ko/concepts/memory-search)의 임베딩 provider로도 사용할 수 있습니다. Copilot 구독이 있고
로그인한 상태라면, OpenClaw는 별도의 API 키 없이도 임베딩에 이를 사용할 수 있습니다.

### 자동 감지

`memorySearch.provider`가 `"auto"`(기본값)일 때 GitHub Copilot은
우선순위 15에서 시도됩니다. 로컬 임베딩 뒤, OpenAI 및 다른 유료
provider 앞입니다. GitHub 토큰이 있으면 OpenClaw는 사용 가능한
임베딩 모델을 Copilot API에서 찾아 자동으로 가장 적절한 모델을 선택합니다.

### 명시적 설정

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 동작 방식

1. OpenClaw가 GitHub 토큰을 확인합니다(환경 변수 또는 auth profile에서).
2. 이를 짧은 수명의 Copilot API 토큰으로 교환합니다.
3. Copilot `/models` 엔드포인트를 조회해 사용 가능한 임베딩 모델을 찾습니다.
4. 가장 적절한 모델을 선택합니다(`text-embedding-3-small` 선호).
5. Copilot `/embeddings` 엔드포인트로 임베딩 요청을 보냅니다.

모델 사용 가능 여부는 GitHub 요금제에 따라 달라집니다. 임베딩 모델을
사용할 수 없으면 OpenClaw는 Copilot을 건너뛰고 다음 provider를 시도합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, 장애 조치 동작 선택하기.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항 및 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
