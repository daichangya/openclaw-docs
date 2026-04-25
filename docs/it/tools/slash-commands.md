---
read_when:
    - Uso o configurazione dei comandi chat
    - Debug della route dei comandi o dei permessi
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-25T13:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **standalone** che inizia con `/`.
Il comando bash chat solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi standalone `/...`.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi chat (non solo direttive), vengono trattate come “hint inline” e **non** rendono persistenti le impostazioni di sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), persistono nella sessione e rispondono con una conferma.
  - Le direttive vengono applicate solo per **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica
    allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/abbinamento del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo normale.

Esistono anche alcune **scorciatoie inline** (solo per mittenti in allowlist/autorizzati): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, vengono rimosse prima che il modello veda il messaggio, e il testo rimanente continua nel flusso normale.

## Configurazione

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (predefinito `true`) abilita il parsing di `/...` nei messaggi chat.
  - Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se lo imposti su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi i slash command); ignorato per provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per eseguire override per provider (bool o `"auto"`).
  - `false` cancella i comandi registrati in precedenza su Discord/Telegram all'avvio. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra i comandi **skill** in modo nativo quando supportato.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di uno slash command per ogni skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per eseguire override per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi shell host (`/bash <cmd>` è un alias; richiede allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla per quanto tempo bash attende prima di passare alla modalità background (`0` manda subito in background).
- `commands.config` (predefinito `false`) abilita `/config` (letture/scritture di `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (letture/scritture della configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (discovery/stato dei Plugin più controlli install + enable/disable).
- `commands.debug` (predefinito `false`) abilita `/debug` (override solo runtime).
- `commands.restart` (predefinito `true`) abilita `/restart` più le azioni dello strumento di riavvio del gateway.
- `commands.ownerAllowFrom` (facoltativo) imposta l'allowlist owner esplicita per le superfici di comando/strumento solo owner. Questo è separato da `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per canale (facoltativo, predefinito `false`) fa sì che i comandi solo owner richiedano **identità owner** per essere eseguiti su quella superficie. Quando `true`, il mittente deve corrispondere a un candidato owner risolto (ad esempio una voce in `commands.ownerAllowFrom` o metadati owner nativi del provider) oppure avere scope interno `operator.admin` su un canale di messaggi interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati owner vuoto/non risolto, **non** è sufficiente — i comandi solo owner falliscono in modo chiuso su quel canale. Lascia questa opzione disattivata se vuoi che i comandi solo owner siano controllati solo da `ownerAllowFrom` e dalle allowlist standard dei comandi.
- `commands.ownerDisplay` controlla come gli id owner appaiono nel prompt di sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facoltativo) imposta un'allowlist per provider per l'autorizzazione dei comandi. Quando configurato, è l'unica sorgente di autorizzazione per comandi e direttive (allowlist/abbinamento del canale e `commands.useAccessGroups` vengono ignorati). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider hanno la precedenza.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/criteri per i comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Sorgente di verità attuale:

- i built-in core provengono da `src/auto-reply/commands-registry.shared.ts`
- i dock command generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi Plugin provengono dalle chiamate `registerCommand()` del Plugin
- la disponibilità effettiva sul tuo gateway dipende comunque da flag di configurazione, superficie del canale e Plugin installati/abilitati

### Comandi built-in core

Comandi integrati disponibili oggi:

