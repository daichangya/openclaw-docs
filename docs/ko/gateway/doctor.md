---
read_when:
    - Doctor 마이그레이션 추가 또는 수정하기
    - 호환되지 않는 config 변경 도입하기
summary: 'Doctor 명령: 상태 점검, config 마이그레이션 및 복구 단계'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T06:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor`는 OpenClaw용 복구 + 마이그레이션 도구입니다. 오래된
config/state를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 / 자동화

```bash
openclaw doctor --yes
```

프롬프트 없이 기본값을 수락합니다(해당하는 경우 재시작/서비스/샌드박스 복구 단계 포함).

```bash
openclaw doctor --repair
```

권장 복구를 프롬프트 없이 적용합니다(안전한 경우 복구 + 재시작).

```bash
openclaw doctor --repair --force
```

공격적인 복구도 적용합니다(사용자 지정 supervisor config 덮어쓰기).

```bash
openclaw doctor --non-interactive
```

프롬프트 없이 실행하고 안전한 마이그레이션(config 정규화 + 디스크 상태 이동)만 적용합니다. 사람의 확인이 필요한 재시작/서비스/샌드박스 작업은 건너뜁니다.
레거시 상태 마이그레이션은 감지되면 자동으로 실행됩니다.

```bash
openclaw doctor --deep
```

추가 gateway 설치를 찾기 위해 시스템 서비스(launchd/systemd/schtasks)를 검사합니다.

쓰기 전에 변경 사항을 검토하려면 먼저 config 파일을 여세요.

```bash
cat ~/.openclaw/openclaw.json
```

## 수행 작업(요약)

- git 설치용 선택적 사전 업데이트(대화형일 때만).
- UI 프로토콜 최신 상태 점검(프로토콜 스키마가 더 최신이면 Control UI 재빌드).
- 상태 점검 + 재시작 프롬프트.
- Skills 상태 요약(적격/누락/차단) 및 plugin 상태.
- 레거시 값에 대한 config 정규화.
- 레거시 평면 `talk.*` 필드를 `talk.provider` + `talk.providers.<provider>`로 옮기는 Talk config 마이그레이션.
- 레거시 Chrome 확장 config와 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 점검.
- OpenCode provider 재정의 경고(`models.providers.opencode` / `models.providers.opencode-go`).
- Codex OAuth 가림 경고(`models.providers.openai-codex`).
- OpenAI Codex OAuth 프로필용 OAuth TLS 사전 요구 사항 점검.
- 레거시 온디스크 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증).
- 레거시 plugin manifest 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` Webhook 대체 작업).
- 세션 잠금 파일 검사 및 오래된 잠금 정리.
- 상태 무결성 및 권한 점검(세션, transcript, 상태 디렉터리).
- 로컬 실행 시 config 파일 권한 점검(chmod 600).
- 모델 인증 상태: OAuth 만료 점검, 만료 임박 토큰 갱신 가능, auth-profile cooldown/비활성 상태 보고.
- 추가 워크스페이스 디렉터리 감지(`~/openclaw`).
- 샌드박싱이 활성화된 경우 샌드박스 이미지 복구.
- 레거시 서비스 마이그레이션 및 추가 gateway 감지.
- Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드에서).
- Gateway 런타임 점검(서비스는 설치되었지만 실행 중이 아님, 캐시된 launchd label).
- 채널 상태 경고(실행 중인 gateway에서 프로브됨).
- Supervisor config 감사(launchd/systemd/schtasks) 및 선택적 복구.
- Gateway 런타임 모범 사례 점검(Node vs Bun, 버전 관리자 경로).
- Gateway 포트 충돌 진단(기본값 `18789`).
- 열려 있는 DM 정책에 대한 보안 경고.
- 로컬 token 모드용 Gateway 인증 점검(token 소스가 없을 때 token 생성 제안, token SecretRef config는 덮어쓰지 않음).
- 장치 페어링 문제 감지(보류 중인 첫 페어 요청, 보류 중인 역할/범위 업그레이드, 오래된 로컬 device-token 캐시 드리프트, 페어된 기록 인증 드리프트).
- Linux의 systemd linger 점검.
- 워크스페이스 bootstrap 파일 크기 점검(컨텍스트 파일에 대한 잘림/한도 근접 경고).
- 셸 자동 완성 상태 점검 및 자동 설치/업그레이드.
- 메모리 검색 임베딩 provider 준비 상태 점검(로컬 모델, 원격 API 키, 또는 QMD 바이너리).
- 소스 설치 점검(pnpm 워크스페이스 불일치, 누락된 UI 자산, 누락된 tsx 바이너리).
- 업데이트된 config + wizard 메타데이터 작성.

