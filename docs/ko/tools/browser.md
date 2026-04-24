---
read_when:
    - 에이전트 제어 브라우저 자동화 추가하기
    - openclaw가 사용자의 Chrome에 간섭하는 이유 디버깅하기
    - macOS 앱에서 브라우저 설정 + 수명 주기 구현하기
summary: 통합 브라우저 제어 서비스 + 작업 명령
title: 브라우저 (OpenClaw 관리)
x-i18n:
    generated_at: "2026-04-24T06:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
이 프로필은 개인 브라우저와 분리되어 있으며,
Gateway 내부의 작은 로컬 제어 서비스(loopback 전용)를 통해 관리됩니다.

초보자용 이해 방식:

- 이를 **별도의 에이전트 전용 브라우저**라고 생각하세요.
- `openclaw` 프로필은 개인 브라우저 프로필에 **영향을 주지 않습니다**.
- 에이전트는 안전한 경로에서 **탭 열기, 페이지 읽기, 클릭, 입력**을 할 수 있습니다.
- 내장 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결됩니다.

## 제공되는 기능

- **openclaw**라는 별도 브라우저 프로필(기본값: 주황색 강조)
- 결정론적인 탭 제어(list/open/focus/close)
- 에이전트 작업(click/type/drag/select), 스냅샷, 스크린샷, PDF
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...)

이 브라우저는 **일상적으로 쓰는 브라우저가 아닙니다**. 에이전트 자동화와 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 나오면 config에서 이를 활성화하고(아래 참조) Gateway를 재시작하세요.

