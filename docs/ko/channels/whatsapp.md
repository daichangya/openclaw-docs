---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업 시
summary: WhatsApp 채널 지원, 액세스 제어, 전달 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-04-07T05:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2ce84d869ace6c0bebd9ec17bdbbef997a5c31e5da410b02a19a0f103f7359
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (웹 채널)

상태: WhatsApp Web(Baileys)을 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(필요 시)

- 온보딩(`openclaw onboard`) 및 `openclaw channels add --channel whatsapp`는
  처음 선택할 때 WhatsApp 플러그인 설치를 안내합니다.
- `openclaw channels login --channel whatsapp`도
  플러그인이 아직 없으면 설치 흐름을 제공합니다.
- 개발 채널 + git checkout: 기본값은 로컬 플러그인 경로입니다.
- Stable/Beta: 기본값은 npm 패키지 `@openclaw/whatsapp`입니다.

수동 설치도 계속 사용할 수 있습니다:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="WhatsApp 액세스 정책 구성">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp 연결(QR)">

```bash
openclaw channels login --channel whatsapp
```

    특정 계정의 경우:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway 시작">

```bash
openclaw gateway
```

  </Step>

  <Step title="첫 번째 페어링 요청 승인(페어링 모드 사용 시)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료됩니다. 대기 중인 요청은 채널당 최대 3개입니다.

  </Step>
</Steps>

<Note>
OpenClaw는 가능하면 WhatsApp를 별도 번호로 운영할 것을 권장합니다. (채널 메타데이터와 설정 흐름은 해당 구성을 기준으로 최적화되어 있지만, 개인 번호 구성도 지원합니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    가장 깔끔한 운영 모드입니다:

    - OpenClaw용 별도 WhatsApp 아이덴티티
    - 더 명확한 DM 허용 목록 및 라우팅 경계
    - 자기 자신과의 채팅 혼동 가능성 감소

    최소 정책 패턴:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="개인 번호 대체 방식">
    온보딩은 개인 번호 모드를 지원하며 self-chat 친화적인 기준 구성을 작성합니다:

    - `dmPolicy: "allowlist"`
    - `allowFrom`에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서는 self-chat 보호가 연결된 자기 번호와 `allowFrom`을 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 아웃바운드 전송에는 대상 계정에 대한 활성 WhatsApp 리스너가 필요합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 직접 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 메인 세션으로 통합).
- 그룹 세션은 분리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web 전송은 gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 소문자 변형)를 따릅니다. 채널별 WhatsApp 프록시 설정보다 호스트 수준 프록시 구성을 권장합니다.

## 액세스 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy`는 직접 채팅 액세스를 제어합니다:

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `allowFrom`은 E.164 형식 번호를 받습니다(내부적으로 정규화됨).

    다중 계정 재정의: `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)가 해당 계정에서 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 사항:

    - 페어링은 채널 allow-store에 지속 저장되며 구성된 `allowFrom`과 병합됩니다
    - 허용 목록이 구성되지 않은 경우 연결된 자기 번호는 기본적으로 허용됩니다
    - 아웃바운드 `fromMe` DM은 자동 페어링되지 않습니다

  </Tab>

  <Tab title="그룹 정책 + 허용 목록">
    그룹 액세스에는 두 계층이 있습니다:

    1. **그룹 멤버십 허용 목록** (`channels.whatsapp.groups`)
       - `groups`를 생략하면 모든 그룹이 대상이 될 수 있습니다
       - `groups`가 있으면 그룹 허용 목록으로 동작합니다(`"*"` 허용)

    2. **그룹 발신자 정책** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 허용 목록 우회
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 함
       - `disabled`: 모든 그룹 인바운드 차단

    발신자 허용 목록 폴백:

    - `groupAllowFrom`이 설정되지 않으면 런타임은 가능할 때 `allowFrom`으로 폴백합니다
    - 발신자 허용 목록은 멘션/응답 활성화보다 먼저 평가됩니다

    참고: `channels.whatsapp` 블록 자체가 전혀 없으면 `channels.defaults.groupPolicy`가 설정되어 있어도 런타임 그룹 정책 폴백은 `allowlist`입니다(경고 로그 포함).

  </Tab>

  <Tab title="멘션 + /activation">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션 감지에는 다음이 포함됩니다:

    - 봇 아이덴티티에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 암시적 봇 응답 감지(응답 발신자가 봇 아이덴티티와 일치)

    보안 참고:

    - 인용/응답은 멘션 게이팅만 충족할 뿐이며 발신자 권한을 부여하지 않습니다
    - `groupPolicy: "allowlist"`인 경우 허용 목록에 없는 발신자는 허용 목록에 있는 사용자의 메시지에 답장하더라도 계속 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 전역 구성이 아니라 세션 상태를 업데이트합니다. 소유자 제한이 적용됩니다.

  </Tab>
</Tabs>

## 개인 번호 및 self-chat 동작

연결된 자기 번호가 `allowFrom`에도 있으면 WhatsApp self-chat 보호 기능이 활성화됩니다:

- self-chat 턴에 대해 읽음 확인 건너뜀
- 자기 자신을 다시 호출할 수 있는 mention-JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않은 경우 self-chat 응답은 기본적으로 `[{identity.name}]` 또는 `[openclaw]` 사용

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="인바운드 엔벌로프 + 응답 컨텍스트">
    들어오는 WhatsApp 메시지는 공유 인바운드 엔벌로프로 래핑됩니다.

    인용된 응답이 있으면 컨텍스트가 다음 형식으로 추가됩니다:

    ```text
    [<sender> id:<stanzaId>에 대한 응답]
    <인용된 본문 또는 미디어 플레이스홀더>
    [/Replying]
    ```

    응답 메타데이터 필드도 가능할 때 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164).

  </Accordion>

  <Accordion title="미디어 플레이스홀더 및 위치/연락처 추출">
    미디어만 있는 인바운드 메시지는 다음과 같은 플레이스홀더로 정규화됩니다:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    위치 및 연락처 페이로드는 라우팅 전에 텍스트 컨텍스트로 정규화됩니다.

  </Accordion>

  <Accordion title="대기 중인 그룹 기록 주입">
    그룹에서는 봇이 최종적으로 트리거될 때 처리되지 않은 메시지를 버퍼링해 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`이면 비활성화

    주입 마커:

    - `[마지막 응답 이후의 채팅 메시지 - 컨텍스트용]`
    - `[현재 메시지 - 이에 응답하세요]`

  </Accordion>

  <Accordion title="읽음 확인">
    수락된 인바운드 WhatsApp 메시지에 대해 읽음 확인이 기본적으로 활성화됩니다.

    전역 비활성화:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    계정별 재정의:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    self-chat 턴은 전역적으로 활성화되어 있어도 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, 청크 분할 및 미디어

