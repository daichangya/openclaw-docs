---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato auth del provider
    - Vuoi eseguire la scansione di modelli/provider disponibili e fare debug dei profili auth
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Models
x-i18n:
    generated_at: "2026-04-25T13:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Individuazione, scansione e configurazione dei modelli (modello predefinito, fallback, profili auth).

Correlati:

- Provider + modelli: [Models](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto Models](/it/concepts/models)
- Configurazione auth del provider: [Per iniziare](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra i valori predefiniti/fallback risolti più una panoramica auth.
Quando sono disponibili snapshot di utilizzo del provider, la sezione dello stato OAuth/API key include
finestre di utilizzo del provider e snapshot della quota.
Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'auth di utilizzo proviene da hook specifici del
provider quando disponibili; altrimenti OpenClaw usa come fallback la corrispondenza delle
credenziali OAuth/API key da profili auth, env o config.
Nell'output `--json`, `auth.providers` è la panoramica del provider
consapevole di env/config/store, mentre `auth.oauth` è solo lo stato dei profili
nell'archivio auth.
Aggiungi `--probe` per eseguire probe auth live contro ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/auth di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostati, altrimenti
l'agente predefinito configurato.
Le righe del probe possono provenire da profili auth, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge config, profili auth, stato del catalogo
  esistente e righe di catalogo possedute dal provider, ma non riscrive
  `models.json`.
- `models list --all` include le righe statiche di catalogo possedute dal provider incluse nel bundle anche
  quando non ti sei ancora autenticato con quel provider. Quelle righe vengono comunque mostrate
  come non disponibili finché non viene configurata l'auth corrispondente.
- `models list` mantiene distinti i metadati nativi del modello e i limiti runtime. Nell'output
  tabellare, `Ctx` mostra `contextTokens/contextWindow` quando un limite runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel limite.
- `models list --provider <id>` filtra per id provider, come `moonshot` o
  `openai-codex`. Non accetta etichette di visualizzazione dai selettori interattivi
  di provider, come `Moonshot AI`.
- I riferimenti modello vengono analizzati dividendoli sul **primo** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input prima come alias, poi
  come corrispondenza univoca del provider configurato per quell'esatto id modello, e solo dopo
  usa come fallback il provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  usa come fallback il primo provider/modello configurato invece di mostrare un
  predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output auth per segnaposto non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### `models scan`

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni di soli metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto di strumenti e immagini con chiamate modello live.
Se non è configurata alcuna chiave OpenRouter, il comando usa come fallback un output di soli metadati e spiega
che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca in config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout per richiesta catalogo e per singolo probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono probe live; i risultati della scansione
di soli metadati sono informativi e non vengono applicati alla config.

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (exit 1=mancante/scaduto, 2=in scadenza)
- `--probe` (probe live dei profili auth configurati)
- `--probe-provider <name>` (verifica un provider)
- `--probe-profile <id>` (ripetibile o id profilo separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket di stato del probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo del probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo archiviato, ma
  `auth.order.<provider>` esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: esiste auth del provider, ma OpenClaw non è riuscito a risolvere un
  candidato modello verificabile per quel provider.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profili auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'helper auth interattivo. Può avviare un flusso auth del provider
(OAuth/API key) o guidarti nell'incollare manualmente un token, a seconda del
provider che scegli.

`models auth login` esegue il flusso auth di un plugin provider (OAuth/API key). Usa
`openclaw plugins list` per vedere quali provider sono installati.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di auth tramite token.
- `setup-token` richiede una TTY interattiva ed esegue il metodo auth tramite token del provider
  (usando per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, richiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come consentiti per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- `setup-token` / `paste-token` di Anthropic restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
