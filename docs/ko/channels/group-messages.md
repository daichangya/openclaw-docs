---
read_when:
    - 그룹 메시지 규칙 또는 멘션 변경하기
summary: WhatsApp 그룹 메시지 처리의 동작 및 구성(`mentionPatterns`는 여러 표면에서 공유됨)
title: 그룹 메시지
x-i18n:
    generated_at: "2026-04-24T06:03:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# 그룹 메시지(WhatsApp 웹 채널)

목표: Clawd가 WhatsApp 그룹에 참여하고, 핑을 받았을 때만 깨어나며, 해당 스레드를 개인 DM 세션과 분리해서 유지하도록 합니다.

참고: `agents.list[].groupChat.mentionPatterns`는 이제 Telegram/Discord/Slack/iMessage에서도 사용됩니다. 이 문서는 WhatsApp 전용 동작에 초점을 맞춥니다. 다중 에이전트 설정에서는 에이전트별로 `agents.list[].groupChat.mentionPatterns`를 설정하거나, 전역 폴백으로 `messages.groupChat.mentionPatterns`를 사용하세요.

## 현재 구현(2025-12-03)

- 활성화 모드: `mention`(기본값) 또는 `always`. `mention`은 핑이 필요합니다(실제 WhatsApp @멘션인 `mentionedJids`, 안전한 정규식 패턴, 또는 텍스트 어디에나 포함된 봇의 E.164). `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 가치를 더할 수 있을 때만 응답해야 하며 그렇지 않으면 정확히 `NO_REPLY` / `no_reply` 무음 토큰을 반환합니다. 기본값은 구성의 `channels.whatsapp.groups`에서 설정할 수 있고, 그룹별로 `/activation`으로 재정의할 수 있습니다. `channels.whatsapp.groups`가 설정되어 있으면 그룹 허용 목록으로도 동작합니다(모두 허용하려면 `"*"` 포함).
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지를 허용할지 여부를 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(폴백: 명시적인 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다(발신자를 추가하기 전까지 차단됨).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형태이므로 `/verbose on`, `/trace on`, `/think high` 같은 명령(독립 실행형 메시지로 전송)은 해당 그룹 범위에만 적용되며, 개인 DM 상태는 건드리지 않습니다. Heartbeat는 그룹 스레드에서 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 않은 **보류 중인 전용** 그룹 메시지(기본값 50개)는 `[Chat messages since your last reply - for context]` 아래에 접두되어 추가되고, 트리거한 줄은 `[Current message - respond to this]` 아래에 추가됩니다. 이미 세션에 있는 메시지는 다시 주입되지 않습니다.
- 발신자 노출: 이제 모든 그룹 배치의 끝에는 `[from: Sender Name (+E164)]`가 붙어서 Pi가 누가 말하고 있는지 알 수 있습니다.
- 일회성/보기 1회 메시지: 텍스트/멘션을 추출하기 전에 이를 언랩하므로, 그 안의 핑도 여전히 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 번째 턴(그리고 `/activation`이 모드를 변경할 때마다)에 시스템 프롬프트에 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 같은 짧은 설명을 주입합니다. 메타데이터를 사용할 수 없는 경우에도 에이전트에 이것이 그룹 채팅이라는 점은 알려줍니다.

## 구성 예시(WhatsApp)

WhatsApp가 텍스트 본문에서 시각적 `@`를 제거하더라도 표시 이름 핑이 작동하도록 `~/.openclaw/openclaw.json`에 `groupChat` 블록을 추가하세요.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

참고:

- 정규식은 대소문자를 구분하지 않으며, 다른 구성 정규식 표면과 동일한 safe-regex 가드레일을 사용합니다. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 누군가 연락처를 탭하면 WhatsApp는 여전히 `mentionedJids`를 통해 정식 멘션을 보내므로, 번호 폴백은 거의 필요 없지만 유용한 안전망입니다.

### 활성화 명령(소유자 전용)

그룹 채팅 명령을 사용하세요.

- `/activation mention`
- `/activation always`

이를 변경할 수 있는 것은 소유자 번호뿐입니다(`channels.whatsapp.allowFrom`에서 가져오며, 설정되지 않은 경우 봇 자체의 E.164 사용). 현재 활성화 모드를 보려면 그룹에서 `/status`를 독립 실행형 메시지로 보내세요.

## 사용 방법

1. OpenClaw를 실행 중인 WhatsApp 계정을 그룹에 추가합니다.
2. `@openclaw …`라고 말하거나(또는 번호를 포함하거나) 하세요. `groupPolicy: "open"`을 설정하지 않는 한 허용 목록에 있는 발신자만 이를 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 마지막의 `[from: …]` 마커가 포함되므로, 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시문(`/verbose on`, `/trace on`, `/think high`, `/new` 또는 `/reset`, `/compact`)은 해당 그룹 세션에만 적용됩니다. 등록되도록 하려면 이를 독립 실행형 메시지로 보내세요. 개인 DM 세션은 별도로 유지됩니다.

## 테스트 / 검증

- 수동 스모크 테스트:
  - 그룹에서 `@openclaw` 핑을 보내고 발신자 이름을 참조하는 응답이 오는지 확인합니다.
  - 두 번째 핑을 보내고 기록 블록이 포함된 뒤 다음 턴에서 지워지는지 확인합니다.
- Gateway 로그(`--verbose`로 실행)를 확인하여 `from: <groupJid>`와 `[from: …]` 접미사가 표시되는 `inbound web message` 항목을 확인하세요.

## 알려진 고려 사항

- 시끄러운 브로드캐스트를 피하기 위해 Heartbeat는 의도적으로 그룹에서 건너뜁니다.
- 에코 억제는 결합된 배치 문자열을 사용합니다. 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째에만 응답이 옵니다.
- 세션 저장소 항목은 세션 저장소(기본값 `~/.openclaw/agents/<agentId>/sessions/sessions.json`)에 `agent:<agentId>:whatsapp:group:<jid>`로 표시됩니다. 항목이 없다는 것은 아직 해당 그룹이 실행을 트리거하지 않았다는 뜻일 뿐입니다.
- 그룹의 타이핑 표시기는 `agents.defaults.typingMode`를 따릅니다(기본값: 멘션되지 않았을 때 `message`).

## 관련 문서

- [그룹](/ko/channels/groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