- `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
- `/reset soft [message]` mantiene il transcript corrente, elimina gli id di sessione CLI backend riutilizzati e riesegue sul posto il caricamento di startup/system-prompt.
- `/compact [instructions]` esegue la Compaction del contesto della sessione. Vedi [/concepts/compaction](/it/concepts/compaction).
- `/stop` interrompe l'esecuzione corrente.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza dei thread binding.
- `/think <level>` imposta il livello di thinking. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o il binario `on` solo dove supportato. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` attiva/disattiva l'output verboso. Alias: `/v`.
- `/trace on|off` attiva/disattiva l'output trace dei Plugin per la sessione corrente.
- `/fast [status|on|off]` mostra o imposta la modalità fast.
- `/reasoning [on|off|stream]` attiva/disattiva la visibilità del reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` attiva/disattiva la modalità elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
- `/model [name|#|status]` mostra o imposta il modello.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca provider o modelli per un provider.
- `/queue <mode>` gestisce il comportamento della coda (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.
- `/help` mostra il breve riepilogo di aiuto.
- `/commands` mostra il catalogo dei comandi generato.
- `/tools [compact|verbose]` mostra cosa può usare in questo momento l'agente corrente.
- `/status` mostra lo stato di esecuzione/runtime, incluse etichette `Execution`/`Runtime` e uso/quota del provider quando disponibili.
- `/crestodian <request>` esegue l'helper Crestodian di setup e riparazione da un DM owner.
- `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
- `/context [list|detail|json]` spiega come viene assemblato il contesto.
- `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
- `/export-trajectory [path]` esporta un [trajectory bundle](/it/tools/trajectory) JSONL per la sessione corrente. Alias: `/trajectory`.
- `/whoami` mostra il tuo id mittente. Alias: `/id`.
- `/skill <name> [input]` esegue una skill per nome.
- `/allowlist [list|add|remove] ...` gestisce le voci della allowlist. Solo testuale.
- `/approve <id> <decision>` risolve i prompt di approvazione exec.
- `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Vedi [/tools/btw](/it/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei subagenti per la sessione corrente.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce sessioni ACP e opzioni di runtime.
- `/focus <target>` vincola il thread Discord corrente o il topic/conversazione Telegram a un target di sessione.
- `/unfocus` rimuove il binding corrente.
- `/agents` elenca gli agenti vincolati al thread per la sessione corrente.
- `/kill <id|#|all>` interrompe uno o tutti i subagenti in esecuzione.
- `/steer <id|#> <message>` invia steering a un subagente in esecuzione. Alias: `/tell`.
- `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo owner. Richiede `commands.config: true`.
- `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo owner. Richiede `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei Plugin. `/plugin` è un alias. Solo owner per le scritture. Richiede `commands.plugins: true`.
- `/debug show|set|unset|reset` gestisce override di configurazione solo runtime. Solo owner. Richiede `commands.debug: true`.
- `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo dei costi locale.
- `/tts on|off|status|provider|limit|summary|audio|help` controlla TTS. Vedi [/tools/tts](/it/tools/tts).
- `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
- `/activation mention|always` imposta la modalità di attivazione del gruppo.
- `/send on|off|inherit` imposta i criteri di invio. Solo owner.
- `/bash <command>` esegue un comando shell host. Solo testuale. Alias: `! <command>`. Richiede `commands.bash: true` più allowlist `tools.elevated`.
- `!poll [sessionId]` controlla un job bash in background.
- `!stop [sessionId]` arresta un job bash in background.

### Dock command generati

I dock command sono generati dai Plugin di canale con supporto ai comandi nativi. Set incluso attuale:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei Plugin inclusi

I Plugin inclusi possono aggiungere altri slash command. Comandi inclusi attuali in questo repo:

- `/dreaming [on|off|status|help]` attiva/disattiva il Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di abbinamento/setup dei dispositivi. Vedi [Abbinamento](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente comandi Node del telefono ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l'harness app-server Codex incluso. Vedi [Harness Codex](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Anche le skill invocabili dall'utente sono esposte come slash command:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- le skill possono anche apparire come comandi diretti tipo `/prose` quando la skill/il Plugin li registra.
- la registrazione nativa dei comandi skill è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Note:

- I comandi accettano un `:` facoltativo tra il comando e gli argomenti (ad es. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias di modello, `provider/model` o un nome provider (fuzzy match); se non trova corrispondenze, il testo viene trattato come corpo del messaggio.
- Per la ripartizione completa dell'uso del provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, anche `/allowlist --account <id>` mirato alla config e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
- `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo dei costi locale dai log di sessione OpenClaw.
- `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
- `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm o `clawhub:<pkg>`.
- `/plugins enable|disable` aggiorna la configurazione del plugin e può richiedere un riavvio.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (non disponibile come testo). `join` richiede una guild e un canale vocale/stage selezionato. Richiede `channels.discord.voice` e comandi nativi.
- I comandi di thread binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che i thread binding effettivi siano abilitati (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento dei comandi ACP e comportamento runtime: [Agenti ACP](/it/tools/acp-agents).
- `/verbose` è pensato per il debug e per maggiore visibilità; tienilo **disattivato** nell'uso normale.
- `/trace` è più ristretto di `/verbose`: rivela solo righe di trace/debug possedute dal plugin e mantiene disattivo il normale output verboso degli strumenti.
- `/fast on|off` rende persistente un override di sessione. Usa l'opzione `inherit` della UI Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint nativi Responses, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi dei guasti degli strumenti vengono comunque mostrati quando rilevanti, ma il testo dettagliato del guasto viene incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning`, `/verbose` e `/trace` sono rischiosi nei contesti di gruppo: possono rivelare reasoning interno, output degli strumenti o diagnostica dei plugin che non intendevi esporre. È preferibile lasciarli disattivati, soprattutto nelle chat di gruppo.
- `/model` rende persistente immediatamente il nuovo modello di sessione.
- Se l'agente è inattivo, l'esecuzione successiva lo usa subito.
- Se un'esecuzione è già attiva, OpenClaw segna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto pulito di retry.
- Se l'attività degli strumenti o l'output di risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al prossimo turno utente.
- Nella TUI locale, `/crestodian [request]` ritorna dalla normale TUI dell'agente a
  Crestodian. Questo è separato dalla modalità rescue del canale messaggi e non
  concede autorità remota sulla configurazione.
- **Percorso rapido:** i messaggi solo comando da mittenti in allowlist vengono gestiti immediatamente (bypassano coda + modello).
- **Vincolo di menzione nei gruppi:** i messaggi solo comando da mittenti in allowlist bypassano i requisiti di menzione.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo restante.
  - Esempio: `hey /status` attiva una risposta di stato, e il testo rimanente continua nel flusso normale.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi solo comando non autorizzati vengono ignorati silenziosamente, e i token inline `/...` vengono trattati come testo normale.
- **Comandi skill:** le skill `user-invocable` sono esposte come slash command. I nomi vengono sanitizzati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici (ad es. `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono i comandi per-skill).
  - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come una normale richiesta.
  - Le skill possono dichiarare facoltativamente `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
  - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l'autocomplete per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento. Le scelte dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi opzioni specifiche del modello come i livelli di `/think` seguono l'override `/model` di quella sessione.

## `/tools`

`/tools` risponde a una domanda di runtime, non di configurazione: **cosa questo agente può usare in questo momento in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una rapida scansione.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso cambio modalità `compact|verbose`.
- I risultati hanno ambito di sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  cambiare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti di plugin connessi e strumenti posseduti dal canale.

Per modificare profili e override, usa il pannello Tools della Control UI o le superfici di config/catalogo invece
di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa appare dove)

- **Uso/quota del provider** (esempio: “Claude 80% left”) appare in `/status` per il provider del modello corrente quando il tracciamento dell'uso è abilitato. OpenClaw normalizza le finestre del provider in `% left`; per MiniMax, i campi percentuali di solo-rimanenza vengono invertiti prima della visualizzazione, e le risposte `model_remains` preferiscono la voce del modello chat più un'etichetta di piano con tag del modello.
- **Righe token/cache** in `/status` possono usare come fallback l'ultima voce di utilizzo del transcript quando lo snapshot live della sessione è scarso. I valori live esistenti non nulli hanno comunque la precedenza, e il fallback dal transcript può anche recuperare l'etichetta del modello runtime attivo più un totale più ampio orientato al prompt quando i totali memorizzati mancano o sono più piccoli.
- **Execution vs runtime:** `/status` riporta `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta realmente eseguendo la sessione: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle normali risposte).
- `/model status` riguarda **modelli/auth/endpoint**, non l'utilizzo.

## Selezione del modello (`/model`)

`/model` è implementato come direttiva.

Esempi:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Note:

- `/model` e `/model list` mostrano un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più una fase Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Override di debug

`/debug` consente di impostare override di configurazione **solo runtime** (in memoria, non su disco). Solo owner. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

Esempi:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Gli override si applicano immediatamente alle nuove letture della configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.

## Output trace dei plugin

`/trace` consente di attivare/disattivare **righe di trace/debug dei plugin con ambito di sessione** senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato trace corrente della sessione.
- `/trace on` abilita le righe trace dei plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe trace dei plugin possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verbose di strumenti/stato continua ad appartenere a `/verbose`.

## Aggiornamenti di configurazione

`/config` scrive nella tua configurazione su disco (`openclaw.json`). Solo owner. Disabilitato per impostazione predefinita; abilitalo con `commands.config: true`.

Esempi:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Note:

- La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate.
- Gli aggiornamenti `/config` persistono dopo i riavvii.

## Aggiornamenti MCP

`/mcp` scrive le definizioni del server MCP gestite da OpenClaw sotto `mcp.servers`. Solo owner. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Note:

- `/mcp` memorizza la configurazione nella configurazione di OpenClaw, non nelle impostazioni di progetto possedute da Pi.
- Gli adapter runtime decidono quali trasporti sono effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` consente agli operatori di ispezionare i plugin individuati e attivare/disattivare la configurazione. I flussi di sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano la reale individuazione dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione del plugin; non installa né disinstalla i plugin.
- Dopo modifiche enable/disable, riavvia il gateway per applicarle.

## Note sulle superfici

- **I comandi testuali** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno una propria sessione).
- **I comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (punta alla sessione della chat tramite `CommandTargetSessionKey`)
- **`/stop`** punta alla sessione chat attiva così può interrompere l'esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare uno slash command Slack per ogni comando built-in (con gli stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono consegnati come pulsanti Block Kit effimeri.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` continua a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della normale chat:

- usa la sessione corrente come contesto di sfondo,
- viene eseguita come chiamata one-shot separata **senza strumenti**,
- non cambia il contesto futuro della sessione,
- non viene scritta nella cronologia del transcript,
- viene consegnata come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre l'attività
principale continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Vedi [BTW Side Questions](/it/tools/btw) per il comportamento completo e i dettagli
dell'UX client.

## Correlati

- [Skills](/it/tools/skills)
- [Configurazione Skills](/it/tools/skills-config)
- [Creare Skills](/it/tools/creating-skills)
