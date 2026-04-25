---
read_when:
    - OpenClaw을 QQ에 연결하려고 합니다.
    - QQ Bot 자격 증명 설정이 필요합니다.
    - QQ Bot 그룹 또는 개인 채팅 지원이 필요합니다.
summary: QQ Bot 설정, 구성 및 사용
title: QQ 봇
x-i18n:
    generated_at: "2026-04-25T12:23:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot은 공식 QQ Bot API(WebSocket gateway)를 통해 OpenClaw에 연결됩니다. 이
Plugin은 C2C 개인 채팅, 그룹 @메시지, 길드 채널 메시지를 지원하며, 리치 미디어(이미지, 음성, 비디오, 파일)도 지원합니다.

상태: 번들된 Plugin입니다. 다이렉트 메시지, 그룹 채팅, 길드 채널, 그리고
미디어가 지원됩니다. 반응과 스레드는 지원되지 않습니다.

## 번들된 Plugin

현재 OpenClaw 릴리스에는 QQ Bot이 번들되어 있으므로, 일반적인 패키지 빌드에서는
별도의 `openclaw plugins install` 단계가 필요하지 않습니다.

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동한 뒤, 휴대폰 QQ로 QR 코드를 스캔하여
   등록 / 로그인합니다.
2. **Create Bot**을 클릭하여 새 QQ bot을 만듭니다.
3. bot 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사합니다.

> AppSecret은 평문으로 저장되지 않습니다 — 저장하지 않고 페이지를 벗어나면,
> 새 값을 다시 생성해야 합니다.

4. 채널을 추가합니다:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway를 재시작합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

## 구성

최소 구성:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

기본 계정 env vars:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

파일 기반 AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

참고:

- env 대체값은 기본 QQ Bot 계정에만 적용됩니다.
- `openclaw channels add --channel qqbot --token-file ...`는
  AppSecret만 제공합니다. AppID는 이미 config 또는 `QQBOT_APP_ID`에 설정되어 있어야 합니다.
- `clientSecret`은 평문 문자열뿐 아니라 SecretRef 입력도 허용합니다.

### 다중 계정 설정

하나의 OpenClaw 인스턴스에서 여러 QQ bot을 실행할 수 있습니다:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

각 계정은 자체 WebSocket 연결을 시작하고 독립적인
토큰 캐시를 유지합니다(`appId`별로 격리됨).

CLI로 두 번째 bot 추가:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 음성(STT / TTS)

STT와 TTS는 우선순위 대체를 갖는 2단계 구성을 지원합니다:

| Setting | Plugin별 설정       | 프레임워크 대체값            |
| ------- | ------------------- | ---------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

비활성화하려면 둘 중 하나에 `enabled: false`를 설정합니다.

수신된 QQ 음성 첨부 파일은 원시 음성 파일을 일반 `MediaPaths`에 두지 않으면서,
오디오 미디어 메타데이터로 agent에 노출됩니다. TTS가 구성되어 있으면
`[[audio_as_voice]]` 일반 텍스트 응답이 TTS를 합성하고 네이티브 QQ 음성 메시지를 전송합니다.

발신 오디오 업로드/트랜스코드 동작은
`channels.qqbot.audioFormatPolicy`로도 조정할 수 있습니다:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| Format                     | 설명              |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | 개인 채팅 (C2C)   |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅         |
| `qqbot:channel:CHANNEL_ID` | 길드 채널         |

> 각 bot은 자체 사용자 OpenID 집합을 가집니다. Bot A가 받은 OpenID는 **사용할 수 없으며**
> Bot B를 통해 메시지를 보내는 데 사용할 수 없습니다.

## 슬래시 명령

AI 큐 전에 가로채는 내장 명령:

| Command        | 설명                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 지연 시간 테스트                                                                                          |
| `/bot-version` | OpenClaw 프레임워크 버전 표시                                                                             |
| `/bot-help`    | 모든 명령 나열                                                                                            |
| `/bot-upgrade` | QQBot 업그레이드 가이드 링크 표시                                                                         |
| `/bot-logs`    | 최근 gateway 로그를 파일로 내보내기                                                                       |
| `/bot-approve` | 보류 중인 QQ Bot 작업(예: C2C 또는 그룹 업로드 확인)을 네이티브 흐름을 통해 승인합니다. |

사용법 도움말을 보려면 아무 명령에나 `?`를 붙입니다(예: `/bot-upgrade ?`).

## 엔진 아키텍처

QQ Bot은 Plugin 내부에 포함된 독립형 엔진으로 제공됩니다:

- 각 계정은 `appId`를 키로 하는 격리된 리소스 스택(WebSocket 연결, API 클라이언트, 토큰 캐시, 미디어 저장소 루트)을 가집니다. 계정 간에 수신/발신 상태를 공유하지 않습니다.
- 다중 계정 로거는 로그 줄에 소유 계정을 태그하므로, 하나의 gateway에서 여러 bot을 실행할 때도 진단을 분리해서 볼 수 있습니다.
- 수신, 발신, gateway bridge 경로는 `~/.openclaw/media` 아래의 단일 미디어 페이로드 루트를 공유하므로, 업로드, 다운로드, 트랜스코드 캐시가 하위 시스템별 트리가 아니라 하나의 보호된 디렉터리에 저장됩니다.
- 자격 증명은 표준 OpenClaw 자격 증명 스냅샷의 일부로 백업 및 복원할 수 있으며, 엔진은 복원 시 각 계정의 리소스 스택을 다시 연결하므로 새 QR 코드 페어링이 필요하지 않습니다.

## QR 코드 온보딩

`AppID:AppSecret`을 수동으로 붙여 넣는 방법 외에도, 이 엔진은 QQ Bot을 OpenClaw에 연결하기 위한 QR 코드 온보딩 흐름을 지원합니다:

1. QQ Bot 설정 경로를 실행하고(예: `openclaw channels add --channel qqbot`), 프롬프트가 표시되면 QR 코드 흐름을 선택합니다.
2. 대상 QQ Bot에 연결된 휴대폰 앱으로 생성된 QR 코드를 스캔합니다.
3. 휴대폰에서 페어링을 승인합니다. OpenClaw은 반환된 자격 증명을 올바른 계정 범위 아래 `credentials/`에 저장합니다.

bot 자체에서 생성된 승인 프롬프트(예: QQ Bot API에서 노출하는 "이 작업을 허용할까요?" 흐름)는 원시 QQ 클라이언트에서 응답하는 대신 `/bot-approve`로 수락할 수 있는 네이티브 OpenClaw 프롬프트로 표시됩니다.

## 문제 해결

- **Bot이 "gone to Mars"라고 응답함:** 자격 증명이 구성되지 않았거나 Gateway가 시작되지 않았습니다.
- **수신 메시지가 없음:** `appId`와 `clientSecret`이 올바른지, 그리고
  bot이 QQ Open Platform에서 활성화되어 있는지 확인하세요.
- **`--token-file`로 설정했는데도 미구성으로 표시됨:** `--token-file`은
  AppSecret만 설정합니다. 여전히 config 또는 `QQBOT_APP_ID`에 `appId`가 필요합니다.
- **선제적 메시지가 도착하지 않음:** 사용자가 최근에 상호작용하지 않았다면
  QQ가 bot이 시작한 메시지를 차단할 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 provider에 연결 가능한지 확인하세요.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
