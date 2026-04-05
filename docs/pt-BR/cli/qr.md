---
read_when:
    - Você quer fazer o pairing rápido de um app de nó móvel com um gateway
    - Você precisa da saída do código de configuração para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pairing móvel + código de configuração)
title: qr
x-i18n:
    generated_at: "2026-04-05T12:38:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Gere um QR de pairing móvel e um código de configuração a partir da configuração atual do seu Gateway.

## Uso

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opções

- `--remote`: prefere `gateway.remote.url`; se não estiver definido, `gateway.tailscale.mode=serve|funnel` ainda pode fornecer a URL pública remota
- `--url <url>`: substitui a URL do gateway usada no payload
- `--public-url <url>`: substitui a URL pública usada no payload
- `--token <token>`: substitui qual token do gateway o fluxo de bootstrap autentica
- `--password <password>`: substitui qual senha do gateway o fluxo de bootstrap autentica
- `--setup-code-only`: imprime apenas o código de configuração
- `--no-ascii`: pula a renderização do QR em ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Observações

- `--token` e `--password` são mutuamente exclusivos.
- O próprio código de configuração agora carrega um `bootstrapToken` opaco e de curta duração, não o token/senha compartilhado do gateway.
- No fluxo de bootstrap integrado de nó/operador, o token primário do nó ainda chega com `scopes: []`.
- Se a transferência de bootstrap também emitir um token de operador, ele permanece limitado à allowlist de bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- As verificações de escopo de bootstrap usam prefixo de role. Essa allowlist de operador satisfaz apenas solicitações de operador; roles que não são de operador ainda precisam de scopes sob seu próprio prefixo de role.
- O pairing móvel falha de forma segura para URLs de gateway `ws://` em Tailscale/públicas. `ws://` em LAN privada continua compatível, mas rotas móveis Tailscale/públicas devem usar Tailscale Serve/Funnel ou uma URL de gateway `wss://`.
- Com `--remote`, o OpenClaw exige `gateway.remote.url` ou
  `gateway.tailscale.mode=serve|funnel`.
- Com `--remote`, se as credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` nem `--password`, o comando as resolve a partir do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs de autenticação do gateway local são resolvidos quando nenhuma substituição de autenticação por CLI é passada:
  - `gateway.auth.token` é resolvido quando a autenticação por token pode vencer (explícito `gateway.auth.mode="token"` ou modo inferido em que nenhuma fonte de senha vence).
  - `gateway.auth.password` é resolvido quando a autenticação por senha pode vencer (explícito `gateway.auth.mode="password"` ou modo inferido sem token vencedor de auth/env).
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falha até que o modo seja definido explicitamente.
- Observação sobre diferença de versão do Gateway: este caminho de comando exige um gateway com suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Depois de escanear, aprove o pairing do dispositivo com:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
