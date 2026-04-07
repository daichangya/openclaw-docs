---
read_when:
    - 로컬 또는 CI 테스트 실행에 합성 QA 전송을 연결하고 있습니다
    - 번들된 qa-channel 구성 표면이 필요합니다
    - 엔드투엔드 QA 자동화를 반복 개선하고 있습니다
summary: 결정론적인 OpenClaw QA 시나리오를 위한 합성 Slack급 채널 플러그인
title: QA 채널
x-i18n:
    generated_at: "2026-04-07T05:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# QA 채널

`qa-channel`은 자동화된 OpenClaw QA를 위한 번들된 합성 메시지 전송입니다.

이것은 프로덕션 채널이 아닙니다. 상태를 결정론적으로 유지하고 완전히
검사할 수 있도록 하면서 실제 전송이 사용하는 것과 동일한 채널 플러그인
경계를 테스트하기 위해 존재합니다.

## 현재 수행하는 작업

- Slack급 대상 문법:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 다음을 위한 HTTP 기반 합성 버스:
  - 인바운드 메시지 주입
  - 아웃바운드 전사 캡처
  - 스레드 생성
  - 반응
  - 수정
  - 삭제
  - 검색 및 읽기 작업
- Markdown 보고서를 작성하는 번들된 호스트 측 자체 점검 실행기

## 구성

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

지원되는 계정 키:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## 실행기

현재 수직 슬라이스:

```bash
pnpm qa:e2e
```

이제 이것은 번들된 `qa-lab` 확장을 통해 라우팅됩니다. 저장소 내
QA 버스를 시작하고, 번들된 `qa-channel` 런타임 슬라이스를 부팅하고,
결정론적인 자체 점검을 실행한 뒤, `.artifacts/qa-e2e/` 아래에
Markdown 보고서를 작성합니다.

비공개 디버거 UI:

```bash
pnpm qa:lab:up
```

이 단일 명령은 QA 사이트를 빌드하고, Docker 기반 gateway + QA Lab
스택을 시작하고, QA Lab URL을 출력합니다. 그 사이트에서 시나리오를
선택하고, 모델 레인을 선택하고, 개별 실행을 시작하고, 결과를 실시간으로
확인할 수 있습니다.

전체 저장소 기반 QA 스위트:

```bash
pnpm openclaw qa suite
```

이 명령은 배포된 Control UI 번들과는 별도의 로컬 URL에서 비공개 QA
디버거를 시작합니다.

## 범위

현재 범위는 의도적으로 좁습니다:

- 버스 + 플러그인 전송
- 스레드 라우팅 문법
- 채널 소유 메시지 작업
- Markdown 보고
- 실행 제어가 포함된 Docker 기반 QA 사이트

후속 작업에서는 다음이 추가됩니다:

- provider/model 매트릭스 실행
- 더 풍부한 시나리오 검색
- 이후 OpenClaw 네이티브 오케스트레이션
