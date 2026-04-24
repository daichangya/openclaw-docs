---
read_when:
    - 버그 보고서 또는 지원 요청 준비하기
    - Gateway 충돌, 재시작, 메모리 압박 또는 과도하게 큰 페이로드 디버깅
    - 기록되거나 마스킹되는 진단 데이터 검토하기
summary: 버그 보고서를 위한 공유 가능한 Gateway 진단 번들 만들기
title: 진단 내보내기
x-i18n:
    generated_at: "2026-04-24T06:13:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw는 버그 보고서에 안전하게 첨부할 수 있는 로컬 진단 zip을 만들 수 있습니다. 이 zip은 정리된 Gateway 상태, 헬스, 로그, config 형태, 최근의 페이로드 없는 안정성 이벤트를 결합합니다.

## 빠른 시작

```bash
openclaw gateway diagnostics export
```

이 명령은 생성된 zip 경로를 출력합니다. 경로를 직접 지정하려면:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

자동화용:

```bash
openclaw gateway diagnostics export --json
```

## 내보내기에 포함되는 항목

zip에는 다음이 포함됩니다.

- `summary.md`: 지원용 사람이 읽을 수 있는 개요
- `diagnostics.json`: config, 로그, 상태, 헬스,
  안정성 데이터의 기계 판독 가능한 요약
- `manifest.json`: 내보내기 메타데이터 및 파일 목록
- 정리된 config 형태와 비시크릿 config 세부 정보
- 정리된 로그 요약과 최근 마스킹된 로그 줄
- 가능한 범위에서의 Gateway 상태 및 헬스 스냅샷
- `stability/latest.json`: 가능한 경우 최신으로 저장된 안정성 번들

내보내기는 Gateway 상태가 좋지 않을 때도 유용합니다. Gateway가
상태 또는 헬스 요청에 응답하지 못하더라도, 가능한 경우 로컬 로그, config 형태,
최신 안정성 번들은 계속 수집됩니다.

## 개인정보 보호 모델

진단은 공유 가능하도록 설계되었습니다. 내보내기에는 디버깅에 도움이 되는 다음과 같은 운영 데이터가 유지됩니다.

- 하위 시스템 이름, Plugin ID, provider ID, 채널 ID, 구성된 모드
- 상태 코드, 소요 시간, 바이트 수, 대기열 상태, 메모리 측정값
- 정리된 로그 메타데이터와 마스킹된 운영 메시지
- config 형태와 비시크릿 기능 설정

내보내기는 다음을 생략하거나 마스킹합니다.

- 채팅 텍스트, 프롬프트, 지침, Webhook 본문, 도구 출력
- 자격 증명, API 키, 토큰, 쿠키, 시크릿 값
- 원시 요청 또는 응답 본문
- account ID, message ID, 원시 세션 ID, 호스트 이름, 로컬 사용자 이름

로그 메시지가 사용자, 채팅, 프롬프트 또는 도구 페이로드 텍스트처럼 보이면,
내보내기는 메시지가 생략되었다는 사실과 바이트 수만 유지합니다.

## 안정성 레코더

진단이 활성화되어 있으면 Gateway는 기본적으로 경계가 정해진 페이로드 없는 안정성 스트림을 기록합니다. 이는 콘텐츠가 아니라 운영 사실을 위한 것입니다.

실시간 레코더 검사:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

치명적 종료, 종료 시간 초과, 또는 재시작 시 시작 실패 후 저장된
최신 안정성 번들 검사:

```bash
openclaw gateway stability --bundle latest
```

최신 저장 번들에서 진단 zip 생성:

```bash
openclaw gateway stability --bundle latest --export
```

저장된 번들은 이벤트가 존재할 경우 `~/.openclaw/logs/stability/` 아래에 있습니다.

## 유용한 옵션

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 특정 zip 경로에 쓰기
- `--log-lines <count>`: 포함할 정리된 로그 줄 최대 개수
- `--log-bytes <bytes>`: 검사할 로그 바이트 최대 개수
- `--url <url>`: 상태 및 헬스 스냅샷용 Gateway WebSocket URL
- `--token <token>`: 상태 및 헬스 스냅샷용 Gateway token
- `--password <password>`: 상태 및 헬스 스냅샷용 Gateway password
- `--timeout <ms>`: 상태 및 헬스 스냅샷 시간 초과
- `--no-stability-bundle`: 저장된 안정성 번들 조회 건너뛰기
- `--json`: 기계 판독 가능한 내보내기 메타데이터 출력

## 진단 비활성화

진단은 기본적으로 활성화되어 있습니다. 안정성 레코더와
진단 이벤트 수집을 비활성화하려면:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

진단을 비활성화하면 버그 보고서 세부 정보가 줄어듭니다. 정상적인
Gateway 로깅에는 영향을 주지 않습니다.

## 관련 문서

- [헬스 체크](/ko/gateway/health)
- [Gateway CLI](/ko/cli/gateway#gateway-diagnostics-export)
- [Gateway 프로토콜](/ko/gateway/protocol#system-and-identity)
- [로깅](/ko/logging)
