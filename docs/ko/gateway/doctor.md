---
read_when:
    - Doctor 마이그레이션 추가 또는 수정
    - 호환성이 깨지는 구성 변경 도입
summary: 'Doctor 명령: 상태 점검, 구성 마이그레이션, 그리고 복구 단계'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T06:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`는 OpenClaw용 복구 + 마이그레이션 도구입니다. 오래된
구성/상태를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 / 자동화

```bash
openclaw doctor --yes
```

프롬프트 없이 기본값을 수락합니다(적용 가능한 경우 재시작/서비스/샌드박스 복구 단계 포함).

```bash
openclaw doctor --repair
```

권장 복구를 프롬프트 없이 적용합니다(안전한 경우 복구 + 재시작 포함).

```bash
openclaw doctor --repair --force
```

공격적인 복구도 적용합니다(사용자 지정 supervisor 구성을 덮어씀).

```bash
openclaw doctor --non-interactive
```

프롬프트 없이 실행하고 안전한 마이그레이션만 적용합니다(구성 정규화 + 디스크 상태 이동). 사람의 확인이 필요한 재시작/서비스/샌드박스 작업은 건너뜁니다.
레거시 상태 마이그레이션은 감지되면 자동으로 실행됩니다.

```bash
openclaw doctor --deep
```

추가 Gateway 설치를 찾기 위해 시스템 서비스(launchd/systemd/schtasks)를 검사합니다.

쓰기 전에 변경 사항을 검토하려면 먼저 구성 파일을 여세요:

```bash
cat ~/.openclaw/openclaw.json
```

## 수행하는 작업(요약)

- git 설치용 선택적 사전 업데이트(대화형 전용)
- UI 프로토콜 최신 상태 점검(프로토콜 스키마가 더 최신이면 Control UI 재빌드)
- 상태 점검 + 재시작 프롬프트
- Skills 상태 요약(적격/누락/차단) 및 Plugin 상태
- 레거시 값에 대한 구성 정규화
- 레거시 평면 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로의 Talk 구성 마이그레이션
- 레거시 Chrome 확장 구성 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 점검
- OpenCode provider override 경고(`models.providers.opencode` / `models.providers.opencode-go`)
- Codex OAuth shadowing 경고(`models.providers.openai-codex`)
- OpenAI Codex OAuth 프로필용 OAuth TLS 선행 조건 점검
- 레거시 디스크 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증)
- 레거시 Plugin 매니페스트 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
- 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` Webhook fallback 작업)
- 세션 잠금 파일 검사 및 오래된 잠금 정리
- 상태 무결성 및 권한 점검(세션, transcript, 상태 디렉터리)
- 로컬 실행 시 구성 파일 권한 점검(`chmod 600`)
- 모델 인증 상태: OAuth 만료 점검, 만료 임박 토큰 새로 고침 가능, auth-profile cooldown/비활성화 상태 보고
- 추가 워크스페이스 디렉터리 감지(`~/openclaw`)
- 샌드박싱이 활성화된 경우 샌드박스 이미지 복구
- 레거시 서비스 마이그레이션 및 추가 Gateway 감지
- Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드에서)
- Gateway 런타임 점검(서비스는 설치되었지만 실행 중이 아님, 캐시된 launchd 레이블)
- 채널 상태 경고(실행 중인 Gateway에서 프로브)
- supervisor 구성 감사(launchd/systemd/schtasks) 및 선택적 복구
- Gateway 런타임 모범 사례 점검(Node vs Bun, 버전 관리자 경로)
- Gateway 포트 충돌 진단(기본값 `18789`)
- 열린 DM 정책에 대한 보안 경고
- 로컬 토큰 모드용 Gateway 인증 점검(토큰 소스가 없을 때 토큰 생성 제안, token SecretRef 구성은 덮어쓰지 않음)
- 디바이스 페어링 문제 감지(보류 중인 최초 페어 요청, 보류 중인 role/scope 업그레이드, 오래된 로컬 device-token 캐시 불일치, 페어링된 기록 인증 불일치)
- Linux에서 systemd linger 점검
- 워크스페이스 bootstrap 파일 크기 점검(잘림/한계 근접 경고)
- 셸 completion 상태 점검 및 자동 설치/업그레이드
- 메모리 검색 임베딩 provider 준비 상태 점검(로컬 모델, 원격 API 키, 또는 QMD 바이너리)
- 소스 설치 점검(pnpm 워크스페이스 불일치, 누락된 UI 에셋, 누락된 tsx 바이너리)
- 업데이트된 구성 + wizard 메타데이터 기록

