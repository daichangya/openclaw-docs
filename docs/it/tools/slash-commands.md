---
read_when:
    - Uso o configurazione dei comandi chat
    - Debug del routing dei comandi o dei permessi
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-22T04:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandi slash

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`.
Il comando bash chat solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi autonomi `/...`.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi chat (non solo direttive), sono trattate come “hint inline” e **non** rendono persistenti le impostazioni della sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), rendono persistenti le impostazioni nella sessione e rispondono con una conferma.
  - Le direttive vengono applicate solo per i **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica
    allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/pairing del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo normale.

Esistono anche alcune **scorciatoie inline** (solo per mittenti in allowlist/autorizzati): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, vengono rimosse prima che il modello veda il messaggio e il testo rimanente continua nel flusso normale.

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
  - Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se imposti questo valore su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi slash command); ignorato per i provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per override per provider (bool o `"auto"`).
  - `false` cancella i comandi registrati in precedenza su Discord/Telegram all'avvio. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra i comandi **Skill** in modo nativo quando supportato.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di uno slash command per ogni Skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per override per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi shell host (`/bash <cmd>` è un alias; richiede allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla per quanto tempo bash attende prima di passare in modalità background (`0` manda subito in background).
- `commands.config` (predefinito `false`) abilita `/config` (legge/scrive `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (rilevamento/stato dei plugin più controlli di installazione + abilitazione/disabilitazione).
- `commands.debug` (predefinito `false`) abilita `/debug` (override solo runtime).
- `commands.restart` (predefinito `true`) abilita `/restart` più le azioni degli strumenti di riavvio del gateway.
- `commands.ownerAllowFrom` (facoltativo) imposta l'allowlist esplicita del proprietario per le superfici di comando/strumento solo proprietario. È separata da `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per canale (facoltativo, predefinito `false`) fa sì che i comandi solo proprietario richiedano l'**identità del proprietario** per essere eseguiti su quella superficie. Quando è `true`, il mittente deve o corrispondere a un candidato proprietario risolto (per esempio una voce in `commands.ownerAllowFrom` o metadati proprietario nativi del provider) oppure possedere lo scope interno `operator.admin` su un canale di messaggistica interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati proprietario vuoto/non risolto, **non** è sufficiente — i comandi solo proprietario falliscono in modalità fail-closed su quel canale. Lascia questo valore disattivato se vuoi che i comandi solo proprietario siano controllati solo da `ownerAllowFrom` e dalle normali allowlist dei comandi.
- `commands.ownerDisplay` controlla come gli ID proprietario appaiono nel prompt di sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` imposta facoltativamente il secret HMAC usato quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facoltativo) imposta un'allowlist per provider per l'autorizzazione ai comandi. Quando configurata, è
  l'unica fonte di autorizzazione per comandi e direttive (le allowlist/pairing del canale e `commands.useAccessGroups`
  vengono ignorati). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider hanno la precedenza.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/criteri ai comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Attuale fonte di verità:

- i built-in core provengono da `src/auto-reply/commands-registry.shared.ts`
- i dock command generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi dei plugin provengono dalle chiamate `registerCommand()` del plugin
- la disponibilità effettiva sul tuo gateway dipende comunque da flag di configurazione, superficie del canale e plugin installati/abilitati

### Comandi built-in core

Comandi built-in oggi disponibili:

- `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
- `/reset soft [message]` mantiene il transcript corrente, elimina gli ID di sessione del backend CLI riutilizzati e riesegue in-place il caricamento iniziale del prompt di sistema.
- `/compact [instructions]` compatta il contesto della sessione. Vedi [/concepts/compaction](/it/concepts/compaction).
- `/stop` interrompe l'esecuzione corrente.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza del thread-binding.
- `/think <level>` imposta il livello di thinking. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o il solo binario `on` dove supportato. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` attiva/disattiva l'output verboso. Alias: `/v`.
- `/trace on|off` attiva/disattiva l'output di trace del plugin per la sessione corrente.
- `/fast [status|on|off]` mostra o imposta la modalità veloce.
- `/reasoning [on|off|stream]` attiva/disattiva la visibilità del reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` attiva/disattiva la modalità elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti exec.
- `/model [name|#|status]` mostra o imposta il modello.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca provider o modelli per un provider.
- `/queue <mode>` gestisce il comportamento della coda (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.
- `/help` mostra il riepilogo breve della guida.
- `/commands` mostra il catalogo dei comandi generato.
- `/tools [compact|verbose]` mostra cosa può usare in questo momento l'agente corrente.
- `/status` mostra lo stato di runtime, incluso l'uso/quota del provider quando disponibile.
- `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
- `/context [list|detail|json]` spiega come viene assemblato il contesto.
- `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
- `/whoami` mostra il tuo sender id. Alias: `/id`.
- `/skill <name> [input]` esegue una skill per nome.
- `/allowlist [list|add|remove] ...` gestisce le voci della allowlist. Solo testo.
- `/approve <id> <decision>` risolve i prompt di approvazione exec.
- `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Vedi [/tools/btw](/it/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sottoagenti per la sessione corrente.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
- `/focus <target>` associa il thread Discord o l'argomento/conversazione Telegram corrente a una destinazione di sessione.
- `/unfocus` rimuove l'associazione corrente.
- `/agents` elenca gli agenti associati al thread per la sessione corrente.
- `/kill <id|#|all>` interrompe uno o tutti i sottoagenti in esecuzione.
- `/steer <id|#> <message>` invia steering a un sottoagente in esecuzione. Alias: `/tell`.
- `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
- `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato del plugin. `/plugin` è un alias. Scrittura solo proprietario. Richiede `commands.plugins: true`.
- `/debug show|set|unset|reset` gestisce override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
- `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.
- `/tts on|off|status|provider|limit|summary|audio|help` controlla TTS. Vedi [/tools/tts](/it/tools/tts).
- `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
- `/activation mention|always` imposta la modalità di attivazione del gruppo.
- `/send on|off|inherit` imposta il criterio di invio. Solo proprietario.
- `/bash <command>` esegue un comando shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più allowlist `tools.elevated`.
- `!poll [sessionId]` controlla un job bash in background.
- `!stop [sessionId]` arresta un job bash in background.

### Dock command generati

I dock command vengono generati dai plugin canale con supporto ai comandi nativi. Set bundled attuale:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei plugin bundled

I plugin bundled possono aggiungere altri slash command. Comandi bundled attuali in questo repository:

- `/dreaming [on|off|status|help]` attiva/disattiva Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di associazione/configurazione del dispositivo. Vedi [Associazione](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente comandi ad alto rischio del Node del telefono.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l'harness app-server Codex bundled. Vedi [Harness Codex](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi Skill dinamici

Le skill invocabili dall'utente sono esposte anche come slash command:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- le skill possono anche comparire come comandi diretti come `/prose` quando la skill/plugin li registra.
- la registrazione dei comandi Skill nativi è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Note:

- I comandi accettano facoltativamente `:` tra il comando e gli argomenti (per esempio `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias di modello, `provider/model` o un nome provider (fuzzy match); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
- Per il dettaglio completo dell'uso provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, `/allowlist --account <id>` mirato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano anche `configWrites` dell'account di destinazione.
- `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
- `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
- `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm o `clawhub:<pkg>`.
- `/plugins enable|disable` aggiorna la configurazione del plugin e può richiedere un riavvio.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (richiede `channels.discord.voice` e comandi nativi; non disponibile come testo).
- I comandi di thread-binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che i thread binding effettivi siano abilitati (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento dei comandi ACP e comportamento runtime: [Agenti ACP](/it/tools/acp-agents).
- `/verbose` è pensato per il debug e per maggiore visibilità; tienilo **disattivato** nell'uso normale.
- `/trace` è più ristretto di `/verbose`: rivela solo righe di trace/debug di proprietà del plugin e mantiene disattivo il normale chatter verboso di strumenti.
- `/fast on|off` rende persistente un override della sessione. Usa l'opzione `inherit` nell'interfaccia Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint Responses nativi, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato con OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi dei guasti degli strumenti vengono comunque mostrati quando rilevanti, ma il testo dettagliato del guasto viene incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning`, `/verbose` e `/trace` sono rischiosi in contesti di gruppo: possono rivelare reasoning interno, output degli strumenti o diagnostica del plugin che non intendevi esporre. Preferisci lasciarli disattivati, specialmente nelle chat di gruppo.
- `/model` rende immediatamente persistente il nuovo modello della sessione.
- Se l'agente è inattivo, l'esecuzione successiva lo userà subito.
- Se un'esecuzione è già attiva, OpenClaw contrassegna un live switch come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l'attività degli strumenti o l'output della risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente successivo.
- **Percorso veloce:** i messaggi solo comando da mittenti in allowlist vengono gestiti immediatamente (bypass di coda + modello).
- **Filtro delle menzioni nei gruppi:** i messaggi solo comando da mittenti in allowlist bypassano i requisiti di menzione.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche se incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo rimanente.
  - Esempio: `hey /status` attiva una risposta di stato e il testo rimanente continua nel flusso normale.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi solo comando non autorizzati vengono ignorati silenziosamente e i token inline `/...` vengono trattati come testo normale.
- **Comandi Skill:** le skill `user-invocable` vengono esposte come slash command. I nomi vengono sanificati in `a-z0-9_` (max 32 caratteri); in caso di collisioni ricevono suffissi numerici (per esempio `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per-skill).
  - Per impostazione predefinita, i comandi Skill vengono inoltrati al modello come normale richiesta.
  - Le skill possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
  - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l'autocomplete per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti richiesti). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento.

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **cosa può usare questo agente in questo momento in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso cambio modalità `compact|verbose`.
- I risultati sono limitati alla sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  cambiare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti plugin
  connessi e strumenti di proprietà del canale.

Per modificare profili e override, usa il pannello Tools dell'interfaccia Control o le superfici config/catalogo invece
di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa si vede dove)

- **Uso/quota del provider** (esempio: “Claude 80% left”) compare in `/status` per il provider del modello corrente quando il monitoraggio dell'uso è abilitato. OpenClaw normalizza le finestre dei provider in `% left`; per MiniMax, i campi di percentuale solo-rimanente vengono invertiti prima della visualizzazione e le risposte `model_remains` preferiscono la voce del modello chat più un'etichetta del piano taggata col modello.
- Le **righe token/cache** in `/status` possono usare come fallback l'ultima voce di utilizzo del transcript quando lo snapshot della sessione live è scarno. I valori live esistenti non zero hanno comunque la precedenza e il fallback dal transcript può anche recuperare l'etichetta del modello runtime attivo più un totale orientato al prompt più grande quando i totali memorizzati mancano o sono inferiori.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle normali risposte).
- `/model status` riguarda **modelli/auth/endpoint**, non l'utilizzo.

## Selezione del modello (`/model`)

`/model` è implementato come direttiva.

Esempi:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Note:

- `/model` e `/model list` mostrano un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a tendina per provider e modello più un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Override di debug

`/debug` ti permette di impostare override di configurazione **solo runtime** (memoria, non disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Gli override si applicano immediatamente alle nuove letture della configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.

## Output di trace del plugin

`/trace` ti permette di attivare/disattivare **righe di trace/debug del plugin limitate alla sessione** senza attivare la modalità verbosa completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato di trace corrente della sessione.
- `/trace on` abilita le righe di trace del plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace del plugin possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verboso di strumenti/stato continua a appartenere a `/verbose`.

## Aggiornamenti della configurazione

`/config` scrive nella configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.config: true`.

Esempi:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Note:

- La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate.
- Gli aggiornamenti di `/config` persistono dopo i riavvii.

## Aggiornamenti MCP

`/mcp` scrive le definizioni del server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Note:

- `/mcp` memorizza la configurazione nella config di OpenClaw, non nelle impostazioni del progetto di proprietà di Pi.
- Gli adapter runtime decidono quali trasporti sono effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` permette agli operatori di ispezionare i plugin rilevati e attivarli/disattivarli nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano il rilevamento reale dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione del plugin; non installa né disinstalla i plugin.
- Dopo modifiche di enable/disable, riavvia il gateway per applicarle.

## Note sulla superficie

- **Comandi testuali** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
- **Comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (indirizza la sessione chat tramite `CommandTargetSessionKey`)
- **`/stop`** prende di mira la sessione chat attiva così può interrompere l'esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare uno slash command Slack per ogni comando built-in (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono consegnati come pulsanti effimeri Block Kit.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` continua a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- viene eseguito come chiamata one-shot separata **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritto nella cronologia del transcript,
- viene consegnato come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre il compito principale continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Vedi [Domande laterali BTW](/it/tools/btw) per il comportamento completo e i
dettagli UX del client.
