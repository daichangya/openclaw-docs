---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 검증 구성하기
summary: Matrix 지원 상태, 설정, 그리고 구성 예제
title: Matrix
x-i18n:
    generated_at: "2026-04-24T06:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix는 OpenClaw용 번들 채널 Plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, 방, 스레드, 미디어, 반응, 투표, 위치, E2EE를 지원합니다.

## 번들 Plugin

Matrix는 현재 OpenClaw 릴리스에 번들 Plugin으로 포함되어 있으므로 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드 또는 Matrix가 제외된 사용자 지정 설치를 사용 중이라면 수동으로 설치하세요.

npm에서 설치:

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin 동작과 설치 규칙은 [Plugins](/ko/tools/plugin)를 참조하세요.

## 설정

1. Matrix Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. homeserver에서 Matrix 계정을 생성합니다.
3. 다음 중 하나로 `channels.matrix`를 구성합니다.
   - `homeserver` + `accessToken`, 또는
   - `homeserver` + `userId` + `password`.
4. gateway를 재시작합니다.
5. 봇과 DM을 시작하거나 방으로 초대합니다.
   - 새로운 Matrix 초대는 `channels.matrix.autoJoin`이 허용하는 경우에만 작동합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 마법사는 다음을 묻습니다.

- homeserver URL
- 인증 방식: access token 또는 password
- 사용자 ID(password 인증만 해당)
- 선택적 디바이스 이름
- E2EE 활성화 여부
- 방 접근 및 초대 자동 참여 구성 여부

마법사의 주요 동작:

- Matrix 인증 환경 변수가 이미 존재하고 해당 계정의 인증이 아직 config에 저장되어 있지 않으면, 마법사는 인증을 환경 변수에 유지하는 env 바로가기를 제안합니다.
- 계정 이름은 계정 ID로 정규화됩니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다.
- DM 허용 목록 항목은 `@user:server`를 직접 받을 수 있으며, 표시 이름은 실시간 디렉터리 조회에서 정확히 하나의 일치 항목을 찾은 경우에만 작동합니다.
- 방 허용 목록 항목은 방 ID와 별칭을 직접 받을 수 있습니다. `!room:server` 또는 `#alias:server`를 권장하며, 해석되지 않은 이름은 허용 목록 해석 시 런타임에서 무시됩니다.
- 초대 자동 참여 허용 목록 모드에서는 안정적인 초대 대상만 사용하세요: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 방 이름은 거부됩니다.
- 저장 전에 방 이름을 해석하려면 `openclaw channels resolve --channel matrix "Project Room"`을 사용하세요.

<Warning>
`channels.matrix.autoJoin`의 기본값은 `off`입니다.

설정하지 않으면 봇은 초대된 방이나 새로운 DM 스타일 초대에 참여하지 않으므로, 먼저 수동으로 참여하지 않는 한 새 그룹이나 초대된 DM에 나타나지 않습니다.

수락할 초대를 제한하려면 `autoJoin: "allowlist"`를 `autoJoinAllowlist`와 함께 설정하거나, 모든 초대에 참여하게 하려면 `autoJoin: "always"`를 설정하세요.

`allowlist` 모드에서 `autoJoinAllowlist`는 `!roomId:server`, `#alias:server`, 또는 `*`만 허용합니다.
</Warning>

허용 목록 예시:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

모든 초대에 참여:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

최소 토큰 기반 설정:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

비밀번호 기반 설정(로그인 후 토큰이 캐시됨):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix는 캐시된 자격 증명을 `~/.openclaw/credentials/matrix/`에 저장합니다.
기본 계정은 `credentials.json`을 사용하고, 이름 있는 계정은 `credentials-<account>.json`을 사용합니다.
그 위치에 캐시된 자격 증명이 있으면 현재 인증이 config에 직접 설정되어 있지 않더라도 OpenClaw는 setup, doctor, channel-status 탐지에서 Matrix가 구성된 것으로 간주합니다.

환경 변수 동등 항목(config 키가 설정되지 않았을 때 사용됨):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

기본이 아닌 계정의 경우 계정 범위 환경 변수를 사용하세요.

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

계정 `ops` 예시:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

정규화된 계정 ID `ops-bot`의 경우 다음을 사용합니다.

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix는 계정 ID의 구두점을 이스케이프하여 범위 지정 환경 변수가 충돌하지 않도록 합니다.
예를 들어 `-`는 `_X2D_`가 되므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

대화형 마법사는 해당 인증 환경 변수가 이미 존재하고 선택한 계정의 Matrix 인증이 아직 config에 저장되어 있지 않은 경우에만 env-var 바로가기를 제안합니다.

`MATRIX_HOMESERVER`는 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참조하세요.

## 구성 예시