## Dreams UI backfill 및 reset

Control UI Dreams 장면에는 grounded dreaming 워크플로를 위한 **Backfill**, **Reset**, 그리고 **Clear Grounded**
작업이 포함됩니다. 이 작업들은 Gateway
doctor 스타일 RPC 메서드를 사용하지만 `openclaw doctor` CLI
복구/마이그레이션의 일부는 **아닙니다**.

수행하는 작업:

- **Backfill**은 활성
  워크스페이스의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, grounded REM diary 패스를 실행하며, 되돌릴 수 있는 backfill
  항목을 `DREAMS.md`에 기록합니다.
- **Reset**은 `DREAMS.md`에서 표시된 backfill diary 항목만 제거합니다.
- **Clear Grounded**는 과거 재생에서
  생성되었고 아직 live recall이나 daily
  support가 누적되지 않은 staged grounded-only 단기 항목만 제거합니다.

자동으로 수행하지 않는 작업:

- `MEMORY.md`는 수정하지 않습니다
- 전체 doctor 마이그레이션은 실행하지 않습니다
- 먼저 staged CLI 경로를 명시적으로 실행하지 않는 한 grounded candidate를 live short-term
  promotion 저장소에 자동으로 stage하지 않습니다

grounded 과거 재생이 일반적인 deep promotion
lane에 영향을 주게 하려면 대신 다음 CLI 흐름을 사용하세요:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

이렇게 하면 `DREAMS.md`를 검토 surface로 유지하면서
grounded durable candidate를 short-term dreaming 저장소에 stage합니다.

## 자세한 동작 및 근거

### 0) 선택적 업데이트(git 설치)

git checkout이고 doctor가 대화형으로 실행 중이면,
doctor를 실행하기 전에 업데이트(fetch/rebase/build)를 제안합니다.

### 1) 구성 정규화

구성에 레거시 값 형태가 포함되어 있으면(예: 채널별 override가 없는 `messages.ackReaction`)
doctor가 이를 현재
스키마에 맞게 정규화합니다.

여기에는 레거시 Talk 평면 필드도 포함됩니다. 현재 공개 Talk 구성은
`talk.provider` + `talk.providers.<provider>`입니다. doctor는 기존
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 형태를 provider 맵으로 다시 작성합니다.

### 2) 레거시 구성 키 마이그레이션

구성에 더 이상 사용되지 않는 키가 있으면, 다른 명령은 실행을 거부하고
`openclaw doctor`를 실행하라고 안내합니다.

Doctor는 다음을 수행합니다:

- 어떤 레거시 키가 발견되었는지 설명합니다.
- 적용한 마이그레이션을 보여줍니다.
- 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

Gateway도 레거시 구성 형식을 감지하면 시작 시
doctor 마이그레이션을 자동으로 실행하므로, 오래된 구성은 수동 개입 없이 복구됩니다.
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
- 이름 있는 `accounts`가 있지만 단일 account용 최상위 채널 값이 남아 있는 채널의 경우, 해당 account 범위 값을 해당 채널에 대해 선택된 승격 대상 account로 이동(`accounts.default`가 대부분 채널의 기본값이며, Matrix는 기존에 일치하는 named/default 대상을 유지할 수 있음)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` 제거(레거시 확장 relay 설정)

Doctor 경고에는 다중 account 채널에 대한 account 기본값 안내도 포함됩니다:

- 둘 이상의 `channels.<channel>.accounts` 항목이 구성되어 있지만 `channels.<channel>.defaultAccount` 또는 `accounts.default`가 없으면, fallback 라우팅이 예상치 못한 account를 선택할 수 있다고 doctor가 경고합니다.
- `channels.<channel>.defaultAccount`가 알 수 없는 account ID로 설정되어 있으면, doctor가 경고하고 구성된 account ID 목록을 표시합니다.

### 2b) OpenCode provider override

`models.providers.opencode`, `opencode-zen`, 또는 `opencode-go`를
수동으로 추가했다면, 이는 `@mariozechner/pi-ai`의 내장 OpenCode 카탈로그를 override합니다.
이로 인해 모델이 잘못된 API로 강제되거나 비용이 0으로 표시될 수 있습니다. Doctor는
override를 제거하고 모델별 API 라우팅 + 비용을 복원할 수 있도록 경고합니다.

### 2c) 브라우저 마이그레이션 및 Chrome MCP 준비 상태

브라우저 구성이 여전히 제거된 Chrome 확장 경로를 가리키는 경우, doctor는
이를 현재의 호스트 로컬 Chrome MCP 연결 모델로 정규화합니다:

- `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다
- `browser.relayBindHost`는 제거됩니다

