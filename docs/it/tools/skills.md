---
read_when:
    - Aggiungere o modificare Skills
    - Modificare il gating o le regole di caricamento delle Skills
summary: 'Skills: gestite vs workspace, regole di gating e collegamento config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw usa cartelle di Skills **compatibili con [AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le **Skills incluse** più override locali opzionali e le filtra al momento del caricamento in base ad ambiente, configurazione e presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le Skills da queste sorgenti:

1. **Cartelle skill extra**: configurate con `skills.load.extraDirs`
2. **Skills incluse**: distribuite con l'installazione (pacchetto npm o OpenClaw.app)
3. **Skills gestite/locali**: `~/.openclaw/skills`
4. **Skills agente personali**: `~/.agents/skills`
5. **Skills agente di progetto**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Se il nome di una skill è in conflitto, la precedenza è:

`<workspace>/skills` (più alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse → `skills.load.extraDirs` (più bassa)

## Skills per agente vs condivise

Nelle configurazioni **multi-agente**, ogni agente ha il proprio workspace. Questo significa:

- Le **Skills per agente** si trovano in `<workspace>/skills` solo per quell'agente.
- Le **Skills agente di progetto** si trovano in `<workspace>/.agents/skills` e si applicano a
  quel workspace prima della normale cartella workspace `skills/`.
- Le **Skills agente personali** si trovano in `~/.agents/skills` e si applicano a tutti i
  workspace di quella macchina.
- Le **Skills condivise** si trovano in `~/.openclaw/skills` (gestite/locali) e sono visibili
  a **tutti gli agenti** sulla stessa macchina.
- Le **cartelle condivise** possono anche essere aggiunte tramite `skills.load.extraDirs` (precedenza
  più bassa) se vuoi un pacchetto comune di Skills usato da più agenti.

Se lo stesso nome di skill esiste in più di un posto, si applica la precedenza
normale: vince il workspace, poi le Skills agente di progetto, poi le Skills agente personali,
poi gestite/locali, poi incluse, poi extra dirs.

## Allowlist delle Skills per agente

La **posizione** della skill e la **visibilità** della skill sono controlli separati.

- La posizione/precedenza decide quale copia di una skill con lo stesso nome vince.
- Le allowlist dell'agente decidono quali skill visibili un agente può effettivamente usare.

Usa `agents.defaults.skills` per una base condivisa, poi sovrascrivi per agente con
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i default
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

Regole:

- Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
- Imposta `agents.list[].skills: []` per nessuna skill.
- Un elenco non vuoto `agents.list[].skills` è l'insieme finale per quell'agente; non
  viene unito ai default.

OpenClaw applica l'insieme effettivo di Skills dell'agente a costruzione del prompt, rilevamento dei
comandi slash delle skill, sincronizzazione sandbox e snapshot delle Skills.

## Plugin + Skills

I Plugin possono distribuire le proprie Skills elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla root del Plugin). Le Skills del Plugin vengono caricate
quando il Plugin è abilitato. Questo è il posto giusto per guide operative specifiche dello strumento
troppo lunghe per la descrizione dello strumento ma che dovrebbero essere disponibili
ogni volta che il Plugin è installato; per esempio, il Plugin browser distribuisce una
skill `browser-automation` per il controllo browser in più fasi. Attualmente queste
directory vengono unite nello stesso percorso a bassa precedenza di
`skills.load.extraDirs`, quindi una skill inclusa, gestita, agente o workspace con lo stesso nome le sovrascrive.
Puoi sottoporle a gating tramite `metadata.openclaw.requires.config` nella voce di configurazione
del Plugin. Vedi [Plugin](/it/tools/plugin) per rilevamento/configurazione e [Tools](/it/tools) per la
superficie degli strumenti che queste Skills insegnano.

## Skill Workshop

