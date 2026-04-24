---
read_when:
    - 채널 Plugin 구성하기(인증, 접근 제어, 멀티 계정)
    - 채널별 config 키 문제 해결하기
    - DM 정책, 그룹 정책 또는 멘션 게이팅 감사하기
summary: '채널 구성: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 등에서의 접근 제어, 페어링, 채널별 키'
title: 구성 — 채널
x-i18n:
    generated_at: "2026-04-24T06:13:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

`channels.*` 아래의 채널별 config 키입니다. DM 및 그룹 접근,
멀티 계정 설정, 멘션 게이팅, 그리고 Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage 및 기타 번들 채널 Plugin의 채널별 키를 다룹니다.

에이전트, 도구, Gateway 런타임 및 기타 최상위 키는
[구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## 채널

각 채널은 해당 config 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`인 경우 제외).

### DM 및 그룹 접근

모든 채널은 DM 정책과 그룹 정책을 지원합니다.

| DM 정책             | 동작                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (기본값)  | 알 수 없는 발신자는 일회성 페어링 코드를 받으며, 소유자가 승인해야 함 |
| `allowlist`         | `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용     |
| `open`              | 모든 인바운드 DM 허용(`allowFrom: ["*"]` 필요)                 |
| `disabled`          | 모든 인바운드 DM 무시                                           |

| 그룹 정책             | 동작                                                         |
| --------------------- | ------------------------------------------------------------ |
| `allowlist` (기본값)  | 구성된 허용 목록과 일치하는 그룹만 허용                      |
| `open`                | 그룹 허용 목록 우회(멘션 게이팅은 계속 적용됨)               |
| `disabled`            | 모든 그룹/방 메시지 차단                                     |

<Note>
`channels.defaults.groupPolicy`는 provider의 `groupPolicy`가 설정되지 않았을 때 기본값을 설정합니다.
페어링 코드는 1시간 후 만료됩니다. 대기 중인 DM 페어링 요청은 **채널당 3개**로 제한됩니다.
provider 블록이 완전히 없으면(`channels.<provider>` 없음), 런타임 그룹 정책은 시작 시 경고와 함께 `allowlist`(fail-closed)로 폴백됩니다.
</Note>

### 채널 모델 재정의

`channels.modelByChannel`을 사용해 특정 채널 ID를 모델에 고정하세요. 값은 `provider/model` 또는 구성된 모델 별칭을 받습니다. 채널 매핑은 세션에 아직 모델 재정의가 없는 경우에 적용됩니다(예: `/model`로 설정된 경우).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### 채널 기본값 및 Heartbeat

provider 전반에 걸친 공유 그룹 정책 및 Heartbeat 동작에는 `channels.defaults`를 사용하세요.

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: provider 수준 `groupPolicy`가 설정되지 않았을 때의 폴백 그룹 정책.
- `channels.defaults.contextVisibility`: 모든 채널의 기본 보조 컨텍스트 가시성 모드. 값: `all`(기본값, 모든 인용/스레드/기록 컨텍스트 포함), `allowlist`(허용 목록 발신자의 컨텍스트만 포함), `allowlist_quote`(allowlist와 같지만 명시적 인용/답장 컨텍스트는 유지). 채널별 재정의: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat 출력에 정상 채널 상태 포함.
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 출력에 저하/오류 상태 포함.
- `channels.defaults.heartbeat.useIndicator`: 간결한 indicator 스타일 Heartbeat 출력 렌더링.

### WhatsApp

WhatsApp은 gateway의 웹 채널(Baileys Web)을 통해 실행됩니다. 연결된 세션이 존재하면 자동으로 시작됩니다.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 읽음 표시(자기 자신과의 채팅 모드에서는 false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="멀티 계정 WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 아웃바운드 명령은 `default` 계정이 있으면 이를 기본으로 사용하고, 없으면 구성된 첫 번째 계정 ID(정렬 기준)를 사용합니다.
- 선택적 `channels.whatsapp.defaultAccount`는 구성된 계정 ID와 일치할 때 이 폴백 기본 계정 선택을 재정의합니다.
- 레거시 단일 계정 Baileys 인증 디렉터리는 `openclaw doctor`에 의해 `whatsapp/default`로 마이그레이션됩니다.
- 계정별 재정의: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (기본값: off, 미리보기 편집 rate limit을 피하려면 명시적으로 옵트인)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- 봇 토큰: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`(일반 파일만 허용, symlink는 거부), 기본 계정에 대해서는 `TELEGRAM_BOT_TOKEN`이 폴백입니다.
- 선택적 `channels.telegram.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 멀티 계정 설정(계정 ID 2개 이상)에서는 폴백 라우팅을 피하기 위해 명시적 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하세요. `openclaw doctor`는 이것이 없거나 잘못된 경우 경고합니다.
- `configWrites: false`는 Telegram에서 시작된 config 쓰기(supergroup ID 마이그레이션, `/config set|unset`)를 차단합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 포럼 토픽에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에는 정규형 `chatId:topic:topicId` 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
- Telegram 스트림 미리보기는 `sendMessage` + `editMessageText`를 사용합니다(직접 채팅과 그룹 채팅에서 모두 작동).
- 재시도 정책: [재시도 정책](/ko/concepts/retry) 참조.

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress는 Discord에서 partial로 매핑됨)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // sessions_spawn({ thread: true })에 대한 옵트인
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- 토큰: `channels.discord.token`, 기본 계정의 폴백으로 `DISCORD_BOT_TOKEN` 사용.
- 명시적인 Discord `token`을 제공하는 직접 아웃바운드 호출은 해당 호출에 그 토큰을 사용합니다. 계정 재시도/정책 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
- 선택적 `channels.discord.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(guild 채널)를 사용하세요. 숫자 ID만 단독으로 쓰면 거부됩니다.
- guild slug는 소문자이며 공백은 `-`로 바뀝니다. 채널 키는 slug 처리된 이름(`#` 없음)을 사용합니다. guild ID 사용을 권장합니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`는 이를 활성화하며, `allowBots: "mentions"`를 사용하면 봇을 멘션한 봇 메시지만 허용합니다(자신의 메시지는 여전히 필터링됨).
- `channels.discord.guilds.<id>.ignoreOtherMentions`(및 채널 재정의)는 봇이 아닌 다른 사용자나 역할을 멘션한 메시지를 삭제합니다(`@everyone`/`@here` 제외).
- `maxLinesPerMessage`(기본값 17)는 2000자 미만이라도 세로로 긴 메시지를 분할합니다.
- `channels.discord.threadBindings`는 Discord 스레드 바인딩 라우팅을 제어합니다.
  - `enabled`: 스레드 바인딩 세션 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 바인딩된 전달/라우팅)에 대한 Discord 재정의
  - `idleHours`: 비활성 자동 unfocus 시간에 대한 Discord 재정의(`0`은 비활성화)
  - `maxAgeHours`: 하드 최대 기간 시간에 대한 Discord 재정의(`0`은 비활성화)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })`의 자동 스레드 생성/바인딩을 위한 옵트인 스위치
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 채널과 스레드에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 채널/스레드 ID 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
- `channels.discord.ui.components.accentColor`는 Discord components v2 컨테이너의 강조 색상을 설정합니다.
- `channels.discord.voice`는 Discord 음성 채널 대화와 선택적 자동 참여 + TTS 재정의를 활성화합니다.
- `channels.discord.voice.daveEncryption`과 `channels.discord.voice.decryptionFailureTolerance`는 `@discordjs/voice` DAVE 옵션으로 그대로 전달됩니다(기본값 `true` 및 `24`).
- OpenClaw는 반복적인 복호화 실패 후 음성 세션을 나갔다가 다시 참여함으로써 음성 수신 복구도 시도합니다.
- `channels.discord.streaming`이 정규 스트림 모드 키입니다. 레거시 `streamMode`와 boolean `streaming` 값은 자동 마이그레이션됩니다.
- `channels.discord.autoPresence`는 런타임 가용성을 봇 presence로 매핑합니다(정상 => online, 저하 => idle, 소진 => dnd) 그리고 선택적인 상태 텍스트 재정의를 허용합니다.
- `channels.discord.dangerouslyAllowNameMatching`는 변경 가능한 이름/태그 매칭을 다시 활성화합니다(비상 호환 모드).
- `channels.discord.execApprovals`: Discord 네이티브 exec 승인 전달 및 승인자 권한 부여.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 해석할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Discord 사용자 ID. 생략하면 `commands.ownerAllowFrom`으로 폴백합니다.
  - `agentFilter`: 선택적 에이전트 ID 허용 목록. 생략하면 모든 에이전트의 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치. `"dm"`(기본값)은 승인자 DM으로, `"channel"`은 원래 채널로, `"both"`는 둘 다로 보냅니다. target에 `"channel"`이 포함되면 버튼은 해석된 승인자만 사용할 수 있습니다.
  - `cleanupAfterResolve`: `true`이면 승인, 거부 또는 타임아웃 후 승인 DM을 삭제합니다.

**반응 알림 모드:** `off`(없음), `own`(봇 메시지, 기본값), `all`(모든 메시지), `allowlist`(`guilds.<id>.users`의 모든 메시지 기준).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- 서비스 계정 JSON: 인라인(`serviceAccount`) 또는 파일 기반(`serviceAccountFile`).
- 서비스 계정 SecretRef도 지원됩니다(`serviceAccountRef`).
- env 폴백: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- 전달 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용하세요.
- `channels.googlechat.dangerouslyAllowNameMatching`는 변경 가능한 이메일 principal 매칭을 다시 활성화합니다(비상 호환 모드).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial일 때 Slack 네이티브 스트리밍 API 사용
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode**는 `botToken`과 `appToken` 둘 다 필요합니다(기본 계정 env 폴백은 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP mode**는 `botToken`과 `signingSecret`(루트 또는 계정별) 필요합니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 받을 수 있습니다.
- Slack 계정 스냅샷은 `botTokenSource`, `botTokenStatus`, `appTokenStatus`, 그리고 HTTP 모드의 경우
  `signingSecretStatus` 같은 자격 증명별 소스/상태 필드를 노출합니다.
  `configured_unavailable`은 계정이
  SecretRef를 통해 구성되어 있지만 현재 명령/런타임 경로에서
  비밀 값을 해석할 수 없었음을 의미합니다.
- `configWrites: false`는 Slack에서 시작된 config 쓰기를 차단합니다.
- 선택적 `channels.slack.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- `channels.slack.streaming.mode`가 정규 Slack 스트림 모드 키입니다. `channels.slack.streaming.nativeTransport`는 Slack의 네이티브 스트리밍 전송을 제어합니다. 레거시 `streamMode`, boolean `streaming`, `nativeStreaming` 값은 자동 마이그레이션됩니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하세요.

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 기준).

