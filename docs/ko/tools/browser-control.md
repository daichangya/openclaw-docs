---
read_when:
    - 로컬 제어 API를 통해 에이전트 브라우저를 스크립팅하거나 디버깅하기
    - '`openclaw browser` CLI 참조를 찾고 있습니다'
    - 스냅샷과 ref를 사용한 사용자 지정 브라우저 자동화 추가하기
summary: OpenClaw 브라우저 제어 API, CLI 참조 및 스크립팅 작업
title: 브라우저 제어 API
x-i18n:
    generated_at: "2026-04-24T06:38:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

설정, 구성, 문제 해결은 [Browser](/ko/tools/browser)를 참조하세요.
이 페이지는 로컬 제어 HTTP API, `openclaw browser`
CLI, 스크립팅 패턴(스냅샷, ref, 대기, 디버그 흐름)에 대한 참조입니다.

## 제어 API(선택 사항)

로컬 통합 전용으로 Gateway는 작은 loopback HTTP API를 노출합니다.

- 상태/시작/중지: `GET /`, `POST /start`, `POST /stop`
- 탭: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- 스냅샷/스크린샷: `GET /snapshot`, `POST /screenshot`
- 작업: `POST /navigate`, `POST /act`
- 훅: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- 다운로드: `POST /download`, `POST /wait/download`
- 디버깅: `GET /console`, `POST /pdf`
- 디버깅: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- 네트워크: `POST /response/body`
- 상태: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 상태: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 설정: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

모든 엔드포인트는 `?profile=<name>`을 허용합니다.

공유 비밀 gateway 인증이 구성되어 있으면 browser HTTP 라우트에도 인증이 필요합니다.

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 비밀번호를 사용하는 HTTP Basic auth

참고:

- 이 독립형 loopback browser API는 trusted-proxy 또는
  Tailscale Serve identity header를 사용하지 않습니다.
- `gateway.auth.mode`가 `none` 또는 `trusted-proxy`인 경우에도 이 loopback browser
  라우트는 그러한 identity-bearing 모드를 상속하지 않습니다. loopback-only로 유지하세요.

### `/act` 오류 계약

`POST /act`는 라우트 수준 검증 및
정책 실패에 대해 구조화된 오류 응답을 사용합니다.

```json
{ "error": "<message>", "code": "ACT_*" }
```

현재 `code` 값:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind`가 없거나 인식되지 않음
- `ACT_INVALID_REQUEST` (HTTP 400): 작업 페이로드가 정규화 또는 검증에 실패함
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): 지원되지 않는 작업 kind에 `selector`가 사용됨
- `ACT_EVALUATE_DISABLED` (HTTP 403): config에 의해 `evaluate`(또는 `wait --fn`)가 비활성화됨
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): 최상위 또는 배치 `targetId`가 요청 대상과 충돌함
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 기존 세션 프로필에서는 지원되지 않는 작업임

다른 런타임 실패는 여전히 `code` 필드 없이
`{ "error": "<message>" }`를 반환할 수 있습니다.

### Playwright 요구 사항

일부 기능(navigate/act/AI snapshot/role snapshot, 요소 스크린샷,
PDF)은 Playwright가 필요합니다. Playwright가 설치되지 않으면 해당 엔드포인트는
명확한 501 오류를 반환합니다.

Playwright 없이도 동작하는 항목:

- ARIA 스냅샷
- 탭별 CDP
  WebSocket을 사용할 수 있을 때 관리형 `openclaw` browser의 페이지 스크린샷
- `existing-session` / Chrome MCP 프로필의 페이지 스크린샷
- 스냅샷 출력의 `existing-session` ref 기반 스크린샷(`--ref`)

여전히 Playwright가 필요한 항목:

- `navigate`
- `act`
- AI 스냅샷 / role 스냅샷
- CSS selector 요소 스크린샷(`--element`)
- 전체 browser PDF 내보내기

요소 스크린샷은 `--full-page`도 거부합니다. 이 라우트는
요소 스크린샷에 `fullPage is not supported for element screenshots`를 반환합니다.

`Playwright is not available in this gateway build`가 보이면,
`playwright-core`가 설치되도록 번들 browser Plugin 런타임 의존성을 복구한 뒤
gateway를 재시작하세요. 패키지 설치에서는 `openclaw doctor --fix`를 실행하세요.
Docker의 경우 아래와 같이 Chromium browser 바이너리도 설치하세요.

#### Docker Playwright 설치

Gateway가 Docker에서 실행된다면 `npx playwright`는 피하세요(npm override 충돌).
대신 번들 CLI를 사용하세요.

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser 다운로드를 유지하려면 `PLAYWRIGHT_BROWSERS_PATH`를 설정하고(예:
`/home/node/.cache/ms-playwright`), `/home/node`가
`OPENCLAW_HOME_VOLUME` 또는 bind mount를 통해 유지되도록 하세요. [Docker](/ko/install/docker)를 참조하세요.

## 작동 방식(내부)

작은 loopback 제어 서버가 HTTP 요청을 수락하고 CDP를 통해 Chromium 기반 브라우저에 연결합니다. 고급 작업(click/type/snapshot/PDF)은 CDP 위의 Playwright를 통해 수행되며, Playwright가 없으면 Playwright 비의존 작업만 사용할 수 있습니다. 에이전트는 하나의 안정적인 인터페이스를 보게 되고, 그 아래에서는 로컬/원격 browser와 profile이 자유롭게 교체될 수 있습니다.

## CLI 빠른 참조

모든 명령은 특정 profile을 대상으로 하는 `--browser-profile <name>`과 기계가 읽을 수 있는 출력을 위한 `--json`을 허용합니다.

<AccordionGroup>

<Accordion title="기본: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # attach-only/원격 CDP의 에뮬레이션도 지움
openclaw browser tabs
openclaw browser tab             # 현재 탭의 단축 명령
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="검사: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 또는 역할 ref인 --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="작업: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 또는 역할 ref인 e12
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="상태: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # 제거하려면 --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

참고:

- `upload`와 `dialog`는 **사전 준비** 호출입니다. file chooser/dialog를 트리거하는 click/press 전에 실행하세요.
- `click`/`type` 등은 `snapshot`의 `ref`가 필요합니다(숫자 `12` 또는 역할 ref `e12`). 작업에 CSS selector는 의도적으로 지원하지 않습니다.
- download, trace, upload 경로는 OpenClaw 임시 루트로 제한됩니다: `/tmp/openclaw{,/downloads,/uploads}` (폴백: `${os.tmpdir()}/openclaw/...`)
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.

스냅샷 플래그 한눈에 보기:

- `--format ai` (Playwright가 있으면 기본값): 숫자 ref(`aria-ref="<n>"`)를 포함한 AI 스냅샷
- `--format aria`: 접근성 트리, ref 없음. 검사 전용
- `--efficient`(또는 `--mode efficient`): 간결한 역할 스냅샷 프리셋. 이를 기본값으로 하려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하세요([Gateway configuration](/ko/gateway/configuration-reference#browser) 참조).
- `--interactive`, `--compact`, `--depth`, `--selector`는 역할 스냅샷과 `ref=e12` ref를 강제합니다. `--frame "<iframe>"`은 역할 스냅샷 범위를 iframe으로 제한합니다.
- `--labels`는 ref 레이블이 오버레이된 viewport 전용 스크린샷을 추가합니다(`MEDIA:<path>` 출력).

## 스냅샷과 ref

OpenClaw는 두 가지 “스냅샷” 스타일을 지원합니다.

- **AI 스냅샷(숫자 ref)**: `openclaw browser snapshot` (기본값; `--format ai`)
  - 출력: 숫자 ref가 포함된 텍스트 스냅샷
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - 내부적으로 ref는 Playwright의 `aria-ref`를 통해 해석됩니다.

- **역할 스냅샷(`e12` 같은 역할 ref)**: `openclaw browser snapshot --interactive` (`--compact`, `--depth`, `--selector`, `--frame`도 가능)
  - 출력: `[ref=e12]`(선택적으로 `[nth=1]`)를 가진 역할 기반 목록/트리
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`
  - 내부적으로 ref는 `getByRole(...)`로 해석됩니다(중복은 `nth()` 추가).
  - `--labels`를 추가하면 `e12` 레이블이 오버레이된 viewport 스크린샷이 포함됩니다.

