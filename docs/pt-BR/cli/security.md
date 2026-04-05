---
read_when:
    - Você quer executar uma auditoria rápida de segurança em config/estado
    - Você quer aplicar sugestões seguras de “fix” (permissões, padrões mais restritivos)
summary: Referência da CLI para `openclaw security` (auditar e corrigir armadilhas de segurança comuns)
title: security
x-i18n:
    generated_at: "2026-04-05T12:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Ferramentas de segurança (auditoria + correções opcionais).

Relacionado:

- Guia de segurança: [Security](/gateway/security)

## Auditoria

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

A auditoria avisa quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo seguro de DM**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com várias contas) para caixas de entrada compartilhadas.
Isto serve para reforço de segurança em caixas de entrada cooperativas/compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe os limites de confiança com gateways distintos (ou usuários/hosts do SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere ingresso provável de usuários compartilhados (por exemplo, política aberta de DM/grupo, destinos de grupo configurados ou regras curingas de remetente) e lembra que o modelo de confiança padrão do OpenClaw é de assistente pessoal.
Para configurações intencionais com vários usuários, a orientação da auditoria é isolar todas as sessões em sandbox, manter o acesso ao sistema de arquivos restrito ao escopo do workspace e manter identidades ou credenciais pessoais/privadas fora desse runtime.
Ela também avisa quando modelos pequenos (`<=300B`) são usados sem sandbox e com ferramentas web/browser ativadas.
Para ingresso por webhook, ela avisa quando `hooks.token` reutiliza o token do Gateway, quando `hooks.token` é curto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` não está definido, quando `hooks.allowedAgentIds` não é restrito, quando substituições de `sessionKey` da requisição estão ativadas e quando as substituições estão ativadas sem `hooks.allowedSessionKeyPrefixes`.
Ela também avisa quando configurações de Docker do sandbox estão definidas enquanto o modo sandbox está desativado, quando `gateway.nodes.denyCommands` usa entradas ineficazes semelhantes a padrões/desconhecidas (somente correspondência exata por nome de comando do nó, não filtragem de texto shell), quando `gateway.nodes.allowCommands` ativa explicitamente comandos perigosos de nó, quando `tools.profile="minimal"` global é substituído por perfis de ferramentas do agente, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace e quando ferramentas de plugins de extensão instalados podem estar acessíveis sob política de ferramentas permissiva.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalho se os proxies estiverem configurados incorretamente) e `discovery.mdns.mode="full"` (vazamento de metadados via registros TXT do mDNS).
Ela também avisa quando o browser do sandbox usa rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos perigosos de rede Docker do sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também avisa quando contêineres Docker existentes do browser do sandbox têm rótulos de hash ausentes/desatualizados (por exemplo, contêineres anteriores à migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também avisa quando registros de instalação de plugins/hooks baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões de pacote atualmente instaladas.
Ela avisa quando listas de permissões de canais dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos IRC quando aplicável).
Ela avisa quando `gateway.auth.mode="none"` deixa as APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` ativado).
Configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de operador do tipo break-glass; ativar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, consulte a seção "Resumo de flags inseguras ou perigosas" em [Security](/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos direcionados.
- Se um SecretRef não estiver disponível no caminho atual do comando, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` apenas substituem a autenticação de sondagem profunda para essa invocação do comando; eles não reescrevem config nem mapeamentos de SecretRef.

## Saída JSON

Use `--json` para verificações de CI/política:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` forem combinados, a saída incluirá tanto ações de correção quanto o relatório final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## O que `--fix` altera

`--fix` aplica remediações seguras e determinísticas:

- altera `groupPolicy="open"` comuns para `groupPolicy="allowlist"` (incluindo variantes por conta em canais compatíveis)
- quando a política de grupo do WhatsApp muda para `allowlist`, inicializa `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- restringe permissões para arquivos de estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão
  `*.jsonl`)
- também restringe arquivos incluídos de configuração referenciados por `openclaw.json`
- usa `chmod` em hosts POSIX e resets de `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desativa ferramentas (`gateway`, `cron`, `exec`, etc.)
- altera escolhas de bind/autenticação/exposição de rede do gateway
- remove nem reescreve plugins/Skills