**스레드 세션 격리:** `thread.historyScope`는 스레드별(기본값) 또는 채널 전체 공유입니다. `thread.inheritParent`는 새 스레드에 부모 채널 transcript를 복사합니다.

- Slack 네이티브 스트리밍과 Slack assistant 스타일의 "is typing..." 스레드 상태는 응답 스레드 대상이 필요합니다. 최상위 DM은 기본적으로 스레드 밖에 머무르므로, 스레드 스타일 미리보기 대신 `typingReaction` 또는 일반 전달을 사용합니다.
- `typingReaction`은 응답이 실행 중인 동안 인바운드 Slack 메시지에 임시 반응을 추가하고 완료 시 제거합니다. `"hourglass_flowing_sand"` 같은 Slack 이모지 shortcode를 사용하세요.
- `channels.slack.execApprovals`: Slack 네이티브 exec 승인 전달 및 승인자 권한 부여. Discord와 동일한 스키마: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack 사용자 ID), `agentFilter`, `sessionFilter`, `target` (`"dm"`, `"channel"`, 또는 `"both"`).

| 작업 그룹   | 기본값   | 참고                    |
| ----------- | -------- | ----------------------- |
| reactions   | 활성화   | 반응 추가 + 반응 목록   |
| messages    | 활성화   | 읽기/전송/편집/삭제     |
| pins        | 활성화   | 고정/고정 해제/목록     |
| memberInfo  | 활성화   | 멤버 정보               |
| emojiList   | 활성화   | 사용자 지정 이모지 목록 |

