---
read_when:
    - Spiegazione dell'uso dei token, dei costi o delle finestre di contesto
    - Debug del comportamento di crescita del contesto o di Compaction
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'uso dei token + i costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-26T11:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token dipendono dal modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`).
  Il blocco compatto delle Skills è limitato da `skills.limits.maxSkillsPromptChars`,
  con override opzionale per agente in
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovi, più `MEMORY.md` quando presente). Il file root minuscolo `memory.md` non viene iniettato; è un input di riparazione legacy per `openclaw doctor --fix` quando è abbinato a `MEMORY.md`. I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; rimangono disponibili su richiesta tramite gli strumenti di memoria nei turni ordinari, ma `/new` e `/reset` senza argomenti possono anteporre un blocco monouso di contesto di avvio con la memoria giornaliera recente per quel primo turno. Questo preludio di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento di Heartbeat
- Metadati di runtime (host/OS/modello/thinking)

Consulta la scomposizione completa in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta verso il limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di Compaction e artefatti di pruning
- Wrapper del provider o header di sicurezza (non visibili, ma comunque conteggiati)

Alcune superfici pesanti a runtime hanno i propri limiti espliciti:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano in `agents.list[].contextLimits`. Queste opzioni
servono per estratti runtime limitati e blocchi iniettati posseduti dal runtime. Sono
separate dai limiti bootstrap, dai limiti del contesto di avvio e dai limiti del
prompt delle Skills.

Per le immagini, OpenClaw ridimensiona i payload immagine di trascrizione/strumento prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolare questo comportamento:

- Valori più bassi di solito riducono l'uso di vision token e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per screenshot pesanti in termini di OCR/UI.

Per una scomposizione pratica (per ogni file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso attuale dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, l'uso del contesto,
  i token di input/output dell'ultima risposta e il **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` e `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% rimasto`, non costi per risposta).
  Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano i comuni alias dei campi nativi del provider prima della visualizzazione.
Per il traffico Responses della famiglia OpenAI, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi specifici del trasporto
non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'utilizzo JSON di Gemini CLI viene normalizzato: il testo della risposta proviene da `response`, e
`stats.cached` viene mappato a `cacheRead` con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo esplicito `stats.input`.
Per il traffico Responses nativo della famiglia OpenAI, gli alias di utilizzo WebSocket/SSE vengono
normalizzati allo stesso modo e i totali ricadono su input + output normalizzati quando
`total_tokens` è mancante o uguale a `0`.
Quando lo snapshot della sessione corrente è ridotto, `/status` e `session_status` possono
anche recuperare contatori token/cache e l'etichetta del modello runtime attivo dal
log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero mantengono comunque
la precedenza sui valori di fallback della trascrizione, e i totali orientati al prompt più grandi
della trascrizione possono prevalere quando i totali memorizzati mancano o sono inferiori.
L'autenticazione di utilizzo per le finestre di quota provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw ricade sull'abbinamento delle credenziali OAuth/chiave API
da auth profile, env o configurazione.
Le voci della trascrizione dell'assistente mantengono la stessa forma di utilizzo normalizzata, incluso
`usage.cost` quando il modello attivo ha un pricing configurato e il provider restituisce metadati di utilizzo.
Questo fornisce a `/usage cost` e allo stato della sessione basato sulla trascrizione una sorgente stabile anche dopo che lo stato runtime live non è più disponibile.

OpenClaw mantiene separata la contabilizzazione dell'utilizzo del provider dallo snapshot
del contesto corrente. `usage.total` del provider può includere input in cache, output e più chiamate
del modello nel loop degli strumenti, quindi è utile per costi e telemetria ma può sovrastimare
la finestra di contesto live. Le visualizzazioni e le diagnostiche del contesto usano lo snapshot
del prompt più recente (`promptTokens`, oppure l'ultima chiamata del modello quando non è disponibile alcuno snapshot del prompt) per `context.used`.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione di pricing del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se il pricing manca, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto di TTL della cache e pruning

La cache dei prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire il **cache-ttl pruning**: esegue il pruning della sessione una volta scaduto il TTL della cache,
quindi reimposta la finestra della cache così che le richieste successive possano riutilizzare il
contesto appena memorizzato in cache invece di rimettere in cache l'intera cronologia. Questo mantiene
più bassi i costi di scrittura in cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del Gateway](/it/gateway/configuration) e consulta i
dettagli del comportamento in [Pruning della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante i periodi di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo Heartbeat appena sotto tale valore (ad esempio `55m`) può evitare di
rimettere in cache l'intero prompt, riducendo i costi di scrittura in cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa opzione per opzione, vedi [Cache dei prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture dalla cache sono significativamente più economiche dei
token di input, mentre le scritture in cache vengono fatturate con un moltiplicatore più alto. Consulta i prezzi del
prompt caching di Anthropic per le tariffe e i moltiplicatori TTL più aggiornati:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda la cache di 1h con Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Esempio: traffico misto con strategia cache per agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline predefinita per la maggior parte degli agenti
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantiene calda la cache lunga per sessioni profonde
    - id: "alerts"
      params:
        cacheRetention: "none" # evita scritture in cache per notifiche a raffica
```

`agents.list[].params` viene unito sopra `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'header beta di contesto Anthropic 1M

La finestra di contesto 1M di Anthropic è attualmente protetta da beta. OpenClaw può iniettare il
valore `anthropic-beta` richiesto quando abiliti `context1m` sui modelli Opus
o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all'header beta `context-1m-2025-08-07` di Anthropic.

Si applica solo quando `context1m: true` è impostato su quella voce di modello.

Requisito: la credenziale deve essere idonea per l'uso del contesto lungo. In caso contrario,
Anthropic risponde con un errore di rate limit lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw salta l'header beta `context-1m-*` perché Anthropic attualmente
rifiuta quella combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riepilogare sessioni lunghe.
- Riduci gli output estesi degli strumenti nei tuoi flussi di lavoro.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni con molti screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavori verbosi ed esplorativi.

Vedi [Skills](/it/tools/skills) per la formula esatta dell'overhead dell'elenco delle Skills.

## Correlati

- [Utilizzo API e costi](/it/reference/api-usage-costs)
- [Cache dei prompt](/it/reference/prompt-caching)
- [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking)
