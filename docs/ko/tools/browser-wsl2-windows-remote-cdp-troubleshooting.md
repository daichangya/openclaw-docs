---
read_when:
    - Chrome는 Windows에 있고 OpenClaw Gateway는 WSL2에서 실행하는 경우
    - WSL2와 Windows 전반에서 겹치는 브라우저/Control UI 오류를 보는 경우
    - 분리된 호스트 환경에서 호스트 로컬 Chrome MCP와 원시 원격 CDP 중 선택하기
summary: WSL2 Gateway + Windows Chrome 원격 CDP를 계층별로 문제 해결하기
title: WSL2 + Windows + 원격 Chrome CDP 문제 해결하기
x-i18n:
    generated_at: "2026-04-24T06:38:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

이 가이드는 다음과 같은 일반적인 분리 호스트 설정을 다룹니다.

- OpenClaw Gateway는 WSL2 내부에서 실행
- Chrome는 Windows에서 실행
- 브라우저 제어는 WSL2/Windows 경계를 넘어가야 함

또한 [issue #39369](https://github.com/openclaw/openclaw/issues/39369)의 계층형 실패 패턴도 다룹니다. 여러 독립적인 문제가 동시에 나타날 수 있어서, 실제로는 다른 계층이 문제인데도 잘못된 계층이 먼저 고장난 것처럼 보일 수 있습니다.

## 먼저 올바른 브라우저 모드를 선택하세요

유효한 패턴은 두 가지입니다.

### 옵션 1: WSL2에서 Windows로 원시 원격 CDP

WSL2에서 Windows Chrome CDP 엔드포인트를 가리키는 원격 브라우저 프로필을 사용하세요.

다음 경우에 선택합니다.

- Gateway는 WSL2 안에 유지됨
- Chrome는 Windows에서 실행됨
- 브라우저 제어가 WSL2/Windows 경계를 넘어가야 함

### 옵션 2: 호스트 로컬 Chrome MCP

Gateway 자체가 Chrome와 같은 호스트에서 실행될 때만 `existing-session` / `user`를 사용하세요.

다음 경우에 선택합니다.

- OpenClaw와 Chrome가 같은 머신에 있음
- 로컬 로그인된 브라우저 상태를 사용하고 싶음
- 교차 호스트 브라우저 전송이 필요 없음
- `responsebody`, PDF
  내보내기, 다운로드 가로채기, 일괄 작업 같은 고급 managed/raw-CDP 전용 경로가 필요 없음

WSL2 Gateway + Windows Chrome 조합에서는 원시 원격 CDP를 선호하세요. Chrome MCP는 호스트 로컬 방식이지, WSL2에서 Windows로 가는 브리지가 아닙니다.

## 동작하는 아키텍처

기준 형태:

- WSL2에서 Gateway를 `127.0.0.1:18789`로 실행
- Windows는 일반 브라우저에서 `http://127.0.0.1:18789/`로 Control UI를 엶
- Windows Chrome는 포트 `9222`에 CDP 엔드포인트를 노출
- WSL2가 해당 Windows CDP 엔드포인트에 도달 가능
- OpenClaw는 WSL2에서 도달 가능한 주소를 브라우저 프로필에 지정

## 왜 이 설정이 헷갈리는가

여러 실패가 겹칠 수 있습니다.

- WSL2가 Windows CDP 엔드포인트에 도달하지 못함
- Control UI가 비보안 origin에서 열림
- `gateway.controlUi.allowedOrigins`가 페이지 origin과 일치하지 않음
- token 또는 pairing이 없음
- 브라우저 프로필이 잘못된 주소를 가리킴

이 때문에 한 계층을 고쳐도 다른 오류가 여전히 보일 수 있습니다.

## Control UI의 핵심 규칙

UI를 Windows에서 열 때는 의도적인 HTTPS 설정이 없다면 Windows localhost를 사용하세요.

사용:

`http://127.0.0.1:18789/`

Control UI에는 기본적으로 LAN IP를 사용하지 마세요. LAN 또는 tailnet 주소에서의 일반 HTTP는 CDP 자체와 무관한 insecure-origin/device-auth 동작을 유발할 수 있습니다. [Control UI](/ko/web/control-ui)를 참조하세요.

## 계층별 검증

위에서 아래로 작업하세요. 앞단계를 건너뛰지 마세요.

### 계층 1: Windows에서 Chrome가 CDP를 제공하는지 확인

원격 디버깅이 활성화된 상태로 Windows에서 Chrome를 시작하세요.

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows에서 먼저 Chrome 자체를 확인하세요.

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

이 단계가 Windows에서 실패하면, 아직 OpenClaw 문제가 아닙니다.

### 계층 2: WSL2가 그 Windows 엔드포인트에 도달할 수 있는지 확인

WSL2에서 `cdpUrl`에 사용할 정확한 주소를 테스트하세요.

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

정상 결과:

- `/json/version`이 Browser / Protocol-Version 메타데이터가 포함된 JSON을 반환
- `/json/list`가 JSON을 반환(열린 페이지가 없으면 빈 배열이어도 괜찮음)

이 단계가 실패하면:

- Windows가 아직 WSL2에 포트를 노출하지 않음
- WSL2 쪽에서 사용할 주소가 잘못됨
- firewall / 포트 포워딩 / 로컬 프록시 설정이 아직 부족함

OpenClaw 설정을 건드리기 전에 이를 먼저 해결하세요.

### 계층 3: 올바른 브라우저 프로필 구성

원시 원격 CDP의 경우 OpenClaw가 WSL2에서 도달 가능한 주소를 가리키도록 하세요.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- Windows에서만 동작하는 주소가 아니라 WSL2에서 도달 가능한 주소를 사용하세요
- 외부에서 관리되는 브라우저에는 `attachOnly: true`를 유지하세요
- `cdpUrl`은 `http://`, `https://`, `ws://`, 또는 `wss://`일 수 있습니다
- OpenClaw가 `/json/version`을 찾게 하려면 HTTP(S)를 사용하세요
- 브라우저 provider가 직접 DevTools 소켓 URL을 제공하는 경우에만 WS(S)를 사용하세요
- OpenClaw가 성공하길 기대하기 전에 같은 URL을 `curl`로 테스트하세요

### 계층 4: Control UI 계층을 별도로 검증

Windows에서 UI를 여세요.

`http://127.0.0.1:18789/`

그다음 다음을 확인하세요.

- 페이지 origin이 `gateway.controlUi.allowedOrigins`가 기대하는 값과 일치하는지
- token 인증 또는 pairing이 올바르게 구성되었는지
- 브라우저 문제를 Control UI 인증 문제로 착각하고 있지 않은지

도움이 되는 페이지:

- [Control UI](/ko/web/control-ui)

### 계층 5: 브라우저 제어 엔드투엔드 검증

WSL2에서:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

정상 결과:

- 탭이 Windows Chrome에서 열림
- `openclaw browser tabs`가 대상을 반환
- 이후 작업(`snapshot`, `screenshot`, `navigate`)이 같은 프로필에서 동작

## 흔한 오해를 부르는 오류들

각 메시지는 계층별 단서로 취급하세요.

- `control-ui-insecure-auth`
  - UI origin / secure-context 문제이며, CDP 전송 문제는 아님
- `token_missing`
  - 인증 설정 문제
- `pairing required`
  - 기기 승인 문제
- `Remote CDP for profile "remote" is not reachable`
  - WSL2가 구성된 `cdpUrl`에 도달할 수 없음
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 엔드포인트는 응답했지만 DevTools WebSocket은 여전히 열 수 없음
- 원격 세션 이후 남는 오래된 viewport / dark-mode / locale / offline 재정의
  - `openclaw browser stop --browser-profile remote` 실행
  - 그러면 gateway나 외부 브라우저를 재시작하지 않고도 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제함
- `gateway timeout after 1500ms`
  - 대개 여전히 CDP 도달 가능성 문제 또는 느리거나 도달 불가능한 원격 엔드포인트
- `No Chrome tabs found for profile="user"`
  - 호스트 로컬 탭이 없는 상황에서 local Chrome MCP 프로필을 선택한 경우

## 빠른 분류 체크리스트

1. Windows: `curl http://127.0.0.1:9222/json/version`이 동작하나요?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version`이 동작하나요?
3. OpenClaw 설정: `browser.profiles.<name>.cdpUrl`이 정확히 그 WSL2 도달 가능 주소를 사용하나요?
4. Control UI: LAN IP 대신 `http://127.0.0.1:18789/`를 열고 있나요?
5. 원시 원격 CDP 대신 WSL2와 Windows 사이에서 `existing-session`을 사용하려고 하고 있나요?

## 실용적인 결론

이 설정은 보통 충분히 실현 가능합니다. 어려운 부분은 브라우저 전송, Control UI origin 보안, token/pairing이 각각 독립적으로 실패할 수 있으면서 사용자 입장에서는 비슷하게 보인다는 점입니다.

확신이 없을 때는:

- 먼저 Windows Chrome 엔드포인트를 로컬에서 검증하고
- 두 번째로 같은 엔드포인트를 WSL2에서 검증하고
- 그 다음에야 OpenClaw 설정이나 Control UI 인증을 디버깅하세요

## 관련 항목

- [Browser](/ko/tools/browser)
- [Browser login](/ko/tools/browser-login)
- [Browser Linux troubleshooting](/ko/tools/browser-linux-troubleshooting)
