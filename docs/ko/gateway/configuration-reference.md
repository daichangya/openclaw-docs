---
read_when:
    - 정확한 필드 수준의 config 의미 또는 기본값이 필요합니다
    - 채널, 모델, gateway 또는 도구 config 블록을 검증하고 있습니다
summary: 모든 OpenClaw config 키, 기본값, 채널 설정에 대한 완전한 참조
title: Configuration Reference
x-i18n:
    generated_at: "2026-04-08T02:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c7991b948cbbb7954a3e26280089ab00088e7f4878ec0b0540c3c9acf222ebb
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Configuration Reference

`~/.openclaw/openclaw.json`에서 사용할 수 있는 모든 필드입니다. 작업 중심 개요는 [Configuration](/ko/gateway/configuration)을 참고하세요.

Config 형식은 **JSON5**입니다(주석 + 후행 쉼표 허용). 모든 필드는 선택 사항이며, 생략하면 OpenClaw가 안전한 기본값을 사용합니다.

---

## 채널

각 채널은 config 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`가 아닌 경우).

### DM 및 그룹 접근

모든 채널은 DM 정책과 그룹 정책을 지원합니다.

| DM 정책              | 동작                                                            |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (기본값)   | 알 수 없는 발신자는 일회성 페어링 코드를 받으며, 소유자가 승인해야 함 |
| `allowlist`          | `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용             |
| `open`               | 모든 인바운드 DM 허용(`allowFrom: ["*"]` 필요)                  |
| `disabled`           | 모든 인바운드 DM 무시                                           |

| 그룹 정책              | 동작                                                     |
| ---------------------- | -------------------------------------------------------- |
| `allowlist` (기본값)   | 구성된 allowlist와 일치하는 그룹만 허용                  |
| `open`                 | 그룹 allowlist 우회(여전히 멘션 게이팅은 적용됨)         |
| `disabled`             | 모든 그룹/룸 메시지 차단                                 |

<Note>
`channels.defaults.groupPolicy`는 provider의 `groupPolicy`가 설정되지 않았을 때 기본값을 설정합니다.
페어링 코드는 1시간 후 만료됩니다. 대기 중인 DM 페어링 요청은 **채널당 3개**로 제한됩니다.
provider 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 런타임 그룹 정책은 시작 경고와 함께 `allowlist`(fail-closed)로 대체됩니다.
</Note>

### 채널 모델 재정의

`channels.modelByChannel`을 사용해 특정 채널 ID를 모델에 고정할 수 있습니다. 값은 `provider/model` 또는 구성된 모델 별칭을 받습니다. 채널 매핑은 세션에 아직 모델 재정의가 없을 때 적용됩니다(예: `/model`로 설정된 경우).

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

### 채널 기본값 및 heartbeat

provider 전반에서 공유되는 그룹 정책과 heartbeat 동작에는 `channels.defaults`를 사용하세요.

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

- `channels.defaults.groupPolicy`: provider 수준 `groupPolicy`가 설정되지 않은 경우의 대체 그룹 정책입니다.
- `channels.defaults.contextVisibility`: 모든 채널의 기본 보조 컨텍스트 표시 모드입니다. 값: `all`(기본값, 인용/스레드/기록 컨텍스트 전체 포함), `allowlist`(allowlist된 발신자의 컨텍스트만 포함), `allowlist_quote`(allowlist와 같지만 명시적 인용/답글 컨텍스트 유지). 채널별 재정의: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: heartbeat 출력에 정상 채널 상태를 포함합니다.
- `channels.defaults.heartbeat.showAlerts`: heartbeat 출력에 저하/오류 상태를 포함합니다.
- `channels.defaults.heartbeat.useIndicator`: 간결한 표시기 스타일 heartbeat 출력을 렌더링합니다.

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
      sendReadReceipts: true, // 파란 체크 표시(셀프 채팅 모드에서는 false)
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

- 아웃바운드 명령은 `default` 계정이 있으면 기본적으로 그 계정을 사용하고, 없으면 첫 번째로 구성된 계정 ID(정렬 기준)를 사용합니다.
- 선택적 `channels.whatsapp.defaultAccount`는 구성된 계정 ID와 일치할 때 이 대체 기본 계정 선택을 재정의합니다.
- 레거시 단일 계정 Baileys auth 디렉터리는 `openclaw doctor`에 의해 `whatsapp/default`로 마이그레이션됩니다.
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
      streaming: "partial", // off | partial | block | progress (기본값: off, 미리보기-편집 속도 제한을 피하려면 명시적으로 opt in)
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

- 봇 토큰: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`(일반 파일만 허용, symlink는 거부), 기본 계정의 대체값으로 `TELEGRAM_BOT_TOKEN`도 사용됩니다.
- 선택적 `channels.telegram.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 멀티 계정 설정(계정 ID 2개 이상)에서는 대체 라우팅을 피하기 위해 명시적 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하세요. 누락되었거나 잘못되었으면 `openclaw doctor`가 경고합니다.
- `configWrites: false`는 Telegram에서 시작된 config 쓰기(슈퍼그룹 ID 마이그레이션, `/config set|unset`)를 차단합니다.
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 포럼 토픽에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에는 정규화된 `chatId:topic:topicId` 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공통으로 설명합니다.
- Telegram 스트림 미리보기는 `sendMessage` + `editMessageText`를 사용합니다(직접 채팅과 그룹 채팅 모두에서 동작).
- 재시도 정책: [Retry policy](/ko/concepts/retry)를 참고하세요.

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
        spawnSubagentSessions: false, // `sessions_spawn({ thread: true })`를 위한 opt-in
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

- 토큰: `channels.discord.token`, 기본 계정의 대체값으로 `DISCORD_BOT_TOKEN`도 사용됩니다.
- 명시적인 Discord `token`을 제공하는 직접 아웃바운드 호출은 해당 토큰을 호출에 사용하지만, 계정 재시도/정책 설정은 활성 런타임 스냅샷에서 선택된 계정에서 계속 가져옵니다.
- 선택적 `channels.discord.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(guild 채널)를 사용하세요. 숫자 ID 단독 사용은 거부됩니다.
- guild slug는 소문자이며 공백은 `-`로 대체됩니다. 채널 키는 slug 처리된 이름(`#` 없음)을 사용합니다. 가능하면 guild ID를 선호하세요.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`로 허용할 수 있으며, `allowBots: "mentions"`를 사용하면 봇을 멘션한 봇 메시지만 허용합니다(자기 자신의 메시지는 계속 필터링됨).
- `channels.discord.guilds.<id>.ignoreOtherMentions`(및 채널 재정의)는 봇을 멘션하지 않고 다른 사용자나 역할을 멘션한 메시지를 삭제합니다(@everyone/@here 제외).
- `maxLinesPerMessage`(기본값 17)는 2000자 미만이어도 긴 메시지를 분할합니다.
- `channels.discord.threadBindings`는 Discord 스레드 바운드 라우팅을 제어합니다.
  - `enabled`: 스레드 바운드 세션 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 그리고 바운드 전달/라우팅)에 대한 Discord 재정의
  - `idleHours`: 비활동 자동 unfocus의 시간 단위 Discord 재정의(`0`은 비활성화)
  - `maxAgeHours`: 하드 최대 사용 기간의 시간 단위 Discord 재정의(`0`은 비활성화)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 자동 스레드 생성/바인딩을 위한 opt-in 스위치
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 채널 및 스레드에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 channel/thread id 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공통으로 설명합니다.
- `channels.discord.ui.components.accentColor`는 Discord components v2 컨테이너의 강조 색상을 설정합니다.
- `channels.discord.voice`는 Discord 음성 채널 대화와 선택적 자동 참가 + TTS 재정의를 활성화합니다.
- `channels.discord.voice.daveEncryption` 및 `channels.discord.voice.decryptionFailureTolerance`는 `@discordjs/voice` DAVE 옵션으로 그대로 전달됩니다(기본값 `true`와 `24`).
- OpenClaw는 추가로 반복적인 복호화 실패 후 음성 세션에서 나갔다가 다시 들어오는 방식으로 음성 수신 복구를 시도합니다.
- `channels.discord.streaming`은 정식 스트림 모드 키입니다. 레거시 `streamMode`와 boolean `streaming` 값은 자동 마이그레이션됩니다.
- `channels.discord.autoPresence`는 런타임 가용성을 봇 존재 상태에 매핑합니다(healthy => online, degraded => idle, exhausted => dnd). 선택적으로 상태 텍스트 재정의도 가능합니다.
- `channels.discord.dangerouslyAllowNameMatching`는 변경 가능한 이름/태그 매칭을 다시 활성화합니다(break-glass 호환 모드).
- `channels.discord.execApprovals`: Discord 네이티브 exec 승인 전달 및 승인자 권한 부여.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 해석할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Discord 사용자 ID입니다. 생략하면 `commands.ownerAllowFrom`을 대체값으로 사용합니다.
  - `agentFilter`: 선택적 agent ID allowlist입니다. 생략하면 모든 agent에 대한 승인이 전달됩니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 regex).
  - `target`: 승인 프롬프트를 보낼 위치입니다. `"dm"`(기본값)은 승인자 DM으로, `"channel"`은 원래 채널로, `"both"`는 둘 다 보냅니다. target에 `"channel"`이 포함되면 버튼은 해석된 승인자만 사용할 수 있습니다.
  - `cleanupAfterResolve`: `true`이면 승인, 거절 또는 타임아웃 후 승인 DM을 삭제합니다.

