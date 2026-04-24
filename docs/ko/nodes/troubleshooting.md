---
read_when:
    - Node는 연결되었지만 camera/canvas/screen/exec 도구가 실패합니다.
    - Node 페어링과 승인 간의 사고 모델이 필요합니다.
summary: Node 페어링, 포그라운드 요구 사항, 권한 및 도구 실패 문제 해결
title: Node 문제 해결
x-i18n:
    generated_at: "2026-04-24T06:23:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

이 페이지는 Node가 status에는 보이지만 node 도구가 실패할 때 사용하세요.

## 명령어 단계

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그런 다음 node 전용 점검을 실행하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

정상 신호:

- Node가 역할 `node`로 연결되어 있고 페어링되어 있음
- `nodes describe`에 호출하려는 capability가 포함되어 있음
- Exec 승인에 예상된 모드/allowlist가 표시됨

## 포그라운드 요구 사항

`canvas.*`, `camera.*`, `screen.*`는 iOS/Android node에서 포그라운드 전용입니다.

빠른 점검 및 수정:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE`가 보이면 node 앱을 포그라운드로 가져온 후 다시 시도하세요.

## 권한 매트릭스

| Capability                   | iOS                                     | Android                                      | macOS node app                | 일반적인 실패 코드             |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ clip 오디오용 mic)            | Camera (+ clip 오디오용 mic)                 | Camera (+ clip 오디오용 mic)  | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording (+ 선택적 mic)         | 화면 캡처 프롬프트 (+ 선택적 mic)            | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using 또는 Always(모드에 따름)    | 모드에 따라 Foreground/Background location   | Location permission           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 해당 없음(node host 경로)               | 해당 없음(node host 경로)                    | Exec 승인 필요                | `SYSTEM_RUN_DENIED`            |

## 페어링 vs 승인

이 둘은 서로 다른 게이트입니다.

1. **장치 페어링**: 이 node가 gateway에 연결할 수 있는가?
2. **Gateway node 명령 정책**: RPC 명령 ID가 `gateway.nodes.allowCommands` / `denyCommands` 및 플랫폼 기본값에 의해 허용되는가?
3. **Exec 승인**: 이 node가 특정 셸 명령을 로컬에서 실행할 수 있는가?

빠른 점검:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

페어링이 누락되었으면 먼저 node 장치 페어링을 승인하세요.
`nodes describe`에 명령이 없으면 gateway node 명령 정책과, node가 연결 시 실제로 그 명령을 선언했는지 확인하세요.
페어링은 정상인데 `system.run`이 실패하면 해당 node의 exec 승인/allowlist를 수정하세요.

Node 페어링은 명령별 승인 표면이 아니라 ID/신뢰 게이트입니다. `system.run`의 node별 정책은 gateway 페어링 기록이 아니라 해당 node의 exec 승인 파일(`openclaw approvals get --node ...`)에 있습니다.

승인 기반 `host=node` 실행의 경우, gateway는 실행을 준비된 표준 `systemRunPlan`에도 바인딩합니다. 나중 호출자가 승인된 실행이 전달되기 전에 command/cwd 또는 세션 메타데이터를 변경하면, gateway는 수정된 페이로드를 신뢰하는 대신 승인 불일치로 실행을 거부합니다.

## 일반적인 node 오류 코드

- `NODE_BACKGROUND_UNAVAILABLE` → 앱이 백그라운드 상태임. 포그라운드로 가져오세요.
- `CAMERA_DISABLED` → node 설정에서 camera 토글이 비활성화됨
- `*_PERMISSION_REQUIRED` → OS 권한이 없거나 거부됨
- `LOCATION_DISABLED` → 위치 모드가 꺼져 있음
- `LOCATION_PERMISSION_REQUIRED` → 요청한 위치 모드 권한이 부여되지 않음
- `LOCATION_BACKGROUND_UNAVAILABLE` → 앱이 백그라운드인데 While Using 권한만 있음
- `SYSTEM_RUN_DENIED: approval required` → exec 요청에 명시적 승인이 필요함
- `SYSTEM_RUN_DENIED: allowlist miss` → allowlist 모드에서 명령이 차단됨  
  Windows node host에서는 `cmd.exe /c ...` 같은 셸 래퍼 형식이 allowlist 모드에서 ask 흐름으로 승인되지 않는 한 allowlist miss로 처리됩니다.

## 빠른 복구 루프

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

그래도 막혀 있다면:

- 장치 페어링을 다시 승인
- node 앱 다시 열기(포그라운드)
- OS 권한 다시 부여
- exec 승인 정책 재생성/조정

관련 항목:

- [/nodes/index](/ko/nodes/index)
- [/nodes/camera](/ko/nodes/camera)
- [/nodes/location-command](/ko/nodes/location-command)
- [/tools/exec-approvals](/ko/tools/exec-approvals)
- [/gateway/pairing](/ko/gateway/pairing)

## 관련 항목

- [Nodes 개요](/ko/nodes)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [채널 문제 해결](/ko/channels/troubleshooting)
