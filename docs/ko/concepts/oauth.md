---
read_when:
    - OpenClaw의 OAuth 전체 흐름을 이해하려고 합니다.
    - 토큰 무효화 / 로그아웃 문제를 겪고 있습니다.
    - Claude CLI 또는 OAuth 인증 흐름을 원합니다.
    - 여러 계정 또는 프로필 라우팅을 원합니다.
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장소 및 멀티 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T06:11:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw는 이를 제공하는 제공자에 대해 OAuth를 통한 “구독 인증”을 지원합니다(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic의 경우 현재 실질적인 구분은 다음과 같습니다.

- **Anthropic API key**: 일반 Anthropic API 과금
- **OpenClaw 내부의 Anthropic Claude CLI / 구독 인증**: Anthropic 직원이 이 사용을 다시 허용한다고 알려왔습니다.

OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서 사용하는 것이 명시적으로 지원됩니다. 이 페이지에서는 다음을 설명합니다.

프로덕션에서 Anthropic의 경우 API key 인증이 더 안전한 권장 경로입니다.

- OAuth **토큰 교환**이 어떻게 동작하는지(PKCE)
- 토큰이 어디에 **저장**되는지(그리고 그 이유)
- **여러 계정**을 어떻게 처리하는지(프로필 + 세션별 재정의)

OpenClaw는 자체 OAuth 또는 API key 흐름을 제공하는 **provider Plugins**도 지원합니다. 다음으로 실행하세요.

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(존재 이유)

OAuth 제공자는 로그인/새로 고침 흐름 중에 **새 refresh token**을 발급하는 경우가 많습니다. 일부 제공자(또는 OAuth 클라이언트)는 같은 사용자/앱에 대해 새 refresh token이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw _및_ Claude Code / Codex CLI로 로그인하면 → 나중에 둘 중 하나가 무작위로 “로그아웃”됩니다.

이를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **토큰 싱크**로 취급합니다.

- 런타임은 **한 곳**에서 자격 증명을 읽습니다.
- 여러 프로필을 유지하고 이를 결정적으로 라우팅할 수 있습니다.
- Codex CLI 같은 외부 CLI의 자격 증명을 재사용할 경우, OpenClaw는 provenance와 함께 이를 미러링하고 refresh token을 직접 회전시키는 대신 해당 외부 소스를 다시 읽습니다.

## 저장소(토큰 저장 위치)

비밀 정보는 **에이전트별**로 저장됩니다.

- 인증 프로필(OAuth + API key + 선택적 값 수준 ref): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` 정적 항목은 발견 시 정리됨)

레거시 가져오기 전용 파일(여전히 지원되지만 기본 저장소는 아님):

- `~/.openclaw/credentials/oauth.json`(처음 사용할 때 `auth-profiles.json`으로 가져옴)

위 모든 경로는 `$OPENCLAW_STATE_DIR`(상태 디렉터리 재정의)도 따릅니다. 전체 참조: [/gateway/configuration](/ko/gateway/configuration-reference#auth-storage)

정적 secret ref 및 런타임 스냅샷 활성화 동작은 [시크릿 관리](/ko/gateway/secrets)를 참조하세요.

## Anthropic 레거시 토큰 호환성

<Warning>
Anthropic의 공개 Claude Code 문서에는 Claude Code를 직접 사용하는 것이 Claude 구독 한도 내에 머문다고 되어 있으며, Anthropic 직원은 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려왔습니다. 따라서 Anthropic이 새로운 정책을 게시하지 않는 한, OpenClaw는 Claude CLI 재사용 및 `claude -p` 사용을 이 통합에 대해 허용된 것으로 취급합니다.

Anthropic의 현재 직접 Claude Code 요금제 문서는 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)을 참조하세요.

OpenClaw에서 다른 구독형 옵션을 원하면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
Plan](/ko/providers/qwen), [MiniMax Coding Plan](/ko/providers/minimax),
[Z.AI / GLM Coding Plan](/ko/providers/glm)을 참조하세요.
</Warning>

OpenClaw는 Anthropic setup-token도 지원되는 token 인증 경로로 노출하지만, 가능하면 이제 Claude CLI 재사용과 `claude -p`를 우선합니다.

## Anthropic Claude CLI 마이그레이션

OpenClaw는 다시 Anthropic Claude CLI 재사용을 지원합니다. 호스트에 이미 로컬 Claude 로그인이 있으면 온보딩/구성에서 이를 직접 재사용할 수 있습니다.

## OAuth 교환(로그인 작동 방식)

OpenClaw의 대화형 로그인 흐름은 `@mariozechner/pi-ai`에 구현되어 있으며 마법사/명령어에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. OpenClaw에서 Anthropic setup-token 또는 paste-token 시작
2. OpenClaw가 결과 Anthropic 자격 증명을 인증 프로필에 저장
3. 모델 선택은 `anthropic/...`에 유지
4. 기존 Anthropic 인증 프로필은 롤백/순서 제어용으로 계속 사용 가능

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 OpenClaw 워크플로를 포함해 Codex CLI 외부에서 사용하는 것이 명시적으로 지원됩니다.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 랜덤 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백 바인딩이 불가능하거나 원격/헤드리스 환경이면 리디렉션 URL/code 붙여넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. access token에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

마법사 경로는 `openclaw onboard` → 인증 선택 `openai-codex`입니다.

## 새로 고침 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서:

- `expires`가 미래이면 → 저장된 access token 사용
- 만료되었으면 → 새로 고침(파일 잠금 하에서) 후 저장된 자격 증명 덮어쓰기
- 예외: 재사용된 외부 CLI 자격 증명은 외부에서 계속 관리됩니다. OpenClaw는 CLI 인증 저장소를 다시 읽고 복사된 refresh token을 직접 사용하지 않습니다.

새로 고침 흐름은 자동이며, 일반적으로 토큰을 수동으로 관리할 필요는 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴이 있습니다.

### 1) 권장: 별도 에이전트

“개인용”과 “업무용”이 절대 서로 상호작용하지 않게 하려면 격리된 에이전트(별도 세션 + 자격 증명 + 워크스페이스)를 사용하세요.

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 구성하고(마법사), 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 한 에이전트 안에서 여러 프로필

`auth-profiles.json`은 동일한 제공자에 대해 여러 프로필 ID를 지원합니다.

어떤 프로필을 사용할지 선택하는 방법:

- config 순서 지정(`auth.order`)을 통한 전역 설정
- `/model ...@<profileId>`를 통한 세션별 설정

예시(세션 재정의):

- `/model Opus@anthropic:work`

어떤 프로필 ID가 존재하는지 확인하는 방법:

- `openclaw channels list --json` (`auth[]` 표시)

관련 문서:

- [/concepts/model-failover](/ko/concepts/model-failover) (순환 + cooldown 규칙)
- [/tools/slash-commands](/ko/tools/slash-commands) (명령어 표면)

## 관련 항목

- [인증](/ko/gateway/authentication) — 모델 제공자 인증 개요
- [시크릿](/ko/gateway/secrets) — 자격 증명 저장소 및 SecretRef
- [구성 참조](/ko/gateway/configuration-reference#auth-storage) — 인증 config 키
