---
read_when:
    - Vuoi un fallback affidabile quando i provider API non funzionano
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi capire il bridge MCP local loopback per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback della CLI AI locale con bridge strumenti MCP opzionale'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-23T14:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
sono soggetti a limitazioni di frequenza o si comportano temporaneamente in modo anomalo. Si tratta intenzionalmente di una soluzione conservativa:

- **Gli strumenti di OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge MCP local loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (quindi i turni successivi restano coerenti).
- **Le immagini possono essere inoltrate** se la CLI accetta percorsi di immagini.

Questo è progettato come **rete di sicurezza** piuttosto che come percorso principale. Usalo quando
vuoi risposte testuali che “funzionano sempre” senza fare affidamento su API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
associazione thread/conversazione e sessioni di coding esterne persistenti, usa
[ACP Agents](/it/tools/acp-agents). I backend CLI non sono ACP.

## Guida rapida per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il Plugin OpenAI incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se il tuo gateway viene eseguito sotto launchd/systemd e PATH è minimale, aggiungi solo il
percorso del comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Questo è tutto. Non sono necessarie chiavi né configurazioni di autenticazione aggiuntive oltre a quelle della CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi principale** su un
host gateway, OpenClaw ora carica automaticamente il Plugin incluso proprietario quando la tua configurazione
fa esplicito riferimento a quel backend in un model ref o sotto
`agents.defaults.cliBackends`.

## Utilizzarlo come fallback

Aggiungi un backend CLI al tuo elenco di fallback in modo che venga eseguito solo quando i modelli primari non riescono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere anche lì i modelli del tuo backend CLI.
- Se il provider primario non funziona (autenticazione, limiti di frequenza, timeout), OpenClaw
  proverà poi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **id provider** (ad esempio `codex-cli`, `my-cli`).
L'id provider diventa il lato sinistro del tuo model ref:

```
<provider>/<model>
```

### Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Le CLI in stile Codex possono invece puntare a un file prompt:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Come funziona

1. **Seleziona un backend** in base al prefisso del provider (`codex-cli/...`).
2. **Costruisce un system prompt** usando lo stesso prompt OpenClaw + il contesto del workspace.
3. **Esegue la CLI** con un id sessione (se supportato) in modo che la cronologia resti coerente.
   Il backend `claude-cli` incluso mantiene attivo un processo Claude stdio per ogni
   sessione OpenClaw e invia i turni successivi tramite stream-json su stdin.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Mantiene gli id sessione** per backend, in modo che i turni successivi riutilizzino la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` incluso è di nuovo supportato. Il personale Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l'uso di `claude -p` come autorizzato per questa integrazione, a meno che Anthropic non pubblichi
una nuova policy.
</Note>

Il backend OpenAI `codex-cli` incluso passa il system prompt di OpenClaw tramite
l'override della configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend Anthropic `claude-cli` incluso riceve lo snapshot delle Skills di OpenClaw
in due modi: il catalogo compatto delle Skills di OpenClaw nel system prompt aggiunto, e
un Plugin Claude Code temporaneo passato con `--plugin-dir`. Il Plugin contiene
solo le Skills idonee per quell'agente/sessione, quindi il resolver nativo delle skill di Claude Code
vede lo stesso insieme filtrato che altrimenti OpenClaw pubblicizzerebbe nel
prompt. Le sostituzioni di env/chiavi API delle skill vengono comunque applicate da OpenClaw all'ambiente
del processo figlio per l'esecuzione.

Prima che OpenClaw possa usare il backend `claude-cli` incluso, Claude Code stesso
deve già aver effettuato l'accesso sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) o
  `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` alla ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se non ne è memorizzato nessuno).
  - `existing`: invia un id sessione solo se ne era già stato memorizzato uno.
  - `none`: non invia mai un id sessione.
- `claude-cli` usa per impostazione predefinita `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` in modo che i turni successivi riutilizzino il processo Claude attivo mentre
  è attivo. Lo stdio warm è ora il comportamento predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo termina,
  OpenClaw riprende dall'id sessione Claude memorizzato. Gli id sessione memorizzati vengono verificati
  rispetto a una trascrizione di progetto esistente e leggibile prima della ripresa, così i binding fantasma
  vengono eliminati con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI con `--resume`.
- Le sessioni CLI memorizzate sono continuità di proprietà del provider. Il reset giornaliero implicito
  non le interrompe; `/reset` e le policy esplicite `session.reset` sì.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa lane.
- La maggior parte delle CLI serializza su una lane provider.
- OpenClaw interrompe il riutilizzo della sessione CLI memorizzata quando cambia l'identità di autenticazione selezionata,
  incluso un id profilo di autenticazione cambiato, una chiave API statica, un token statico o
  l'identità dell'account OAuth quando la CLI la espone. La rotazione del token di accesso e refresh OAuth
  non interrompe la sessione CLI memorizzata. Se una CLI non espone un id account OAuth stabile,
  OpenClaw lascia che sia quella CLI a imporre i permessi di ripresa.

## Immagini (inoltro diretto)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, tali
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (path injection), il che è sufficiente per le CLI che caricano automaticamente
i file locali da semplici percorsi.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'uso da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza flussi JSONL (ad esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (di proprietà del Plugin)

Il Plugin OpenAI incluso registra anche un valore predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Il Plugin Google incluso registra anche un valore predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la Gemini CLI locale deve essere installata e disponibile come
`gemini` in `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note JSON per Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'uso usa `stats` come fallback quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
- Se `stats.input` manca, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

Esegui override solo se necessario (caso comune: percorso `command` assoluto).

## Valori predefiniti di proprietà del Plugin

I valori predefiniti del backend CLI ora fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei model ref.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite
  l'hook facoltativo `normalizeConfig`.

I Plugin che hanno bisogno di piccoli shim di compatibilità per prompt/messaggi possono dichiarare
trasformazioni bidirezionali del testo senza sostituire un provider o un backend CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` riscrive il system prompt e il prompt utente passati alla CLI. `output`
riscrive i delta assistant in streaming e il testo finale analizzato prima che OpenClaw gestisca
i propri marker di controllo e la consegna sul canale.

Per le CLI che emettono JSONL compatibile con stream-json di Claude Code, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay MCP bundle

I backend CLI **non** ricevono direttamente le chiamate agli strumenti di OpenClaw, ma un backend può
abilitare una overlay di configurazione MCP generata con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: file di configurazione MCP strict generato
- `codex-cli`: override di configurazione inline per `mcp_servers`
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP local loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto del canale correnti
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualunque configurazione/forma di impostazioni MCP del backend già esistente
- riscrive la configurazione di avvio usando la modalità di integrazione di proprietà del backend dall'estensione proprietaria

Se non sono abilitati server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend abilita bundle MCP, così le esecuzioni in background restano isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti di OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando abilitano
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri accumulano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (senza JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw continuano comunque a funzionare
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome del modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (al momento Codex CLI non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi dei file).
