---
read_when:
    - Signal 지원 설정하기
    - Signal 송수신 디버깅하기
summary: signal-cli(JSON-RPC + SSE)를 통한 Signal 지원, 설정 경로 및 번호 모델
title: Signal
x-i18n:
    generated_at: "2026-04-24T06:04:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (`signal-cli`)

상태: 외부 CLI 통합. Gateway는 HTTP JSON-RPC + SSE를 통해 `signal-cli`와 통신합니다.

## 사전 요구 사항

- 서버에 OpenClaw가 설치되어 있어야 합니다(아래 Linux 흐름은 Ubuntu 24에서 테스트됨).
- Gateway가 실행되는 호스트에서 `signal-cli`를 사용할 수 있어야 합니다.
- 인증 SMS를 한 번 받을 수 있는 전화번호가 필요합니다(SMS 등록 경로용).
- 등록 중 Signal captcha(`signalcaptchas.org`)를 위한 브라우저 접근이 필요합니다.

## 빠른 설정(초보자용)

1. 봇에는 **별도의 Signal 번호**를 사용합니다(권장).
2. `signal-cli`를 설치합니다(JVM 빌드를 사용하면 Java 필요).
3. 다음 설정 경로 중 하나를 선택합니다:
   - **경로 A (QR 연결):** `signal-cli link -n "OpenClaw"`를 실행하고 Signal로 스캔합니다.
   - **경로 B (SMS 등록):** captcha + SMS 인증으로 전용 번호를 등록합니다.
4. OpenClaw를 구성하고 Gateway를 재시작합니다.
5. 첫 번째 DM을 보내고 페어링을 승인합니다(`openclaw pairing approve signal <CODE>`).

최소 구성:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

필드 참조:

| 필드        | 설명                                           |
| ----------- | ---------------------------------------------- |
| `account`   | E.164 형식의 봇 전화번호 (`+15551234567`)      |
| `cliPath`   | `signal-cli` 경로 (`PATH`에 있으면 `signal-cli`) |
| `dmPolicy`  | DM 접근 정책 (`pairing` 권장)                  |
| `allowFrom` | DM을 보낼 수 있도록 허용된 전화번호 또는 `uuid:<id>` 값 |

## 개요

- `signal-cli`를 통한 Signal 채널(libsignal 내장 아님)
- 결정적 라우팅: 응답은 항상 Signal로 다시 전송됨
- DM은 에이전트의 기본 세션을 공유하고, 그룹은 격리됨(`agent:<agentId>:signal:group:<groupId>`)

## 구성 쓰기

기본적으로 Signal은 `/config set|unset`으로 트리거되는 구성 업데이트 쓰기를 허용합니다(`commands.config: true` 필요).

다음과 같이 비활성화합니다:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 번호 모델(중요)

- Gateway는 **Signal 디바이스**(`signal-cli` 계정)에 연결됩니다.
- 봇을 **개인 Signal 계정**에서 실행하면 자신의 메시지는 무시합니다(루프 방지).
- "내가 봇에 문자를 보내면 봇이 응답"하는 흐름을 원한다면 **별도의 봇 번호**를 사용하세요.

## 설정 경로 A: 기존 Signal 계정 연결(QR)

1. `signal-cli`를 설치합니다(JVM 또는 네이티브 빌드).
2. 봇 계정을 연결합니다:
   - `signal-cli link -n "OpenClaw"`를 실행한 뒤 Signal에서 QR을 스캔합니다.
3. Signal을 구성하고 Gateway를 시작합니다.

예시:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