Il Plugin opzionale e sperimentale Skill Workshop può creare o aggiornare Skills del workspace
da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato per
impostazione predefinita e deve essere abilitato esplicitamente tramite
`plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza il contenuto generato,
supporta approvazione in sospeso o scritture automatiche sicure, mette in quarantena
proposte non sicure e aggiorna lo snapshot delle Skills dopo scritture riuscite così nuove
Skills possono diventare disponibili senza un riavvio del Gateway.

Usalo quando vuoi che correzioni come “la prossima volta, verifica l'attribuzione GIF” o
flussi di lavoro conquistati con fatica come checklist QA per i media diventino istruzioni
procedurali durevoli. Inizia con l'approvazione in sospeso; usa le scritture automatiche solo in
workspace attendibili dopo aver esaminato le sue proposte. Guida completa:
[Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione + sincronizzazione)

ClawHub è il registro pubblico delle Skills per OpenClaw. Sfoglialo su
[https://clawhub.ai](https://clawhub.ai). Usa i comandi nativi `openclaw skills`
per rilevare/installare/aggiornare Skills, oppure la CLI separata `clawhub` quando
ti servono flussi di lavoro di pubblicazione/sincronizzazione.
Guida completa: [ClawHub](/it/tools/clawhub).

Flussi comuni:

- Installare una skill nel tuo workspace:
  - `openclaw skills install <skill-slug>`
- Aggiornare tutte le Skills installate:
  - `openclaw skills update --all`
- Sincronizzare (scansione + pubblicazione aggiornamenti):
  - `clawhub sync --all`

Il comando nativo `openclaw skills install` installa nella directory `skills/` del workspace attivo.
Anche la CLI separata `clawhub` installa in `./skills` sotto la directory di lavoro
corrente (oppure usa come fallback il workspace OpenClaw configurato).
OpenClaw lo rileva come `<workspace>/skills` alla sessione successiva.

## Note di sicurezza

- Tratta le Skills di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
- Preferisci esecuzioni sandbox per input non attendibili e strumenti rischiosi. Vedi [Sandboxing](/it/gateway/sandboxing).
- Il rilevamento delle Skills in workspace ed extra-dir accetta solo root di skill e file `SKILL.md` il cui realpath risolto resta all'interno della root configurata.
- Le installazioni delle dipendenze delle skill supportate dal Gateway (`skills.install`, onboarding e UI impostazioni Skills) eseguono lo scanner integrato per codice pericoloso prima di eseguire i metadati dell'installer. I rilevamenti `critical` bloccano per impostazione predefinita a meno che il chiamante non imposti esplicitamente l'override del pericolo; i rilevamenti sospetti continuano invece a produrre solo avvisi.
- `openclaw skills install <slug>` è diverso: scarica una cartella skill ClawHub nel workspace e non usa il percorso dei metadati dell'installer sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host**
  per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.
- Per un modello di minaccia più ampio e checklist, vedi [Security](/it/gateway/security).

## Formato (compatibile con AgentSkills + Pi)

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Note:

- Seguiamo la specifica AgentSkills per layout/intento.
- Il parser usato dall'agente incorporato supporta solo chiavi frontmatter **su una sola riga**.
- `metadata` deve essere un **oggetto JSON su una sola riga**.
- Usa `{baseDir}` nelle istruzioni per fare riferimento al percorso della cartella skill.
- Chiavi frontmatter opzionali:
  - `homepage` — URL mostrato come “Website” nella UI Skills di macOS (supportato anche tramite `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predefinito: `true`). Quando è `true`, la skill è esposta come comando slash utente.
  - `disable-model-invocation` — `true|false` (predefinito: `false`). Quando è `true`, la skill è esclusa dal prompt del modello (resta disponibile tramite invocazione utente).
  - `command-dispatch` — `tool` (opzionale). Quando impostato a `tool`, il comando slash aggira il modello e invia direttamente a uno strumento.
  - `command-tool` — nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (predefinito). Per il dispatch allo strumento, inoltra la stringa args grezza allo strumento (nessun parsing core).

    Lo strumento viene invocato con i parametri:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtri al caricamento)

OpenClaw **filtra le Skills al momento del caricamento** usando `metadata` (JSON su una sola riga):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campi sotto `metadata.openclaw`:

