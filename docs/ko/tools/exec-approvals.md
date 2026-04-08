---
read_when:
    - exec 승인 또는 allowlist를 구성하는 경우
    - macOS 앱에서 exec 승인 UX를 구현하는 경우
    - sandbox 탈출 프롬프트와 그 영향을 검토하는 경우
summary: Exec 승인, allowlist, 그리고 sandbox 탈출 프롬프트
title: Exec 승인
x-i18n:
    generated_at: "2026-04-08T02:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6041929185bab051ad873cc4822288cb7d6f0470e19e7ae7a16b70f76dfc2cd9
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec 승인

Exec 승인은 sandbox된 agent가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행할 수 있도록 하는 **컴패니언 앱 / node 호스트 가드레일**입니다. 안전 인터록과 비슷하다고 생각하면 됩니다.
정책 + allowlist + (선택적) 사용자 승인이 모두 동의할 때만 명령이 허용됩니다.
Exec 승인은 도구 정책 및 elevated 게이팅에 **추가로** 적용됩니다(`elevated`가 `full`로 설정되어 승인을 건너뛰는 경우 제외).
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한 쪽**입니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다.
호스트 exec는 해당 머신의 로컬 승인 상태도 사용합니다. 머신 로컬
`~/.openclaw/exec-approvals.json`의 `ask: "always"`는
세션 또는 config 기본값이 `ask: "on-miss"`를 요청하더라도 계속 프롬프트를 표시합니다.
`openclaw approvals get`, `openclaw approvals get --gateway`, 또는
`openclaw approvals get --node <id|name|ip>`를 사용해 요청된 정책,
호스트 정책 소스, 그리고 유효 결과를 확인하세요.

컴패니언 앱 UI를 **사용할 수 없으면**, 프롬프트가 필요한 모든 요청은
**ask fallback**(기본값: deny)으로 처리됩니다.

네이티브 채팅 승인 클라이언트는 대기 중인 승인 메시지에 채널별 affordance도 노출할 수 있습니다.
예를 들어 Matrix는 승인 프롬프트에 반응 단축키를 미리 배치할 수 있습니다
(`✅` 한 번 허용, `❌` 거부, 가능한 경우 `♾️` 항상 허용).
그러면서도 대체 수단으로 메시지 안의 `/approve ...` 명령은 그대로 남겨 둡니다.

## 적용 위치

Exec 승인은 실행 호스트에서 로컬로 강제됩니다:

- **gateway host** → gateway 머신의 `openclaw` 프로세스
- **node host** → node runner(macOS 컴패니언 앱 또는 헤드리스 node host)

신뢰 모델 참고:

- Gateway 인증을 통과한 호출자는 해당 Gateway의 신뢰된 운영자입니다.
- 페어링된 node는 이 신뢰된 운영자 권한을 node host까지 확장합니다.
- Exec 승인은 우발적 실행 위험을 줄여 주지만, 사용자별 auth 경계는 아닙니다.
- 승인된 node-host 실행은 canonical 실행 컨텍스트를 바인딩합니다: canonical cwd, 정확한 argv, env
  바인딩(있는 경우), 그리고 해당될 때 고정된 실행 파일 경로.
- 셸 스크립트와 직접 interpreter/runtime 파일 호출의 경우 OpenClaw는
  하나의 구체적인 로컬 파일 피연산자도 바인딩하려고 시도합니다. 승인 후 실행 전에
  이 바인딩된 파일이 변경되면, 변경된 내용을 실행하는 대신 실행이 거부됩니다.
- 이 파일 바인딩은 의도적으로 best-effort이며, 모든
  interpreter/runtime loader 경로에 대한 완전한 의미 모델은 아닙니다. 승인 모드가
  바인딩할 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면, 완전한 커버리지를
  가장하는 대신 승인 기반 실행을 발급하는 것을 거부합니다.

macOS 분리 구조:

- **node host 서비스**는 로컬 IPC를 통해 `system.run`을 **macOS 앱**으로 전달합니다.
- **macOS 앱**이 승인을 집행하고 UI 컨텍스트에서 명령을 실행합니다.

## 설정 및 저장 위치

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다:

`~/.openclaw/exec-approvals.json`

예시 스키마:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 승인 없는 "YOLO" 모드

승인 프롬프트 없이 호스트 exec를 실행하려면 **두 정책 계층을 모두** 열어야 합니다:

