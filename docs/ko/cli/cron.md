---
read_when:
    - 예약된 작업과 웨이크업이 필요합니다
    - Cron 실행과 로그를 디버깅하고 있습니다
summary: '`openclaw cron`용 CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-04-24T06:07:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

관련:

- Cron 작업: [Cron 작업](/ko/automation/cron-jobs)

팁: 전체 명령 표면은 `openclaw cron --help`를 실행해 확인하세요.

참고: `openclaw cron list`와 `openclaw cron show <job-id>`는 확인된 전달 경로를 미리 보여줍니다. `channel: "last"`의 경우, 미리보기는 해당 경로가 main/current 세션에서 확인되었는지 또는 fail closed될지를 보여줍니다.

참고: 격리된 `cron add` 작업은 기본적으로 `--announce` 전달을 사용합니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 여전히 `--announce`의 더 이상 권장되지 않는 별칭으로 남아 있습니다.

참고: 격리된 cron 채팅 전달은 공유됩니다. `--announce`는 최종 응답에 대한 러너 폴백 전달이며, `--no-deliver`는 해당 폴백을 비활성화하지만 채팅 경로가 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

참고: 원샷(`--at`) 작업은 기본적으로 성공 후 삭제됩니다. 유지하려면 `--keep-after-run`을 사용하세요.

참고: `--session`은 `main`, `isolated`, `current`, `session:<id>`를 지원합니다.
생성 시점의 활성 세션에 바인딩하려면 `current`를, 명시적인 영구 세션 키에는 `session:<id>`를 사용하세요.

참고: 원샷 CLI 작업의 경우 오프셋이 없는 `--at` 날짜/시간은 `--tz <iana>`를 함께 전달하지 않으면 UTC로 처리됩니다. `--tz <iana>`를 함께 전달하면 해당 로컬 벽시계 시간이 주어진 시간대에서 해석됩니다.

참고: 반복 작업은 이제 연속 오류 후 지수 재시도 백오프(30초 → 1분 → 5분 → 15분 → 60분)를 사용하며, 다음 성공 실행 후에는 일반 스케줄로 돌아갑니다.

참고: `openclaw cron run`은 이제 수동 실행이 실행 대기열에 들어가자마자 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함되며, 최종 결과는 `openclaw cron runs --id <job-id>`로 추적하세요.

참고: `openclaw cron run <job-id>`는 기본적으로 강제 실행합니다. 이전의 "기한이 된 경우에만 실행" 동작을 유지하려면 `--due`를 사용하세요.

참고: 격리된 cron 턴은 오래된 승인 전용 응답을 억제합니다. 첫 결과가 단지 중간 상태 업데이트일 뿐이고 최종 응답에 책임지는 하위 에이전트 실행이 없다면, cron은 전달 전에 실제 결과를 위해 한 번 더 재프롬프트합니다.

참고: 격리된 cron 실행이 silent token(`NO_REPLY` / `no_reply`)만 반환하면, cron은 직접 발신 전달과 폴백 대기 요약 경로도 모두 억제하므로 채팅으로 아무것도 게시되지 않습니다.

참고: `cron add|edit --model ...`은 해당 작업에 선택된 허용 모델을 사용합니다.
모델이 허용되지 않으면 cron은 경고를 내고 대신 작업의 에이전트/기본 모델 선택으로 폴백합니다. 구성된 폴백 체인은 계속 적용되지만, 명시적인 작업별 폴백 목록이 없는 단순 모델 재정의는 더 이상 에이전트 primary를 숨겨진 추가 재시도 대상으로 덧붙이지 않습니다.

참고: 격리된 cron 모델 우선순위는 Gmail-hook 재정의가 먼저이고, 그다음 작업별 `--model`, 그다음 저장된 cron 세션 모델 재정의, 마지막으로 일반 에이전트/기본 선택 순서입니다.

참고: 격리된 cron fast mode는 확인된 라이브 모델 선택을 따릅니다. 모델 구성 `params.fastMode`가 기본적으로 적용되지만, 저장된 세션 `fastMode` 재정의는 여전히 구성보다 우선합니다.

참고: 격리된 실행이 `LiveSessionModelSwitchError`를 던지면, cron은 재시도 전에 전환된 provider/model(그리고 존재할 경우 전환된 auth profile 재정의)을 유지합니다. 바깥 재시도 루프는 초기 시도 후 2번의 전환 재시도로 제한되며, 그 후에는 무한 루프 대신 중단합니다.

참고: 실패 알림은 먼저 `delivery.failureDestination`을 사용하고, 그다음 전역 `cron.failureDestination`, 마지막으로 명시적인 실패 대상을 구성하지 않은 경우 작업의 기본 announce 대상으로 폴백합니다.

참고: 보존/정리는 구성에서 제어합니다:

- `cron.sessionRetention` (기본값 `24h`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl`을 정리합니다.

업그레이드 참고: 현재 전달/저장 형식 이전의 오래된 cron 작업이 있다면
`openclaw doctor --fix`를 실행하세요. Doctor는 이제 레거시 cron 필드(`jobId`, `schedule.cron`,
최상위 전달 필드(레거시 `threadId` 포함), payload `provider` 전달 별칭)를 정규화하고,
`cron.webhook`이 구성된 경우 단순 `notify: true` webhook 폴백 작업을 명시적 webhook 전달로 마이그레이션합니다.

## 일반적인 편집

메시지는 변경하지 않고 전달 설정만 업데이트:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리된 작업의 전달 비활성화:

```bash
openclaw cron edit <job-id> --no-deliver
```

격리된 작업에 경량 bootstrap 컨텍스트 활성화:

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널에 announce:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

경량 bootstrap 컨텍스트를 사용하는 격리 작업 생성:

```bash
openclaw cron add \
  --name "가벼운 아침 브리프" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "밤사이 업데이트를 요약해줘." \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 agent-turn 작업에만 적용됩니다. Cron 실행에서는 경량 모드가 전체 워크스페이스 bootstrap 세트를 주입하는 대신 bootstrap 컨텍스트를 비워 둡니다.

전달 소유권 참고:

- 격리된 cron 채팅 전달은 공유됩니다. 채팅 경로가 있으면 에이전트는
  `message` 도구로 직접 전송할 수 있습니다.
- `announce`는 확인된 대상에 에이전트가 직접 전송하지 않은 경우에만
  최종 응답을 폴백 전달합니다. `webhook`은 완료된 payload를 URL로 게시합니다.
  `none`은 러너 폴백 전달을 비활성화합니다.

## 일반적인 관리자 명령

수동 실행:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 항목에는 의도된 cron 대상, 확인된 대상, message-tool 전송, 폴백 사용, 전달 상태를 포함한 전달 진단 정보가 포함됩니다.

에이전트/세션 재대상 지정:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

전달 조정:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

실패 전달 참고:

- `delivery.failureDestination`은 격리된 작업에서 지원됩니다.
- main-session 작업은 기본 전달 모드가 `webhook`일 때만
  `delivery.failureDestination`을 사용할 수 있습니다.
- 실패 대상을 따로 설정하지 않았고 작업이 이미 채널에 announce하는 경우,
  실패 알림은 동일한 announce 대상을 재사용합니다.

## 관련

- [CLI 참조](/ko/cli)
- [예약된 작업](/ko/automation/cron-jobs)
