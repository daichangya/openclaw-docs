---
read_when:
    - doctor 마이그레이션을 추가하거나 수정할 때
    - 호환성이 깨지는 구성 변경을 도입할 때
summary: 'Doctor 명령: 상태 검사, 구성 마이그레이션 및 복구 단계'
title: Doctor
x-i18n:
    generated_at: "2026-04-07T05:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a834dc7aec79c20d17bc23d37fb5f5e99e628d964d55bd8cf24525a7ee57130c
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`는 OpenClaw용 복구 + 마이그레이션 도구입니다. 오래된
구성/상태를 수정하고, 상태를 검사하며, 실행 가능한 복구 단계를 제공합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 / 자동화

```bash
openclaw doctor --yes
```

프롬프트 없이 기본값을 수락합니다(해당되는 경우 재시작/서비스/샌드박스 복구 단계 포함).

```bash
openclaw doctor --repair
```

권장 복구를 프롬프트 없이 적용합니다(복구 + 안전한 경우 재시작).

```bash
openclaw doctor --repair --force
```

공격적인 복구도 적용합니다(사용자 지정 supervisor 구성을 덮어씀).

```bash
openclaw doctor --non-interactive
```

프롬프트 없이 실행하고 안전한 마이그레이션만 적용합니다(구성 정규화 + 디스크 상태 이동). 사람의 확인이 필요한 재시작/서비스/샌드박스 작업은 건너뜁니다.
감지된 레거시 상태 마이그레이션은 자동으로 실행됩니다.

```bash
openclaw doctor --deep
```

추가 gateway 설치를 위해 시스템 서비스(launchd/systemd/schtasks)를 검사합니다.

쓰기 전에 변경 사항을 검토하려면 먼저 구성 파일을 여세요:

```bash
cat ~/.openclaw/openclaw.json
```

## 수행 작업(요약)

- git 설치용 선택적 사전 업데이트(대화형 전용).
- UI 프로토콜 최신 상태 검사(프로토콜 스키마가 더 최신이면 Control UI 재빌드).
- 상태 검사 + 재시작 프롬프트.
- Skills 상태 요약(사용 가능/누락/차단) 및 플러그인 상태.
- 레거시 값에 대한 구성 정규화.
- 레거시 평면 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로의 Talk 구성 마이그레이션.
- 레거시 Chrome 확장 구성 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 검사.
- OpenCode 프로바이더 재정의 경고(`models.providers.opencode` / `models.providers.opencode-go`).
- OpenAI Codex OAuth 프로필에 대한 OAuth TLS 전제 조건 검사.
- 레거시 온디스크 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증).
- 레거시 플러그인 매니페스트 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- 레거시 cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` webhook 폴백 작업).
- 세션 잠금 파일 검사 및 오래된 잠금 정리.
- 상태 무결성 및 권한 검사(세션, transcript, 상태 디렉터리).
- 로컬에서 실행할 때 구성 파일 권한 검사(`chmod 600`).
- 모델 인증 상태: OAuth 만료 확인, 만료 임박 토큰 새로 고침 가능, 인증 프로필 쿨다운/비활성 상태 보고.
- 추가 workspace 디렉터리 감지(`~/openclaw`).
- 샌드박싱이 활성화된 경우 샌드박스 이미지 복구.
- 레거시 서비스 마이그레이션 및 추가 gateway 감지.
- Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드).
- Gateway 런타임 검사(서비스가 설치되어 있지만 실행 중이 아님, 캐시된 launchd 레이블).
- 채널 상태 경고(실행 중인 gateway에서 프로브됨).
- Supervisor 구성 감사(launchd/systemd/schtasks) 및 선택적 복구.
- Gateway 런타임 모범 사례 검사(Node 대 Bun, 버전 관리자 경로).
- Gateway 포트 충돌 진단(기본값 `18789`).
- 개방형 DM 정책에 대한 보안 경고.
- 로컬 토큰 모드용 gateway 인증 검사(토큰 소스가 없을 때 토큰 생성 제안, 토큰 SecretRef 구성은 덮어쓰지 않음).
- Linux에서 systemd linger 검사.
- Workspace bootstrap 파일 크기 검사(컨텍스트 파일에 대한 잘림/한계 근접 경고).
- 셸 자동 완성 상태 검사 및 자동 설치/업그레이드.
- 메모리 검색 임베딩 프로바이더 준비 상태 검사(로컬 모델, 원격 API 키 또는 QMD 바이너리).
- 소스 설치 검사(pnpm workspace 불일치, 누락된 UI 애셋, 누락된 tsx 바이너리).
- 업데이트된 구성 + wizard 메타데이터 기록.