## Dreams UI 백필 및 재설정

Control UI Dreams 장면에는 grounded Dreaming 워크플로를 위한 **Backfill**, **Reset**, **Clear Grounded**
작업이 포함됩니다. 이 작업들은 gateway
doctor 스타일 RPC 메서드를 사용하지만, `openclaw doctor` CLI
복구/마이그레이션의 일부는 **아닙니다**.

수행 작업:

- **Backfill**은 활성
  워크스페이스의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, grounded REM diary 패스를 실행하며, 되돌릴 수 있는 백필
  항목을 `DREAMS.md`에 씁니다.
- **Reset**은 `DREAMS.md`에서 표시된 백필 diary 항목만 제거합니다.
- **Clear Grounded**는 과거 재생에서 온
  단계적 grounded 전용 단기 항목 중 라이브 recall이나 일일 지원이 아직 누적되지 않은 것만 제거합니다.

이 작업들이 **자동으로 하지 않는 일**:

- `MEMORY.md`를 편집하지 않습니다
- 전체 doctor 마이그레이션을 실행하지 않습니다
- 명시적으로 staged CLI 경로를 먼저 실행하지 않는 한 grounded 후보를 라이브 단기
  승격 저장소에 자동으로 단계화하지 않습니다

grounded 과거 재생이 일반 deep promotion
레인에 영향을 주게 하려면 대신 CLI 흐름을 사용하세요.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

이렇게 하면 `DREAMS.md`를 검토 표면으로 유지하면서 grounded durable 후보를 단기 dreaming 저장소에 단계화합니다.

## 자세한 동작 및 근거

### 0) 선택적 업데이트(git 설치)

git 체크아웃이고 doctor가 대화형으로 실행 중이면,
doctor 실행 전에 업데이트(fetch/rebase/build)할지 제안합니다.

### 1) Config 정규화

config에 레거시 값 형태가 있으면(예: 채널별 재정의가 없는 `messages.ackReaction`)
doctor가 이를 현재
스키마로 정규화합니다.

여기에는 레거시 Talk 평면 필드도 포함됩니다. 현재 공개 Talk config는
`talk.provider` + `talk.providers.<provider>`입니다. doctor는 오래된
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 형태를 provider 맵으로 다시 씁니다.

### 2) 레거시 config 키 마이그레이션

config에 더 이상 권장되지 않는 키가 있으면 다른 명령은 실행을 거부하고
`openclaw doctor`를 실행하라고 요청합니다.

Doctor는 다음을 수행합니다.

- 어떤 레거시 키가 발견되었는지 설명
- 적용한 마이그레이션 표시
- 업데이트된 스키마로 `~/.openclaw/openclaw.json` 다시 쓰기

Gateway도 레거시 config 형식을 감지하면 시작 시 doctor 마이그레이션을 자동 실행하므로,
오래된 config는 수동 개입 없이 복구됩니다.
Cron 작업 저장소 마이그레이션은 `openclaw doctor --fix`로 처리됩니다.

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
- 이름이 지정된 `accounts`가 있지만 단일 계정 최상위 채널 값이 남아 있는 채널의 경우, 해당 계정 범위 값을 그 채널에 선택된 승격 계정으로 이동(대부분 채널은 `accounts.default`, Matrix는 기존의 일치하는 이름 지정/기본 대상을 유지할 수 있음)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` 제거(레거시 확장 relay 설정)

Doctor 경고에는 다중 계정 채널용 account-default 지침도 포함됩니다.

- 둘 이상의 `channels.<channel>.accounts` 항목이 구성되었지만 `channels.<channel>.defaultAccount` 또는 `accounts.default`가 없으면, doctor는 대체 라우팅이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
- `channels.<channel>.defaultAccount`가 알 수 없는 account ID로 설정되어 있으면, doctor는 경고하고 구성된 account ID 목록을 보여줍니다.

### 2b) OpenCode provider 재정의

`models.providers.opencode`, `opencode-zen`, 또는 `opencode-go`를
수동으로 추가하면 `@mariozechner/pi-ai`의 내장 OpenCode 카탈로그를 재정의하게 됩니다.
이로 인해 모델이 잘못된 API로 강제되거나 비용이 0으로 계산될 수 있습니다. doctor는 이를 경고하여 재정의를 제거하고 모델별 API 라우팅 + 비용을 복원할 수 있게 합니다.

### 2c) 브라우저 마이그레이션 및 Chrome MCP 준비 상태

브라우저 config가 여전히 제거된 Chrome 확장 경로를 가리키고 있다면, doctor는
이를 현재의 호스트 로컬 Chrome MCP 연결 모델로 정규화합니다.

- `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다
- `browser.relayBindHost`는 제거됩니다

