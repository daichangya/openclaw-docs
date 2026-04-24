---
read_when:
    - Google Chat 채널 기능 작업 중입니다.
summary: Google Chat 앱 지원 상태, 기능 및 구성
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T06:03:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

상태: Google Chat API Webhook을 통한 DM 및 스페이스 지원 준비 완료(HTTP 전용).

## 빠른 설정(초보자용)

1. Google Cloud 프로젝트를 만들고 **Google Chat API**를 활성화합니다.
   - 이동: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API가 아직 활성화되지 않았다면 활성화합니다.
2. **서비스 계정**을 만듭니다.
   - **Create Credentials** > **Service Account**를 클릭합니다.
   - 원하는 이름을 지정합니다(예: `openclaw-chat`).
   - 권한은 비워 둡니다(**Continue** 클릭).
   - 액세스 권한이 있는 주체도 비워 둡니다(**Done** 클릭).
3. **JSON 키**를 만들고 다운로드합니다.
   - 서비스 계정 목록에서 방금 만든 계정을 클릭합니다.
   - **Keys** 탭으로 이동합니다.
   - **Add Key** > **Create new key**를 클릭합니다.
   - **JSON**을 선택하고 **Create**를 클릭합니다.
4. 다운로드한 JSON 파일을 gateway 호스트에 저장합니다(예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat 앱을 만듭니다.
   - **Application info**를 입력합니다.
     - **App name**: (예: `OpenClaw`)
     - **Avatar URL**: (예: `https://openclaw.ai/logo.png`)
     - **Description**: (예: `개인 AI Assistant`)
   - **Interactive features**를 활성화합니다.
   - **Functionality**에서 **Join spaces and group conversations**를 체크합니다.
   - **Connection settings**에서 **HTTP endpoint URL**을 선택합니다.
   - **Triggers**에서 **Use a common HTTP endpoint URL for all triggers**를 선택하고, gateway의 공개 URL 뒤에 `/googlechat`를 붙여 설정합니다.
     - _팁: gateway의 공개 URL은 `openclaw status`로 확인할 수 있습니다._
   - **Visibility**에서 **Make this Chat app available to specific people and groups in `<Your Domain>`**를 체크합니다.
   - 텍스트 상자에 이메일 주소를 입력합니다(예: `user@example.com`).
   - 하단의 **Save**를 클릭합니다.
6. **앱 상태를 활성화합니다.**
   - 저장 후 **페이지를 새로고침**합니다.
   - **App status** 섹션을 찾습니다(보통 저장 후 상단 또는 하단에 표시됨).
   - 상태를 **Live - available to users**로 변경합니다.
   - 다시 **Save**를 클릭합니다.
7. 서비스 계정 경로와 Webhook audience로 OpenClaw를 구성합니다.
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 또는 config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook audience 유형과 값을 설정합니다(Chat 앱 구성과 일치해야 함).
9. gateway를 시작합니다. 그러면 Google Chat이 Webhook 경로로 POST를 보냅니다.

## Google Chat에 추가하기

gateway가 실행 중이고 이메일이 visibility 목록에 추가된 후에는 다음을 진행합니다.

1. [Google Chat](https://chat.google.com/)으로 이동합니다.
2. **Direct Messages** 옆의 **+**(플러스) 아이콘을 클릭합니다.
3. 검색창(보통 사람을 추가하는 위치)에 Google Cloud Console에서 구성한 **App name**을 입력합니다.
   - **참고**: 이 봇은 비공개 앱이므로 "Marketplace" 탐색 목록에는 표시되지 않습니다. 이름으로 직접 검색해야 합니다.
4. 결과에서 봇을 선택합니다.
5. **Add** 또는 **Chat**을 클릭해 1:1 대화를 시작합니다.
6. Assistant를 트리거하려면 "Hello"를 전송합니다.

## 공개 URL(Webhook 전용)

Google Chat Webhook은 공개 HTTPS 엔드포인트를 요구합니다. 보안을 위해 **인터넷에는 `/googlechat` 경로만 노출하세요.** OpenClaw 대시보드 및 기타 민감한 엔드포인트는 사설 네트워크에 유지하세요.

### 옵션 A: Tailscale Funnel(권장)

Tailscale Serve는 비공개 대시보드에, Funnel은 공개 Webhook 경로에 사용합니다. 이렇게 하면 `/`는 비공개로 유지되고 `/googlechat`만 노출됩니다.

1. **gateway가 어떤 주소에 바인딩되어 있는지 확인합니다.**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP 주소를 확인합니다(예: `127.0.0.1`, `0.0.0.0`, 또는 `100.x.x.x` 같은 Tailscale IP).

2. **대시보드를 tailnet 전용으로 노출합니다(포트 8443).**

   ```bash
   # localhost에 바인딩된 경우(127.0.0.1 또는 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP에만 바인딩된 경우(예: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook 경로만 공개로 노출합니다.**

   ```bash
   # localhost에 바인딩된 경우(127.0.0.1 또는 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP에만 바인딩된 경우(예: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **노드에 Funnel 액세스를 승인합니다.**
   메시지가 표시되면 출력에 나타난 승인 URL로 이동해 tailnet 정책에서 이 노드에 대한 Funnel을 활성화합니다.

5. **구성을 확인합니다.**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 Webhook URL은 다음과 같습니다.
`https://<node-name>.<tailnet>.ts.net/googlechat`

비공개 대시보드는 tailnet 전용으로 유지됩니다.
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat 앱 구성에는 공개 URL(`:8443` 제외)을 사용하세요.

> 참고: 이 구성은 재부팅 후에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset` 및 `tailscale serve reset`을 실행하세요.

### 옵션 B: 리버스 프록시(Caddy)

Caddy 같은 리버스 프록시를 사용하는 경우 특정 경로만 프록시하세요.

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

이 구성에서는 `your-domain.com/`에 대한 모든 요청이 무시되거나 404를 반환하고, `your-domain.com/googlechat`만 안전하게 OpenClaw로 라우팅됩니다.

### 옵션 C: Cloudflare Tunnel

터널의 ingress 규칙을 구성해 Webhook 경로만 라우팅하세요.

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## 동작 방식

1. Google Chat이 gateway로 Webhook POST를 보냅니다. 각 요청에는 `Authorization: Bearer <token>` 헤더가 포함됩니다.
   - OpenClaw는 헤더가 있을 때 전체 Webhook 본문을 읽거나 파싱하기 전에 bearer 인증을 검증합니다.
   - 본문에 `authorizationEventObject.systemIdToken`이 포함된 Google Workspace Add-on 요청은 더 엄격한 사전 인증 본문 예산을 통해 지원됩니다.
2. OpenClaw는 구성된 `audienceType` + `audience`에 대해 토큰을 검증합니다.
   - `audienceType: "app-url"` → audience는 HTTPS Webhook URL입니다.
   - `audienceType: "project-number"` → audience는 Cloud 프로젝트 번호입니다.
3. 메시지는 스페이스별로 라우팅됩니다.
   - DM은 세션 키 `agent:<agentId>:googlechat:direct:<spaceId>`를 사용합니다.
   - 스페이스는 세션 키 `agent:<agentId>:googlechat:group:<spaceId>`를 사용합니다.
4. DM 액세스는 기본적으로 페어링 방식입니다. 알 수 없는 발신자는 페어링 코드를 받으며, 다음으로 승인합니다.
   - `openclaw pairing approve googlechat <code>`
5. 그룹 스페이스는 기본적으로 @멘션이 필요합니다. 멘션 감지에 앱의 사용자 이름이 필요하면 `botUser`를 사용하세요.

## 대상

전달 및 허용 목록에는 다음 식별자를 사용하세요.

- 다이렉트 메시지: `users/<userId>`(권장)
- 원시 이메일 `name@example.com`은 변경 가능하며 `channels.googlechat.dangerouslyAllowNameMatching: true`일 때만 다이렉트 허용 목록 매칭에 사용됩니다.
- 사용 중단 예정: `users/<email>`은 이메일 허용 목록이 아니라 사용자 ID로 처리됩니다.
- 스페이스: `spaces/<spaceId>`.

## 주요 구성

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // 또는 serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 선택 사항; 멘션 감지에 도움
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "짧게만 답변하세요.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- 서비스 계정 자격 증명은 `serviceAccount`(JSON 문자열)로 인라인 전달할 수도 있습니다.
- `serviceAccountRef`도 지원됩니다(env/file SecretRef 포함). `channels.googlechat.accounts.<id>.serviceAccountRef` 아래의 계정별 ref도 지원됩니다.
- `webhookPath`가 설정되지 않으면 기본 Webhook 경로는 `/googlechat`입니다.
- `dangerouslyAllowNameMatching`은 허용 목록에 대해 변경 가능한 이메일 principal 매칭을 다시 활성화합니다(비상 호환성 모드).
- `actions.reactions`가 활성화되면 반응은 `reactions` 도구 및 `channels action`을 통해 사용할 수 있습니다.
- 메시지 action은 텍스트용 `send`와 명시적 첨부 전송용 `upload-file`을 제공합니다. `upload-file`은 `media` / `filePath` / `path`와 선택적 `message`, `filename`, 스레드 대상을 받습니다.
- `typingIndicator`는 `none`, `message`(기본값), `reaction`을 지원합니다(`reaction`은 사용자 OAuth 필요).
- 첨부 파일은 Chat API를 통해 다운로드되어 미디어 파이프라인에 저장됩니다(크기는 `mediaMaxMb`로 제한됨).

Secrets 참조 세부 정보: [Secrets Management](/ko/gateway/secrets)

## 문제 해결

### 405 Method Not Allowed

Google Cloud Logs Explorer에 다음과 같은 오류가 표시되는 경우:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

이는 Webhook 핸들러가 등록되지 않았음을 의미합니다. 일반적인 원인은 다음과 같습니다.

1. **채널이 구성되지 않음**: config에 `channels.googlechat` 섹션이 없습니다. 다음으로 확인하세요.

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"가 반환되면 구성을 추가하세요([주요 구성](#config-highlights) 참고).

2. **Plugin이 활성화되지 않음**: Plugin 상태를 확인하세요.

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"로 표시되면 config에 `plugins.entries.googlechat.enabled: true`를 추가하세요.

3. **Gateway를 재시작하지 않음**: config를 추가한 후 gateway를 재시작하세요.

   ```bash
   openclaw gateway restart
   ```

채널이 실행 중인지 확인합니다.

```bash
openclaw channels status
# 표시 예: Google Chat default: enabled, configured, ...
```

### 기타 문제

- 인증 오류나 누락된 audience 구성을 확인하려면 `openclaw channels status --probe`를 사용하세요.
- 메시지가 도착하지 않으면 Chat 앱의 Webhook URL 및 이벤트 구독을 확인하세요.
- 멘션 게이팅 때문에 응답이 차단되면 `botUser`를 앱의 사용자 리소스 이름으로 설정하고 `requireMention`을 확인하세요.
- 요청이 gateway에 도달하는지 확인하려면 테스트 메시지를 보내는 동안 `openclaw logs --follow`를 사용하세요.

관련 문서:

- [Gateway configuration](/ko/gateway/configuration)
- [Security](/ko/gateway/security)
- [Reactions](/ko/tools/reactions)

## 관련

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 강화 방법