- OpenClaw config의 요청된 exec 정책(`tools.exec.*`)
- 호스트 로컬 승인 정책(`~/.openclaw/exec-approvals.json`)

이제 명시적으로 더 엄격하게 조이지 않는 한 이것이 기본 호스트 동작입니다:

- `tools.exec.security`: `gateway`/`node`에서 `full`
- `tools.exec.ask`: `off`
- 호스트 `askFallback`: `full`

중요한 차이점:

- `tools.exec.host=auto`는 exec가 어디서 실행될지 선택합니다: 가능하면 sandbox, 아니면 gateway.
- YOLO는 호스트 exec 승인 방식을 선택합니다: `security=full`과 `ask=off`.
- YOLO 모드에서는 OpenClaw가 구성된 호스트 exec 정책 위에 별도의 휴리스틱 명령 난독화 승인 게이트를 추가하지 않습니다.
- `auto`는 sandbox된 세션에서 gateway 라우팅을 자유 override로 만들지 않습니다. 호출별 `host=node` 요청은 `auto`에서 허용되며, `host=gateway`는 sandbox 런타임이 활성 상태가 아닐 때만 `auto`에서 허용됩니다. 안정적인 비-auto 기본값이 필요하면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하세요.

좀 더 보수적인 구성을 원한다면 두 계층 중 하나를 다시 `allowlist` / `on-miss`
또는 `deny`로 조이세요.

gateway host에서 지속적으로 "절대 프롬프트 표시 안 함"으로 설정하려면:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

그런 다음 호스트 승인 파일도 이에 맞게 설정합니다:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

node host의 경우 대신 해당 node에서 같은 승인 파일을 적용하세요:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

세션 전용 단축 경로:

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 해당 세션에서 exec 승인도 건너뛰는 비상용 단축 경로입니다.

호스트 승인 파일이 config보다 더 엄격하면, 더 엄격한 호스트 정책이 여전히 우선합니다.

## 정책 노브

### 보안 (`exec.security`)

- **deny**: 모든 호스트 exec 요청 차단.
- **allowlist**: allowlist에 있는 명령만 허용.
- **full**: 모두 허용(elevated와 동일).

### Ask (`exec.ask`)

- **off**: 프롬프트를 표시하지 않음.
- **on-miss**: allowlist가 일치하지 않을 때만 프롬프트 표시.
- **always**: 모든 명령에 프롬프트 표시.
- `allow-always`의 지속 신뢰는 유효 ask 모드가 `always`일 때 프롬프트를 억제하지 않습니다.

### Ask fallback (`askFallback`)

프롬프트가 필요하지만 연결 가능한 UI가 없으면 fallback이 결정합니다:

- **deny**: 차단.
- **allowlist**: allowlist가 일치하는 경우에만 허용.
- **full**: 허용.

### 인라인 interpreter eval 강화 (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true`이면 OpenClaw는
interpreter 바이너리 자체가 allowlist에 있더라도 인라인 코드 eval 형식을 승인 전용으로 취급합니다.

예시:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

이것은 하나의 안정된 파일 피연산자로 깔끔하게 매핑되지 않는 interpreter loader에 대한 심층 방어입니다.
strict 모드에서는:

- 이러한 명령은 여전히 명시적 승인이 필요합니다.
- `allow-always`는 이에 대해 새 allowlist 항목을 자동으로 지속 저장하지 않습니다.

## Allowlist (agent별)

Allowlist는 **agent별**입니다. 여러 agent가 있는 경우 어떤 agent를
편집할지 macOS 앱에서 전환하세요. 패턴은 **대소문자 구분 없는 glob 일치**입니다.
패턴은 **바이너리 경로**로 해석되어야 합니다(베이스네임만 있는 항목은 무시됨).
레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다.
`echo ok && pwd` 같은 셸 체인도 각 최상위 세그먼트가 allowlist 규칙을 만족해야 합니다.

예시:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

각 allowlist 항목은 다음을 추적합니다:

- **id** UI 식별용 안정 UUID(선택 사항)
- **last used** 타임스탬프
- **last used command**
- **last resolved path**

## Skill CLI 자동 허용

