---
read_when:
    - Debug dell'autenticazione del modello o della scadenza di OAuth
    - Documentare l'autenticazione o l'archiviazione delle credenziali
summary: 'Autenticazione del modello: OAuth, chiavi API, riutilizzo della CLI di Claude e token di configurazione di Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-23T14:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticazione (Provider di modelli)

<Note>
Questa pagina copre l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riutilizzo della CLI di Claude e token di configurazione di Anthropic). Per l'autenticazione della **connessione Gateway** (token, password, trusted-proxy), vedi [Configurazione](/it/gateway/configuration) e [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e le chiavi API per i provider di modelli. Per host Gateway sempre attivi, le chiavi API sono di solito l'opzione più prevedibile. Anche i flussi subscription/OAuth sono supportati quando corrispondono al modello di account del tuo provider.

Vedi [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e il layout di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), vedi [Gestione dei segreti](/it/gateway/secrets).
Per le regole di idoneità delle credenziali/codici motivo usate da `models status --probe`, vedi [Semantica delle credenziali di autenticazione](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se stai eseguendo un Gateway di lunga durata, inizia con una chiave API per il provider scelto.
Per Anthropic in particolare, l'autenticazione con chiave API rimane la configurazione server più prevedibile, ma OpenClaw supporta anche il riutilizzo di un accesso locale alla CLI di Claude.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host Gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito sotto systemd/launchd, preferisci inserire la chiave in
   `~/.openclaw/.env` così il demone può leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Poi riavvia il demone (o riavvia il processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire tu stesso le variabili env, l'onboarding può archiviare
le chiavi API per l'uso del demone: `openclaw onboard`.

Vedi [Aiuto](/it/help) per i dettagli sull'ereditarietà env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilità tra CLI di Claude e token

L'autenticazione con token di configurazione Anthropic è ancora disponibile in OpenClaw come percorso token supportato. Da allora, lo staff di Anthropic ci ha detto che l'uso della CLI di Claude nello stile di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riutilizzo della CLI di Claude e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Quando il riutilizzo della CLI di Claude è disponibile sull'host, questo è ora il percorso preferito.

Per host Gateway di lunga durata, una chiave API Anthropic rimane comunque la configurazione più prevedibile. Se vuoi riutilizzare un login Claude esistente sullo stesso host, usa il percorso Anthropic Claude CLI in onboarding/configure.

Configurazione host consigliata per il riutilizzo della CLI di Claude:

```bash
# Esegui sull'host Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Questa è una configurazione in due passaggi:

1. Fai accedere Claude Code stesso ad Anthropic sull'host Gateway.
2. Indica a OpenClaw di passare la selezione del modello Anthropic al backend locale `claude-cli`
   e di archiviare il profilo di autenticazione OpenClaw corrispondente.

Se `claude` non è in `PATH`, installa prima Claude Code oppure imposta
`agents.defaults.cliBackends.claude-cli.command` sul percorso reale del binario.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` + aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

Sono supportati anche i riferimenti ai profili di autenticazione per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (uscita `1` quando mancante/scaduto, `2` quando in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe di probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo archiviato, probe riporta
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato di modello interrogabile per
  quel provider, probe riporta `status: no_model`.
- I cooldown del rate limit possono essere specifici per modello. Un profilo in cooldown per un
  modello può essere ancora utilizzabile per un modello fratello sullo stesso provider.

Gli script operativi opzionali (systemd/Termux) sono documentati qui:
[Script di monitoraggio dell'autenticazione](/it/help/scripts#auth-monitoring-scripts)

## Nota su Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Lo staff di Anthropic ci ha detto che questo percorso di integrazione di OpenClaw è di nuovo consentito.
- OpenClaw quindi considera il riutilizzo della CLI di Claude e l'uso di `claude -p` come autorizzati
  per esecuzioni supportate da Anthropic, a meno che Anthropic non pubblichi una nuova policy.
- Le chiavi API Anthropic restano la scelta più prevedibile per host Gateway
  di lunga durata e per un controllo esplicito della fatturazione lato server.

## Verifica dello stato dell'autenticazione del modello

```bash
openclaw models status
openclaw doctor
```

## Comportamento della rotazione delle chiavi API (Gateway)

Alcuni provider supportano il nuovo tentativo di una richiesta con chiavi alternative quando una chiamata API
raggiunge un rate limit del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw ritenta con la chiave successiva solo per errori di rate limit (per esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, o
  `workers_ai ... quota limit exceeded`).
- Gli errori non dovuti a rate limit non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Controllare quale credenziale viene usata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (esempio di id profilo: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + profilo di autenticazione successivo, oltre ai dettagli dell'endpoint provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine dei profili di autenticazione per un agente (archiviato nel `auth-state.json` di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per indirizzare un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i
profili archiviati omessi come `excluded_by_auth_order` invece di saltarli in silenzio.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown del rate limit possono essere legati
a un id modello anziché all'intero profilo provider.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull'**host Gateway**
oppure imposta il percorso del token di configurazione Anthropic, poi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo è in scadenza. Se un
profilo token Anthropic manca o è scaduto, aggiorna quella configurazione tramite
token di configurazione oppure migra a una chiave API Anthropic.