다음은 DM 페어링, 방 허용 목록, E2EE 활성화를 포함한 실용적인 기준 구성입니다.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin`은 DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다. OpenClaw는 초대 시점에 초대된 방을 DM인지 그룹인지 안정적으로 분류할 수 없으므로 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 봇이 참여하고 방이 DM으로 분류된 이후에 적용됩니다.

## 스트리밍 미리보기

Matrix 응답 스트리밍은 옵트인입니다.

OpenClaw가 단일 라이브 미리보기 응답을 보내고, 모델이 텍스트를 생성하는 동안 그 미리보기를 제자리에서 편집한 다음, 응답이 완료되면 최종 확정하게 하려면 `channels.matrix.streaming`을 `"partial"`로 설정하세요.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`가 기본값입니다. OpenClaw는 최종 응답을 기다린 뒤 한 번만 전송합니다.
- `streaming: "partial"`은 일반 Matrix 텍스트 메시지를 사용해 현재 어시스턴트 블록용으로 편집 가능한 미리보기 메시지 하나를 생성합니다. 이는 Matrix의 기존 미리보기 우선 알림 동작을 유지하므로, 기본 클라이언트는 완료된 블록 대신 처음 스트리밍된 미리보기 텍스트에 대해 알릴 수 있습니다.
- `streaming: "quiet"`은 현재 어시스턴트 블록용으로 편집 가능한 조용한 미리보기 알림 하나를 생성합니다. 이는 완료된 미리보기 편집에 대한 수신자 푸시 규칙도 함께 구성한 경우에만 사용하세요.
- `blockStreaming: true`는 별도의 Matrix 진행 상황 메시지를 활성화합니다. 미리보기 스트리밍이 활성화되어 있으면 Matrix는 현재 블록의 라이브 초안을 유지하고 완료된 블록은 별도 메시지로 보존합니다.
- 미리보기 스트리밍이 켜져 있고 `blockStreaming`이 꺼져 있으면 Matrix는 라이브 초안을 제자리에서 편집하고 블록 또는 턴이 끝날 때 동일한 이벤트를 최종 확정합니다.
- 미리보기가 더 이상 하나의 Matrix 이벤트에 맞지 않으면 OpenClaw는 미리보기 스트리밍을 중단하고 일반 최종 전달로 폴백합니다.
- 미디어 응답은 여전히 일반적으로 첨부 파일을 전송합니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면 OpenClaw는 최종 미디어 응답을 보내기 전에 해당 미리보기를 redaction 처리합니다.
- 미리보기 편집은 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 rate-limit 동작을 원한다면 스트리밍을 끄세요.

`blockStreaming`만으로는 초안 미리보기가 활성화되지 않습니다.
미리보기 편집을 위해서는 `streaming: "partial"` 또는 `streaming: "quiet"`를 사용하고, 완료된 어시스턴트 블록도 별도의 진행 메시지로 남기고 싶을 때만 `blockStreaming: true`를 추가하세요.

사용자 지정 푸시 규칙 없이 기본 Matrix 알림이 필요하다면, 미리보기 우선 동작을 위해 `streaming: "partial"`을 사용하거나 최종 결과만 전달하려면 `streaming`을 꺼 두세요. `streaming: "off"`일 때:

- `blockStreaming: true`는 완료된 각 블록을 일반 알림 Matrix 메시지로 보냅니다.
- `blockStreaming: false`는 최종 완료된 응답만 일반 알림 Matrix 메시지로 보냅니다.

### 조용한 최종 미리보기를 위한 자체 호스팅 푸시 규칙

조용한 스트리밍(`streaming: "quiet"`)은 블록이나 턴이 최종 확정될 때만 수신자에게 알립니다. 사용자별 푸시 규칙이 최종 확정된 미리보기 마커와 일치해야 합니다. 전체 설정(수신자 토큰, pusher 확인, 규칙 설치, homeserver별 참고 사항)은 [조용한 미리보기를 위한 Matrix 푸시 규칙](/ko/channels/matrix-push-rules)을 참조하세요.

## 봇 간 방

기본적으로 다른 구성된 OpenClaw Matrix 계정에서 온 Matrix 메시지는 무시됩니다.

