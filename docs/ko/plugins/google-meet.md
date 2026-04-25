---
read_when:
    - OpenClaw 에이전트가 Google Meet 통화에 참여하도록 하려는 경우
    - OpenClaw 에이전트가 새 Google Meet 통화를 생성하도록 하려는 경우
    - Google Meet 전송으로 Chrome, Chrome Node 또는 Twilio를 구성하고 있습니다.
summary: 'Google Meet Plugin: Chrome 또는 Twilio를 통해 명시적 Meet URL에 참여하며 realtime 음성 기본값을 사용합니다'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-25T12:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw용 Google Meet 참가자 지원 — 이 Plugin은 의도적으로 명시적입니다.

- 명시적인 `https://meet.google.com/...` URL에만 참여합니다.
- Google Meet API를 통해 새 Meet 공간을 만든 다음, 반환된 URL에 참여할 수 있습니다.
- 기본 모드는 `realtime` 음성입니다.
- realtime 음성은 더 깊은 추론이나 도구가 필요할 때 전체 OpenClaw 에이전트로 다시 호출할 수 있습니다.
- 에이전트는 `mode`로 참여 동작을 선택합니다. 실시간 듣기/응답에는 `realtime`을, realtime 음성 브리지 없이 브라우저에 참여/제어하려면 `transcribe`를 사용하세요.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome 프로필로 시작합니다.
- 자동 동의 안내는 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬 또는 페어링된 Node 호스트에서 실행할 수 있습니다.
- Twilio는 전화 접속 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 에이전트 원격 회의 워크플로를 위해 예약되어 있습니다.

## 빠른 시작

로컬 오디오 종속성을 설치하고 백엔드 realtime 음성 provider를 구성하세요. 기본값은 OpenAI이며, Google Gemini Live도 `realtime.provider: "google"`로 동작합니다.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew 설치 프로그램은 macOS가 해당 장치를 노출하기 전에 재부팅을 요구합니다.

```bash
sudo reboot
```

재부팅 후 두 항목을 모두 확인하세요.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Plugin을 활성화하세요.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

설정을 확인하세요.

```bash
openclaw googlemeet setup
```

설정 출력은 에이전트가 읽을 수 있도록 설계되었습니다. Chrome 프로필, 오디오 브리지, Node 고정, 지연된 realtime 소개, 그리고 Twilio 위임이 구성된 경우 `voice-call` Plugin 및 Twilio 자격 증명이 준비되었는지를 보고합니다. `ok: false`인 검사는 에이전트에게 참여를 요청하기 전에 차단 요인으로 간주하세요.
스크립트나 기계 판독 가능한 출력에는 `openclaw googlemeet setup --json`을 사용하세요.

회의에 참여하기:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트가 `google_meet` 도구를 통해 참여하도록 합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

새 회의를 만들고 참여하기:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

참여하지 않고 URL만 만들기:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`에는 두 경로가 있습니다.

- API 생성: Google Meet OAuth 자격 증명이 구성된 경우 사용됩니다. 가장 결정적인 경로이며 브라우저 UI 상태에 의존하지 않습니다.
- 브라우저 대체 경로: OAuth 자격 증명이 없을 때 사용됩니다. OpenClaw는 고정된 Chrome Node를 사용하여 `https://meet.google.com/new`를 열고, Google이 실제 회의 코드 URL로 리디렉션할 때까지 기다린 뒤, 그 URL을 반환합니다. 이 경로를 사용하려면 Node의 OpenClaw Chrome 프로필이 이미 Google에 로그인되어 있어야 합니다.
  브라우저 자동화는 Meet 자체의 첫 실행 마이크 프롬프트를 처리하며, 이 프롬프트는 Google 로그인 실패로 취급되지 않습니다.
  참여 및 생성 흐름은 새 탭을 열기 전에 기존 Meet 탭을 재사용하려고도 시도합니다. 일치는 `authuser` 같은 무해한 URL 쿼리 문자열을 무시하므로, 에이전트 재시도는 두 번째 Chrome 탭을 만드는 대신 이미 열린 회의에 포커스를 맞춰야 합니다.

명령/도구 출력에는 사용된 경로를 에이전트가 설명할 수 있도록 `source` 필드(`api` 또는 `browser`)가 포함됩니다. `create`는 기본적으로 새 회의에 참여하며 `joined: true`와 참여 세션을 반환합니다. URL만 만들려면 CLI에서는 `create --no-join`을 사용하거나 도구에 `"join": false`를 전달하세요.

또는 에이전트에게 이렇게 지시하세요. "Google Meet를 생성하고, realtime 음성으로 참여한 뒤, 링크를 나에게 보내줘." 에이전트는 `action: "create"`로 `google_meet`를 호출한 뒤 반환된 `meetingUri`를 공유해야 합니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

관찰 전용/브라우저 제어 참여를 원하면 `"mode": "transcribe"`를 설정하세요. 이 경우 양방향 realtime 모델 브리지를 시작하지 않으므로 회의에 다시 말하지 않습니다.

