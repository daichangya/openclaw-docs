---
read_when:
    - config/state에 대해 빠른 보안 감사를 실행하려고 합니다
    - 안전한 “수정” 제안(권한, 더 엄격한 기본값)을 적용하려고 합니다
summary: '`openclaw security`에 대한 CLI 참조(일반적인 보안 실수를 감사하고 수정)'
title: 보안
x-i18n:
    generated_at: "2026-04-24T06:08:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

보안 도구입니다(audit + 선택적 수정).

관련 항목:

- 보안 가이드: [Security](/ko/gateway/security)

## 감사

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

감사는 여러 DM 발신자가 메인 세션을 공유할 때 경고를 표시하고 **보안 DM 모드**를 권장합니다: 공유 받은편지함에는 `session.dmScope="per-channel-peer"`(또는 멀티 계정 채널의 경우 `per-account-channel-peer`).
이는 협업/공유 받은편지함 하드닝을 위한 것입니다. 상호 신뢰하지 않거나 적대적인 운영자가 하나의 Gateway를 공유하는 구성은 권장되지 않습니다. 신뢰 경계를 분리된 gateway(또는 별도의 OS 사용자/호스트)로 분리하세요.
또한 config가 공유 사용자 유입 가능성을 시사하는 경우(예: 열린 DM/그룹 정책, 구성된 그룹 대상, 와일드카드 발신자 규칙) `security.trust_model.multi_user_heuristic`를 출력하고, OpenClaw는 기본적으로 개인 비서 신뢰 모델임을 상기시킵니다.
의도적인 공유 사용자 구성의 경우 audit 안내는 모든 세션을 샌드박스 처리하고, 파일 시스템 접근을 워크스페이스 범위로 제한하며, 개인/프라이빗 ID나 자격 증명을 해당 런타임에서 제외하는 것입니다.
또한 샌드박싱 없이 웹/브라우저 도구가 활성화된 상태에서 작은 모델(`<=300B`)을 사용할 때 경고합니다.
Webhook 유입에 대해서는 `hooks.token`이 Gateway 토큰을 재사용할 때, `hooks.token`이 짧을 때, `hooks.path="/"`일 때, `hooks.defaultSessionKey`가 설정되지 않았을 때, `hooks.allowedAgentIds`가 제한되지 않았을 때, 요청 `sessionKey` 재정의가 활성화되었을 때, 그리고 재정의가 활성화되었지만 `hooks.allowedSessionKeyPrefixes`가 없는 경우 경고합니다.
또한 sandbox 모드가 꺼져 있는데 sandbox Docker 설정이 구성된 경우, `gateway.nodes.denyCommands`가 비효율적인 패턴형/알 수 없는 항목을 사용할 때(셸 텍스트 필터링이 아니라 정확한 node 명령 이름 일치만 지원), `gateway.nodes.allowCommands`가 위험한 node 명령을 명시적으로 활성화할 때, 전역 `tools.profile="minimal"`이 agent 도구 profile로 재정의될 때, 열린 그룹이 sandbox/workspace 가드 없이 런타임/파일 시스템 도구를 노출할 때, 설치된 Plugin 도구가 느슨한 도구 정책 아래에서 도달 가능할 수 있을 때도 경고합니다.
또한 `gateway.allowRealIpFallback=true`(프록시가 잘못 구성되면 헤더 위조 위험)와 `discovery.mdns.mode="full"`(mDNS TXT 레코드를 통한 메타데이터 유출)을 표시합니다.
또한 sandbox browser가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` 네트워크를 사용할 때도 경고합니다.
또한 위험한 sandbox Docker 네트워크 모드(`host`, `container:*` 네임스페이스 조인 포함)도 표시합니다.
또한 기존 sandbox browser Docker 컨테이너에 해시 레이블이 없거나 오래된 경우(예: `openclaw.browserConfigEpoch`가 없는 마이그레이션 이전 컨테이너)에도 경고하고 `openclaw sandbox recreate --browser --all`을 권장합니다.
또한 npm 기반 Plugin/hook 설치 레코드가 pin되지 않았거나, 무결성 메타데이터가 없거나, 현재 설치된 패키지 버전과 드리프트가 있을 때도 경고합니다.
또한 채널 허용 목록이 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존할 때도 경고합니다(해당되는 Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC 범위).
또한 `gateway.auth.mode="none"`으로 인해 공유 비밀 없이 Gateway HTTP API에 접근 가능한 상태(`/tools/invoke`와 활성화된 `/v1/*` 엔드포인트 포함)도 경고합니다.
`dangerous`/`dangerously` 접두사가 붙은 설정은 명시적인 비상 개입용 운영자 재정의이며, 이런 설정을 활성화하는 것 자체만으로 보안 취약점 보고는 아닙니다.
위험한 파라미터 전체 목록은 [Security](/ko/gateway/security)의 "Insecure or dangerous flags summary" 섹션을 참조하세요.

SecretRef 동작:

- `security audit`는 대상 경로에 대해 지원되는 SecretRef를 읽기 전용 모드로 해석합니다.
- 현재 명령 경로에서 SecretRef를 사용할 수 없으면 audit는 중단되지 않고 `secretDiagnostics`를 보고합니다(충돌하지 않음).
- `--token`과 `--password`는 해당 명령 호출에 대한 deep-probe 인증만 재정의하며 config나 SecretRef 매핑을 다시 쓰지 않습니다.

## JSON 출력

CI/정책 검사에는 `--json`을 사용하세요.

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix`와 `--json`을 함께 사용하면 출력에 수정 작업과 최종 보고서가 모두 포함됩니다.

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix`가 변경하는 내용

`--fix`는 안전하고 결정적인 수정 조치를 적용합니다.

- 일반적인 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 전환(지원되는 채널의 계정 변형 포함)
- WhatsApp 그룹 정책이 `allowlist`로 전환될 때, 저장된 `allowFrom` 파일 목록이 존재하고 config에 아직 `allowFrom`이 정의되지 않았다면 그 목록에서 `groupAllowFrom`을 초기값으로 설정
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 설정
- state/config와 일반적인 민감 파일의 권한 강화
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, 세션
  `*.jsonl`)
- `openclaw.json`에서 참조되는 config include 파일의 권한도 강화
- POSIX 호스트에서는 `chmod`, Windows에서는 `icacls` 재설정을 사용

`--fix`가 **하지 않는 일**:

- 토큰/비밀번호/API 키 교체
- 도구 비활성화(`gateway`, `cron`, `exec` 등)
- gateway 바인드/인증/네트워크 노출 선택 변경
- Plugin/Skills 제거 또는 재작성

## 관련 항목

- [CLI 참조](/ko/cli)
- [보안 감사](/ko/gateway/security)