의도적으로 에이전트 간 Matrix 트래픽을 허용하려면 `allowBots`를 사용하세요.

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true`는 허용된 방과 DM에서 다른 구성된 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 방에서 이 봇을 눈에 띄게 멘션한 경우에만 해당 메시지를 수락합니다. DM은 여전히 허용됩니다.
- `groups.<room>.allowBots`는 특정 방 하나에 대해 계정 수준 설정을 재정의합니다.
- OpenClaw는 자기 응답 루프를 피하기 위해 동일한 Matrix 사용자 ID에서 온 메시지는 여전히 무시합니다.
- Matrix는 여기서 네이티브 봇 플래그를 노출하지 않으므로, OpenClaw는 "봇 작성"을 "이 OpenClaw gateway에서 구성된 다른 Matrix 계정이 보낸 것"으로 간주합니다.

공유 방에서 봇 간 트래픽을 활성화할 때는 엄격한 방 허용 목록과 멘션 요구 사항을 사용하세요.

## 암호화 및 검증

암호화된(E2EE) 방에서는 아웃바운드 이미지 이벤트가 `thumbnail_file`을 사용하므로 이미지 미리보기도 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 방은 계속 일반 `thumbnail_url`을 사용합니다. 별도 구성은 필요하지 않습니다. Plugin이 E2EE 상태를 자동으로 감지합니다.

암호화 활성화:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

검증 명령(모두 진단용 `--verbose`와 기계 판독 가능 출력을 위한 `--json` 지원):

| 명령                                                         | 용도                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                              | 교차 서명 및 디바이스 검증 상태 확인                                                |
| `openclaw matrix verify status --include-recovery-key --json`| 저장된 복구 키 포함                                                                 |
| `openclaw matrix verify bootstrap`                           | 교차 서명 및 검증 부트스트랩 수행(아래 참조)                                        |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | 현재 교차 서명 ID를 폐기하고 새로 생성                                              |
| `openclaw matrix verify device "<recovery-key>"`             | 복구 키로 이 디바이스 검증                                                          |
| `openclaw matrix verify backup status`                       | room-key 백업 상태 확인                                                             |
| `openclaw matrix verify backup restore`                      | 서버 백업에서 room key 복원                                                         |
| `openclaw matrix verify backup reset --yes`                  | 현재 백업을 삭제하고 새 기준 상태 생성(비밀 저장소를 다시 만들 수 있음)             |

멀티 계정 설정에서 Matrix CLI 명령은 `--account <id>`를 전달하지 않으면 암묵적인 Matrix 기본 계정을 사용합니다.
이름이 지정된 계정을 여러 개 구성한 경우 먼저 `channels.matrix.defaultAccount`를 설정해야 하며, 그렇지 않으면 이런 암묵적 CLI 작업은 중단되고 계정을 명시적으로 선택하라고 요청합니다.
검증 또는 디바이스 작업이 특정 이름 지정 계정을 명시적으로 대상으로 하게 하려면 `--account`를 사용하세요.

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

이름 지정 계정에서 암호화가 비활성화되어 있거나 사용할 수 없는 경우, Matrix 경고와 검증 오류는 해당 계정의 config 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="검증됨의 의미">
    OpenClaw는 자신의 교차 서명 ID가 서명한 경우에만 디바이스를 검증된 것으로 취급합니다. `verify status --verbose`는 세 가지 신뢰 신호를 보여줍니다.

    - `Locally trusted`: 이 클라이언트에서만 신뢰됨
    - `Cross-signing verified`: SDK가 교차 서명을 통한 검증으로 보고함
    - `Signed by owner`: 자신의 self-signing 키로 서명됨

    `Verified by owner`는 교차 서명 또는 소유자 서명이 있을 때만 `yes`가 됩니다. 로컬 신뢰만으로는 충분하지 않습니다.

  </Accordion>

  <Accordion title="bootstrap이 하는 일">
    `verify bootstrap`은 암호화된 계정을 위한 복구 및 설정 명령입니다. 순서대로 다음을 수행합니다.

    - 가능하면 기존 복구 키를 재사용하여 비밀 저장소를 부트스트랩
    - 교차 서명을 부트스트랩하고 누락된 공개 교차 서명 키 업로드
    - 현재 디바이스를 표시하고 교차 서명
    - 아직 없으면 서버 측 room-key 백업 생성

    homeserver가 교차 서명 키 업로드에 UIA를 요구하면 OpenClaw는 먼저 무인증, 그다음 `m.login.dummy`, 마지막으로 `m.login.password`를 시도합니다(`channels.matrix.password` 필요). 현재 ID를 의도적으로 폐기하는 경우에만 `--force-reset-cross-signing`을 사용하세요.

  </Accordion>

  <Accordion title="새 백업 기준 상태">
    앞으로의 암호화된 메시지는 계속 작동하게 유지하고, 복구 불가능한 이전 기록 손실은 감수하려면 다음을 실행하세요.

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    이름 지정 계정을 대상으로 하려면 `--account <id>`를 추가하세요. 현재 백업 비밀을 안전하게 불러올 수 없는 경우 이 작업은 비밀 저장소도 다시 만들 수 있습니다.

  </Accordion>

  <Accordion title="시작 동작">
    `encryption: true`일 때 `startupVerification`의 기본값은 `"if-unverified"`입니다. 시작 시 검증되지 않은 디바이스는 다른 Matrix 클라이언트에서 자기 검증을 요청하며, 중복을 건너뛰고 쿨다운을 적용합니다. `startupVerificationCooldownHours`로 조정하거나 `startupVerification: "off"`로 비활성화하세요.

    시작 시에는 현재 비밀 저장소와 교차 서명 ID를 재사용하는 보수적인 crypto 부트스트랩 패스도 실행됩니다. bootstrap 상태가 손상되어 있으면 OpenClaw는 `channels.matrix.password` 없이도 보호된 복구를 시도합니다. homeserver가 password UIA를 요구하면 시작 시 경고를 기록하고 치명적 오류로 처리하지 않습니다. 이미 소유자 서명된 디바이스는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix migration](/ko/install/migrating-matrix)을 참조하세요.

  </Accordion>

  <Accordion title="검증 알림">
    Matrix는 엄격한 DM 검증 방에 검증 수명 주기 알림을 `m.notice` 메시지로 게시합니다: 요청, 준비 상태("이모지로 검증" 안내 포함), 시작/완료, 그리고 가능한 경우 SAS(이모지/숫자) 세부 정보.

    다른 Matrix 클라이언트에서 들어오는 요청은 추적되어 자동 수락됩니다. 자기 검증의 경우 OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 검증이 가능해지면 자체 측을 확인합니다. 그래도 Matrix 클라이언트에서 "They match"를 비교하고 확인해야 합니다.

    검증 시스템 알림은 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="디바이스 정리">
    오래된 OpenClaw 관리 디바이스가 쌓일 수 있습니다. 나열하고 정리하세요.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto 저장소">
    Matrix E2EE는 IndexedDB shim으로 `fake-indexeddb`를 사용하는 공식 `matrix-js-sdk` Rust crypto 경로를 사용합니다. crypto 상태는 `crypto-idb-snapshot.json`에 영구 저장됩니다(제한적인 파일 권한).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 저장되며 sync 저장소, crypto 저장소, 복구 키, IDB 스냅샷, 스레드 바인딩, 시작 검증 상태를 포함합니다. 토큰이 바뀌어도 계정 ID가 같으면 OpenClaw는 가장 적절한 기존 루트를 재사용하므로 이전 상태가 계속 보입니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

선택한 계정의 Matrix 셀프 프로필은 다음으로 업데이트할 수 있습니다.

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

이름 지정 Matrix 계정을 명시적으로 대상으로 하려면 `--account <id>`를 추가하세요.

Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://` 또는 `https://` 아바타 URL을 전달하면 OpenClaw는 먼저 이를 Matrix에 업로드한 다음, 해석된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 선택한 계정 재정의)에 다시 저장합니다.