realtime 세션 중 `google_meet` 상태에는 `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력 타임스탬프, 바이트 카운터, 브리지 종료 상태 같은 브라우저 및 오디오 브리지 상태 정보가 포함됩니다. 안전한 Meet 페이지 프롬프트가 나타나면 브라우저 자동화가 가능한 경우 이를 처리합니다. 로그인, 호스트 승인, 브라우저/OS 권한 프롬프트는 에이전트가 전달할 수 있도록 이유와 메시지를 포함한 수동 작업으로 보고됩니다.

Chrome은 로그인된 Chrome 프로필로 참여합니다. Meet에서는 OpenClaw가 사용하는 마이크/스피커 경로로 `BlackHole 2ch`를 선택하세요. 깨끗한 양방향 오디오를 위해서는 별도의 가상 장치 또는 Loopback 스타일 그래프를 사용하세요. 단일 BlackHole 장치만으로도 첫 스모크 테스트에는 충분하지만 에코가 생길 수 있습니다.

### 로컬 Gateway + Parallels Chrome

VM이 Chrome을 소유하도록 하기 위해 macOS VM 내부에 전체 OpenClaw Gateway 또는 모델 API 키가 필요한 것은 **아닙니다**. Gateway와 에이전트는 로컬에서 실행하고, VM에서는 Node 호스트만 실행하세요. VM에서 번들 Plugin을 한 번 활성화하면 Node가 Chrome 명령을 광고합니다.

실행 위치:

- Gateway 호스트: OpenClaw Gateway, 에이전트 워크스페이스, 모델/API 키, realtime provider, Google Meet Plugin config
- Parallels macOS VM: OpenClaw CLI/Node 호스트, Google Chrome, SoX, BlackHole 2ch, Google에 로그인된 Chrome 프로필
- VM에서 필요 없는 것: Gateway 서비스, 에이전트 config, OpenAI/GPT 키, 모델 provider 설정

VM 종속성 설치:

```bash
brew install blackhole-2ch sox
```

macOS가 `BlackHole 2ch`를 노출하도록 BlackHole 설치 후 VM을 재부팅하세요.

```bash
sudo reboot
```

재부팅 후 VM이 오디오 장치와 SoX 명령을 볼 수 있는지 확인하세요.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM에 OpenClaw를 설치하거나 업데이트한 다음, সেখানে 번들 Plugin을 활성화하세요.

```bash
openclaw plugins enable google-meet
```

VM에서 Node 호스트를 시작하세요.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는다면, 신뢰된 사설 네트워크에 대한 옵트인을 하지 않는 한 Node는 평문 WebSocket을 거부합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node를 LaunchAgent로 설치할 때도 같은 환경 변수를 사용하세요.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은 `openclaw.json` 설정이 아니라 프로세스 환경입니다. `openclaw node install`은 설치 명령에 이 변수가 있으면 이를 LaunchAgent 환경에 저장합니다.

Gateway 호스트에서 Node를 승인하세요.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 Node를 보고 있고 `googlemeet.chrome`와 브라우저 기능/`browser.proxy`를 모두 광고하는지 확인하세요.

```bash
openclaw nodes status
```

Gateway 호스트에서 해당 Node를 통해 Meet를 라우팅하세요.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

이제 Gateway 호스트에서 일반적으로 참여할 수 있습니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `transport: "chrome-node"`로 `google_meet` 도구를 사용하라고 지시하세요.

세션을 만들거나 재사용하고, 알려진 문구를 말하고, 세션 상태를 출력하는 원클릭 스모크 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

참여 중에 OpenClaw 브라우저 자동화는 게스트 이름을 입력하고, Join/Ask to join을 클릭하며, 해당 프롬프트가 나타나면 Meet의 첫 실행 "Use microphone" 선택도 수락합니다. 브라우저 전용 회의 생성 중에도 Meet가 마이크 사용 버튼을 제공하지 않으면 마이크 없이 같은 프롬프트를 계속 진행할 수 있습니다.
브라우저 프로필이 로그인되지 않았거나, Meet가 호스트 승인을 기다리고 있거나, Chrome에 마이크/카메라 권한이 필요하거나, Meet가 자동화로 해결할 수 없는 프롬프트에서 멈춰 있으면 참여/`test-speech` 결과는 `manualActionRequired: true`와 함께 `manualActionReason`, `manualActionMessage`를 보고합니다. 에이전트는 참여 재시도를 중단하고, 정확히 그 메시지와 현재 `browserUrl`/`browserTitle`을 보고한 뒤, 수동 브라우저 작업이 완료된 후에만 다시 시도해야 합니다.

`chromeNode.node`가 생략되면, 정확히 하나의 연결된 Node만 `googlemeet.chrome`와 브라우저 제어를 모두 광고할 때에만 OpenClaw가 자동 선택합니다. 가능한 Node가 여러 개 연결되어 있다면 `chromeNode.node`를 Node id, 표시 이름 또는 원격 IP로 설정하세요.

일반적인 실패 확인 사항:

- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을 시작하고, 페어링을 승인했는지, VM에서 `openclaw plugins enable google-meet`와 `openclaw plugins enable browser`를 실행했는지 확인하세요. 또한 Gateway 호스트가 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`로 두 Node 명령을 모두 허용하는지도 확인하세요.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를 설치하고 VM을 재부팅하세요.
- Chrome은 열리지만 참여할 수 없음: VM 내부 브라우저 프로필에 로그인하거나 게스트 참여를 위해 `chrome.guestName`을 설정해 두세요. 게스트 자동 참여는 Node 브라우저 프록시를 통한 OpenClaw 브라우저 자동화를 사용하므로, Node 브라우저 config가 원하는 프로필을 가리키는지 확인하세요. 예: `browser.defaultProfile: "user"` 또는 이름이 있는 existing-session 프로필.
- 중복 Meet 탭: `chrome.reuseExistingTab: true`를 켜 둔 상태로 유지하세요. OpenClaw는 새 탭을 열기 전에 같은 Meet URL의 기존 탭을 활성화하고, 브라우저 회의 생성도 다른 탭을 열기 전에 진행 중인 `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다.
- 오디오가 없음: Meet에서 마이크/스피커를 OpenClaw가 사용하는 가상 오디오 장치 경로로 라우팅하세요. 깨끗한 양방향 오디오를 위해 별도의 가상 장치나 Loopback 스타일 라우팅을 사용하세요.

## 설치 참고

Chrome realtime 기본값은 두 개의 외부 도구를 사용합니다.

- `sox`: 명령줄 오디오 유틸리티입니다. Plugin은 기본 8kHz G.711 mu-law 오디오 브리지에 `rec`와 `play` 명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버입니다. Chrome/Meet가 통과할 수 있는 `BlackHole 2ch` 오디오 장치를 생성합니다.

OpenClaw는 어느 패키지도 번들하거나 재배포하지 않습니다. 문서는 사용자가 Homebrew를 통해 이를 호스트 종속성으로 설치하도록 안내합니다. SoX의 라이선스는 `LGPL-2.0-only AND GPL-2.0-only`이며, BlackHole은 GPL-3.0입니다. OpenClaw와 함께 BlackHole을 번들하는 설치 프로그램이나 어플라이언스를 빌드하는 경우, BlackHole 업스트림 라이선스 조건을 검토하거나 Existential Audio에서 별도 라이선스를 받으세요.

## 전송

### Chrome

Chrome 전송은 Google Chrome에서 Meet URL을 열고 로그인된 Chrome 프로필로 참여합니다. macOS에서는 Plugin이 실행 전에 `BlackHole 2ch`를 확인합니다. 구성된 경우 Chrome을 열기 전에 오디오 브리지 상태 명령과 시작 명령도 실행합니다. Chrome/오디오가 Gateway 호스트에 있으면 `chrome`을 사용하고, Parallels macOS VM 같은 페어링된 Node에 있으면 `chrome-node`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크와 스피커 오디오를 로컬 OpenClaw 오디오 브리지를 통해 라우팅합니다. `BlackHole 2ch`가 설치되어 있지 않으면, 오디오 경로 없이 조용히 참여하는 대신 설정 오류와 함께 참여가 실패합니다.

### Twilio

Twilio 전송은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다. Meet 페이지에서 전화번호를 파싱하지 않습니다.

Chrome 참여를 사용할 수 없거나 전화 접속 대체 경로를 원할 때 사용하세요. Google Meet는 해당 회의에 대한 전화 접속 번호와 PIN을 노출해야 합니다. OpenClaw는 Meet 페이지에서 이를 찾아내지 않습니다.

Voice Call Plugin은 Chrome Node가 아니라 Gateway 호스트에서 활성화하세요.

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 또는 Twilio를 기본값으로 하려면 "twilio"로 설정
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio 자격 증명은 환경 변수 또는 config를 통해 제공하세요. 환경 변수를 사용하면 비밀 정보를 `openclaw.json` 밖에 둘 수 있습니다.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`을 활성화한 후 Gateway를 재시작하거나 다시 로드하세요. Plugin config 변경 사항은 이미 실행 중인 Gateway 프로세스에는 다시 로드되기 전까지 반영되지 않습니다.