또한 doctor는 `defaultProfile:
"user"` 또는 구성된 `existing-session` 프로필을 사용할 때 호스트 로컬 Chrome MCP 경로를 감사합니다:

- 기본
  자동 연결 프로필용으로 같은 호스트에 Google Chrome이 설치되어 있는지 확인
- 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고
- 브라우저 inspect 페이지에서 원격 디버깅을 활성화하라고 안내
  (예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  또는 `edge://inspect/#remote-debugging`)

Doctor는 이 Chrome 측 설정을 대신 활성화할 수 없습니다. 호스트 로컬 Chrome MCP는
여전히 다음이 필요합니다:

- Gateway/node 호스트에 Chromium 기반 브라우저 144+
- 브라우저가 로컬에서 실행 중이어야 함
- 해당 브라우저에서 원격 디버깅이 활성화되어 있어야 함
- 브라우저에서 최초 연결 동의 프롬프트를 승인해야 함

여기서의 준비 상태는 로컬 연결 선행 조건만을 의미합니다. Existing-session은
현재 Chrome MCP 경로 제한을 유지하며, `responsebody`, PDF
내보내기, 다운로드 가로채기, 배치 작업 같은 고급 경로는 여전히 관리형
브라우저 또는 원시 CDP 프로필이 필요합니다.

이 점검은 Docker, 샌드박스, remote-browser, 또는 기타
헤드리스 흐름에는 **적용되지 않습니다**. 이러한 경우는 계속 원시 CDP를 사용합니다.

### 2d) OAuth TLS 선행 조건

OpenAI Codex OAuth 프로필이 구성된 경우, doctor는 OpenAI
인증 엔드포인트를 프로브하여 로컬 Node/OpenSSL TLS 스택이
인증서 체인을 검증할 수 있는지 확인합니다. 프로브가 인증서 오류로 실패하면(예:
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서, 또는 자체 서명된 인증서),
doctor는 플랫폼별 수정 안내를 출력합니다. Homebrew Node를 사용하는 macOS에서는
수정 방법이 보통 `brew postinstall ca-certificates`입니다. `--deep`를 사용하면
Gateway가 정상 상태여도 프로브가 실행됩니다.

### 2c) Codex OAuth provider override

이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI 전송 설정을 추가했다면,
이 설정이 최신 릴리스에서 자동으로 사용하는 내장 Codex OAuth
provider 경로를 가릴 수 있습니다. Doctor는
이전 전송 설정이 Codex OAuth와 함께 있는 것을 감지하면 경고를 표시하여,
오래된 전송 override를 제거하거나 다시 작성하고
내장 라우팅/fallback 동작을 복구할 수 있게 합니다.
사용자 지정 프록시와 헤더 전용 override는 계속 지원되며
이 경고를 트리거하지 않습니다.

### 3) 레거시 상태 마이그레이션(디스크 레이아웃)

Doctor는 오래된 디스크 레이아웃을 현재 구조로 마이그레이션할 수 있습니다:

- 세션 저장소 + transcript:
  - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
- 에이전트 디렉터리:
  - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
- WhatsApp 인증 상태(Baileys):
  - 레거시 `~/.openclaw/credentials/*.json` (`oauth.json` 제외)에서
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`로 (기본 account id: `default`)

이 마이그레이션은 best-effort 및 idemponent 방식으로 수행되며, doctor는
백업으로 레거시 폴더가 남아 있을 경우 경고를 출력합니다. Gateway/CLI도
시작 시 레거시 세션 + 에이전트 디렉터리를 자동 마이그레이션하므로, 기록/인증/모델이
수동 doctor 실행 없이 agent별 경로로 이동합니다. WhatsApp 인증은 의도적으로
`openclaw doctor`를 통해서만 마이그레이션됩니다. 이제 Talk provider/provider-map 정규화는
구조적 동등성으로 비교하므로, 키 순서만 다른 차이로는 반복적인
실질 변화 없는 `doctor --fix` 변경이 더 이상 발생하지 않습니다.

### 3a) 레거시 Plugin 매니페스트 마이그레이션

Doctor는 설치된 모든 Plugin 매니페스트를 검사하여 더 이상 사용되지 않는 최상위 capability
키(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`)를 찾습니다. 발견되면 이를 `contracts`
객체로 이동하고 매니페스트 파일을 제자리에서 다시 쓰도록 제안합니다. 이 마이그레이션은 idemponent합니다.
`contracts` 키에 이미 같은 값이 있으면, 데이터를 중복하지 않고
레거시 키만 제거됩니다.

