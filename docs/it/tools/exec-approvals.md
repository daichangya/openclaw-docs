---
read_when:
    - Configurazione delle approvazioni exec o delle allowlist
    - Implementazione dell'esperienza utente per l'approvazione exec nell'app macOS
    - Revisione dei prompt di uscita dalla sandbox e delle relative implicazioni
summary: Approvazioni exec, allowlist e prompt di uscita dalla sandbox
title: Approvazioni exec
x-i18n:
    generated_at: "2026-04-25T13:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Le approvazioni exec sono il **guardrail dell'app companion / host Node** che consente a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). Un interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist + (facoltativamente) approvazione utente concordano tutti. Le approvazioni exec si sovrappongono **in aggiunta** alla policy degli strumenti e al gating elevato (a meno che elevated non sia impostato su `full`, che salta le approvazioni).

<Note>
La policy effettiva è la **più restrittiva** tra i valori predefiniti di `tools.exec.*` e quelli delle approvazioni; se un campo delle approvazioni viene omesso, viene usato il valore di `tools.exec`. L'exec host usa anche lo stato locale delle approvazioni su quella macchina: un valore locale `ask: "always"` in `~/.openclaw/exec-approvals.json` continua a richiedere conferma anche se i valori predefiniti della sessione o della configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezione della policy effettiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — mostrano la policy richiesta, le fonti della policy host e il risultato effettivo.
- `openclaw exec-policy show` — vista unificata della macchina locale.
- `openclaw exec-policy set|preset` — sincronizza in un solo passaggio la policy richiesta locale con il file delle approvazioni host locale.

Quando un ambito locale richiede `host=node`, `exec-policy show` riporta quell'ambito come gestito dal node a runtime invece di fingere che il file locale delle approvazioni sia la fonte di verità.

Se l'interfaccia utente dell'app companion **non è disponibile**, qualsiasi richiesta che normalmente richiederebbe conferma viene risolta tramite il **fallback ask** (predefinito: deny).

<Tip>
I client nativi di approvazione nella chat possono predisporre affordance specifiche del canale nel messaggio di approvazione in sospeso. Per esempio, Matrix predispone scorciatoie tramite reazioni (`✅` consenti una volta, `❌` nega, `♾️` consenti sempre) lasciando comunque i comandi `/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec sono applicate localmente sull'host di esecuzione:

- **host gateway** → processo `openclaw` sulla macchina gateway
- **host node** → runner del node (app companion macOS o host node headless)

Nota sul modello di fiducia:

- I chiamanti autenticati sul Gateway sono operatori fidati per quel Gateway.
- I node associati estendono tale capacità di operatore fidato all'host node.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma non costituiscono un confine di autenticazione per utente.
- Le esecuzioni approvate sull'host node vincolano il contesto di esecuzione canonico: `cwd` canonico, `argv` esatto, binding dell'env quando presente e percorso dell'eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file interprete/runtime, OpenClaw prova anche a vincolare un solo operando file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata invece di eseguire contenuto modificato.
- Questo binding del file è intenzionalmente best-effort, non un modello semantico completo di ogni percorso di caricamento di interprete/runtime. Se la modalità di approvazione non riesce a identificare esattamente un file locale concreto da vincolare, rifiuta di generare un'esecuzione supportata da approvazione invece di fingere una copertura completa.

Separazione su macOS:

- Il **servizio host node** inoltra `system.run` alla **app macOS** tramite IPC locale.
- La **app macOS** applica le approvazioni + esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni si trovano in un file JSON locale sull'host di esecuzione:

`~/.openclaw/exec-approvals.json`

Schema di esempio:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modalità "YOLO" senza approvazione

Se vuoi che l'exec host venga eseguito senza prompt di approvazione, devi aprire **entrambi** i livelli di policy:

- policy exec richiesta nella configurazione OpenClaw (`tools.exec.*`)
- policy locale delle approvazioni host in `~/.openclaw/exec-approvals.json`

Questo è ora il comportamento host predefinito, a meno che non lo renda esplicitamente più restrittivo:

- `tools.exec.security`: `full` su `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinzione importante:

