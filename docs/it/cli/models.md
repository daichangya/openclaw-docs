---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili e diagnosticare i profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-04-26T11:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Individuazione, analisi e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto di modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Per iniziare](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra i valori predefiniti/fallback risolti insieme a una panoramica dell'autenticazione.
Quando sono disponibili snapshot di utilizzo del provider, la sezione dello stato OAuth/chiave API include
finestre di utilizzo del provider e snapshot delle quote.
Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione di utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw usa come fallback le credenziali OAuth/chiave API
corrispondenti dai profili di autenticazione, dall'ambiente o dalla configurazione.
Nell'output `--json`, `auth.providers` è la panoramica del provider
consapevole di env/config/store, mentre `auth.oauth` è solo lo stato dei profili dell'archivio di autenticazione.
Aggiungi `--probe` per eseguire probe di autenticazione live su ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare limiti di velocità).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agente predefinito
configurato.
Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge configurazione, profili di autenticazione, stato
  esistente del catalogo e righe del catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- `models list --all --provider <id>` può includere righe statiche del catalogo di proprietà del provider
  dai manifest dei Plugin o dai metadati del catalogo provider inclusi anche quando
  non ti sei ancora autenticato con quel provider. Quelle righe risultano comunque come
  non disponibili finché non viene configurata l'autenticazione corrispondente.
- `models list` mantiene distinti i metadati nativi del modello e i limiti runtime. Nell'output
  tabellare, `Ctx` mostra `contextTokens/contextWindow` quando un limite runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel limite.
- `models list --provider <id>` filtra per id provider, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori interattivi dei provider,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati separando sul **primo** `/`. Se l'ID del modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza univoca tra i provider configurati per quell'esatto id modello, e solo dopo
  usa come fallback il provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  usa come fallback il primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per segnaposto non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### `models scan`

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le analisi solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto di strumenti e immagini con chiamate live al modello.
Se non è configurata alcuna chiave OpenRouter, il comando usa come fallback
l'output solo metadati e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca in config/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta al catalogo e di ogni probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono probe live; i risultati dell'analisi solo metadati
sono informativi e non vengono applicati alla configurazione.

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (uscita 1=mancante/scaduto, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (esegue il probe di un provider)
- `--probe-profile <id>` (ripetibile o id profilo separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorie di stato del probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo del probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma `auth.order.<provider>`
  esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: esiste l'autenticazione del provider, ma OpenClaw non ha potuto risolvere
  un candidato di modello verificabile per quel provider.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profili di autenticazione

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'assistente interattivo per l'autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente un token, a seconda del
provider scelto.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati dell'autenticazione in un
archivio di agente configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `login`, `setup-token`, `paste-token` e `login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider
  (usando per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o da automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- `setup-token` / `paste-token` per Anthropic restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
