---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Devi configurare, consentire o negare gli strumenti
    - Stai decidendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica degli strumenti e dei Plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-04-26T11:39:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite gli **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e Plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad esempio `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i Plugin possono registrarne altri aggiuntivi.

    L'agente vede gli strumenti come definizioni strutturate di funzione inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e indicazioni passo dopo passo per
    usare gli strumenti in modo efficace. Le Skills si trovano nel tuo workspace, in cartelle condivise,
    oppure sono incluse nei Plugin.

    [Riferimento Skills](/it/tools/skills) | [Creazione di Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I Plugin mettono tutto insieme in un unico pacchetto">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, sintesi vocale, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    recupero web, ricerca web e altro ancora. Alcuni Plugin sono **core** (inclusi con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installare e configurare i Plugin](/it/tools/plugin) | [Creare il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi con OpenClaw e sono disponibili senza installare alcun Plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Code Execution](/it/tools/code-execution)                      |
| `browser`                                  | Controlla un browser Chromium (navigazione, clic, screenshot)         | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuti di pagine          | [Web](/it/tools/web), [Recupero Web](/it/tools/web-fetch)          |
| `read` / `write` / `edit`                  | I/O dei file nel workspace                                            |                                                              |
| `apply_patch`                              | Patch multi-hunk dei file                                             | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi attraverso tutti i canali                              | [Invio agente](/it/tools/agent-send)                            |
| `canvas`                                   | Controlla node Canvas (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | Rileva e seleziona dispositivi associati                              |                                                              |
| `cron` / `gateway`                         | Gestisce processi pianificati; ispeziona, corregge, riavvia o aggiorna il Gateway |                                                   |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione di immagini](/it/tools/image-generation)           |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech una tantum                                 | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione sessioni, stato e orchestrazione di sotto-agenti             | [Sotto-agenti](/it/tools/subagents)                             |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se scegli come target `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro musicale, usa `music_generate`. Se scegli come target `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro video, usa `video_generate`. Se scegli come target `qwen/*` o un altro provider video non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un Plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo sessions.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` cancella tale
override. Come `/status`, può reintegrare contatori token/cache sparsi e l'etichetta del
modello runtime attivo dalla voce di utilizzo più recente della trascrizione.

`gateway` è lo strumento runtime solo per il proprietario per le operazioni del Gateway:

- `config.schema.lookup` per un sottoalbero di configurazione limitato a un percorso prima delle modifiche
- `config.get` per lo snapshot della configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` e poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l'intera configurazione.
Per una documentazione più ampia sulla configurazione, leggi [Configurazione](/it/gateway/configuration) e
[Riferimento configurazione](/it/gateway/configuration-reference).
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

### Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di diff
- [LLM Task](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider supportati da workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta risultati rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Elenchi di autorizzazione e negazione

Controlla quali strumenti l'agente può chiamare tramite `tools.allow` / `tools.deny` nella
configurazione. La negazione ha sempre la precedenza sull'autorizzazione.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fallisce in modo chiuso quando un elenco esplicito di autorizzazioni non si risolve in alcuno strumento richiamabile.
Per esempio, `tools.allow: ["query_db"]` funziona solo se un Plugin caricato registra davvero
`query_db`. Se nessuno strumento integrato, di Plugin o MCP incluso corrisponde all'elenco di autorizzazioni,
l'esecuzione si interrompe prima della chiamata al modello invece di continuare come
esecuzione solo testuale che potrebbe allucinare risultati di strumenti.

### Profili degli strumenti

`tools.profile` imposta un elenco base di autorizzazioni prima che vengano applicati `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | solo `session_status`                                                                                                                             |

`coding` include strumenti web leggeri (`web_search`, `web_fetch`, `x_search`)
ma non lo strumento completo di controllo del browser. L'automazione del browser può controllare sessioni reali
e profili con accesso effettuato, quindi aggiungilo esplicitamente con
`tools.alsoAllow: ["browser"]` o con un
`agents.list[].tools.alsoAllow: ["browser"]` per agente.

I profili `coding` e `messaging` consentono anche gli strumenti MCP inclusi configurati
sotto la chiave Plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP inclusi.

### Gruppi di strumenti

Usa le abbreviazioni `group:*` negli elenchi allow/deny:

| Gruppo             | Strumenti                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias di `exec`)                                   |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tutti gli strumenti integrati OpenClaw (esclude gli strumenti dei Plugin)                                 |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per la sicurezza. Rimuove i tag di thinking, l'impalcatura `<relevant-memories>`, i payload XML delle chiamate agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati), l'impalcatura declassata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza piena trapelati e l'XML di chiamata agli strumenti MiniMax malformato dal testo dell'assistente, quindi applica la redazione/troncatura ed eventuali segnaposto per righe troppo grandi invece di comportarsi come un dump grezzo della trascrizione.

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
