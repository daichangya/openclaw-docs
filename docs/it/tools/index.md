---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Devi configurare, consentire o negare strumenti
    - Stai decidendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica di strumenti e Plugin OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-04-25T13:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e Plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad es. `exec`, `browser`,
    `web_search`, `message`). OpenClaw distribuisce un set di **strumenti integrati** e
    i Plugin possono registrarne di aggiuntivi.

    L'agente vede gli strumenti come definizioni di funzione strutturate inviate alla API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e guida passo passo per
    usare gli strumenti in modo efficace. Le Skills vivono nel tuo workspace, in cartelle condivise,
    oppure sono incluse nei Plugin.

    [Riferimento Skills](/it/tools/skills) | [Creare Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I Plugin impacchettano tutto insieme">
    Un Plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, speech, trascrizione realtime,
    voce realtime, comprensione dei media, generazione di immagini, generazione di video,
    web fetch, web search e altro ancora. Alcuni Plugin sono **core** (distribuiti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura Plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono distribuiti con OpenClaw e sono disponibili senza installare alcun Plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Code Execution](/it/tools/code-execution)                      |
| `browser`                                  | Controlla un browser Chromium (naviga, clicca, screenshot)           | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuti di pagina         | [Web](/it/tools/web), [Web Fetch](/it/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file nel workspace                                                |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Agent Send](/it/tools/agent-send)                              |
| `canvas`                                   | Guida il Canvas del Node (present, eval, snapshot)                    |                                                              |
| `nodes`                                    | Individua e indirizza dispositivi abbinati                            |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, patcha, riavvia o aggiorna il gateway |                                                          |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione di immagini](/it/tools/image-generation)           |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech one-shot                                   | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione sessioni, stato e orchestrazione di subagenti                | [Sub-agenti](/it/tools/subagents)                               |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro con le immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se punti a `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'auth/la chiave API di quel provider.

Per il lavoro musicale, usa `music_generate`. Se punti a `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'auth/la chiave API di quel provider.

Per il lavoro video, usa `video_generate`. Se punti a `qwen/*` o un altro provider video non predefinito, configura prima l'auth/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un Plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` cancella tale
override. Come `/status`, può riempire retroattivamente contatori sparsi di token/cache e l'
etichetta del modello runtime attivo a partire dall'ultima voce di utilizzo del transcript.

`gateway` è lo strumento runtime solo owner per le operazioni sul gateway:

- `config.schema.lookup` per un sottoalbero di configurazione con ambito percorso prima delle modifiche
- `config.get` per lo snapshot della configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione dell'intera configurazione
- `update.run` per self-update + riavvio espliciti

Per modifiche parziali, preferisci `config.schema.lookup` poi `config.patch`. Usa
`config.apply` solo quando vuoi intenzionalmente sostituire l'intera configurazione.
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati sugli stessi percorsi protetti di exec.

### Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di diff
- [LLM Task](/it/tools/llm-task) — fase LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Music Generation](/it/tools/music-generation) — strumento condiviso `music_generate` con provider supportati da workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta i risultati rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Allowlist e denylist

Controlla quali strumenti l'agente può chiamare tramite `tools.allow` / `tools.deny` nella
configurazione. Deny ha sempre la precedenza su allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fallisce in modo chiuso quando una allowlist esplicita si risolve in nessuno strumento invocabile.
Per esempio, `tools.allow: ["query_db"]` funziona solo se un Plugin caricato
registra effettivamente `query_db`. Se nessuno strumento integrato, Plugin o MCP incluso corrisponde alla
allowlist, l'esecuzione si ferma prima della chiamata al modello invece di continuare come
esecuzione solo testuale che potrebbe allucinare risultati di strumenti.

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima che venga applicato `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | solo `session_status`                                                                                                                             |

I profili `coding` e `messaging` consentono anche gli strumenti MCP inclusi configurati
sotto la chiave Plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include gli strumenti MCP inclusi.

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle allowlist/denylist:

| Gruppo             | Strumenti                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias di `exec`)                                     |
| `group:fs`         | read, write, edit, apply_patch                                                                              |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status   |
| `group:memory`     | memory_search, memory_get                                                                                   |
| `group:web`        | web_search, x_search, web_fetch                                                                             |
| `group:ui`         | browser, canvas                                                                                             |
| `group:automation` | cron, gateway                                                                                               |
| `group:messaging`  | message                                                                                                     |
| `group:nodes`      | nodes                                                                                                       |
| `group:agents`     | agents_list                                                                                                 |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                  |
| `group:openclaw`   | Tutti gli strumenti integrati di OpenClaw (esclude gli strumenti dei Plugin)                                |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
tag di thinking, scaffolding `<relevant-memories>`, payload XML di chiamate agli strumenti in testo semplice
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati),
scaffolding degradato delle chiamate agli strumenti, token di controllo del modello ASCII/full-width trapelati
e XML di chiamate agli strumenti MiniMax malformato dal testo dell'assistente, poi applica
redazione/troncamento e possibili segnaposto per righe troppo grandi invece di agire
come dump grezzo del transcript.

### Restrizioni specifiche del provider

Usa `tools.byProvider` per limitare gli strumenti per provider specifici senza
modificare i valori predefiniti globali:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
