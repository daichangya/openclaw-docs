---
read_when:
    - Debug dell'autenticazione del modello o della scadenza OAuth
    - Documentare autenticazione o archiviazione delle credenziali
summary: 'Autenticazione del modello: OAuth, chiavi API, riuso di Claude CLI e setup-token Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-25T13:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Questa pagina copre l'autenticazione del **provider di modelli** (chiavi API, OAuth, riuso di Claude CLI e setup-token Anthropic). Per l'autenticazione della **connessione al gateway** (token, password, trusted-proxy), vedi [Configuration](/it/gateway/configuration) e [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e chiavi API per i provider di modelli. Per host gateway
sempre attivi, le chiavi API sono di solito l'opzione più prevedibile. Sono
supportati anche i flussi di sottoscrizione/OAuth quando corrispondono al modello di account del provider.

Vedi [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e il layout
di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), vedi [Secrets Management](/it/gateway/secrets).
Per le regole di idoneità delle credenziali/codici motivo usate da `models status --probe`, vedi
[Auth Credential Semantics](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se stai eseguendo un gateway di lunga durata, inizia con una chiave API per il provider
scelto.
Per Anthropic in particolare, l'autenticazione con chiave API resta la configurazione server
più prevedibile, ma OpenClaw supporta anche il riuso di un accesso Claude CLI locale.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito sotto systemd/launchd, è preferibile inserire la chiave in
   `~/.openclaw/.env` in modo che il demone possa leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Quindi riavvia il demone (oppure riavvia il processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire direttamente le variabili env, l'onboarding può archiviare
le chiavi API per l'uso del demone: `openclaw onboard`.

Vedi [Help](/it/help) per i dettagli sull'ereditarietà env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilità tra Claude CLI e token

L'autenticazione Anthropic setup-token è ancora disponibile in OpenClaw come percorso token
supportato. Da allora lo staff Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è
di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p`
come approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Quando
il riuso di Claude CLI è disponibile sull'host, questo è ora il percorso preferito.

Per host gateway di lunga durata, una chiave API Anthropic resta comunque la configurazione
più prevedibile. Se vuoi riusare un accesso Claude esistente sullo stesso host, usa il
percorso Anthropic Claude CLI in onboarding/configure.

Configurazione host consigliata per il riuso di Claude CLI:

```bash
# Esegui sull'host gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Questa è una configurazione in due passaggi:

1. Esegui l'accesso di Claude Code stesso ad Anthropic sull'host gateway.
2. Indica a OpenClaw di passare la selezione del modello Anthropic al backend locale `claude-cli`
   e di archiviare il profilo di autenticazione OpenClaw corrispondente.

Se `claude` non è su `PATH`, installa prima Claude Code oppure imposta
`agents.defaults.cliBackends.claude-cli.command` sul percorso reale del binario.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` + aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

Sono supportati anche i riferimenti a profili di autenticazione per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` con backing SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (exit `1` se scaduto/mancante, `2` se in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo archiviato, probe riporta
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato modello sondabile per
  quel provider, probe riporta `status: no_model`.
- I cooldown di rate limit possono avere ambito modello. Un profilo in cooldown per un
  modello può essere ancora utilizzabile per un modello fratello sullo stesso provider.

Gli script operativi opzionali (systemd/Termux) sono documentati qui:
[Auth monitoring scripts](/it/help/scripts#auth-monitoring-scripts)

## Nota su Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Lo staff Anthropic ci ha detto che questo percorso di integrazione OpenClaw è di nuovo consentito.
- OpenClaw quindi considera il riuso di Claude CLI e l'uso di `claude -p` come approvati
  per esecuzioni basate su Anthropic, a meno che Anthropic non pubblichi una nuova policy.
- Le chiavi API Anthropic restano la scelta più prevedibile per host gateway di lunga durata
  e per un controllo esplicito della fatturazione lato server.

## Verificare lo stato di autenticazione del modello

```bash
openclaw models status
openclaw doctor
```

## Comportamento di rotazione delle chiavi API (gateway)

Alcuni provider supportano il nuovo tentativo di una richiesta con chiavi alternative quando una chiamata API
raggiunge un limite di frequenza del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw ritenta con la chiave successiva solo per errori di rate limit (per esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Gli errori non dovuti a rate limit non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Controllare quale credenziale viene usata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (id profilo di esempio: `anthropic:default`, `anthropic:work`).

Usa `/model` (oppure `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + profilo di autenticazione successivo, più i dettagli dell'endpoint del provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine del profilo di autenticazione per un agente (archiviato in `auth-state.json` di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per puntare a un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i
profili archiviati omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown di rate limit possono essere legati
a un id modello invece che all'intero profilo provider.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull'**host gateway** oppure imposta il percorso Anthropic setup-token, quindi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo sta per scadere. Se un
profilo token Anthropic manca o è scaduto, aggiorna quella configurazione tramite
setup-token oppure passa a una chiave API Anthropic.

## Correlati

- [Secrets management](/it/gateway/secrets)
- [Accesso remoto](/it/gateway/remote)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
