---
read_when:
    - 채널의 연락처/그룹/self ID를 조회하려고 합니다
    - 채널 디렉터리 어댑터를 개발 중입니다
summary: '`openclaw directory`용 CLI 참조(self, peers, groups)'
title: 디렉터리
x-i18n:
    generated_at: "2026-04-24T06:07:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

이를 지원하는 채널에 대한 디렉터리 조회(연락처/피어, 그룹, “me”).

## 공통 플래그

- `--channel <name>`: 채널 id/별칭(여러 채널이 구성된 경우 필수, 하나만 구성된 경우 자동)
- `--account <id>`: 계정 id(기본값: 채널 기본값)
- `--json`: JSON 출력

## 참고

- `directory`는 다른 명령에 붙여 넣을 수 있는 ID를 찾는 데 도움을 주기 위한 것입니다(특히 `openclaw message send --target ...`).
- 많은 채널에서 결과는 실시간 Provider 디렉터리가 아니라 구성 기반(허용 목록 / 구성된 그룹)입니다.
- 기본 출력은 탭으로 구분된 `id`(및 경우에 따라 `name`)입니다. 스크립트용으로는 `--json`을 사용하세요.

## `message send`와 함께 결과 사용하기

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 형식(채널별)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (그룹)
- Telegram: `@username` 또는 숫자형 채팅 id, 그룹은 숫자형 id
- Slack: `user:U…` 및 `channel:C…`
- Discord: `user:<id>` 및 `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, 또는 `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` 및 `conversation:<id>`
- Zalo (Plugin): 사용자 id(Bot API)
- Zalo Personal / `zalouser` (Plugin): `zca`의 스레드 id(DM/그룹) (`me`, `friend list`, `group list`)

## Self ("me")

```bash
openclaw directory self --channel zalouser
```

## 피어(연락처/사용자)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 그룹

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 관련 문서

- [CLI 참조](/ko/cli)