## 자세한 동작 및 이유

### 0) 선택적 업데이트(git 설치)

git checkout이고 doctor가 대화형으로 실행 중이면, doctor를 실행하기 전에
업데이트(fetch/rebase/build)할지 제안합니다.

### 1) 구성 정규화

구성에 레거시 값 형태가 포함되어 있으면(예: 채널별 재정의 없이 `messages.ackReaction`
사용), doctor는 이를 현재 스키마로 정규화합니다.

여기에는 레거시 Talk 평면 필드도 포함됩니다. 현재 공개 Talk 구성은
`talk.provider` + `talk.providers.<provider>`입니다. doctor는 이전
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 형태를 프로바이더 맵으로 다시 작성합니다.

### 2) 레거시 구성 키 마이그레이션

구성에 더 이상 사용되지 않는 키가 포함되어 있으면, 다른 명령은 실행을 거부하고
`openclaw doctor`를 실행하라고 안내합니다.

Doctor는 다음을 수행합니다:

- 어떤 레거시 키가 발견되었는지 설명합니다.
- 적용한 마이그레이션을 보여줍니다.
- 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

Gateway도 시작 시 레거시 구성 형식을 감지하면 자동으로 doctor 마이그레이션을 실행하므로,
오래된 구성이 수동 개입 없이 복구됩니다.
Cron 작업 저장소 마이그레이션은 `openclaw doctor --fix`에서 처리됩니다.

현재 마이그레이션:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 최상위 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- 레거시 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- `accounts`라는 이름이 지정된 채널에서 단일 계정용 최상위 채널 값이 남아 있는 경우, 해당 계정 범위 값을 그 채널에 대해 승격된 계정으로 이동합니다(대부분의 채널은 `accounts.default`; Matrix는 기존에 일치하는 이름 있는/default 대상을 유지할 수 있음)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` 제거(레거시 확장 relay 설정)

Doctor 경고에는 다중 계정 채널에 대한 계정 기본값 안내도 포함됩니다:

- `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 두 개 이상의 `channels.<channel>.accounts` 항목이 구성된 경우, doctor는 폴백 라우팅이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
- `channels.<channel>.defaultAccount`가 알 수 없는 계정 ID로 설정된 경우, doctor는 경고하고 구성된 계정 ID 목록을 표시합니다.

### 2b) OpenCode 프로바이더 재정의

`models.providers.opencode`, `opencode-zen`, 또는 `opencode-go`를
수동으로 추가하면 `@mariozechner/pi-ai`의 내장 OpenCode 카탈로그를 재정의합니다.
이로 인해 모델이 잘못된 API로 강제되거나 비용이 0으로 표시될 수 있습니다. Doctor는
재정의를 제거하고 모델별 API 라우팅 + 비용을 복원할 수 있도록 경고합니다.

### 2c) 브라우저 마이그레이션 및 Chrome MCP 준비 상태

브라우저 구성이 여전히 제거된 Chrome 확장 경로를 가리키고 있으면, doctor는
이를 현재의 호스트 로컬 Chrome MCP 연결 모델로 정규화합니다:

- `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다
- `browser.relayBindHost`는 제거됩니다

또한 `defaultProfile: "user"` 또는 구성된 `existing-session` 프로필을 사용할 때
doctor는 호스트 로컬 Chrome MCP 경로를 감사합니다:

- 기본 자동 연결 프로필에 대해 같은 호스트에 Google Chrome이 설치되어 있는지 확인
- 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고
- 브라우저 inspect 페이지에서 원격 디버깅을 활성화하라고 안내
  (예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  또는 `edge://inspect/#remote-debugging`)

Doctor는 Chrome 측 설정을 대신 활성화할 수 없습니다. 호스트 로컬 Chrome MCP는
여전히 다음이 필요합니다:

- gateway/node 호스트에 Chromium 기반 브라우저 144+
- 브라우저가 로컬에서 실행 중이어야 함
- 해당 브라우저에서 원격 디버깅이 활성화되어 있어야 함
- 브라우저에서 첫 연결 동의 프롬프트를 승인해야 함