### 3b) 레거시 Cron 저장소 마이그레이션

Doctor는 또한 Cron 작업 저장소(기본값 `~/.openclaw/cron/jobs.json`,
또는 override된 경우 `cron.store`)를 검사하여 스케줄러가
호환성을 위해 여전히 허용하는 오래된 작업 형태를 찾습니다.

현재 Cron 정리 항목은 다음과 같습니다:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 최상위 payload 필드(`message`, `model`, `thinking`, ...) → `payload`
- 최상위 delivery 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery 별칭 → 명시적 `delivery.channel`
- 단순 레거시 `notify: true` Webhook fallback 작업 → 명시적 `delivery.mode="webhook"` 및 `delivery.to=cron.webhook`

Doctor는 동작을 변경하지 않고 수행할 수 있을 때만 `notify: true` 작업을 자동 마이그레이션합니다.
작업이 레거시 notify fallback과 기존
비-Webhook delivery 모드를 함께 사용하면, doctor는 경고를 출력하고 해당 작업은
수동 검토를 위해 그대로 둡니다.

### 3c) 세션 잠금 정리

Doctor는 모든 에이전트 세션 디렉터리를 검사하여 오래된 쓰기 잠금 파일을 찾습니다 —
세션이 비정상 종료될 때 남겨지는 파일입니다. 발견된 각 잠금 파일에 대해 다음을 보고합니다:
경로, PID, 해당 PID가 아직 살아 있는지 여부, 잠금 경과 시간, 그리고
오래된 것으로 간주되는지 여부(죽은 PID 또는 30분 이상 경과). `--fix` / `--repair`
모드에서는 오래된 잠금 파일을 자동으로 제거하고, 그렇지 않으면 메모를 출력하고
`--fix`로 다시 실행하라고 안내합니다.

### 4) 상태 무결성 점검(세션 지속성, 라우팅, 안전성)

상태 디렉터리는 운영상의 중추입니다. 이 디렉터리가 사라지면,
세션, 자격 증명, 로그, 그리고 구성도 잃게 됩니다(다른 곳에 백업이 없다면).

Doctor는 다음을 점검합니다:

- **상태 디렉터리 누락**: 치명적인 상태 손실을 경고하고, 디렉터리 재생성을 제안하며,
  누락된 데이터를 복구할 수 없음을 상기시킵니다.
- **상태 디렉터리 권한**: 쓰기 가능 여부를 확인하고, 권한 복구를 제안합니다
  (소유자/그룹 불일치가 감지되면 `chown` 힌트도 출력).
- **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는
  `~/Library/CloudStorage/...` 아래로 해석되면 경고합니다. 동기화 기반 경로는 더 느린 I/O와
  잠금/동기화 경쟁을 유발할 수 있기 때문입니다.