## 스레드

Matrix는 자동 응답과 message 도구 전송 모두에 대해 네이티브 Matrix 스레드를 지원합니다.

- `dm.sessionScope: "per-user"`(기본값)는 Matrix DM 라우팅을 발신자 범위로 유지하므로, 동일한 상대방으로 해석되면 여러 DM 방이 하나의 세션을 공유할 수 있습니다.
- `dm.sessionScope: "per-room"`은 일반 DM 인증 및 허용 목록 검사를 계속 사용하면서 각 Matrix DM 방을 자체 세션 키로 격리합니다.
- 명시적인 Matrix 대화 바인딩은 여전히 `dm.sessionScope`보다 우선하므로, 바인딩된 방과 스레드는 선택된 대상 세션을 유지합니다.
- `threadReplies: "off"`는 응답을 최상위로 유지하고 들어오는 스레드 메시지는 상위 세션에 유지합니다.
- `threadReplies: "inbound"`는 들어온 메시지가 이미 해당 스레드에 있을 때만 스레드 안에서 응답합니다.
- `threadReplies: "always"`는 방 응답을 트리거 메시지를 루트로 하는 스레드에 유지하고, 그 대화를 첫 트리거 메시지부터 일치하는 스레드 범위 세션으로 라우팅합니다.
- `dm.threadReplies`는 DM에 대해서만 최상위 설정을 재정의합니다. 예를 들어 방 스레드는 격리하면서 DM은 평평하게 유지할 수 있습니다.
- 들어오는 스레드 메시지는 스레드 루트 메시지를 추가 에이전트 컨텍스트로 포함합니다.
- message 도구 전송은 대상이 같은 방이거나 같은 DM 사용자 대상이면, 명시적인 `threadId`가 제공되지 않는 한 현재 Matrix 스레드를 자동 상속합니다.
- 동일 세션 DM 사용자 대상 재사용은 현재 세션 메타데이터가 동일 Matrix 계정의 동일 DM 상대방임을 입증할 때만 작동합니다. 그렇지 않으면 OpenClaw는 일반 사용자 범위 라우팅으로 폴백합니다.
- OpenClaw가 같은 공유 Matrix DM 세션에서 어떤 Matrix DM 방이 다른 DM 방과 충돌하는 것을 감지하면, 스레드 바인딩이 활성화되어 있고 `dm.sessionScope` 힌트가 있을 때 해당 방에 `/focus` 이스케이프 해치를 포함한 일회성 `m.notice`를 게시합니다.
- 런타임 스레드 바인딩은 Matrix에서 지원됩니다. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 스레드 바인딩된 `/acp spawn`은 Matrix 방과 DM에서 작동합니다.
- `threadBindings.spawnSubagentSessions=true`일 때 최상위 Matrix 방/DM의 `/focus`는 새 Matrix 스레드를 만들고 이를 대상 세션에 바인딩합니다.
- 기존 Matrix 스레드 내부에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 대신 현재 스레드가 바인딩됩니다.

## ACP 대화 바인딩