또한 doctor는 `defaultProfile:
"user"` 또는 구성된 `existing-session` 프로필을 사용할 때 호스트 로컬 Chrome MCP 경로를 감사합니다.

- 기본
  자동 연결 프로필에 대해 동일 호스트에 Google Chrome이 설치되어 있는지 확인
- 감지된 Chrome 버전을 확인하고 Chrome 144
  미만이면 경고
- 브라우저 inspect 페이지에서 원격 디버깅을 활성화하라고 상기(예:
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  또는 `edge://inspect/#remote-debugging`)

Doctor는 Chrome 측 설정을 대신 활성화할 수 없습니다. 호스트 로컬 Chrome MCP는
여전히 다음이 필요합니다.

- gateway/Node 호스트에 Chromium 기반 브라우저 144+ 설치
- 브라우저가 로컬에서 실행 중일 것
- 해당 브라우저에서 원격 디버깅이 활성화될 것
- 브라우저에서 첫 연결 동의 프롬프트 승인

여기서의 준비 상태는 로컬 연결 사전 요구 사항에만 해당합니다. Existing-session은
현재 Chrome MCP 경로 제한을 유지합니다. `responsebody`, PDF
내보내기, 다운로드 가로채기, 배치 작업 같은 고급 경로는 여전히 managed
브라우저 또는 raw CDP 프로필이 필요합니다.

이 점검은 Docker, sandbox, remote-browser, 또는 기타
헤드리스 흐름에는 **적용되지 않습니다**. 이들은 계속 raw CDP를 사용합니다.

### 2d) OAuth TLS 사전 요구 사항

OpenAI Codex OAuth 프로필이 구성되어 있으면, doctor는 OpenAI
인증 엔드포인트를 프로브하여 로컬 Node/OpenSSL TLS 스택이
인증서 체인을 검증할 수 있는지 확인합니다. 프로브가 인증서 오류(예:
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서, 또는 자체 서명 인증서)로 실패하면,
doctor는 플랫폼별 수정 지침을 출력합니다. Homebrew Node를 사용하는 macOS에서는
보통 `brew postinstall ca-certificates`가 해결책입니다. `--deep`를 사용하면
gateway가 정상이어도 프로브가 실행됩니다.

### 2c) Codex OAuth provider 재정의

이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI 전송 설정을
추가했다면, 최신 릴리스가 자동으로 사용하는 내장 Codex OAuth
provider 경로를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 해당 오래된 전송 설정을
발견하면 경고하여, 오래된 전송 재정의를 제거하거나 다시 작성하고
내장 라우팅/대체 동작을 복원할 수 있게 합니다.
사용자 지정 프록시와 헤더 전용 재정의는 여전히 지원되며 이 경고를
트리거하지 않습니다.

### 3) 레거시 상태 마이그레이션(디스크 레이아웃)

Doctor는 오래된 온디스크 레이아웃을 현재 구조로 마이그레이션할 수 있습니다.

- 세션 저장소 + transcript:
  - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
- 에이전트 디렉터리:
  - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
- WhatsApp 인증 상태(Baileys):
  - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 account ID: `default`)

이 마이그레이션은 최선의 노력 방식이며 멱등적입니다. legacy 폴더를 백업으로 남겨둘 경우
doctor는 경고를 출력합니다. Gateway/CLI도 시작 시
레거시 세션 + 에이전트 디렉터리를 자동 마이그레이션하므로, 기록/인증/모델이
수동 doctor 실행 없이 에이전트별 경로에 배치됩니다. WhatsApp 인증은 의도적으로
`openclaw doctor`를 통해서만 마이그레이션됩니다. Talk provider/provider-map 정규화는 이제
구조적 동등성으로 비교하므로, 키 순서만 다른 차이로 인해
반복적인 no-op `doctor --fix` 변경이 더 이상 발생하지 않습니다.