- **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*`
  마운트 소스로 해석되면 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는
  세션 및 자격 증명 쓰기에서 더 느리고 마모가 빠를 수 있기 때문입니다.
- **세션 디렉터리 누락**: `sessions/`와 세션 저장소 디렉터리는
  기록을 유지하고 `ENOENT` 충돌을 방지하는 데 필요합니다.
- **transcript 불일치**: 최근 세션 항목에 누락된
  transcript 파일이 있으면 경고합니다.
- **메인 세션 “1-line JSONL”**: 메인 transcript가 한 줄뿐이면
  기록이 누적되지 않고 있음을 표시합니다.
- **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 존재하거나
  `OPENCLAW_STATE_DIR`이 다른 위치를 가리키면 경고합니다(설치 간에 기록이
  분리될 수 있음).
- **원격 모드 알림**: `gateway.mode=remote`인 경우 doctor는
  원격 호스트에서 실행하라고 알려줍니다(상태는 그곳에 있음).
- **구성 파일 권한**: `~/.openclaw/openclaw.json`이
  그룹/전체 읽기 가능이면 경고하고 `600`으로 제한하도록 제안합니다.

### 5) 모델 인증 상태(OAuth 만료)

Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이
곧 만료되거나 이미 만료되었을 때 경고하며, 안전한 경우 새로 고칠 수 있습니다. Anthropic
OAuth/토큰 프로필이 오래되었다면 Anthropic API 키 또는
Anthropic setup-token 경로를 제안합니다.
새로 고침 프롬프트는 대화형(TTY)으로 실행할 때만 표시되며, `--non-interactive`는
새로 고침 시도를 건너뜁니다.

OAuth 새로 고침이 영구적으로 실패하면(예: `refresh_token_reused`,
`invalid_grant`, 또는 provider가 다시 로그인하라고 알리는 경우),
doctor는 재인증이 필요하다고 보고하고 실행해야 할 정확한
`openclaw models auth login --provider ...` 명령을 출력합니다.

Doctor는 또한 다음 이유로 일시적으로 사용할 수 없는 auth profile도 보고합니다:

- 짧은 cooldown(속도 제한/시간 초과/인증 실패)
- 더 긴 비활성화(청구/크레딧 실패)

### 6) Hooks 모델 검증

`hooks.gmail.model`이 설정되어 있으면, doctor는 해당 모델 참조를
카탈로그 및 허용 목록과 대조해 검증하고, 해석되지 않거나 허용되지 않을 경우 경고합니다.

### 7) 샌드박스 이미지 복구

샌드박싱이 활성화된 경우 doctor는 Docker 이미지를 확인하고,
현재 이미지가 누락된 경우 빌드하거나 레거시 이름으로 전환하도록 제안합니다.

### 7b) 번들 Plugin 런타임 의존성

Doctor는 현재 구성에서 활성 상태이거나
번들 매니페스트 기본값으로 활성화된 번들 Plugin에 대해서만 런타임 의존성을 확인합니다. 예를 들어
`plugins.entries.discord.enabled: true`, 레거시
`channels.discord.enabled: true`, 또는 기본 활성화된 번들 provider 등이 해당합니다. 누락된 항목이 있으면
doctor는 패키지를 보고하고
`openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 이를 설치합니다. 외부 Plugin은 여전히
`openclaw plugins install` / `openclaw plugins update`를 사용합니다. doctor는
임의의 Plugin 경로에 대한 의존성은 설치하지 않습니다.

### 8) Gateway 서비스 마이그레이션 및 정리 힌트

Doctor는 레거시 Gateway 서비스(launchd/systemd/schtasks)를 감지하고
이를 제거한 뒤 현재 Gateway
포트를 사용하는 OpenClaw 서비스를 설치하도록 제안합니다. 또한 추가적인 Gateway 유사 서비스를 스캔하고 정리 힌트를 출력할 수 있습니다.
프로필 이름이 붙은 OpenClaw Gateway 서비스는 1급 항목으로 간주되며 "extra"로 표시되지 않습니다.

### 8b) 시작 시 Matrix 마이그레이션

Matrix 채널 account에 보류 중이거나 조치 가능한 레거시 상태 마이그레이션이 있으면,
doctor(`--fix` / `--repair` 모드에서)는 사전 마이그레이션 스냅샷을 생성한 다음
best-effort 마이그레이션 단계를 실행합니다: 레거시 Matrix 상태 마이그레이션 및 레거시
암호화 상태 준비. 두 단계 모두 치명적이지 않으며, 오류는 기록되고
시작은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사가
완전히 건너뛰어집니다.

### 8c) 디바이스 페어링 및 인증 불일치

Doctor는 이제 일반 상태 점검의 일부로 디바이스 페어링 상태를 검사합니다.

보고하는 항목:

- 보류 중인 최초 페어링 요청
- 이미 페어링된 디바이스에 대한 보류 중인 role 업그레이드
- 이미 페어링된 디바이스에 대한 보류 중인 scope 업그레이드
- 디바이스 id는 여전히 일치하지만 디바이스
  identity가 더 이상 승인된 기록과 일치하지 않는 경우의 공개 키 불일치 복구
- 승인된 role에 대해 활성 토큰이 없는 페어링된 기록
- 승인된 페어링 기준선 밖으로 scope가 벗어난 페어링된 토큰
- Gateway 측 토큰 순환 이전의 상태이거나 오래된 scope 메타데이터를 가진,
  현재 머신에 대한 로컬 캐시 device-token 항목