Matrix 방, DM, 기존 Matrix 스레드는 채팅 표면을 바꾸지 않고 영구적인 ACP 워크스페이스로 바꿀 수 있습니다.

빠른 운영자 흐름:

- 계속 사용할 Matrix DM, 방, 또는 기존 스레드 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 Matrix DM 또는 방에서는 현재 DM/방이 채팅 표면으로 유지되고 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- 기존 Matrix 스레드 안에서는 `--bind here`가 현재 스레드를 제자리에서 바인딩합니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

참고:

- `--bind here`는 자식 Matrix 스레드를 만들지 않습니다.
- `threadBindings.spawnAcpSessions`는 `/acp spawn --thread auto|here`에서만 필요하며, 이 경우 OpenClaw가 자식 Matrix 스레드를 만들거나 바인딩해야 합니다.

### 스레드 바인딩 구성

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 재정의도 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 스레드 바인딩 spawn 플래그는 옵트인입니다.

- 최상위 `/focus`가 새 Matrix 스레드를 생성하고 바인딩하게 하려면 `threadBindings.spawnSubagentSessions: true`를 설정하세요.
- `/acp spawn --thread auto|here`가 ACP 세션을 Matrix 스레드에 바인딩하게 하려면 `threadBindings.spawnAcpSessions: true`를 설정하세요.

## 반응

Matrix는 아웃바운드 반응 작업, 인바운드 반응 알림, 인바운드 ack 반응을 지원합니다.

- 아웃바운드 반응 도구 기능은 `channels["matrix"].actions.reactions`로 제어됩니다.
- `react`는 특정 Matrix 이벤트에 반응을 추가합니다.
- `reactions`는 특정 Matrix 이벤트의 현재 반응 요약을 나열합니다.
- `emoji=""`는 해당 이벤트에서 봇 계정 자신의 반응을 제거합니다.
- `remove: true`는 봇 계정의 지정된 이모지 반응만 제거합니다.

ack 반응은 표준 OpenClaw 해석 순서를 사용합니다.

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 에이전트 ID 이모지 폴백

ack 반응 범위는 다음 순서로 해석됩니다.

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

반응 알림 모드는 다음 순서로 해석됩니다.

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 기본값: `own`

동작:

- `reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` 이벤트를 전달합니다.
- `reactionNotifications: "off"`는 반응 시스템 이벤트를 비활성화합니다.
- 반응 제거는 Matrix가 이를 독립된 `m.reaction` 제거가 아니라 redaction으로 표시하므로 시스템 이벤트로 합성되지 않습니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`는 Matrix 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함할 최근 방 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 폴백하며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- Matrix 방 기록은 방 전용입니다. DM은 계속 일반 세션 기록을 사용합니다.
- Matrix 방 기록은 pending-only 방식입니다. OpenClaw는 아직 응답을 트리거하지 않은 방 메시지를 버퍼링한 뒤, 멘션 또는 다른 트리거가 도착하면 그 구간을 스냅샷합니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 턴의 기본 인바운드 본문에 그대로 유지됩니다.
- 동일한 Matrix 이벤트를 재시도할 때는 새 방 메시지 쪽으로 밀려가지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 답장 텍스트, 스레드 루트, 대기 중 기록 같은 보조 방 컨텍스트에 대해 공유 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신된 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 방/사용자 허용 목록 검사에서 허용된 발신자로 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 하나의 명시적 인용 답장은 계속 유지합니다.

이 설정은 보조 컨텍스트의 가시성에 영향을 주며, 인바운드 메시지 자체가 응답을 트리거할 수 있는지에는 영향을 주지 않습니다.
트리거 권한은 계속 `groupPolicy`, `groups`, `groupAllowFrom`, DM 정책 설정에서 결정됩니다.

## DM 및 방 정책

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

멘션 게이팅과 허용 목록 동작은 [Groups](/ko/channels/groups)를 참조하세요.

Matrix DM용 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면 OpenClaw는 새 코드를 발급하는 대신 동일한 대기 중 페어링 코드를 재사용하며, 짧은 쿨다운 후 리마인더 응답을 다시 보낼 수 있습니다.

공유 DM 페어링 흐름과 저장소 레이아웃은 [Pairing](/ko/channels/pairing)을 참조하세요.

## 직접 방 복구

직접 메시지 상태가 어긋나면 OpenClaw는 실제 DM 대신 오래된 1:1 방을 가리키는 오래된 `m.direct` 매핑을 갖게 될 수 있습니다. 상대방에 대한 현재 매핑은 다음으로 확인할 수 있습니다.

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

다음으로 복구합니다.

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

복구 흐름은 다음과 같습니다.

- 이미 `m.direct`에 매핑된 엄격한 1:1 DM을 우선 사용
- 없으면 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 폴백
- 정상적인 DM이 없으면 새 direct room을 만들고 `m.direct`를 다시 기록

복구 흐름은 오래된 방을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑만 갱신하여 이후 Matrix 전송, 검증 알림, 기타 직접 메시지 흐름이 다시 올바른 방을 대상으로 하게 만듭니다.

## exec 승인

Matrix는 Matrix 계정용 네이티브 승인 클라이언트로 동작할 수 있습니다. 네이티브
DM/채널 라우팅 노브는 계속 exec 승인 구성 아래에 있습니다.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`(선택 사항, `channels.matrix.dm.allowFrom`으로 폴백)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

