---
read_when:
    - Gerando ou revisando planos de `openclaw secrets apply`
    - Depurando erros `Invalid plan target path`
    - Entendendo o comportamento de validação de tipo e caminho do target
summary: 'Contrato para planos de `secrets apply`: validação de target, correspondência de caminho e escopo de target de `auth-profiles.json`'
title: Contrato do plano de Secrets Apply
x-i18n:
    generated_at: "2026-04-05T12:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Contrato do plano de secrets apply

Esta página define o contrato estrito aplicado por `openclaw secrets apply`.

Se um target não corresponder a essas regras, a aplicação falhará antes de modificar a configuração.

## Formato do arquivo de plano

`openclaw secrets apply --from <plan.json>` espera um array `targets` de targets do plano:

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

## Escopo de target compatível

Targets do plano são aceitos para caminhos de credenciais compatíveis em:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Comportamento do tipo de target

Regra geral:

- `target.type` deve ser reconhecido e deve corresponder ao formato normalizado de `target.path`.

Aliases de compatibilidade continuam aceitos para planos existentes:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regras de validação de caminho

Cada target é validado com tudo o que segue:

- `type` deve ser um tipo de target reconhecido.
- `path` deve ser um caminho com pontos não vazio.
- `pathSegments` pode ser omitido. Se fornecido, deve normalizar exatamente para o mesmo caminho que `path`.
- Segmentos proibidos são rejeitados: `__proto__`, `prototype`, `constructor`.
- O caminho normalizado deve corresponder ao formato de caminho registrado para o tipo de target.
- Se `providerId` ou `accountId` estiver definido, ele deve corresponder ao id codificado no caminho.
- Targets de `auth-profiles.json` exigem `agentId`.
- Ao criar um novo mapeamento em `auth-profiles.json`, inclua `authProfileProvider`.

## Comportamento em caso de falha

Se um target falhar na validação, a aplicação será encerrada com um erro como:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nenhuma gravação é confirmada para um plano inválido.

## Comportamento de consentimento do provider exec

- `--dry-run` ignora verificações de SecretRef exec por padrão.
- Planos que contêm SecretRefs/providers exec são rejeitados no modo de gravação, a menos que `--allow-exec` esteja definido.
- Ao validar/aplicar planos que contêm exec, passe `--allow-exec` tanto nos comandos de dry-run quanto nos de gravação.

## Observações sobre escopo de runtime e auditoria

- Entradas somente com ref em `auth-profiles.json` (`keyRef`/`tokenRef`) são incluídas na resolução em runtime e na cobertura de auditoria.
- `secrets apply` grava targets compatíveis em `openclaw.json`, targets compatíveis em `auth-profiles.json` e targets opcionais de limpeza.

## Verificações do operador

```bash
# Validar o plano sem gravar
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Depois aplicar de verdade
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Para planos com exec, faça opt-in explicitamente em ambos os modos
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se a aplicação falhar com uma mensagem de caminho de target inválido, gere o plano novamente com `openclaw secrets configure` ou corrija o caminho do target para um formato compatível acima.

## Documentação relacionada

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