그다음 확인하세요.

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 연결되어 있으면 `googlemeet setup`에는 성공적인 `twilio-voice-call-plugin` 및 `twilio-voice-call-credentials` 검사가 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

회의에 사용자 정의 시퀀스가 필요하면 `--dtmf-sequence`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 사전 점검

OAuth는 `googlemeet create`가 브라우저 자동화로 대체될 수 있기 때문에 Meet 링크를 만드는 데 필수는 아닙니다. 공식 API 생성, 공간 확인 또는 Meet Media API 사전 점검이 필요할 때 OAuth를 구성하세요.

Google Meet API 액세스는 사용자 OAuth를 사용합니다. Google Cloud OAuth 클라이언트를 만들고, 필요한 범위를 요청하고, Google 계정을 인증한 다음, 결과 refresh token을 Google Meet Plugin config에 저장하거나 `OPENCLAW_GOOGLE_MEET_*` 환경 변수를 제공하세요.

OAuth는 Chrome 참여 경로를 대체하지 않습니다. 브라우저 참여를 사용할 때 Chrome 및 Chrome-node 전송은 여전히 로그인된 Chrome 프로필, BlackHole/SoX 및 연결된 Node를 통해 참여합니다. OAuth는 공식 Google Meet API 경로에만 사용됩니다. 즉, 회의 공간 생성, 공간 확인, Meet Media API 사전 점검 실행입니다.

### Google 자격 증명 만들기

Google Cloud Console에서:

1. Google Cloud 프로젝트를 만들거나 선택합니다.
2. 해당 프로젝트에 대해 **Google Meet REST API**를 활성화합니다.
3. OAuth 동의 화면을 구성합니다.
   - Google Workspace 조직에서는 **Internal**이 가장 간단합니다.
   - **External**은 개인/테스트 설정에서 동작합니다. 앱이 Testing 상태인 동안에는 앱을 인증할 각 Google 계정을 테스트 사용자로 추가하세요.