### Mattermost

Mattermost는 Plugin으로 제공됩니다: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // 옵트인
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 리버스 프록시/공개 배포용 선택적 명시 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@-mention 시 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 접두사로 시작하는 메시지).

Mattermost 네이티브 명령이 활성화된 경우:

- `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
- `commands.callbackUrl`은 OpenClaw gateway 엔드포인트로 해석되어야 하며 Mattermost 서버에서 접근 가능해야 합니다.
- 네이티브 슬래시 콜백은 슬래시 명령 등록 중 Mattermost가 반환한 명령별 토큰으로 인증됩니다. 등록에 실패하거나 활성화된 명령이 없으면 OpenClaw는
  `Unauthorized: invalid command token.`으로 콜백을 거부합니다.
- private/tailnet/internal callback 호스트의 경우 Mattermost는
  `ServiceSettings.AllowedUntrustedInternalConnections`에 callback 호스트/도메인이 포함되어야 할 수 있습니다.
  전체 URL이 아니라 호스트/도메인 값을 사용하세요.
- `channels.mattermost.configWrites`: Mattermost에서 시작된 config 쓰기 허용 또는 거부.
- `channels.mattermost.requireMention`: 채널에서 응답 전에 `@mention` 필요.
- `channels.mattermost.groups.<channelId>.requireMention`: 채널별 멘션 게이팅 재정의(기본값은 `"*"`).
- 선택적 `channels.mattermost.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 선택적 계정 바인딩
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 기준).

