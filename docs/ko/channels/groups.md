---
read_when:
    - 그룹 채팅 동작 또는 멘션 게이팅을 변경할 때
summary: 표면 전반의 그룹 채팅 동작 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 그룹
x-i18n:
    generated_at: "2026-04-08T02:15:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5045badbba30587c8f1bf27f6b940c7c471a95c57093c9adb142374413ac81e
    source_path: channels/groups.md
    workflow: 15
---

# 그룹

OpenClaw는 Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 전반에서 그룹 채팅을 일관되게 처리합니다.

## 초보자 소개 (2분)

OpenClaw는 사용자의 자체 메시징 계정에서 “동작”합니다. 별도의 WhatsApp 봇 사용자는 없습니다.
**당신이** 그룹에 속해 있으면, OpenClaw는 그 그룹을 볼 수 있고 그 안에서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다 (`groupPolicy: "allowlist"`).
- 명시적으로 멘션 게이팅을 비활성화하지 않는 한, 응답에는 멘션이 필요합니다.

즉, 허용 목록에 있는 발신자는 OpenClaw를 멘션하여 트리거할 수 있습니다.

> 요약
>
> - **DM 접근**은 `*.allowFrom`으로 제어됩니다.
> - **그룹 접근**은 `*.groupPolicy` + 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어됩니다.
> - **응답 트리거링**은 멘션 게이팅(`requireMention`, `/activation`)으로 제어됩니다.

빠른 흐름(그룹 메시지에 대해 일어나는 일):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 컨텍스트 가시성과 허용 목록

그룹 안전성에는 서로 다른 두 가지 제어가 관여합니다.

- **트리거 권한 부여**: 누가 에이전트를 트리거할 수 있는지 (`groupPolicy`, `groups`, `groupAllowFrom`, 채널별 허용 목록)
- **컨텍스트 가시성**: 어떤 보조 컨텍스트가 모델에 주입되는지 (답장 텍스트, 인용, 스레드 기록, 전달 메타데이터)

기본적으로 OpenClaw는 일반적인 채팅 동작을 우선시하며, 컨텍스트를 대부분 수신된 그대로 유지합니다. 즉, 허용 목록은 주로 누가 작업을 트리거할 수 있는지를 결정하며, 인용되었거나 과거의 모든 스니펫에 대한 보편적인 마스킹 경계는 아닙니다.

현재 동작은 채널마다 다릅니다.

- 일부 채널은 특정 경로에서 보조 컨텍스트에 대해 이미 발신자 기반 필터링을 적용합니다(예: Slack 스레드 시드, Matrix 답장/스레드 조회).
- 다른 채널은 여전히 인용/답장/전달 컨텍스트를 수신된 그대로 전달합니다.

강화 방향(계획됨):