4. OpenClaw가 요청하는 범위를 추가합니다.
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth 클라이언트 ID를 만듭니다.
   - 애플리케이션 유형: **Web application**
   - 승인된 리디렉션 URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 클라이언트 ID와 클라이언트 비밀을 복사합니다.

`meetings.space.created`는 Google Meet `spaces.create`에 필요합니다.
`meetings.space.readonly`는 OpenClaw가 Meet URL/코드를 공간으로 확인할 수 있게 합니다.
`meetings.conference.media.readonly`는 Meet Media API 사전 점검 및 미디어 작업용입니다. 실제 Media API 사용에는 Google이 Developer Preview 등록을 요구할 수 있습니다.
브라우저 기반 Chrome 참여만 필요하다면 OAuth는 완전히 건너뛰세요.

### refresh token 발급

`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성하거나 환경 변수로 전달한 다음 실행하세요.

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` config 블록을 출력합니다. PKCE, `http://localhost:8085/oauth2callback`의 localhost callback, 그리고 `--manual`을 사용하는 수동 복사/붙여넣기 흐름을 사용합니다.

예시:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

브라우저가 로컬 callback에 도달할 수 없을 때는 수동 모드를 사용하세요.

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 출력에는 다음이 포함됩니다.

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` 객체를 Google Meet Plugin config 아래에 저장하세요.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

config에 refresh token을 두고 싶지 않다면 환경 변수를 우선 사용하세요.
config 값과 환경 변수 값이 모두 있으면 Plugin은 먼저 config를 해석하고, 그다음 환경 변수로 대체합니다.

OAuth 동의에는 Meet 공간 생성, Meet 공간 읽기 접근 및 Meet 회의 미디어 읽기 접근이 포함됩니다. 회의 생성 지원이 생기기 전에 이미 인증했다면 `openclaw googlemeet auth login --json`을 다시 실행하여 refresh token에 `meetings.space.created` 범위가 포함되도록 하세요.

### doctor로 OAuth 확인

빠르고 비밀 정보가 없는 상태 점검이 필요하다면 OAuth doctor를 실행하세요.

```bash
openclaw googlemeet doctor --oauth --json
```

이 명령은 Chrome 런타임을 로드하지 않으며 연결된 Chrome Node도 필요하지 않습니다. OAuth config가 존재하는지와 refresh token이 access token을 발급할 수 있는지를 확인합니다. JSON 보고서에는 `ok`, `configured`, `tokenSource`, `expiresAt`, 검사 메시지 같은 상태 필드만 포함되며 access token, refresh token 또는 client secret은 출력하지 않습니다.

일반적인 결과:

| Check                | Meaning                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId`와 `oauth.refreshToken`, 또는 캐시된 access token이 존재함.             |
| `oauth-token`        | 캐시된 access token이 여전히 유효하거나 refresh token이 새 access token을 발급함.       |
| `meet-spaces-get`    | 선택적 `--meeting` 검사가 기존 Meet 공간을 확인함.                                      |
| `meet-spaces-create` | 선택적 `--create-space` 검사가 새 Meet 공간을 생성함.                                   |

Google Meet API 활성화 및 `spaces.create` 범위도 증명하려면, 부작용이 있는 create 검사를 실행하세요.

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`는 임시 Meet URL을 생성합니다. Google Cloud 프로젝트에서 Meet API가 활성화되어 있고 승인된 계정에 `meetings.space.created` 범위가 있는지 확인해야 할 때 사용하세요.

기존 회의 공간에 대한 읽기 접근을 증명하려면:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 및 `resolve-space`는 승인된 Google 계정이 접근할 수 있는 기존 공간에 대한 읽기 접근을 증명합니다. 이러한 검사에서 `403`이 나오면 대개 Google Meet REST API가 비활성화되어 있거나, 동의된 refresh token에 필요한 범위가 없거나, Google 계정이 해당 Meet 공간에 접근할 수 없다는 뜻입니다. refresh-token 오류가 나오면 `openclaw googlemeet auth login --json`을 다시 실행하고 새 `oauth` 블록을 저장하세요.

브라우저 대체 경로에는 OAuth 자격 증명이 필요하지 않습니다. 이 모드에서 Google 인증은 OpenClaw config가 아니라 선택된 Node의 로그인된 Chrome 프로필에서 가져옵니다.

다음 환경 변수를 대체 경로로 사용할 수 있습니다.

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

`spaces.get`을 통해 Meet URL, 코드 또는 `spaces/{id}`를 확인합니다.

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전에 사전 점검을 실행합니다.

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet가 회의 레코드를 생성한 뒤 회의 아티팩트와 참석 정보를 나열합니다.

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`을 사용하면 `artifacts`와 `attendance`는 기본적으로 가장 최신 회의 레코드를 사용합니다. 해당 회의에 대해 유지된 모든 레코드를 원하면 `--all-conference-records`를 전달하세요.

