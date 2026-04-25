---
read_when:
    - 초보자 친화적인 로깅 개요가 필요합니다
    - 로그 수준 또는 형식을 구성하려고 합니다
    - 문제를 해결 중이며 로그를 빠르게 찾아야 합니다
summary: '로깅 개요: 파일 로그, 콘솔 출력, CLI tailing, 그리고 Control UI'
title: 로깅 개요
x-i18n:
    generated_at: "2026-04-25T12:27:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# 로깅

OpenClaw에는 두 가지 주요 로그 표면이 있습니다.

- Gateway가 기록하는 **파일 로그**(JSON lines)
- 터미널과 Gateway Debug UI에 표시되는 **콘솔 출력**

Control UI의 **Logs** 탭은 gateway 파일 로그를 tail합니다. 이 페이지에서는
로그가 저장되는 위치, 읽는 방법, 로그 수준과 형식을 구성하는 방법을 설명합니다.

## 로그 위치

기본적으로 Gateway는 다음 위치 아래에 순환 로그 파일을 기록합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 gateway 호스트의 로컬 시간대를 사용합니다.

이 값은 `~/.openclaw/openclaw.json`에서 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그 읽는 방법

### CLI: 실시간 tail(권장)

CLI를 사용해 RPC를 통해 gateway 로그 파일을 tail할 수 있습니다.

```bash
openclaw logs --follow
```

현재 유용한 옵션:

- `--local-time`: 타임스탬프를 로컬 시간대로 렌더링
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 표준 Gateway RPC 플래그
- `--expect-final`: 에이전트 기반 RPC 최종 응답 대기 플래그(공유 클라이언트 계층을 통해 여기서도 허용됨)

출력 모드:

- **TTY 세션**: 보기 좋고, 색상이 적용되며, 구조화된 로그 줄
- **비 TTY 세션**: 일반 텍스트
- `--json`: 줄 구분 JSON(한 줄당 하나의 로그 이벤트)
- `--plain`: TTY 세션에서 일반 텍스트 강제
- `--no-color`: ANSI 색상 비활성화

명시적인 `--url`을 전달하면 CLI는 구성이나 환경 자격 증명을 자동 적용하지
않습니다. 대상 Gateway에 인증이 필요하면 `--token`도 직접 포함하세요.

JSON 모드에서 CLI는 `type` 태그가 있는 객체를 출력합니다.

- `meta`: 스트림 메타데이터(파일, 커서, 크기)
- `log`: 파싱된 로그 항목
- `notice`: 잘림 / 순환 힌트
- `raw`: 파싱되지 않은 로그 줄

local loopback Gateway가 페어링을 요청하면 `openclaw logs`는 자동으로 구성된
로컬 로그 파일로 대체됩니다. 명시적 `--url` 대상은 이 대체 경로를 사용하지 않습니다.

Gateway에 연결할 수 없으면 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다.

```bash
openclaw doctor
```

### Control UI(웹)

Control UI의 **Logs** 탭은 `logs.tail`을 사용해 같은 파일을 tail합니다.
여는 방법은 [/web/control-ui](/ko/web/control-ui)를 참조하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)을 필터링하려면 다음을 사용하세요.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 형식

### 파일 로그(JSONL)

로그 파일의 각 줄은 JSON 객체입니다. CLI와 Control UI는 이러한 항목을 파싱해
구조화된 출력(시간, 수준, 하위 시스템, 메시지)을 렌더링합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식형**이며 가독성을 위해 형식화됩니다.

- 하위 시스템 접두사(예: `gateway/channels/whatsapp`)
- 수준 색상 표시(info/warn/error)
- 선택적 compact 또는 JSON 모드

콘솔 형식은 `logging.consoleStyle`로 제어됩니다.

### Gateway WebSocket 로그

`openclaw gateway`에는 RPC 트래픽용 WebSocket 프로토콜 로깅도 있습니다.

- 일반 모드: 중요한 결과만 표시(오류, 파싱 오류, 느린 호출)
- `--verbose`: 모든 요청/응답 트래픽
- `--ws-log auto|compact|full`: 자세한 렌더링 스타일 선택
- `--compact`: `--ws-log compact`의 별칭

예시:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 로깅 구성

모든 로깅 구성은 `~/.openclaw/openclaw.json`의 `logging` 아래에 있습니다.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 로그 수준

- `logging.level`: **파일 로그**(JSONL) 수준
- `logging.consoleLevel`: **콘솔** 상세도 수준