Doctor는 페어링 요청을 자동 승인하거나 디바이스 토큰을 자동 순환하지 않습니다.
대신 정확한 다음 단계를 출력합니다:

- `openclaw devices list`로 보류 중 요청 검사
- `openclaw devices approve <requestId>`로 정확한 요청 승인
- `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 순환
- `openclaw devices remove <deviceId>`로 오래된 기록 제거 후 다시 승인

이로써 흔한 “이미 페어링되었는데도 계속 pairing required가 뜨는”
문제를 해결합니다. 이제 doctor는 최초 페어링과 보류 중인 role/scope
업그레이드, 그리고 오래된 토큰/디바이스 identity 불일치를 구분합니다.

### 9) 보안 경고

Doctor는 provider가 허용 목록 없이 DM에 열려 있거나,
정책이 위험한 방식으로 구성된 경우 경고를 출력합니다.

### 10) systemd linger(Linux)

systemd 사용자 서비스로 실행 중이면 doctor는
로그아웃 후에도 Gateway가 살아 있도록 lingering이 활성화되어 있는지 확인합니다.

### 11) 워크스페이스 상태(Skills, Plugins, 레거시 디렉터리)

Doctor는 기본 에이전트의 워크스페이스 상태 요약을 출력합니다:

- **Skills 상태**: 적격, 요구 사항 누락, 허용 목록 차단 Skills 수
- **레거시 워크스페이스 디렉터리**: `~/openclaw` 또는 기타 레거시 워크스페이스 디렉터리가
  현재 워크스페이스와 함께 존재하면 경고
- **Plugin 상태**: 로드됨/비활성화됨/오류 Plugin 수, 오류가 있는
  Plugin의 Plugin ID 목록, 번들 Plugin capability 보고
- **Plugin 호환성 경고**: 현재 런타임과 호환성 문제가 있는
  Plugin 표시
- **Plugin 진단**: Plugin 레지스트리에서 출력한 로드 시점 경고 또는 오류 표시

### 11b) Bootstrap 파일 크기

Doctor는 워크스페이스 bootstrap 파일(예: `AGENTS.md`,
`CLAUDE.md`, 또는 기타 주입된 컨텍스트 파일)이 구성된
문자 예산에 근접했거나 초과했는지 점검합니다. 파일별 원시 문자 수와 주입된 문자 수, 잘림
비율, 잘림 원인(`max/file` 또는 `max/total`), 그리고 총 예산 대비 전체 주입
문자 수를 보고합니다. 파일이 잘렸거나 한계에 근접하면
doctor는 `agents.defaults.bootstrapMaxChars`
및 `agents.defaults.bootstrapTotalMaxChars`를 조정하는 팁을 출력합니다.

### 11c) 셸 completion

Doctor는 현재 셸
(zsh, bash, fish, 또는 PowerShell)에 탭 completion이 설치되어 있는지 점검합니다:

- 셸 프로필이 느린 동적 completion 패턴을 사용하면
  (`source <(openclaw completion ...)`), doctor는 이를 더 빠른
  캐시 파일 방식으로 업그레이드합니다.
- 프로필에 completion이 구성되어 있지만 캐시 파일이 없으면,
  doctor는 캐시를 자동으로 다시 생성합니다.
- completion이 전혀 구성되어 있지 않으면, doctor는 설치 여부를 묻습니다
  (대화형 모드에서만, `--non-interactive`에서는 건너뜀).

캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

### 12) Gateway 인증 점검(로컬 토큰)

Doctor는 로컬 Gateway 토큰 인증 준비 상태를 점검합니다.

- 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면, doctor는 토큰 생성을 제안합니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없으면, doctor는 경고하고 이를 일반 텍스트로 덮어쓰지 않습니다.
- `openclaw doctor --generate-gateway-token`은 token SecretRef가 구성되어 있지 않을 때만 생성을 강제합니다.

### 12b) 읽기 전용 SecretRef 인지형 복구

일부 복구 흐름은 런타임 fail-fast 동작을 약화시키지 않으면서 구성된 자격 증명을 검사해야 합니다.

- `openclaw doctor --fix`는 이제 대상 구성 복구를 위해 status 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
- 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 사용 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
- Telegram 봇 토큰이 SecretRef를 통해 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 해당 자격 증명이 구성되어 있지만 현재 사용할 수 없다고 보고하고, 크래시를 일으키거나 토큰이 누락된 것으로 잘못 보고하는 대신 자동 해석을 건너뜁니다.

### 13) Gateway 상태 점검 + 재시작

Doctor는 상태 점검을 실행하고 Gateway 상태가
비정상으로 보이면 재시작을 제안합니다.

### 13b) 메모리 검색 준비 상태

Doctor는 기본 에이전트에 대해 구성된 메모리 검색 임베딩 provider가 준비되었는지
점검합니다. 동작은 구성된 백엔드와 provider에 따라 달라집니다:

- **QMD 백엔드**: `qmd` 바이너리가 사용 가능하고 시작 가능한지 프로브합니다.
  그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 안내를 출력합니다.
- **명시적 로컬 provider**: 로컬 모델 파일 또는 인식 가능한
  원격/다운로드 가능한 모델 URL이 있는지 점검합니다. 없으면 원격 provider로 전환하라고 제안합니다.
- **명시적 원격 provider** (`openai`, `voyage` 등): 환경 변수 또는 auth 저장소에 API 키가
  있는지 확인합니다. 없으면 실행 가능한 수정 힌트를 출력합니다.
- **자동 provider**: 먼저 로컬 모델 사용 가능 여부를 확인한 다음, 자동 선택 순서대로 각 원격
  provider를 시도합니다.

Gateway 프로브 결과를 사용할 수 있는 경우(점검 시점에 Gateway가 정상 상태였을 때),
doctor는 해당 결과를 CLI에서 볼 수 있는 구성과 교차 확인하고
불일치가 있으면 이를 알립니다.

런타임 시 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`를 사용하세요.