**반응 알림 모드:** `off`(없음), `own`(봇 메시지, 기본값), `all`(모든 메시지), `allowlist`(모든 메시지에서 `guilds.<id>.users` 기준).

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

- 서비스 계정 JSON: 인라인(`serviceAccount`) 또는 파일 기반(`serviceAccountFile`)입니다.
- 서비스 계정 SecretRef도 지원됩니다(`serviceAccountRef`).
- 환경 변수 대체값: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- 전달 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용하세요.
- `channels.googlechat.dangerouslyAllowNameMatching`는 변경 가능한 이메일 principal 매칭을 다시 활성화합니다(break-glass 호환 모드).

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
      streaming: "partial", // off | partial | block | progress (미리보기 모드)
      nativeStreaming: true, // streaming=partial일 때 Slack 네이티브 스트리밍 API 사용
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

- **Socket mode**에는 `botToken`과 `appToken`이 모두 필요합니다(기본 계정 환경 변수 대체값으로 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP mode**에는 `botToken`과 `signingSecret`(루트 또는 계정별)이 필요합니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 받을 수 있습니다.
- Slack 계정 스냅샷은
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, HTTP mode에서는
  `signingSecretStatus` 같은 자격 증명별 source/status 필드를 노출합니다.
  `configured_unavailable`은 해당 계정이
  SecretRef를 통해 구성되었지만 현재 명령/런타임 경로에서는
  비밀 값이 해석되지 않았음을 의미합니다.
- `configWrites: false`는 Slack에서 시작된 config 쓰기를 차단합니다.
- 선택적 `channels.slack.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- `channels.slack.streaming`은 정식 스트림 모드 키입니다. 레거시 `streamMode`와 boolean `streaming` 값은 자동 마이그레이션됩니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하세요.

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 기준).

**스레드 세션 격리:** `thread.historyScope`는 스레드별(기본값) 또는 채널 전체 공유입니다. `thread.inheritParent`는 부모 채널 전사를 새 스레드로 복사합니다.

- `typingReaction`은 답변 실행 중 인바운드 Slack 메시지에 임시 반응을 추가하고, 완료 시 제거합니다. `"hourglass_flowing_sand"` 같은 Slack 이모지 shortcode를 사용하세요.
- `channels.slack.execApprovals`: Slack 네이티브 exec 승인 전달 및 승인자 권한 부여. Discord와 동일한 스키마입니다: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack 사용자 ID), `agentFilter`, `sessionFilter`, `target` (`"dm"`, `"channel"`, `"both"`).

| 작업 그룹   | 기본값  | 참고                   |
| ------------ | ------- | ---------------------- |
| reactions    | 활성화됨 | 반응 + 반응 목록       |
| messages     | 활성화됨 | 읽기/보내기/편집/삭제  |
| pins         | 활성화됨 | 고정/고정 해제/목록    |
| memberInfo   | 활성화됨 | 멤버 정보              |
| emojiList    | 활성화됨 | 사용자 지정 이모지 목록 |

### Mattermost

Mattermost는 plugin으로 제공됩니다: `openclaw plugins install @openclaw/mattermost`.

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
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 리버스 프록시/공개 배포를 위한 선택적 명시적 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@-mention 시 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 접두사로 시작하는 메시지).

Mattermost 네이티브 명령이 활성화되면:

- `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
- `commands.callbackUrl`은 OpenClaw gateway 엔드포인트로 해석되어야 하며 Mattermost 서버에서 도달 가능해야 합니다.
- 네이티브 슬래시 callback은 슬래시 명령 등록 중 Mattermost가 반환한 명령별 토큰으로 인증됩니다. 등록에 실패하거나 활성화된 명령이 없으면 OpenClaw는 callback을
  `Unauthorized: invalid command token.`으로 거부합니다.
- 비공개/tailnet/내부 callback 호스트의 경우 Mattermost는
  `ServiceSettings.AllowedUntrustedInternalConnections`에 callback 호스트/도메인이 포함되도록 요구할 수 있습니다.
  전체 URL이 아니라 호스트/도메인 값을 사용하세요.
- `channels.mattermost.configWrites`: Mattermost에서 시작된 config 쓰기를 허용하거나 거부합니다.
- `channels.mattermost.requireMention`: 채널에서 답변하기 전에 `@mention`을 요구합니다.
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

- `channels.signal.account`: 채널 시작을 특정 Signal 계정 식별자로 고정합니다.
- `channels.signal.configWrites`: Signal에서 시작된 config 쓰기를 허용하거나 거부합니다.
- 선택적 `channels.signal.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

### BlueBubbles

BlueBubbles는 권장되는 iMessage 경로입니다(plugin 기반, `channels.bluebubbles` 아래에 구성).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, 고급 actions:
      // /channels/bluebubbles 참고
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- 선택적 `channels.bluebubbles.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 BlueBubbles 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 BlueBubbles handle 또는 대상 문자열(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공통 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).
- 전체 BlueBubbles 채널 구성은 [BlueBubbles](/ko/channels/bluebubbles)에 문서화되어 있습니다.

### iMessage

OpenClaw는 `imsg rpc`(stdio를 통한 JSON-RPC)를 실행합니다. daemon이나 포트는 필요하지 않습니다.

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
- `attachmentRoots` 및 `remoteAttachmentRoots`는 인바운드 첨부 파일 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).
- SCP는 엄격한 host-key 확인을 사용하므로, relay 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
- `channels.imessage.configWrites`: iMessage에서 시작된 config 쓰기를 허용하거나 거부합니다.
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 iMessage 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 정규화된 handle 또는 명시적 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공통 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH wrapper 예시">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix는 extension 기반이며 `channels.matrix` 아래에 구성됩니다.

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

- 토큰 인증은 `accessToken`을, 비밀번호 인증은 `userId` + `password`를 사용합니다.
- `channels.matrix.proxy`는 Matrix HTTP 트래픽을 명시적인 HTTP(S) 프록시를 통해 라우팅합니다. 이름이 있는 계정은 `channels.matrix.accounts.<id>.proxy`로 이를 재정의할 수 있습니다.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`는 비공개/내부 homeserver를 허용합니다. `proxy`와 이 네트워크 opt-in은 서로 독립적인 제어입니다.
- `channels.matrix.defaultAccount`는 멀티 계정 설정에서 선호 계정을 선택합니다.
- `channels.matrix.autoJoin`의 기본값은 `off`이므로, `autoJoin: "allowlist"`와 `autoJoinAllowlist` 또는 `autoJoin: "always"`를 설정하기 전까지 초대된 룸과 새로운 DM 스타일 초대는 무시됩니다.
- `channels.matrix.execApprovals`: Matrix 네이티브 exec 승인 전달 및 승인자 권한 부여.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 해석할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(예: `@owner:example.org`)입니다.
  - `agentFilter`: 선택적 agent ID allowlist입니다. 생략하면 모든 agent에 대한 승인이 전달됩니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 regex).
  - `target`: 승인 프롬프트를 보낼 위치입니다. `"dm"`(기본값), `"channel"`(원래 room), 또는 `"both"`.
  - 계정별 재정의: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`는 Matrix DM이 세션으로 묶이는 방식을 제어합니다: `per-user`(기본값)는 라우팅된 peer 기준으로 공유하고, `per-room`은 각 DM room을 분리합니다.
- Matrix 상태 probe와 실시간 directory 조회는 런타임 트래픽과 동일한 프록시 정책을 사용합니다.
- 전체 Matrix 구성, 대상 지정 규칙, 설정 예시는 [Matrix](/ko/channels/matrix)에 문서화되어 있습니다.

### Microsoft Teams

