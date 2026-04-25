---
read_when:
    - Devi spiegare il workspace dell'agente o la struttura dei suoi file
    - Vuoi eseguire il backup o migrare un workspace dell'agente
summary: 'Workspace dell''agente: posizione, struttura e strategia di backup'
title: Workspace dell'agente
x-i18n:
    generated_at: "2026-04-25T13:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Il workspace è la casa dell'agente. È l'unica directory di lavoro usata per
gli strumenti file e per il contesto del workspace. Tienilo privato e trattalo come memoria.

Questo è separato da `~/.openclaw/`, che memorizza configurazione, credenziali e
sessioni.

**Importante:** il workspace è la **cwd predefinita**, non una sandbox rigida. Gli
strumenti risolvono i percorsi relativi rispetto al workspace, ma i percorsi assoluti
possono comunque raggiungere altre posizioni sull'host a meno che non sia abilitato il sandboxing. Se ti serve isolamento, usa
[`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o la configurazione sandbox per agente).
Quando il sandboxing è abilitato e `workspaceAccess` non è `"rw"`, gli strumenti operano
all'interno di un workspace sandbox sotto `~/.openclaw/sandboxes`, non nel tuo workspace host.

## Posizione predefinita

- Predefinita: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` è impostato e non è `"default"`, il valore predefinito diventa
  `~/.openclaw/workspace-<profile>`.
- Override in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` oppure `openclaw setup` creeranno il
workspace e inizializzeranno i file bootstrap se mancano.
Le copie seed della sandbox accettano solo file regolari interni al workspace; alias
symlink/hardlink che si risolvono fuori dal workspace sorgente vengono ignorati.

Se gestisci già tu i file del workspace, puoi disabilitare la creazione dei
file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle workspace aggiuntive

Le installazioni più vecchie potrebbero aver creato `~/openclaw`. Mantenere più
directory workspace può causare derive confuse di auth o stato, perché è attivo
un solo workspace alla volta.

**Raccomandazione:** mantieni un solo workspace attivo. Se non usi più le
cartelle aggiuntive, archiviale o spostale nel Cestino (ad esempio `trash ~/openclaw`).
Se mantieni intenzionalmente più workspace, assicurati che
`agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory workspace aggiuntive.

## Mappa dei file del workspace (cosa significa ogni file)

Questi sono i file standard che OpenClaw si aspetta nel workspace:

- `AGENTS.md`
  - Istruzioni operative per l'agente e su come dovrebbe usare la memoria.
  - Caricato all'inizio di ogni sessione.
  - Buon posto per regole, priorità e dettagli su "come comportarsi".

- `SOUL.md`
  - Persona, tono e limiti.
  - Caricato in ogni sessione.
  - Guida: [Guida alla personalità SOUL.md](/it/concepts/soul)

- `USER.md`
  - Chi è l'utente e come rivolgersi a lui.
  - Caricato in ogni sessione.

- `IDENTITY.md`
  - Il nome dell'agente, il vibe e l'emoji.
  - Creato/aggiornato durante il rituale bootstrap.

- `TOOLS.md`
  - Note sui tuoi strumenti locali e sulle convenzioni.
  - Non controlla la disponibilità degli strumenti; è solo una guida.

- `HEARTBEAT.md`
  - Piccola checklist facoltativa per le esecuzioni Heartbeat.
  - Tienila breve per evitare consumo di token.

- `BOOT.md`
  - Checklist di avvio facoltativa eseguita automaticamente al riavvio del gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati).
  - Tienila breve; usa lo strumento messaggio per gli invii in uscita.

- `BOOTSTRAP.md`
  - Rituale una tantum della prima esecuzione.
  - Creato solo per un workspace completamente nuovo.
  - Eliminalo dopo il completamento del rituale.

- `memory/YYYY-MM-DD.md`
  - Log di memoria giornaliero (un file per giorno).
  - Si consiglia di leggere oggi + ieri all'avvio della sessione.

- `MEMORY.md` (facoltativo)
  - Memoria a lungo termine curata.
  - Caricala solo nella sessione principale privata (non in contesti condivisi/di gruppo).

Vedi [Memory](/it/concepts/memory) per il flusso di lavoro e il flush automatico della memoria.

- `skills/` (facoltativo)
  - Skills specifiche del workspace.
  - Posizione Skills con precedenza più alta per quel workspace.
  - Sovrascrive skills di agent di progetto, skills di agent personali, skills gestite, skills incluse nel bundle e `skills.load.extraDirs` quando i nomi entrano in conflitto.

- `canvas/` (facoltativo)
  - File della UI canvas per le visualizzazioni dei Node (ad esempio `canvas/index.html`).

Se manca qualche file bootstrap, OpenClaw inietta un marker "file mancante" nella
sessione e continua. I file bootstrap grandi vengono troncati durante l'iniezione;
regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e
`agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000).
`openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i
file esistenti.

## Cosa NON si trova nel workspace

Questi si trovano sotto `~/.openclaw/` e NON devono essere sottoposti a commit nel repo del workspace:

- `~/.openclaw/openclaw.json` (configurazione)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili auth del modello: OAuth + API key)
- `~/.openclaw/credentials/` (stato canale/provider più dati legacy di importazione OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni sessione + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o configurazione, copiale separatamente e tienile
fuori dal controllo versione.

## Backup Git (consigliato, privato)

Tratta il workspace come memoria privata. Mettilo in un repo git **privato** così
da averne backup e possibilità di recupero.

Esegui questi passaggi sulla macchina in cui gira il Gateway (è lì che si trova il
workspace).

### 1) Inizializza il repo

Se git è installato, i workspace completamente nuovi vengono inizializzati automaticamente. Se questo
workspace non è già un repo, esegui:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Aggiungi un remote privato (opzioni semplici per principianti)

Opzione A: interfaccia web GitHub

1. Crea un nuovo repository **privato** su GitHub.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL remote HTTPS.
4. Aggiungi il remote ed esegui il push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opzione B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opzione C: interfaccia web GitLab

1. Crea un nuovo repository **privato** su GitLab.
2. Non inizializzarlo con un README (evita conflitti di merge).
3. Copia l'URL remote HTTPS.
4. Aggiungi il remote ed esegui il push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Aggiornamenti continui

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Non fare commit dei segreti

Anche in un repo privato, evita di memorizzare segreti nel workspace:

- API key, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi memorizzare riferimenti sensibili, usa segnaposto e conserva il
segreto reale altrove (password manager, variabili d'ambiente o `~/.openclaw/`).

Starter `.gitignore` consigliato:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare il workspace su una nuova macchina

1. Clona il repo nel percorso desiderato (predefinito `~/.openclaw/workspace`).
2. Imposta `agents.defaults.workspace` su quel percorso in `~/.openclaw/openclaw.json`.
3. Esegui `openclaw setup --workspace <path>` per inizializzare eventuali file mancanti.
4. Se ti servono le sessioni, copia `~/.openclaw/agents/<agentId>/sessions/` dalla
   vecchia macchina separatamente.

## Note avanzate

- L'instradamento multi-agente può usare workspace diversi per agente. Vedi
  [Instradamento del canale](/it/channels/channel-routing) per la configurazione di instradamento.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare workspace
  sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Standing Orders](/it/automation/standing-orders) — istruzioni persistenti nei file del workspace
- [Heartbeat](/it/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Session](/it/concepts/session) — percorsi di archiviazione delle sessioni
- [Sandboxing](/it/gateway/sandboxing) — accesso al workspace in ambienti sandboxed