- `channels.signal.account`: 채널 시작을 특정 Signal 계정 ID에 고정합니다.
- `channels.signal.configWrites`: Signal에서 시작된 config 쓰기를 허용하거나 거부합니다.
- 선택적 `channels.signal.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

### BlueBubbles

BlueBubbles는 권장되는 iMessage 경로입니다(Plugin 기반, `channels.bluebubbles` 아래에서 구성).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, 그룹 제어, 고급 작업:
      // /channels/bluebubbles 참조
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- 선택적 `channels.bluebubbles.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 BlueBubbles 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 BlueBubbles handle 또는 대상 문자열(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공유 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).
- 전체 BlueBubbles 채널 구성은 [BlueBubbles](/ko/channels/bluebubbles)에 문서화되어 있습니다.

### iMessage

OpenClaw는 `imsg rpc`(stdio 위의 JSON-RPC)를 실행합니다. daemon이나 포트가 필요하지 않습니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- 선택적 `channels.imessage.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

- Messages DB에 대한 Full Disk Access가 필요합니다.
- `chat_id:<id>` 대상을 권장합니다. 채팅 목록은 `imsg chats --limit 20`으로 확인하세요.
- `cliPath`는 SSH wrapper를 가리킬 수 있습니다. SCP 첨부 파일 가져오기를 위해 `remoteHost`(`host` 또는 `user@host`)를 설정하세요.
- `attachmentRoots`와 `remoteAttachmentRoots`는 인바운드 첨부 파일 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).
- SCP는 엄격한 host-key 검사를 사용하므로, relay 호스트 키가 이미 `~/.ssh/known_hosts`에 존재해야 합니다.
- `channels.imessage.configWrites`: iMessage에서 시작된 config 쓰기를 허용하거나 거부합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 iMessage 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 정규화된 handle 또는 명시적 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공유 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH wrapper 예시">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix는 Plugin 기반이며 `channels.matrix` 아래에서 구성합니다.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- 토큰 인증은 `accessToken`을 사용하고, 비밀번호 인증은 `userId` + `password`를 사용합니다.
- `channels.matrix.proxy`는 Matrix HTTP 트래픽을 명시적 HTTP(S) 프록시를 통해 라우팅합니다. 이름 지정 계정은 `channels.matrix.accounts.<id>.proxy`로 이를 재정의할 수 있습니다.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`는 private/internal homeserver를 허용합니다. `proxy`와 이 네트워크 옵트인은 서로 독립적인 제어입니다.
- `channels.matrix.defaultAccount`는 멀티 계정 설정에서 선호 계정을 선택합니다.
- `channels.matrix.autoJoin`의 기본값은 `off`이므로, `autoJoin: "allowlist"`와 `autoJoinAllowlist` 또는 `autoJoin: "always"`를 설정하기 전까지 초대된 방과 새로운 DM 스타일 초대는 무시됩니다.
- `channels.matrix.execApprovals`: Matrix 네이티브 exec 승인 전달 및 승인자 권한 부여.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 해석할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(예: `@owner:example.org`).
  - `agentFilter`: 선택적 에이전트 ID 허용 목록. 생략하면 모든 에이전트의 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치. `"dm"`(기본값), `"channel"`(원래 방), 또는 `"both"`.
  - 계정별 재정의: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`는 Matrix DM이 세션으로 그룹화되는 방식을 제어합니다. `per-user`(기본값)는 라우팅된 상대방 기준으로 공유하고, `per-room`은 각 DM 방을 격리합니다.
- Matrix 상태 probe와 실시간 디렉터리 조회는 런타임 트래픽과 동일한 프록시 정책을 사용합니다.
- 전체 Matrix 구성, 대상 지정 규칙, 설정 예시는 [Matrix](/ko/channels/matrix)에 문서화되어 있습니다.

### Microsoft Teams

Microsoft Teams는 Plugin 기반이며 `channels.msteams` 아래에서 구성합니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, 팀/채널 정책:
      // /channels/msteams 참조
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`.
- 전체 Teams config(자격 증명, webhook, DM/그룹 정책, 팀별/채널별 재정의)는 [Microsoft Teams](/ko/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 Plugin 기반이며 `channels.irc` 아래에서 구성합니다.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- 선택적 `channels.irc.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전체 IRC 채널 구성(host/port/TLS/channels/allowlists/멘션 게이팅)은 [IRC](/ko/channels/irc)에 문서화되어 있습니다.

### 멀티 계정(모든 채널)

채널별로 여러 계정을 실행합니다(각각 고유한 `accountId` 사용).

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default`는 `accountId`를 생략했을 때 사용됩니다(CLI + 라우팅).
- env 토큰은 **기본** 계정에만 적용됩니다.
- 기본 채널 설정은 계정별로 재정의하지 않는 한 모든 계정에 적용됩니다.
- 각 계정을 다른 에이전트로 라우팅하려면 `bindings[].match.accountId`를 사용하세요.
- `openclaw channels add`(또는 채널 온보딩)를 통해 non-default 계정을 추가할 때 여전히 단일 계정 최상위 채널 config를 사용 중이면, OpenClaw는 먼저 계정 범위 최상위 단일 계정 값을 채널 계정 맵으로 승격하여 원래 계정이 계속 동작하도록 합니다. 대부분의 채널은 이를 `channels.<channel>.accounts.default`로 이동합니다. Matrix는 대신 기존의 일치하는 이름 지정/default 대상을 보존할 수 있습니다.
- 기존 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치하며, 계정 범위 바인딩은 여전히 선택 사항입니다.
- `openclaw doctor --fix`도 계정 범위 최상위 단일 계정 값을 해당 채널에 대해 선택된 승격 계정으로 이동해 혼합된 형태를 복구합니다. 대부분의 채널은 `accounts.default`를 사용합니다. Matrix는 대신 기존의 일치하는 이름 지정/default 대상을 보존할 수 있습니다.

### 기타 Plugin 채널

많은 Plugin 채널은 `channels.<id>`로 구성되며 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch).
전체 채널 인덱스는 [Channels](/ko/channels)를 참조하세요.

