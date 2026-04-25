---
read_when:
    - Aggiunta o modifica della CLI dei modelli (models list/set/scan/aliases/fallbacks)
    - Modifica del comportamento di fallback del modello o della UX di selezione
    - Aggiornamento delle sonde di scansione del modello (strumenti/immagini)
summary: 'CLI Models: elenco, impostazione, alias, fallback, scansione, stato'
title: CLI Models
x-i18n:
    generated_at: "2026-04-25T13:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Vedi [/concepts/model-failover](/it/concepts/model-failover) per la
rotazione dei profili di autenticazione, i cooldown e come interagiscono con i fallback.
Panoramica rapida dei provider + esempi: [/concepts/model-providers](/it/concepts/model-providers).
I riferimenti ai modelli scelgono un provider e un modello. Di solito non scelgono il
runtime agente di basso livello. Ad esempio, `openai/gpt-5.5` può essere eseguito tramite il
normale percorso provider OpenAI oppure tramite il runtime del server app Codex, a seconda di
`agents.defaults.embeddedHarness.runtime`. Vedi
[/concepts/agent-runtimes](/it/concepts/agent-runtimes).

## Come funziona la selezione del modello

OpenClaw seleziona i modelli in questo ordine:

1. Modello **primario** (`agents.defaults.model.primary` oppure `agents.defaults.model`).
2. **Fallback** in `agents.defaults.model.fallbacks` (in ordine).
3. Il **failover dell'autenticazione del provider** avviene all'interno di un provider prima di passare al
   modello successivo.

Correlati:

- `agents.defaults.models` è la allowlist/catalogo dei modelli che OpenClaw può usare (più gli alias).
- `agents.defaults.imageModel` viene usato **solo quando** il modello primario non può accettare immagini.
- `agents.defaults.pdfModel` viene usato dallo strumento `pdf`. Se omesso, lo strumento
  usa come fallback `agents.defaults.imageModel`, quindi il modello risolto della sessione/predefinito.
- `agents.defaults.imageGenerationModel` viene usato dalla funzionalità condivisa di generazione immagini. Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di id provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/la chiave API di quel provider.
- `agents.defaults.musicGenerationModel` viene usato dalla funzionalità condivisa di generazione musicale. Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di id provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/la chiave API di quel provider.
- `agents.defaults.videoGenerationModel` viene usato dalla funzionalità condivisa di generazione video. Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di id provider. Se imposti un provider/modello specifico, configura anche l'autenticazione/la chiave API di quel provider.
- I valori predefiniti per agente possono sovrascrivere `agents.defaults.model` tramite `agents.list[].model` più le associazioni (vedi [/concepts/multi-agent](/it/concepts/multi-agent)).

## Regola rapida per i modelli

- Imposta come primario il modello più forte e di ultima generazione a tua disposizione.
- Usa i fallback per attività sensibili a costi/latenza e per chat meno critiche.
- Per agenti con strumenti abilitati o input non attendibili, evita livelli di modello più vecchi/deboli.

## Onboarding (consigliato)

Se non vuoi modificare manualmente la configurazione, esegui l'onboarding:

```bash
openclaw onboard
```

Può configurare modello + autenticazione per i provider comuni, inclusi **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chiave API o Claude CLI).

## Chiavi di configurazione (panoramica)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parametri provider)
- `models.providers` (provider personalizzati scritti in `models.json`)

I riferimenti ai modelli vengono normalizzati in minuscolo. Alias provider come `z.ai/*` vengono normalizzati
in `zai/*`.

Esempi di configurazione del provider (incluso OpenCode) sono disponibili in
[/providers/opencode](/it/providers/opencode).

### Modifiche sicure alla allowlist