`openclaw browser` 명령 자체가 없거나, 에이전트가 브라우저 도구를 사용할 수 없다고 말하면
[브라우저 명령 또는 도구 누락](/ko/tools/browser#missing-browser-command-or-tool)으로 이동하세요.

## Plugin 제어

기본 `browser` 도구는 번들 Plugin입니다. 같은 `browser` 도구 이름을 등록하는 다른 Plugin으로 교체하려면 이를 비활성화하세요.

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

기본값은 `plugins.entries.browser.enabled`와 `browser.enabled=true`가 **둘 다** 필요합니다. Plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구, 제어 서비스가 하나의 단위로 함께 제거됩니다. 대체용으로 `browser.*` config 자체는 그대로 유지됩니다.

브라우저 config 변경은 Plugin이 서비스를 다시 등록할 수 있도록 Gateway 재시작이 필요합니다.

## 브라우저 명령 또는 도구 누락

업그레이드 후 `openclaw browser`를 알 수 없거나, `browser.request`가 없거나, 에이전트가 브라우저 도구를 사용할 수 없다고 보고한다면 보통 원인은 `plugins.allow` 목록에 `browser`가 빠져 있기 때문입니다. 이를 추가하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, `tools.alsoAllow: ["browser"]`는 allowlist 멤버십을 대체하지 않습니다. allowlist가 Plugin 로딩을 제어하고, 도구 정책은 로딩 이후에만 실행됩니다. `plugins.allow` 자체를 완전히 제거해도 기본값으로 복원됩니다.

## 프로필: `openclaw` vs `user`

- `openclaw`: 관리형, 격리된 브라우저(확장 필요 없음)
- `user`: **실제 로그인된 Chrome**
  세션을 위한 내장 Chrome MCP attach 프로필

에이전트 브라우저 도구 호출의 경우:

- 기본값: 격리된 `openclaw` 브라우저 사용
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 attach 프롬프트를 클릭/승인할 수 있다면 `profile="user"`를 선호
- 특정 브라우저 모드를 원할 때 `profile`이 명시적 재정의입니다

기본적으로 관리형 모드를 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 구성

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰된 사설 네트워크 액세스에만 옵트인
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 시간 제한(ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 시간 제한(ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="포트 및 도달 가능성">

- 제어 서비스는 `gateway.port`에서 파생된 포트의 loopback에 바인드됩니다(기본값 `18791` = gateway + 2). `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`를 재정의하면 파생 포트도 같은 계열에서 함께 이동합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP가 아닐 경우 이것들을 설정하지 마세요. `cdpUrl`은 설정되지 않으면 관리되는 로컬 CDP 포트가 기본값이 됩니다.
- `remoteCdpTimeoutMs`는 원격(non-loopback) CDP HTTP 도달 가능성 점검에 적용되며, `remoteCdpHandshakeTimeoutMs`는 원격 CDP WebSocket 핸드셰이크에 적용됩니다.

</Accordion>

<Accordion title="SSRF 정책">

- 브라우저 탐색 및 open-tab은 탐색 전에 SSRF 가드가 적용되며, 이후 최종 `http(s)` URL에 대해 최선의 노력 방식으로 다시 점검됩니다.
- 엄격한 SSRF 모드에서는 원격 CDP 엔드포인트 검색과 `/json/version` probe(`cdpUrl`)도 점검됩니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. 사설 네트워크 브라우저 액세스를 의도적으로 신뢰하는 경우에만 활성화하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 브라우저를 절대 실행하지 않고, 이미 실행 중인 경우에만 연결한다는 뜻입니다.
- `color`(최상위 및 프로필별)는 브라우저 UI를 색칠하여 어떤 프로필이 활성 상태인지 보이게 합니다.
- 기본 프로필은 `openclaw`(관리형 독립 프로필)입니다. 로그인된 사용자 브라우저를 사용하려면 `defaultProfile: "user"`를 사용하세요.
- 자동 감지 순서: 시스템 기본 브라우저가 Chromium 기반이면 그것을 사용하고, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary 순입니다.
- `driver: "existing-session"`은 raw CDP 대신 Chrome DevTools MCP를 사용합니다. 해당 driver에는 `cdpUrl`을 설정하지 마세요.
- existing-session 프로필이 비기본 Chromium 사용자 프로필(Brave, Edge 등)에 연결해야 한다면 `browser.profiles.<name>.userDataDir`를 설정하세요.

</Accordion>

</AccordionGroup>

## Brave(또는 다른 Chromium 기반 브라우저) 사용

**시스템 기본** 브라우저가 Chromium 기반(Chrome/Brave/Edge 등)이라면
OpenClaw가 자동으로 이를 사용합니다. 자동 감지를 재정의하려면 `browser.executablePath`를 설정하세요.

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

또는 플랫폼별 config에 설정:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## 로컬 vs 원격 제어

- **로컬 제어(기본값):** Gateway가 loopback 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(Node 호스트):** 브라우저가 있는 머신에서 Node 호스트를 실행하면 Gateway가 브라우저 작업을 그쪽으로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 브라우저에
  연결하려면 `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정하세요. 이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.

중지 동작은 프로필 모드에 따라 다릅니다.

- 로컬 관리형 프로필: `openclaw browser stop`은
  OpenClaw가 실행한 브라우저 프로세스를 중지합니다
- attach-only 및 원격 CDP 프로필: `openclaw browser stop`은 브라우저 프로세스가 OpenClaw에 의해 실행되지 않았더라도 활성
  제어 세션을 닫고 Playwright/CDP 에뮬레이션 재정의(viewport,
  color scheme, locale, timezone, offline mode 및 유사 상태)를 해제합니다

원격 CDP URL에는 인증을 포함할 수 있습니다.

- 쿼리 token(예: `https://provider.example?token=<token>`)
- HTTP Basic auth(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트를 호출할 때와
CDP WebSocket에 연결할 때 인증을 유지합니다. token을 config 파일에 커밋하는 대신
환경 변수나 시크릿 관리자를 사용하는 것이 좋습니다.

## Node 브라우저 프록시(무설정 기본값)

브라우저가 있는 머신에서 **Node 호스트**를 실행하면 OpenClaw는
추가 브라우저 config 없이도 브라우저 도구 호출을 해당 Node로 자동 라우팅할 수 있습니다.
이것이 원격 gateway의 기본 경로입니다.

참고:

- Node 호스트는 로컬 브라우저 제어 서버를 **프록시 명령**으로 노출합니다.
- 프로필은 Node 자체의 `browser.profiles` config에서 가져옵니다(로컬과 동일).
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 비워 두면 레거시/기본 동작을 사용하여, 프로필 create/delete 경로를 포함해 구성된 모든 프로필이 프록시를 통해 접근 가능합니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면 OpenClaw는 이를 최소 권한 경계로 취급합니다. 허용 목록에 있는 프로필만 대상으로 지정할 수 있고, 영구 프로필 create/delete 경로는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요:
  - Node 측: `nodeHost.browserProxy.enabled=false`
  - gateway 측: `gateway.nodes.browser.mode="off"`

## Browserless(호스팅된 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS와 WebSocket을 통해
CDP 연결 URL을 노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식 모두 사용할 수 있지만,
원격 브라우저 프로필에는 Browserless 연결 문서에 있는 직접 WebSocket URL이 가장 간단합니다.

예시:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- `<BROWSERLESS_API_KEY>`를 실제 Browserless token으로 바꾸세요.
- Browserless 계정에 맞는 지역 엔드포인트를 선택하세요(문서 참조).
- Browserless가 HTTPS base URL을 제공하면 이를 직접 CDP 연결용 `wss://`로 변환하거나,
  HTTPS URL을 그대로 두고 OpenClaw가 `/json/version`을 검색하게 할 수 있습니다.

## 직접 WebSocket CDP provider

일부 호스팅 브라우저 서비스는 표준 HTTP 기반 CDP 검색(`/json/version`) 대신
**직접 WebSocket** 엔드포인트를 노출합니다. OpenClaw는 세 가지
CDP URL 형태를 허용하며 자동으로 올바른 연결 전략을 선택합니다.

- **HTTP(S) 검색** — `http://host[:port]` 또는 `https://host[:port]`.
  OpenClaw는 `/json/version`을 호출해 WebSocket debugger URL을 검색한 다음
  연결합니다. WebSocket fallback은 없습니다.
- **직접 WebSocket 엔드포인트** — `ws://host[:port]/devtools/<kind>/<id>` 또는
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  경로가 있는 `wss://...`.
  OpenClaw는 WebSocket 핸드셰이크를 통해 직접 연결하고
  `/json/version`은 완전히 건너뜁니다.
- **bare WebSocket 루트** — `/devtools/...` 경로가 없는 `ws://host[:port]` 또는
  `wss://host[:port]`(예: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw는 먼저 HTTP
  `/json/version` 검색을 시도하고(스킴을 `http`/`https`로 정규화),
  검색 결과 `webSocketDebuggerUrl`이 반환되면 이를 사용하고, 그렇지 않으면 OpenClaw는
  bare root에 대한 직접 WebSocket 핸드셰이크로 fallback합니다. 이렇게 하면 로컬 Chrome을 가리키는 bare `ws://`도 연결될 수 있습니다. Chrome은
  `/json/version`에서 얻은 특정 대상별 경로에서만 WebSocket 업그레이드를 허용하기 때문입니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는 내장 CAPTCHA 해결, stealth 모드, residential
프록시를 갖춘 headless 브라우저 실행용 클라우드 플랫폼입니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

참고:

- [가입](https://www.browserbase.com/sign-up) 후 [Overview dashboard](https://www.browserbase.com/overview)에서 **API Key**를 복사하세요.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸세요.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동 생성하므로 수동 세션 생성 단계가 필요 없습니다.
- 무료 플랜은 동시 세션 1개와 월 1 브라우저 시간을 허용합니다.
  유료 플랜 한도는 [가격](https://www.browserbase.com/pricing)을 참조하세요.
- 전체 API
  참조, SDK 가이드, 통합 예시는 [Browserbase docs](https://docs.browserbase.com)를 참조하세요.

## 보안

핵심 개념:

- 브라우저 제어는 loopback 전용이며, 액세스는 Gateway의 인증 또는 Node 페어링을 통해 흐릅니다.
- 독립형 loopback 브라우저 HTTP API는 **공유 시크릿 인증만** 사용합니다:
  gateway token bearer auth, `x-openclaw-password`, 또는
  구성된 gateway password를 사용하는 HTTP Basic auth.
- Tailscale Serve identity 헤더와 `gateway.auth.mode: "trusted-proxy"`는
  이 독립형 loopback 브라우저 API를 인증하지 **않습니다**.
- 브라우저 제어가 활성화되어 있고 공유 시크릿 인증이 구성되지 않으면, OpenClaw는
  시작 시 `gateway.auth.token`을 자동 생성하고 이를 config에 영속 저장합니다.
- `gateway.auth.mode`가 이미
  `password`, `none`, 또는 `trusted-proxy`인 경우 OpenClaw는 해당 token을 자동 생성하지 **않습니다**.
- Gateway와 모든 Node 호스트는 비공개 네트워크(Tailscale)에 두고, 공개 노출은 피하세요.
- 원격 CDP URL/token은 시크릿으로 취급하세요. 환경 변수나 시크릿 관리자를 선호하세요.

원격 CDP 팁:

- 가능하면 암호화된 엔드포인트(HTTPS 또는 WSS)와 짧은 수명의 token을 사용하세요.
- 오래 유지되는 token을 config 파일에 직접 넣는 것은 피하세요.

## 프로필(다중 브라우저)

OpenClaw는 여러 개의 이름 있는 프로필(라우팅 config)을 지원합니다. 프로필은 다음과 같을 수 있습니다.

- **openclaw-managed**: 자체 user data 디렉터리 + CDP 포트를 가진 전용 Chromium 기반 브라우저 인스턴스
- **remote**: 명시적 CDP URL(다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **기존 세션**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필은 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP existing-session attach용으로 내장되어 있습니다.
- existing-session 프로필은 `user` 외에는 옵트인입니다. `--driver existing-session`으로 만드세요.
- 로컬 CDP 포트는 기본적으로 **18800–18899**에서 할당됩니다.
- 프로필을 삭제하면 로컬 데이터 디렉터리가 휴지통으로 이동됩니다.

모든 제어 엔드포인트는 `?profile=<name>`을 받으며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 existing-session

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 브라우저 프로필에 연결할 수도 있습니다. 이를 통해 해당 브라우저 프로필에 이미 열려 있는 탭과 로그인 상태를 재사용합니다.

공식 배경 및 설정 참조:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

내장 프로필:

- `user`

선택 사항: 다른 이름, 색상, 브라우저 데이터 디렉터리를 원한다면
자체 사용자 지정 existing-session 프로필을 만들 수 있습니다.

기본 동작:

- 내장 `user` 프로필은 Chrome MCP 자동 연결을 사용하며,
  기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 비기본 Chrome 프로필에는 `userDataDir`을 사용하세요.

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

그런 다음 해당 브라우저에서:

1. 원격 디버깅용 inspect 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행 상태로 두고 OpenClaw가 연결할 때 연결 프롬프트를 승인합니다.

일반적인 inspect 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

live attach 스모크 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 모습:

- `status`에 `driver: existing-session` 표시
- `status`에 `transport: chrome-mcp` 표시
- `status`에 `running: true` 표시
- `tabs`에 이미 열려 있는 브라우저 탭 표시
- `snapshot`이 선택된 live 탭의 ref를 반환

연결이 동작하지 않을 때 확인할 것:

- 대상 Chromium 기반 브라우저가 버전 `144+`인지
- 해당 브라우저 inspect 페이지에서 원격 디버깅이 활성화되었는지
- 브라우저에 attach 동의 프롬프트가 나타났고 이를 수락했는지
- `openclaw doctor`는 오래된 extension 기반 브라우저 config를 마이그레이션하고
  기본 자동 연결 프로필용으로 Chrome이 로컬에 설치되었는지 점검하지만,
  브라우저 측 원격 디버깅은 대신 활성화해 줄 수 없습니다

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때는 `profile="user"`를 사용하세요.
- 사용자 지정 existing-session 프로필을 사용하는 경우 해당 프로필 이름을 명시적으로 전달하세요.
- 이 모드는 사용자가 컴퓨터 앞에서 attach
  프롬프트를 승인할 수 있을 때만 선택하세요.
- Gateway 또는 Node 호스트는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다

참고:

- 이 경로는 로그인된 브라우저 세션 안에서 작업할 수 있기 때문에 격리된 `openclaw` 프로필보다 위험성이 더 높습니다.
- OpenClaw는 이 driver에 대해 브라우저를 실행하지 않고 연결만 합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`이 설정되어 있으면 해당 user data 디렉터리를 대상으로 하도록 전달됩니다.
- existing-session은 선택된 호스트 또는 연결된
  브라우저 Node를 통해 연결될 수 있습니다. Chrome이 다른 곳에 있고 브라우저 Node가 연결되어 있지 않다면
  대신 원격 CDP 또는 Node 호스트를 사용하세요.

<Accordion title="Existing-session 기능 제한">

관리형 `openclaw` 프로필에 비해 existing-session driver는 더 많은 제약이 있습니다.

- **스크린샷** — 페이지 캡처와 `--ref` 요소 캡처는 동작하지만 CSS `--element` selector는 동작하지 않습니다. `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다. 페이지 또는 ref 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다.
- **작업** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`는 스냅샷 ref가 필요합니다(CSS selector 불가). `click`은 왼쪽 버튼만 지원합니다. `type`은 `slowly=true`를 지원하지 않으므로 `fill` 또는 `press`를 사용하세요. `press`는 `delayMs`를 지원하지 않습니다. `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 시간 제한을 지원하지 않습니다. `select`는 단일 값만 받습니다.
- **Wait / upload / dialog** — `wait --url`은 정확 일치, 부분 문자열, glob 패턴을 지원하며 `wait --load networkidle`은 지원하지 않습니다. 업로드 훅은 `ref` 또는 `inputRef`가 필요하고, 한 번에 하나의 파일만 가능하며 CSS `element`는 사용할 수 없습니다. dialog 훅은 시간 제한 재정의를 지원하지 않습니다.
- **관리형 전용 기능** — batch action, PDF 내보내기, 다운로드 가로채기, `responsebody`는 여전히 관리형 브라우저 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 user data 디렉터리**: 개인 브라우저 프로필을 절대 건드리지 않음
- **전용 포트**: 개발 워크플로와 충돌하지 않도록 `9222`를 피함
- **결정론적 탭 제어**: “마지막 탭”이 아니라 `targetId`로 탭 지정

## 브라우저 선택

로컬 실행 시 OpenClaw는 사용 가능한 첫 번째 항목을 고릅니다.

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 재정의할 수 있습니다.

플랫폼:

- macOS: `/Applications` 및 `~/Applications` 확인
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등 탐색
- Windows: 일반적인 설치 경로 확인

## 제어 API(선택 사항)

스크립팅과 디버깅을 위해 Gateway는 작은 **loopback 전용 HTTP
control API**와 이에 대응하는 `openclaw browser` CLI(스냅샷, ref, wait
강화 기능, JSON 출력, 디버그 워크플로)를 노출합니다. 전체 참조는
[브라우저 제어 API](/ko/tools/browser-control)를 참조하세요.

## 문제 해결

Linux 전용 문제(특히 snap Chromium)는
[브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)을 참조하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 설정은
[WSL2 + Windows + 원격 Chrome CDP 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참조하세요.

### CDP 시작 실패 vs 탐색 SSRF 차단

이 둘은 서로 다른 실패 유형이며, 서로 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 상태 실패**는 OpenClaw가 브라우저 제어 평면이 정상인지 확인할 수 없다는 뜻입니다.
- **탐색 SSRF 차단**은 브라우저 제어 평면은 정상인데 페이지 탐색 대상이 정책에 의해 거부된다는 뜻입니다.

일반적인 예시:

- CDP 시작 또는 준비 상태 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 탐색 SSRF 차단:
  - `start`와 `tabs`는 여전히 동작하지만 `open`, `navigate`, snapshot 또는 tab-open 흐름이 브라우저/네트워크 정책 오류와 함께 실패함

둘을 구분하려면 다음 최소 시퀀스를 사용하세요.

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 해석 방법:

- `start`가 `not reachable after start`와 함께 실패하면, 먼저 CDP 준비 상태를 점검하세요.
- `start`는 성공하지만 `tabs`가 실패하면, 제어 평면이 여전히 비정상입니다. 이를 페이지 탐색 문제가 아니라 CDP 도달 가능성 문제로 취급하세요.
- `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면, 브라우저 제어 평면은 정상이고 실패는 탐색 정책 또는 대상 페이지에 있습니다.
- `start`, `tabs`, `open`이 모두 성공하면 기본 관리형 브라우저 제어 경로는 정상입니다.

중요한 동작 세부 정보:

- `browser.ssrfPolicy`를 구성하지 않더라도 브라우저 config는 기본적으로 fail-closed SSRF 정책 객체를 사용합니다.
- 로컬 loopback `openclaw` 관리형 프로필의 경우, CDP 상태 점검은 OpenClaw 자체 로컬 제어 평면에 대해서는 의도적으로 브라우저 SSRF 도달 가능성 강제를 건너뜁니다.
- 탐색 보호는 별개입니다. `start` 또는 `tabs`가 성공했다고 해서 이후 `open` 또는 `navigate` 대상이 허용된다는 뜻은 아닙니다.

보안 지침:

- 기본적으로 브라우저 SSRF 정책을 완화하지 마세요.
- 광범위한 private-network 액세스보다 `hostnameAllowlist` 또는 `allowedHostnames` 같은 좁은 호스트 예외를 선호하세요.
- `dangerouslyAllowPrivateNetwork: true`는 사설 네트워크 브라우저 액세스가 필요하고 검토된, 의도적으로 신뢰된 환경에서만 사용하세요.

## 에이전트 도구 + 제어 방식

에이전트는 브라우저 자동화용 **하나의 도구**를 받습니다.

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 스냅샷의 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지 또는 요소).
- `browser`는 다음을 받습니다:
  - 이름 있는 브라우저 프로필(openclaw, chrome, 또는 원격 CDP)을 선택하는 `profile`
  - 브라우저가 어디에 있는지 선택하는 `target` (`sandbox` | `host` | `node`)
  - sandboxed 세션에서 `target: "host"`는 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`이 생략되면: sandboxed 세션은 기본값 `sandbox`, 비-sandbox 세션은 기본값 `host`
  - 브라우저 capability가 있는 Node가 연결되어 있으면 `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 자동으로 그쪽으로 라우팅될 수 있습니다.

이렇게 하면 에이전트가 결정론적으로 유지되고 취약한 selector를 피할 수 있습니다.

## 관련

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경의 브라우저 제어
- [보안](/ko/gateway/security) — 브라우저 제어 위험 및 강화