승인자는 `@owner:example.org` 같은 Matrix 사용자 ID여야 합니다. Matrix는 `enabled`가 설정되지 않았거나 `"auto"`이고 최소 하나의 승인자를 해석할 수 있으면 네이티브 승인을 자동 활성화합니다. Exec 승인은 먼저 `execApprovals.approvers`를 사용하고 `channels.matrix.dm.allowFrom`으로 폴백할 수 있습니다. Plugin 승인은 `channels.matrix.dm.allowFrom`을 통해 권한을 부여합니다. Matrix를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. 그렇지 않으면 승인 요청은 다른 구성된 승인 경로나 승인 폴백 정책으로 폴백됩니다.

Matrix 네이티브 라우팅은 두 승인 종류를 모두 지원합니다.

- `channels.matrix.execApprovals.*`는 Matrix 승인 프롬프트의 네이티브 DM/채널 fanout 모드를 제어합니다.
- Exec 승인은 `execApprovals.approvers` 또는 `channels.matrix.dm.allowFrom`의 exec 승인자 집합을 사용합니다.
- Plugin 승인은 `channels.matrix.dm.allowFrom`의 Matrix DM 허용 목록을 사용합니다.
- Matrix 반응 단축키와 메시지 업데이트는 exec 승인과 plugin 승인 모두에 적용됩니다.

전달 규칙:

- `target: "dm"`은 승인 프롬프트를 승인자 DM으로 보냅니다.
- `target: "channel"`은 프롬프트를 원래 Matrix 방 또는 DM으로 다시 보냅니다.
- `target: "both"`는 승인자 DM과 원래 Matrix 방 또는 DM 둘 다로 보냅니다.

Matrix 승인 프롬프트는 기본 승인 메시지에 반응 단축키를 심습니다.

- `✅` = 한 번만 허용
- `❌` = 거부
- `♾️` = 유효한 exec 정책이 그 결정을 허용하는 경우 항상 허용

승인자는 해당 메시지에 반응하거나 폴백 슬래시 명령 `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`를 사용할 수 있습니다.

해석된 승인자만 승인 또는 거부할 수 있습니다. exec 승인의 경우 채널 전달에 명령 텍스트가 포함되므로, 신뢰할 수 있는 방에서만 `channel` 또는 `both`를 활성화하세요.

계정별 재정의:

- `channels.matrix.accounts.<account>.execApprovals`

관련 문서: [Exec approvals](/ko/tools/exec-approvals)

## 슬래시 명령

Matrix 슬래시 명령(예: `/new`, `/reset`, `/model`)은 DM에서 직접 작동합니다. 방에서는 OpenClaw가 봇 자신의 Matrix 멘션이 앞에 붙은 슬래시 명령도 인식하므로, `@bot:server /new`는 사용자 지정 멘션 정규식 없이도 명령 경로를 트리거합니다. 이렇게 하면 사용자가 명령을 입력하기 전에 봇을 탭 완성한 경우 Element 같은 클라이언트가 내보내는 방 스타일 `@mention /command` 게시물에도 봇이 계속 응답할 수 있습니다.

권한 부여 규칙은 계속 적용됩니다. 명령 발신자는 일반 메시지와 마찬가지로 DM 또는 방 허용 목록/소유자 정책을 충족해야 합니다.

## 멀티 계정

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