다중 계정 지원: 계정별 구성과 선택적 `name`을 위해 `channels.signal.accounts`를 사용합니다. 공유 패턴은 [`gateway/configuration`](/ko/gateway/config-channels#multi-account-all-channels)을 참조하세요.

## 설정 경로 B: 전용 봇 번호 등록(SMS, Linux)

기존 Signal 앱 계정을 연결하는 대신 전용 봇 번호를 사용하려는 경우 이 방법을 사용합니다.

1. SMS(또는 유선 전화의 경우 음성 인증)를 받을 수 있는 번호를 준비합니다.
   - 계정/세션 충돌을 피하려면 전용 봇 번호를 사용하세요.
2. Gateway 호스트에 `signal-cli`를 설치합니다:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM 빌드(`signal-cli-${VERSION}.tar.gz`)를 사용하는 경우 먼저 JRE 25+를 설치하세요.
`signal-cli`는 계속 최신 상태로 유지하세요. Signal 서버 API가 변경되면 오래된 릴리스가 동작하지 않을 수 있다고 업스트림에서 안내합니다.

3. 번호를 등록하고 인증합니다:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha가 필요한 경우:

1. `https://signalcaptchas.org/registration/generate.html`를 엽니다.
2. captcha를 완료하고 "Open Signal"의 `signalcaptcha://...` 링크 대상을 복사합니다.
3. 가능하면 브라우저 세션과 동일한 외부 IP에서 실행합니다.
4. 등록을 즉시 다시 실행합니다(captcha 토큰은 빠르게 만료됨):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 구성하고 Gateway를 재시작한 뒤 채널을 확인합니다:

```bash
# Gateway를 사용자 systemd 서비스로 실행하는 경우:
systemctl --user restart openclaw-gateway.service

# 그런 다음 확인:
openclaw doctor
openclaw channels status --probe
```

5. DM 발신자를 페어링합니다:
   - 봇 번호로 아무 메시지나 보냅니다.
   - 서버에서 코드를 승인합니다: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "알 수 없는 연락처"를 피하려면 휴대폰에 봇 번호를 연락처로 저장하세요.

중요: 전화번호 계정을 `signal-cli`로 등록하면 해당 번호의 기본 Signal 앱 세션 인증이 해제될 수 있습니다. 전용 봇 번호를 사용하는 것이 좋으며, 기존 휴대폰 앱 설정을 유지해야 한다면 QR 연결 모드를 사용하세요.

업스트림 참조:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha 흐름: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 연결 흐름: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 외부 데몬 모드(`httpUrl`)

`signal-cli`를 직접 관리하려는 경우(느린 JVM 콜드 스타트, 컨테이너 초기화, 또는 공유 CPU), 데몬을 별도로 실행하고 OpenClaw가 이를 가리키게 할 수 있습니다:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

이렇게 하면 OpenClaw 내부의 자동 스폰과 시작 대기를 건너뜁니다. 자동 스폰 시 시작이 느리다면 `channels.signal.startupTimeoutMs`를 설정하세요.

## 접근 제어(DM + 그룹)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 발신자에게는 페어링 코드가 전송되며, 승인되기 전까지 메시지는 무시됩니다(코드는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 페어링은 Signal DM의 기본 토큰 교환 방식입니다. 자세한 내용: [페어링](/ko/channels/pairing)
- UUID 전용 발신자(`sourceUuid`)는 `channels.signal.allowFrom`에 `uuid:<id>`로 저장됩니다.

그룹:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`은 `allowlist`가 설정된 경우 그룹에서 누가 트리거할 수 있는지 제어합니다.
- `channels.signal.groups["<group-id>" | "*"]`는 `requireMention`, `tools`, `toolsBySender`로 그룹 동작을 재정의할 수 있습니다.
- 다중 계정 설정에서는 계정별 재정의를 위해 `channels.signal.accounts.<id>.groups`를 사용하세요.
- 런타임 참고: `channels.signal`이 완전히 없으면, 그룹 검사에 대해 런타임은 `groupPolicy="allowlist"`로 폴백합니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

## 작동 방식(동작)

- `signal-cli`는 데몬으로 실행되며 Gateway는 SSE를 통해 이벤트를 읽습니다.
- 수신 메시지는 공유 채널 envelope로 정규화됩니다.
- 응답은 항상 동일한 번호 또는 그룹으로 다시 라우팅됩니다.

## 미디어 + 제한

- 발신 텍스트는 `channels.signal.textChunkLimit`(기본값 4000)에 맞춰 청크로 분할됩니다.
- 선택적 줄바꿈 청크 분할: 길이 기준 분할 전에 빈 줄(문단 경계) 기준으로 나누려면 `channels.signal.chunkMode="newline"`를 설정합니다.
- 첨부 파일 지원(`signal-cli`에서 base64로 가져옴)
- 기본 미디어 상한: `channels.signal.mediaMaxMb` (기본값 8)
- 미디어 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`를 사용합니다.
- 그룹 기록 컨텍스트는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)를 사용하며, 없으면 `messages.groupChat.historyLimit`으로 폴백합니다. 비활성화하려면 `0`으로 설정하세요(기본값 50).

## 입력 중 표시 + 읽음 확인

- **입력 중 표시**: OpenClaw는 `signal-cli sendTyping`을 통해 입력 중 신호를 보내고, 응답이 실행 중인 동안 이를 갱신합니다.
- **읽음 확인**: `channels.signal.sendReadReceipts`가 true이면 OpenClaw는 허용된 DM에 대한 읽음 확인을 전달합니다.
- signal-cli는 그룹의 읽음 확인을 노출하지 않습니다.

## 반응(메시지 도구)

