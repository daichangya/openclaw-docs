---
read_when:
    - Trabalhando na resolução de perfis de autenticação ou no roteamento de credenciais
    - Depurando falhas de autenticação de modelos ou a ordem dos perfis
summary: Semântica canônica de elegibilidade e resolução de credenciais para perfis de autenticação
title: Semântica de Credenciais de Autenticação
x-i18n:
    generated_at: "2026-04-05T12:34:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Semântica de Credenciais de Autenticação

Este documento define a semântica canônica de elegibilidade e resolução de credenciais usada em:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

O objetivo é manter alinhados o comportamento no momento da seleção e em tempo de execução.

## Códigos estáveis de motivo da sondagem

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenciais de token

As credenciais de token (`type: "token"`) oferecem suporte a `token` inline e/ou `tokenRef`.

### Regras de elegibilidade

1. Um perfil de token é inelegível quando `token` e `tokenRef` estão ambos ausentes.
2. `expires` é opcional.
3. Se `expires` estiver presente, ele deverá ser um número finito maior que `0`.
4. Se `expires` for inválido (`NaN`, `0`, negativo, não finito ou do tipo errado), o perfil será inelegível com `invalid_expires`.
5. Se `expires` estiver no passado, o perfil será inelegível com `expired`.
6. `tokenRef` não ignora a validação de `expires`.

### Regras de resolução

1. A semântica do resolvedor corresponde à semântica de elegibilidade para `expires`.
2. Para perfis elegíveis, o material do token pode ser resolvido a partir do valor inline ou de `tokenRef`.
3. Referências que não podem ser resolvidas produzem `unresolved_ref` na saída de `models status --probe`.

## Filtragem explícita da ordem de autenticação

- Quando `auth.order.<provider>` ou a substituição da ordem do armazenamento de autenticação estiver definida para um provedor, `models status --probe` sondará apenas os ids de perfil que permanecerem na ordem de autenticação resolvida para esse provedor.
- Um perfil armazenado desse provedor que for omitido da ordem explícita não será tentado silenciosamente depois. A saída da sondagem o informa com `reasonCode: excluded_by_auth_order` e o detalhe `Excluído por auth.order para este provedor.`

## Resolução de alvos da sondagem

- Os alvos da sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se um provedor tiver credenciais, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para ele, `models status --probe` informará `status: no_model` com `reasonCode: no_model`.

## Proteção de política de OAuth SecretRef

- A entrada SecretRef é destinada apenas a credenciais estáticas.
- Se uma credencial de perfil for `type: "oauth"`, objetos SecretRef não serão compatíveis com o material dessa credencial de perfil.
- Se `auth.profiles.<id>.mode` for `"oauth"`, a entrada `keyRef`/`tokenRef` com suporte de SecretRef para esse perfil será rejeitada.
- Violações são falhas rígidas nos caminhos de resolução de autenticação durante inicialização/recarregamento.

## Mensagens compatíveis com legados

Para compatibilidade com scripts, os erros de sondagem mantêm esta primeira linha inalterada:

`Auth profile credentials are missing or expired.`

Detalhes mais amigáveis para humanos e códigos estáveis de motivo podem ser adicionados nas linhas seguintes.
