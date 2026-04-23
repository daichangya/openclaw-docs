---
read_when:
    - 채널 연결성 또는 gateway 상태를 진단하는 경우
    - 상태 점검 CLI 명령과 옵션을 이해하는 경우
summary: 상태 점검 명령과 gateway 상태 모니터링
title: 상태 점검
x-i18n:
    generated_at: "2026-04-23T06:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# 상태 점검 (CLI)

추측에 의존하지 않고 채널 연결성을 확인하기 위한 짧은 가이드입니다.

## 빠른 점검

- `openclaw status` — 로컬 요약: gateway 도달 가능성/모드, 업데이트 힌트, 연결된 채널 인증 경과 시간, 세션 + 최근 활동.
- `openclaw status --all` — 전체 로컬 진단(읽기 전용, 색상 포함, 디버깅을 위해 안전하게 붙여넣기 가능).
- `openclaw status --deep` — 실행 중인 gateway에 라이브 상태 probe(`health` with `probe:true`)를 요청하며, 지원되는 경우 계정별 채널 probes도 포함합니다.
- `openclaw health` — 실행 중인 gateway에 상태 스냅샷을 요청합니다(WS 전용; CLI에서 직접 채널 소켓에 연결하지 않음).
- `openclaw health --verbose` — 라이브 상태 probe를 강제로 수행하고 gateway 연결 세부 정보를 출력합니다.
- `openclaw health --json` — 기계가 읽을 수 있는 상태 스냅샷 출력.
- WhatsApp/WebChat에서 `/status`를 독립 메시지로 보내면 에이전트를 호출하지 않고 상태 응답을 받을 수 있습니다.
- 로그: `/tmp/openclaw/openclaw-*.log`를 tail하고 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`로 필터링합니다.

## 심층 진단

- 디스크의 자격 증명: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime이 최근이어야 함).
- 세션 저장소: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (경로는 config에서 재정의될 수 있음). 개수와 최근 수신자는 `status`를 통해 표시됩니다.
- 재연결 흐름: 로그에 상태 코드 409–515 또는 `loggedOut`가 나타나면 `openclaw channels logout && openclaw channels login --verbose`. (참고: QR 로그인 흐름은 페어링 후 상태 515에 대해 한 번 자동 재시작됩니다.)
- 진단은 기본적으로 활성화되어 있습니다. `diagnostics.enabled: false`가 설정되지 않은 한 gateway는 운영 관련 사실을 기록합니다. 메모리 이벤트는 RSS/힙 바이트 수, 임계값 압박, 증가 압박을 기록합니다. 과대 payload 이벤트는 가능할 경우 거부, 잘림 또는 청크 분할된 항목과 크기 및 제한을 기록합니다. 메시지 텍스트, 첨부 파일 내용, Webhook 본문, 원시 요청 또는 응답 본문, 토큰, 쿠키, 시크릿 값은 기록하지 않습니다. 동일한 Heartbeat는 제한된 안정성 기록기도 시작하며, 이는 `openclaw gateway stability` 또는 `diagnostics.stability` Gateway RPC를 통해 사용할 수 있습니다. 치명적인 Gateway 종료, 종료 타임아웃, 재시작 시 시작 실패는 이벤트가 있을 경우 최신 기록기 스냅샷을 `~/.openclaw/logs/stability/` 아래에 저장합니다. 가장 최근 저장된 번들은 `openclaw gateway stability --bundle latest`로 검사하세요.
- 버그 리포트를 위해서는 `openclaw gateway diagnostics export`를 실행하고 생성된 zip을 첨부하세요. 이 내보내기에는 Markdown 요약, 최신 안정성 번들, 정제된 로그 메타데이터, 정제된 Gateway 상태/헬스 스냅샷, config 구조가 포함됩니다. 공유를 목적으로 하며, 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, 시크릿 값은 생략되거나 마스킹됩니다.

## 상태 모니터 설정

- `gateway.channelHealthCheckMinutes`: gateway가 채널 상태를 점검하는 주기. 기본값: `5`. 전역적으로 상태 모니터 재시작을 비활성화하려면 `0`으로 설정합니다.
- `gateway.channelStaleEventThresholdMinutes`: 연결된 채널이 상태 모니터에 의해 정체 상태로 간주되어 재시작되기 전까지 유휴 상태를 유지할 수 있는 시간. 기본값: `30`. 이 값은 `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하세요.
- `gateway.channelMaxRestartsPerHour`: 채널/계정당 상태 모니터 재시작의 최근 1시간 롤링 상한. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터링은 유지하면서 특정 채널의 상태 모니터 재시작만 비활성화합니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 채널 수준 설정보다 우선하는 다중 계정 재정의.
- 이러한 채널별 재정의는 현재 이를 노출하는 내장 채널 모니터에 적용됩니다: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, WhatsApp.

## 문제가 발생했을 때

- `logged out` 또는 상태 409–515 → `openclaw channels logout` 후 `openclaw channels login`으로 다시 연결합니다.
- Gateway에 도달할 수 없음 → 시작합니다: `openclaw gateway --port 18789` (포트가 사용 중이면 `--force` 사용).
- 수신 메시지가 없음 → 연결된 휴대폰이 온라인인지, 발신자가 허용되어 있는지(`channels.whatsapp.allowFrom`) 확인하세요. 그룹 채팅의 경우 허용 목록 + 멘션 규칙이 일치하는지 확인하세요(`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## 전용 "health" 명령

`openclaw health`는 실행 중인 gateway에 상태 스냅샷을 요청합니다(CLI에서 직접 채널
소켓에 연결하지 않음). 기본적으로 새로고침된 캐시된 gateway 스냅샷을 반환할 수 있으며,
이후 gateway가 백그라운드에서 그 캐시를 새로 고칩니다. `openclaw health --verbose`는
대신 라이브 probe를 강제로 수행합니다. 이 명령은 가능할 경우 연결된 creds/auth 경과 시간,
채널별 probe 요약, 세션 저장소 요약, 그리고 probe 소요 시간을 보고합니다. gateway에 도달할 수 없거나
probe가 실패/타임아웃되면 0이 아닌 종료 코드를 반환합니다.

옵션:

- `--json`: 기계가 읽을 수 있는 JSON 출력
- `--timeout <ms>`: 기본 10초 probe 타임아웃 재정의
- `--verbose`: 라이브 probe를 강제로 수행하고 gateway 연결 세부 정보를 출력
- `--debug`: `--verbose`의 별칭

상태 스냅샷에는 다음이 포함됩니다: `ok`(boolean), `ts`(타임스탬프), `durationMs`(probe 시간), 채널별 상태, 에이전트 가용성, 세션 저장소 요약.