Calendar 조회는 Meet 아티팩트를 읽기 전에 Google Calendar에서 회의 URL을 확인할 수 있습니다.

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`는 오늘의 `primary` calendar에서 Google Meet 링크가 있는 Calendar 이벤트를 검색합니다. 일치하는 이벤트 텍스트를 검색하려면 `--event <query>`를, 기본이 아닌 calendar에는 `--calendar <id>`를 사용하세요. Calendar 조회에는 Calendar events readonly 범위를 포함한 새 OAuth 로그인이 필요합니다.
`calendar-events`는 일치하는 Meet 이벤트를 미리 보여주고 `latest`, `artifacts`, `attendance`, `export`가 선택할 이벤트를 표시합니다.

이미 회의 레코드 id를 알고 있다면 직접 지정하세요.

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

읽기 쉬운 보고서를 작성합니다.

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts`는 Google이 해당 회의에 대해 노출하는 경우 회의 레코드 메타데이터와 참가자, 녹화, 전사문, 구조화된 전사 항목, smart-note 리소스 메타데이터를 반환합니다. 큰 회의에서 항목 조회를 건너뛰려면 `--no-transcript-entries`를 사용하세요. `attendance`는 참가자를 첫/마지막 확인 시간, 총 세션 지속 시간, 지각/조기 퇴장 플래그, 로그인한 사용자 또는 표시 이름 기준으로 병합된 중복 참가자 리소스를 포함한 participant-session 행으로 확장합니다. 원시 참가자 리소스를 분리된 상태로 유지하려면 `--no-merge-duplicates`를, 지각 감지를 조정하려면 `--late-after-minutes`를, 조기 퇴장 감지를 조정하려면 `--early-before-minutes`를 전달하세요.

`export`는 `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, `manifest.json`을 포함하는 폴더를 작성합니다.
`manifest.json`은 선택된 입력, 내보내기 옵션, 회의 레코드,
출력 파일, 개수, 토큰 소스, 사용된 경우 Calendar 이벤트, 부분 검색 경고를 기록합니다. 폴더 옆에 이동 가능한 아카이브도 작성하려면 `--zip`을 전달하세요. 연결된 전사문 및 smart-note Google Docs 텍스트를 Google Drive `files.export`를 통해 내보내려면 `--include-doc-bodies`를 전달하세요. 이 작업에는 Drive Meet readonly 범위를 포함한 새 OAuth 로그인이 필요합니다. `--include-doc-bodies` 없이 내보내면 Meet 메타데이터와 구조화된 전사 항목만 포함됩니다. Google이 smart-note 목록, transcript-entry 또는 Drive 문서 본문 오류처럼 부분 아티팩트 실패를 반환하면, 요약과 manifest는 전체 내보내기를 실패시키는 대신 경고를 유지합니다.
같은 artifact/attendance 데이터를 가져오고 폴더나 ZIP을 만들지 않은 채 manifest JSON만 출력하려면 `--dry-run`을 사용하세요. 이는 대규모 내보내기 전에, 또는 에이전트가 개수, 선택된 레코드, 경고만 필요할 때 유용합니다.

에이전트는 `google_meet` 도구를 통해 동일한 번들을 만들 수도 있습니다.

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

내보내기 manifest만 반환하고 파일 쓰기를 건너뛰려면 `"dryRun": true`를 설정하세요.

실제로 보존된 회의를 대상으로 보호된 라이브 스모크를 실행합니다.

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

라이브 스모크 환경:

- `OPENCLAW_LIVE_TEST=1`은 보호된 라이브 테스트를 활성화합니다.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`은 보존된 Meet URL, 코드 또는 `spaces/{id}`를 가리킵니다.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`는 OAuth client id를 제공합니다.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`은 refresh token을 제공합니다.
- 선택 사항: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`는 `OPENCLAW_` 접두사 없는 동일한 대체 이름도 사용합니다.

기본 artifact/attendance 라이브 스모크에는
`https://www.googleapis.com/auth/meetings.space.readonly`와
`https://www.googleapis.com/auth/meetings.conference.media.readonly`가 필요합니다. Calendar
조회에는 `https://www.googleapis.com/auth/calendar.events.readonly`가 필요합니다. Drive
문서 본문 내보내기에는
`https://www.googleapis.com/auth/drive.meet.readonly`가 필요합니다.

새 Meet 공간 만들기:

```bash
openclaw googlemeet create
```

이 명령은 새 `meeting uri`, source, 참여 세션을 출력합니다. OAuth 자격 증명이 있으면 공식 Google Meet API를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome Node의 로그인된 브라우저 프로필을 대체 경로로 사용합니다. 에이전트는 `action: "create"`로 `google_meet` 도구를 사용해 한 단계로 생성 및 참여를 수행할 수 있습니다. URL만 만들려면 `"join": false`를 전달하세요.

브라우저 대체 경로의 예시 JSON 출력:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