Microsoft Teams는 extension 기반이며 `channels.msteams` 아래에 구성됩니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel 정책:
      // /channels/msteams 참고
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`.
- 전체 Teams config(자격 증명, webhook, DM/그룹 정책, 팀별/채널별 재정의)는 [Microsoft Teams](/ko/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 extension 기반이며 `channels.irc` 아래에 구성됩니다.

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

채널당 여러 계정을 실행할 수 있습니다(각각 고유한 `accountId` 사용).

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

- `accountId`가 생략되면 `default`가 사용됩니다(CLI + 라우팅).
- 환경 변수 토큰은 **default** 계정에만 적용됩니다.
- 기본 채널 설정은 계정별로 재정의되지 않는 한 모든 계정에 적용됩니다.
- 각 계정을 서로 다른 agent로 라우팅하려면 `bindings[].match.accountId`를 사용하세요.
- 단일 계정 최상위 채널 config 상태에서 `openclaw channels add`(또는 채널 온보딩)를 통해 non-default 계정을 추가하면, OpenClaw는 먼저 계정 범위의 최상위 단일 계정 값을 채널 계정 맵으로 승격해 원래 계정이 계속 동작하게 합니다. 대부분의 채널은 이를 `channels.<channel>.accounts.default`로 옮기고, Matrix는 대신 기존의 일치하는 named/default 대상을 유지할 수 있습니다.
- 기존의 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치하며, 계정 범위 바인딩은 여전히 선택 사항입니다.
- `openclaw doctor --fix`도 혼합된 형태를 복구하여, 해당 채널에 대해 선택된 승격 계정으로 계정 범위 최상위 단일 계정 값을 이동합니다. 대부분의 채널은 `accounts.default`를 사용하고, Matrix는 기존의 일치하는 named/default 대상을 유지할 수 있습니다.

### 기타 extension 채널

많은 extension 채널은 `channels.<id>`로 구성되며 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch).
전체 채널 색인은 [Channels](/ko/channels)를 참고하세요.

### 그룹 채팅 멘션 게이팅

그룹 메시지는 기본적으로 **멘션 필요**입니다(메타데이터 멘션 또는 안전한 regex 패턴). WhatsApp, Telegram, Discord, Google Chat, iMessage 그룹 채팅에 적용됩니다.

**멘션 유형:**

- **메타데이터 멘션**: 플랫폼 네이티브 @-멘션. WhatsApp 셀프 채팅 모드에서는 무시됩니다.
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 안전한 regex 패턴입니다. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 멘션 게이팅은 감지가 가능한 경우에만 적용됩니다(네이티브 멘션 또는 최소 1개의 패턴).

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

`messages.groupChat.historyLimit`은 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`(또는 계정별)로 재정의할 수 있습니다. 비활성화하려면 `0`으로 설정하세요.

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

지원 대상: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### 셀프 채팅 모드

자신의 번호를 `allowFrom`에 포함하면 셀프 채팅 모드가 활성화됩니다(네이티브 @-멘션은 무시하고 텍스트 패턴에만 응답).

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
    text: true, // 채팅 메시지에서 /commands 파싱
    bash: false, // ! 허용(별칭: /bash)
    bashForegroundMs: 2000,
    config: false, // /config 허용
    debug: false, // /debug 허용
    restart: false, // /restart + gateway 재시작 도구 허용
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="명령 세부 사항">

