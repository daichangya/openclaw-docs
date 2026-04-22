---
read_when:
    - 채널 전송은 연결됨으로 표시되지만 응답이 실패함
    - 심층 프로바이더 문서를 보기 전에 채널별 확인이 필요합니다
summary: 채널별 실패 시그니처와 수정 방법을 포함한 빠른 채널 수준 문제 해결
title: 채널 문제 해결
x-i18n:
    generated_at: "2026-04-22T04:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# 채널 문제 해결

채널은 연결되었지만 동작이 잘못될 때 이 페이지를 사용하세요.

## 명령어 사다리

먼저 다음 명령을 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 기준선:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, 또는 `admin-capable`
- 채널 프로브에 전송 연결 상태가 표시되고, 지원되는 경우 `works` 또는 `audit ok`가 표시됨

## WhatsApp

### WhatsApp 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 연결되었지만 DM 응답이 없음 | `openclaw pairing list whatsapp` | 발신자를 승인하거나 DM 정책/허용 목록으로 전환합니다. |
| 그룹 메시지가 무시됨 | 구성에서 `requireMention` + 멘션 패턴 확인 | 봇을 멘션하거나 해당 그룹의 멘션 정책을 완화합니다. |
| 무작위 연결 끊김/재로그인 루프 | `openclaw channels status --probe` + 로그 | 다시 로그인하고 자격 증명 디렉터리가 정상인지 확인합니다. |

전체 문제 해결: [WhatsApp troubleshooting](/ko/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`는 되지만 사용할 수 있는 응답 흐름이 없음 | `openclaw pairing list telegram` | 페어링을 승인하거나 DM 정책을 변경합니다. |
| 봇은 온라인이지만 그룹에서 침묵함 | 멘션 요구 사항과 봇 privacy mode 확인 | 그룹 가시성을 위해 privacy mode를 비활성화하거나 봇을 멘션합니다. |
| 네트워크 오류와 함께 전송 실패 | 로그에서 Telegram API 호출 실패 확인 | `api.telegram.org`로의 DNS/IPv6/프록시 라우팅을 수정합니다. |
| 폴링이 멈추거나 재연결이 느림 | `openclaw logs --follow`로 폴링 진단 확인 | 업그레이드하세요. 재시작이 오탐이라면 `pollingStallThresholdMs`를 조정하세요. 지속적인 멈춤은 여전히 프록시/DNS/IPv6를 가리킵니다. |
| 시작 시 `setMyCommands`가 거부됨 | 로그에서 `BOT_COMMANDS_TOO_MUCH` 확인 | Plugin/Skills/사용자 지정 Telegram 명령을 줄이거나 네이티브 메뉴를 비활성화합니다. |
| 업그레이드 후 허용 목록 때문에 차단됨 | `openclaw security audit` 및 구성 허용 목록 | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자 발신자 ID로 바꿉니다. |

전체 문제 해결: [Telegram troubleshooting](/ko/channels/telegram#troubleshooting)

## Discord

### Discord 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 봇은 온라인이지만 guild 응답이 없음 | `openclaw channels status --probe` | guild/channel을 허용하고 message content intent를 확인합니다. |
| 그룹 메시지가 무시됨 | 로그에서 멘션 게이팅 드롭 확인 | 봇을 멘션하거나 guild/channel `requireMention: false`로 설정합니다. |
| DM 응답이 없음 | `openclaw pairing list discord` | DM 페어링을 승인하거나 DM 정책을 조정합니다. |

전체 문제 해결: [Discord troubleshooting](/ko/channels/discord#troubleshooting)

## Slack

### Slack 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode는 연결되었지만 응답이 없음 | `openclaw channels status --probe` | 앱 토큰 + 봇 토큰 및 필요한 스코프를 확인하세요. SecretRef 기반 설정에서는 `botTokenStatus` / `appTokenStatus = configured_unavailable`를 확인하세요. |
| DM이 차단됨 | `openclaw pairing list slack` | 페어링을 승인하거나 DM 정책을 완화합니다. |
| 채널 메시지가 무시됨 | `groupPolicy` 및 채널 허용 목록 확인 | 채널을 허용하거나 정책을 `open`으로 전환합니다. |

전체 문제 해결: [Slack troubleshooting](/ko/channels/slack#troubleshooting)

## iMessage 및 BlueBubbles

### iMessage 및 BlueBubbles 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 인바운드 이벤트가 없음 | Webhook/서버 도달 가능성과 앱 권한 확인 | Webhook URL 또는 BlueBubbles 서버 상태를 수정합니다. |
| 보낼 수는 있지만 macOS에서 수신이 안 됨 | Messages 자동화에 대한 macOS 개인정보 보호 권한 확인 | TCC 권한을 다시 부여하고 채널 프로세스를 재시작합니다. |
| DM 발신자가 차단됨 | `openclaw pairing list imessage` 또는 `openclaw pairing list bluebubbles` | 페어링을 승인하거나 허용 목록을 업데이트합니다. |

전체 문제 해결:

- [iMessage troubleshooting](/ko/channels/imessage#troubleshooting)
- [BlueBubbles troubleshooting](/ko/channels/bluebubbles#troubleshooting)

## Signal

### Signal 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 데몬에는 도달 가능하지만 봇이 침묵함 | `openclaw channels status --probe` | `signal-cli` 데몬 URL/계정과 수신 모드를 확인합니다. |
| DM이 차단됨 | `openclaw pairing list signal` | 발신자를 승인하거나 DM 정책을 조정합니다. |
| 그룹 응답이 트리거되지 않음 | 그룹 허용 목록과 멘션 패턴 확인 | 발신자/그룹을 추가하거나 게이팅을 완화합니다. |

전체 문제 해결: [Signal troubleshooting](/ko/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 봇이 "gone to Mars"라고 응답함 | 구성에서 `appId` 및 `clientSecret` 확인 | 자격 증명을 설정하거나 Gateway를 재시작합니다. |
| 인바운드 메시지가 없음 | `openclaw channels status --probe` | QQ Open Platform에서 자격 증명을 확인합니다. |
| 음성이 전사되지 않음 | STT 프로바이더 구성 확인 | `channels.qqbot.stt` 또는 `tools.media.audio`를 구성합니다. |
| 선제적 메시지가 도착하지 않음 | QQ 플랫폼 상호작용 요구 사항 확인 | QQ는 최근 상호작용이 없으면 봇이 시작한 메시지를 차단할 수 있습니다. |

전체 문제 해결: [QQ Bot troubleshooting](/ko/channels/qqbot#troubleshooting)

## Matrix

### Matrix 실패 시그니처

| 증상 | 가장 빠른 확인 방법 | 수정 방법 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 로그인했지만 룸 메시지를 무시함 | `openclaw channels status --probe` | `groupPolicy`, 룸 허용 목록, 멘션 게이팅을 확인합니다. |
| DM이 처리되지 않음 | `openclaw pairing list matrix` | 발신자를 승인하거나 DM 정책을 조정합니다. |
| 암호화된 룸에서 실패함 | `openclaw matrix verify status` | 장치를 다시 검증한 다음 `openclaw matrix verify backup status`를 확인합니다. |
| 백업 복원이 대기 중이거나 손상됨 | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`를 실행하거나 복구 키로 다시 실행합니다. |
| 교차 서명/bootstrap이 잘못된 것처럼 보임 | `openclaw matrix verify bootstrap` | 비밀 저장소, 교차 서명, 백업 상태를 한 번에 복구합니다. |

전체 설정 및 구성: [Matrix](/ko/channels/matrix)
