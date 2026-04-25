---
read_when:
    - Esposizione della UI di controllo del Gateway fuori da localhost
    - Automazione dell'accesso alla dashboard tramite tailnet o pubblico
summary: Integrazione di Tailscale Serve/Funnel per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la
dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway associato al loopback mentre
Tailscale fornisce HTTPS, instradamento e (per Serve) header di identità.

## Modalità

- `serve`: Serve solo tailnet tramite `tailscale serve`. Il Gateway resta su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: Predefinita (nessuna automazione Tailscale).

## Autenticazione

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (solo ingresso privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (reverse proxy consapevole dell'identità; vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`,
l'autenticazione di UI di controllo/WebSocket può usare gli header di identità Tailscale
(`tailscale-user-login`) senza fornire un token/password. OpenClaw verifica
l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il daemon Tailscale locale
(`tailscale whois`) e confrontandolo con l'header prima di accettarlo.
OpenClaw tratta una richiesta come Serve solo se arriva da loopback con gli
header `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` di Tailscale.
Gli endpoint API HTTP (ad esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**non** usano l'autenticazione tramite header di identità Tailscale. Seguono comunque la
normale modalità di autenticazione HTTP del gateway: autenticazione a segreto condiviso per impostazione predefinita, oppure una configurazione intenzionale `trusted-proxy` / `none` con ingresso privato.
Questo flusso senza token presuppone che l'host del gateway sia fidato. Se codice locale non fidato
può essere eseguito sullo stesso host, disabilita `gateway.auth.allowTailscale` e richiedi
invece l'autenticazione con token/password.
Per richiedere credenziali esplicite a segreto condiviso, imposta `gateway.auth.allowTailscale: false`
e usa `gateway.auth.mode: "token"` oppure `"password"`.

## Esempi di configurazione

### Solo tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Apri: `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

### Solo tailnet (bind all'IP tailnet)

Usa questa opzione quando vuoi che il Gateway ascolti direttamente sull'IP tailnet (senza Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connettiti da un altro dispositivo tailnet:

- UI di controllo: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Nota: il loopback (`http://127.0.0.1:18789`) **non** funzionerà in questa modalità.

### Internet pubblico (Funnel + password condivisa)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Preferisci `OPENCLAW_GATEWAY_PASSWORD` invece di salvare una password su disco.

## Esempi CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Note

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e abbia effettuato l'accesso.
- `tailscale.mode: "funnel"` rifiuta l'avvio a meno che la modalità di autenticazione non sia `password` per evitare un'esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione `tailscale serve`
  o `tailscale funnel` allo spegnimento.
- `gateway.bind: "tailnet"` è un bind diretto alla tailnet (senza HTTPS, senza Serve/Funnel).
- `gateway.bind: "auto"` preferisce il loopback; usa `tailnet` se vuoi solo tailnet.
- Serve/Funnel espongono solo la **UI di controllo del Gateway + WS**. I Node si connettono tramite
  lo stesso endpoint WS del Gateway, quindi Serve può funzionare anche per l'accesso dei Node.

## Controllo del browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi controllare un browser su un'altra macchina,
esegui un **host Node** sulla macchina del browser e mantieni entrambi sulla stessa tailnet.
Il Gateway farà da proxy alle azioni del browser verso il Node; non serve un server di controllo separato né un URL Serve.

Evita Funnel per il controllo del browser; tratta l'associazione del Node come l'accesso operator.

## Prerequisiti + limiti di Tailscale

- Serve richiede HTTPS abilitato per la tua tailnet; la CLI mostra un prompt se manca.
- Serve inserisce header di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo funnel del Node.
- Funnel supporta solo le porte `443`, `8443` e `10000` su TLS.
- Funnel su macOS richiede la variante open-source dell'app Tailscale.

## Per saperne di più

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Individuazione](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