- 텍스트 명령은 앞에 `/`가 있는 **독립 실행형** 메시지여야 합니다.
- `native: "auto"`는 Discord/Telegram의 네이티브 명령을 켜고, Slack은 끈 상태로 둡니다.
- 채널별 재정의: `channels.discord.commands.native` (bool 또는 `"auto"`). `false`는 이전에 등록된 명령을 제거합니다.
- `channels.telegram.customCommands`는 추가 Telegram 봇 메뉴 항목을 더합니다.
- `bash: true`는 호스트 셸용 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`가 필요하며, 발신자가 `tools.elevated.allowFrom.<channel>`에 있어야 합니다.
- `config: true`는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). gateway `chat.send` 클라이언트의 경우 영구 `/config set|unset` 쓰기에는 `operator.admin`도 필요합니다. 읽기 전용 `/config show`는 일반 write 범위 operator 클라이언트에서도 계속 사용할 수 있습니다.
- `channels.<provider>.configWrites`는 채널별 config 변경을 제어합니다(기본값: true).
- 멀티 계정 채널에서는 `channels.<provider>.accounts.<id>.configWrites`도 해당 계정을 대상으로 하는 쓰기(예: `/allowlist --config --account <id>` 또는 `/config set channels.<provider>.accounts.<id>...`)를 제어합니다.
- `allowFrom`은 provider별입니다. 설정하면 이것이 **유일한** 권한 부여 source가 됩니다(채널 allowlist/페어링과 `useAccessGroups`는 무시됨).
- `useAccessGroups: false`는 `allowFrom`이 설정되지 않은 경우 명령이 access-group 정책을 우회할 수 있게 합니다.

</Accordion>

---

## Agent 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

선택적 저장소 루트로, system prompt의 Runtime 줄에 표시됩니다. 설정하지 않으면 OpenClaw가 workspace에서 위로 올라가며 자동 탐지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 agent에 대한 선택적 기본 Skills allowlist입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

- 기본적으로 Skills 제한 없이 사용하려면 `agents.defaults.skills`를 생략하세요.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills가 없게 하려면 `agents.list[].skills: []`로 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 agent의 최종 집합이며,
  기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

workspace bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap 파일을 system prompt에 주입하는 시점을 제어합니다. 기본값은 `"always"`입니다.

- `"continuation-skip"`: 안전한 이어가기 턴(assistant 응답 완료 후)에서는 workspace bootstrap 재주입을 건너뛰어 prompt 크기를 줄입니다. Heartbeat 실행과 compaction 후 재시도는 여전히 컨텍스트를 다시 구성합니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘리기 전 각 workspace bootstrap 파일의 최대 문자 수입니다. 기본값: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 workspace bootstrap 파일에 걸쳐 주입되는 총 최대 문자 수입니다. 기본값: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap 컨텍스트가 잘렸을 때 agent에 보이는 경고 텍스트를 제어합니다.
기본값: `"once"`.

- `"off"`: system prompt에 경고 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 시그니처마다 한 번만 경고를 주입합니다(권장).
- `"always"`: 잘림이 존재하는 모든 실행에서 경고를 주입합니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

provider 호출 전 transcript/tool 이미지 블록에서 가장 긴 이미지 변의 최대 픽셀 크기입니다.
기본값: `1200`.

값을 낮추면 일반적으로 vision 토큰 사용량과 요청 페이로드 크기가 줄어들고, 특히 스크린샷이 많은 실행에 유리합니다.
값을 높이면 더 많은 시각적 디테일이 보존됩니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt 컨텍스트용 시간대입니다(메시지 타임스탬프에는 적용되지 않음). 호스트 시간대를 대체값으로 사용합니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt의 시간 형식입니다. 기본값: `auto`(OS 환경설정).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 전역 기본 provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 문자열 형식은 primary 모델만 설정합니다.
  - 객체 형식은 primary와 정렬된 failover 모델을 함께 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `image` 도구 경로에서 vision-model config로 사용됩니다.
  - 선택된/기본 모델이 이미지 입력을 받을 수 없을 때 대체 라우팅에도 사용됩니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 이미지 생성 기능과 향후 이미지를 생성하는 모든 도구/plugin 표면에서 사용됩니다.
  - 일반적인 값: Gemini 네이티브 이미지 생성용 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, OpenAI Images용 `openai/gpt-image-1`.
  - provider/model을 직접 선택하면 해당 provider 인증/API 키도 구성하세요(예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/*`에는 `OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`).
  - 생략해도 `image_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 이미지 생성 provider를 provider-id 순서대로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 음악 생성 기능과 내장 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, `minimax/music-2.5+`.
  - 생략해도 `music_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 음악 생성 provider를 provider-id 순서대로 시도합니다.
  - provider/model을 직접 선택하면 해당 provider 인증/API 키도 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 비디오 생성 기능과 내장 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, `qwen/wan2.7-r2v`.
  - 생략해도 `video_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 비디오 생성 provider를 provider-id 순서대로 시도합니다.
  - provider/model을 직접 선택하면 해당 provider 인증/API 키도 구성하세요.
  - 번들 Qwen 비디오 생성 provider는 현재 최대 1개의 출력 비디오, 1개의 입력 이미지, 4개의 입력 비디오, 10초 길이, 그리고 provider 수준 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `pdf` 도구의 모델 라우팅에 사용됩니다.
  - 생략하면 PDF 도구는 `imageModel`로, 그다음 해석된 세션/기본 모델로 대체됩니다.
- `pdfMaxBytesMb`: 호출 시 `maxBytesMb`가 전달되지 않을 때 `pdf` 도구의 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` 도구의 추출 대체 모드에서 고려하는 기본 최대 페이지 수입니다.
- `verboseDefault`: agent의 기본 verbose 수준입니다. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `elevatedDefault`: agent의 기본 elevated-output 수준입니다. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: `openai/gpt-5.4`). provider를 생략하면 OpenClaw는 먼저 별칭을, 다음으로 정확한 모델 ID에 대한 고유한 구성된 provider 일치를, 마지막으로 구성된 기본 provider를 시도합니다(더 이상 권장되지 않는 호환 동작이므로 명시적 `provider/model`을 권장). 해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면, OpenClaw는 오래된 제거된 provider 기본값을 그대로 드러내는 대신 첫 번째 구성된 provider/model로 대체합니다.
- `models`: `/model`용 구성된 모델 카탈로그 및 allowlist입니다. 각 항목에는 `alias`(단축 이름)와 `params`(provider별 설정, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`)를 포함할 수 있습니다.
- `params`: 모든 모델에 적용되는 전역 기본 provider 매개변수입니다. `agents.defaults.params`에 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(config): `agents.defaults.params`(전역 기반) 위에 `agents.defaults.models["provider/model"].params`(모델별), 그 위에 `agents.list[].params`(일치하는 agent id)가 키별로 덮어씁니다. 자세한 내용은 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.
- 이 필드를 변경하는 config writer(예: `/models set`, `/models set-image`, fallback 추가/제거 명령)는 가능한 경우 정규 객체 형식으로 저장하고 기존 fallback 목록을 유지합니다.
- `maxConcurrent`: 세션 전반에서 병렬 agent 실행의 최대 수입니다(각 세션은 여전히 직렬화됨). 기본값: 4.

**내장 별칭 shorthand** (`agents.defaults.models`에 모델이 있을 때만 적용):

| 별칭                | 모델                                   |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

구성한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 자동으로 thinking 모드를 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 모델은 명시적 thinking 수준이 없을 때 기본적으로 `adaptive` thinking을 사용합니다.

### `agents.defaults.cliBackends`

도구 호출이 없는 텍스트 전용 fallback 실행용 선택적 CLI backend입니다. API provider 실패 시 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend는 텍스트 우선이며, 도구는 항상 비활성화됩니다.
- `sessionArg`가 설정된 경우 세션을 지원합니다.
- `imageArg`가 파일 경로를 받을 수 있으면 이미지 전달을 지원합니다.

### `agents.defaults.heartbeat`

주기적 heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m이면 비활성화
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // 기본값: false; true이면 workspace bootstrap 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true이면 각 heartbeat를 새 세션(대화 기록 없음)에서 실행
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (기본값) | block
        target: "none", // 기본값: none | 옵션: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: 기간 문자열(ms/s/m/h). 기본값: API-key 인증은 `30m`, OAuth 인증은 `1h`. 비활성화하려면 `0m`으로 설정하세요.
- `suppressToolErrorWarnings`: true이면 heartbeat 실행 중 도구 오류 경고 payload를 숨깁니다.
- `directPolicy`: 직접/DM 전달 정책입니다. `allow`(기본값)는 직접 대상 전달을 허용합니다. `block`은 직접 대상 전달을 차단하고 `reason=dm-blocked`를 기록합니다.
- `lightContext`: true이면 heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 heartbeat 실행은 이전 대화 기록이 없는 새 세션에서 수행됩니다. cron의 `sessionTarget: "isolated"`와 동일한 격리 패턴입니다. heartbeat당 토큰 비용을 약 100K에서 약 2-5K로 줄입니다.
- agent별: `agents.list[].heartbeat`를 설정하세요. 어떤 agent라도 `heartbeat`를 정의하면 **그 agent들만** heartbeat를 실행합니다.
- heartbeat는 전체 agent 턴을 실행하므로, 간격이 짧을수록 더 많은 토큰을 사용합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 등록된 compaction provider plugin의 id (선택 사항)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom일 때 사용
        postCompactionSections: ["Session Startup", "Red Lines"], // []이면 재주입 비활성화
        model: "openrouter/anthropic/claude-sonnet-4-6", // 선택적 compaction 전용 모델 재정의
        notifyUser: true, // compaction 시작 시 짧은 알림 전송(기본값: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 기록을 위한 청크 단위 요약). [Compaction](/ko/concepts/compaction)을 참고하세요.
- `provider`: 등록된 compaction provider plugin의 id입니다. 설정하면 내장 LLM 요약 대신 provider의 `summarize()`가 호출됩니다. 실패 시 내장 방식으로 대체됩니다. provider를 설정하면 `mode: "safeguard"`가 강제됩니다. [Compaction](/ko/concepts/compaction)을 참고하세요.
- `timeoutSeconds`: OpenClaw가 중단하기 전 단일 compaction 작업에 허용되는 최대 초 수입니다. 기본값: `900`.
- `identifierPolicy`: `strict`(기본값), `off`, 또는 `custom`. `strict`는 compaction 요약 중 내장 불투명 식별자 보존 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용하는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `postCompactionSections`: compaction 후 다시 주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 기본값은 `["Session Startup", "Red Lines"]`이며, 비활성화하려면 `[]`로 설정하세요. 설정하지 않았거나 명시적으로 이 기본 쌍을 사용하면, 레거시 fallback으로 이전 `Every Session`/`Safety` 제목도 허용됩니다.
- `model`: compaction 요약에만 사용하는 선택적 `provider/model-id` 재정의입니다. 메인 세션은 하나의 모델을 유지하되 compaction 요약은 다른 모델에서 실행하고 싶을 때 사용하세요. 설정하지 않으면 compaction은 세션의 primary 모델을 사용합니다.
- `notifyUser`: `true`이면 compaction 시작 시 사용자에게 짧은 알림을 보냅니다(예: "Compacting context..."). 기본적으로는 조용히 실행되도록 비활성화되어 있습니다.
- `memoryFlush`: 자동 compaction 전에 내구성 있는 memory를 저장하는 조용한 agentic 턴입니다. workspace가 읽기 전용이면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM으로 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크의 세션 기록은 수정하지 않습니다.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 기간(ms/s/m/h), 기본 단위: 분
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 모드 동작">

- `mode: "cache-ttl"`은 pruning 패스를 활성화합니다.
- `ttl`은 마지막 cache touch 이후 pruning을 다시 실행할 수 있는 주기를 제어합니다.
- Pruning은 먼저 너무 큰 도구 결과를 soft-trim하고, 필요 시 더 오래된 도구 결과를 hard-clear합니다.

**Soft-trim**은 시작 + 끝 부분을 유지하고 중간에 `...`를 삽입합니다.

**Hard-clear**는 전체 도구 결과를 placeholder로 대체합니다.

참고:

- 이미지 블록은 절대 trim/clear되지 않습니다.
- 비율은 정확한 토큰 수가 아니라 문자 수 기준(대략적)입니다.
- `keepLastAssistants`보다 적은 assistant 메시지만 있으면 pruning은 건너뜁니다.

</Accordion>

동작 세부 사항은 [Session Pruning](/ko/concepts/session-pruning)을 참고하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs 사용)
    },
  },
}
```

- Telegram이 아닌 채널은 블록 답변을 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
- 채널 재정의: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본값은 `minChars: 1500`입니다.
- `humanDelay`: 블록 답변 사이의 무작위 지연입니다. `natural` = 800–2500ms. agent별 재정의: `agents.list[].humanDelay`.

동작 및 청크 세부 사항은 [Streaming](/ko/concepts/streaming)을 참고하세요.

### 타이핑 표시기

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 기본값: 직접 채팅/멘션은 `instant`, 멘션되지 않은 그룹 채팅은 `message`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

[Typing Indicators](/ko/concepts/typing-indicators)를 참고하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

내장 agent를 위한 선택적 sandboxing입니다. 전체 가이드는 [Sandboxing](/ko/gateway/sandboxing)을 참고하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / 인라인 내용도 지원:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox 세부 사항">

**Backend:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 범용 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`을 선택하면 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH backend config:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 스코프별 workspace에 사용하는 절대 원격 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 물질화하는 인라인 내용 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key 정책 관련 설정

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선
- `certificateData`가 `certificateFile`보다 우선
- `knownHostsData`가 `knownHostsFile`보다 우선
- SecretRef 기반 `*Data` 값은 sandbox 세션 시작 전에 활성 secrets 런타임 스냅샷에서 해석됩니다

**SSH backend 동작:**

- 생성 또는 재생성 후 원격 workspace를 한 번 시드함
- 그다음 원격 SSH workspace를 canonical 상태로 유지함
- `exec`, 파일 도구, media 경로를 SSH를 통해 라우팅함
- 원격 변경 내용을 호스트로 자동 동기화하지 않음
- sandbox browser 컨테이너는 지원하지 않음

**Workspace 접근:**

- `none`: `~/.openclaw/sandboxes` 아래 스코프별 sandbox workspace
- `ro`: `/workspace`에 sandbox workspace, `/agent`에 agent workspace를 읽기 전용으로 마운트
- `rw`: `/workspace`에 agent workspace를 읽기/쓰기 마운트

**Scope:**

- `session`: 세션별 컨테이너 + workspace
- `agent`: agent별 컨테이너 + workspace 1개(기본값)
- `shared`: 공유 컨테이너 및 workspace(세션 간 격리 없음)

**OpenShell plugin config:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 선택 사항
          gatewayEndpoint: "https://lab.example", // 선택 사항
          policy: "strict", // 선택적 OpenShell policy id
          providers: ["openai"], // 선택 사항
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 모드:**

- `mirror`: exec 전 로컬에서 원격으로 시드하고, exec 후 다시 동기화; 로컬 workspace가 canonical 상태로 유지됨
- `remote`: sandbox 생성 시 한 번만 원격으로 시드하고, 그 후 원격 workspace를 canonical 상태로 유지함

`remote` 모드에서는 OpenClaw 외부에서 호스트 로컬에 가해진 편집 내용이 시드 단계 이후 sandbox로 자동 동기화되지 않습니다.
전송은 OpenShell sandbox로의 SSH를 사용하지만, sandbox lifecycle과 선택적 mirror sync는 plugin이 소유합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번만 실행됩니다(`sh -lc` 사용). 네트워크 egress, 쓰기 가능한 루트, 루트 사용자 권한이 필요합니다.

**컨테이너 기본값은 `network: "none"`**이며, agent에 아웃바운드 접근이 필요하면 `"bridge"`(또는 사용자 지정 bridge 네트워크)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`는 기본적으로 차단되며, 명시적으로
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 설정한 경우에만 허용됩니다(break-glass).

**인바운드 첨부 파일**은 활성 workspace의 `media/inbound/*`에 staging됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 및 agent별 bind는 병합됩니다.

**Sandboxed browser** (`sandbox.browser.enabled`): 컨테이너의 Chromium + CDP입니다. noVNC URL이 system prompt에 주입됩니다. `openclaw.json`에서 `browser.enabled`가 필요하지 않습니다.
noVNC 관찰자 접근은 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 짧은 수명의 토큰 URL을 발급합니다.

- `allowHostControl: false`(기본값)는 sandboxed 세션이 호스트 browser를 대상으로 삼지 못하게 합니다.
- `network`의 기본값은 `openclaw-sandbox-browser`(전용 bridge 네트워크)입니다. 전역 bridge 연결이 명시적으로 필요할 때만 `bridge`로 설정하세요.
- `cdpSourceRange`는 선택적으로 컨테이너 가장자리에서 CDP ingress를 CIDR 범위(예: `172.21.0.1/32`)로 제한합니다.
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 sandbox browser 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) browser 컨테이너에는 `docker.binds` 대신 이것이 사용됩니다.
- 시작 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다.
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (기본적으로 활성화됨)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`는
    기본적으로 활성화되어 있으며, WebGL/3D 사용에 필요하면
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로에 확장 프로그램이 필요하면
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 다시 활성화할 수 있습니다.
  - `--renderer-process-limit=2`는
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있으며, `0`이면 Chromium 기본 제한을 사용합니다.
  - `noSandbox`가 활성화된 경우 `--no-sandbox` 및 `--disable-setuid-sandbox`도 추가됩니다.
  - 기본값은 컨테이너 이미지 기준선입니다. 컨테이너 기본값을 변경하려면 사용자 지정 browser 이미지와 사용자 지정 entrypoint를 사용하세요.

</Accordion>

Browser sandboxing과 `sandbox.docker.binds`는 현재 Docker에서만 지원됩니다.

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # 메인 sandbox 이미지
scripts/sandbox-browser-setup.sh   # 선택적 browser 이미지
```