브라우저 대체 경로가 URL을 만들기 전에 Google 로그인 또는 Meet 권한 차단에 걸리면,
Gateway 메서드는 실패 응답을 반환하고 `google_meet` 도구는 일반 문자열 대신 구조화된 세부 정보를 반환합니다.

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw 브라우저 프로필에서 Google에 로그인한 뒤 회의 생성을 다시 시도하세요.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw 브라우저 프로필에서 Google에 로그인한 뒤 회의 생성을 다시 시도하세요.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "로그인 - Google 계정"
  }
}
```

에이전트가 `manualActionRequired: true`를 보면 `manualActionMessage`와 브라우저 Node/탭 컨텍스트를 보고하고, 운영자가 브라우저 단계를 완료할 때까지 새 Meet 탭을 열지 않아야 합니다.

API 생성의 예시 JSON 출력:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Meet 생성은 기본적으로 참여까지 수행합니다. Chrome 또는 Chrome-node 전송은 브라우저를 통해 참여하려면 여전히 로그인된 Google Chrome 프로필이 필요합니다. 프로필이 로그아웃 상태이면 OpenClaw는 `manualActionRequired: true` 또는 브라우저 대체 경로 오류를 보고하고, 재시도 전에 운영자에게 Google 로그인을 완료하라고 요청합니다.

Cloud 프로젝트, OAuth principal, 회의 참가자가 Meet media API용 Google Workspace Developer Preview Program에 등록되었음을 확인한 후에만 `preview.enrollmentAcknowledged: true`를 설정하세요.

## config

일반적인 Chrome realtime 경로에는 Plugin 활성화, BlackHole, SoX,
그리고 백엔드 realtime 음성 provider 키만 있으면 됩니다. 기본값은 OpenAI이며, Google Gemini Live를 사용하려면
`realtime.provider: "google"`을 설정하세요.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

Plugin config는 `plugins.entries.google-meet.config` 아래에 설정하세요.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

기본값:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node`용 선택적 Node id/이름/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: 로그아웃된 Meet 게스트 화면에서 사용하는 이름
- `chrome.autoJoin: true`: `chrome-node`에서 OpenClaw 브라우저 자동화를 통한 최선의 노력 게스트 이름 입력 및 Join Now 클릭
- `chrome.reuseExistingTab: true`: 중복 탭을 여는 대신 기존 Meet 탭 활성화
- `chrome.waitForInCallMs: 20000`: realtime 소개가 트리거되기 전에 Meet 탭이 통화 중 상태를 보고할 때까지 대기
- `chrome.audioInputCommand`: stdout에 8kHz G.711 mu-law 오디오를 쓰는 SoX `rec` 명령
- `chrome.audioOutputCommand`: stdin에서 8kHz G.711 mu-law 오디오를 읽는 SoX `play` 명령
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변을 위해 `openclaw_agent_consult`를 사용하는 짧은 음성 응답
- `realtime.introMessage`: realtime 브리지가 연결될 때의 짧은 음성 준비 확인 메시지. 조용히 참여하려면 `""`로 설정하세요

선택적 override:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "정확히 이렇게 말하세요: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Twilio 전용 config:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled`의 기본값은 `true`입니다. Twilio 전송에서는 실제 PSTN 통화와 DTMF를 Voice Call Plugin에 위임합니다. `voice-call`이 활성화되지 않은 경우에도 Google Meet는 다이얼 플랜을 검증하고 기록할 수는 있지만, Twilio 통화를 걸 수는 없습니다.

## 도구

에이전트는 `google_meet` 도구를 사용할 수 있습니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome이 Gateway 호스트에서 실행 중이면 `transport: "chrome"`을 사용하세요. Chrome이 Parallels VM 같은 페어링된 Node에서 실행 중이면
`transport: "chrome-node"`를 사용하세요. 두 경우 모두 realtime 모델과 `openclaw_agent_consult`는 Gateway 호스트에서 실행되므로 모델 자격 증명은 այնտեղ에 유지됩니다.

활성 세션을 나열하거나 세션 ID를 확인하려면 `action: "status"`를 사용하세요. `sessionId`와 `message`와 함께 `action: "speak"`를 사용하면 realtime 에이전트가 즉시 말합니다. `action: "test_speech"`를 사용하면 세션을 만들거나 재사용하고, 알려진 문구를 트리거하고, Chrome 호스트가 보고할 수 있을 경우 `inCall` 상태를 반환합니다. `action: "leave"`를 사용하면 세션 종료로 표시합니다.

`status`에는 가능한 경우 Chrome 상태가 포함됩니다.

- `inCall`: Chrome이 Meet 통화 안에 있는 것으로 보임
- `micMuted`: 최선의 노력으로 파악한 Meet 마이크 상태
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 음성이 동작하려면 브라우저 프로필에 수동 로그인, Meet 호스트 승인, 권한 부여 또는 브라우저 제어 복구가 필요함
- `providerConnected` / `realtimeReady`: realtime 음성 브리지 상태
- `lastInputAt` / `lastOutputAt`: 브리지에서 마지막으로 받은/보낸 오디오 시각

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "정확히 이렇게 말하세요: I'm here and listening."
}
```

## Realtime 에이전트 consult

Chrome realtime 모드는 라이브 음성 루프에 최적화되어 있습니다. realtime 음성 provider는 회의 오디오를 듣고 구성된 오디오 브리지를 통해 말합니다. realtime 모델이 더 깊은 추론, 현재 정보 또는 일반 OpenClaw 도구가 필요할 때 `openclaw_agent_consult`를 호출할 수 있습니다.

consult 도구는 최근 회의 전사문 컨텍스트를 바탕으로 백그라운드에서 일반 OpenClaw 에이전트를 실행하고, realtime 음성 세션에 간결한 음성 답변을 반환합니다. 그러면 음성 모델이 그 답변을 회의에 다시 말할 수 있습니다.
이 기능은 Voice Call과 동일한 공유 realtime consult 도구를 사용합니다.

`realtime.toolPolicy`는 consult 실행을 제어합니다.

- `safe-read-only`: consult 도구를 노출하고 일반 에이전트를
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`,
  `memory_get`으로 제한합니다.
- `owner`: consult 도구를 노출하고 일반 에이전트가 정상 에이전트 도구 정책을 사용하도록 허용합니다.
- `none`: consult 도구를 realtime 음성 모델에 노출하지 않습니다.

consult 세션 키는 Meet 세션별로 범위가 지정되므로, 같은 회의 중 후속 consult 호출이 이전 consult 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참여한 뒤 강제로 음성 준비 확인을 하려면:

