---
read_when:
    - 스크립트나 명령줄에서 에이전트 실행을 트리거하고 싶습니다
    - 에이전트 응답을 채팅 채널에 프로그래밍 방식으로 전달해야 합니다
summary: CLI에서 에이전트 턴을 실행하고 선택적으로 응답을 채널에 전달하기
title: 에이전트 전송
x-i18n:
    generated_at: "2026-04-24T06:37:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent`는 인바운드 채팅 메시지 없이도 명령줄에서 단일 에이전트 턴을 실행합니다. 스크립트 워크플로, 테스트, 프로그래밍 방식 전달에 사용하세요.

## 빠른 시작

<Steps>
  <Step title="간단한 에이전트 턴 실행">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    이 명령은 Gateway를 통해 메시지를 보내고 응답을 출력합니다.

  </Step>

  <Step title="특정 에이전트 또는 세션 대상으로 실행">
    ```bash
    # 특정 에이전트 대상으로 실행
    openclaw agent --agent ops --message "Summarize logs"

    # 전화번호 대상으로 실행(세션 키 파생)
    openclaw agent --to +15555550123 --message "Status update"

    # 기존 세션 재사용
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="응답을 채널에 전달">
    ```bash
    # WhatsApp으로 전달(기본 채널)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack으로 전달
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 플래그

| 플래그                        | 설명                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | 보낼 메시지(필수)                                            |
| `--to \<dest\>`               | 대상(전화번호, 채팅 ID)에서 세션 키 파생                    |
| `--agent \<id\>`              | 구성된 에이전트를 대상으로 함(해당 `main` 세션 사용)        |
| `--session-id \<id\>`         | ID로 기존 세션 재사용                                        |
| `--local`                     | 로컬 내장 런타임 강제(Gateway 건너뜀)                        |
| `--deliver`                   | 응답을 채팅 채널로 전송                                      |
| `--channel \<name\>`          | 전달 채널(whatsapp, telegram, discord, slack 등)            |
| `--reply-to \<target\>`       | 전달 대상 재정의                                             |
| `--reply-channel \<name\>`    | 전달 채널 재정의                                             |
| `--reply-account \<id\>`      | 전달 계정 ID 재정의                                          |
| `--thinking \<level\>`        | 선택한 모델 profile의 사고 수준 설정                         |
| `--verbose \<on\|full\|off\>` | 상세 수준 설정                                               |
| `--timeout \<seconds\>`       | 에이전트 타임아웃 재정의                                     |
| `--json`                      | 구조화된 JSON 출력                                           |

## 동작

- 기본적으로 CLI는 **Gateway를 통해** 실행됩니다. 현재 머신에서 내장 런타임을 강제하려면 `--local`을 추가하세요.
- Gateway에 연결할 수 없으면 CLI는 **로컬 내장 실행으로 폴백**합니다.
- 세션 선택: `--to`는 세션 키를 파생합니다(그룹/채널 대상은 격리를 유지하고, 직접 채팅은 `main`으로 합쳐짐).
- 사고 및 상세 플래그는 세션 저장소에 영구 반영됩니다.
- 출력: 기본적으로 일반 텍스트이며, 구조화된 페이로드 + 메타데이터가 필요하면 `--json`을 사용하세요.

## 예제

```bash
# JSON 출력이 포함된 간단한 턴
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# 사고 수준을 포함한 턴
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# 세션과 다른 채널로 전달
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 관련 항목

- [Agent CLI 참조](/ko/cli/agent)
- [하위 에이전트](/ko/tools/subagents) — 백그라운드 하위 에이전트 생성
- [세션](/ko/concepts/session) — 세션 키가 작동하는 방식