### 그룹 채팅 멘션 게이팅

그룹 메시지는 기본적으로 **멘션 필요**입니다(메타데이터 멘션 또는 안전한 정규식 패턴). 이는 WhatsApp, Telegram, Discord, Google Chat, iMessage 그룹 채팅에 적용됩니다.

**멘션 유형:**

- **메타데이터 멘션**: 네이티브 플랫폼 @-멘션. WhatsApp self-chat 모드에서는 무시됩니다.
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 안전한 정규식 패턴. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 멘션 게이팅은 감지가 가능한 경우(네이티브 멘션 또는 최소 하나의 패턴)에서만 강제됩니다.

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`는 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`(또는 계정별)로 이를 재정의할 수 있습니다. 비활성화하려면 `0`으로 설정하세요.

#### DM 기록 제한

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

해결 순서: DM별 재정의 → provider 기본값 → 제한 없음(모두 유지).

지원됨: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### self-chat 모드

자기 자신의 번호를 `allowFrom`에 포함하면 self-chat 모드가 활성화됩니다(네이티브 @-멘션은 무시하고 텍스트 패턴에만 응답).

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 명령(채팅 명령 처리)

```json5
{
  commands: {
    native: "auto", // 지원되는 경우 네이티브 명령 등록
    nativeSkills: "auto", // 지원되는 경우 네이티브 skill 명령 등록
    text: true, // 채팅 메시지에서 /commands 파싱
    bash: false, // ! 허용(별칭: /bash)
    bashForegroundMs: 2000,
    config: false, // /config 허용
    mcp: false, // /mcp 허용
    plugins: false, // /plugins 허용
    debug: false, // /debug 허용
    restart: true, // /restart + gateway restart tool 허용
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="명령 세부 정보">

- 이 블록은 명령 표면을 구성합니다. 현재 내장 + 번들 명령 카탈로그는 [Slash Commands](/ko/tools/slash-commands)를 참조하세요.
- 이 페이지는 **config 키 참조**이며 전체 명령 카탈로그가 아닙니다. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, Talk `/voice` 같은 채널/Plugin 소유 명령은 해당 채널/Plugin 페이지와 [Slash Commands](/ko/tools/slash-commands)에 문서화되어 있습니다.
- 텍스트 명령은 앞에 `/`가 있는 **독립 실행형** 메시지여야 합니다.
- `native: "auto"`는 Discord/Telegram의 네이티브 명령을 켜고 Slack은 꺼 둡니다.
- `nativeSkills: "auto"`는 Discord/Telegram의 네이티브 skill 명령을 켜고 Slack은 꺼 둡니다.
- 채널별 재정의: `channels.discord.commands.native`(bool 또는 `"auto"`). `false`는 이전에 등록된 명령을 제거합니다.
- 네이티브 skill 등록은 `channels.<provider>.commands.nativeSkills`로 채널별 재정의할 수 있습니다.
- `channels.telegram.customCommands`는 추가 Telegram 봇 메뉴 항목을 추가합니다.
- `bash: true`는 호스트 셸용 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`가 필요하고, 발신자가 `tools.elevated.allowFrom.<channel>`에 있어야 합니다.
- `config: true`는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). gateway `chat.send` 클라이언트의 경우 영구적인 `/config set|unset` 쓰기에는 `operator.admin`도 필요합니다. 읽기 전용 `/config show`는 일반 쓰기 범위 operator 클라이언트에서 계속 사용할 수 있습니다.
- `mcp: true`는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 config에 대해 `/mcp`를 활성화합니다.
- `plugins: true`는 Plugin 검색, 설치, 활성화/비활성화 제어를 위한 `/plugins`를 활성화합니다.
- `channels.<provider>.configWrites`는 채널별 config 변경을 제어합니다(기본값: true).
- 멀티 계정 채널의 경우 `channels.<provider>.accounts.<id>.configWrites`도 해당 계정을 대상으로 하는 쓰기를 제어합니다(예: `/allowlist --config --account <id>` 또는 `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`는 `/restart`와 gateway restart tool 작업을 비활성화합니다. 기본값: `true`.
- `ownerAllowFrom`은 owner 전용 명령/도구를 위한 명시적 소유자 허용 목록입니다. 이는 `allowFrom`과 별개입니다.
- `ownerDisplay: "hash"`는 시스템 프롬프트에서 소유자 ID를 해시합니다. 해시를 제어하려면 `ownerDisplaySecret`을 설정하세요.
- `allowFrom`은 provider별입니다. 이것이 설정되면 **유일한** 권한 부여 소스가 됩니다(채널 허용 목록/페어링과 `useAccessGroups`는 무시됨).
- `useAccessGroups: false`는 `allowFrom`이 설정되지 않았을 때 명령이 access-group 정책을 우회하도록 허용합니다.
- 명령 문서 맵:
  - 내장 + 번들 카탈로그: [Slash Commands](/ko/tools/slash-commands)
  - 채널별 명령 표면: [Channels](/ko/channels)
  - QQ Bot 명령: [QQ Bot](/ko/channels/qqbot)
  - 페어링 명령: [Pairing](/ko/channels/pairing)
  - LINE 카드 명령: [LINE](/ko/channels/line)
  - memory Dreaming: [Dreaming](/ko/concepts/dreaming)

</Accordion>

---

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference) — 최상위 키
- [구성 — 에이전트](/ko/gateway/config-agents)
- [채널 개요](/ko/channels)