- `tools.exec.host=auto` sceglie dove viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie come viene approvato l'exec host: `security=full` più `ask=off`.
- I provider basati su CLI che espongono la propria modalità non interattiva dei permessi possono seguire questa policy.
  Claude CLI aggiunge `--permission-mode bypassPermissions` quando la policy exec richiesta da OpenClaw è
  YOLO. Sostituisci quel comportamento del backend con argomenti Claude espliciti in
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, per esempio
  `--permission-mode default`, `acceptEdits` o `bypassPermissions`.
- In modalità YOLO, OpenClaw non aggiunge un gate di approvazione separato per l'offuscamento euristico dei comandi né un livello di rifiuto preflight degli script sopra la policy exec host configurata.
- `auto` non rende l'instradamento al gateway una sostituzione libera da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`, e `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Se vuoi un valore predefinito stabile non-auto, imposta `tools.exec.host` o usa esplicitamente `/exec host=...`.

Se vuoi una configurazione più prudente, rendi di nuovo più restrittivo uno dei due livelli impostandolo su `allowlist` / `on-miss`
o `deny`.

Configurazione persistente "mai chiedere conferma" per l'host gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Quindi imposta il file delle approvazioni host in modo coerente:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Scorciatoia locale per la stessa policy host gateway sulla macchina corrente:

```bash
openclaw exec-policy preset yolo
```

Questa scorciatoia locale aggiorna entrambi:

- `tools.exec.host/security/ask` locali
- i valori predefiniti locali di `~/.openclaw/exec-approvals.json`

È intenzionalmente solo locale. Se devi cambiare da remoto le approvazioni dell'host gateway o dell'host node, continua a usare `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

Per un host node, applica invece lo stesso file di approvazioni su quel node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Importante limitazione solo locale:

- `openclaw exec-policy` non sincronizza le approvazioni del node
- `openclaw exec-policy set --host node` viene rifiutato
- le approvazioni exec del node vengono recuperate dal node a runtime, quindi gli aggiornamenti destinati al node devono usare `openclaw approvals --node ...`

Scorciatoia solo sessione:

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host rimane più restrittivo della configurazione, prevale comunque la policy host più restrittiva.

## Controlli della policy

### Sicurezza (`exec.security`)

- **deny**: blocca tutte le richieste di exec host.
- **allowlist**: consente solo i comandi presenti nell'allowlist.
- **full**: consente tutto (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: non chiedere mai conferma.
- **on-miss**: chiedi conferma solo quando l'allowlist non corrisponde.
- **always**: chiedi conferma per ogni comando.
- la fiducia persistente `allow-always` non sopprime i prompt quando la modalità ask effettiva è `always`

### Ask fallback (`askFallback`)

Se è richiesta una conferma ma nessuna UI è raggiungibile, il fallback decide:

- **deny**: blocca.
- **allowlist**: consente solo se l'allowlist corrisponde.
- **full**: consente.

### Hardening dell'eval inline dell'interprete (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, OpenClaw tratta le forme di eval inline del codice come soggette a sola approvazione anche se il binario dell'interprete stesso è presente nell'allowlist.

Esempi:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Questa è una difesa in profondità per i loader degli interpreti che non si mappano in modo pulito a un singolo operando file stabile. In modalità strict:

- questi comandi richiedono comunque approvazione esplicita;
- `allow-always` non conserva automaticamente per loro nuove voci nell'allowlist.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente che stai modificando nell'app macOS. I pattern sono corrispondenze glob.
I pattern possono essere glob di percorso binario risolto o glob di nome comando semplice. I nomi semplici
corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a `/opt/homebrew/bin/rg`
quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`. Usa un glob di percorso quando
vuoi considerare affidabile una specifica posizione binaria.
Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello soddisfi le regole dell'allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce dell'allowlist tiene traccia di:

- **id** UUID stabile usato per l'identità UI (facoltativo)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Consenti automaticamente le CLI delle Skills

Quando **Consenti automaticamente le CLI delle Skills** è attivato, gli eseguibili referenziati dalle Skills note
vengono trattati come presenti nell'allowlist sui node (node macOS o host node headless). Questo usa
`skills.bins` tramite Gateway RPC per recuperare l'elenco dei bin delle Skills. Disattivalo se vuoi allowlist manuali rigorose.

