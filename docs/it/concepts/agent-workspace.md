---
read_when:
    - Devi spiegare il workspace dell’agente o il suo layout dei file
    - Vuoi eseguire il backup o migrare un workspace dell’agente
sidebarTitle: Agent workspace
summary: 'Workspace dell’agente: posizione, layout e strategia di backup'
title: Workspace dell’agente
x-i18n:
    generated_at: "2026-04-26T11:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Il workspace è la casa dell’agente. È l’unica directory di lavoro usata per gli strumenti file e per il contesto del workspace. Tienilo privato e trattalo come memoria.

Questo è separato da `~/.openclaw/`, che memorizza config, credenziali e sessioni.

<Warning>
Il workspace è la **cwd predefinita**, non una sandbox rigida. Gli strumenti risolvono i percorsi relativi rispetto al workspace, ma i percorsi assoluti possono comunque raggiungere altre parti dell’host a meno che la sandboxing non sia abilitata. Se ti serve isolamento, usa [`agents.defaults.sandbox`](/it/gateway/sandboxing) (e/o una config sandbox per agente).

Quando la sandboxing è abilitata e `workspaceAccess` non è `"rw"`, gli strumenti operano dentro un workspace sandbox sotto `~/.openclaw/sandboxes`, non nel tuo workspace host.
</Warning>

## Posizione predefinita

