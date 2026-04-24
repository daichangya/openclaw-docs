---
read_when:
    - Android node를 페어링하거나 다시 연결하는 중입니다.
    - Android gateway 검색 또는 인증을 디버깅하는 중입니다.
    - 클라이언트 간 채팅 기록 일치를 검증하는 중입니다.
summary: 'Android 앱(Node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 표면'
title: Android 앱
x-i18n:
    generated_at: "2026-04-24T06:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **참고:** Android 앱은 아직 공개 배포되지 않았습니다. 소스 코드는 [OpenClaw 리포지토리](https://github.com/openclaw/openclaw)의 `apps/android` 아래에서 확인할 수 있습니다. Java 17과 Android SDK를 사용해 직접 빌드할 수 있습니다(`./gradlew :app:assemblePlayDebug`). 빌드 방법은 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)를 참조하세요.

## 지원 현황 요약

- 역할: 동반 node 앱(Android는 Gateway를 호스팅하지 않음)
- Gateway 필요 여부: 예(macOS, Linux 또는 Windows via WSL2에서 실행)
- 설치: [시작하기](/ko/start/getting-started) + [페어링](/ko/channels/pairing)
- Gateway: [런북](/ko/gateway) + [구성](/ko/gateway/configuration)
  - 프로토콜: [Gateway protocol](/ko/gateway/protocol) (nodes + control plane)

## 시스템 제어

시스템 제어(launchd/systemd)는 Gateway 호스트에 있습니다. [Gateway](/ko/gateway)를 참조하세요.

## 연결 런북

Android node 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하고 장치 페어링(`role: node`)을 사용합니다.

Tailscale 또는 공용 호스트의 경우 Android는 보안 엔드포인트가 필요합니다.

- 권장: Tailscale Serve / Funnel과 `https://<magicdns>` / `wss://<magicdns>`
- 지원: 실제 TLS 엔드포인트가 있는 다른 모든 `wss://` Gateway URL
- 평문 `ws://`는 비공개 LAN 주소 / `.local` 호스트, 그리고 `localhost`, `127.0.0.1`, Android emulator bridge(`10.0.2.2`)에서 계속 지원

### 사전 요구 사항

- “master” 머신에서 Gateway를 실행할 수 있어야 함
- Android 장치/에뮬레이터가 gateway WebSocket에 도달 가능해야 함:
  - mDNS/NSD가 되는 같은 LAN, **또는**
  - Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하는 같은 Tailscale tailnet(아래 참조), **또는**
  - 수동 gateway host/port(대체 경로)
- tailnet/공용 모바일 페어링은 원시 tailnet IP `ws://` 엔드포인트를 사용하지 않습니다. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하세요.
- gateway 머신(또는 SSH를 통해)에서 CLI(`openclaw`)를 실행할 수 있어야 함

### 1) Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에 다음과 같은 메시지가 보여야 합니다.

- `listening on ws://0.0.0.0:18789`

Tailscale을 통한 원격 Android 액세스에는 원시 tailnet bind보다 Serve/Funnel을 권장합니다.

```bash
openclaw gateway --tailscale serve
```

이렇게 하면 Android에 보안 `wss://` / `https://` 엔드포인트가 제공됩니다. 단순한 `gateway.bind: "tailnet"` 설정만으로는 별도로 TLS를 종료하지 않는 한 첫 원격 Android 페어링에 충분하지 않습니다.

### 2) 검색 확인(선택 사항)

gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고: [Bonjour](/ko/gateway/bonjour)

광역 검색 도메인도 구성했다면 다음과 비교하세요.

```bash
openclaw gateway discover --json
```

이 명령은 `local.`과 구성된 광역 도메인을 한 번에 보여 주며, TXT 전용 힌트가 아닌 확인된 서비스 엔드포인트를 사용합니다.

#### Tailnet(비엔나 ⇄ 런던) 검색 via 유니캐스트 DNS-SD

Android NSD/mDNS 검색은 네트워크를 넘지 못합니다. Android node와 gateway가 서로 다른 네트워크에 있지만 Tailscale로 연결되어 있다면 Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하세요.

검색만으로는 tailnet/공용 Android 페어링에 충분하지 않습니다. 검색된 경로도 여전히 보안 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다.