Note importanti sulla fiducia:

- Questa è un'**allowlist implicita di comodità**, separata dalle voci manuali dell'allowlist dei percorsi.
- È pensata per ambienti di operatori fidati in cui Gateway e node si trovano nello stesso confine di fiducia.
- Se richiedi una fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali dell'allowlist dei percorsi.

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (il percorso rapido solo stdin), i dettagli del binding dell'interprete e come
inoltrare i prompt di approvazione a Slack/Discord/Telegram (o eseguirli come client nativi di
approvazione), vedi [Approvazioni exec — avanzato](/it/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Modifica nella UI di controllo

Usa la scheda **UI di controllo → Node → Approvazioni exec** per modificare i valori predefiniti, le sostituzioni per agente
e le allowlist. Scegli un ambito (Predefiniti o un agente), modifica la policy,
aggiungi/rimuovi pattern dell'allowlist, poi **Salva**. La UI mostra i metadati **last used**
per pattern così puoi mantenere l'elenco ordinato.

Il selettore della destinazione sceglie **Gateway** (approvazioni locali) o un **Node**. I node
devono dichiarare `system.execApprovals.get/set` (app macOS o host node headless).
Se un node non dichiara ancora le approvazioni exec, modifica direttamente il suo file locale
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` supporta la modifica del gateway o del node (vedi [CLI Approvals](/it/cli/approvals)).

## Flusso di approvazione

Quando è richiesta una conferma, il gateway trasmette `exec.approval.requested` ai client operatore.
La UI di controllo e l'app macOS lo risolvono tramite `exec.approval.resolve`, quindi il gateway inoltra la
richiesta approvata all'host node.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il gateway usa
quel piano come comando/`cwd`/contesto di sessione autorevole quando inoltra richieste `system.run`
approvate.

Questo è importante per la latenza delle approvazioni asincrone:

- il percorso exec del node prepara in anticipo un piano canonico
- il record di approvazione memorizza quel piano e i suoi metadati di binding
- una volta approvata, la chiamata `system.run` finale inoltrata riusa il piano memorizzato
  invece di fidarsi di modifiche successive del chiamante
- se il chiamante cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta
  l'esecuzione inoltrata come mancata corrispondenza dell'approvazione

## Eventi di sistema

Il ciclo di vita exec viene mostrato come messaggi di sistema:

- `Exec in esecuzione` (solo se il comando supera la soglia di notifica di esecuzione)
- `Exec completato`
- `Exec negato`

Questi vengono pubblicati nella sessione dell'agente dopo che il node ha segnalato l'evento.
Le approvazioni exec sull'host gateway emettono gli stessi eventi del ciclo di vita quando il comando termina (e facoltativamente quando è in esecuzione più a lungo della soglia).
Gli exec soggetti ad approvazione riutilizzano l'id di approvazione come `runId` in questi messaggi per una correlazione semplice.

## Comportamento in caso di approvazione negata

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di riutilizzare
l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione. Il motivo del diniego
viene trasmesso con indicazioni esplicite che nessun output del comando è disponibile, impedendo così
all'agente di sostenere che esista un nuovo output o di ripetere il comando negato con
risultati obsoleti di una precedente esecuzione riuscita.

## Implicazioni

- **full** è potente; preferisci le allowlist quando possibile.
- **ask** ti mantiene nel ciclo pur consentendo approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si propaghino ad altri.
- Le approvazioni si applicano solo alle richieste di exec host da parte di **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e per progettazione salta le approvazioni. Per bloccare rigidamente l'exec host, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Approvazioni exec — avanzato" href="/it/tools/exec-approvals-advanced" icon="gear">
    Bin sicuri, binding dell'interprete e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione di comandi shell.
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso di emergenza che salta anche le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso al workspace.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e hardening.
  </Card>
  <Card title="Sandbox vs policy degli strumenti vs elevated" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usare ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento di auto-consenti supportato da Skills.
  </Card>
</CardGroup>
