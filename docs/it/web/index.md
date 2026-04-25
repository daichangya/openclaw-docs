---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi la UI di controllo nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: UI di controllo, modalità di bind e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-04-25T14:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Il Gateway serve una piccola **UI di controllo** nel browser (Vite + Lit) dalla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Le funzionalità si trovano in [UI di controllo](/it/web/control-ui).
Questa pagina si concentra su modalità di bind, sicurezza e superfici esposte sul web.

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un piccolo endpoint Webhook sullo stesso server HTTP.
Vedi [Configurazione del Gateway](/it/gateway/configuration) → `hooks` per autenticazione e payload.

## Configurazione (attiva per impostazione predefinita)

La UI di controllo è **abilitata per impostazione predefinita** quando le risorse sono presenti (`dist/control-ui`).
Puoi controllarla tramite configurazione:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facoltativo
  },
}
```

## Accesso Tailscale

### Serve integrato (consigliato)

Mantieni il Gateway su loopback e lascia che Tailscale Serve faccia da proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Quindi avvia il gateway:

```bash
openclaw gateway
```

Apri:

- `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Quindi avvia il gateway (questo esempio non-loopback usa autenticazione
con token a segreto condiviso):

```bash
openclaw gateway
```

Apri:

- `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

### Internet pubblico (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // oppure OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Note sulla sicurezza

- L'autenticazione del Gateway è richiesta per impostazione predefinita (token, password, trusted-proxy o header di identità di Tailscale Serve quando abilitati).
- I bind non-loopback **richiedono comunque** l'autenticazione del gateway. In pratica questo significa autenticazione con token/password o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- Il wizard crea per impostazione predefinita autenticazione a segreto condiviso e di solito genera un
  token del gateway (anche su loopback).
- In modalità segreto condiviso, la UI invia `connect.params.auth.token` oppure
  `connect.params.auth.password`.
- Quando `gateway.tls.enabled: true`, gli helper locali della dashboard e dello stato mostrano
  URL della dashboard `https://` e URL WebSocket `wss://`.
- Nelle modalità con identità, come Tailscale Serve o `trusted-proxy`, il
  controllo di autenticazione WebSocket viene invece soddisfatto dagli header della richiesta.
- Per le distribuzioni non-loopback della UI di controllo, imposta esplicitamente `gateway.controlUi.allowedOrigins`
  (origini complete). Senza questo, l'avvio del gateway viene rifiutato per impostazione predefinita.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità fallback dell'origine tramite header Host, ma rappresenta un pericoloso downgrade della sicurezza.
- Con Serve, gli header di identità Tailscale possono soddisfare l'autenticazione della UI di controllo/WebSocket
  quando `gateway.auth.allowTailscale` è `true` (nessun token/password richiesto).
  Gli endpoint HTTP API non usano quegli header di identità Tailscale; seguono invece
  la normale modalità di autenticazione HTTP del gateway. Imposta
  `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite. Vedi
  [Tailscale](/it/gateway/tailscale) e [Sicurezza](/it/gateway/security). Questo
  flusso senza token presuppone che l'host del gateway sia affidabile.
- `gateway.tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"` (password condivisa).

## Creazione della UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```