여기서의 준비 상태는 로컬 연결 전제 조건만을 의미합니다. Existing-session은
현재 Chrome MCP 경로 제한을 그대로 유지합니다. `responsebody`, PDF
내보내기, 다운로드 가로채기, 일괄 작업 같은 고급 경로는 여전히 관리형
브라우저 또는 raw CDP 프로필이 필요합니다.

이 검사는 Docker, sandbox, remote-browser 또는 기타
헤드리스 흐름에는 적용되지 않습니다. 해당 흐름은 계속 raw CDP를 사용합니다.

### 2d) OAuth TLS 전제 조건

OpenAI Codex OAuth 프로필이 구성되어 있으면, doctor는 OpenAI
인증 엔드포인트를 프로브하여 로컬 Node/OpenSSL TLS 스택이 인증서 체인을
검증할 수 있는지 확인합니다. 프로브가 인증서 오류로 실패하면(예:
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서 또는 자체 서명 인증서),
doctor는 플랫폼별 수정 안내를 출력합니다. Homebrew Node를 사용하는 macOS에서는
일반적으로 `brew postinstall ca-certificates`가 해결책입니다.
`--deep`를 사용하면 gateway가 정상이어도 프로브가 실행됩니다.

### 3) 레거시 상태 마이그레이션(디스크 레이아웃)

Doctor는 이전 온디스크 레이아웃을 현재 구조로 마이그레이션할 수 있습니다:

- 세션 저장소 + transcript:
  - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
- 에이전트 디렉터리:
  - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
- WhatsApp 인증 상태(Baileys):
  - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 계정 ID: `default`)

이 마이그레이션은 최선의 노력으로 수행되며 멱등적입니다. doctor는
백업으로 남겨진 레거시 폴더가 있으면 경고를 출력합니다. Gateway/CLI도 시작 시
레거시 세션 + 에이전트 디렉터리를 자동 마이그레이션하므로, 수동 doctor 실행 없이도
기록/인증/모델이 에이전트별 경로에 배치됩니다. WhatsApp 인증은 의도적으로
`openclaw doctor`를 통해서만 마이그레이션됩니다. 이제 Talk 프로바이더/프로바이더 맵 정규화는
구조적 동등성으로 비교하므로, 키 순서만 다른 차이는 더 이상
반복적인 no-op `doctor --fix` 변경을 유발하지 않습니다.

### 3a) 레거시 플러그인 매니페스트 마이그레이션