### 14) 채널 상태 경고

Gateway가 정상 상태이면 doctor는 채널 상태 프로브를 실행하고
제안되는 수정과 함께 경고를 보고합니다.

### 15) supervisor 구성 감사 + 복구

Doctor는 설치된 supervisor 구성(launchd/systemd/schtasks)에서
누락되었거나 오래된 기본값(예: systemd network-online 의존성 및
재시작 지연)을 점검합니다. 불일치를 발견하면 업데이트를 권장하고,
서비스 파일/작업을 현재 기본값으로 다시 쓸 수 있습니다.

참고:

- `openclaw doctor`는 supervisor 구성을 다시 쓰기 전에 프롬프트를 표시합니다.
- `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
- `openclaw doctor --repair`는 프롬프트 없이 권장 수정을 적용합니다.
- `openclaw doctor --repair --force`는 사용자 지정 supervisor 구성을 덮어씁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor 서비스 설치/복구는 SecretRef를 검증하지만 해석된 일반 텍스트 토큰 값을 supervisor 서비스 환경 메타데이터에 영구 저장하지는 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 token SecretRef가 해석되지 않으면, doctor는 실행 가능한 안내와 함께 설치/복구 경로를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 mode가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
- Linux user-systemd unit의 경우, doctor의 토큰 불일치 점검은 이제 서비스 인증 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
- 언제든지 `openclaw gateway install --force`로 전체 다시 쓰기를 강제할 수 있습니다.

### 16) Gateway 런타임 + 포트 진단

Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고,
서비스가 설치되어 있지만 실제로 실행 중이 아닐 때 경고합니다. 또한 Gateway 포트
(기본값 `18789`)에서 포트 충돌을 점검하고 가능한 원인(Gateway가 이미
실행 중임, SSH 터널)을 보고합니다.

### 17) Gateway 런타임 모범 사례

Doctor는 Gateway 서비스가 Bun 또는 버전 관리형 Node 경로
(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram 채널은 Node가 필요하며,
버전 관리자 경로는 서비스가 셸 초기화를 로드하지 않기 때문에 업그레이드 후 깨질 수 있습니다.
Doctor는 사용 가능한 경우 시스템 Node 설치로의 마이그레이션을 제안합니다
(Homebrew/apt/choco).

### 18) 구성 기록 + wizard 메타데이터

Doctor는 모든 구성 변경 사항을 영구 저장하고
doctor 실행을 기록하기 위해 wizard 메타데이터를 기록합니다.

### 19) 워크스페이스 팁(백업 + 메모리 시스템)

Doctor는 워크스페이스 메모리 시스템이 없으면 이를 제안하고,
워크스페이스가 아직 git으로 관리되지 않는 경우 백업 팁을 출력합니다.

워크스페이스 구조와 git 백업(권장: 비공개 GitHub 또는 GitLab)에 대한 전체 가이드는
[/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참고하세요.
