---
read_when:
    - Usare o configurare i comandi di chat
    - Debug dell’instradamento dei comandi o dei permessi
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-12T23:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ef6f54500fa2ce3b873a8398d6179a0882b8bf6fba38f61146c64671055505e
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandi slash

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`.
Il comando bash di chat solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi autonomi `/...`.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi di chat (non solo direttive), sono trattate come “hint inline” e **non** rendono persistenti le impostazioni della sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), diventano persistenti per la sessione e rispondono con una conferma.
  - Le direttive vengono applicate solo ai **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l’unica
    allowlist usata; altrimenti l’autorizzazione proviene dalle allowlist/associazioni del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo semplice.

Esistono anche alcune **scorciatoie inline** (solo mittenti autorizzati/in allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, rimosse prima che il modello veda il messaggio e il testo rimanente continua nel flusso normale.

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

- `commands.text` (predefinito `true`) abilita il parsing di `/...` nei messaggi di chat.
  - Nelle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se imposti questo valore su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivato per Slack (finché non aggiungi i comandi slash); ignorato per i provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sostituire il comportamento per provider (bool o `"auto"`).
  - `false` cancella all’avvio i comandi precedentemente registrati su Discord/Telegram. I comandi Slack sono gestiti nell’app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra i comandi **Skill** in modo nativo quando supportato.
  - Auto: attivo per Discord/Telegram; disattivato per Slack (Slack richiede la creazione di un comando slash per ogni skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sostituire il comportamento per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi shell host (`/bash <cmd>` è un alias; richiede le allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla quanto tempo bash aspetta prima di passare alla modalità background (`0` passa immediatamente in background).
- `commands.config` (predefinito `false`) abilita `/config` (legge/scrive `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (rilevamento/stato dei plugin più controlli di installazione e abilitazione/disabilitazione).
- `commands.debug` (predefinito `false`) abilita `/debug` (override solo runtime).
- `commands.restart` (predefinito `true`) abilita `/restart` più le azioni dello strumento di riavvio del Gateway.
- `commands.ownerAllowFrom` (facoltativo) imposta l’allowlist esplicita del proprietario per le superfici di comando/strumento riservate al proprietario. Questa è separata da `commands.allowFrom`.
- `commands.ownerDisplay` controlla come gli ID del proprietario appaiono nel prompt di sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facoltativo) imposta un’allowlist per provider per l’autorizzazione dei comandi. Quando configurata, è l’unica origine di autorizzazione per comandi e direttive (le allowlist/associazioni del canale e `commands.useAccessGroups` vengono ignorate). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider hanno la precedenza.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Fonte di verità attuale:

- i built-in core provengono da `src/auto-reply/commands-registry.shared.ts`
- i dock command generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi plugin provengono dalle chiamate plugin `registerCommand()`
- l’effettiva disponibilità sul tuo Gateway dipende comunque da flag di configurazione, superficie del canale e plugin installati/abilitati

### Comandi built-in core

Comandi built-in disponibili oggi:

