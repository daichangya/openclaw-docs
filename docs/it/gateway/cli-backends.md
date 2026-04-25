---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi comprendere il bridge local loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge facoltativo per strumenti MCP'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-25T13:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
sono soggetti a rate limit o si comportano male temporaneamente. Questo approccio è intenzionalmente conservativo:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge local loopback MCP.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (quindi i turni successivi restano coerenti).
- **Le immagini possono essere inoltrate** se la CLI accetta percorsi di immagini.

Questo è progettato come **rete di sicurezza** piuttosto che come percorso primario. Usalo quando
vuoi risposte testuali “sempre funzionanti” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding thread/conversazione e sessioni di coding esterne persistenti, usa invece
[ACP Agents](/it/tools/acp-agents). I backend CLI non sono ACP.

## Avvio rapido per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il Plugin OpenAI bundled
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Se il gateway è eseguito sotto launchd/systemd e PATH è minimale, aggiungi solo il
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

Questo è tutto. Nessuna chiave, nessuna configurazione auth extra oltre a quella della CLI stessa.

Se usi un backend CLI bundled come **provider di messaggi primario** su un
host gateway, OpenClaw ora carica automaticamente il Plugin bundled proprietario quando la tua configurazione
fa esplicito riferimento a quel backend in un model ref o sotto
`agents.defaults.cliBackends`.

## Uso come fallback

Aggiungi un backend CLI all'elenco di fallback in modo che venga eseguito solo quando i modelli primari falliscono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere anche lì i modelli del tuo backend CLI.
- Se il provider primario fallisce (auth, limiti di frequenza, timeout), OpenClaw
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
          // Per CLI con un flag dedicato al file prompt:
          // systemPromptFileArg: "--system-file",
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
2. **Costruisce un system prompt** usando lo stesso prompt + contesto workspace di OpenClaw.
3. **Esegue la CLI** con un id sessione (se supportato) in modo che la cronologia resti coerente.
   Il backend bundled `claude-cli` mantiene vivo un processo Claude stdio per
   sessione OpenClaw e invia i turni successivi su stdin stream-json.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Persiste gli id sessione** per backend, così i follow-up riusano la stessa sessione CLI.

<Note>
Il backend bundled Anthropic `claude-cli` è di nuovo supportato. Il personale Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta
l'uso di `claude -p` come autorizzato per questa integrazione, a meno che Anthropic non pubblichi
una nuova policy.
</Note>

Il backend bundled OpenAI `codex-cli` passa il system prompt di OpenClaw tramite
l'override di configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend bundled Anthropic `claude-cli` riceve lo snapshot delle Skills OpenClaw
in due modi: il catalogo compatto delle Skills OpenClaw nel system prompt aggiunto, e
un Plugin temporaneo Claude Code passato con `--plugin-dir`. Il Plugin contiene
solo le Skills idonee per quell'agente/sessione, quindi il resolver nativo delle skill di Claude Code
vede lo stesso insieme filtrato che OpenClaw altrimenti pubblicizzerebbe nel
prompt. Gli override di env/chiave API delle skill vengono comunque applicati da OpenClaw
all'ambiente del processo figlio per l'esecuzione.

Claude CLI ha anche la propria modalità di permessi non interattiva. OpenClaw la mappa
alla policy exec esistente invece di aggiungere una configurazione specifica per Claude: quando la
policy exec richiesta effettiva è YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), OpenClaw aggiunge `--permission-mode bypassPermissions`.
Le impostazioni `agents.list[].tools.exec` per agente sovrascrivono `tools.exec` globale per
quell'agente. Per forzare una modalità Claude diversa, imposta argomenti raw del backend espliciti
come `--permission-mode default` o `--permission-mode acceptEdits` sotto
`agents.defaults.cliBackends.claude-cli.args` e i corrispondenti `resumeArgs`.

Prima che OpenClaw possa usare il backend bundled `claude-cli`, Claude Code stesso
deve già aver effettuato il login sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (placeholder `{sessionId}`) quando l'id deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` in ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se non ne è stato archiviato nessuno).
  - `existing`: invia un id sessione solo se ne era già stato archiviato uno.
  - `none`: non inviare mai un id sessione.