ref 동작:

- ref는 **탐색 간에 안정적이지 않습니다**. 무언가 실패하면 `snapshot`을 다시 실행하고 새 ref를 사용하세요.
- 역할 스냅샷을 `--frame`으로 찍었다면, 다음 역할 스냅샷까지 역할 ref는 해당 iframe 범위로 제한됩니다.

## 대기 기능 강화

시간/텍스트만이 아니라 더 많은 조건을 기다릴 수 있습니다.

- URL 대기(Playwright가 지원하는 glob 사용 가능):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
- JS predicate 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- selector가 보이게 될 때까지 대기:
  - `openclaw browser wait "#main"`

이들은 함께 조합할 수 있습니다.

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 디버그 워크플로

작업이 실패할 때(예: “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` 사용(대화형 모드에서는 역할 ref 권장)
3. 여전히 실패하면: `openclaw browser highlight <ref>`로 Playwright가 무엇을 대상으로 하는지 확인
4. 페이지 동작이 이상하면:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 심층 디버깅을 위해 trace 기록:
   - `openclaw browser trace start`
   - 문제 재현
   - `openclaw browser trace stop` (`TRACE:<path>` 출력)

## JSON 출력

`--json`은 스크립팅과 구조화된 도구를 위한 것입니다.

예시:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON의 역할 스냅샷에는 `refs`와 작은 `stats` 블록(lines/chars/refs/interactive)이 포함되어 있으므로 도구가 페이로드 크기와 밀도를 판단할 수 있습니다.

## 상태 및 환경 설정 항목

이 항목들은 “사이트가 X처럼 동작하게 만들기” 워크플로에 유용합니다.

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (레거시 `set headers --json '{"X-Debug":"1"}'`도 계속 지원됨)
- HTTP basic auth: `set credentials user pass` (또는 `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (또는 `--clear`)
- Media: `set media dark|light|no-preference|none`
- 시간대 / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright 디바이스 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인 정보 보호

- openclaw browser profile에는 로그인된 세션이 포함될 수 있으므로 민감한 정보로 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 및 `wait --fn`은
  페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 인젝션이
  이를 유도할 수 있습니다. 필요하지 않다면 `browser.evaluateEnabled=false`로 비활성화하세요.
- 로그인 및 anti-bot 참고 사항(X/Twitter 등)은 [Browser login + X/Twitter posting](/ko/tools/browser-login)을 참조하세요.
- Gateway/node host는 비공개(loopback 또는 tailnet-only)로 유지하세요.
- 원격 CDP 엔드포인트는 강력하므로 터널링하고 보호하세요.

엄격 모드 예시(기본적으로 private/internal 대상 차단):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 선택적 정확한 허용
    },
  },
}
```

## 관련 항목

- [Browser](/ko/tools/browser) — 개요, 구성, profile, 보안
- [Browser login](/ko/tools/browser-login) — 사이트 로그인
- [Browser Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
- [Browser WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
