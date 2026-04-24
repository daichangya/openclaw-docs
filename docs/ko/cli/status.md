---
read_when:
    - 채널 상태와 최근 세션 수신자에 대한 빠른 진단을 원합니다.
    - 디버깅을 위한 붙여넣기 가능한 “all” 상태를 원합니다.
summary: '`openclaw status`에 대한 CLI 참조(진단, 프로브, 사용량 스냅샷)'
title: 상태
x-i18n:
    generated_at: "2026-04-24T06:09:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

채널 + 세션 진단.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`는 라이브 프로브를 실행합니다(WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`는 정규화된 제공자 사용량 창을 `X% left` 형식으로 출력합니다.
- 세션 상태 출력은 이제 `Runtime:`과 `Runner:`를 구분합니다. `Runtime`은 실행 경로와 샌드박스 상태(`direct`, `docker/*`)를 의미하고, `Runner`는 세션이 임베디드 Pi, CLI 기반 제공자, 또는 `codex (acp/acpx)` 같은 ACP 하니스 백엔드를 사용하는지 알려줍니다.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량을 의미하므로, OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 그것이 우선합니다. `model_remains` 응답은 chat-model 항목을 우선 사용하고, 필요할 때 타임스탬프에서 창 레이블을 파생하며, 요금제 레이블에 모델 이름을 포함합니다.
- 현재 세션 스냅샷이 희소한 경우 `/status`는 가장 최근 대화 기록 사용량 로그에서 token 및 캐시 카운터를 보충할 수 있습니다. 기존의 0이 아닌 라이브 값은 여전히 대화 기록 대체값보다 우선합니다.
- 대화 기록 대체값은 라이브 세션 항목에 활성 런타임 모델 레이블이 없을 때 이를 복구할 수도 있습니다. 해당 대화 기록 모델이 선택된 모델과 다르면, status는 선택된 모델 대신 복구된 런타임 모델을 기준으로 컨텍스트 창을 확인합니다.
- 프롬프트 크기 계산에서는 세션 메타데이터가 없거나 더 작을 때 대화 기록 대체값이 더 큰 프롬프트 지향 총합을 우선 사용하므로, 커스텀 제공자 세션이 `0` token 표시로 축소되지 않습니다.
- 여러 에이전트가 구성된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
- 개요에는 사용 가능한 경우 Gateway + Node 호스트 서비스 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널 + git SHA가 포함됩니다(소스 체크아웃의 경우).
- 업데이트 정보는 개요에 표시되며, 업데이트가 있으면 status는 `openclaw update` 실행 힌트를 출력합니다([업데이트](/ko/install/updating) 참조).
- 읽기 전용 상태 표면(`status`, `status --json`, `status --all`)은 가능하면 대상 config 경로에 대해 지원되는 SecretRef를 확인합니다.
- 지원되는 채널 SecretRef가 구성되어 있지만 현재 명령 경로에서 사용할 수 없으면 status는 읽기 전용을 유지하며 충돌하는 대신 저하된 출력을 보고합니다. 사람이 읽는 출력에는 “configured token unavailable in this command path” 같은 경고가 표시되고, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
- 명령 로컬 SecretRef 확인에 성공하면 status는 확인된 스냅샷을 우선 사용하고 최종 출력에서 일시적인 “secret unavailable” 채널 마커를 제거합니다.
- `status --all`에는 Secrets 개요 행과, 보고서 생성을 멈추지 않으면서 비밀 정보 진단을 요약하는 진단 섹션(가독성을 위해 잘림)이 포함됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/gateway/doctor)