### 3a) 레거시 Plugin manifest 마이그레이션

Doctor는 설치된 모든 Plugin manifest에서 더 이상 권장되지 않는 최상위 capability
키(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`)를 검사합니다. 발견되면 이를 `contracts`
객체로 옮기고 manifest 파일을 제자리에서 다시 쓰도록 제안합니다. 이 마이그레이션은 멱등적입니다.
`contracts` 키에 이미 같은 값이 있으면, 레거시 키는
데이터 중복 없이 제거됩니다.

### 3b) 레거시 Cron 저장소 마이그레이션

Doctor는 또한 Cron 작업 저장소(기본값 `~/.openclaw/cron/jobs.json`,
또는 재정의된 경우 `cron.store`)에서 스케줄러가 호환성을 위해 여전히
허용하는 오래된 작업 형태를 검사합니다.

현재 Cron 정리 항목:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 최상위 payload 필드(`message`, `model`, `thinking`, ...) → `payload`
- 최상위 delivery 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery 별칭 → 명시적인 `delivery.channel`
- 단순 레거시 `notify: true` Webhook 대체 작업 → 명시적인 `delivery.mode="webhook"`과 `delivery.to=cron.webhook`

Doctor는 동작을 바꾸지 않고 수행할 수 있을 때만 `notify: true` 작업을
자동 마이그레이션합니다. 작업이 레거시 notify 대체와 기존
non-webhook delivery 모드를 함께 사용하면, doctor는 경고하고 해당 작업을 수동 검토용으로 남깁니다.

### 3c) 세션 잠금 정리

Doctor는 모든 에이전트 세션 디렉터리를 스캔해 오래된 쓰기 잠금 파일을 찾습니다.
이 파일은 세션이 비정상 종료될 때 남겨집니다. 발견된 각 잠금 파일에 대해 다음을 보고합니다:
경로, PID, PID가 아직 살아 있는지, 잠금 경과 시간, 그리고
오래된 것으로 간주되는지 여부(죽은 PID이거나 30분 초과). `--fix` / `--repair`
모드에서는 오래된 잠금 파일을 자동으로 제거하고, 그렇지 않으면 메모를 출력하며
`--fix`로 다시 실행하라고 안내합니다.

### 4) 상태 무결성 점검(세션 유지, 라우팅, 안전성)

상태 디렉터리는 운영의 중추입니다. 이것이 사라지면
세션, 자격 증명, 로그, config를 잃게 됩니다(다른 곳에 백업이 없는 한).

Doctor 점검 항목:

- **상태 디렉터리 누락**: 치명적인 상태 손실을 경고하고, 디렉터리를 다시 만들 것인지 묻고,
  누락된 데이터를 복구할 수 없음을 상기시킵니다.
- **상태 디렉터리 권한**: 쓰기 가능 여부를 확인하고, 권한 복구를 제안합니다
  (소유자/그룹 불일치가 감지되면 `chown` 힌트도 출력).
- **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는
  `~/Library/CloudStorage/...` 아래로 확인되면 경고합니다. 동기화 기반 경로는 더 느린 I/O와
  잠금/동기화 경쟁을 일으킬 수 있기 때문입니다.
- **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*`
  마운트 소스로 확인되면 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션과 자격 증명 쓰기에서
  더 느리고 마모가 더 빠를 수 있기 때문입니다.
- **세션 디렉터리 누락**: `sessions/`와 세션 저장소 디렉터리는
  기록을 유지하고 `ENOENT` 충돌을 방지하는 데 필요합니다.
- **Transcript 불일치**: 최근 세션 항목에
  누락된 transcript 파일이 있으면 경고합니다.
- **메인 세션 “1-line JSONL”**: 메인 transcript가 한 줄뿐일 때 표시합니다
  (기록이 누적되지 않는 상태).
- **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 존재하거나
  `OPENCLAW_STATE_DIR`이 다른 위치를 가리키면 경고합니다
  (설치 간 기록이 분리될 수 있음).
- **원격 모드 알림**: `gateway.mode=remote`이면 doctor는
  원격 호스트에서 실행하라고 상기시킵니다(상태는 그곳에 있음).
- **Config 파일 권한**: `~/.openclaw/openclaw.json`이
  그룹/전체 읽기 가능하면 경고하고 `600`으로 강화할 것을 제안합니다.

### 5) 모델 인증 상태(OAuth 만료)

Doctor는 auth 저장소의 OAuth 프로필을 검사하여 토큰이
만료 중/만료되었는지 경고하고, 안전할 때 갱신할 수 있습니다. Anthropic
OAuth/token 프로필이 오래되었다면, Anthropic API 키 또는
Anthropic setup-token 경로를 제안합니다.
갱신 프롬프트는 대화형(TTY) 실행 시에만 나타나며, `--non-interactive`는
갱신 시도를 건너뜁니다.

OAuth 갱신이 영구적으로 실패하면(예: `refresh_token_reused`,
`invalid_grant`, 또는 provider가 다시 로그인하라고 알리는 경우), doctor는
재인증이 필요하다고 보고하고 실행할 정확한
`openclaw models auth login --provider ...` 명령을 출력합니다.

Doctor는 또한 다음 이유로 일시적으로 사용할 수 없는 auth 프로필도 보고합니다.

- 짧은 cooldown(rate limit/timeout/auth 실패)
- 더 긴 비활성화(과금/크레딧 실패)

### 6) Hooks 모델 검증

`hooks.gmail.model`이 설정되어 있으면, doctor는 해당 모델 ref를
카탈로그 및 허용 목록과 대조해 검증하고, 확인되지 않거나 허용되지 않으면 경고합니다.

### 7) 샌드박스 이미지 복구

샌드박싱이 활성화되어 있으면, doctor는 Docker 이미지를 확인하고 현재 이미지가 없을 때
빌드하거나 레거시 이름으로 전환할 것을 제안합니다.

### 7b) 번들 Plugin 런타임 의존성

Doctor는 현재 config에서 활성화되어 있거나
번들 manifest 기본값으로 활성화된 번들 Plugin에 대해서만 런타임 의존성을 확인합니다. 예:
`plugins.entries.discord.enabled: true`, 레거시
`channels.discord.enabled: true`, 또는 기본 활성화된 번들 provider.
누락된 항목이 있으면 doctor는 패키지를 보고하고
`openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 설치합니다. 외부 Plugin은 여전히
`openclaw plugins install` / `openclaw plugins update`를 사용합니다. doctor는
임의의 Plugin 경로에 대한 의존성을 설치하지 않습니다.

### 8) Gateway 서비스 마이그레이션 및 정리 힌트

Doctor는 레거시 gateway 서비스(launchd/systemd/schtasks)를 감지하고
이를 제거한 뒤 현재 gateway
포트를 사용해 OpenClaw 서비스를 설치할 것을 제안합니다. 또한 추가 gateway 유사 서비스를 검사하고 정리 힌트를 출력할 수 있습니다.
프로필 이름이 붙은 OpenClaw gateway 서비스는 1급 항목으로 취급되며 "extra"로 표시되지 않습니다.

### 8b) 시작 Matrix 마이그레이션

Matrix 채널 계정에 보류 중이거나 실행 가능한 레거시 상태 마이그레이션이 있으면,
doctor는(`--fix` / `--repair` 모드에서) 사전 마이그레이션 스냅샷을 만들고
최선의 노력 방식의 마이그레이션 단계를 실행합니다: 레거시 Matrix 상태 마이그레이션 및 레거시
암호화 상태 준비. 두 단계 모두 치명적이지 않으며, 오류는 로그에 남고
시작은 계속됩니다. 읽기 전용 모드(`--fix` 없는 `openclaw doctor`)에서는 이 점검을
완전히 건너뜁니다.

### 8c) 장치 페어링 및 인증 드리프트

Doctor는 이제 일반 상태 점검의 일부로 장치 페어링 상태를 검사합니다.

보고 항목:

- 보류 중인 첫 페어링 요청
- 이미 페어링된 장치의 보류 중인 역할 업그레이드
- 이미 페어링된 장치의 보류 중인 범위 업그레이드
- 장치 ID는 여전히 일치하지만 장치
  식별이 승인된 기록과 더 이상 일치하지 않는 경우의 공개 키 불일치 복구
- 승인된 역할에 대해 활성 token이 없는 페어링 기록
- 승인된 페어링 기준선 밖으로 범위가 벗어난 페어링 token
- 현재 머신의 로컬 캐시 device-token 항목 중
  gateway 측 token 순환 이전 것이거나 오래된 범위 메타데이터를 가진 항목

Doctor는 페어 요청을 자동 승인하거나 장치 token을 자동 순환하지 않습니다. 대신
정확한 다음 단계를 출력합니다.

- `openclaw devices list`로 보류 요청 검사
- `openclaw devices approve <requestId>`로 정확한 요청 승인
- `openclaw devices rotate --device <deviceId> --role <role>`로 새 token 순환
- `openclaw devices remove <deviceId>`로 오래된 기록 제거 후 재승인

이로써 흔한 "이미 페어링되었지만 여전히 pairing required가 나오는"
문제가 해결됩니다. doctor는 이제 첫 페어링, 보류 중인 역할/범위
업그레이드, 오래된 token/장치 식별 드리프트를 구분합니다.

### 9) 보안 경고

Doctor는 provider가 허용 목록 없이 DM에 열려 있거나
정책이 위험한 방식으로 구성된 경우 경고를 출력합니다.

### 10) systemd linger(Linux)

systemd 사용자 서비스로 실행 중이면, doctor는 로그아웃 후에도
gateway가 살아 있도록 lingering이 활성화되어 있는지 확인합니다.

### 11) 워크스페이스 상태(Skills, Plugins, 레거시 디렉터리)

Doctor는 기본 에이전트의 워크스페이스 상태 요약을 출력합니다.

- **Skills 상태**: 적격, 요구 사항 누락, 허용 목록 차단 Skills 수.
- **레거시 워크스페이스 디렉터리**: `~/openclaw` 또는 기타 레거시 워크스페이스 디렉터리가
  현재 워크스페이스와 함께 존재하면 경고합니다.
- **Plugin 상태**: 로드됨/비활성/오류 Plugin 수, 오류가 있는
  Plugin ID 목록, 번들 Plugin capability 보고.
- **Plugin 호환성 경고**: 현재 런타임과
  호환성 문제가 있는 Plugins를 표시합니다.
- **Plugin 진단**: Plugin 레지스트리가 출력한 로드 시 경고 또는 오류를
  표시합니다.

### 11b) Bootstrap 파일 크기

Doctor는 워크스페이스 bootstrap 파일(예: `AGENTS.md`,
`CLAUDE.md`, 또는 기타 주입된 컨텍스트 파일)이 구성된
문자 예산에 근접하거나 초과하는지 검사합니다. 파일별 raw 대 injected 문자 수, 잘림
비율, 잘림 원인(`max/file` 또는 `max/total`), 총 주입 문자 수를
전체 예산 대비 비율로 보고합니다. 파일이 잘렸거나 한도에 가까우면
doctor는 `agents.defaults.bootstrapMaxChars` 및
`agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.

### 11c) 셸 자동 완성

Doctor는 현재 셸
(zsh, bash, fish, 또는 PowerShell)에 탭 자동 완성이 설치되어 있는지 확인합니다.

- 셸 프로필이 느린 동적 자동 완성 패턴
  (`source <(openclaw completion ...)`)을 사용하면, doctor는 이를 더 빠른
  캐시 파일 변형으로 업그레이드합니다.
- 프로필에 자동 완성이 구성되어 있지만 캐시 파일이 없으면,
  doctor는 자동으로 캐시를 다시 생성합니다.
- 자동 완성이 전혀 구성되어 있지 않으면, doctor는 설치할지 묻습니다
  (대화형 모드에서만, `--non-interactive`이면 건너뜀).

캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

### 12) Gateway 인증 점검(로컬 token)

Doctor는 로컬 gateway token 인증 준비 상태를 점검합니다.

- token 모드에 token이 필요하고 token 소스가 없으면, doctor는 생성할 것을 제안합니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없으면, doctor는 경고하고 이를 평문으로 덮어쓰지 않습니다.
- `openclaw doctor --generate-gateway-token`은 token SecretRef가 구성되지 않았을 때만 생성을 강제합니다.

### 12b) 읽기 전용 SecretRef 인식 복구

일부 복구 흐름은 런타임 fail-fast 동작을 약화시키지 않으면서
구성된 자격 증명을 검사해야 합니다.

- `openclaw doctor --fix`는 이제 대상 config 복구를 위해 status 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
- 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 가능할 때 구성된 봇 자격 증명을 사용하려고 시도합니다.
- Telegram 봇 token이 SecretRef로 구성되어 있지만 현재 명령 경로에서 사용할 수 없으면, doctor는 자격 증명이 configured-but-unavailable 상태라고 보고하고, 충돌하거나 token이 없는 것으로 잘못 보고하는 대신 자동 확인을 건너뜁니다.

### 13) Gateway 상태 점검 + 재시작

Doctor는 상태 점검을 실행하고 gateway가
비정상으로 보이면 재시작을 제안합니다.

### 13b) 메모리 검색 준비 상태

Doctor는 기본 에이전트에 대해 구성된 메모리 검색 임베딩 provider가 준비되었는지
점검합니다. 동작은 구성된 백엔드와 provider에 따라 달라집니다.

- **QMD 백엔드**: `qmd` 바이너리를 사용할 수 있고 시작 가능한지 프로브합니다.
  그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 지침을 출력합니다.
- **명시적 로컬 provider**: 로컬 모델 파일 또는 인식되는
  원격/다운로드 가능한 모델 URL이 있는지 확인합니다. 없으면 원격 provider로 전환할 것을 제안합니다.
- **명시적 원격 provider** (`openai`, `voyage` 등): 환경 또는 auth 저장소에 API 키가
  있는지 확인합니다. 없으면 실행 가능한 수정 힌트를 출력합니다.
- **자동 provider**: 먼저 로컬 모델 사용 가능 여부를 확인한 다음 자동 선택 순서에 따라 각 원격
  provider를 시도합니다.

gateway 프로브 결과를 사용할 수 있으면(점검 시점에 gateway가 정상이었을 경우),
doctor는 해당 결과를 CLI에서 보이는 config와 교차 확인하고
불일치가 있으면 기록합니다.

런타임 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`를 사용하세요.

### 14) 채널 상태 경고

gateway가 정상이면 doctor는 채널 상태 프로브를 실행하고
수정 제안과 함께 경고를 보고합니다.

### 15) Supervisor config 감사 + 복구

Doctor는 설치된 supervisor config(launchd/systemd/schtasks)에서
누락되었거나 오래된 기본값(예: systemd network-online 의존성 및
재시작 지연)을 확인합니다. 불일치를 발견하면 업데이트를 권장하고
서비스 파일/작업을 현재 기본값으로 다시 쓸 수 있습니다.

참고:

- `openclaw doctor`는 supervisor config를 다시 쓰기 전에 프롬프트를 표시합니다.
- `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
- `openclaw doctor --repair`는 프롬프트 없이 권장 수정을 적용합니다.
- `openclaw doctor --repair --force`는 사용자 지정 supervisor config를 덮어씁니다.
- token 인증에 token이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor 서비스 설치/복구는 SecretRef를 검증하지만 확인된 평문 token 값을 supervisor 서비스 환경 메타데이터에 영속 저장하지는 않습니다.
- token 인증에 token이 필요하고 구성된 token SecretRef가 확인되지 않으면, doctor는 실행 가능한 지침과 함께 설치/복구 경로를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않으면, doctor는 mode가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
- Linux user-systemd unit의 경우, doctor token 드리프트 점검은 이제 서비스 인증 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
- 언제든 `openclaw gateway install --force`로 전체 다시 쓰기를 강제할 수 있습니다.

### 16) Gateway 런타임 + 포트 진단

Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고
서비스가 설치되었지만 실제로 실행 중이 아니면 경고합니다. 또한 gateway 포트
(기본값 `18789`)의 포트 충돌을 확인하고 가능한 원인(gateway가 이미 실행 중,
SSH 터널)을 보고합니다.

### 17) Gateway 런타임 모범 사례

Doctor는 gateway 서비스가 Bun 또는 버전 관리자 Node 경로
(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행 중이면 경고합니다. WhatsApp + Telegram 채널에는 Node가 필요하고,
버전 관리자 경로는 서비스가 셸 init을 로드하지 않기 때문에 업그레이드 후 문제가 생길 수 있습니다.
가능한 경우 doctor는 시스템 Node 설치(Homebrew/apt/choco)로의 마이그레이션을 제안합니다.

### 18) Config 쓰기 + wizard 메타데이터

Doctor는 모든 config 변경을 영속 저장하고 doctor 실행을 기록하기 위해
wizard 메타데이터를 표시합니다.

### 19) 워크스페이스 팁(백업 + 메모리 시스템)

Doctor는 워크스페이스 메모리 시스템이 없으면 이를 제안하고,
워크스페이스가 아직 git 아래에 있지 않다면 백업 팁을 출력합니다.

워크스페이스 구조와 git 백업(권장: 비공개 GitHub 또는 GitLab)에 대한 전체 가이드는
[/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.

## 관련

- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [Gateway runbook](/ko/gateway)