**Skill CLI 자동 허용**이 활성화되면, 알려진 Skills가 참조하는 실행 파일은
node(macOS node 또는 헤드리스 node host)에서 allowlist에 있는 것으로 취급됩니다. 이는
Gateway RPC를 통한 `skills.bins`를 사용해 skill bin 목록을 가져옵니다. 엄격한 수동 allowlist를 원한다면 비활성화하세요.

중요한 신뢰 참고:

- 이것은 수동 경로 allowlist 항목과 별개의 **암시적 편의 allowlist**입니다.
- Gateway와 node가 동일한 신뢰 경계 안에 있는 신뢰된 운영자 환경을 위한 기능입니다.
- 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 allowlist 항목만 사용하세요.

## Safe bins (stdin 전용)

`tools.exec.safeBins`는 명시적 allowlist 항목 없이도 allowlist 모드에서 실행할 수 있는
작은 **stdin 전용** 바이너리 목록(예: `cut`)을 정의합니다. Safe bins는
위치 기반 파일 인자와 경로 유사 토큰을 거부하므로 들어오는 스트림에 대해서만 동작할 수 있습니다.
이것은 일반적인 신뢰 목록이 아니라 스트림 필터를 위한 좁은 빠른 경로로 취급하세요.
interpreter 또는 runtime 바이너리(예: `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`)는 `safeBins`에 **추가하지 마세요**.
명령이 설계상 코드를 eval하거나, 하위 명령을 실행하거나, 파일을 읽을 수 있다면,
명시적 allowlist 항목을 사용하고 승인 프롬프트를 계속 활성화하는 편이 좋습니다.
사용자 지정 safe bin은 `tools.exec.safeBinProfiles.<bin>`에 명시적 프로필을 정의해야 합니다.
검증은 argv 형태만으로 결정적으로 수행되며(호스트 파일 시스템 존재 여부 검사는 없음),
이로써 허용/거부 차이로 파일 존재 여부 오라클이 생기는 것을 방지합니다.
기본 safe bin에서는 파일 지향 옵션이 거부됩니다(예: `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins는 stdin 전용
동작을 깨는 옵션에 대해서도 바이너리별 명시적 플래그 정책을 강제합니다(예: `sort -o/--output/--compress-program` 및 grep 재귀 플래그).
긴 옵션은 safe-bin 모드에서 fail-closed 방식으로 검증됩니다: 알 수 없는 플래그와
모호한 축약형은 거부됩니다.
safe-bin 프로필별 거부 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins는 또한 stdin 전용 세그먼트에 대해 실행 시 argv 토큰을 **리터럴 텍스트**로 취급하도록 강제합니다(globbing 없음,
`$VARS` 확장 없음). 따라서 `*` 또는 `$HOME/...` 같은 패턴을 사용해
파일 읽기를 몰래 시도할 수 없습니다.
Safe bins는 신뢰된 바이너리 디렉터리(시스템 기본값 + 선택적
`tools.exec.safeBinTrustedDirs`)에서만 해석되어야 합니다. `PATH` 항목은 절대 자동 신뢰되지 않습니다.
기본 신뢰 safe-bin 디렉터리는 의도적으로 최소화되어 있습니다: `/bin`, `/usr/bin`.
safe-bin 실행 파일이 패키지 관리자/사용자 경로(예:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면 이를 명시적으로
`tools.exec.safeBinTrustedDirs`에 추가하세요.
allowlist 모드에서 셸 체인과 리다이렉션은 자동 허용되지 않습니다.

셸 체이닝(`&&`, `||`, `;`)은 각 최상위 세그먼트가 allowlist를 만족하면 허용됩니다
(safe bins 또는 skill 자동 허용 포함). 리다이렉션은 allowlist 모드에서 여전히 지원되지 않습니다.
명령 치환(`$()` / 백틱)은 allowlist 파싱 중 거부되며, 이중 인용부호 안도 포함됩니다.
리터럴 `$()` 텍스트가 필요하면 작은따옴표를 사용하세요.
macOS 컴패니언 앱 승인에서는 셸 제어 또는 확장 구문을 포함하는 원시 셸 텍스트
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)는
셸 바이너리 자체가 allowlist에 없으면 allowlist 미스로 처리됩니다.
셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 env override는
작고 명시적인 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.
allowlist 모드에서 allow-always 결정을 할 때 알려진 디스패치 래퍼
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신
내부 실행 파일 경로를 지속 저장합니다. 셸 멀티플렉서(`busybox`, `toybox`)도 셸 애플릿(`sh`, `ash`,
등)에 대해 언래핑되므로 멀티플렉서 바이너리 대신 내부 실행 파일이 저장됩니다.
래퍼 또는 멀티플렉서를 안전하게 언래핑할 수 없으면 allowlist 항목은 자동으로 저장되지 않습니다.
`python3` 또는 `node` 같은 interpreter를 allowlist에 넣는다면 인라인 eval이 여전히 명시적 승인을 요구하도록
`tools.exec.strictInlineEval=true`를 선호하세요. strict 모드에서는 `allow-always`가
무해한 interpreter/스크립트 호출은 계속 저장할 수 있지만, 인라인 eval 캐리어는 자동 저장되지 않습니다.

기본 safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`와 `sort`는 기본 목록에 없습니다. 이를 명시적으로 opt-in하는 경우
비-stdin 워크플로에는 명시적 allowlist 항목을 유지하세요.
safe-bin 모드에서 `grep`의 패턴은 `-e`/`--regexp`로 제공해야 합니다. 위치 기반 패턴 형식은
거부되므로 파일 피연산자를 모호한 위치 인자로 숨길 수 없습니다.

### Safe bins와 allowlist 비교

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Goal             | 좁은 stdin 필터를 자동 허용                            | 특정 실행 파일을 명시적으로 신뢰                             |
| Match type       | 실행 파일 이름 + safe-bin argv 정책                    | 해석된 실행 파일 경로 glob 패턴                              |
| Argument scope   | safe-bin 프로필과 리터럴 토큰 규칙으로 제한            | 경로 일치만 검사, 인자는 그 외에는 사용자가 책임짐           |
| Typical examples | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 사용자 지정 CLI           |
| Best use         | 저위험 텍스트 변환 파이프라인                          | 더 넓은 동작이나 부작용이 있는 모든 도구                     |

구성 위치:

- `safeBins`는 config에서 옵니다(`tools.exec.safeBins` 또는 agent별 `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`는 config에서 옵니다(`tools.exec.safeBinTrustedDirs` 또는 agent별 `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`는 config에서 옵니다(`tools.exec.safeBinProfiles` 또는 agent별 `agents.list[].tools.exec.safeBinProfiles`). agent별 프로필 키가 전역 키를 override합니다.
- allowlist 항목은 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 저장됩니다(또는 Control UI / `openclaw approvals allowlist ...`를 통해 수정).
- `openclaw security audit`는 interpreter/runtime bin이 명시적 프로필 없이 `safeBins`에 나타나면 `tools.exec.safe_bins_interpreter_unprofiled` 경고를 표시합니다.
- `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles.<bin>` 항목을 `{}`로 스캐폴드할 수 있습니다(이후 검토하고 더 엄격하게 조이세요). interpreter/runtime bin은 자동 스캐폴드되지 않습니다.

사용자 지정 프로필 예시:
__OC_I18N_900004__
`jq`를 명시적으로 `safeBins`에 opt-in하더라도, OpenClaw는 safe-bin
모드에서 `env` 내장 함수를 계속 거부하므로 `jq -n env`로 호스트 프로세스 환경을 덤프할 수 없습니다.
명시적 allowlist 경로나 승인 프롬프트 없이는 허용되지 않습니다.

## Control UI 편집

**Control UI → Nodes → Exec approvals** 카드에서 기본값, agent별
override, allowlist를 편집하세요. 범위(기본값 또는 agent)를 선택하고 정책을 조정한 뒤,
allowlist 패턴을 추가/삭제하고 **Save**를 누르세요. UI에는 패턴별 **last used** 메타데이터가
표시되므로 목록을 깔끔하게 유지할 수 있습니다.

타깃 선택기는 **Gateway**(로컬 승인) 또는 **Node**를 선택합니다. Node는
`system.execApprovals.get/set`을 광고해야 합니다(macOS 앱 또는 헤드리스 node host).
node가 아직 exec 승인을 광고하지 않는다면 해당 node의 로컬
`~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 gateway 또는 node 편집을 지원합니다([Approvals CLI](/cli/approvals) 참조).

## 승인 흐름

프롬프트가 필요하면 gateway는 `exec.approval.requested`를 운영자 클라이언트에 브로드캐스트합니다.
Control UI와 macOS 앱은 이를 `exec.approval.resolve`로 처리한 뒤, gateway가
승인된 요청을 node host로 전달합니다.

`host=node`의 경우 승인 요청에는 canonical `systemRunPlan` payload가 포함됩니다. gateway는
승인된 `system.run` 요청을 전달할 때 이 plan을 권위 있는 명령/cwd/세션 컨텍스트로 사용합니다.

이 점은 비동기 승인 지연 시간에 중요합니다:

- node exec 경로는 먼저 하나의 canonical plan을 준비합니다
- 승인 레코드는 그 plan과 바인딩 메타데이터를 저장합니다
- 승인되면 최종 전달되는 `system.run` 호출은
  이후 호출자 편집을 신뢰하지 않고 저장된 plan을 재사용합니다
- 승인 요청이 생성된 후 호출자가 `command`, `rawCommand`, `cwd`, `agentId`, 또는
  `sessionKey`를 변경하면 gateway는
  승인 불일치로 해당 전달 실행을 거부합니다

## Interpreter/runtime 명령

승인 기반 interpreter/runtime 실행은 의도적으로 보수적입니다:

- 정확한 argv/cwd/env 컨텍스트는 항상 바인딩됩니다.
- 직접 셸 스크립트와 직접 runtime 파일 형식은 best-effort로 하나의 구체적인 로컬
  파일 스냅샷에 바인딩됩니다.
- 여전히 하나의 직접 로컬 파일로 해석되는 일반적인 패키지 관리자 래퍼 형식(예:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 언래핑됩니다.
- OpenClaw가 interpreter/runtime 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면
  (예: 패키지 스크립트, eval 형식, runtime별 loader 체인, 또는 모호한 다중 파일
  형식), 의미적 커버리지가 있는 척하는 대신 승인 기반 실행은 거부됩니다.
- 이런 워크플로에는 sandboxing, 별도의 호스트 경계, 또는 운영자가 더 넓은 runtime 의미를 수용하는
  명시적 trusted allowlist/full 워크플로를 선호하세요.

승인이 필요할 때 exec 도구는 승인 id와 함께 즉시 반환됩니다. 이 id를 사용해
이후 시스템 이벤트(`Exec finished` / `Exec denied`)와 상관관계를 맞추세요. 제한 시간 전에 결정이 오지 않으면
해당 요청은 승인 시간 초과로 처리되며 거부 사유로 표시됩니다.

### 후속 전달 동작

승인된 비동기 exec가 끝나면 OpenClaw는 같은 세션에 후속 `agent` 턴을 보냅니다.

- 유효한 외부 전달 대상(전달 가능한 채널 + 대상 `to`)이 있으면 후속 전달은 해당 채널을 사용합니다.
- 외부 대상이 없는 webchat 전용 또는 내부 세션 흐름에서는 후속 전달은 세션 전용으로 유지됩니다(`deliver: false`).
- 호출자가 해결 가능한 외부 채널 없이 엄격한 외부 전달을 명시적으로 요청하면 요청은 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 채널을 해결할 수 없으면 전달은 실패 대신 세션 전용으로 강등됩니다.

확인 대화상자에는 다음이 포함됩니다:

- 명령 + 인자
- cwd
- agent id
- 해석된 실행 파일 경로
- 호스트 + 정책 메타데이터

동작:

- **Allow once** → 지금 실행
- **Always allow** → allowlist에 추가 + 실행
- **Deny** → 차단

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 아무 채팅 채널(plugin 채널 포함)로든 전달하고
`/approve`로 승인할 수 있습니다. 이 기능은 일반 outbound 전달 파이프라인을 사용합니다.

Config:
__OC_I18N_900005__
채팅에서 응답:
__OC_I18N_900006__
`/approve` 명령은 exec 승인과 plugin 승인 둘 다 처리합니다. ID가 대기 중인 exec 승인과 일치하지 않으면, 자동으로 plugin 승인도 확인합니다.

### Plugin 승인 전달

plugin 승인 전달은 exec 승인과 동일한 전달 파이프라인을 사용하지만,
자체 독립 config를 `approvals.plugin` 아래에 가집니다. 하나를 활성화하거나 비활성화해도 다른 하나에는 영향을 주지 않습니다.
__OC_I18N_900007__
config 형태는 `approvals.exec`와 동일합니다: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets`가 동일하게 동작합니다.

공유 인터랙티브 응답을 지원하는 채널은 exec와
plugin 승인 모두에 대해 동일한 승인 버튼을 렌더링합니다. 공유 인터랙티브 UI가 없는 채널은
`/approve` 안내가 포함된 일반 텍스트로 폴백합니다.

### 모든 채널의 동일 채팅 승인

전달 가능한 채팅 표면에서 exec 또는 plugin 승인 요청이 발생하면,
이제 같은 채팅에서 기본적으로 `/approve`로 승인할 수 있습니다. 이는 기존 Web UI와 터미널 UI 흐름에 더해
Slack, Matrix, Microsoft Teams 같은 채널에도 적용됩니다.

이 공유 텍스트 명령 경로는 해당 대화의 일반 채널 auth 모델을 사용합니다. 시작 채팅이
이미 명령을 보내고 응답을 받을 수 있다면, 승인 요청이 대기 상태를 유지하기 위해
별도의 네이티브 전달 어댑터가 더 이상 필요하지 않습니다.

Discord와 Telegram도 동일 채팅 `/approve`를 지원하지만, 이 채널들은 네이티브 승인 전달이 비활성화된 경우에도
권한 부여를 위해 여전히 해결된 approver 목록을 사용합니다.

Gateway를 직접 호출하는 Telegram 및 기타 네이티브 승인 클라이언트의 경우
이 fallback은 의도적으로 "approval not found" 실패로만 제한됩니다. 실제
exec 승인 거부/오류는 조용히 plugin 승인으로 재시도되지 않습니다.

### 네이티브 승인 전달

일부 채널은 네이티브 승인 클라이언트로도 동작할 수 있습니다. 네이티브 클라이언트는 shared same-chat `/approve`
흐름 위에 approver DM, origin-chat fanout, 그리고 채널별 인터랙티브 승인 UX를 추가합니다.

네이티브 승인 카드/버튼을 사용할 수 있을 때는 그 네이티브 UI가
agent가 마주하는 주 경로입니다. 도구 결과가 채팅 승인을 사용할 수 없다고 하거나
수동 승인이 유일한 남은 경로라고 하지 않는 한, agent는
중복되는 일반 채팅 `/approve` 명령을 추가로 되풀이해서는 안 됩니다.

일반 모델:

- 호스트 exec 정책은 여전히 exec 승인이 필요한지 결정합니다
- `approvals.exec`는 다른 채팅 대상으로 승인 프롬프트를 전달할지 제어합니다
- `channels.<channel>.execApprovals`는 해당 채널이 네이티브 승인 클라이언트로 동작할지 제어합니다

네이티브 승인 클라이언트는 다음 조건이 모두 참일 때 approver DM 우선 전달을 자동 활성화합니다:

- 해당 채널이 네이티브 승인 전달을 지원함
- approver를 명시적 `execApprovals.approvers` 또는 해당
  채널의 문서화된 fallback 소스에서 해결할 수 있음
- `channels.<channel>.execApprovals.enabled`가 unset이거나 `"auto"`임

네이티브 승인 클라이언트를 명시적으로 끄려면 `enabled: false`를 설정하세요. approver가 해결될 때
강제로 켜려면 `enabled: true`를 설정하세요. 공개 origin-chat 전달은
`channels.<channel>.execApprovals.target`을 통해 명시적으로 유지됩니다.

FAQ: [채팅 승인에 exec 승인 config가 두 개 있는 이유는 무엇인가요?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

이러한 네이티브 승인 클라이언트는 공유
same-chat `/approve` 흐름과 공유 승인 버튼 위에 DM 라우팅과 선택적 채널 fanout을 추가합니다.

공유 동작:

- Slack, Matrix, Microsoft Teams 및 유사한 전달 가능한 채팅은
  same-chat `/approve`에 일반 채널 auth 모델을 사용합니다
- 네이티브 승인 클라이언트가 자동 활성화되면 기본 네이티브 전달 대상은 approver DM입니다
- Discord와 Telegram에서는 해결된 approver만 승인 또는 거부할 수 있습니다
- Discord approver는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다
- Telegram approver는 명시적(`execApprovals.approvers`)이거나 기존 owner config(`allowFrom`, 그리고 지원되는 경우 direct-message `defaultTo`)에서 추론될 수 있습니다
- Slack approver는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다
- Slack 네이티브 버튼은 승인 id 종류를 보존하므로 `plugin:` id가
  두 번째 Slack 로컬 fallback 계층 없이 plugin 승인을 해결할 수 있습니다
- Matrix 네이티브 DM/채널 라우팅과 반응 단축키는 exec와 plugin 승인 둘 다 처리합니다.
  plugin 권한 부여는 여전히 `channels.matrix.dm.allowFrom`에서 옵니다
- 요청자는 approver일 필요가 없습니다
- 시작 채팅이 이미 명령과 응답을 지원한다면 해당 채팅은 `/approve`로 직접 승인할 수 있습니다
- 네이티브 Discord 승인 버튼은 승인 id 종류에 따라 라우팅됩니다: `plugin:` id는
  곧바로 plugin 승인으로 가고, 그 외 모든 것은 exec 승인으로 갑니다
- 네이티브 Telegram 승인 버튼은 `/approve`와 동일한 제한된 exec-to-plugin fallback을 따릅니다
- 네이티브 `target`이 origin-chat 전달을 활성화하면 승인 프롬프트에 명령 텍스트가 포함됩니다
- 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다
- 요청을 수락할 운영자 UI나 구성된 승인 클라이언트가 없으면 프롬프트는 `askFallback`으로 폴백합니다

Telegram은 기본적으로 approver DM(`target: "dm"`)을 사용합니다. 승인 프롬프트가
원래 Telegram 채팅/토픽에도 나타나길 원한다면 `channel` 또는 `both`로 전환할 수 있습니다. Telegram forum
토픽의 경우 OpenClaw는 승인 프롬프트와 승인 후 후속 메시지 모두에서 토픽을 유지합니다.

참조:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 흐름
__OC_I18N_900008__
보안 참고:

- Unix socket 모드 `0600`, 토큰은 `exec-approvals.json`에 저장됨.
- 동일 UID 피어 검사.
- 챌린지/응답(nonce + HMAC token + request hash) + 짧은 TTL.

## 시스템 이벤트

Exec 수명 주기는 시스템 메시지로 노출됩니다:

- `Exec running`(명령이 실행 중 알림 임계값을 초과하는 경우에만)
- `Exec finished`
- `Exec denied`

이 메시지들은 node가 이벤트를 보고한 후 agent 세션에 게시됩니다.
gateway host exec 승인도 명령이 끝나면(그리고 선택적으로 실행 시간이 임계값보다 길 때) 동일한 수명 주기 이벤트를 발생시킵니다.
승인 게이트가 있는 exec는 쉽게 상관관계를 맞출 수 있도록 이러한 메시지에서 승인 id를 `runId`로 재사용합니다.

## 거부된 승인 동작

비동기 exec 승인이 거부되면, OpenClaw는 agent가 세션에서
이전의 동일 명령 실행 결과를 재사용하지 못하게 합니다. 거부 사유는
사용 가능한 명령 출력이 없다는 명시적 안내와 함께 전달되며, 이는
agent가 새 출력이 있다고 주장하거나 이전 성공 실행의 오래된 결과로
거부된 명령을 반복하는 것을 막습니다.

## 영향

- **full**은 강력하므로 가능하면 allowlist를 선호하세요.
- **ask**는 빠른 승인을 허용하면서도 사용자가 계속 관여하도록 해 줍니다.
- agent별 allowlist는 한 agent의 승인이 다른 agent로 새지 않게 합니다.
- 승인은 **권한 있는 발신자**의 호스트 exec 요청에만 적용됩니다. 권한 없는 발신자는 `/exec`를 실행할 수 없습니다.
- `/exec security=full`은 권한 있는 운영자를 위한 세션 수준 편의 기능이며 설계상 승인을 건너뜁니다.
  호스트 exec를 강제로 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하세요.

관련 항목:

- [Exec tool](/ko/tools/exec)
- [Elevated mode](/ko/tools/elevated)
- [Skills](/ko/tools/skills)

## 관련

- [Exec](/ko/tools/exec) — 셸 명령 실행 도구
- [Sandboxing](/ko/gateway/sandboxing) — sandbox 모드와 workspace 접근
- [Security](/ko/gateway/security) — 보안 모델과 강화 방법
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — 각각을 언제 사용해야 하는지
