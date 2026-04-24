---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 접근을 원하는 경우
summary: Gateway용 브라우저 기반 Control UI(채팅, node, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T06:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

이 UI는 같은 포트의 **Gateway WebSocket**과 **직접 통신**합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이라면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때의 Tailscale Serve identity 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때의 trusted-proxy identity 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택한 gateway URL에 대한
token을 유지하며, password는 저장하지 않습니다. 온보딩은 보통 첫 연결 시
shared-secret auth용 gateway token을 생성하지만,
`gateway.auth.mode`가 `"password"`일 때는 password auth도 동작합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면 Gateway는
**1회성 페어링 승인**을 요구합니다 — 같은 Tailnet에 있고
`gateway.auth.allowTailscale: true`인 경우에도 마찬가지입니다. 이는
무단 접근을 막기 위한 보안 조치입니다.

**표시되는 내용:** `"disconnected (1008): pairing required"`

**기기를 승인하려면:**

```bash
# 대기 중인 요청 목록
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

브라우저가 변경된 auth 세부 정보(role/scopes/public
key)로 페어링을 다시 시도하면, 이전 대기 요청은 대체되고 새 `requestId`가
생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링된 상태에서 read 접근을
write/admin 접근으로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다.
OpenClaw는 기존 승인을 계속 활성 상태로 유지하고, 더 넓은 권한의 재연결은 차단한 뒤,
새 scope 집합을 명시적으로 승인하도록 요청합니다.

한 번 승인되면 해당 기기는 기억되며,
`openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한
다시 승인할 필요가 없습니다. token 순환과 취소는
[Devices CLI](/ko/cli/devices)를 참조하세요.

**참고:**

- 직접적인 로컬 loopback 브라우저 연결(`127.0.0.1` / `localhost`)은
  자동 승인됩니다.
- Tailnet 및 LAN 브라우저 연결은 같은 머신에서 시작되더라도
  여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 device ID를 생성하므로, 브라우저를 바꾸거나
  브라우저 데이터를 지우면 다시 페어링해야 합니다.

## 개인 정체성(브라우저 로컬)

Control UI는 브라우저별 개인 정체성(display name 및
avatar)을 지원하며, 공유 세션에서 보낸 메시지에 attribution용으로 첨부됩니다. 이는
브라우저 저장소에 저장되고 현재 브라우저 프로필 범위에만 적용되며,
다른 기기로 동기화되지 않고, 실제로 보낸 메시지의 일반 transcript 작성자 메타데이터를 제외하면
서버 측에 저장되지 않습니다. 사이트 데이터를 지우거나 브라우저를 바꾸면
빈 상태로 초기화됩니다.

## 런타임 config 엔드포인트

Control UI는 런타임 설정을
`/__openclaw/control-ui-config.json`에서 가져옵니다. 이 엔드포인트는
나머지 HTTP 표면과 동일한 gateway auth로 보호됩니다. 인증되지 않은 브라우저는
이를 가져올 수 없으며, 성공적인 fetch를 위해서는 이미 유효한 gateway
token/password, Tailscale Serve identity, 또는 trusted-proxy identity가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 locale을 기준으로 스스로 현지화할 수 있습니다.
나중에 이를 재정의하려면 **Overview -> Gateway Access -> Language**를 여세요.
locale 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원 locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 locale은 브라우저 저장소에 저장되며 이후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 fallback됩니다.

## 현재 할 수 있는 일

- Gateway WS를 통한 모델과 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- 브라우저에서 WebRTC를 통해 OpenAI Realtime과 직접 통신. Gateway는
  `talk.realtime.session`으로 짧은 수명의 Realtime client secret을 발급하고,
  브라우저는 마이크 오디오를 OpenAI에 직접 보내며
  더 큰 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult`
  도구 호출을 `chat.send`를 통해 다시 전달합니다.
- Chat에서 tool call + 라이브 tool 출력 카드 스트리밍(에이전트 이벤트)
- Channels: 기본 제공 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 config (`channels.status`, `web.login.*`, `config.patch`)
- Instances: presence 목록 + 새로고침 (`system-presence`)
- Sessions: 목록 + 세션별 model/thinking/fast/verbose/trace/reasoning 재정의 (`sessions.list`, `sessions.patch`)
- Dreams: dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더 (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
- Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트 (`skills.*`)
- Nodes: 목록 + caps (`node.list`)
- Exec approvals: `exec host=gateway/node`용 gateway 또는 node 허용 목록 + ask 정책 편집 (`exec.approvals.*`)
- Config: `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
- Config: 검증과 함께 적용 + 재시작 (`config.apply`) 및 마지막 활성 세션 깨우기
- Config 쓰기에는 동시 편집 덮어쓰기를 막기 위한 base-hash 가드 포함
- Config 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 config payload의 ref에 대해 활성 SecretRef 확인도 사전 점검합니다. 해결되지 않은 활성 제출 ref는 쓰기 전에 거부됩니다
- Config 스키마 + form 렌더링 (`config.schema` / `config.schema.lookup`,
  필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위 항목
  요약, 중첩 object/wildcard/array/composition node의 docs 메타데이터,
  사용 가능한 경우 Plugin + 채널 스키마 포함); Raw JSON 편집기는
  스냅샷에 안전한 raw round-trip이 있을 때만 사용할 수 있습니다
- 스냅샷이 raw 텍스트를 안전하게 round-trip할 수 없으면 Control UI는 Form 모드를 강제하고 해당 스냅샷에서 Raw 모드를 비활성화합니다
- Raw JSON 편집기의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw로 작성된 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 round-trip 가능한 경우 외부 편집이 reset 후에도 유지됩니다
- 구조화된 SecretRef object 값은 실수로 object-to-string 손상이 일어나는 것을 막기 위해 form 텍스트 입력에서 읽기 전용으로 렌더링됩니다
- Debug: 상태/health/models 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
- Logs: gateway 파일 로그 실시간 tail + 필터/내보내기 (`logs.tail`)
- Update: 패키지/git 업데이트 + 재시작 실행 (`update.run`) 및 재시작 보고서

Cron 작업 패널 참고:

- 격리된 작업의 경우 delivery 기본값은 announce summary입니다. 내부 전용 실행만 원한다면 none으로 전환할 수 있습니다.
- announce가 선택되면 channel/target 필드가 나타납니다.
- Webhook 모드는 `delivery.mode = "webhook"`을 사용하고 `delivery.to`를 유효한 HTTP(S) Webhook URL로 설정합니다.
- main-session 작업에는 webhook 및 none delivery 모드를 사용할 수 있습니다.
- 고급 편집 제어에는 실행 후 삭제, 에이전트 재정의 지우기, cron exact/stagger 옵션,
  에이전트 model/thinking 재정의, best-effort delivery 토글이 포함됩니다.
- Form 검증은 필드 수준 오류와 함께 인라인으로 수행되며, 잘못된 값이 있으면 수정될 때까지 저장 버튼이 비활성화됩니다.
- 전용 bearer token을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 auth 헤더 없이 전송됩니다.
- 지원 중단된 fallback: `notify: true`가 있는 저장된 레거시 작업은 마이그레이션 전까지 `cron.webhook`을 계속 사용할 수 있습니다.

## 채팅 동작

- `chat.send`는 **논블로킹**입니다. 즉시 `{ runId, status: "started" }`로 ack를 반환하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
- 같은 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`, 완료 후에는 `{ status: "ok" }`를 반환합니다.
- `chat.history` 응답은 UI 안전을 위해 크기 제한이 있습니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 자르거나, 무거운 메타데이터 블록을 생략하거나, 너무 큰 메시지를 placeholder(`"[chat.history omitted: message too large]"`)로 대체할 수 있습니다.
- assistant/생성된 이미지는 관리형 미디어 참조로 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 새로고침 시 채팅 기록 응답에 raw base64 이미지 payload가 그대로 남아 있을 필요가 없습니다.
- `chat.history`는 표시 전용 인라인 directive 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 tool-call XML payload(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 tool-call 블록 포함), 유출된 ASCII/전각 모델 제어 token도 제거하며, 전체 표시 텍스트가 정확히 silent token `NO_REPLY` / `no_reply`뿐인 assistant 항목은 생략합니다.
- `chat.inject`는 세션 transcript에 assistant note를 추가하고 UI 전용 업데이트용 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
- 채팅 헤더의 model 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 patch합니다. 이는 한 턴 전용 send 옵션이 아니라 영구적인 세션 재정의입니다.
- Talk 모드는 등록된 realtime voice provider를 사용합니다. OpenAI를 구성하려면
  `talk.provider: "openai"`와 `talk.providers.openai.apiKey`를 설정하거나,
  Voice Call realtime provider config를 재사용하세요. 브라우저는 표준
  OpenAI API key를 받지 않으며, ephemeral Realtime client secret만 받습니다. Realtime 세션 프롬프트는 Gateway가 조합하며, `talk.realtime.session`은 호출자 제공 instruction 재정의를 받지 않습니다.
- Chat composer에서 Talk 제어는 마이크 받아쓰기 버튼 옆의 파형 버튼입니다. Talk가 시작되면 composer 상태 행에
  `Connecting Talk...`가 표시되고, 이후 오디오 연결 중에는 `Talk live`,
  realtime tool call이 구성된 더 큰 모델을 `chat.send`를 통해 조회 중일 때는
  `Asking OpenClaw...`가 표시됩니다.
- 중지:
  - **Stop** 클릭(`chat.abort` 호출)
  - 실행이 활성 상태일 때는 일반 후속 메시지가 queue에 들어갑니다. queue된 메시지에서 **Steer**를 클릭하면 해당 후속 메시지를 실행 중 턴에 주입합니다.
  - `/stop` 입력(또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립 실행형 중단 문구)으로 out-of-band 중단
  - `chat.abort`는 `{ sessionKey }`(`runId` 없음)를 지원해 해당 세션의 모든 활성 실행을 중단할 수 있습니다
- 중단 시 partial 보존:
  - 실행이 중단되면 partial assistant 텍스트가 UI에 계속 표시될 수 있습니다
  - Gateway는 버퍼링된 출력이 존재할 때 중단된 partial assistant 텍스트를 transcript 기록에 저장합니다
  - 저장된 항목에는 transcript 소비자가 중단 partial과 정상 완료 출력을 구분할 수 있도록 중단 메타데이터가 포함됩니다

## 호스팅된 embed

assistant 메시지는 `[embed ...]`
shortcode를 사용해 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe sandbox 정책은
`gateway.controlUi.embedSandbox`로 제어됩니다.

- `strict`: 호스팅된 embed 내부의 스크립트 실행을 비활성화
- `scripts`: origin 격리를 유지하면서 대화형 embed 허용. 이것이
  기본값이며, 보통 자체 완결형 브라우저 게임/위젯에는 충분합니다
- `trusted`: 같은 사이트 문서가 의도적으로 더 강한 권한을 필요로 할 때
  `allow-scripts` 위에 `allow-same-origin`을 추가합니다

예시:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

임베드된 문서가 실제로 same-origin
동작을 필요로 할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 대화형 캔버스에는 `scripts`가
더 안전한 선택입니다.

절대 외부 `http(s)` embed URL은 기본적으로 계속 차단됩니다. 의도적으로
`[embed url="https://..."]`로 제3자 페이지를 로드하고 싶다면
`gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 접근(권장)

### 통합 Tailscale Serve(권장)

Gateway를 loopback에 유지하고 Tailscale Serve가 이를 HTTPS로 프록시하게 하세요.

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

기본적으로 Control UI/WebSocket Serve 요청은 `gateway.auth.allowTailscale`이 `true`일 때 Tailscale identity 헤더
(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는
`x-forwarded-for` 주소를 `tailscale whois`로 확인해 identity를 검증하고,
이를 헤더와 일치시킵니다. 또한 요청이 loopback에 도달하면서 Tailscale의
`x-forwarded-*` 헤더를 포함할 때만 이를 허용합니다.
Serve 트래픽에도 명시적인 shared-secret
자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음
`gateway.auth.mode: "token"` 또는
`"password"`를 사용하세요.
이 비동기 Serve identity 경로에서는 같은 클라이언트 IP
및 auth scope에 대한 실패한 인증 시도가 rate-limit 기록 전에 직렬화됩니다.
따라서 같은 브라우저에서 동시에 잘못된 재시도를 하면
두 개의 일반 불일치가 병렬로 경합하는 대신 두 번째 요청에서 `retry later`가 표시될 수 있습니다.
토큰 없는 Serve 인증은 gateway 호스트가 신뢰된다는 가정에 기반합니다.
해당 호스트에서 신뢰할 수 없는 로컬 코드가 실행될 수 있다면 token/password 인증을 요구하세요.

### tailnet + token에 바인드

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그다음 열기:

- `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

일치하는 shared secret을 UI 설정에 붙여 넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

## 안전하지 않은 HTTP

대시보드를 일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 열면
브라우저는 **비보안 컨텍스트**에서 실행되며 WebCrypto를 차단합니다. 기본적으로
OpenClaw는 기기 정체성이 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용하는 localhost 전용 비보안 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 수정:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway 호스트에서)

**비보안 auth 토글 동작:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth`는 로컬 호환성 토글일 뿐입니다.

- 이는 비보안 HTTP 컨텍스트의 localhost Control UI 세션이
  기기 정체성 없이 진행되도록 허용합니다.
- pairing 검사를 우회하지는 않습니다.
- 원격(non-localhost) 기기 정체성 요구 사항을 완화하지도 않습니다.

**비상용 전용:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`는 Control UI 기기 정체성 검사를 비활성화하며,
심각한 보안 저하를 초래합니다. 비상 사용 후에는 빠르게 되돌리세요.

Trusted-proxy 참고:

- trusted-proxy 인증이 성공하면 기기 정체성 없이도 **운영자**
  Control UI 세션이 허용될 수 있습니다
- 이는 node 역할 Control UI 세션에는 **적용되지 않습니다**
- 같은 호스트의 loopback reverse proxy도 trusted-proxy 인증을 만족하지 않습니다.
  자세한 내용은 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요

HTTPS 설정 가이드는 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## Content Security Policy

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **동일 출처** 자산과 `data:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 fetch도 발생하지 않습니다.

실제로 의미하는 바:

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 avatar와 이미지는 계속 렌더링됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내부 payload에 유용).
- 채널 메타데이터가 내보내는 원격 avatar URL은 Control UI의 avatar helper에서 제거되고 기본 제공 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 fetch를 강제로 발생시키지 못합니다.

이 동작을 얻기 위해 별도로 변경할 것은 없습니다. 항상 활성화되어 있으며 구성할 수 없습니다.

## Avatar 라우트 인증

gateway auth가 구성되어 있으면, Control UI avatar 엔드포인트는 나머지 API와 동일한 gateway token을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 avatar 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙 아래에서 avatar 메타데이터를 반환합니다.
- 두 라우트에 대한 인증되지 않은 요청은 거부됩니다(인접한 assistant-media 라우트와 동일). 이렇게 하면 다른 부분이 보호된 호스트에서 avatar 라우트가 에이전트 정체성을 유출하지 못하게 됩니다.
- Control UI 자체는 avatar를 가져올 때 gateway token을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 대시보드에서 이미지가 계속 렌더링됩니다.

gateway auth를 비활성화하면(공유 호스트에서는 권장되지 않음), avatar 라우트도 gateway의 나머지 부분과 마찬가지로 인증되지 않은 상태가 됩니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 base(고정 자산 URL을 원할 때):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 dev 서버):

