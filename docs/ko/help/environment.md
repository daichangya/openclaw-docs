---
read_when:
    - 어떤 환경 변수가 로드되는지, 그리고 어떤 순서로 로드되는지 알아야 합니다
    - Gateway에서 누락된 API 키를 디버깅하고 있습니다
    - provider 인증 또는 배포 환경을 문서화하고 있습니다
summary: OpenClaw가 환경 변수를 로드하는 위치와 우선순위 순서
title: 환경 변수
x-i18n:
    generated_at: "2026-04-24T06:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw는 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 덮어쓰지 않는 것**입니다.

## 우선순위(높음 → 낮음)

1. **프로세스 환경** (부모 셸/데몬에서 Gateway 프로세스가 이미 가진 값)
2. **현재 작업 디렉터리의 `.env`** (dotenv 기본값; 덮어쓰지 않음)
3. `~/.openclaw/.env`의 **전역 `.env`** (즉 `$OPENCLAW_STATE_DIR/.env`; 덮어쓰지 않음)
4. `~/.openclaw/openclaw.json`의 **구성 `env` 블록** (없을 때만 적용)
5. **선택적 로그인 셸 가져오기** (`env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`), 예상 키가 없을 때만 적용

Ubuntu 신규 설치에서 기본 상태 디렉터리를 사용하는 경우, OpenClaw는 전역 `.env` 다음에 `~/.config/openclaw/gateway.env`도 호환성 폴백으로 취급합니다. 두 파일이 모두 존재하고 값이 다르면, OpenClaw는 `~/.openclaw/.env`를 유지하고 경고를 출력합니다.

구성 파일이 아예 없으면 4단계는 건너뜁니다. 셸 가져오기는 활성화된 경우 여전히 실행됩니다.

## 구성 `env` 블록

인라인 환경 변수를 설정하는 두 가지 동등한 방식이 있습니다(둘 다 덮어쓰지 않음):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## 셸 환경 가져오기

`env.shellEnv`는 로그인 셸을 실행하고 **누락된** 예상 키만 가져옵니다:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

동등한 환경 변수:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 런타임에 주입되는 환경 변수

OpenClaw는 생성된 자식 프로세스에도 컨텍스트 마커를 주입합니다:

- `OPENCLAW_SHELL=exec`: `exec` 도구를 통해 실행된 명령에 설정됨
- `OPENCLAW_SHELL=acp`: ACP 런타임 백엔드 프로세스 생성 시 설정됨(예: `acpx`)
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`가 ACP 브리지 프로세스를 생성할 때 설정됨
- `OPENCLAW_SHELL=tui-local`: 로컬 TUI `!` 셸 명령에 설정됨

이들은 런타임 마커이며(사용자 구성이 필수 아님), 컨텍스트별 규칙을 적용하기 위한 셸/프로필 로직에서 사용할 수 있습니다.

## UI 환경 변수

- `OPENCLAW_THEME=light`: 터미널 배경이 밝을 때 밝은 TUI 팔레트를 강제
- `OPENCLAW_THEME=dark`: 어두운 TUI 팔레트를 강제
- `COLORFGBG`: 터미널이 이를 내보내면 OpenClaw는 배경색 힌트를 사용해 TUI 팔레트를 자동 선택합니다

## 구성에서의 환경 변수 치환

`${VAR_NAME}` 구문을 사용해 구성 문자열 값에서 환경 변수를 직접 참조할 수 있습니다:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

전체 내용은 [구성: 환경 변수 치환](/ko/gateway/configuration-reference#env-var-substitution)을 참조하세요.

## Secret refs와 `${ENV}` 문자열

OpenClaw는 환경 변수 기반 패턴 두 가지를 지원합니다:

- 구성 값의 `${VAR}` 문자열 치환
- 비밀 참조를 지원하는 필드용 SecretRef 객체 (`{ source: "env", provider: "default", id: "VAR" }`)

둘 다 활성화 시점에 프로세스 환경에서 확인됩니다. SecretRef 자세한 내용은 [Secrets 관리](/ko/gateway/secrets)에 문서화되어 있습니다.

## 경로 관련 환경 변수

| 변수                   | 용도                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 모든 내부 경로 확인에 사용되는 홈 디렉터리를 재정의합니다(`~/.openclaw/`, 에이전트 디렉터리, 세션, 자격 증명). 전용 서비스 사용자로 OpenClaw를 실행할 때 유용합니다.       |
| `OPENCLAW_STATE_DIR`   | 상태 디렉터리 재정의(기본값 `~/.openclaw`)                                                                                                                                    |
| `OPENCLAW_CONFIG_PATH` | 구성 파일 경로 재정의(기본값 `~/.openclaw/openclaw.json`)                                                                                                                    |

## 로깅

| 변수                 | 용도                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 파일과 콘솔 모두의 로그 레벨 재정의(예: `debug`, `trace`). 구성의 `logging.level`과 `logging.consoleLevel`보다 우선합니다. 잘못된 값은 경고와 함께 무시됩니다.                         |

### `OPENCLAW_HOME`

설정되면 `OPENCLAW_HOME`이 모든 내부 경로 확인에서 시스템 홈 디렉터리(`$HOME` / `os.homedir()`)를 대체합니다. 이를 통해 헤드리스 서비스 계정에 대해 전체 파일 시스템 격리가 가능합니다.

**우선순위:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**예시** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`은 물결표 경로(예: `~/svc`)로도 설정할 수 있으며, 사용 전에 `$HOME`을 기준으로 확장됩니다.

## nvm 사용자: `web_fetch` TLS 실패

Node.js를 시스템 패키지 관리자가 아니라 **nvm**으로 설치한 경우, 내장 `fetch()`는
nvm에 번들된 CA 저장소를 사용하며, 여기에 최신 루트 CA(ISRG Root X1/X2 for Let's Encrypt,
DigiCert Global Root G2 등)가 없을 수 있습니다. 이로 인해 `web_fetch`가 대부분의 HTTPS 사이트에서 `"fetch failed"`로 실패합니다.

Linux에서 OpenClaw는 실제 시작 환경에서 nvm을 자동 감지하고 수정 사항을 적용합니다:

- `openclaw gateway install`은 systemd 서비스 환경에 `NODE_EXTRA_CA_CERTS`를 기록합니다
- `openclaw` CLI 진입점은 Node 시작 전에 `NODE_EXTRA_CA_CERTS`를 설정한 상태로 자체 재실행합니다

**수동 수정(이전 버전 또는 직접 `node ...` 실행용):**

OpenClaw를 시작하기 전에 변수를 내보내세요:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

이 변수는 `~/.openclaw/.env`에만 기록하는 방식에 의존하지 마세요. Node는
프로세스 시작 시 `NODE_EXTRA_CA_CERTS`를 읽습니다.

## 관련

- [Gateway 구성](/ko/gateway/configuration)
- [FAQ: env vars와 .env 로딩](/ko/help/faq#env-vars-and-env-loading)
- [모델 개요](/ko/concepts/models)
