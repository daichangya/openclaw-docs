---
read_when:
    - SSH 없이 원격으로 Gateway 로그를 tail해야 하는 경우
    - 도구용 JSON 로그 라인이 필요한 경우
summary: '``openclaw logs``에 대한 CLI 참조(Gateway 로그를 RPC로 tail하기)'
title: 로그
x-i18n:
    generated_at: "2026-04-24T06:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

RPC를 통해 Gateway 파일 로그를 tail합니다(원격 모드에서 동작).

관련 항목:

- 로깅 개요: [Logging](/ko/logging)
- Gateway CLI: [gateway](/ko/cli/gateway)

## 옵션

- `--limit <n>`: 반환할 로그 줄의 최대 개수(기본값 `200`)
- `--max-bytes <n>`: 로그 파일에서 읽을 최대 바이트 수(기본값 `250000`)
- `--follow`: 로그 스트림 계속 추적
- `--interval <ms>`: follow 중 폴링 간격(기본값 `1000`)
- `--json`: 줄 구분 JSON 이벤트 출력
- `--plain`: 스타일 형식 없는 일반 텍스트 출력
- `--no-color`: ANSI 색상 비활성화
- `--local-time`: 타임스탬프를 로컬 시간대로 렌더링

## 공통 Gateway RPC 옵션

`openclaw logs`는 표준 Gateway 클라이언트 플래그도 받습니다.

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--timeout <ms>`: 제한 시간(ms, 기본값 `30000`)
- `--expect-final`: Gateway 호출이 에이전트 기반일 때 최종 응답 대기

`--url`을 전달하면 CLI는 설정 또는 환경 변수 자격 증명을 자동 적용하지 않습니다. 대상 Gateway에 인증이 필요하면 `--token`을 명시적으로 포함하세요.

## 예시

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 참고

- 타임스탬프를 로컬 시간대로 렌더링하려면 `--local-time`을 사용하세요.
- 로컬 loopback Gateway가 페어링을 요구하면 `openclaw logs`는 구성된 로컬 로그 파일로 자동 대체됩니다. 명시적인 `--url` 대상은 이 대체 경로를 사용하지 않습니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Gateway logging](/ko/gateway/logging)