최상위 `channels.matrix` 값은 계정이 재정의하지 않는 한 이름 지정 계정의 기본값으로 작동합니다.
상속된 방 항목은 `groups.<room>.account`로 하나의 Matrix 계정에 범위를 제한할 수 있습니다.
`account`가 없는 항목은 모든 Matrix 계정에 공유되며, `account: "default"`가 있는 항목도 기본 계정이 최상위 `channels.matrix.*`에 직접 구성된 경우 계속 작동합니다.
공유된 부분 인증 기본값만으로는 별도의 암묵적 기본 계정이 생성되지 않습니다. OpenClaw는 그 기본값에 새로운 인증(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` + `password`)이 있을 때만 최상위 `default` 계정을 합성합니다. 이름 지정 계정은 나중에 캐시된 자격 증명이 인증을 충족하면 `homeserver` + `userId`만으로도 계속 탐지 가능할 수 있습니다.
Matrix에 이미 정확히 하나의 이름 지정 계정이 있거나 `defaultAccount`가 기존 이름 지정 계정 키를 가리키면, 단일 계정에서 멀티 계정으로의 복구/설정 승격은 새 `accounts.default` 항목을 만드는 대신 그 계정을 보존합니다. 승격된 계정으로 이동하는 것은 Matrix 인증/bootstrap 키뿐이며, 공유 전달 정책 키는 최상위에 남습니다.
OpenClaw가 암묵적 라우팅, 프로빙, CLI 작업에 하나의 이름 지정 Matrix 계정을 우선 사용하게 하려면 `defaultAccount`를 설정하세요.
여러 Matrix 계정이 구성되어 있고 계정 ID 중 하나가 `default`이면 `defaultAccount`가 설정되지 않았더라도 OpenClaw는 해당 계정을 암묵적으로 사용합니다.
이름 지정 계정을 여러 개 구성한 경우 `defaultAccount`를 설정하거나, 암묵적 계정 선택에 의존하는 CLI 명령에 `--account <id>`를 전달하세요.
한 명령에서 그 암묵적 선택을 재정의하려면 `openclaw matrix verify ...` 및 `openclaw matrix devices ...`에 `--account <id>`를 전달하세요.

공유 멀티 계정 패턴은 [구성 참조](/ko/gateway/config-channels#multi-account-all-channels)를 참조하세요.

## private/LAN homeserver

기본적으로 OpenClaw는 SSRF 보호를 위해 private/internal Matrix homeserver를 차단하며,
계정별로 명시적으로 옵트인해야만 허용합니다.

homeserver가 localhost, LAN/Tailscale IP 또는 내부 호스트 이름에서 실행된다면,
해당 Matrix 계정에 대해 `network.dangerouslyAllowPrivateNetwork`를 활성화하세요.

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 설정 예시:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

이 옵트인은 신뢰할 수 있는 private/internal 대상만 허용합니다. `http://matrix.example.org:8008` 같은
공개 평문 homeserver는 계속 차단됩니다. 가능하면 `https://`를 사용하세요.

## Matrix 트래픽 프록시 설정

Matrix 배포에 명시적 아웃바운드 HTTP(S) 프록시가 필요하다면 `channels.matrix.proxy`를 설정하세요.

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

이름 지정 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다.
OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브 모두에 동일한 프록시 설정을 사용합니다.

## 대상 해석

Matrix는 OpenClaw가 방 또는 사용자 대상을 요청하는 모든 곳에서 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server`, 또는 `matrix:user:@user:server`
- 방: `!room:server`, `room:!room:server`, 또는 `matrix:room:!room:server`
- 별칭: `#alias:server`, `channel:#alias:server`, 또는 `matrix:channel:#alias:server`

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 homeserver의 Matrix 사용자 디렉터리를 조회합니다.
- 방 조회는 명시적인 방 ID와 별칭을 직접 받아들이고, 그런 다음 해당 계정의 참여 중인 방 이름 검색으로 폴백합니다.
- 참여 중인 방 이름 조회는 best-effort입니다. 방 이름을 ID 또는 별칭으로 해석할 수 없으면 런타임 허용 목록 해석에서 무시됩니다.

## 구성 참조

- `enabled`: 채널 활성화 또는 비활성화.
- `name`: 계정용 선택적 레이블.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호되는 계정 ID.
- `homeserver`: homeserver URL. 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 Matrix 계정이 private/internal homeserver에 연결할 수 있도록 허용합니다. homeserver가 `localhost`, LAN/Tailscale IP 또는 `matrix-synapse` 같은 내부 호스트로 해석되는 경우 이를 활성화하세요.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL. 이름 지정 계정은 자체 `proxy`로 최상위 기본값을 재정의할 수 있습니다.
- `userId`: 전체 Matrix 사용자 ID. 예: `@bot:example.org`.
- `accessToken`: 토큰 기반 인증용 access token. 일반 텍스트 값과 SecretRef 값이 `channels.matrix.accessToken` 및 `channels.matrix.accounts.<id>.accessToken`에서 env/file/exec provider 전반에 걸쳐 지원됩니다. [비밀 관리](/ko/gateway/secrets)를 참조하세요.
- `password`: 비밀번호 기반 로그인용 비밀번호. 일반 텍스트 값과 SecretRef 값이 지원됩니다.
- `deviceId`: 명시적인 Matrix 디바이스 ID.
- `deviceName`: 비밀번호 로그인용 디바이스 표시 이름.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트를 위한 저장된 self-avatar URL.
- `initialSyncLimit`: 시작 동기화 중 가져올 최대 이벤트 수.
- `encryption`: E2EE 활성화.
- `allowlistOnly`: `true`일 때 `open` 방 정책을 `allowlist`로 승격하고, `disabled`를 제외한 모든 활성 DM 정책(`pairing`, `open` 포함)을 `allowlist`로 강제합니다. `disabled` 정책에는 영향을 주지 않습니다.
- `allowBots`: 다른 구성된 OpenClaw Matrix 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, 또는 `disabled`.
- `contextVisibility`: 보조 방 컨텍스트 가시성 모드(`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: 방 트래픽용 사용자 ID 허용 목록. 전체 Matrix 사용자 ID가 가장 안전하며, 정확한 디렉터리 일치는 시작 시와 모니터 실행 중 허용 목록이 변경될 때 해석됩니다. 해석되지 않은 이름은 무시됩니다.
- `historyLimit`: 그룹 기록 컨텍스트로 포함할 최대 방 메시지 수. `messages.groupChat.historyLimit`로 폴백하며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- `replyToMode`: `off`, `first`, `all`, 또는 `batched`.
- `markdown`: 아웃바운드 Matrix 텍스트용 선택적 Markdown 렌더링 구성.
- `streaming`: `off`(기본값), `"partial"`, `"quiet"`, `true`, 또는 `false`. `"partial"`과 `true`는 일반 Matrix 텍스트 메시지로 미리보기 우선 초안 업데이트를 활성화합니다. `"quiet"`은 자체 호스팅 푸시 규칙 설정용 비알림 미리보기 알림을 사용합니다. `false`는 `"off"`와 같습니다.
- `blockStreaming`: `true`이면 초안 미리보기 스트리밍이 활성화된 동안 완료된 어시스턴트 블록에 대해 별도의 진행 상황 메시지를 활성화합니다.
- `threadReplies`: `off`, `inbound`, 또는 `always`.
- `threadBindings`: 스레드 바인딩 세션 라우팅 및 수명 주기에 대한 채널별 재정의.
- `startupVerification`: 시작 시 자동 자기 검증 요청 모드(`if-unverified`, `off`).
- `startupVerificationCooldownHours`: 자동 시작 검증 요청 재시도 전 쿨다운 시간.
- `textChunkLimit`: 문자 기준 아웃바운드 메시지 청크 크기(`chunkMode`가 `length`일 때 적용).
- `chunkMode`: `length`는 메시지를 문자 수 기준으로 분할하고, `newline`은 줄 경계에서 분할합니다.
- `responsePrefix`: 이 채널의 모든 아웃바운드 응답 앞에 붙는 선택적 문자열.
- `ackReaction`: 이 채널/계정용 선택적 ack 반응 재정의.
- `ackReactionScope`: 선택적 ack 반응 범위 재정의(`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: 인바운드 반응 알림 모드(`own`, `off`).
- `mediaMaxMb`: 아웃바운드 전송 및 인바운드 미디어 처리용 미디어 크기 제한(MB).
- `autoJoin`: 초대 자동 참여 정책(`always`, `allowlist`, `off`). 기본값: `off`. DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `allowlist`일 때 허용되는 방/별칭. 별칭 항목은 초대 처리 중 방 ID로 해석되며, OpenClaw는 초대된 방이 주장하는 별칭 상태를 신뢰하지 않습니다.
- `dm`: DM 정책 블록(`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw가 방에 참여하고 이를 DM으로 분류한 이후의 DM 접근을 제어합니다. 초대가 자동 참여되는지 여부는 바꾸지 않습니다.
- `dm.allowFrom`: DM 트래픽용 사용자 ID 허용 목록. 전체 Matrix 사용자 ID가 가장 안전하며, 정확한 디렉터리 일치는 시작 시와 모니터 실행 중 허용 목록이 변경될 때 해석됩니다. 해석되지 않은 이름은 무시됩니다.
- `dm.sessionScope`: `per-user`(기본값) 또는 `per-room`. 상대방이 같더라도 각 Matrix DM 방이 별도 컨텍스트를 유지하게 하려면 `per-room`을 사용하세요.
- `dm.threadReplies`: DM 전용 스레드 정책 재정의(`off`, `inbound`, `always`). DM의 응답 배치와 세션 격리에 대해 최상위 `threadReplies` 설정을 재정의합니다.
- `execApprovals`: Matrix 네이티브 exec 승인 전달(`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID. `dm.allowFrom`이 이미 승인자를 식별하는 경우 선택 사항입니다.
- `execApprovals.target`: `dm | channel | both`(기본값: `dm`).
- `accounts`: 이름 지정 계정별 재정의. 최상위 `channels.matrix` 값은 이 항목들의 기본값으로 작동합니다.
- `groups`: 방별 정책 맵. 방 ID 또는 별칭을 권장하며, 해석되지 않은 방 이름은 런타임에서 무시됩니다. 세션/그룹 ID는 해석 후 안정적인 방 ID를 사용합니다.
- `groups.<room>.account`: 멀티 계정 설정에서 하나의 상속된 방 항목을 특정 Matrix 계정으로 제한합니다.
- `groups.<room>.allowBots`: 구성된 봇 발신자에 대한 방 수준 재정의(`true` 또는 `"mentions"`).
- `groups.<room>.users`: 방별 발신자 허용 목록.
- `groups.<room>.tools`: 방별 도구 허용/거부 재정의.
- `groups.<room>.autoReply`: 방 수준 멘션 게이팅 재정의. `true`는 해당 방의 멘션 요구 사항을 비활성화하고, `false`는 다시 강제합니다.
- `groups.<room>.skills`: 선택적 방 수준 Skills 필터.
- `groups.<room>.systemPrompt`: 선택적 방 수준 시스템 프롬프트 스니펫.
- `rooms`: `groups`의 레거시 별칭.
- `actions`: 작업별 도구 게이팅(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 하드닝