- `claude-cli` usa per impostazione predefinita `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni successivi riusano il processo Claude live mentre
  è attivo. Lo stdio warm è ora il valore predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo
  termina, OpenClaw riprende dall'id sessione Claude archiviato. Gli id sessione archiviati
  vengono verificati rispetto a un transcript di progetto esistente e leggibile prima della
  ripresa, quindi i binding fantasma vengono rimossi con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI con `--resume`.
- Le sessioni CLI archiviate sono continuità posseduta dal provider. Il reset implicito
  giornaliero della sessione non le interrompe; `/reset` e le policy `session.reset` esplicite sì.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa lane.
- La maggior parte delle CLI serializza su una lane provider.
- OpenClaw interrompe il riuso della sessione CLI archiviata quando cambia l'identità auth selezionata,
  incluso un id profilo auth cambiato, una chiave API statica cambiata, un token statico cambiato o un'identità account OAuth
  quando la CLI ne espone una. La rotazione del token di accesso e refresh OAuth non interrompe la sessione CLI archiviata.
  Se una CLI non espone un id account OAuth stabile, OpenClaw lascia che sia quella CLI a imporre i permessi di resume.

## Immagini (inoltro)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, quei
percorsi verranno passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (path injection), il che è sufficiente per le CLI che caricano automaticamente
i file locali da percorsi semplici.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'utilizzo da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza stream JSONL (ad esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (di proprietà del Plugin)

Il Plugin bundled OpenAI registra anche un valore predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Il Plugin bundled Google registra anche un valore predefinito per `google-gemini-cli`:

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

Note sul JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'utilizzo usa `stats` come fallback quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw deriva i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso `command` assoluto).

## Valori predefiniti di proprietà del Plugin

I valori predefiniti dei backend CLI ora fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei model ref.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite l'hook facoltativo
  `normalizeConfig`.

I Plugin che hanno bisogno di piccoli shim di compatibilità prompt/messaggio possono dichiarare
trasformazioni di testo bidirezionali senza sostituire un provider o un backend CLI:

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
riscrive i delta dell'assistente in streaming e il testo finale analizzato prima che OpenClaw gestisca
i propri marcatori di controllo e la consegna sul canale.

Per le CLI che emettono JSONL compatibile con Claude Code stream-json, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay MCP bundled

I backend CLI **non** ricevono direttamente le chiamate agli strumenti OpenClaw, ma un backend può
fare opt-in a un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento bundled attuale:

- `claude-cli`: file di configurazione MCP strict generato
- `codex-cli`: override di configurazione inline per `mcp_servers`; il server
  local loopback OpenClaw generato è contrassegnato con la modalità di approvazione degli strumenti per server di Codex
  in modo che le chiamate MCP non possano bloccarsi su prompt di approvazione locale
- `google-gemini-cli`: file generato delle impostazioni di sistema Gemini

Quando il bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP local loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto del canale correnti
- carica i server bundle-MCP abilitati per lo spazio di lavoro corrente
- li unisce a qualsiasi forma esistente di configurazione/impostazioni MCP del backend
- riscrive la configurazione di avvio usando la modalità di integrazione posseduta dal backend dell'estensione proprietaria

Se non è abilitato alcun server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend fa opt-in al bundle MCP in modo che le esecuzioni in background restino isolate.

I runtime bundled MCP con ambito di sessione vengono memorizzati nella cache per il riuso all'interno di una sessione, poi
eliminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10
minuti; imposta `0` per disabilitare). Le esecuzioni embedded one-shot come auth probe,
generazione di slug e richiamo di Active Memory richiedono la pulizia alla fine dell'esecuzione in modo che i processi figli stdio
e i flussi Streamable HTTP/SSE non sopravvivano all'esecuzione.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando fanno opt-in a
  `bundleMcp: true`.
- **Lo streaming dipende dal backend.** Alcuni backend trasmettono JSONL in streaming; altri fanno buffering
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (nessun JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale `--json`. Le sessioni OpenClaw continuano comunque a funzionare normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (Codex CLI attualmente non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi file).

## Correlati

- [Runbook del gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