### `agents.list` (agent별 재정의)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 또는 { primary, fallbacks }
        thinkingDefault: "high", // agent별 thinking 수준 재정의
        reasoningDefault: "on", // agent별 reasoning 표시 재정의
        fastModeDefault: false, // agent별 fast mode 재정의
        params: { cacheRetention: "none" }, // 일치하는 defaults.models params를 키별로 재정의
        skills: ["docs-search"], // 설정 시 agents.defaults.skills를 대체
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 안정적인 agent id(필수)입니다.
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 기록). 아무것도 설정되지 않으면 목록의 첫 번째 항목이 기본값입니다.
- `model`: 문자열 형식은 `primary`만 재정의하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 재정의합니다(`[]`는 전역 fallback 비활성화). `primary`만 재정의하는 cron 작업은 `fallbacks: []`를 설정하지 않는 한 기본 fallback을 계속 상속합니다.
- `params`: 선택한 모델 항목의 `agents.defaults.models` 위에 병합되는 agent별 스트림 params입니다. `cacheRetention`, `temperature`, `maxTokens` 같은 agent별 재정의에 사용하세요. 전체 모델 카탈로그를 복제할 필요가 없습니다.
- `skills`: 선택적 agent별 Skills allowlist입니다. 생략하면 agent는 설정된 경우 `agents.defaults.skills`를 상속합니다. 명시적 목록은 기본값과 병합되지 않고 대체하며, `[]`는 Skills 없음입니다.
- `thinkingDefault`: 선택적 agent별 기본 thinking 수준(`off | minimal | low | medium | high | xhigh | adaptive`)입니다. 메시지별 또는 세션별 재정의가 없을 때 이 agent에 대해 `agents.defaults.thinkingDefault`를 덮어씁니다.
- `reasoningDefault`: 선택적 agent별 기본 reasoning 표시(`on | off | stream`)입니다. 메시지별 또는 세션별 reasoning 재정의가 없을 때 적용됩니다.
- `fastModeDefault`: 선택적 agent별 기본 fast mode 값(`true | false`)입니다. 메시지별 또는 세션별 fast-mode 재정의가 없을 때 적용됩니다.
- `runtime`: 선택적 agent별 런타임 descriptor입니다. agent가 기본적으로 ACP harness 세션을 사용해야 한다면 `type: "acp"`와 함께 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)을 사용하세요.
- `identity.avatar`: workspace 상대 경로, `http(s)` URL, 또는 `data:` URI입니다.
- `identity`는 기본값을 파생합니다: `emoji`에서 `ackReaction`, `name`/`emoji`에서 `mentionPatterns`.
- `subagents.allowAgents`: `sessions_spawn`용 agent id allowlist입니다(`["*"]` = 아무거나; 기본값: 같은 agent만).
- Sandbox 상속 보호: 요청 세션이 sandbox 안에서 실행 중이면, `sessions_spawn`는 sandbox 없이 실행될 대상은 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제, 기본값: false).

---

## 멀티 agent 라우팅

하나의 Gateway 안에서 여러 개의 격리된 agent를 실행합니다. [Multi-Agent](/ko/concepts/multi-agent)를 참고하세요.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 바인딩 일치 필드