```bash
openclaw googlemeet speak meet_... "정확히 이렇게 말하세요: I'm here and listening."
```

전체 참여 및 발화 스모크 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말하세요: I'm here and listening."
```

## 라이브 테스트 체크리스트

무인 에이전트에게 회의를 맡기기 전에 이 순서를 사용하세요.

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말하세요: Google Meet speech test complete."
```

예상되는 Chrome-node 상태:

- `googlemeet setup`이 모두 녹색입니다.
- `chrome-node`가 기본 전송이거나 Node가 고정되어 있으면 `googlemeet setup`에 `chrome-node-connected`가 포함됩니다.
- `nodes status`에 선택된 Node가 연결된 것으로 표시됩니다.
- 선택된 Node가 `googlemeet.chrome`와 `browser.proxy`를 모두 광고합니다.
- Meet 탭이 통화에 참여하고 `test-speech`가 `inCall: true`인 Chrome 상태를 반환합니다.

Parallels macOS VM 같은 원격 Chrome 호스트의 경우, Gateway 또는 VM을 업데이트한 뒤 가장 짧고 안전한 확인 절차는 다음과 같습니다.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이 절차는 Gateway Plugin이 로드되었고, VM Node가 현재 토큰으로 연결되었으며, 에이전트가 실제 회의 탭을 열기 전에 Meet 오디오 브리지를 사용할 수 있음을 증명합니다.

Twilio 스모크 테스트의 경우, 전화 접속 정보가 노출되는 회의를 사용하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상되는 Twilio 상태:

- `googlemeet setup`에 녹색 `twilio-voice-call-plugin` 및
  `twilio-voice-call-credentials` 검사가 포함됩니다.
- Gateway를 다시 로드한 뒤 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에는 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `googlemeet leave <sessionId>`는 위임된 음성 통화를 종료합니다.

## 문제 해결

### 에이전트가 Google Meet 도구를 볼 수 없음

Gateway config에서 Plugin이 활성화되어 있는지 확인하고 Gateway를 다시 로드하세요.

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet`를 방금 수정했다면 Gateway를 재시작하거나 다시 로드하세요.
실행 중인 에이전트는 현재 Gateway 프로세스가 등록한 Plugin 도구만 볼 수 있습니다.

### 연결된 Google Meet 지원 Node가 없음

Node 호스트에서 다음을 실행하세요.

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 Node를 승인하고 명령을 확인하세요.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node는 연결되어 있어야 하며 `googlemeet.chrome`와 `browser.proxy`를 나열해야 합니다.
Gateway config는 해당 Node 명령을 허용해야 합니다.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`에서 `chrome-node-connected`가 실패하거나 Gateway 로그에
`gateway token mismatch`가 보고되면, 현재 Gateway 토큰으로 Node를 다시 설치하거나 재시작하세요. LAN Gateway의 경우 보통 다음을 의미합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그다음 Node 서비스를 다시 로드하고 다음을 다시 실행하세요.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저는 열리지만 에이전트가 참여하지 못함

`googlemeet test-speech`를 실행하고 반환된 Chrome 상태를 확인하세요. `manualActionRequired: true`가 보고되면 `manualActionMessage`를 운영자에게 보여주고 브라우저 작업이 완료될 때까지 재시도를 중단하세요.

일반적인 수동 작업:

- Chrome 프로필에 로그인
- Meet 호스트 계정에서 게스트 승인
- Chrome의 기본 권한 프롬프트가 나타날 때 마이크/카메라 권한 허용
- 멈춰 있는 Meet 권한 대화상자 닫기 또는 복구

Meet가 "Do you want people to hear you in the meeting?"을 표시한다고 해서 "로그인되지 않음"으로 보고하지 마세요. 이는 Meet의 오디오 선택 중간 화면입니다. OpenClaw는 가능할 때 브라우저 자동화를 통해 **Use microphone**을 클릭하고 실제 회의 상태를 계속 기다립니다. 생성 전용 브라우저 대체 경로에서는 URL 생성에 realtime 오디오 경로가 필요하지 않으므로 OpenClaw가 **Continue without microphone**을 클릭할 수 있습니다.

### 회의 생성 실패

`googlemeet create`는 OAuth 자격 증명이 구성되어 있으면 먼저 Google Meet API
`spaces.create` 엔드포인트를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome Node 브라우저로 대체됩니다. 다음을 확인하세요.

- API 생성의 경우: `oauth.clientId`와 `oauth.refreshToken`이 구성되어 있거나, 대응하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 존재해야 합니다.
- API 생성의 경우: refresh token은 생성 지원이 추가된 후 발급된 것이어야 합니다. 오래된 토큰에는 `meetings.space.created` 범위가 없을 수 있으므로 `openclaw googlemeet auth login --json`을 다시 실행하고 Plugin config를 업데이트하세요.
- 브라우저 대체 경로의 경우: `defaultTransport: "chrome-node"`와
  `chromeNode.node`가 `browser.proxy`와 `googlemeet.chrome`가 있는 연결된 Node를 가리켜야 합니다.
