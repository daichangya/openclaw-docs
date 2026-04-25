---
read_when:
    - Modifica dell'autenticazione della dashboard o delle modalità di esposizione
summary: Accesso e autenticazione alla dashboard del Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-25T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

La dashboard del Gateway è la Control UI nel browser servita su `/` per impostazione predefinita
(sovrascrivibile con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` e
  `wss://127.0.0.1:18789` per l'endpoint WebSocket.

Riferimenti principali:

- [Control UI](/it/web/control-ui) per l'uso e le funzionalità dell'interfaccia.
- [Tailscale](/it/gateway/tailscale) per l'automazione Serve/Funnel.
- [Superfici web](/it/web) per modalità di bind e note di sicurezza.

L'autenticazione viene applicata durante l'handshake WebSocket tramite il percorso
di autenticazione del gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Intestazioni di identità di trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [Configurazione del Gateway](/it/gateway/configuration).

Nota di sicurezza: la Control UI è una **superficie amministrativa** (chat, configurazione, approvazioni exec).
Non esporla pubblicamente. L'interfaccia conserva i token URL della dashboard in sessionStorage
per la sessione corrente della scheda del browser e l'URL gateway selezionato, e li rimuove dall'URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riaprila in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se headless).
- Se l'interfaccia richiede l'autenticazione con segreto condiviso, incolla il token o la
  password configurata nelle impostazioni della Control UI.

## Nozioni di base sull'autenticazione (locale vs remoto)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **TLS del Gateway**: quando `gateway.tls.enabled: true`, i link dashboard/stato usano
  `https://` e i link WebSocket della Control UI usano `wss://`.
- **Origine del token con segreto condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite fragment dell'URL
  per il bootstrap una tantum, e la Control UI lo conserva in sessionStorage per la
  sessione corrente della scheda del browser e l'URL gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito con SecretRef, `openclaw dashboard`
  stampa/copia/apre per progettazione un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli argomenti
  di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef ed è irrisolto nella tua
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni pratiche per configurare l'autenticazione.
- **Password con segreto condiviso**: usa la `gateway.auth.password` configurata (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra i
  ricaricamenti.
- **Modalità basate su identità**: Tailscale Serve può soddisfare l'autenticazione
  Control UI/WebSocket tramite intestazioni di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non-loopback consapevole dell'identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede un segreto condiviso incollato per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non-loopback con segreto condiviso, un
  reverse proxy non-loopback consapevole dell'identità con
  `gateway.auth.mode: "trusted-proxy"` o un tunnel SSH. Le API HTTP usano comunque
  l'autenticazione con segreto condiviso a meno che tu non esegua intenzionalmente un ingresso privato con
  `gateway.auth.mode: "none"` o l'autenticazione HTTP trusted-proxy. Vedi
  [Superfici web](/it/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono effettuare un solo tentativo attendibile con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di ritentativo. Quel ritentativo con token memorizzato riutilizza gli scope approvati memorizzati del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono il set di scope richiesto. Se l'autenticazione continua a fallire dopo quel ritentativo, risolvi manualmente la deriva del token.
- Al di fuori di quel percorso di ritentativo, la precedenza dell'autenticazione di connessione è: token/password condivisi espliciti per primi, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
- Nel percorso asincrono della Control UI Tailscale Serve, i tentativi non riusciti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limitatore dei fallimenti di autenticazione li registri, quindi il secondo ritentativo errato concorrente può già mostrare `retry later`.
- Per i passaggi di riparazione della deriva del token, segui [Checklist di recupero della deriva del token](/it/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il segreto condiviso dall'host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi la `gateway.auth.password` configurata oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito con SecretRef: risolvi il provider di segreti esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, quindi riesegui `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo di autenticazione,
  quindi connettiti.
- Il selettore della lingua dell'interfaccia è in **Panoramica -> Accesso Gateway -> Lingua**.
  Fa parte della scheda di accesso, non della sezione Aspetto.

## Correlati

- [Control UI](/it/web/control-ui)
- [WebChat](/it/web/webchat)
