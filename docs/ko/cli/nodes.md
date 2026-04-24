---
read_when:
    - 페어링된 Node(camera, screen, canvas)를 관리하고 있습니다
    - 요청을 승인하거나 Node 명령을 호출해야 합니다
summary: '`openclaw nodes`용 CLI 참조(상태, 페어링, invoke, camera/canvas/screen)'
title: Node
x-i18n:
    generated_at: "2026-04-24T06:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

페어링된 Node(디바이스)를 관리하고 Node 기능을 호출합니다.

관련:

- Node 개요: [Nodes](/ko/nodes)
- 카메라: [카메라 Node](/ko/nodes/camera)
- 이미지: [이미지 Node](/ko/nodes/images)

일반 옵션:

- `--url`, `--token`, `--timeout`, `--json`

## 일반적인 명령

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`는 대기 중/페어링됨 테이블을 출력합니다. 페어링된 행에는 가장 최근 연결 경과 시간(Last Connect)이 포함됩니다.
현재 연결된 Node만 표시하려면 `--connected`를 사용하세요. 일정 기간 내에 연결된 Node만
필터링하려면 `--last-connected <duration>`을 사용하세요(예: `24h`, `7d`).

승인 참고:

- `openclaw nodes pending`에는 페어링 범위만 필요합니다.
- `openclaw nodes approve <requestId>`는 대기 중인 요청의
  추가 범위 요구 사항을 상속합니다:
  - 명령 없는 요청: 페어링만
  - exec가 아닌 Node 명령: 페어링 + 쓰기
  - `system.run` / `system.run.prepare` / `system.which`: 페어링 + 관리자

## 호출

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

호출 플래그:

- `--params <json>`: JSON 객체 문자열(기본값 `{}`).
- `--invoke-timeout <ms>`: Node 호출 시간 제한(기본값 `15000`).
- `--idempotency-key <key>`: 선택적 멱등성 키.
- `system.run` 및 `system.run.prepare`는 여기서 차단됩니다. 셸 실행에는 `host=node`와 함께 `exec` 도구를 사용하세요.

Node에서 셸 실행을 하려면 `openclaw nodes run` 대신 `host=node`와 함께 `exec` 도구를 사용하세요.
이제 `nodes` CLI는 기능 중심입니다: `nodes invoke`를 통한 직접 RPC와 함께 페어링, 카메라,
화면, 위치, 캔버스, 알림을 지원합니다.

## 관련

- [CLI 참조](/ko/cli)
- [Nodes](/ko/nodes)