- `always: true` — includi sempre la skill (salta gli altri gate).
- `emoji` — emoji opzionale usata dalla UI Skills di macOS.
- `homepage` — URL opzionale mostrato come “Website” nella UI Skills di macOS.
- `os` — elenco opzionale di piattaforme (`darwin`, `linux`, `win32`). Se impostato, la skill è idonea solo su quei sistemi operativi.
- `requires.bins` — elenco; ciascuno deve esistere su `PATH`.
- `requires.anyBins` — elenco; almeno uno deve esistere su `PATH`.
- `requires.env` — elenco; la variabile env deve esistere **oppure** essere fornita nella configurazione.
- `requires.config` — elenco di percorsi `openclaw.json` che devono essere truthy.
- `primaryEnv` — nome della variabile env associata a `skills.entries.<name>.apiKey`.
- `install` — array opzionale di specifiche installer usate dalla UI Skills di macOS (brew/node/go/uv/download).

I blocchi legacy `metadata.clawdbot` sono ancora accettati quando
`metadata.openclaw` è assente, così le Skills installate più vecchie mantengono i loro
gate delle dipendenze e gli hint dell'installer. Le Skills nuove e aggiornate dovrebbero usare
`metadata.openclaw`.

Nota sul sandboxing:

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è in sandbox, il binario deve esistere anche **dentro il container**.
  Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata).
  `setupCommand` viene eseguito una volta dopo la creazione del container.
  Le installazioni di pacchetti richiedono anche egress di rete, un filesystem root scrivibile e un utente root nella sandbox.
  Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize`
  nel container sandbox per essere eseguita lì.

Esempio di installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Note:

- Se sono elencati più installer, il gateway sceglie una **singola** opzione preferita (brew quando disponibile, altrimenti node).
- Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artefatti disponibili.
- Le specifiche installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
- Le installazioni node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun).
  Questo influisce solo sulle **installazioni di skill**; il runtime Gateway dovrebbe comunque essere Node
  (Bun non è consigliato per WhatsApp/Telegram).
- La selezione dell'installer supportata dal Gateway è guidata dalle preferenze, non solo da node:
  quando le specifiche di installazione mescolano più tipi, OpenClaw preferisce Homebrew quando
  `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il
  node manager configurato, poi altri fallback come `go` o `download`.
- Se ogni specifica di installazione è `download`, OpenClaw mostra tutte le opzioni di download
  invece di ridurle a un solo installer preferito.
- Installazioni Go: se `go` manca e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` su `bin` di Homebrew quando possibile.
- Installazioni download: `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

Se non è presente `metadata.openclaw`, la skill è sempre idonea (a meno che
non sia disabilitata nella configurazione o bloccata da `skills.allowBundled` per le Skills incluse).

## Override di configurazione (`~/.openclaw/openclaw.json`)

Le Skills incluse/gestite possono essere attivate/disattivate e ricevere valori env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Nota: se il nome della skill contiene trattini, racchiudi la chiave tra virgolette (JSON5 consente chiavi tra virgolette).

Se vuoi generazione/modifica di immagini standard direttamente dentro OpenClaw, usa lo strumento core
`image_generate` con `agents.defaults.imageGenerationModel` invece di una
skill inclusa. Gli esempi di skill qui sono per flussi di lavoro personalizzati o di terze parti.

Per l'analisi nativa delle immagini, usa lo strumento `image` con `agents.defaults.imageModel`.
Per la generazione/modifica nativa delle immagini, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello immagine specifico di provider, aggiungi anche l'autenticazione/chiave API
di quel provider.

