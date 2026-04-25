---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dello spazio di lavoro o del comportamento della sessione
summary: Runtime dell'agente, contratto dello spazio di lavoro e bootstrap della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-04-25T13:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw esegue un **singolo runtime di agente incorporato** — un processo agente per
Gateway, con il proprio spazio di lavoro, file bootstrap e archivio sessioni. Questa pagina
descrive quel contratto di runtime: cosa deve contenere lo spazio di lavoro, quali file vengono
iniettati e come le sessioni eseguono il bootstrap rispetto a esso.

## Spazio di lavoro (obbligatorio)

OpenClaw usa una singola directory di spazio di lavoro dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dello spazio di lavoro.

Guida completa al layout dello spazio di lavoro + backup: [Agent workspace](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverlo con
spazi di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Gateway configuration](/it/gateway/configuration)).

## File bootstrap (iniettati)

All'interno di `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` — istruzioni operative + “memoria”
- `SOUL.md` — persona, confini, tono
- `TOOLS.md` — note sugli strumenti mantenute dall'utente (ad esempio `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` — rituale una tantum della prima esecuzione (eliminato dopo il completamento)
- `IDENTITY.md` — nome/vibe/emoji dell'agente
- `USER.md` — profilo utente + forma di indirizzo preferita

Nel primo turno di una nuova sessione, OpenClaw inietta direttamente il contenuto di questi file nel contesto dell'agente.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un marcatore in modo che i prompt restino snelli (leggi il file per il contenuto completo).

Se un file manca, OpenClaw inietta una singola riga marcatore “file mancante” (e `openclaw setup` creerà un template predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per uno **spazio di lavoro completamente nuovo** (nessun altro file bootstrap presente). Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato nei riavvii successivi.

Per disabilitare completamente la creazione dei file bootstrap (per spazi di lavoro pre-popolati), imposta:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e i relativi strumenti di sistema) sono sempre disponibili,
in base alla tool policy. `apply_patch` è facoltativo ed è controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; fornisce
indicazioni su come _vuoi tu_ che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (precedenza più alta per prime):

- Spazio di lavoro: `<workspace>/skills`
- Skills agent del progetto: `<workspace>/.agents/skills`
- Skills agent personali: `~/.agents/skills`
- Managed/locali: `~/.openclaw/skills`
- Bundled (incluse con l'installazione)
- Cartelle Skills aggiuntive: `skills.load.extraDirs`

Le Skills possono essere controllate da config/env (vedi `skills` in [Gateway configuration](/it/gateway/configuration)).

## Confini del runtime

Il runtime dell'agente incorporato è costruito sul core dell'agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, rilevamento, cablaggio degli strumenti e consegna sui canali
sono livelli posseduti da OpenClaw sopra quel core.

## Sessioni

I transcript delle sessioni vengono archiviati come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile ed è scelto da OpenClaw.
Le cartelle di sessione legacy di altri strumenti non vengono lette.

## Steering durante lo streaming

Quando la modalità coda è `steer`, i messaggi in ingresso vengono iniettati nell'esecuzione corrente.
Lo steering accodato viene consegnato **dopo che il turno corrente dell'assistente ha finito di
eseguire le sue chiamate agli strumenti**, prima della successiva chiamata al LLM. Lo steering non salta più
le chiamate agli strumenti rimanenti del messaggio corrente dell'assistente; inietta invece il messaggio
accodato al successivo confine del modello.

Quando la modalità coda è `followup` o `collect`, i messaggi in ingresso vengono trattenuti fino alla
fine del turno corrente, poi un nuovo turno dell'agente inizia con i payload accodati. Vedi
[Queue](/it/concepts/queue) per il comportamento di modalità + debounce/cap.

Lo block streaming invia i blocchi completati dell'assistente non appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; predefinito `text_end`).
Controlla la suddivisione soft dei blocchi con `agents.defaults.blockStreamingChunk` (predefinito
800–1200 caratteri; preferisce interruzioni di paragrafo, poi newline; per ultime le frasi).
Raggruppa i blocchi in streaming con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam di singole righe (unione basata sull'inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (senza debounce); la Control UI
trasmette l'output degli strumenti tramite eventi dell'agente quando disponibile.
Maggiori dettagli: [Streaming + chunking](/it/concepts/streaming).

## Riferimenti ai modelli

I riferimenti ai modelli nella config (ad esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati suddividendo sulla **prima** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID del modello stesso contiene `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca
  del provider configurato per quell'esatto id modello, e solo dopo ricorre
  al provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw ricorre al primo
  provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Next: [Chat di gruppo](/it/channels/group-messages)_ 🦞

## Correlati

- [Agent workspace](/it/concepts/agent-workspace)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Gestione delle sessioni](/it/concepts/session)
