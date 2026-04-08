---
read_when:
    - OpenClaw용 Zalo Personal 설정하기
    - Zalo Personal 로그인 또는 메시지 흐름 디버깅하기
summary: native `zca-js`를 통한 Zalo 개인 계정 지원(QR 로그인), 기능 및 구성
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-08T02:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08f50edb2f4c6fe24972efe5e321f5fd0572c7d29af5c1db808151c7c943dc66
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (비공식)

상태: 실험적. 이 통합은 OpenClaw 내부에서 네이티브 `zca-js`를 통해 **개인 Zalo 계정**을 자동화합니다.

> **경고:** 이것은 비공식 통합이며 계정 정지/차단으로 이어질 수 있습니다. 사용에 따른 책임은 본인에게 있습니다.

## 번들 plugin

Zalo Personal은 현재 OpenClaw 릴리스에 번들 plugin으로 포함되어 있으므로 일반적인
패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드 또는 Zalo Personal이 제외된 사용자 지정 설치를 사용하는 경우,
수동으로 설치하세요:

- CLI를 통해 설치: `openclaw plugins install @openclaw/zalouser`
- 또는 소스 체크아웃에서: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 자세한 내용: [Plugins](/ko/tools/plugin)

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 빠른 설정(초보자용)

1. Zalo Personal plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. 로그인합니다(게이트웨이 머신에서 QR 사용):
   - `openclaw channels login --channel zalouser`
   - Zalo 모바일 앱으로 QR 코드를 스캔합니다.
3. 채널을 활성화합니다:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 게이트웨이를 다시 시작합니다(또는 설정을 마칩니다).
5. DM 액세스는 기본적으로 pairing으로 설정되며, 첫 연락 시 pairing 코드를 승인해야 합니다.

## 개요

- `zca-js`를 통해 전부 인프로세스로 실행됩니다.
- 네이티브 이벤트 리스너를 사용해 수신 메시지를 받습니다.
- JS API를 통해 직접 답장을 전송합니다(텍스트/미디어/링크).
- Zalo Bot API를 사용할 수 없는 “개인 계정” 사용 사례를 위해 설계되었습니다.

## 명명

채널 id는 `zalouser`입니다. 이는 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위함입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 예약해 둡니다.

## ID 찾기(디렉터리)

피어/그룹과 해당 ID를 찾으려면 디렉터리 CLI를 사용하세요:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한 사항

- 발신 텍스트는 약 2000자로 분할됩니다(Zalo 클라이언트 제한).
- 스트리밍은 기본적으로 차단됩니다.

## 액세스 제어(DM)

`channels.zalouser.dmPolicy`는 다음을 지원합니다: `pairing | allowlist | open | disabled` (기본값: `pairing`).

`channels.zalouser.allowFrom`은 사용자 ID 또는 이름을 받습니다. 설정 중에는 plugin의 인프로세스 연락처 조회를 사용해 이름을 ID로 확인합니다.

승인 방법:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 액세스(선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "open"` (그룹 허용). 설정되지 않은 경우 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- 다음과 같이 allowlist로 제한:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (키는 안정적인 그룹 ID여야 하며, 가능하면 시작 시 이름을 ID로 확인합니다)
  - `channels.zalouser.groupAllowFrom` (허용된 그룹에서 어떤 발신자가 봇을 트리거할 수 있는지 제어)
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- 구성 마법사에서 그룹 allowlist를 묻는 프롬프트를 표시할 수 있습니다.
- 시작 시 OpenClaw는 allowlist의 그룹/사용자 이름을 ID로 확인하고 해당 매핑을 기록합니다.
- 그룹 allowlist 매칭은 기본적으로 ID 전용입니다. `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되지 않은 한, 확인되지 않은 이름은 인증에 대해 무시됩니다.
- `channels.zalouser.dangerouslyAllowNameMatching: true`는 변경 가능한 그룹 이름 매칭을 다시 활성화하는 비상용 호환 모드입니다.
- `groupAllowFrom`이 설정되지 않으면, 런타임은 그룹 발신자 검사에 `allowFrom`으로 대체합니다.
- 발신자 검사는 일반 그룹 메시지와 제어 명령(예: `/new`, `/reset`) 모두에 적용됩니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 그룹 멘션 게이팅

- `channels.zalouser.groups.<group>.requireMention`은 그룹 답장에 멘션이 필요한지 여부를 제어합니다.
- 확인 순서: 정확한 그룹 id/이름 -> 정규화된 그룹 슬러그 -> `*` -> 기본값(`true`).
- 이는 allowlist에 포함된 그룹과 open 그룹 모드 모두에 적용됩니다.
- 봇 메시지를 인용하면 그룹 활성화를 위한 암묵적 멘션으로 간주됩니다.
- 권한이 있는 제어 명령(예: `/new`)은 멘션 게이팅을 우회할 수 있습니다.
- 멘션이 필요해서 그룹 메시지가 건너뛰어지면, OpenClaw는 이를 보류 중인 그룹 기록으로 저장하고 다음에 처리되는 그룹 메시지에 포함합니다.
- 그룹 기록 제한은 기본적으로 `messages.groupChat.historyLimit`(대체값 `50`)입니다. 계정별로 `channels.zalouser.historyLimit`으로 재정의할 수 있습니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## 다중 계정

계정은 OpenClaw 상태의 `zalouser` 프로필에 매핑됩니다. 예시:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 타이핑, 리액션 및 전달 확인

- OpenClaw는 답장을 전송하기 전에 타이핑 이벤트를 보냅니다(가능한 범위 내에서).
- 메시지 리액션 액션 `react`는 채널 액션에서 `zalouser`에 대해 지원됩니다.
  - 특정 메시지에서 특정 리액션 이모지를 제거하려면 `remove: true`를 사용하세요.
  - 리액션 의미 체계: [Reactions](/ko/tools/reactions)
- 이벤트 메타데이터가 포함된 수신 메시지의 경우, OpenClaw는 전달됨 + 읽음 확인을 보냅니다(가능한 범위 내에서).

## 문제 해결

**로그인이 유지되지 않는 경우:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**allowlist/그룹 이름이 확인되지 않은 경우:**

- `allowFrom`/`groupAllowFrom`/`groups`에 숫자 ID 또는 정확한 친구/그룹 이름을 사용하세요.

**기존 CLI 기반 설정에서 업그레이드한 경우:**

- 기존 외부 `zca` 프로세스 가정은 제거하세요.
- 이제 이 채널은 외부 CLI 바이너리 없이 OpenClaw 내부에서 완전히 실행됩니다.

## 관련 문서

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 pairing 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 보안 강화