- `contextVisibility: "all"` (기본값)은 현재의 수신 원본 유지 동작을 유지합니다.
- `contextVisibility: "allowlist"`는 보조 컨텍스트를 허용 목록의 발신자로 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`에 명시적 인용/답장 예외 하나를 더한 것입니다.

이 강화 모델이 모든 채널에서 일관되게 구현되기 전까지는, 표면마다 차이가 있을 수 있습니다.

![그룹 메시지 흐름](/images/groups-flow.svg)

다음과 같이 하고 싶다면...

| 목표                                         | 설정할 내용                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| 모든 그룹을 허용하되 @멘션에서만 응답        | `groups: { "*": { requireMention: true } }`               |
| 모든 그룹 응답 비활성화                      | `groupPolicy: "disabled"`                                 |
| 특정 그룹만                                  | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음)       |
| 그룹에서는 본인만 트리거 가능                | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## 세션 키

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` 세션 키를 사용합니다(룸/채널은 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram 포럼 토픽은 그룹 id에 `:topic:<threadId>`를 추가하므로 각 토픽은 자체 세션을 가집니다.
- 다이렉트 채팅은 기본 세션(또는 설정된 경우 발신자별 세션)을 사용합니다.
- 그룹 세션에서는 하트비트가 건너뛰어집니다.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 패턴: 개인 DM + 공개 그룹 (단일 에이전트)

예 — “개인” 트래픽이 **DM**이고 “공개” 트래픽이 **그룹**이라면 이 방식은 잘 작동합니다.

이유: 단일 에이전트 모드에서는 DM이 일반적으로 **기본** 세션 키(`agent:main:main`)에 들어가고, 그룹은 항상 **비기본** 세션 키(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 샌드박싱을 활성화하면, 해당 그룹 세션은 Docker에서 실행되고 기본 DM 세션은 호스트에 남아 있습니다.

이렇게 하면 하나의 에이전트 “두뇌”(공유 워크스페이스 + 메모리)는 유지하면서도 두 가지 실행 자세를 가질 수 있습니다.

- **DM**: 전체 도구(호스트)
- **그룹**: 샌드박스 + 제한된 도구(Docker)

> 워크스페이스/페르소나를 정말로 분리해야 한다면(“개인”과 “공개”가 절대로 섞이면 안 되는 경우), 두 번째 에이전트 + 바인딩을 사용하세요. [다중 에이전트 라우팅](/ko/concepts/multi-agent)을 참조하세요.

예시(DM은 호스트에서, 그룹은 샌드박스 + 메시징 전용 도구):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

“호스트 접근 없음” 대신 “그룹이 폴더 X만 볼 수 있게” 하고 싶다면 `workspaceAccess: "none"`을 유지하고 허용 목록 경로만 샌드박스에 마운트하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

관련 항목:

- 구성 키와 기본값: [Gateway configuration](/ko/gateway/configuration-reference#agentsdefaultssandbox)
- 도구가 차단되는 이유 디버깅: [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)
- 바인드 마운트 세부 정보: [샌드박싱](/ko/gateway/sandboxing#custom-bind-mounts)

## 표시 라벨

- UI 라벨은 가능할 때 `displayName`을 사용하며, `<channel>:<token>` 형식으로 표시됩니다.
- `#room`은 룸/채널용으로 예약되어 있습니다. 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백은 `-`로 변환, `#@+._-`는 유지).

## 그룹 정책

채널별로 그룹/룸 메시지를 처리하는 방식을 제어합니다.

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 정책          | 동작                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 그룹은 허용 목록을 우회합니다. 멘션 게이팅은 계속 적용됩니다. |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                        |
| `"allowlist"` | 설정된 허용 목록과 일치하는 그룹/룸만 허용합니다.           |

참고:

- `groupPolicy`는 멘션 게이팅(@멘션 필요)과는 별개입니다.
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom`을 사용합니다(대체 경로: 명시적 `allowFrom`).
- DM 페어링 승인(`*-allowFrom` 저장소 항목)은 DM 접근에만 적용되며, 그룹 발신자 권한 부여는 그룹 허용 목록으로 명시적으로 유지됩니다.
- Discord: 허용 목록은 `channels.discord.guilds.<id>.channels`를 사용합니다.
- Slack: 허용 목록은 `channels.slack.channels`를 사용합니다.
- Matrix: 허용 목록은 `channels.matrix.groups`를 사용합니다. 룸 ID 또는 별칭 사용을 권장합니다. 참가 중인 룸 이름 조회는 최선 노력 방식이며, 확인되지 않은 이름은 런타임에 무시됩니다. 발신자 제한에는 `channels.matrix.groupAllowFrom`을 사용하세요. 룸별 `users` 허용 목록도 지원됩니다.
- 그룹 DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram 허용 목록은 사용자 ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 사용자명(`"@alice"` 또는 `"alice"`)과 일치할 수 있습니다. 접두사는 대소문자를 구분하지 않습니다.
- 기본값은 `groupPolicy: "allowlist"`이며, 그룹 허용 목록이 비어 있으면 그룹 메시지는 차단됩니다.
- 런타임 안전성: 프로바이더 블록이 완전히 없을 때(`channels.<provider>` 없음), 그룹 정책은 `channels.defaults.groupPolicy`를 상속하는 대신 실패 시 폐쇄 모드(일반적으로 `allowlist`)로 대체됩니다.

빠른 개념 모델(그룹 메시지 평가 순서):

1. `groupPolicy` (open/disabled/allowlist)
2. 그룹 허용 목록 (`*.groups`, `*.groupAllowFrom`, 채널별 허용 목록)
3. 멘션 게이팅 (`requireMention`, `/activation`)

## 멘션 게이팅 (기본값)

그룹 메시지는 그룹별로 재정의하지 않는 한 멘션이 필요합니다. 기본값은 각 하위 시스템의 `*.groups."*"` 아래에 있습니다.

채널이 답장 메타데이터를 지원하면 봇 메시지에 대한 답장은 암시적 멘션으로 간주됩니다. 채널이 인용 메타데이터를 노출하면 봇 메시지를 인용하는 것도 암시적 멘션으로 간주될 수 있습니다. 현재 기본 제공 사례에는 Telegram, WhatsApp, Slack, Discord, Microsoft Teams, ZaloUser가 포함됩니다.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

참고:

- `mentionPatterns`는 대소문자를 구분하지 않는 안전한 정규식 패턴입니다. 잘못된 패턴과 안전하지 않은 중첩 반복 형태는 무시됩니다.
- 명시적 멘션을 제공하는 표면은 여전히 통과하며, 패턴은 대체 수단입니다.
- 에이전트별 재정의: `agents.list[].groupChat.mentionPatterns` (여러 에이전트가 하나의 그룹을 공유할 때 유용함).
- 멘션 게이팅은 멘션 감지가 가능한 경우에만 강제됩니다(네이티브 멘션 또는 `mentionPatterns` 설정).
- Discord 기본값은 `channels.discord.guilds."*"`에 있습니다(길드/채널별 재정의 가능).
- 그룹 기록 컨텍스트는 채널 전반에서 일관되게 래핑되며 **보류 중 전용**입니다(멘션 게이팅 때문에 건너뛴 메시지). 전역 기본값에는 `messages.groupChat.historyLimit`을 사용하고, 재정의에는 `channels.<channel>.historyLimit`(또는 `channels.<channel>.accounts.*.historyLimit`)을 사용하세요. 비활성화하려면 `0`으로 설정하세요.

## 그룹/채널 도구 제한(선택 사항)

일부 채널 구성은 **특정 그룹/룸/채널 내부에서** 사용할 수 있는 도구를 제한하도록 지원합니다.

- `tools`: 그룹 전체에 대해 도구 허용/거부
- `toolsBySender`: 그룹 내부 발신자별 재정의
  명시적 키 접두사를 사용하세요:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, 그리고 `"*"` 와일드카드.
  기존의 접두사 없는 키도 여전히 허용되며 `id:` 전용으로만 일치합니다.

해결 순서(가장 구체적인 것이 우선):

1. 그룹/채널 `toolsBySender` 일치
2. 그룹/채널 `tools`
3. 기본값(`"*"` ) `toolsBySender` 일치
4. 기본값(`"*"` ) `tools`

예시(Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

참고:

- 그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(deny가 계속 우선).
- 일부 채널은 룸/채널에 대해 다른 중첩 구조를 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## 그룹 허용 목록

`channels.whatsapp.groups`, `channels.telegram.groups`, 또는 `channels.imessage.groups`가 설정되어 있으면, 해당 키는 그룹 허용 목록으로 동작합니다. 모든 그룹을 허용하면서 기본 멘션 동작도 설정하려면 `"*"`를 사용하세요.

자주 헷갈리는 점: DM 페어링 승인은 그룹 권한 부여와 동일하지 않습니다.
DM 페어링을 지원하는 채널에서는 페어링 저장소가 DM만 허용합니다. 그룹 명령에는 여전히 `groupAllowFrom` 또는 해당 채널에 문서화된 구성 대체 경로 같은 구성 허용 목록을 통한 명시적 그룹 발신자 권한 부여가 필요합니다.

일반적인 의도(복사/붙여넣기):

1. 모든 그룹 응답 비활성화

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 특정 그룹만 허용(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 모든 그룹을 허용하되 멘션 필요(명시적)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 그룹에서는 소유자만 트리거 가능(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 활성화 (소유자 전용)

그룹 소유자는 그룹별 활성화를 전환할 수 있습니다.

- `/activation mention`
- `/activation always`

소유자는 `channels.whatsapp.allowFrom`으로 결정됩니다(설정되지 않은 경우 봇 자신의 E.164 사용). 명령은 단독 메시지로 보내세요. 다른 표면은 현재 `/activation`을 무시합니다.

## 컨텍스트 필드

그룹 수신 페이로드는 다음을 설정합니다.

- `ChatType=group`
- `GroupSubject` (알려진 경우)
- `GroupMembers` (알려진 경우)
- `WasMentioned` (멘션 게이팅 결과)
- Telegram 포럼 토픽에는 `MessageThreadId` 및 `IsForum`도 포함됩니다.

채널별 참고 사항:

- BlueBubbles는 `GroupMembers`를 채우기 전에 로컬 Contacts 데이터베이스에서 이름 없는 macOS 그룹 참가자 정보를 선택적으로 보강할 수 있습니다. 이 기능은 기본적으로 꺼져 있으며, 일반 그룹 게이팅이 통과한 뒤에만 실행됩니다.

에이전트 시스템 프롬프트에는 새 그룹 세션의 첫 번째 턴에서 그룹 소개가 포함됩니다. 이는 모델에 사람처럼 응답하고, Markdown 표를 피하고, 빈 줄을 최소화하며 일반 채팅 간격을 따르고, 문자 그대로의 `\n` 시퀀스를 입력하지 말라고 상기시킵니다.

## iMessage 관련 세부 사항

- 라우팅 또는 허용 목록에는 `chat_id:<id>` 사용을 권장합니다.
- 채팅 목록 보기: `imsg chats --limit 20`.
- 그룹 응답은 항상 동일한 `chat_id`로 돌아갑니다.

## WhatsApp 관련 세부 사항

WhatsApp 전용 동작(기록 주입, 멘션 처리 세부 사항)은 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.