- 브라우저 대체 경로의 경우: 해당 Node의 OpenClaw Chrome 프로필이 Google에 로그인되어 있고 `https://meet.google.com/new`를 열 수 있어야 합니다.
- 브라우저 대체 경로의 경우: 재시도는 새 탭을 열기 전에 기존 `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다. 에이전트가 시간 초과되면 다른 Meet 탭을 수동으로 열지 말고 도구 호출을 다시 시도하세요.
- 브라우저 대체 경로의 경우: 도구가 `manualActionRequired: true`를 반환하면 반환된 `browser.nodeId`, `browser.targetId`, `browserUrl`,
  `manualActionMessage`를 사용해 운영자를 안내하세요. 해당 작업이 완료될 때까지 루프 재시도를 하지 마세요.
- 브라우저 대체 경로의 경우: Meet가 "Do you want people to hear you in the
  meeting?"을 표시하면 탭을 열어 둔 상태로 두세요. OpenClaw는 브라우저 자동화를 통해 **Use microphone** 또는 생성 전용 대체 경로의 경우 **Continue without microphone**을 클릭하고 생성된 Meet URL을 계속 기다려야 합니다. 이를 할 수 없으면 오류는 `google-login-required`가 아니라 `meet-audio-choice-required`를 언급해야 합니다.

### 에이전트는 참여했지만 말하지 않음

realtime 경로를 확인하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

듣기/응답에는 `mode: "realtime"`을 사용하세요. `mode: "transcribe"`는 의도적으로 양방향 realtime 음성 브리지를 시작하지 않습니다.

다음도 확인하세요.

- Gateway 호스트에 `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 같은 realtime provider 키가 있어야 합니다.
- Chrome 호스트에서 `BlackHole 2ch`가 보여야 합니다.
- Chrome 호스트에 `rec`와 `play`가 존재해야 합니다.
- Meet 마이크와 스피커가 OpenClaw가 사용하는 가상 오디오 경로를 통해 라우팅되어야 합니다.

`googlemeet doctor [session-id]`는 세션, Node, 통화 중 상태,
수동 작업 이유, realtime provider 연결, `realtimeReady`, 오디오
입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다.
원시 JSON이 필요하면 `googlemeet status [session-id]`를 사용하세요. 토큰을 노출하지 않고 Google Meet OAuth refresh를 확인해야 하면 `googlemeet doctor --oauth`를 사용하고, Google Meet API 증명도 필요하면 `--meeting` 또는 `--create-space`를 추가하세요.

에이전트가 시간 초과되었고 이미 열린 Meet 탭이 보인다면, 다른 탭을 열지 말고 그 탭을 검사하세요.

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 작업은 `recover_current_tab`입니다. 이는 구성된 Chrome Node의 기존 Meet 탭에 포커스를 맞추고 검사합니다. 새 탭을 열거나 새 세션을 만들지 않으며, 로그인, 승인, 권한, 오디오 선택 상태 같은 현재 차단 요인을 보고합니다. CLI 명령은 구성된 Gateway와 통신하므로 Gateway가 실행 중이어야 하고 Chrome Node가 연결되어 있어야 합니다.

### Twilio 설정 검사 실패

`voice-call`이 허용되지 않았거나 활성화되지 않으면 `twilio-voice-call-plugin`이 실패합니다.
이를 `plugins.allow`에 추가하고 `plugins.entries.voice-call`을 활성화한 뒤 Gateway를 다시 로드하세요.

Twilio 백엔드에 account SID, auth token 또는 발신 번호가 없으면 `twilio-voice-call-credentials`가 실패합니다. Gateway 호스트에 다음을 설정하세요.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

그런 다음 Gateway를 재시작하거나 다시 로드하고 다음을 실행하세요.

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 기본적으로 준비 상태만 확인합니다. 특정 번호에 대한 드라이런:

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제로 라이브 아웃바운드 알림 전화를 걸려는 경우에만 `--yes`를 추가하세요.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화는 시작되지만 회의에 들어가지 못함

Meet 이벤트에 전화 접속 세부 정보가 노출되는지 확인하세요. 정확한 전화 접속 번호와 PIN 또는 사용자 정의 DTMF 시퀀스를 전달하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

provider가 PIN 입력 전에 일시 정지를 필요로 한다면 `--dtmf-sequence`에서 앞에 `w` 또는 쉼표를 사용하세요.

## 참고

Google Meet의 공식 media API는 수신 중심이므로, Meet 통화에 말하기 위해서는 여전히 참가자 경로가 필요합니다. 이 Plugin은 그 경계를 명확히 유지합니다.
Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는 전화 접속 참여를 처리합니다.

Chrome realtime 모드에는 다음 중 하나가 필요합니다.

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가 realtime 모델 브리지를 소유하고 해당 명령과 선택된 realtime 음성 provider 사이에서 8kHz G.711 mu-law 오디오를 파이프합니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬 오디오 경로를 소유하며 daemon을 시작하거나 검증한 뒤 종료해야 합니다.

깨끗한 양방향 오디오를 위해서는 Meet 출력과 Meet 마이크를 별도의 가상 장치 또는 Loopback 스타일 가상 장치 그래프로 라우팅하세요. 단일 공유 BlackHole 장치는 다른 참가자의 오디오를 다시 통화에 에코할 수 있습니다.

`googlemeet speak`는 Chrome 세션의 활성 realtime 오디오 브리지를 트리거합니다.
`googlemeet leave`는 해당 브리지를 중지합니다. Voice Call Plugin을 통해 위임된 Twilio 세션의 경우 `leave`는 기본 음성 통화도 종료합니다.

## 관련 항목

- [Voice call plugin](/ko/plugins/voice-call)
- [Talk mode](/ko/nodes/talk)
- [Building plugins](/ko/plugins/building-plugins)
