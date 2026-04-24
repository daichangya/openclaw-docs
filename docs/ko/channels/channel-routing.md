---
read_when:
    - 채널 라우팅 또는 받은편지함 동작 변경하기
summary: 채널별 라우팅 규칙(WhatsApp, Telegram, Discord, Slack) 및 공유 컨텍스트
title: 채널 라우팅
x-i18n:
    generated_at: "2026-04-24T06:03:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# 채널 및 라우팅

OpenClaw는 응답을 **메시지가 들어온 채널로 다시 라우팅**합니다. 모델이 채널을 선택하는 것은 아니며, 라우팅은 결정적이고 호스트 구성으로 제어됩니다.

## 핵심 용어

- **채널**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` 및 Plugin 채널. `webchat`은 내부 WebChat UI 채널이며 구성 가능한 아웃바운드 채널이 아닙니다.
- **AccountId**: 채널별 계정 인스턴스(지원되는 경우).
- 선택적 채널 기본 계정: `channels.<channel>.defaultAccount`는 아웃바운드 경로에 `accountId`가 지정되지 않았을 때 사용할 계정을 선택합니다.
  - 다중 계정 설정에서는 두 개 이상의 계정이 구성된 경우 명시적인 기본값(`defaultAccount` 또는 `accounts.default`)을 설정하세요. 그렇지 않으면 폴백 라우팅이 첫 번째 정규화된 계정 ID를 선택할 수 있습니다.
- **AgentId**: 격리된 워크스페이스 + 세션 저장소(“브레인”).
- **SessionKey**: 컨텍스트를 저장하고 동시성을 제어하는 데 사용하는 버킷 키.

## 세션 키 형태(예시)

기본적으로 다이렉트 메시지는 에이전트의 **main** 세션으로 통합됩니다.

- `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

다이렉트 메시지 대화 기록이 main과 공유되더라도, 외부 DM에 대해서는 샌드박스와 도구 정책이 계정별 direct-chat 런타임 키를 파생해서 사용하므로, 채널에서 들어온 메시지가 로컬 main 세션 실행처럼 취급되지 않습니다.

그룹과 채널은 채널별로 계속 격리됩니다.

- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 채널/룸: `agent:<agentId>:<channel>:channel:<id>`

스레드:

- Slack/Discord 스레드는 기본 키 뒤에 `:thread:<threadId>`를 추가합니다.
- Telegram 포럼 토픽은 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DM 라우트 고정

`session.dmScope`가 `main`이면 다이렉트 메시지가 하나의 main 세션을 공유할 수 있습니다. 비소유자 DM이 세션의 `lastRoute`를 덮어쓰는 것을 방지하기 위해, OpenClaw는 다음 조건이 모두 참일 때 `allowFrom`에서 고정된 소유자를 추론합니다.

- `allowFrom`에 와일드카드가 아닌 항목이 정확히 하나 있습니다.
- 해당 항목을 그 채널의 구체적인 발신자 ID로 정규화할 수 있습니다.
- 인바운드 DM 발신자가 그 고정된 소유자와 일치하지 않습니다.

이 불일치 경우 OpenClaw는 여전히 인바운드 세션 메타데이터를 기록하지만, main 세션의 `lastRoute` 업데이트는 건너뜁니다.

## 라우팅 규칙(에이전트가 선택되는 방식)

라우팅은 각 인바운드 메시지에 대해 **하나의 에이전트**를 선택합니다.

1. **정확한 피어 일치** (`bindings`에서 `peer.kind` + `peer.id`).
2. **상위 피어 일치** (스레드 상속).
3. **길드 + 역할 일치** (Discord) (`guildId` + `roles` 사용).
4. **길드 일치** (Discord) (`guildId` 사용).
5. **팀 일치** (Slack) (`teamId` 사용).
6. **계정 일치** (채널의 `accountId`).
7. **채널 일치** (해당 채널의 모든 계정, `accountId: "*"`).
8. **기본 에이전트** (`agents.list[].default`, 없으면 첫 번째 목록 항목, 폴백은 `main`).

바인딩에 여러 일치 필드(`peer`, `guildId`, `teamId`, `roles`)가 포함되어 있으면, 해당 바인딩이 적용되려면 **제공된 모든 필드가 일치해야 합니다**.

일치된 에이전트에 따라 어떤 워크스페이스와 세션 저장소가 사용될지가 결정됩니다.

## 브로드캐스트 그룹(여러 에이전트 실행)

브로드캐스트 그룹을 사용하면 **OpenClaw가 일반적으로 응답하는 경우**(예: WhatsApp 그룹에서 멘션/활성화 게이팅 이후)에 동일한 피어에 대해 **여러 에이전트**를 실행할 수 있습니다.

구성:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

참고: [브로드캐스트 그룹](/ko/channels/broadcast-groups).

## 구성 개요

- `agents.list`: 이름이 지정된 에이전트 정의(워크스페이스, 모델 등).
- `bindings`: 인바운드 채널/계정/피어를 에이전트에 매핑합니다.

예시:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 세션 저장소

세션 저장소는 상태 디렉터리(기본값 `~/.openclaw`) 아래에 있습니다.

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 전사 파일은 저장소와 같은 위치에 저장됩니다.

`session.store`와 `{agentId}` 템플릿을 통해 저장소 경로를 재정의할 수 있습니다.

Gateway 및 ACP 세션 검색은 기본 `agents/` 루트 아래의 디스크 기반 에이전트 저장소와 템플릿화된 `session.store` 루트 아래도 검사합니다. 검색된 저장소는 해당 해석된 에이전트 루트 내부에 있어야 하며 일반 `sessions.json` 파일을 사용해야 합니다. 심볼릭 링크와 루트 바깥 경로는 무시됩니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 연결되며 기본적으로 에이전트의 main 세션을 사용합니다. 이 때문에 WebChat을 사용하면 해당 에이전트의 교차 채널 컨텍스트를 한곳에서 볼 수 있습니다.

## 응답 컨텍스트

인바운드 응답에는 다음이 포함됩니다.

- 가능한 경우 `ReplyToId`, `ReplyToBody`, `ReplyToSender`.
- 인용된 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이는 채널 전반에서 일관되게 적용됩니다.

## 관련 문서

- [그룹](/ko/channels/groups)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [페어링](/ko/channels/pairing)