- Predefinita: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` è impostata e non è `"default"`, il valore predefinito diventa `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` o `openclaw setup` creeranno il workspace e inizializzeranno i file bootstrap se mancanti.

<Note>
Le copie di inizializzazione della sandbox accettano solo file regolari interni al workspace; alias symlink/hardlink che risolvono all’esterno del workspace di origine vengono ignorati.
</Note>

Se gestisci già tu i file del workspace, puoi disabilitare la creazione dei file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Cartelle extra del workspace

Le installazioni meno recenti potrebbero aver creato `~/openclaw`. Mantenere più directory workspace può causare deriva confusa di auth o stato, perché solo un workspace è attivo alla volta.

<Note>
**Raccomandazione:** mantieni un solo workspace attivo. Se non usi più le cartelle extra, archiviale o spostale nel Cestino (ad esempio `trash ~/openclaw`). Se mantieni intenzionalmente più workspace, assicurati che `agents.defaults.workspace` punti a quello attivo.

`openclaw doctor` avvisa quando rileva directory workspace extra.
</Note>

## Mappa dei file del workspace

Questi sono i file standard che OpenClaw si aspetta all’interno del workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md — istruzioni operative">
    Istruzioni operative per l’agente e su come dovrebbe usare la memoria. Caricato all’inizio di ogni sessione. Buon posto per regole, priorità e dettagli su “come comportarsi”.
  </Accordion>
  <Accordion title="SOUL.md — persona e tono">
    Persona, tono e confini. Caricato a ogni sessione. Guida: [guida alla personalità di SOUL.md](/it/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — chi è l’utente">
    Chi è l’utente e come rivolgersi a lui. Caricato a ogni sessione.
  </Accordion>
  <Accordion title="IDENTITY.md — nome, vibe, emoji">
    Nome, vibe ed emoji dell’agente. Creato/aggiornato durante il rituale bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — convenzioni degli strumenti locali">
    Note sui tuoi strumenti e convenzioni locali. Non controlla la disponibilità degli strumenti; è solo una guida.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist Heartbeat">
    Piccola checklist facoltativa per le esecuzioni di Heartbeat. Mantienila breve per evitare consumo di token.
  </Accordion>
  <Accordion title="BOOT.md — checklist di avvio">
    Checklist di avvio facoltativa eseguita automaticamente al riavvio del Gateway (quando gli [hook interni](/it/automation/hooks) sono abilitati). Mantienila breve; usa lo strumento message per gli invii in uscita.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — rituale di prima esecuzione">
    Rituale una tantum di prima esecuzione. Viene creato solo per un workspace completamente nuovo. Eliminalo dopo che il rituale è completo.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — log giornaliero della memoria">
    Log giornaliero della memoria (un file al giorno). Si consiglia di leggere oggi + ieri all’avvio della sessione.
  </Accordion>
  <Accordion title="MEMORY.md — memoria a lungo termine curata (facoltativa)">
    Memoria a lungo termine curata. Caricala solo nella sessione principale e privata (non in contesti condivisi/di gruppo). Consulta [Memory](/it/concepts/memory) per il flusso di lavoro e lo svuotamento automatico della memoria.
  </Accordion>
  <Accordion title="skills/ — Skills del workspace (facoltative)">
    Skills specifiche del workspace. Posizione Skills a precedenza più alta per quel workspace. Sovrascrive le Skills dell’agente del progetto, le Skills personali dell’agente, le Skills gestite, le Skills incluse e `skills.load.extraDirs` quando i nomi coincidono.
  </Accordion>
  <Accordion title="canvas/ — file Canvas UI (facoltativi)">
    File Canvas UI per display dei Node (ad esempio `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se manca un file bootstrap, OpenClaw inserisce nella sessione un marcatore di “file mancante” e continua. I file bootstrap grandi vengono troncati quando vengono inseriti; regola i limiti con `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). `openclaw setup` può ricreare i valori predefiniti mancanti senza sovrascrivere i file esistenti.
</Note>

## Cosa NON è nel workspace

Questi elementi si trovano sotto `~/.openclaw/` e NON dovrebbero essere inclusi nel repo del workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profili auth del modello: OAuth + chiavi API)
- `~/.openclaw/credentials/` (stato di canale/provider più dati legacy di importazione OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (trascrizioni delle sessioni + metadati)
- `~/.openclaw/skills/` (Skills gestite)

Se devi migrare sessioni o config, copiale separatamente e tienile fuori dal controllo di versione.

## Backup Git (consigliato, privato)

Tratta il workspace come memoria privata. Inseriscilo in un repo git **privato** così sarà sottoposto a backup e recuperabile.

Esegui questi passaggi sulla macchina dove gira il Gateway (è lì che si trova il workspace).

<Steps>
  <Step title="Inizializza il repo">
    Se git è installato, i workspace nuovi vengono inizializzati automaticamente. Se questo workspace non è già un repo, esegui:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Aggiungi un remote privato">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Crea un nuovo repository **privato** su GitHub.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l’URL remote HTTPS.
        4. Aggiungi il remote ed esegui il push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Crea un nuovo repository **privato** su GitLab.
        2. Non inizializzarlo con un README (evita conflitti di merge).
        3. Copia l’URL remote HTTPS.
        4. Aggiungi il remote ed esegui il push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Aggiornamenti continui">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Non eseguire il commit dei segreti

<Warning>
Anche in un repo privato, evita di memorizzare segreti nel workspace:

- Chiavi API, token OAuth, password o credenziali private.
- Qualsiasi cosa sotto `~/.openclaw/`.
- Dump grezzi di chat o allegati sensibili.

Se devi memorizzare riferimenti sensibili, usa segnaposto e conserva il segreto reale altrove (password manager, variabili d’ambiente o `~/.openclaw/`).
</Warning>

Starter suggerito per `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Spostare il workspace su una nuova macchina

<Steps>
  <Step title="Clona il repo">
    Clona il repo nel percorso desiderato (predefinito `~/.openclaw/workspace`).
  </Step>
  <Step title="Aggiorna la config">
    Imposta `agents.defaults.workspace` su quel percorso in `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Inizializza i file mancanti">
    Esegui `openclaw setup --workspace <path>` per inizializzare eventuali file mancanti.
  </Step>
  <Step title="Copia le sessioni (facoltativo)">
    Se hai bisogno delle sessioni, copia separatamente `~/.openclaw/agents/<agentId>/sessions/` dalla vecchia macchina.
  </Step>
</Steps>

## Note avanzate

- Il routing multi-agente può usare workspace diversi per agente. Consulta [Channel routing](/it/channels/channel-routing) per la configurazione del routing.
- Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono usare workspace sandbox per sessione sotto `agents.defaults.sandbox.workspaceRoot`.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Sandboxing](/it/gateway/sandboxing) — accesso al workspace in ambienti sandboxati
- [Session](/it/concepts/session) — percorsi di archiviazione delle sessioni
- [Standing orders](/it/automation/standing-orders) — istruzioni persistenti nei file del workspace