- `type` (선택 사항): 일반 라우팅은 `route`(type 생략 시 route), 영구 ACP 대화 바인딩은 `acp`
- `match.channel` (필수)
- `match.accountId` (선택 사항; `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer` (선택 사항; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (선택 사항; 채널별)
- `acp` (선택 사항; `type: "acp"` 전용): `{ mode, label, cwd, backend }`

**결정적 일치 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (정확히 일치, peer/guild/team 없음)
5. `match.accountId: "*"` (채널 전체)
6. 기본 agent

각 계층 안에서는 첫 번째로 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 식별자(`match.channel` + account + `match.peer.id`)로 해석하며, 위의 route 바인딩 계층 순서를 사용하지 않습니다.

### Agent별 접근 프로필

<Accordion title="전체 접근(샌드박스 없음)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="읽기 전용 도구 + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="파일시스템 접근 없음(메시징 전용)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

우선순위 세부 사항은 [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

---

## 세션

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 이 토큰 수를 넘는 부모 스레드 fork는 건너뜀(0이면 비활성화)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 기간 또는 false
      maxDiskBytes: "500mb", // 선택적 하드 예산
      highWaterBytes: "400mb", // 선택적 정리 목표치
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 기본 비활동 자동 unfocus 시간 (`0`은 비활성화)
      maxAgeHours: 0, // 기본 하드 최대 사용 기간 시간 (`0`은 비활성화)
    },
    mainKey: "main", // 레거시(런타임은 항상 "main" 사용)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="세션 필드 세부 사항">

- **`scope`**: 그룹 채팅 컨텍스트를 위한 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 채널 컨텍스트 내에서 각 발신자가 격리된 세션을 가집니다.
  - `global`: 채널 컨텍스트의 모든 참가자가 하나의 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM을 그룹화하는 방식입니다.
  - `main`: 모든 DM이 메인 세션을 공유합니다.
  - `per-peer`: 채널 간에 발신자 id별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(멀티 사용자 inbox에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(멀티 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위한 provider 접두 peer에 대한 정규 ID 매핑입니다.
- **`reset`**: 기본 reset 정책입니다. `daily`는 로컬 시간 `atHour`에 reset하고, `idle`은 `idleMinutes` 후 reset합니다. 둘 다 구성되면 먼저 만료되는 쪽이 우선합니다.
- **`resetByType`**: 타입별 재정의(`direct`, `group`, `thread`)입니다. 레거시 `dm`도 `direct`의 별칭으로 허용됩니다.
- **`parentForkMaxTokens`**: fork된 스레드 세션 생성 시 허용되는 부모 세션 `totalTokens` 최대값입니다(기본값 `100000`).
  - 부모 `totalTokens`가 이 값을 넘으면 OpenClaw는 부모 transcript 기록을 상속하지 않고 새 스레드 세션을 시작합니다.
  - 이 보호를 끄고 항상 부모 fork를 허용하려면 `0`으로 설정하세요.
- **`mainKey`**: 레거시 필드입니다. 런타임은 이제 메인 direct-chat 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: agent 간 교환 중 reply-back 턴의 최대 횟수입니다(정수, 범위: `0`–`5`). `0`이면 ping-pong chaining이 비활성화됩니다.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, 레거시 `dm` 별칭 허용), `keyPrefix`, `rawKeyPrefix`로 일치시킵니다. 첫 번째 deny가 우선합니다.
- **`maintenance`**: 세션 저장소 정리 + 보존 제어입니다.
  - `mode`: `warn`은 경고만 기록하고, `enforce`는 실제 정리를 수행합니다.
  - `pruneAfter`: 오래된 항목의 기준 나이(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수(기본값 `500`).
  - `rotateBytes`: `sessions.json`이 이 크기를 넘으면 회전합니다(기본값 `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive 보존 기간입니다. 기본값은 `pruneAfter`를 따르며, 비활성화하려면 `false`로 설정하세요.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후 목표치입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: 스레드 바운드 세션 기능에 대한 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치(provider가 재정의 가능, Discord는 `channels.discord.threadBindings.enabled` 사용)
  - `idleHours`: 비활동 자동 unfocus의 기본 시간(`0`은 비활성화, provider가 재정의 가능)
  - `maxAgeHours`: 하드 최대 사용 기간의 기본 시간(`0`은 비활성화, provider가 재정의 가능)

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0이면 비활성화
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 응답 접두사

채널/계정별 재정의: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

해결 순서(가장 구체적인 항목 우선): account → channel → global. `""`는 비활성화하고 상위 단계 탐색도 중단합니다. `"auto"`는 `[{identity.name}]`를 파생합니다.

**템플릿 변수:**

| 변수              | 설명                     | 예시                        |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | 짧은 모델 이름           | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자         | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider 이름            | `anthropic`                 |
| `{thinkingLevel}` | 현재 thinking 수준       | `high`, `low`, `off`        |
| `{identity.name}` | Agent identity 이름      | (`"auto"`와 동일)           |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 agent의 `identity.emoji`, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 해결 순서: account → channel → `messages.ackReaction` → identity fallback.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram에서 답변 후 ack를 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram에서 lifecycle 상태 반응을 활성화합니다.
  Slack과 Discord에서는 설정하지 않으면 ack 반응이 활성화된 경우 상태 반응도 활성화된 상태로 유지됩니다.
  Telegram에서는 lifecycle 상태 반응을 활성화하려면 명시적으로 `true`로 설정해야 합니다.

### 인바운드 디바운스

같은 발신자가 빠르게 보낸 텍스트 전용 메시지를 하나의 agent 턴으로 묶습니다. 미디어/첨부 파일은 즉시 flush됩니다. 제어 명령은 디바운싱을 우회합니다.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto`는 자동 TTS를 제어합니다. `/tts off|always|inbound|tagged`는 세션별로 재정의합니다.
- `summaryModel`은 자동 요약에 대해 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`입니다(opt-in).
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`를 대체값으로 사용합니다.
- `openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 해결 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 마지막으로 `https://api.openai.com/v1`입니다.
- `openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면 OpenClaw는 이를 OpenAI 호환 TTS 서버로 취급하고 모델/voice 검증을 완화합니다.

---

## Talk

Talk 모드(macOS/iOS/Android)의 기본값입니다.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 여러 Talk provider가 구성된 경우 `talk.provider`는 `talk.providers`의 키와 일치해야 합니다.
- 레거시 평면 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용이며 자동으로 `talk.providers.<provider>`로 마이그레이션됩니다.
- Voice ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`를 대체값으로 사용합니다.
- `providers.*.apiKey`는 일반 텍스트 문자열 또는 SecretRef 객체를 받을 수 있습니다.
- `ELEVENLABS_API_KEY` 대체값은 구성된 Talk API 키가 없을 때만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 Talk 지시에서 친숙한 이름을 사용할 수 있습니다.
- `silenceTimeoutMs`는 사용자가 말을 멈춘 후 transcript를 보내기 전까지 Talk 모드가 기다리는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 pause 창을 유지합니다(`macOS와 Android는 700 ms, iOS는 900 ms`).

---

## 도구

### 도구 프로필

`tools.profile`은 `tools.allow`/`tools.deny` 전에 적용되는 기본 allowlist를 설정합니다.

로컬 온보딩은 새 로컬 config에서 설정되지 않은 경우 기본값으로 `tools.profile: "coding"`을 사용합니다(기존의 명시적 프로필은 유지).

| 프로필      | 포함 항목                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                   |
| `full`      | 제한 없음(설정하지 않은 것과 동일)                                                                                           |

### 도구 그룹

| 그룹               | 도구                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`는 `exec`의 별칭으로 허용됨)                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | 모든 내장 도구(provider plugin 제외)                                                                                     |

### `tools.allow` / `tools.deny`

전역 도구 허용/거부 정책입니다(deny가 우선). 대소문자를 구분하지 않으며 `*` wildcard를 지원합니다. Docker sandbox가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

특정 provider 또는 모델에 대해 도구를 추가로 제한합니다. 순서: 기본 프로필 → provider 프로필 → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

sandbox 외부에서 elevated exec 접근을 제어합니다.

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- agent별 재정의(`agents.list[].tools.elevated`)는 더 제한적으로만 설정할 수 있습니다.
- `/elevated on|off|ask|full`은 세션별 상태를 저장하며, 인라인 지시문은 단일 메시지에만 적용됩니다.
- Elevated `exec`는 sandboxing을 우회하고 구성된 escape 경로(`gateway`가 기본값, exec 대상이 `node`이면 `node`)를 사용합니다.

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

도구 루프 안전 검사는 기본적으로 **비활성화**되어 있습니다. 감지를 활성화하려면 `enabled: true`로 설정하세요.
설정은 전역 `tools.loopDetection`에 정의하고 agent별 `agents.list[].tools.loopDetection`에서 재정의할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: 루프 분석을 위해 유지되는 최대 도구 호출 기록 수입니다.
- `warningThreshold`: 경고를 발생시키는 반복적 무진전 패턴 임계값입니다.
- `criticalThreshold`: 치명적 루프를 차단하는 더 높은 반복 임계값입니다.
- `globalCircuitBreakerThreshold`: 어떤 무진전 실행이든 강제 중단하는 하드 스톱 임계값입니다.
- `detectors.genericRepeat`: 같은 도구/같은 인자를 반복 호출하면 경고합니다.
- `detectors.knownPollNoProgress`: 알려진 poll 도구(`process.poll`, `command_status` 등)에서 무진전 상태를 경고/차단합니다.
- `detectors.pingPong`: 번갈아 나타나는 무진전 쌍 패턴을 경고/차단합니다.
- `warningThreshold >= criticalThreshold` 또는 `criticalThreshold >= globalCircuitBreakerThreshold`이면 검증이 실패합니다.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 또는 BRAVE_API_KEY 환경 변수
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 선택 사항; 자동 감지를 원하면 생략
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

인바운드 media 이해(image/audio/video)를 구성합니다.

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 완료된 async music/video를 채널로 직접 전송
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Media 모델 항목 필드">

**Provider 항목** (`type: "provider"` 또는 생략):

- `provider`: API provider id (`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
- `model`: 모델 id 재정의
- `profile` / `preferredProfile`: `auth-profiles.json` 프로필 선택

**CLI 항목** (`type: "cli"`):

- `command`: 실행할 executable
- `args`: 템플릿이 적용된 인자(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원)

**공통 필드:**

- `capabilities`: 선택적 목록(`image`, `audio`, `video`). 기본값: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: 항목별 재정의.
- 실패하면 다음 항목으로 대체됩니다.

Provider 인증은 표준 순서를 따릅니다: `auth-profiles.json` → 환경 변수 → `models.providers.*.apiKey`.

**비동기 완료 필드:**

- `asyncCompletion.directSend`: `true`이면 완료된 async `music_generate`
  및 `video_generate` 작업이 먼저 직접 채널 전달을 시도합니다. 기본값은 `false`이며
  (레거시 요청 세션 wake/model-delivery 경로)입니다.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

세션 도구(`sessions_list`, `sessions_history`, `sessions_send`)로 어떤 세션을 대상으로 할 수 있는지 제어합니다.

기본값: `tree`(현재 세션 + 이 세션이 생성한 세션, 예: subagent).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

참고:

- `self`: 현재 세션 키만.
- `tree`: 현재 세션 + 현재 세션이 생성한 세션(subagent).
- `agent`: 현재 agent id에 속한 모든 세션(같은 agent id 아래에서 per-sender 세션을 실행하면 다른 사용자 세션도 포함될 수 있음).
- `all`: 모든 세션. 에이전트 간 대상 지정에는 여전히 `tools.agentToAgent`가 필요합니다.
- Sandbox clamp: 현재 세션이 sandbox 안에 있고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`이면, `tools.sessions.visibility="all"`이라도 강제로 `tree`가 됩니다.

### `tools.sessions_spawn`

`sessions_spawn`의 인라인 첨부 파일 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: true로 설정하면 인라인 파일 첨부 허용
        maxTotalBytes: 5242880, // 전체 파일 합계 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 파일당 1 MB
        retainOnSessionKeep: false, // cleanup="keep"일 때 첨부 파일 유지
      },
    },
  },
}
```

참고:

- 첨부 파일은 `runtime: "subagent"`에서만 지원됩니다. ACP 런타임은 이를 거부합니다.
- 파일은 자식 workspace의 `.openclaw/attachments/<uuid>/`에 `.manifest.json`과 함께 materialize됩니다.
- 첨부 파일 내용은 transcript 저장에서 자동으로 redaction됩니다.
- Base64 입력은 엄격한 alphabet/padding 검사와 디코딩 전 크기 보호를 통해 검증됩니다.
- 파일 권한은 디렉터리 `0700`, 파일 `0600`입니다.
- 정리는 `cleanup` 정책을 따릅니다: `delete`는 항상 첨부 파일을 제거하고, `keep`은 `retainOnSessionKeep: true`일 때만 유지합니다.

### `tools.experimental`

실험적인 내장 도구 플래그입니다. 런타임별 자동 활성화 규칙이 적용되지 않는 한 기본적으로 꺼져 있습니다.

```json5
{
  tools: {
    experimental: {
      planTool: true, // 실험적 update_plan 활성화
    },
  },
}
```

참고:

- `planTool`: 사소하지 않은 다단계 작업 추적을 위한 구조화된 `update_plan` 도구를 활성화합니다.
- 기본값: OpenAI가 아닌 provider에서는 `false`. OpenAI 및 OpenAI Codex 실행에서는 자동으로 활성화됩니다.
- 활성화되면 system prompt에도 사용 지침이 추가되어, 모델이 상당한 작업에만 이를 사용하고 동시에 최대 한 단계만 `in_progress`로 유지하도록 합니다.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 생성된 sub-agent의 기본 모델입니다. 생략하면 sub-agent는 호출자의 모델을 상속합니다.
- `allowAgents`: 요청 agent가 자체 `subagents.allowAgents`를 설정하지 않았을 때 `sessions_spawn`용 대상 agent id 기본 allowlist입니다(`["*"]` = 아무거나, 기본값: 같은 agent만).
- `runTimeoutSeconds`: 도구 호출에서 `runTimeoutSeconds`를 생략했을 때 `sessions_spawn`의 기본 타임아웃(초)입니다. `0`은 무제한입니다.
- subagent별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## 사용자 지정 provider 및 base URL

OpenClaw는 내장 모델 카탈로그를 사용합니다. 사용자 지정 provider는 config의 `models.providers` 또는 `~/.openclaw/agents/<agentId>/agent/models.json`을 통해 추가할 수 있습니다.

```json5
{
  models: {
    mode: "merge", // merge (기본값) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 사용자 지정 인증이 필요하면 `authHeader: true` + `headers`를 사용하세요.
- agent config 루트는 `OPENCLAW_AGENT_DIR`(또는 레거시 환경 변수 별칭 `PI_CODING_AGENT_DIR`)로 재정의할 수 있습니다.
- 일치하는 provider ID에 대한 병합 우선순위:
  - 비어 있지 않은 agent `models.json`의 `baseUrl` 값이 우선합니다.
  - 비어 있지 않은 agent `apiKey` 값은 현재 config/auth-profile 컨텍스트에서 해당 provider가 SecretRef 관리 대상이 아닐 때만 우선합니다.
  - SecretRef 관리 provider의 `apiKey` 값은 해석된 비밀을 저장하는 대신 source marker(`ENV_VAR_NAME`는 env ref, `secretref-managed`는 file/exec ref)에서 새로고침됩니다.
  - SecretRef 관리 provider header 값도 source marker(`secretref-env:ENV_VAR_NAME`는 env ref, `secretref-managed`는 file/exec ref)에서 새로고침됩니다.
  - 비어 있거나 없는 agent `apiKey`/`baseUrl`은 config의 `models.providers`를 대체값으로 사용합니다.
  - 일치하는 모델의 `contextWindow`/`maxTokens`는 명시적 config 값과 암시적 catalog 값 중 더 큰 값을 사용합니다.
  - 일치하는 모델의 `contextTokens`는 명시적 런타임 cap이 있으면 이를 유지합니다. 모델의 네이티브 메타데이터를 바꾸지 않고 유효 컨텍스트를 제한하려면 이것을 사용하세요.
  - config가 `models.json`을 완전히 덮어써야 한다면 `models.mode: "replace"`를 사용하세요.
  - Marker 저장은 source-authoritative입니다: marker는 해석된 런타임 비밀 값이 아니라 활성 source config 스냅샷(해석 전)에서 기록됩니다.

### Provider 필드 세부 사항

- `models.mode`: provider 카탈로그 동작(`merge` 또는 `replace`).
- `models.providers`: provider id를 키로 하는 사용자 지정 provider 맵.
- `models.providers.*.api`: 요청 adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` 등).
- `models.providers.*.apiKey`: provider 자격 증명(SecretRef/env substitution 권장).
- `models.providers.*.auth`: 인증 전략(`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`에서 요청에 `options.num_ctx` 삽입(기본값: `true`).
- `models.providers.*.authHeader`: 필요할 때 자격 증명을 `Authorization` 헤더로 강제 전달.
- `models.providers.*.baseUrl`: 업스트림 API base URL.
- `models.providers.*.headers`: proxy/tenant 라우팅용 추가 정적 헤더.
- `models.providers.*.request`: model-provider HTTP 요청용 전송 재정의.
  - `request.headers`: 추가 헤더(provider 기본값과 병합). 값은 SecretRef 허용.
  - `request.auth`: 인증 전략 재정의. 모드: `"provider-default"`(provider 내장 인증 사용), `"authorization-bearer"`(`token` 사용), `"header"`(`headerName`, `value`, 선택적 `prefix` 사용).
  - `request.proxy`: HTTP 프록시 재정의. 모드: `"env-proxy"`(`HTTP_PROXY`/`HTTPS_PROXY` 환경 변수 사용), `"explicit-proxy"`(`url` 사용). 두 모드 모두 선택적 `tls` 하위 객체를 받을 수 있습니다.
  - `request.tls`: 직접 연결용 TLS 재정의. 필드: `ca`, `cert`, `key`, `passphrase`(모두 SecretRef 허용), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: 명시적 provider 모델 카탈로그 항목.
- `models.providers.*.models.*.contextWindow`: 네이티브 모델 컨텍스트 윈도우 메타데이터.
- `models.providers.*.models.*.contextTokens`: 선택적 런타임 컨텍스트 cap. 모델의 네이티브 `contextWindow`보다 더 작은 유효 컨텍스트 예산을 원할 때 사용하세요.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트. `api: "openai-completions"`이고 비어 있지 않은 비네이티브 `baseUrl`(호스트가 `api.openai.com`이 아님)일 경우, OpenClaw는 런타임에 이를 강제로 `false`로 설정합니다. 비어 있거나 생략된 `baseUrl`은 기본 OpenAI 동작을 유지합니다.
- `models.providers.*.models.*.compat.requiresStringContent`: 문자열 전용 OpenAI 호환 chat 엔드포인트를 위한 선택적 호환성 힌트. `true`이면 OpenClaw는 순수 텍스트 `messages[].content` 배열을 전송 전에 일반 문자열로 평탄화합니다.
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 자동 탐지 설정 루트.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 암시적 탐지를 켜거나 끕니다.
- `plugins.entries.amazon-bedrock.config.discovery.region`: 탐지용 AWS 리전.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 선택적 provider-id 필터.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 탐지 새로고침 polling 간격.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 탐지된 모델의 대체 컨텍스트 윈도우.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 탐지된 모델의 대체 최대 출력 토큰 수.

### Provider 예시

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras에는 `cerebras/zai-glm-4.7`을, Z.AI direct에는 `zai/glm-4.7`을 사용하세요.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 설정하세요. Zen 카탈로그에는 `opencode/...` 참조를, Go 카탈로그에는 `opencode-go/...` 참조를 사용합니다. 단축 명령: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY`를 설정하세요. `z.ai/*`와 `z-ai/*`는 허용되는 별칭입니다. 단축 명령: `openclaw onboard --auth-choice zai-api-key`.

- 일반 엔드포인트: `https://api.z.ai/api/paas/v4`
- 코딩 엔드포인트(기본값): `https://api.z.ai/api/coding/paas/v4`
- 일반 엔드포인트를 사용하려면 base URL 재정의를 포함한 사용자 지정 provider를 정의하세요.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

중국 엔드포인트는 `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`을 사용하세요.

네이티브 Moonshot 엔드포인트는 공유
`openai-completions` 전송에서 스트리밍 사용 호환성을 광고하며, OpenClaw는 이제 이를 내장 provider id만이 아니라 엔드포인트 기능에 따라 판단합니다.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 호환 내장 provider입니다. 단축 명령: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic 호환)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL에는 `/v1`를 포함하지 않아야 합니다(Anthropic 클라이언트가 이를 뒤에 붙임). 단축 명령: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (직접)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY`를 설정하세요. 단축 명령:
`openclaw onboard --auth-choice minimax-global-api` 또는
`openclaw onboard --auth-choice minimax-cn-api`.
모델 카탈로그는 이제 기본적으로 M2.7만 사용합니다.
Anthropic 호환 스트리밍 경로에서, OpenClaw는 명시적으로 `thinking`을 설정하지 않으면 기본적으로 MiniMax thinking을 비활성화합니다. `/fast on` 또는
`params.fastMode: true`는 `MiniMax-M2.7`을
`MiniMax-M2.7-highspeed`로 재작성합니다.

</Accordion>

<Accordion title="로컬 모델 (LM Studio)">

[Local Models](/ko/gateway/local-models)를 참고하세요. 요약하면: 충분한 하드웨어에서 LM Studio Responses API로 대형 로컬 모델을 실행하고, fallback을 위해 호스팅 모델은 병합해 두세요.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 번들된 Skills 전용의 선택적 allowlist입니다(관리형/workspace Skills에는 영향 없음).
- `load.extraDirs`: 추가 공유 Skills 루트(가장 낮은 우선순위).
- `install.preferBrew`: `brew`를 사용할 수 있으면 다른 설치 방식으로 대체하기 전에 Homebrew 설치를 우선합니다.
- `install.nodeManager`: `metadata.openclaw.install` 사양에 대한 node 설치기 선호도(`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`는 번들/설치되어 있더라도 해당 Skill을 비활성화합니다.
- `entries.<skillKey>.apiKey`: 기본 env var를 선언하는 Skills를 위한 편의 필드입니다(일반 텍스트 문자열 또는 SecretRef 객체).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, 그리고 `plugins.load.paths`에서 로드됩니다.
- 탐지는 네이티브 OpenClaw plugin뿐 아니라 호환되는 Codex 번들 및 Claude 번들도 허용하며, manifest가 없는 Claude 기본 레이아웃 번들도 포함합니다.
- **Config 변경에는 gateway 재시작이 필요합니다.**
- `allow`: 선택적 allowlist입니다(목록에 있는 plugin만 로드). `deny`가 우선합니다.
- `plugins.entries.<id>.apiKey`: plugin 수준 API 키 편의 필드입니다(plugin이 지원하는 경우).
- `plugins.entries.<id>.env`: plugin 범위 env var 맵.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 코어는 `before_prompt_build`를 차단하고 레거시 `before_agent_start`의 prompt 변경 필드를 무시하되, 레거시 `modelOverride`와 `providerOverride`는 유지합니다. 네이티브 plugin hook과 지원되는 번들 제공 hook 디렉터리에 적용됩니다.
- `plugins.entries.<id>.subagent.allowModelOverride`: 이 plugin이 백그라운드 subagent 실행에 대해 `provider` 및 `model` 재정의를 요청할 수 있도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.subagent.allowedModels`: 신뢰된 subagent 재정의에 대한 정규 `provider/model` 대상의 선택적 allowlist입니다. 모든 모델을 허용하려는 의도가 명확할 때만 `"*"`를 사용하세요.
- `plugins.entries.<id>.config`: plugin이 정의하는 config 객체입니다(가능하면 네이티브 OpenClaw plugin 스키마로 검증됨).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider 설정.
  - `apiKey`: Firecrawl API 키(SecretRef 허용). `plugins.entries.firecrawl.config.webSearch.apiKey`, 레거시 `tools.web.fetch.firecrawl.apiKey`, 또는 `FIRECRAWL_API_KEY` 환경 변수를 대체값으로 사용합니다.
  - `baseUrl`: Firecrawl API base URL(기본값: `https://api.firecrawl.dev`).
  - `onlyMainContent`: 페이지의 main content만 추출합니다(기본값: `true`).
  - `maxAgeMs`: 최대 cache age(밀리초, 기본값: `172800000` / 2일).
  - `timeoutSeconds`: scrape 요청 타임아웃(초, 기본값: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search(Grok 웹 검색) 설정.
  - `enabled`: X Search provider를 활성화합니다.
  - `model`: 검색에 사용할 Grok 모델(예: `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming(실험적) 설정입니다. 단계와 임계값은 [Dreaming](/ko/concepts/dreaming)을 참고하세요.
  - `enabled`: dreaming 마스터 스위치(기본값 `false`).
  - `frequency`: 각 전체 dreaming sweep의 cron cadence(기본값 `"0 3 * * *"`).
  - phase policy와 임계값은 구현 세부 사항이며 사용자 대상 config 키가 아닙니다.
- 활성화된 Claude 번들 plugin은 `settings.json`에 포함된 Pi 기본값을 기여할 수 있으며, OpenClaw는 이를 raw OpenClaw config patch가 아니라 정제된 agent 설정으로 적용합니다.
- `plugins.slots.memory`: 활성 memory plugin id를 선택하거나 `"none"`으로 memory plugin을 비활성화합니다.
- `plugins.slots.contextEngine`: 활성 context engine plugin id를 선택합니다. 다른 engine을 설치하고 선택하지 않으면 기본값은 `"legacy"`입니다.
- `plugins.installs`: `openclaw plugins update`가 사용하는 CLI 관리 설치 메타데이터입니다.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`를 포함합니다.
  - `plugins.installs.*`는 관리되는 상태로 취급하세요. 수동 편집보다 CLI 명령을 선호하세요.

[Plugins](/ko/tools/plugin)를 참고하세요.

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // 기본 trusted-network 모드
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`는 `act:evaluate`와 `wait --fn`을 비활성화합니다.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정하지 않으면 기본값이 `true`입니다(trusted-network 모델).
- 엄격한 public-only browser 탐색을 원하면 `ssrfPolicy.dangerouslyAllowPrivateNetwork: false`로 설정하세요.
- 엄격 모드에서는 원격 CDP profile 엔드포인트(`profiles.*.cdpUrl`)도 도달 가능성/탐지 검사 중 동일한 private-network 차단 대상이 됩니다.
- `ssrfPolicy.allowPrivateNetwork`는 여전히 레거시 별칭으로 지원됩니다.
- 엄격 모드에서는 명시적 예외에 `ssrfPolicy.hostnameAllowlist`와 `ssrfPolicy.allowedHostnames`를 사용하세요.
- 원격 profile은 attach-only입니다(start/stop/reset 비활성화).
- `profiles.*.cdpUrl`은 `http://`, `https://`, `ws://`, `wss://`를 받을 수 있습니다.
  `/json/version`을 OpenClaw가 탐지하게 하려면 HTTP(S)를,
  provider가 직접 DevTools WebSocket URL을 제공한다면 WS(S)를 사용하세요.
- `existing-session` profile은 호스트 전용이며 CDP 대신 Chrome MCP를 사용합니다.
- `existing-session` profile은 Brave나 Edge 같은 특정
  Chromium 기반 browser profile을 대상으로 하기 위해 `userDataDir`을 설정할 수 있습니다.
- `existing-session` profile은 현재 Chrome MCP 경로 제한을 유지합니다:
  CSS selector 대상 지정 대신 snapshot/ref 기반 action,
  단일 파일 업로드 hook, dialog timeout 재정의 없음, `wait --load networkidle` 없음,
  `responsebody`, PDF 내보내기, 다운로드 가로채기, batch actions 없음.
- 로컬 관리형 `openclaw` profile은 `cdpPort`와 `cdpUrl`을 자동 할당합니다.
  원격 CDP에만 `cdpUrl`을 명시적으로 설정하세요.
- 자동 탐지 순서: 기본 browser가 Chromium 기반이면 먼저 → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control service: local loopback 전용(gateway.port에서 파생된 포트, 기본값 `18791`).
- `extraArgs`는 로컬 Chromium 시작에 추가 launch flag를 덧붙입니다(예:
  `--disable-gpu`, 창 크기 설정, 디버그 플래그).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, 짧은 텍스트, 이미지 URL, 또는 data URI
    },
  },
}
```

- `seamColor`: 네이티브 앱 UI chrome의 강조 색상입니다(Talk Mode 버블 tint 등).
- `assistant`: Control UI identity 재정의입니다. 활성 agent identity를 대체값으로 사용합니다.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 또는 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy용; /gateway/trusted-proxy-auth 참고
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // non-loopback Control UI에는 필수
      // dangerouslyAllowHostHeaderOriginFallback: false, // 위험한 Host-header origin fallback 모드
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 선택 사항. 기본값 false.
    allowRealIpFallback: false,
    tools: {
      // 추가 /tools/invoke HTTP deny
      deny: ["browser"],
      // 기본 HTTP deny 목록에서 도구 제거
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 필드 세부 사항">

- `mode`: `local`(gateway 실행) 또는 `remote`(원격 gateway에 연결). Gateway는 `local`이 아니면 시작을 거부합니다.
- `port`: WS + HTTP를 위한 단일 다중화 포트입니다. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback`(기본값), `lan` (`0.0.0.0`), `tail