Doctor는 설치된 모든 플러그인 매니페스트에서 더 이상 사용되지 않는 최상위 capability
키(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`)를 검사합니다. 발견되면 이를 `contracts`
객체로 이동하고 매니페스트 파일을 제자리에서 다시 쓰도록 제안합니다. 이 마이그레이션은 멱등적입니다.
`contracts` 키에 이미 동일한 값이 있으면 데이터 중복 없이
레거시 키가 제거됩니다.

### 3b) 레거시 cron 저장소 마이그레이션

Doctor는 또한 cron 작업 저장소(기본값 `~/.openclaw/cron/jobs.json`,
또는 재정의된 경우 `cron.store`)에서 스케줄러가 호환성을 위해 여전히 허용하는
이전 작업 형태를 검사합니다.

현재 cron 정리 항목:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 최상위 payload 필드(`message`, `model`, `thinking`, ...) → `payload`
- 최상위 delivery 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery 별칭 → 명시적 `delivery.channel`
- 단순 레거시 `notify: true` webhook 폴백 작업 → 명시적 `delivery.mode="webhook"` 및 `delivery.to=cron.webhook`

Doctor는 동작을 바꾸지 않고 마이그레이션할 수 있을 때만 `notify: true` 작업을
자동 마이그레이션합니다. 작업이 레거시 notify 폴백과 기존 비-webhook delivery 모드를
함께 사용하는 경우, doctor는 경고를 출력하고 해당 작업은 수동 검토를 위해 남겨둡니다.

### 3c) 세션 잠금 정리

Doctor는 각 에이전트 세션 디렉터리를 검사하여 오래된 쓰기 잠금 파일을 찾습니다 —
세션이 비정상적으로 종료될 때 남는 파일입니다. 발견된 각 잠금 파일에 대해 다음을 보고합니다:
경로, PID, PID가 여전히 살아 있는지 여부, 잠금 경과 시간, 그리고
오래된 것으로 간주되는지 여부(죽은 PID 또는 30분 이상 경과). `--fix` / `--repair`
모드에서는 오래된 잠금 파일을 자동으로 제거하고, 그 외에는 메모를 출력한 뒤
`--fix`로 다시 실행하라고 안내합니다.

### 4) 상태 무결성 검사(세션 지속성, 라우팅 및 안전성)

상태 디렉터리는 운영의 핵심입니다. 이것이 사라지면 세션, 자격 증명, 로그,
구성을 잃게 됩니다(다른 곳에 백업이 없는 한).

Doctor 검사 항목:

- **상태 디렉터리 누락**: 치명적인 상태 손실을 경고하고, 디렉터리 재생성을 제안하며,
  누락된 데이터를 복구할 수 없음을 상기시킵니다.
- **상태 디렉터리 권한**: 쓰기 가능 여부를 확인하고, 권한 복구를 제안합니다
  (소유자/그룹 불일치가 감지되면 `chown` 힌트도 출력).
- **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는
  `~/Library/CloudStorage/...` 아래로 해석되면 경고합니다. 동기화 기반 경로는 더 느린 I/O와
  잠금/동기화 경쟁을 유발할 수 있습니다.
- **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*`
  마운트 소스로 해석되면 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션 및 자격 증명 쓰기에서
  더 느리고 마모가 더 빠를 수 있습니다.
- **세션 디렉터리 누락**: `sessions/` 및 세션 저장소 디렉터리는
  기록을 지속하고 `ENOENT` 충돌을 피하는 데 필요합니다.
- **Transcript 불일치**: 최근 세션 항목에 누락된
  transcript 파일이 있으면 경고합니다.
- **메인 세션 "1줄 JSONL"**: 메인 transcript가 한 줄만 있는 경우
  (기록이 누적되지 않음) 이를 표시합니다.
- **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 존재하거나,
  `OPENCLAW_STATE_DIR`가 다른 위치를 가리키면 경고합니다(설치 간에 기록이 분리될 수 있음).
- **원격 모드 알림**: `gateway.mode=remote`이면, doctor는
  원격 호스트에서 실행하라고 상기시킵니다(상태는 वहाँ에 있음).
- **구성 파일 권한**: `~/.openclaw/openclaw.json`이
  그룹/전체 읽기 가능이면 경고하고 `600`으로 강화하도록 제안합니다.

### 5) 모델 인증 상태(OAuth 만료)

Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이
만료 임박/만료되었을 때 경고하며, 안전한 경우 새로 고칠 수 있습니다. Anthropic
OAuth/토큰 프로필이 오래된 경우, Anthropic API 키 또는
Anthropic setup-token 경로를 제안합니다.
새로 고침 프롬프트는 대화형(TTY) 실행 시에만 표시되며, `--non-interactive`는
새로 고침 시도를 건너뜁니다.

Doctor는 또한 다음 이유로 일시적으로 사용할 수 없는 인증 프로필도 보고합니다:

- 짧은 쿨다운(요금 제한/타임아웃/인증 실패)
- 긴 비활성화(과금/크레딧 실패)

### 6) Hooks 모델 검증

`hooks.gmail.model`이 설정되어 있으면, doctor는 모델 참조를
카탈로그 및 허용 목록과 비교해 검증하고, 해결되지 않거나 허용되지 않을 경우 경고합니다.

### 7) 샌드박스 이미지 복구

샌드박싱이 활성화되면 doctor는 Docker 이미지를 검사하고,
현재 이미지가 없으면 빌드 또는 레거시 이름 전환을 제안합니다.

### 7b) 번들 플러그인 런타임 의존성

Doctor는 번들 플러그인 런타임 의존성(예:
Discord 플러그인 런타임 패키지)이 OpenClaw 설치 루트에 존재하는지 확인합니다.
누락된 항목이 있으면 doctor는 패키지를 보고하고
`openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 설치합니다.

### 8) Gateway 서비스 마이그레이션 및 정리 힌트

Doctor는 레거시 gateway 서비스(launchd/systemd/schtasks)를 감지하고,
이를 제거한 다음 현재 gateway 포트를 사용해 OpenClaw 서비스를 설치하도록 제안합니다.
추가적인 gateway 유사 서비스도 검사하고 정리 힌트를 출력할 수 있습니다.
프로필 이름이 붙은 OpenClaw gateway 서비스는 1급 시민으로 간주되며 "추가" 서비스로 표시되지 않습니다.

### 8b) 시작 시 Matrix 마이그레이션

Matrix 채널 계정에 보류 중이거나 조치 가능한 레거시 상태 마이그레이션이 있으면,
doctor는(`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 생성한 다음
최선의 노력 방식으로 마이그레이션 단계를 실행합니다: 레거시 Matrix 상태 마이그레이션과
레거시 암호화 상태 준비입니다. 두 단계 모두 치명적이지 않으며, 오류는 로그에 기록되고
시작은 계속됩니다. 읽기 전용 모드(`--fix` 없는 `openclaw doctor`)에서는 이 검사가
완전히 건너뛰어집니다.

### 9) 보안 경고

Doctor는 프로바이더가 허용 목록 없이 DM에 열려 있거나,
정책이 위험한 방식으로 구성된 경우 경고를 출력합니다.

### 10) systemd linger(Linux)

systemd 사용자 서비스로 실행 중인 경우, doctor는
로그아웃 후에도 gateway가 계속 살아 있도록 lingering이 활성화되었는지 확인합니다.

### 11) Workspace 상태(Skills, 플러그인 및 레거시 디렉터리)

Doctor는 기본 에이전트의 workspace 상태 요약을 출력합니다:

- **Skills 상태**: 사용 가능, 요구 사항 누락, 허용 목록 차단된 Skills 수를 셉니다.
- **레거시 workspace 디렉터리**: `~/openclaw` 또는 기타 레거시 workspace 디렉터리가
  현재 workspace와 함께 존재하면 경고합니다.
- **플러그인 상태**: 로드됨/비활성화/오류 플러그인 수를 셉니다. 오류가 있는 경우
  플러그인 ID를 나열하고, 번들 플러그인 capability를 보고합니다.
- **플러그인 호환성 경고**: 현재 런타임과 호환성 문제가 있는
  플러그인을 표시합니다.
- **플러그인 진단**: 플러그인 레지스트리가 로드 시 출력한 경고나 오류를
  보여줍니다.

### 11b) Bootstrap 파일 크기

Doctor는 workspace bootstrap 파일(예: `AGENTS.md`,
`CLAUDE.md` 또는 기타 주입된 컨텍스트 파일)이 구성된
문자 예산에 근접했거나 초과했는지 확인합니다. 파일별 원시 문자 수와 주입 문자 수, 잘림
비율, 잘림 원인(`max/file` 또는 `max/total`), 그리고 총 주입
문자 수를 전체 예산 대비 비율로 보고합니다. 파일이 잘렸거나 한계에 근접하면,
doctor는 `agents.defaults.bootstrapMaxChars`
및 `agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.

### 11c) 셸 자동 완성

Doctor는 현재 셸에 대해 탭 자동 완성이 설치되어 있는지 확인합니다
(zsh, bash, fish 또는 PowerShell):

- 셸 프로필이 느린 동적 자동 완성 패턴을 사용하는 경우
  (`source <(openclaw completion ...)`), doctor는 이를 더 빠른
  캐시 파일 변형으로 업그레이드합니다.
- 프로필에 자동 완성이 구성되어 있지만 캐시 파일이 없으면,
  doctor는 캐시를 자동으로 다시 생성합니다.
- 자동 완성이 전혀 구성되어 있지 않으면, doctor는 설치를 제안합니다
  (대화형 모드에서만; `--non-interactive`에서는 건너뜀).

캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

### 12) Gateway 인증 검사(로컬 토큰)

Doctor는 로컬 gateway 토큰 인증 준비 상태를 검사합니다.

- 토큰 모드에 토큰이 필요하고 토큰 소스가 없으면, doctor는 토큰 생성을 제안합니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없으면, doctor는 경고하고 이를 일반 텍스트로 덮어쓰지 않습니다.
- `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 구성되지 않은 경우에만 생성을 강제합니다.

### 12b) 읽기 전용 SecretRef 인식 복구

일부 복구 흐름은 런타임 fail-fast 동작을 약화시키지 않고 구성된 자격 증명을 검사해야 합니다.

- `openclaw doctor --fix`는 이제 상태 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용해 대상 구성 복구를 수행합니다.
- 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 사용 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
- Telegram 봇 토큰이 SecretRef로 구성되어 있지만 현재 명령 경로에서 사용할 수 없으면, doctor는 자격 증명이 구성되어 있지만 사용 불가 상태라고 보고하고, 충돌하거나 토큰이 누락된 것으로 잘못 보고하는 대신 자동 해결을 건너뜁니다.

### 13) Gateway 상태 검사 + 재시작

Doctor는 상태 검사를 실행하고 gateway가 비정상으로 보이면
재시작을 제안합니다.

### 13b) 메모리 검색 준비 상태

Doctor는 기본 에이전트에 대해 구성된 메모리 검색 임베딩 프로바이더가
준비되었는지 확인합니다. 동작은 구성된 백엔드와 프로바이더에 따라 다릅니다:

- **QMD 백엔드**: `qmd` 바이너리가 사용 가능하고 시작 가능한지 프로브합니다.
  그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 안내를 출력합니다.
- **명시적 로컬 프로바이더**: 로컬 모델 파일 또는 인식 가능한
  원격/다운로드 가능 모델 URL이 있는지 확인합니다. 없으면 원격 프로바이더로 전환을 제안합니다.
- **명시적 원격 프로바이더** (`openai`, `voyage` 등): API 키가
  환경 또는 인증 저장소에 존재하는지 확인합니다. 누락 시 실행 가능한 수정 힌트를 출력합니다.
- **자동 프로바이더**: 먼저 로컬 모델 사용 가능 여부를 확인한 다음, 자동 선택 순서대로 각 원격
  프로바이더를 시도합니다.

Gateway 프로브 결과를 사용할 수 있는 경우(gateway가 검사 시점에 정상 상태였음),
doctor는 이 결과를 CLI에서 보이는 구성과 교차 참조하고
불일치가 있으면 알려줍니다.

런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`를 사용하세요.

### 14) 채널 상태 경고

Gateway가 정상 상태이면 doctor는 채널 상태 프로브를 실행하고
제안된 수정 사항과 함께 경고를 보고합니다.

### 15) Supervisor 구성 감사 + 복구

Doctor는 설치된 supervisor 구성(launchd/systemd/schtasks)에
누락되거나 오래된 기본값이 있는지 검사합니다(예: systemd network-online 의존성과
재시작 지연). 불일치를 발견하면 업데이트를 권장하고,
현재 기본값으로 서비스 파일/작업을 다시 쓸 수 있습니다.

참고:

- `openclaw doctor`는 supervisor 구성을 다시 쓰기 전에 프롬프트를 표시합니다.
- `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
- `openclaw doctor --repair`는 프롬프트 없이 권장 수정 사항을 적용합니다.
- `openclaw doctor --repair --force`는 사용자 지정 supervisor 구성을 덮어씁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되면, doctor 서비스 설치/복구는 SecretRef를 검증하지만 해결된 일반 텍스트 토큰 값을 supervisor 서비스 환경 메타데이터에 지속 저장하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해결되지 않으면, doctor는 실행 가능한 안내와 함께 설치/복구 경로를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 모드가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
- Linux 사용자 systemd 유닛의 경우, 이제 doctor 토큰 드리프트 검사는 서비스 인증 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
- 언제든지 `openclaw gateway install --force`로 전체 다시 쓰기를 강제할 수 있습니다.

### 16) Gateway 런타임 + 포트 진단

Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고,
서비스가 설치되어 있지만 실제로 실행 중이 아니면 경고합니다. 또한 gateway 포트
(기본값 `18789`)의 충돌도 검사하고 가능한 원인(gateway가 이미 실행 중, SSH 터널)을 보고합니다.

### 17) Gateway 런타임 모범 사례

Doctor는 gateway 서비스가 Bun 또는 버전 관리형 Node 경로
(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행 중이면 경고합니다. WhatsApp + Telegram 채널은 Node가 필요하며,
버전 관리자 경로는 서비스가 셸 초기화를 로드하지 않기 때문에 업그레이드 후
깨질 수 있습니다. 사용 가능한 경우 doctor는 시스템 Node 설치(Homebrew/apt/choco)로
마이그레이션을 제안합니다.

### 18) 구성 쓰기 + wizard 메타데이터

Doctor는 모든 구성 변경 사항을 저장하고 doctor 실행을 기록하기 위해
wizard 메타데이터를 남깁니다.

### 19) Workspace 팁(백업 + 메모리 시스템)

Doctor는 workspace 메모리 시스템이 없으면 이를 제안하고, workspace가
아직 git 아래에 있지 않으면 백업 팁을 출력합니다.

workspace 구조 및 git 백업(권장: 비공개 GitHub 또는 GitLab)에 대한 전체 안내는
[/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.