두 값 모두 **`OPENCLAW_LOG_LEVEL`** 환경 변수(예: `OPENCLAW_LOG_LEVEL=debug`)로 재정의할 수 있습니다. 이 env 변수는 구성 파일보다 우선하므로 `openclaw.json`을 편집하지 않고도 단일 실행의 상세도를 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)를 전달해 해당 명령에 대해 환경 변수보다 우선하도록 할 수도 있습니다.

`--verbose`는 콘솔 출력과 WS 로그 상세도에만 영향을 주며 파일 로그 수준은 변경하지 않습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 사람이 읽기 쉽고, 색상이 적용되며, 타임스탬프 포함
- `compact`: 더 촘촘한 출력(긴 세션에 가장 적합)
- `json`: 줄마다 JSON(로그 프로세서용)

### 마스킹

도구 요약은 콘솔에 도달하기 전에 민감한 토큰을 마스킹할 수 있습니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 기본 집합을 재정의하는 정규식 문자열 목록

마스킹은 **콘솔 출력에만** 영향을 주며 파일 로그는 변경하지 않습니다.

## Diagnostics + OpenTelemetry

Diagnostics는 모델 실행 **및** 메시지 흐름 텔레메트리(Webhooks, 큐잉, 세션 상태)를 위한 구조화된 기계 판독 가능 이벤트입니다. Diagnostics는 로그를 대체하지 않으며, 메트릭, 추적 및 기타 익스포터에 데이터를 공급하기 위해 존재합니다.

Diagnostics 이벤트는 프로세스 내부에서 발생하지만, diagnostics + 익스포터 Plugin이 활성화된 경우에만 익스포터가 연결됩니다.

### OpenTelemetry 대 OTLP

- **OpenTelemetry(OTel)**: 추적, 메트릭, 로그를 위한 데이터 모델 + SDK
- **OTLP**: OTel 데이터를 수집기/백엔드로 내보내는 데 사용되는 wire protocol
- OpenClaw는 현재 **OTLP/HTTP (protobuf)**를 통해 내보냅니다.

### 내보내는 시그널

- **메트릭**: 카운터 + 히스토그램(토큰 사용량, 메시지 흐름, 큐잉)
- **추적**: 모델 사용 + Webhook/메시지 처리용 span
- **로그**: `diagnostics.otel.logs`가 활성화되면 OTLP를 통해 내보냄. 로그
  볼륨이 클 수 있으므로 `logging.level`과 익스포터 필터를 염두에 두세요.

### Diagnostic 이벤트 카탈로그

모델 사용량:

- `model.usage`: 토큰, 비용, 지속 시간, 컨텍스트, provider/model/channel, 세션 ID

메시지 흐름:

- `webhook.received`: 채널별 Webhook 유입
- `webhook.processed`: 처리된 Webhook + 지속 시간
- `webhook.error`: Webhook 핸들러 오류
- `message.queued`: 처리 대기열에 들어간 메시지
- `message.processed`: 결과 + 지속 시간 + 선택적 오류
- `message.delivery.started`: 아웃바운드 전달 시도 시작
- `message.delivery.completed`: 아웃바운드 전달 시도 완료 + 지속 시간/결과 수
- `message.delivery.error`: 아웃바운드 전달 시도 실패 + 지속 시간/제한된 오류 범주

큐 + 세션:

- `queue.lane.enqueue`: 명령 큐 lane enqueue + 깊이
- `queue.lane.dequeue`: 명령 큐 lane dequeue + 대기 시간
- `session.state`: 세션 상태 전이 + 이유
- `session.stuck`: 세션 정체 경고 + 경과 시간
- `run.attempt`: 실행 재시도/시도 메타데이터
- `diagnostic.heartbeat`: 집계 카운터(Webhooks/큐/세션)

Exec:

- `exec.process.completed`: 터미널 exec 프로세스 결과, 지속 시간, 대상, 모드,
  종료 코드, 실패 종류. 명령 텍스트와 작업 디렉터리는 포함되지 않습니다.

### diagnostics 활성화(익스포터 없음)

Diagnostics 이벤트를 Plugins 또는 사용자 지정 싱크에서 사용할 수 있게 하려면 다음을 사용하세요.

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnostics 플래그(대상 지정 로그)