- `/new [model]` avvia una nuova sessione; `/reset` è l’alias di reset.
- `/compact [instructions]` compatta il contesto della sessione. Vedi [/concepts/compaction](/it/concepts/compaction).
- `/stop` interrompe l’esecuzione corrente.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza del binding del thread.
- `/think <off|minimal|low|medium|high|xhigh>` imposta il livello di thinking. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` attiva/disattiva l’output dettagliato. Alias: `/v`.
- `/trace on|off` attiva/disattiva l’output di trace del plugin per la sessione corrente.
- `/fast [status|on|off]` mostra o imposta la modalità veloce.
- `/reasoning [on|off|stream]` attiva/disattiva la visibilità del reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` attiva/disattiva la modalità elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
- `/model [name|#|status]` mostra o imposta il modello.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider o i modelli di un provider.
- `/queue <mode>` gestisce il comportamento della coda (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.
- `/help` mostra il breve riepilogo della guida.
- `/commands` mostra il catalogo comandi generato.
- `/tools [compact|verbose]` mostra cosa l’agente corrente può usare in questo momento.
- `/status` mostra lo stato runtime, incluso l’uso/quota del provider quando disponibile.
- `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
- `/context [list|detail|json]` spiega come viene assemblato il contesto.
- `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
- `/whoami` mostra il tuo ID mittente. Alias: `/id`.
- `/skill <name> [input]` esegue una skill per nome.
- `/allowlist [list|add|remove] ...` gestisce le voci dell’allowlist. Solo testo.
- `/approve <id> <decision>` risolve i prompt di approvazione exec.
- `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Vedi [/tools/btw](/it/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sottoagenti per la sessione corrente.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni runtime.
- `/focus <target>` collega il thread Discord o l’argomento/conversazione Telegram corrente a una destinazione di sessione.
- `/unfocus` rimuove il binding corrente.
- `/agents` elenca gli agenti collegati al thread per la sessione corrente.
- `/kill <id|#|all>` interrompe uno o tutti i sottoagenti in esecuzione.
- `/steer <id|#> <message>` invia steering a un sottoagente in esecuzione. Alias: `/tell`.
- `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
- `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei plugin. `/plugin` è un alias. Solo proprietario per le scritture. Richiede `commands.plugins: true`.
- `/debug show|set|unset|reset` gestisce gli override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
- `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.
- `/tts on|off|status|provider|limit|summary|audio|help` controlla TTS. Vedi [/tools/tts](/it/tools/tts).
- `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
- `/activation mention|always` imposta la modalità di attivazione del gruppo.
- `/send on|off|inherit` imposta la policy di invio. Solo proprietario.
- `/bash <command>` esegue un comando shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più le allowlist `tools.elevated`.
- `!poll [sessionId]` controlla un job bash in background.
- `!stop [sessionId]` interrompe un job bash in background.

### Dock command generati

I dock command vengono generati dai plugin di canale con supporto per i comandi nativi. Set integrato attuale:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei plugin integrati

I plugin integrati possono aggiungere altri comandi slash. Comandi integrati attuali in questo repo:

- `/dreaming [on|off|status|help]` attiva/disattiva il dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di pairing/configurazione del dispositivo. Vedi [Pairing](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente i comandi ad alto rischio del Node telefonico.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l’harness app-server Codex integrato. Vedi [Codex Harness](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Le skill invocabili dall’utente sono esposte anche come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- le skill possono comparire anche come comandi diretti come `/prose` quando la skill/il plugin li registra.
- la registrazione nativa dei comandi skill è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Note:

- I comandi accettano facoltativamente `:` tra il comando e gli argomenti (ad esempio `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias di modello, `provider/model` oppure il nome di un provider (corrispondenza fuzzy); se non trova alcuna corrispondenza, il testo viene trattato come corpo del messaggio.
- Per la ripartizione completa dell’utilizzo per provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, anche `/allowlist --account <id>` orientato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell’account di destinazione.
- `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
- `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
- `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm oppure `clawhub:<pkg>`.
- `/plugins enable|disable` aggiorna la configurazione del plugin e può richiedere un riavvio.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (richiede `channels.discord.voice` e i comandi nativi; non disponibile come testo).
- I comandi di binding del thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che i thread binding effettivi siano abilitati (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento del comando ACP e comportamento runtime: [ACP Agents](/it/tools/acp-agents).
- `/verbose` è pensato per il debug e una visibilità aggiuntiva; tienilo **disattivato** nell’uso normale.
- `/trace` è più ristretto di `/verbose`: mostra solo righe di trace/debug gestite dal plugin e mantiene disattivato il normale rumore dettagliato di strumenti e stato.
- `/fast on|off` rende persistente un override di sessione. Usa l’opzione `inherit` nell’interfaccia Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint nativi Responses, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi degli errori degli strumenti vengono comunque mostrati quando rilevanti, ma il testo dettagliato dell’errore viene incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle impostazioni di gruppo: possono rivelare ragionamento interno, output degli strumenti o diagnostica dei plugin che non intendevi esporre. È preferibile lasciarli disattivati, soprattutto nelle chat di gruppo.
- `/model` rende immediatamente persistente il nuovo modello di sessione.
- Se l’agente è inattivo, l’esecuzione successiva lo usa subito.
- Se un’esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l’attività degli strumenti o l’output della risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
- **Percorso veloce:** i messaggi solo comando dai mittenti in allowlist vengono gestiti immediatamente (saltano coda + modello).
- **Controllo menzione nei gruppi:** i messaggi solo comando dai mittenti in allowlist bypassano i requisiti di menzione.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando sono incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo rimanente.
  - Esempio: `hey /status` attiva una risposta di stato e il testo rimanente continua nel flusso normale.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi solo comando non autorizzati vengono ignorati silenziosamente e i token inline `/...` vengono trattati come testo semplice.
- **Comandi Skill:** le skill `user-invocable` sono esposte come comandi slash. I nomi vengono sanificati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici (ad esempio `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per skill).
  - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come una normale richiesta.
  - Le skill possono dichiarare facoltativamente `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
  - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l’autocompletamento per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l’argomento.

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **che cosa questo agente può usare adesso in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso cambio modalità `compact|verbose`.
- I risultati valgono per la sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  cambiare l’output.
- `/tools` include gli strumenti realmente raggiungibili in fase di esecuzione, inclusi strumenti core, strumenti plugin connessi e strumenti gestiti dal canale.

Per modificare profili e override, usa il pannello Tools della Control UI o le superfici di configurazione/catalogo invece di
trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa compare dove)

- **Utilizzo/quota del provider** (esempio: “Claude 80% left”) compare in `/status` per il provider del modello corrente quando il monitoraggio dell’utilizzo è abilitato. OpenClaw normalizza le finestre del provider in `% left`; per MiniMax, i campi percentuali solo-rimanenti vengono invertiti prima della visualizzazione, e le risposte `model_remains` preferiscono la voce del modello chat più un’etichetta di piano con tag modello.
- **Righe token/cache** in `/status` possono ripiegare sull’ultima voce di utilizzo della trascrizione quando lo snapshot live della sessione è scarno. I valori live esistenti diversi da zero mantengono comunque la precedenza e il fallback della trascrizione può anche recuperare l’etichetta del modello runtime attivo più un totale orientato al prompt più grande quando i totali memorizzati mancano o sono inferiori.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle risposte normali).
- `/model status` riguarda **modelli/auth/endpoint**, non l’utilizzo.

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
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa di provider e modello più un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, inclusi endpoint del provider configurato (`baseUrl`) e modalità API (`api`) quando disponibili.

## Override di debug

`/debug` ti consente di impostare override di configurazione **solo runtime** (in memoria, non su disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Gli override si applicano immediatamente alle nuove letture di configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.

## Output di trace del plugin

`/trace` ti consente di attivare/disattivare **righe di trace/debug del plugin valide per la sessione** senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomento mostra lo stato di trace corrente della sessione.
- `/trace on` abilita le righe di trace del plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace del plugin possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell’assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output dettagliato di strumenti/stato continua ad appartenere a `/verbose`.

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

`/mcp` scrive le definizioni dei server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Note:

- `/mcp` archivia la configurazione nella config di OpenClaw, non nelle impostazioni di progetto gestite da Pi.
- Gli adapter runtime decidono quali trasporti siano effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` consente agli operatori di ispezionare i plugin rilevati e attivarli/disattivarli nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano il vero rilevamento dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione del plugin; non installa né disinstalla plugin.
- Dopo modifiche di abilitazione/disabilitazione, riavvia il Gateway per applicarle.

## Note sulle superfici

- **Comandi testuali** vengono eseguiti nella normale sessione di chat (i DM condividono `main`, i gruppi hanno la propria sessione).
- **Comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (indirizza la sessione di chat tramite `CommandTargetSessionKey`)
- **`/stop`** indirizza la sessione di chat attiva in modo da poter interrompere l’esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando built-in (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono forniti come pulsanti Block Kit effimeri.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` continua comunque a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- viene eseguita come chiamata separata una tantum **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritta nella cronologia della trascrizione,
- viene consegnata come risultato laterale live invece che come normale messaggio dell’assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre il compito principale
continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Consulta [BTW Side Questions](/it/tools/btw) per il comportamento completo e i dettagli
dell’esperienza client.
