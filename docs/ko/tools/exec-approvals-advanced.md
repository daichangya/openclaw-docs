---
read_when:
    - 안전한 바이너리 또는 사용자 지정 safe-bin 프로필 구성하기
    - Slack/Discord/Telegram 또는 다른 채팅 채널로 승인 전달하기
    - channel용 네이티브 승인 클라이언트 구현하기
summary: '고급 exec 승인: 안전한 바이너리, 인터프리터 바인딩, 승인 전달, 네이티브 전달'
title: Exec 승인 — 고급
x-i18n:
    generated_at: "2026-04-24T06:39:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

고급 exec 승인 주제: `safeBins` fast-path, 인터프리터/런타임
바인딩, 채팅 채널로의 승인 전달(네이티브 전달 포함)입니다.
핵심 정책과 승인 흐름은 [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

## 안전한 바이너리(`safeBins`, stdin 전용)

`tools.exec.safeBins`는
예를 들어 `cut` 같은 **stdin 전용** 바이너리의 작은 목록을 정의하며, 이들은
명시적인 allowlist 엔트리 없이도 allowlist 모드에서 실행될 수 있습니다.
안전한 바이너리는 위치 기반 파일 인수와 경로처럼 보이는 토큰을 거부하므로,
들어오는 스트림에서만 동작할 수 있습니다. 이것은 일반적인 신뢰 목록이 아니라
스트림 필터를 위한 좁은 fast-path로 취급하세요.

<Warning>
인터프리터 또는 런타임 바이너리(예: `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`)를 `safeBins`에 추가하지 마세요. 명령이
코드를 평가하거나, 하위 명령을 실행하거나, 설계상 파일을 읽을 수 있다면,
명시적인 allowlist 엔트리를 사용하는 쪽을 우선하고 승인 프롬프트를 계속 활성화하세요.
사용자 지정 안전한 바이너리는 `tools.exec.safeBinProfiles.<bin>`에 명시적인 프로필을 정의해야 합니다.
</Warning>

기본 안전한 바이너리:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`와 `sort`는 기본 목록에 없습니다. 이를 opt-in하는 경우,
stdin이 아닌 워크플로에 대해서는 명시적인 allowlist 엔트리를 유지하세요.
안전한 바이너리 모드의 `grep`에서는 패턴을 `-e`/`--regexp`로 제공해야 합니다.
위치 기반 패턴 형식은 거부되므로 파일 피연산자를 모호한 위치 인수로
몰래 넣을 수 없습니다.

### Argv 검증 및 거부된 플래그

검증은 argv 형태만으로 결정적으로 수행됩니다(호스트 파일 시스템 존재 여부 확인 없음).
이렇게 하면 허용/거부 차이로 파일 존재 여부를 추론하는 oracle 동작을 방지할 수 있습니다.
기본 안전한 바이너리에 대해서는 파일 지향 옵션이 거부되며, long option은
fail-closed 방식으로 검증됩니다(알 수 없는 플래그와 모호한 축약형은 거부됨).

안전한 바이너리 프로필별 거부 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

안전한 바이너리는 또한 실행 시 argv 토큰을 **리터럴 텍스트**로만 취급하도록 강제합니다
(stdin 전용 세그먼트에서 globbing 및 `$VARS` 확장 없음). 따라서 `*`나 `$HOME/...` 같은
패턴으로 파일 읽기를 몰래 수행할 수 없습니다.

### 신뢰된 바이너리 디렉터리

안전한 바이너리는 신뢰된 바이너리 디렉터리(시스템 기본값 및
선택적인 `tools.exec.safeBinTrustedDirs`)에서 해석되어야 합니다.
`PATH` 엔트리는 자동으로 신뢰되지 않습니다.
기본 신뢰 디렉터리는 의도적으로 최소화되어 있습니다: `/bin`, `/usr/bin`.
안전한 바이너리 실행 파일이 패키지 관리자/사용자 경로(예:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면
이를 `tools.exec.safeBinTrustedDirs`에 명시적으로 추가하세요.

### 셸 체이닝, 래퍼, 멀티플렉서

모든 최상위 세그먼트가 allowlist를 만족하면(안전한 바이너리 또는 Skill 자동 허용 포함)
셸 체이닝(`&&`, `||`, `;`)이 허용됩니다.
리디렉션은 allowlist 모드에서 계속 지원되지 않습니다.
명령 치환(`$()` / 백틱)은 allowlist 파싱 중 거부되며,
이중 따옴표 안에서도 마찬가지입니다. 리터럴 `$()` 텍스트가 필요하면
작은따옴표를 사용하세요.

macOS 컴패니언 앱 승인에서는 셸 제어 또는 확장 구문(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)이
포함된 원시 셸 텍스트는 셸 바이너리 자체가 allowlist에 포함되지 않은 한
allowlist 불일치로 처리됩니다.

셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 env 재정의는
작고 명시적인 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.

allowlist 모드에서 `allow-always` 결정을 할 때 알려진 디스패치 래퍼(`env`,
`nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신
내부 실행 파일 경로를 유지합니다.
셸 멀티플렉서(`busybox`, `toybox`)는 셸 applet(`sh`, `ash` 등)에 대해
같은 방식으로 언랩됩니다.
래퍼나 멀티플렉서를 안전하게 언랩할 수 없으면 어떤 allowlist 엔트리도 자동으로 유지되지 않습니다.

`python3`나 `node` 같은 인터프리터를 allowlist에 추가한다면,
인라인 eval이 여전히 명시적 승인을 요구하도록
`tools.exec.strictInlineEval=true`를 사용하는 편이 좋습니다.
엄격 모드에서는 `allow-always`가 무해한
인터프리터/스크립트 호출을 계속 유지할 수 있지만, 인라인 eval 전달자는 자동으로 유지되지 않습니다.

### 안전한 바이너리 대 allowlist

| Topic            | `tools.exec.safeBins`                               | Allowlist (`exec-approvals.json`)                           |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| 목표             | 좁은 stdin 필터 자동 허용                           | 특정 실행 파일을 명시적으로 신뢰                            |
| 일치 유형        | 실행 파일 이름 + 안전한 바이너리 argv 정책          | 해석된 실행 파일 경로 glob 패턴                             |
| 인수 범위        | 안전한 바이너리 프로필과 리터럴 토큰 규칙으로 제한  | 경로 일치만 처리, 나머지 인수는 사용자가 책임짐             |
| 일반 예시        | `head`, `tail`, `tr`, `wc`                          | `jq`, `python3`, `node`, `ffmpeg`, 사용자 지정 CLI          |
| 최적 사용처      | 파이프라인의 저위험 텍스트 변환                     | 더 넓은 동작이나 부작용이 있는 모든 도구                    |

구성 위치:

- `safeBins`는 config에서 가져옵니다(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`는 config에서 가져옵니다(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`는 config에서 가져옵니다(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`). 에이전트별 프로필 키가 전역 키를 재정의합니다.
- allowlist 엔트리는 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 저장됩니다(또는 Control UI / `openclaw approvals allowlist ...`를 통해).
- `openclaw security audit`는 인터프리터/런타임 바이너리가 명시적 프로필 없이 `safeBins`에 나타날 때 `tools.exec.safe_bins_interpreter_unprofiled` 경고를 표시합니다.
- `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles.<bin>` 엔트리를 `{}`로 스캐폴드할 수 있습니다(이후 검토 및 강화 필요). 인터프리터/런타임 바이너리는 자동 스캐폴드되지 않습니다.

사용자 지정 프로필 예시:
__OC_I18N_900000__
`jq`를 `safeBins`에 명시적으로 opt-in해도 OpenClaw는 여전히 safe-bin
모드에서 `env` 내장 기능을 거부하므로 `jq -n env`가 명시적인 allowlist 경로
또는 승인 프롬프트 없이 호스트 프로세스 환경을 덤프할 수 없습니다.

## 인터프리터/런타임 명령

승인 기반 인터프리터/런타임 실행은 의도적으로 보수적입니다.

- 정확한 argv/cwd/env 컨텍스트는 항상 바인딩됩니다.
- 직접 셸 스크립트 및 직접 런타임 파일 형식은 가능한 범위에서 하나의 구체적인 로컬
  파일 스냅샷에 바인딩됩니다.
- 하나의 직접 로컬 파일로 여전히 해석되는 일반적인 패키지 관리자 래퍼 형식(예:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 언랩됩니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을
  식별할 수 없으면(예: package script, eval 형식, 런타임별 loader 체인, 모호한 다중 파일
  형식) 승인 기반 실행은 의미적 범위를 가장하지 않고 거부됩니다.
- 이러한 워크플로에는 샌드박싱, 별도의 호스트 경계, 또는
  운영자가 더 넓은 런타임 시맨틱을 받아들이는 명시적인 trusted
  allowlist/전체 워크플로를 우선 사용하세요.

승인이 필요할 때 exec 도구는 승인 id를 즉시 반환합니다. 이 id를 사용해 이후 시스템 이벤트(`Exec finished` / `Exec denied`)를 상관관계 분석하세요. 타임아웃 전에 결정이 도착하지 않으면, 요청은 승인 타임아웃으로 처리되어 거부 사유로 표시됩니다.

### 후속 전달 동작

승인된 비동기 exec가 끝나면 OpenClaw는 같은 세션에 후속 `agent` 턴을 보냅니다.

- 유효한 외부 전달 대상이 있으면(전달 가능한 channel + 대상 `to`) 후속 전달은 해당 channel을 사용합니다.
- webchat 전용 또는 외부 대상이 없는 내부 세션 흐름에서는 후속 전달이 세션 전용(`deliver: false`)으로 유지됩니다.
- 호출자가 해석 가능한 외부 channel이 없는 상태에서 엄격한 외부 전달을 명시적으로 요청하면, 요청은 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 channel을 해석할 수 없으면, 전달은 실패하는 대신 세션 전용으로 다운그레이드됩니다.

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 모든 채팅 채널(Plugin channel 포함)로 전달하고
`/approve`로 승인할 수 있습니다. 이는 일반 아웃바운드 전달 파이프라인을 사용합니다.

구성:
__OC_I18N_900001__
채팅에서 응답:
__OC_I18N_900002__
`/approve` 명령은 exec 승인과 Plugin 승인 모두를 처리합니다.
ID가 대기 중인 exec 승인과 일치하지 않으면 자동으로 Plugin 승인을 확인합니다.

### Plugin 승인 전달

Plugin 승인 전달은 exec 승인과 동일한 전달 파이프라인을 사용하지만,
`approvals.plugin` 아래의 독립적인 자체 구성을 가집니다.
하나를 활성화하거나 비활성화해도 다른 하나에는 영향을 주지 않습니다.
__OC_I18N_900003__
config 형태는 `approvals.exec`와 동일합니다. `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets`가 같은 방식으로 동작합니다.

공유 대화형 응답을 지원하는 채널은 exec 승인과
Plugin 승인 모두에 동일한 승인 버튼을 렌더링합니다.
공유 대화형 UI가 없는 채널은 `/approve`
지침이 포함된 일반 텍스트로 폴백합니다.

### 모든 채널의 같은 채팅 승인

exec 또는 Plugin 승인 요청이 전달 가능한 채팅 표면에서 시작되면,
이제 기본적으로 같은 채팅에서 `/approve`로 이를 승인할 수 있습니다.
이는 기존 Web UI와 터미널 UI 흐름 외에도 Slack, Matrix,
Microsoft Teams 같은 채널에 적용됩니다.

이 공유 텍스트 명령 경로는 해당 대화의 일반 channel auth 모델을 사용합니다.
원래 채팅이 이미 명령을 보낼 수 있고 응답을 받을 수 있다면,
승인 요청은 더 이상 대기 상태를 유지하기 위해 별도의 네이티브 전달 adapter가 필요하지 않습니다.

Discord와 Telegram도 같은 채팅 `/approve`를 지원하지만,
네이티브 승인 전달이 비활성화된 경우에도 해당 채널은 여전히
해석된 approver 목록을 인증에 사용합니다.

Gateway를 직접 호출하는 Telegram 및 기타 네이티브 승인 클라이언트의 경우,
이 폴백은 의도적으로 "approval not found" 실패에만 제한됩니다.
실제 exec 승인 거부/오류는 조용히 Plugin 승인으로 재시도되지 않습니다.

### 네이티브 승인 전달

일부 채널은 네이티브 승인 클라이언트 역할도 수행할 수 있습니다.
네이티브 클라이언트는 공유 same-chat `/approve`
흐름 위에 approver DM, origin-chat fanout,
channel별 대화형 승인 UX를 추가합니다.

네이티브 승인 카드/버튼을 사용할 수 있을 때는 해당 네이티브 UI가
에이전트가 보는 기본 경로입니다. 도구 결과가 채팅 승인을 사용할 수 없거나
수동 승인이 유일하게 남은 경로라고 말하지 않는 한,
에이전트는 중복된 일반 채팅 `/approve` 명령을 추가로 표시하지 않아야 합니다.

일반 모델:

- host exec 정책이 여전히 exec 승인 필요 여부를 결정합니다.
- `approvals.exec`는 다른 채팅 대상으로 승인 프롬프트를 전달할지를 제어합니다.
- `channels.<channel>.execApprovals`는 해당 channel이 네이티브 승인 클라이언트로 동작할지를 제어합니다.

네이티브 승인 클라이언트는 다음 조건이 모두 참이면 approver DM 우선 전달을 자동 활성화합니다.

- 해당 channel이 네이티브 승인 전달을 지원함
- approver가 명시적 `execApprovals.approvers` 또는 해당
  channel의 문서화된 폴백 소스에서 해석될 수 있음
- `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`임

네이티브 승인 클라이언트를 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.
approver가 해석될 때 강제로 켜려면 `enabled: true`를 설정하세요.
공개 origin-chat 전달은 계속
`channels.<channel>.execApprovals.target`을 통해 명시적으로 유지됩니다.

FAQ: [채팅 승인에 exec 승인 config가 두 개인 이유는 무엇인가요?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

이 네이티브 승인 클라이언트는 공유 same-chat `/approve` 흐름과 공유 승인 버튼 위에
DM 라우팅과 선택적 channel fanout을 추가합니다.

공유 동작:

- Slack, Matrix, Microsoft Teams 및 유사한 전달 가능한 채팅은
  same-chat `/approve`에 일반 channel auth 모델을 사용합니다.
- 네이티브 승인 클라이언트가 자동 활성화되면 기본 네이티브 전달 대상은 approver DM입니다.
- Discord와 Telegram에서는 해석된 approver만 승인 또는 거부할 수 있습니다.
- Discord approver는 명시적(`execApprovals.approvers`)일 수도 있고 `commands.ownerAllowFrom`에서 추론될 수도 있습니다.
- Telegram approver는 명시적(`execApprovals.approvers`)일 수도 있고 기존 owner config(`allowFrom`, 지원되는 경우 direct-message `defaultTo` 포함)에서 추론될 수도 있습니다.
- Slack approver는 명시적(`execApprovals.approvers`)일 수도 있고 `commands.ownerAllowFrom`에서 추론될 수도 있습니다.
- Slack 네이티브 버튼은 승인 id 종류를 보존하므로 `plugin:` id가
  두 번째 Slack 로컬 폴백 계층 없이 Plugin 승인을 해석할 수 있습니다.
- Matrix 네이티브 DM/channel 라우팅과 reaction 단축키는 exec 승인과 Plugin 승인 모두를 처리합니다.
  Plugin 인증은 여전히 `channels.matrix.dm.allowFrom`에서 옵니다.
- 요청자는 approver일 필요가 없습니다.
- 원래 채팅이 이미 명령과 응답을 지원하면, 해당 채팅은 `/approve`로 직접 승인할 수 있습니다.
- 네이티브 Discord 승인 버튼은 승인 id 종류에 따라 라우팅됩니다. `plugin:` id는
  직접 Plugin 승인으로 가고, 그 외의 모든 것은 exec 승인으로 갑니다.
- 네이티브 Telegram 승인 버튼은 `/approve`와 동일한 제한된 exec-에서-Plugin 폴백을 따릅니다.
- 네이티브 `target`이 origin-chat 전달을 활성화하면, 승인 프롬프트에는 명령 텍스트가 포함됩니다.
- 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다.
- 어떤 운영자 UI나 구성된 승인 클라이언트도 요청을 수락할 수 없으면, 프롬프트는 `askFallback`으로 폴백합니다.

Telegram은 기본적으로 approver DM(`target: "dm"`)을 사용합니다. 승인 프롬프트가
원래 Telegram 채팅/토픽에도 나타나게 하려면 `channel` 또는 `both`로 전환할 수 있습니다.
Telegram forum topic의 경우 OpenClaw는 승인 프롬프트와 승인 후 후속 메시지 모두에서
해당 토픽을 유지합니다.

참조:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 흐름
__OC_I18N_900004__
보안 참고:

- Unix socket 모드 `0600`, token은 `exec-approvals.json`에 저장됨
- 동일 UID peer 검사
- challenge/response(nonce + HMAC token + request hash) + 짧은 TTL

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals) — 핵심 정책 및 승인 흐름
- [Exec 도구](/ko/tools/exec)
- [Elevated 모드](/ko/tools/elevated)
- [Skills](/ko/tools/skills) — Skill 기반 자동 허용 동작