`logging.level`을 높이지 않고도 플래그를 사용해 추가적인 대상 지정 디버그 로그를 켤 수 있습니다.
플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는 `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

env 재정의(일회성):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

참고:

- 플래그 로그는 표준 로그 파일(`logging.file`과 동일)로 기록됩니다.
- 출력은 여전히 `logging.redactSensitive`에 따라 마스킹됩니다.
- 전체 가이드는 [/diagnostics/flags](/ko/diagnostics/flags)를 참조하세요.

### OpenTelemetry로 내보내기

Diagnostics는 `diagnostics-otel` Plugin(OTLP/HTTP)을 통해 내보낼 수 있습니다. 이 방식은 OTLP/HTTP를 허용하는 모든 OpenTelemetry 수집기/백엔드와 함께 동작합니다.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

참고:

- `openclaw plugins enable diagnostics-otel`로 Plugin을 활성화할 수도 있습니다.
- 현재 `protocol`은 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
- 메트릭에는 토큰 사용량, 비용, 컨텍스트 크기, 실행 지속 시간, 메시지 흐름
  카운터/히스토그램(Webhooks, 큐잉, 세션 상태, 큐 깊이/대기 시간)이 포함됩니다.
- 추적/메트릭은 `traces` / `metrics`로 전환할 수 있습니다(기본값: 켜짐). 추적에는
  활성화된 경우 모델 사용 span과 Webhook/메시지 처리 span이 포함됩니다.
- 원시 모델/도구 콘텐츠는 기본적으로 내보내지 않습니다.
  `diagnostics.otel.captureContent`는 수집기와 보존 정책이 프롬프트,
  응답, 도구 또는 시스템 프롬프트 텍스트에 대해 승인된 경우에만 사용하세요.
- 수집기에 인증이 필요하면 `headers`를 설정하세요.
- 지원되는 환경 변수: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`
- 다른 preload 또는 호스트 프로세스가 이미 전역 OpenTelemetry SDK를 등록한 경우
  `OPENCLAW_OTEL_PRELOADED=1`을 설정하세요. 이 모드에서 Plugin은 자체 SDK를 시작하거나
  종료하지 않지만 OpenClaw diagnostics 리스너는 계속 연결하고
  `diagnostics.otel.traces`, `metrics`, `logs`를 따릅니다.

### 내보낸 메트릭(이름 + 타입)

모델 사용량:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

메시지 흐름:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

큐 + 세션:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` 또는
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 내보낸 span(이름 + 주요 속성)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

콘텐츠 캡처가 명시적으로 활성화되면, 모델/도구 span에는 선택한 특정 콘텐츠
클래스에 대해 제한되고 마스킹된 `openclaw.content.*` 속성이 포함될 수도 있습니다.

### 샘플링 + flush

- 추적 샘플링: `diagnostics.otel.sampleRate` (0.0–1.0, 루트 span만).
- 메트릭 내보내기 간격: `diagnostics.otel.flushIntervalMs` (최소 1000ms).

### 프로토콜 참고

- OTLP/HTTP 엔드포인트는 `diagnostics.otel.endpoint` 또는
  `OTEL_EXPORTER_OTLP_ENDPOINT`로 설정할 수 있습니다.
- 엔드포인트에 이미 `/v1/traces` 또는 `/v1/metrics`가 포함되어 있으면 그대로 사용합니다.
- 엔드포인트에 이미 `/v1/logs`가 포함되어 있으면 로그에도 그대로 사용합니다.
- `OPENCLAW_OTEL_PRELOADED=1`은 Plugin 소유 NodeSDK를 시작하는 대신
  외부에서 등록된 OpenTelemetry SDK를 추적/메트릭에 재사용합니다.
- `diagnostics.otel.logs`는 기본 로거 출력에 대한 OTLP 로그 내보내기를 활성화합니다.

### 로그 내보내기 동작

- OTLP 로그는 `logging.file`에 기록되는 것과 동일한 구조화 레코드를 사용합니다.
- `logging.level`(파일 로그 수준)을 따릅니다. 콘솔 마스킹은 OTLP 로그에 **적용되지 않습니다**.
- 로그 양이 많은 설치 환경에서는 OTLP 수집기의 샘플링/필터링을 우선 사용하는 것이 좋습니다.

## 문제 해결 팁

- **Gateway에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** Gateway가 실행 중이며 `logging.file`의 파일 경로에 기록하고 있는지 확인하세요.
- **더 자세한 정보가 필요하나요?** `logging.level`을 `debug` 또는 `trace`로 설정하고 다시 시도하세요.

## 관련 항목

- [Gateway Logging Internals](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사, 콘솔 캡처
- [Diagnostics](/ko/gateway/configuration-reference#diagnostics) — OpenTelemetry 내보내기 및 캐시 추적 구성
