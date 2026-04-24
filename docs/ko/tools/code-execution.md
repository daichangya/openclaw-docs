---
read_when:
    - code_execution을 활성화하거나 구성하고 싶습니다
    - 로컬 셸 접근 없이 원격 분석을 원합니다
    - x_search 또는 web_search를 원격 Python 분석과 결합하고 싶습니다
summary: code_execution -- xAI로 샌드박스된 원격 Python 분석 실행
title: 코드 실행
x-i18n:
    generated_at: "2026-04-24T06:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution`은 xAI의 Responses API에서 샌드박스된 원격 Python 분석을 실행합니다.
이것은 로컬 [`exec`](/ko/tools/exec)와 다릅니다:

- `exec`는 머신이나 node에서 셸 명령을 실행합니다
- `code_execution`은 xAI의 원격 샌드박스에서 Python을 실행합니다

다음 용도로 `code_execution`을 사용하세요:

- 계산
- 표 작성
- 빠른 통계
- 차트 스타일 분석
- `x_search` 또는 `web_search`가 반환한 데이터 분석

로컬 파일, 셸, repo, 또는 페어링된
device가 필요할 때는 사용하지 마세요. 그런 경우에는 [`exec`](/ko/tools/exec)를 사용하세요.

## 설정

xAI API 키가 필요합니다. 다음 중 아무 것이나 사용할 수 있습니다:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

예시:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 사용 방법

자연스럽게 요청하되 분석 의도를 명확히 하세요:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

이 도구는 내부적으로 단일 `task` 파라미터만 받으므로, 에이전트는 전체 분석 요청과 모든 인라인 데이터를 하나의 프롬프트로 보내야 합니다.

## 제한 사항

- 이것은 원격 xAI 실행이지 로컬 프로세스 실행이 아닙니다.
- 지속적인 노트북이 아니라 일시적인 분석으로 취급해야 합니다.
- 로컬 파일이나 워크스페이스 접근을 가정하지 마세요.
- 최신 X 데이터가 필요하면 먼저 [`x_search`](/ko/tools/web#x_search)를 사용하세요.

## 관련 항목

- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)
- [apply_patch 도구](/ko/tools/apply-patch)
- [웹 도구](/ko/tools/web)
- [xAI](/ko/providers/xai)