Le chiavi di configurazione corrispondono al **nome della skill** per impostazione predefinita. Se una skill definisce
`metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

Regole:

- `enabled: false` disabilita la skill anche se è inclusa/installata.
- `env`: iniettato **solo se** la variabile non è già impostata nel processo.
- `apiKey`: scorciatoia per le Skills che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa plaintext o un oggetto SecretRef (`{ source, provider, id }`).
- `config`: contenitore opzionale per campi personalizzati per skill; le chiavi personalizzate devono stare qui.
- `allowBundled`: allowlist opzionale solo per le **Skills incluse**. Se impostata, solo
  le Skills incluse presenti nell'elenco sono idonee (Skills gestite/workspace non interessate).

## Iniezione dell'ambiente (per esecuzione agente)

Quando inizia un'esecuzione dell'agente, OpenClaw:

1. Legge i metadati della skill.
2. Applica eventuali `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Costruisce il prompt di sistema con le Skills **idonee**.
4. Ripristina l'ambiente originale dopo la fine dell'esecuzione.

Questo è **limitato all'esecuzione dell'agente**, non a un ambiente shell globale.

Per il backend `claude-cli` incluso, OpenClaw materializza anche lo stesso
snapshot idoneo come Plugin temporaneo Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio resolver nativo delle skill mentre
OpenClaw continua a gestire precedenza, allowlist per agente, gating e
iniezione env/chiave API `skills.entries.*`. Gli altri backend CLI usano solo il
catalogo del prompt.

## Snapshot di sessione (prestazioni)

OpenClaw crea uno snapshot delle Skills idonee **quando inizia una sessione** e riutilizza quell'elenco per i turni successivi nella stessa sessione. Le modifiche a Skills o configurazione hanno effetto nella successiva nuova sessione.

Le Skills possono anche aggiornarsi durante la sessione quando il watcher delle Skills è abilitato o quando appare un nuovo Node remoto idoneo (vedi sotto). Consideralo come un **hot reload**: l'elenco aggiornato viene recepito al turno successivo dell'agente.

Se l'allowlist effettiva delle Skills dell'agente cambia per quella sessione, OpenClaw
aggiorna lo snapshot così le Skills visibili restano allineate con l'agente
corrente.

## Node macOS remoti (Gateway Linux)

Se il Gateway è in esecuzione su Linux ma è connesso un **Node macOS** **con `system.run` consentito** (sicurezza delle approvazioni Exec non impostata su `deny`), OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti sono presenti su quel Node. L'agente dovrebbe eseguire quelle Skills tramite lo strumento `exec` con `host=node`.

Questo si basa sul fatto che il Node segnali il supporto ai comandi e su una verifica dei bin tramite `system.run`. Se in seguito il Node macOS va offline, le Skills restano visibili; le invocazioni possono fallire finché il Node non si riconnette.

## Watcher delle Skills (aggiornamento automatico)

Per impostazione predefinita, OpenClaw osserva le cartelle delle Skills e aggiorna lo snapshot delle Skills quando i file `SKILL.md` cambiano. Configuralo sotto `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impatto sui token (elenco Skills)

Quando le Skills sono idonee, OpenClaw inietta un elenco XML compatto delle Skills disponibili nel prompt di sistema (tramite `formatSkillsForPrompt` in `pi-coding-agent`). Il costo è deterministico:

- **Overhead di base (solo quando ≥1 skill):** 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori XML-escaped di `<name>`, `<description>` e `<location>`.

Formula (caratteri):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Note:

- L'escaping XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.), aumentando la lunghezza.
- Il conteggio dei token varia in base al tokenizer del modello. Una stima approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per skill più le lunghezze effettive dei campi.

## Ciclo di vita delle Skills gestite

OpenClaw distribuisce un insieme base di Skills come **Skills incluse** come parte
dell'installazione (pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per
override locali (per esempio, fissare/applicare patch a una skill senza modificare la copia
inclusa). Le Skills del workspace sono di proprietà dell'utente e sovrascrivono entrambe in caso di conflitti di nome.

## Riferimento configurazione

Vedi [Configurazione Skills](/it/tools/skills-config) per lo schema di configurazione completo.

## Cerchi altre Skills?

Sfoglia [https://clawhub.ai](https://clawhub.ai).

---

## Correlati

- [Creare Skills](/it/tools/creating-skills) — creare Skills personalizzate
- [Configurazione Skills](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
- [Plugin](/it/tools/plugin) — panoramica del sistema Plugin