- `channel=signal`과 함께 `message action=react`를 사용합니다.
- 대상: 발신자 E.164 또는 UUID(페어링 출력의 `uuid:<id>` 사용, UUID 단독 사용도 가능)
- `messageId`는 반응하려는 메시지의 Signal 타임스탬프입니다.
- 그룹 반응에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

예시:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

구성:

- `channels.signal.actions.reactions`: 반응 작업 활성화/비활성화(기본값 true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack`는 에이전트 반응을 비활성화합니다(`react` 메시지 도구는 오류 발생).
  - `minimal`/`extensive`는 에이전트 반응을 활성화하고 안내 수준을 설정합니다.
- 계정별 재정의: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## 전달 대상(CLI/Cron)

- DM: `signal:+15551234567` (또는 일반 E.164)
- UUID DM: `uuid:<id>` (또는 UUID 단독)
- 그룹: `signal:group:<groupId>`
- 사용자 이름: `username:<name>` (Signal 계정에서 지원되는 경우)

## 문제 해결

먼저 다음 순서대로 실행하세요:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그런 다음 필요하면 DM 페어링 상태를 확인합니다:

```bash
openclaw pairing list signal
```

일반적인 실패 사례:

- 데몬에는 연결되지만 응답이 없음: 계정/데몬 설정(`httpUrl`, `account`)과 수신 모드를 확인하세요.
- DM이 무시됨: 발신자가 페어링 승인 대기 중입니다.
- 그룹 메시지가 무시됨: 그룹 발신자/멘션 게이팅이 전달을 차단합니다.
- 편집 후 구성 검증 오류: `openclaw doctor --fix`를 실행하세요.
- 진단에 Signal이 표시되지 않음: `channels.signal.enabled: true`를 확인하세요.

추가 점검:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

분류 흐름은 [/channels/troubleshooting](/ko/channels/troubleshooting)을 참조하세요.

## 보안 참고 사항

- `signal-cli`는 계정 키를 로컬에 저장합니다(일반적으로 `~/.local/share/signal-cli/data/`).
- 서버 마이그레이션 또는 재빌드 전에 Signal 계정 상태를 백업하세요.
- 더 넓은 DM 접근을 명시적으로 원하지 않는 한 `channels.signal.dmPolicy: "pairing"`을 유지하세요.
- SMS 인증은 등록 또는 복구 흐름에만 필요하지만, 번호/계정의 제어를 잃으면 재등록이 복잡해질 수 있습니다.

## 구성 참조(Signal)

전체 구성: [구성](/ko/gateway/configuration)

제공자 옵션:

- `channels.signal.enabled`: 채널 시작 활성화/비활성화.
- `channels.signal.account`: 봇 계정의 E.164.
- `channels.signal.cliPath`: `signal-cli` 경로.
- `channels.signal.httpUrl`: 전체 데몬 URL(`host`/`port`보다 우선).
- `channels.signal.httpHost`, `channels.signal.httpPort`: 데몬 바인드(기본값 `127.0.0.1:8080`).
- `channels.signal.autoStart`: 데몬 자동 스폰(`httpUrl`이 설정되지 않은 경우 기본값 true).
- `channels.signal.startupTimeoutMs`: 시작 대기 시간 제한(ms, 최대 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: 첨부 파일 다운로드 건너뛰기.
- `channels.signal.ignoreStories`: 데몬의 스토리 무시.
- `channels.signal.sendReadReceipts`: 읽음 확인 전달.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.signal.allowFrom`: DM 허용 목록(E.164 또는 `uuid:<id>`). `open`에는 `"*"`가 필요합니다. Signal에는 사용자 이름이 없으므로 전화번호/UUID ID를 사용하세요.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist).
- `channels.signal.groupAllowFrom`: 그룹 발신자 허용 목록.
- `channels.signal.groups`: Signal 그룹 ID(또는 `"*"`)를 키로 사용하는 그룹별 재정의. 지원 필드: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: 다중 계정 설정용 `channels.signal.groups`의 계정별 버전.
- `channels.signal.historyLimit`: 컨텍스트에 포함할 최대 그룹 메시지 수(0이면 비활성화).
- `channels.signal.dmHistoryLimit`: 사용자 턴 기준 DM 기록 제한. 사용자별 재정의: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 발신 청크 크기(문자 수).
- `channels.signal.chunkMode`: 길이 기준 청크 분할 전에 빈 줄(문단 경계) 기준으로 나누는 `length`(기본값) 또는 `newline`.
- `channels.signal.mediaMaxMb`: 수신/발신 미디어 상한(MB).

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (Signal은 기본 멘션을 지원하지 않음).
- `messages.groupChat.mentionPatterns` (전역 폴백).
- `messages.responsePrefix`.

## 관련

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