<AccordionGroup>
  <Accordion title="텍스트 청크 분할">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 문단 경계(빈 줄)를 우선하며, 이후 길이 안전 청크 분할로 폴백합니다
  </Accordion>

  <Accordion title="아웃바운드 미디어 동작">
    - 이미지, 비디오, 오디오(PTT 음성 노트), 문서 페이로드 지원
    - `audio/ogg`는 음성 노트 호환성을 위해 `audio/ogg; codecs=opus`로 다시 작성됩니다
    - 애니메이션 GIF 재생은 비디오 전송 시 `gifPlayback: true`로 지원됩니다
    - 다중 미디어 응답 페이로드 전송 시 캡션은 첫 번째 미디어 항목에 적용됩니다
    - 미디어 소스는 HTTP(S), `file://`, 또는 로컬 경로일 수 있습니다
  </Accordion>

  <Accordion title="미디어 크기 제한 및 폴백 동작">
    - 인바운드 미디어 저장 상한: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - 아웃바운드 미디어 전송 상한: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb` 사용
    - 이미지는 제한에 맞도록 자동 최적화됩니다(크기 조정/품질 스윕)
    - 미디어 전송 실패 시 첫 번째 항목 폴백은 응답을 조용히 버리지 않고 텍스트 경고를 전송합니다
  </Accordion>
</AccordionGroup>

## 반응 수준

`channels.whatsapp.reactionLevel`은 에이전트가 WhatsApp에서 이모지 반응을 얼마나 폭넓게 사용하는지 제어합니다:

| 수준         | 확인 반응 | 에이전트 시작 반응 | 설명                                  |
| ------------ | --------- | ------------------ | ------------------------------------- |
| `"off"`       | 아니요    | 아니요             | 반응을 전혀 사용하지 않음             |
| `"ack"`       | 예        | 아니요             | 확인 반응만 사용(응답 전 수신 확인)   |
| `"minimal"`   | 예        | 예(보수적)         | 확인 + 보수적 가이드의 에이전트 반응 |
| `"extensive"` | 예        | 예(권장)           | 확인 + 권장 가이드의 에이전트 반응   |

기본값: `"minimal"`.

계정별 재정의는 `channels.whatsapp.accounts.<id>.reactionLevel`을 사용합니다.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 확인 반응

WhatsApp는 `channels.whatsapp.ackReaction`을 통해 인바운드 수신 시 즉시 확인 반응을 지원합니다.
확인 반응은 `reactionLevel`에 의해 제한되며, `reactionLevel`이 `"off"`이면 억제됩니다.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

동작 참고:

- 인바운드가 수락된 직후(응답 전) 전송됨
- 실패는 로그에 기록되지만 일반 응답 전달을 차단하지 않음
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에서 반응함; 그룹 활성화 `always`는 이 검사에 대한 우회로 작동함
- WhatsApp는 `channels.whatsapp.ackReaction`을 사용합니다(레거시 `messages.ackReaction`은 여기서 사용되지 않음)

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다
    - 기본 계정 선택: `default`가 있으면 그것, 없으면 구성된 첫 번째 계정 ID(정렬됨)
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다
  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증도 기본 계정 흐름에 대해 계속 인식/마이그레이션됩니다
  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    레거시 인증 디렉터리에서는 `oauth.json`은 보존되고 Baileys 인증 파일은 제거됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 액션 및 구성 쓰기

- 에이전트 도구 지원에는 WhatsApp 반응 액션(`react`)이 포함됩니다.
- 액션 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널 시작 구성 쓰기는 기본적으로 활성화됩니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태에 연결되지 않음으로 표시됩니다.

    해결:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결되었지만 연결 끊김 / 재연결 루프">
    증상: 연결된 계정에서 반복적인 연결 끊김 또는 재연결 시도가 발생합니다.

    해결:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요하면 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 활성 gateway 리스너가 없으면 아웃바운드 전송은 즉시 실패합니다.

    Gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예상과 다르게 무시됨">
    다음 순서로 확인하세요:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이팅(`requireMention` + 멘션 패턴)
    - `openclaw.json`(JSON5)의 중복 키: 뒤의 항목이 앞의 항목을 덮어쓰므로 범위별로 `groupPolicy`를 하나만 유지하세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp gateway 런타임은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram gateway 운영에 비호환으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 구성 참조 포인터

기본 참조:

- [구성 참조 - WhatsApp](/ko/gateway/configuration-reference#whatsapp)

주요 WhatsApp 필드:

- 액세스: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 다중 계정: `accounts.<id>.enabled`, `accounts.<id>.authDir`, 계정 수준 재정의
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- 세션 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [보안](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
