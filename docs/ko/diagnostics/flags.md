---
read_when:
    - 전역 로깅 수준을 올리지 않고 대상 지정 디버그 로그가 필요합니다
    - 지원용으로 서브시스템별 로그를 수집해야 합니다
summary: 대상 지정 디버그 로그용 진단 플래그
title: 진단 플래그
x-i18n:
    generated_at: "2026-04-24T06:12:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

진단 플래그를 사용하면 어디서나 상세 로깅을 켜지 않고도 대상 지정 디버그 로그를 활성화할 수 있습니다. 플래그는 옵트인이며, 서브시스템이 이를 확인하지 않으면 아무 효과도 없습니다.

## 작동 방식

- 플래그는 문자열입니다(대소문자 구분 없음).
- 구성 또는 환경 변수 재정의를 통해 플래그를 활성화할 수 있습니다.
- 와일드카드가 지원됩니다:
  - `telegram.*`는 `telegram.http`와 일치합니다
  - `*`는 모든 플래그를 활성화합니다

## 구성으로 활성화

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

여러 플래그:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

플래그를 변경한 후 Gateway를 재시작하세요.

## 환경 변수 재정의(일회성)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

모든 플래그 비활성화:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 로그 위치

플래그는 표준 진단 로그 파일에 로그를 기록합니다. 기본값:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file`을 설정했다면 대신 그 경로를 사용합니다. 로그는 JSONL 형식입니다(줄마다 JSON 객체 하나). 비식별화는 여전히 `logging.redactSensitive`에 따라 적용됩니다.

## 로그 추출

가장 최신 로그 파일 선택:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 진단만 필터링:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

또는 재현하면서 tail 보기:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

원격 Gateway의 경우 `openclaw logs --follow`도 사용할 수 있습니다([/cli/logs](/ko/cli/logs) 참고).

## 참고

- `logging.level`이 `warn`보다 높게 설정되어 있으면 이 로그들이 억제될 수 있습니다. 기본값 `info`면 괜찮습니다.
- 플래그는 켜 둬도 안전합니다. 특정 서브시스템의 로그 양에만 영향을 줍니다.
- 로그 대상, 수준, 비식별화를 변경하려면 [/logging](/ko/logging)을 사용하세요.

## 관련 문서

- [Gateway 진단](/ko/gateway/diagnostics)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
