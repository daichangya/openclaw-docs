---
read_when:
    - 로깅 출력 또는 형식 변경하기
    - CLI 또는 Gateway 출력 디버깅하기
summary: 로깅 표면, 파일 로그, WS 로그 스타일 및 콘솔 포맷팅
title: Gateway 로깅
x-i18n:
    generated_at: "2026-04-24T06:15:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# 로깅

사용자 대상 개요(CLI + Control UI + 구성)는 [/logging](/ko/logging)을 참조하세요.

OpenClaw에는 두 가지 로그 “표면”이 있습니다:

- **콘솔 출력**(터미널 / Debug UI에서 보이는 것)
- Gateway 로거가 기록하는 **파일 로그**(JSON Lines)

## 파일 기반 로거

- 기본 롤링 로그 파일은 `/tmp/openclaw/` 아래에 있습니다(하루당 파일 하나): `openclaw-YYYY-MM-DD.log`
  - 날짜는 Gateway 호스트의 로컬 시간대를 사용합니다.
- 로그 파일 경로와 레벨은 `~/.openclaw/openclaw.json`에서 구성할 수 있습니다:
  - `logging.file`
  - `logging.level`

파일 형식은 줄당 JSON 객체 하나입니다.

Control UI의 Logs 탭은 Gateway를 통해 이 파일을 tail합니다(`logs.tail`).
CLI도 동일하게 사용할 수 있습니다:

```bash
openclaw logs --follow
```

**상세 모드와 로그 레벨**

- **파일 로그**는 `logging.level`로만 제어됩니다.
- `--verbose`는 **콘솔 상세도**(및 WS 로그 스타일)에만 영향을 주며, 파일 로그 레벨은
  올리지 않습니다.
- 파일 로그에 verbose 전용 세부 정보를 포함하려면 `logging.level`을 `debug` 또는
  `trace`로 설정하세요.

## 콘솔 캡처

CLI는 `console.log/info/warn/error/debug/trace`를 캡처해 파일 로그에 기록하면서,
동시에 stdout/stderr로도 출력합니다.

콘솔 상세도는 다음으로 독립적으로 조정할 수 있습니다:

- `logging.consoleLevel` (기본값 `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## 도구 요약 마스킹

상세 도구 요약(예: `🛠️ Exec: ...`)은 콘솔 스트림에 들어가기 전에 민감한 토큰을 마스킹할 수 있습니다.
이 기능은 **도구 전용**이며 파일 로그는 변경하지 않습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: 정규식 문자열 배열(기본값 재정의)
  - 원시 정규식 문자열(자동 `gi`) 또는 사용자 지정 플래그가 필요하면 `/pattern/flags`를 사용하세요.
  - 일치 항목은 앞 6자 + 뒤 4자(길이 18 이상)는 유지하고 나머지는 마스킹하며, 그보다 짧으면 `***`로 처리됩니다.
  - 기본값은 일반적인 키 할당, CLI 플래그, JSON 필드, bearer 헤더, PEM 블록, 널리 쓰이는 토큰 접두사를 포괄합니다.

## Gateway WebSocket 로그

Gateway는 두 가지 모드로 WebSocket 프로토콜 로그를 출력합니다:

- **일반 모드(`--verbose` 없음)**: “흥미로운” RPC 결과만 출력:
  - 오류 (`ok=false`)
  - 느린 호출 (기본 임계값: `>= 50ms`)
  - 파싱 오류
- **상세 모드(`--verbose`)**: 모든 WS 요청/응답 트래픽을 출력합니다.

### WS 로그 스타일

`openclaw gateway`는 Gateway별 스타일 전환을 지원합니다:

- `--ws-log auto` (기본값): 일반 모드는 최적화되며, verbose 모드는 compact 출력을 사용
- `--ws-log compact`: verbose일 때 compact 출력(요청/응답 쌍)
- `--ws-log full`: verbose일 때 프레임별 전체 출력
- `--compact`: `--ws-log compact`의 별칭

예시:

```bash
# 최적화됨(오류/느린 호출만)
openclaw gateway

# 모든 WS 트래픽 표시(쌍으로)
openclaw gateway --verbose --ws-log compact

# 모든 WS 트래픽 표시(전체 메타 포함)
openclaw gateway --verbose --ws-log full
```

## 콘솔 포맷팅(서브시스템 로깅)

콘솔 포매터는 **TTY 인식형**이며 일관된 접두사가 붙은 줄을 출력합니다.
서브시스템 로거는 출력을 그룹화하고 훑어보기 쉽게 유지합니다.

동작:

- 모든 줄에 **서브시스템 접두사** 추가(예: `[gateway]`, `[canvas]`, `[tailscale]`)
- **서브시스템 색상**(서브시스템별 고정) + 레벨 색상
- **출력이 TTY이거나 환경이 풍부한 터미널처럼 보일 때 색상 사용** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` 존중
- **축약된 서브시스템 접두사**: 앞의 `gateway/` + `channels/`는 제거하고 마지막 2개 세그먼트만 유지(예: `whatsapp/outbound`)
- **서브시스템별 하위 로거** (자동 접두사 + 구조화 필드 `{ subsystem }`)
- QR/UX 출력용 **`logRaw()`** (접두사 없음, 포맷 없음)
- **콘솔 스타일** (예: `pretty | compact | json`)
- 파일 로그 레벨과 별도의 **콘솔 로그 레벨** (파일 로그는 `logging.level`이 `debug`/`trace`일 때 전체 세부 정보 유지)
- **WhatsApp 메시지 본문**은 `debug`로 기록됩니다(보려면 `--verbose` 사용)

이렇게 하면 기존 파일 로그는 안정적으로 유지하면서 대화형 출력을 훑어보기 쉽게 만들 수 있습니다.

## 관련

- [로깅 개요](/ko/logging)
- [진단 내보내기](/ko/gateway/diagnostics)
