---
read_when:
    - Você quer acessar o Gateway pelo Tailscale
    - Você quer a Control UI no navegador e edição de config
summary: 'Superfícies web do Gateway: Control UI, modos de bind e segurança'
title: Web
x-i18n:
    generated_at: "2026-04-05T12:56:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

O Gateway fornece uma pequena **Control UI no navegador** (Vite + Lit) na mesma porta do WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

As capacidades estão em [Control UI](/web/control-ui).
Esta página foca em modos de bind, segurança e superfícies expostas à web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Veja [Gateway configuration](/pt-BR/gateway/configuration) → `hooks` para auth + payloads.

## Config (ativado por padrão)

A Control UI é **ativada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la via config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acesso por Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer o proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Depois inicie o gateway:

```bash
openclaw gateway
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` que você configurou)

### Bind na tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Depois inicie o gateway (este exemplo sem loopback usa auth
por token com segredo compartilhado):

```bash
openclaw gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` que você configurou)

### Internet pública (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notas de segurança

- A auth do Gateway é exigida por padrão (token, senha, trusted-proxy ou cabeçalhos de identidade do Tailscale Serve quando habilitados).
- Binds sem loopback ainda **exigem** auth do gateway. Na prática, isso significa auth por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria auth com segredo compartilhado por padrão e normalmente gera um
  token do gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a verificação de auth
  do WebSocket é satisfeita a partir dos cabeçalhos da requisição.
- Para implantações da Control UI sem loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origins completas). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origin pelo cabeçalho Host, mas isso é um downgrade de segurança perigoso.
- Com Serve, os cabeçalhos de identidade do Tailscale podem satisfazer a auth da Control UI/WebSocket
  quando `gateway.auth.allowTailscale` é `true` (sem necessidade de token/senha).
  Endpoints da API HTTP não usam esses cabeçalhos de identidade do Tailscale; eles seguem
  o modo normal de auth HTTP do gateway. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Veja
  [Tailscale](/pt-BR/gateway/tailscale) e [Security](/pt-BR/gateway/security). Esse
  fluxo sem token pressupõe que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Compilar a UI

O Gateway fornece arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build # instala automaticamente as dependências da UI na primeira execução
```
