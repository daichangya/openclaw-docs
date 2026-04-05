---
read_when:
    - Resolver novamente refs de segredo em runtime
    - Auditar resíduos em texto simples e refs não resolvidos
    - Configurar SecretRefs e aplicar alterações unidirecionais de limpeza
summary: Referência da CLI para `openclaw secrets` (recarregar, auditar, configurar, aplicar)
title: secrets
x-i18n:
    generated_at: "2026-04-05T12:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Use `openclaw secrets` para gerenciar SecretRefs e manter íntegro o snapshot ativo de runtime.

Funções dos comandos:

- `reload`: gateway RPC (`secrets.reload`) que resolve novamente refs e troca o snapshot de runtime apenas em caso de sucesso completo (sem gravações de configuração).
- `audit`: varredura somente leitura da configuração/armazenamentos de autenticação/modelos gerados e resíduos legados em busca de texto simples, refs não resolvidos e drift de precedência (refs de exec são ignorados, a menos que `--allow-exec` esteja definido).
- `configure`: planejador interativo para configuração de provedor, mapeamento de alvos e preflight (TTY obrigatório).
- `apply`: executa um plano salvo (`--dry-run` apenas para validação; dry-run ignora verificações de exec por padrão, e o modo de gravação rejeita planos que contenham exec, a menos que `--allow-exec` esteja definido), então limpa os resíduos em texto simples visados.

Loop recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se o seu plano incluir SecretRefs/provedores `exec`, passe `--allow-exec` nos comandos de apply com dry-run e com gravação.

Observação sobre código de saída para CI/gates:

- `audit --check` retorna `1` em caso de achados.
- refs não resolvidos retornam `2`.

Relacionado:

- Guia de segredos: [Secrets Management](/gateway/secrets)
- Superfície de credenciais: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Guia de segurança: [Security](/gateway/security)

## Recarregar snapshot de runtime

Resolva novamente refs de segredo e troque atomicamente o snapshot de runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Observações:

- Usa o método gateway RPC `secrets.reload`.
- Se a resolução falhar, o gateway mantém o último snapshot válido conhecido e retorna um erro (sem ativação parcial).
- A resposta JSON inclui `warningCount`.

Opções:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Auditoria

Examine o estado do OpenClaw em busca de:

- armazenamento de segredo em texto simples
- refs não resolvidos
- drift de precedência (credenciais de `auth-profiles.json` sombreando refs de `openclaw.json`)
- resíduos gerados em `agents/*/agent/models.json` (valores `apiKey` de provedores e cabeçalhos sensíveis de provedores)
- resíduos legados (entradas legadas do armazenamento de autenticação, lembretes de OAuth)

Observação sobre resíduos de cabeçalho:

- A detecção de cabeçalhos sensíveis de provedores é baseada em heurística de nomes (nomes comuns de cabeçalhos de autenticação/credenciais e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportamento de saída:

- `--check` retorna código não zero em caso de achados.
- refs não resolvidos saem com código não zero de prioridade mais alta.

Destaques do formato do relatório:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de achado:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configurar (helper interativo)

Crie interativamente alterações de provedor e SecretRef, execute preflight e, opcionalmente, aplique:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Fluxo:

- Primeiro a configuração do provedor (`add/edit/remove` para aliases de `secrets.providers`).
- Depois o mapeamento de credenciais (selecionar campos e atribuir refs `{source, provider, id}`).
- Por fim, preflight e aplicação opcional.

Flags:

- `--providers-only`: configura apenas `secrets.providers`, ignora o mapeamento de credenciais.
- `--skip-provider-setup`: ignora a configuração do provedor e mapeia credenciais para provedores existentes.
- `--agent <id>`: limita a descoberta de alvos e gravações de `auth-profiles.json` a um armazenamento de agente.
- `--allow-exec`: permite verificações de SecretRef `exec` durante preflight/apply (pode executar comandos do provedor).

Observações:

- Requer um TTY interativo.
- Você não pode combinar `--providers-only` com `--skip-provider-setup`.
- `configure` tem como alvo campos que contêm segredos em `openclaw.json` mais `auth-profiles.json` para o escopo de agente selecionado.
- `configure` oferece suporte à criação de novos mapeamentos de `auth-profiles.json` diretamente no fluxo do seletor.
- Superfície compatível canônica: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Ele executa resolução de preflight antes do apply.
- Se o preflight/apply incluir refs `exec`, mantenha `--allow-exec` definido em ambas as etapas.
- Os planos gerados usam por padrão opções de limpeza (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` todos habilitados).
- O caminho de apply é unidirecional para valores em texto simples limpos.
- Sem `--apply`, a CLI ainda solicita `Apply this plan now?` após o preflight.
- Com `--apply` (e sem `--yes`), a CLI solicita uma confirmação extra irreversível.
- `--json` imprime o plano + relatório de preflight, mas o comando ainda exige um TTY interativo.

Observação de segurança para provedores exec:

- Instalações Homebrew frequentemente expõem binários com symlink em `/opt/homebrew/bin/*`.
- Defina `allowSymlinkCommand: true` apenas quando necessário para caminhos confiáveis do gerenciador de pacotes, e combine isso com `trustedDirs` (por exemplo `["/opt/homebrew"]`).
- No Windows, se a verificação de ACL não estiver disponível para um caminho de provedor, o OpenClaw falha de forma fechada. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança do caminho.

## Aplicar um plano salvo

Aplique ou faça preflight de um plano gerado anteriormente:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportamento de exec:

- `--dry-run` valida o preflight sem gravar arquivos.
- Verificações de SecretRef `exec` são ignoradas por padrão no dry-run.
- O modo de gravação rejeita planos que contêm SecretRefs/provedores exec, a menos que `--allow-exec` esteja definido.
- Use `--allow-exec` para optar por verificações/execução de provedor exec em qualquer um dos modos.

Detalhes do contrato do plano (caminhos de alvo permitidos, regras de validação e semântica de falha):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

O que `apply` pode atualizar:

- `openclaw.json` (alvos SecretRef + upserts/exclusões de provedor)
- `auth-profiles.json` (limpeza de alvos de provedor)
- resíduos legados em `auth.json`
- chaves de segredo conhecidas em `~/.openclaw/.env` cujos valores foram migrados

## Por que não há backups de rollback

`secrets apply` intencionalmente não grava backups de rollback contendo valores antigos em texto simples.

A segurança vem de preflight rigoroso + apply quase atômico com restauração em memória best-effort em caso de falha.

## Exemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` ainda informar achados de texto simples, atualize os caminhos de alvo restantes informados e execute a auditoria novamente.