Usa scritture additive quando aggiorni manualmente `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protegge le mappe modello/provider da sovrascritture accidentali. Una
semplice assegnazione di oggetto a `agents.defaults.models`, `models.providers` o
`models.providers.<id>.models` viene rifiutata quando rimuoverebbe voci esistenti.
Usa `--merge` per modifiche additive; usa `--replace` solo quando il
valore fornito deve diventare l'intero valore di destinazione.

Anche la configurazione interattiva del provider e `openclaw configure --section model` uniscono
le selezioni con ambito provider nella allowlist esistente, così l'aggiunta di Codex,
Ollama o un altro provider non elimina voci di modello non correlate.
Configure preserva un valore esistente di `agents.defaults.model.primary` quando l'autenticazione del provider
viene riapplicata. I comandi espliciti di impostazione del predefinito come
`openclaw models auth login --provider <id> --set-default` e
`openclaw models set <model>` continuano invece a sostituire `agents.defaults.model.primary`.

## "Il modello non è consentito" (e perché le risposte si interrompono)

Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e per
gli override di sessione. Quando un utente seleziona un modello che non è in quella allowlist,
OpenClaw restituisce:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Questo accade **prima** che venga generata una normale risposta, quindi il messaggio può dare l'impressione
che “non abbia risposto”. La soluzione è:

- Aggiungere il modello a `agents.defaults.models`, oppure
- Cancellare la allowlist (rimuovere `agents.defaults.models`), oppure
- Scegliere un modello da `/model list`.

Esempio di configurazione della allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Cambio modello in chat (`/model`)

Puoi cambiare modello per la sessione corrente senza riavviare:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Note:

- `/model` (e `/model list`) è un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat.
- `/model <#>` seleziona da quel selettore.
- `/model` rende persistente immediatamente la nuova selezione di sessione.
- Se l'agente è inattivo, l'esecuzione successiva usa subito il nuovo modello.
- Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l'attività degli strumenti o l'output della risposta sono già iniziati, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
- `/model status` è la vista dettagliata (candidati di autenticazione e, quando configurati, `baseUrl` dell'endpoint provider + modalità `api`).
- I riferimenti ai modelli vengono analizzati dividendo sul **primo** `/`. Usa `provider/model` quando digiti `/model <ref>`.
- Se l'id del modello contiene esso stesso `/` (stile OpenRouter), devi includere il prefisso provider (esempio: `/model openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input in questo ordine:
  1. corrispondenza alias
  2. corrispondenza univoca del provider configurato per quell'esatto id modello senza prefisso
  3. fallback deprecato al provider predefinito configurato
     Se quel provider non espone più il modello predefinito configurato, OpenClaw
     usa invece come fallback il primo provider/modello configurato per evitare
     di mostrare un predefinito obsoleto di un provider rimosso.

Comportamento/configurazione completi del comando: [Comandi slash](/it/tools/slash-commands).

## Comandi CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (senza sottocomando) è una scorciatoia per `models status`.

### `models list`

Mostra per impostazione predefinita i modelli configurati. Flag utili:

- `--all`: catalogo completo
- `--local`: solo provider locali
- `--provider <id>`: filtra per id provider, ad esempio `moonshot`; le etichette visualizzate dai selettori interattivi non sono accettate
- `--plain`: un modello per riga
- `--json`: output leggibile dalla macchina

`--all` include le righe statiche del catalogo di proprietà del provider incluso prima che sia
configurata l'autenticazione, quindi le viste di sola individuazione possono mostrare modelli che non sono disponibili finché
non aggiungi credenziali provider corrispondenti.

### `models status`

Mostra il modello primario risolto, i fallback, il modello immagini e una panoramica di autenticazione
dei provider configurati. Mostra anche lo stato di scadenza OAuth per i profili trovati
nell'archivio di autenticazione (avvisa entro 24 ore per impostazione predefinita). `--plain` stampa solo il
modello primario risolto.
Lo stato OAuth viene sempre mostrato (e incluso nell'output `--json`). Se un provider configurato
non ha credenziali, `models status` stampa una sezione **Autenticazione mancante**.
Il JSON include `auth.oauth` (finestra di avviso + profili) e `auth.providers`
(autenticazione effettiva per provider, incluse le credenziali supportate da env). `auth.oauth`
è solo lo stato di integrità dei profili dell'archivio autenticazione; i provider solo-env non compaiono lì.
Usa `--check` per l'automazione (codice di uscita `1` quando manca/scaduta, `2` quando in scadenza).
Usa `--probe` per controlli live dell'autenticazione; le righe della sonda possono provenire da profili di autenticazione, credenziali env
oppure `models.json`.
Se `auth.order.<provider>` esplicito omette un profilo salvato, la sonda riporta
`excluded_by_auth_order` invece di provarlo. Se l'autenticazione esiste ma nessun modello sondabile può essere risolto per quel provider, la sonda riporta `status: no_model`.

La scelta dell'autenticazione dipende da provider/account. Per host Gateway sempre attivi, le chiavi API
sono di solito l'opzione più prevedibile; sono supportati anche il riuso di Claude CLI e i profili Anthropic OAuth/token esistenti.

Esempio (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scansione (modelli gratuiti OpenRouter)

`openclaw models scan` ispeziona il **catalogo dei modelli gratuiti** di OpenRouter e può
facoltativamente sondare i modelli per supporto a strumenti e immagini.

Flag principali:

- `--no-probe`: salta le sonde live (solo metadati)
- `--min-params <b>`: dimensione minima dei parametri (miliardi)
- `--max-age-days <days>`: salta i modelli più vecchi
- `--provider <name>`: filtro del prefisso provider
- `--max-candidates <n>`: dimensione della lista di fallback
- `--set-default`: imposta `agents.defaults.model.primary` sulla prima selezione
- `--set-image`: imposta `agents.defaults.imageModel.primary` sulla prima selezione immagine

Il catalogo OpenRouter `/models` è pubblico, quindi le scansioni solo metadati possono elencare
candidati gratuiti senza una chiave. Le sonde e l'inferenza richiedono comunque una
chiave API OpenRouter (da profili di autenticazione o `OPENROUTER_API_KEY`). Se nessuna chiave è
disponibile, `openclaw models scan` usa come fallback l'output solo metadati e lascia
invariata la configurazione. Usa `--no-probe` per richiedere esplicitamente la modalità solo metadati.

I risultati della scansione vengono classificati in base a:

1. Supporto immagini
2. Latenza degli strumenti
3. Dimensione del contesto
4. Numero di parametri

Input

- Elenco OpenRouter `/models` (filtro `:free`)
- Le sonde live richiedono una chiave API OpenRouter da profili di autenticazione o `OPENROUTER_API_KEY` (vedi [/environment](/it/help/environment))
- Filtri facoltativi: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controlli richiesta/sonda: `--timeout`, `--concurrency`

Quando le sonde live vengono eseguite in un TTY, puoi selezionare i fallback in modo interattivo. In
modalità non interattiva, passa `--yes` per accettare i valori predefiniti. I risultati solo metadati sono
informativi; `--set-default` e `--set-image` richiedono sonde live così
OpenClaw non configura un modello OpenRouter inutilizzabile senza chiave.

## Registro dei modelli (`models.json`)

I provider personalizzati in `models.providers` vengono scritti in `models.json` sotto la
directory dell'agente (predefinita `~/.openclaw/agents/<agentId>/agent/models.json`). Questo file
viene unito per impostazione predefinita a meno che `models.mode` non sia impostato su `replace`.

Precedenza in modalità merge per ID provider corrispondenti:

- Un `baseUrl` non vuoto già presente nel `models.json` dell'agente ha la precedenza.
- Un `apiKey` non vuoto nel `models.json` dell'agente ha la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di configurazione/profilo di autenticazione.
- I valori `apiKey` dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec) invece di rendere persistenti i segreti risolti.
- I valori degli header dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`secretref-env:ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec).
- `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano come fallback `models.providers` della configurazione.
- Gli altri campi del provider vengono aggiornati dalla configurazione e dai dati del catalogo normalizzati.

La persistenza dei marcatori è autorevole rispetto alla sorgente: OpenClaw scrive i marcatori dallo snapshot attivo della configurazione sorgente (pre-risoluzione), non dai valori dei segreti runtime risolti.
Questo si applica ogni volta che OpenClaw rigenera `models.json`, inclusi i percorsi guidati da comando come `openclaw agent`.

## Correlati

- [Provider dei modelli](/it/concepts/model-providers) — instradamento e autenticazione dei provider
- [Runtime degli agenti](/it/concepts/agent-runtimes) — PI, Codex e altri runtime del ciclo agente
- [Failover del modello](/it/concepts/model-failover) — catene di fallback
- [Generazione immagini](/it/tools/image-generation) — configurazione del modello immagine
- [Generazione musicale](/it/tools/music-generation) — configurazione del modello musicale
- [Generazione video](/it/tools/video-generation) — configurazione del modello video
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
