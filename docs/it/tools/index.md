---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Devi configurare, consentire o negare gli strumenti
    - Stai decidendo tra strumenti integrati, Skills e plugin
summary: 'Panoramica di strumenti e plugin di OpenClaw: cosa può fare l’agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-04-22T08:20:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# Strumenti e Plugin

Tutto ciò che l’agente fa oltre a generare testo avviene tramite gli **strumenti**.
Gli strumenti sono il modo in cui l’agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l’agente richiama">
    Uno strumento è una funzione tipizzata che l’agente può invocare (ad es. `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i plugin possono registrarne di aggiuntivi.

    L’agente vede gli strumenti come definizioni di funzione strutturate inviate all’API del modello.

  </Step>

  <Step title="Le Skills insegnano all’agente quando e come">
    Una Skill è un file markdown (`SKILL.md`) iniettato nel system prompt.
    Le Skills forniscono all’agente contesto, vincoli e una guida passo passo per
    usare gli strumenti in modo efficace. Le Skills si trovano nel tuo workspace, in cartelle
    condivise oppure possono essere incluse nei plugin.

    [Riferimento Skills](/it/tools/skills) | [Creazione di Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I plugin riuniscono tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    recupero web, ricerca web e altro ancora. Alcuni plugin sono **core** (forniti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura i plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi in OpenClaw e sono disponibili senza installare alcun plugin:

| Tool                                       | Cosa fa                                                               | Pagina                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec)                         |
| `code_execution`                           | Esegue analisi Python remota in sandbox                               | [Code Execution](/it/tools/code-execution)     |
| `browser`                                  | Controlla un browser Chromium (navigazione, clic, screenshot)         | [Browser](/it/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Cerca nel web, cerca post su X, recupera il contenuto delle pagine    | [Web](/it/tools/web)                           |
| `read` / `write` / `edit`                  | I/O dei file nel workspace                                            |                                             |
| `apply_patch`                              | Patch di file multi-hunk                                              | [Apply Patch](/it/tools/apply-patch)           |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Agent Send](/it/tools/agent-send)             |
| `canvas`                                   | Controlla node Canvas (present, eval, snapshot)                       |                                             |
| `nodes`                                    | Individua e seleziona dispositivi associati                           |                                             |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, corregge, riavvia o aggiorna il Gateway |                                             |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Image Generation](/it/tools/image-generation) |
| `music_generate`                           | Genera tracce musicali                                                | [Music Generation](/it/tools/music-generation) |
| `video_generate`                           | Genera video                                                          | [Video Generation](/it/tools/video-generation) |
| `tts`                                      | Conversione text-to-speech one-shot                                   | [TTS](/it/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Gestione delle sessioni, stato e orchestrazione di sotto-agenti       | [Sub-agents](/it/tools/subagents)              |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Session Tools](/it/concepts/session-tool)     |

Per il lavoro con le immagini, usa `image` per l’analisi e `image_generate` per la generazione o la modifica. Se scegli `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l’autenticazione/la chiave API di quel provider.

Per il lavoro con la musica, usa `music_generate`. Se scegli `google/*`, `minimax/*` o un altro provider di musica non predefinito, configura prima l’autenticazione/la chiave API di quel provider.

Per il lavoro con i video, usa `video_generate`. Se scegli `qwen/*` o un altro provider di video non predefinito, configura prima l’autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo sessions.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` cancella tale
override. Come `/status`, può ricostruire contatori sparsi di token/cache e l’etichetta del
modello runtime attivo a partire dall’ultima voce di utilizzo nella trascrizione.

`gateway` è lo strumento runtime solo per owner per le operazioni del Gateway:

- `config.schema.lookup` per un singolo sottoalbero di configurazione limitato a un percorso prima delle modifiche
- `config.get` per lo snapshot della configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per self-update esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` e poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l’intera configurazione.
Lo strumento si rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
i vecchi alias `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di diff
- [LLM Task](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Music Generation](/it/tools/music-generation) — strumento condiviso `music_generate` con provider basati su workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — risultati compatti e meno rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Liste di consentiti e negati

Controlla quali strumenti l’agente può richiamare tramite `tools.allow` / `tools.deny` nella
configurazione. I negati hanno sempre la precedenza sui consentiti.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima che vengano applicati `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | solo `session_status`                                                                                                                             |

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle liste di consentiti/negati:

| Gruppo             | Strumenti                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias per `exec`)                                   |
| `group:fs`         | read, write, edit, apply_patch                                                                              |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status  |
| `group:memory`     | memory_search, memory_get                                                                                   |
| `group:web`        | web_search, x_search, web_fetch                                                                             |
| `group:ui`         | browser, canvas                                                                                             |
| `group:automation` | cron, gateway                                                                                               |
| `group:messaging`  | message                                                                                                     |
| `group:nodes`      | nodes                                                                                                       |
| `group:agents`     | agents_list                                                                                                 |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                  |
| `group:openclaw`   | Tutti gli strumenti integrati di OpenClaw (esclude gli strumenti dei plugin)                               |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
tag di ragionamento, scaffolding `<relevant-memories>`, payload XML di chiamate agli strumenti in testo semplice
(compresi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati),
scaffolding declassato di chiamata agli strumenti, token di controllo del modello ASCII/a larghezza piena fuoriusciti
e XML malformato di chiamata agli strumenti MiniMax dal testo dell’assistente, quindi applica
redazione/troncamento ed eventuali placeholder per righe troppo grandi invece di comportarsi
come un dump grezzo della trascrizione.

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