1. gateway 호스트에 DNS-SD 존(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인을 해당 DNS 서버로 가리키도록 Tailscale split DNS를 구성합니다.

자세한 내용과 CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하세요.

### 3) Android에서 연결

Android 앱에서:

- 앱은 **포그라운드 서비스**(지속적인 알림)를 통해 gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- 검색이 막혀 있으면 **Advanced controls**에서 수동 host/port를 사용하세요. 비공개 LAN 호스트에서는 `ws://`가 여전히 동작합니다. Tailscale/공용 호스트에서는 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하세요.

첫 페어링 성공 후 Android는 앱 시작 시 자동 재연결합니다.

- 수동 엔드포인트(활성화된 경우), 아니면
- 마지막으로 검색된 gateway(best-effort)

### 4) 페어링 승인(CLI)

gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

페어링 세부 정보: [페어링](/ko/channels/pairing)

### 5) node 연결 확인

- nodes status를 통해:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 기록

Android Chat 탭은 세션 선택을 지원합니다(기본값 `main`, 그 외 기존 세션 포함).

- History: `chat.history` (표시용으로 정규화됨. 인라인 directive 태그는 표시 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확히 `NO_REPLY` / `no_reply`인 순수 무음 토큰 assistant 행은 생략되고, 너무 큰 행은 플레이스홀더로 대체될 수 있음)
- Send: `chat.send`
- 푸시 업데이트(best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host(웹 콘텐츠에 권장)

에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 node에 표시하고 싶다면 node가 Gateway canvas host를 가리키도록 하세요.

참고: nodes는 Gateway HTTP 서버(gateway.port와 같은 포트, 기본값 `18789`)에서 canvas를 로드합니다.

1. gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 만듭니다.

2. node를 해당 위치로 이동합니다(LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet(선택 사항): 두 장치가 모두 Tailscale에 있다면 `.local` 대신 MagicDNS 이름이나 tailnet IP를 사용하세요. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

이 서버는 HTML에 live-reload 클라이언트를 주입하고 파일 변경 시 다시 로드합니다.
A2UI 호스트는 `http://<gateway-host>:18789/__openclaw__/a2ui/`에 있습니다.

Canvas 명령(포그라운드 전용):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (`{"url":""}` 또는 `{"url":"/"}`를 사용하면 기본 scaffold로 돌아감). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다(기본 `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL`은 레거시 별칭)

Camera 명령(포그라운드 전용, 권한 게이트 적용):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

매개변수 및 CLI 헬퍼는 [Camera node](/ko/nodes/camera)를 참조하세요.

### 8) Voice + 확장된 Android 명령 표면

- Voice: Android는 Voice 탭에서 단일 mic on/off 흐름을 사용하며, 전사 캡처와 `talk.speak` 재생을 지원합니다. `talk.speak`를 사용할 수 없을 때만 로컬 시스템 TTS를 사용합니다. 앱이 포그라운드를 벗어나면 Voice는 중지됩니다.
- Voice wake/talk-mode 토글은 현재 Android UX/런타임에서 제거되었습니다.
- 추가 Android 명령 계열(가용성은 장치 + 권한에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (아래 [알림 전달](#notification-forwarding) 참조)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant 진입점

Android는 시스템 assistant 트리거(Google
Assistant)로 OpenClaw를 시작할 수 있습니다. 구성되면 홈 버튼을 길게 누르거나
"Hey Google, ask OpenClaw..."라고 말했을 때 앱이 열리고 프롬프트가 채팅 입력창으로 전달됩니다.

이 기능은 앱 manifest에 선언된 Android **App Actions** 메타데이터를 사용합니다. gateway 쪽에는 별도 설정이 필요 없습니다. assistant intent는 Android 앱에서만 처리되고 일반 채팅 메시지처럼 전달됩니다.

<Note>
App Actions 가용성은 장치, Google Play Services 버전, 사용자가 OpenClaw를 기본 assistant 앱으로 설정했는지 여부에 따라 달라집니다.
</Note>

## 알림 전달

Android는 장치 알림을 gateway로 이벤트 형태로 전달할 수 있습니다. 여러 제어 항목으로 어떤 알림을 언제 전달할지 범위를 지정할 수 있습니다.

| Key                              | Type           | 설명                                                                                          |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 이 패키지 이름의 알림만 전달합니다. 설정되면 다른 모든 패키지는 무시됩니다.                  |
| `notifications.denyPackages`     | string[]       | 이 패키지 이름의 알림은 절대 전달하지 않습니다. `allowPackages` 이후에 적용됩니다.           |
| `notifications.quietHours.start` | string (HH:mm) | quiet hours 창의 시작(장치 로컬 시간). 이 시간대에는 알림이 억제됩니다.                      |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hours 창의 종료                                                                          |
| `notifications.rateLimit`        | number         | 패키지당 분당 최대 전달 알림 수. 초과 알림은 드롭됩니다.                                      |

알림 선택기도 전달된 알림 이벤트에 대해 더 안전한 동작을 사용하여, 민감한 시스템 알림이 실수로 전달되는 것을 방지합니다.

예시 구성:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
알림 전달에는 Android Notification Listener 권한이 필요합니다. 앱은 설정 중 이 권한을 요청합니다.
</Note>

## 관련 항목

- [iOS 앱](/ko/platforms/ios)
- [Nodes](/ko/nodes)
- [Android node 문제 해결](/ko/nodes/troubleshooting)
