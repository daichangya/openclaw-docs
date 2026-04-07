---
read_when:
    - OpenClaw의 OAuth 전체 흐름을 엔드투엔드로 이해하고 싶습니다
    - 토큰 무효화 / 로그아웃 문제가 발생했습니다
    - Claude CLI 또는 OAuth 인증 흐름을 원합니다
    - 여러 계정 또는 프로필 라우팅을 원합니다
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장소, 다중 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-04-07T05:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw는 이를 제공하는 provider에 대해 OAuth를 통한 “subscription auth”를 지원합니다
(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic의 경우 현재의 실질적인 구분은 다음과 같습니다:

- **Anthropic API key**: 일반 Anthropic API 과금
- **OpenClaw 내부의 Anthropic Claude CLI / subscription auth**: Anthropic 직원이
  이 사용이 다시 허용된다고 알려주었습니다

OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서 사용하도록 명시적으로 지원됩니다.
이 페이지에서는 다음을 설명합니다:

프로덕션에서 Anthropic의 경우 API key 인증이 더 안전한 권장 경로입니다.

- OAuth **토큰 교환**이 작동하는 방식 (PKCE)
- 토큰이 **저장되는** 위치(및 그 이유)
- **여러 계정**을 처리하는 방법 (프로필 + 세션별 재정의)

OpenClaw는 자체 OAuth 또는 API‑key
흐름을 제공하는 **provider plugins**도 지원합니다. 다음으로 실행하세요:

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(왜 존재하는가)

OAuth provider는 로그인/갱신 흐름 중에 흔히 **새 refresh token**을 발급합니다. 일부 provider(또는 OAuth 클라이언트)는 동일한 사용자/앱에 대해 새 토큰이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw _그리고_ Claude Code / Codex CLI로 로그인하면 → 나중에 둘 중 하나가 무작위로 “로그아웃”됩니다

이를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **토큰 싱크**로 취급합니다:

- 런타임은 **한 곳**에서 자격 증명을 읽습니다
- 여러 프로필을 유지하고 이를 결정론적으로 라우팅할 수 있습니다
- 자격 증명을 Codex CLI 같은 외부 CLI에서 재사용하는 경우, OpenClaw는
  출처 정보를 포함해 이를 미러링하고 refresh token 자체를 회전시키는 대신
  해당 외부 소스를 다시 읽습니다

## 저장소(토큰이 저장되는 위치)

시크릿은 **에이전트별**로 저장됩니다:

- 인증 프로필(OAuth + API keys + 선택적 값 수준 refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환성 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` 정적 항목은 발견되면 정리됩니다)

레거시 import 전용 파일(여전히 지원되지만, 기본 저장소는 아님):

- `~/.openclaw/credentials/oauth.json` (최초 사용 시 `auth-profiles.json`으로 import됨)

위의 모든 항목은 `$OPENCLAW_STATE_DIR`(state dir 재정의)도 따릅니다. 전체 참조: [/gateway/configuration](/ko/gateway/configuration-reference#auth-storage)

정적 secret refs 및 런타임 스냅샷 활성화 동작은 [Secrets Management](/ko/gateway/secrets)를 참고하세요.

## Anthropic 레거시 토큰 호환성

<Warning>
Anthropic의 공개 Claude Code 문서에는 Claude Code를 직접 사용하는 경우
Claude 구독 한도 내에 머문다고 되어 있으며, Anthropic 직원은 OpenClaw 스타일의 Claude
CLI 사용이 다시 허용된다고 알려주었습니다. 따라서 OpenClaw는 Anthropic이
새 정책을 발표하지 않는 한 이 통합에 대해 Claude CLI 재사용과
`claude -p` 사용을 허용된 것으로 취급합니다.

Anthropic의 현재 직접 Claude Code 플랜 문서는 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)을
참고하세요.

OpenClaw에서 다른 subscription 스타일 옵션을 원하면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
Plan](/ko/providers/qwen), [MiniMax Coding Plan](/ko/providers/minimax),
및 [Z.AI / GLM Coding Plan](/ko/providers/glm)을 참고하세요.
</Warning>

OpenClaw는 Anthropic setup-token도 지원되는 token-auth 경로로 노출하지만, 현재는 가능하면 Claude CLI 재사용과 `claude -p`를 우선합니다.

## Anthropic Claude CLI 마이그레이션

OpenClaw는 Anthropic Claude CLI 재사용을 다시 지원합니다. 호스트에 이미 로컬
Claude 로그인이 있으면 onboarding/configure에서 이를 직접 재사용할 수 있습니다.

## OAuth 교환(로그인 작동 방식)

OpenClaw의 대화형 로그인 흐름은 `@mariozechner/pi-ai`에 구현되어 있으며 wizard/command에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. OpenClaw에서 Anthropic setup-token 또는 paste-token 시작
2. OpenClaw는 결과로 얻은 Anthropic 자격 증명을 인증 프로필에 저장
3. 모델 선택은 `anthropic/...`에 유지
4. 기존 Anthropic 인증 프로필은 롤백/순서 제어를 위해 계속 사용 가능

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 Codex CLI 외부, OpenClaw 워크플로를 포함한 환경에서 사용하도록 명시적으로 지원됩니다.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백에 바인딩할 수 없거나(또는 원격/헤드리스 환경인 경우) 리디렉션 URL/code 붙여넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. access token에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

Wizard 경로는 `openclaw onboard` → auth choice `openai-codex`입니다.

## 갱신 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서는:

- `expires`가 미래 시점이면 → 저장된 access token 사용
- 만료되었으면 → 새로 고침(file lock 아래에서)하고 저장된 자격 증명을 덮어씀
- 예외: 재사용된 외부 CLI 자격 증명은 외부에서 계속 관리되며, OpenClaw는
  CLI 인증 저장소를 다시 읽고 복사된 refresh token 자체를 절대 사용하지 않음

새로 고침 흐름은 자동이므로, 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴이 있습니다:

### 1) 권장: 분리된 에이전트

“개인용”과 “업무용”이 절대 상호작용하지 않게 하려면 격리된 에이전트(별도 세션 + 자격 증명 + workspace)를 사용하세요:

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 구성하고(wizard), 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 하나의 에이전트에 여러 프로필

`auth-profiles.json`은 동일 provider에 대해 여러 프로필 ID를 지원합니다.

사용할 프로필 선택 방법:

- 전역적으로는 구성 순서(`auth.order`)를 통해
- 세션별로는 `/model ...@<profileId>`를 통해

예시(세션 재정의):

- `/model Opus@anthropic:work`

어떤 프로필 ID가 있는지 확인하는 방법:

- `openclaw channels list --json` (`auth[]` 표시)

관련 문서:

- [/concepts/model-failover](/ko/concepts/model-failover) (순환 + 쿨다운 규칙)
- [/tools/slash-commands](/ko/tools/slash-commands) (command 표면)

## 관련 항목

- [Authentication](/ko/gateway/authentication) — 모델 provider 인증 개요
- [Secrets](/ko/gateway/secrets) — 자격 증명 저장소 및 SecretRef
- [Configuration Reference](/ko/gateway/configuration-reference#auth-storage) — 인증 구성 키
