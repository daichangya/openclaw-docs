---
read_when:
    - '`openclaw secrets apply` 계획 생성 또는 검토하기'
    - '`Invalid plan target path` 오류 디버깅하기'
    - 대상 유형 및 경로 검증 동작 이해하기
summary: '`secrets apply` 계획 계약: 대상 검증, 경로 일치, `auth-profiles.json` 대상 범위'
title: 시크릿 적용 계획 계약
x-i18n:
    generated_at: "2026-04-24T06:16:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

이 페이지는 `openclaw secrets apply`가 강제하는 엄격한 계약을 정의합니다.

대상이 이 규칙과 일치하지 않으면, 적용은 구성을 변경하기 전에 실패합니다.

## 계획 파일 형태

`openclaw secrets apply --from <plan.json>`은 계획 대상의 `targets` 배열을 기대합니다:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## 지원되는 대상 범위

계획 대상은 다음의 지원되는 자격 증명 경로에 대해 허용됩니다:

- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)

## 대상 유형 동작

일반 규칙:

- `target.type`은 인식 가능한 것이어야 하며 정규화된 `target.path` 형태와 일치해야 합니다.

기존 계획과의 호환성 별칭은 계속 허용됩니다:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 경로 검증 규칙

각 대상은 다음 조건을 모두 사용해 검증됩니다:

- `type`은 인식 가능한 대상 유형이어야 합니다.
- `path`는 비어 있지 않은 점 표기 경로여야 합니다.
- `pathSegments`는 생략할 수 있습니다. 제공된 경우 `path`와 정확히 같은 경로로 정규화되어야 합니다.
- 금지된 세그먼트는 거부됩니다: `__proto__`, `prototype`, `constructor`.
- 정규화된 경로는 대상 유형에 대해 등록된 경로 형태와 일치해야 합니다.
- `providerId` 또는 `accountId`가 설정된 경우 경로에 인코딩된 id와 일치해야 합니다.
- `auth-profiles.json` 대상에는 `agentId`가 필요합니다.
- 새 `auth-profiles.json` 매핑을 만들 때는 `authProfileProvider`를 포함하세요.

## 실패 동작

대상이 검증에 실패하면 적용은 다음과 같은 오류와 함께 종료됩니다:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

유효하지 않은 계획에 대해서는 어떤 쓰기 작업도 커밋되지 않습니다.

## exec Provider 동의 동작

- `--dry-run`은 기본적으로 exec SecretRef 검사를 건너뜁니다.
- exec SecretRef/provider를 포함한 계획은 `--allow-exec`가 설정되지 않으면 쓰기 모드에서 거부됩니다.
- exec가 포함된 계획을 검증/적용할 때는 dry-run과 쓰기 명령 모두에 `--allow-exec`를 전달하세요.

## 런타임 및 감사 범위 참고

- ref 전용 `auth-profiles.json` 항목(`keyRef`/`tokenRef`)은 런타임 해석 및 감사 범위에 포함됩니다.
- `secrets apply`는 지원되는 `openclaw.json` 대상, 지원되는 `auth-profiles.json` 대상, 선택적 scrub 대상을 기록합니다.

## 운영자 점검

```bash
# 쓰기 없이 계획 검증
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 그런 다음 실제 적용
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# exec가 포함된 계획의 경우 두 모드 모두에서 명시적으로 옵트인
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

유효하지 않은 대상 경로 메시지와 함께 적용이 실패하면 `openclaw secrets configure`로 계획을 다시 생성하거나, 위의 지원되는 형태에 맞게 대상 경로를 수정하세요.

## 관련 문서

- [시크릿 관리](/ko/gateway/secrets)
- [CLI `secrets`](/ko/cli/secrets)
- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- [구성 참조](/ko/gateway/configuration-reference)