```bash
pnpm ui:dev
```

그다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키게 하세요.

## 디버깅/테스트: dev 서버 + 원격 Gateway

Control UI는 정적 파일이며 WebSocket 대상은 구성 가능하므로
HTTP origin과 달라도 됩니다. 이는 로컬에서 Vite dev 서버를 사용하지만
Gateway는 다른 곳에서 실행되는 경우에 유용합니다.

1. UI dev 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 1회성 auth(필요한 경우):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

참고:

- `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서는 제거됩니다.
- `token`은 가능하면 URL fragment(`#token=...`)로 전달해야 합니다. fragment는 서버로 전송되지 않으므로 요청 로그 및 Referer 유출을 피할 수 있습니다. 레거시 `?token=` 쿼리 파라미터도 호환성을 위해 한 번은 가져오지만, fallback으로만 사용되며 bootstrap 직후 바로 제거됩니다.
- `password`는 메모리에만 유지됩니다.
- `gatewayUrl`이 설정되면 UI는 config 또는 환경 자격 증명으로 fallback하지 않습니다.
  `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
- Gateway가 TLS 뒤에 있다면 `wss://`를 사용하세요(Tailscale Serve, HTTPS 프록시 등).
- `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창에서만 허용됩니다(임베드 불가).
- non-loopback Control UI 배포는 `gateway.controlUi.allowedOrigins`를
  명시적으로 설정해야 합니다(완전한 origin). 원격 dev 설정도 여기에 포함됩니다.
- 엄격히 통제된 로컬 테스트가 아니라면 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요.
  이는 “지금 사용 중인 호스트와 일치”가 아니라 “모든 브라우저 origin 허용”을 의미합니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host-header origin fallback 모드를 활성화하지만, 이는 위험한 보안 모드입니다.

예시:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

원격 접근 설정 세부 사항: [Remote access](/ko/gateway/remote)

## 관련 항목

- [Dashboard](/ko/web/dashboard) — gateway 대시보드
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [Health Checks](/ko/gateway/health) — gateway 상태 모니터링
