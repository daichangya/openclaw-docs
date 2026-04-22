---
read_when:
    - Aggiunta o modifica di Skills
    - Modifica del gating delle Skills o delle regole di caricamento
summary: 'Skills: gestiti vs workspace, regole di gating e wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:28:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw usa cartelle di skill compatibili con **[AgentSkills](https://agentskills.io)** per insegnare all'agente come usare gli strumenti. Ogni skill è una directory che contiene un `SKILL.md` con frontmatter YAML e istruzioni. OpenClaw carica le **Skills incluse** più eventuali override locali e le filtra al momento del caricamento in base all'ambiente, alla configurazione e alla presenza dei binari.

## Posizioni e precedenza

OpenClaw carica le Skills da queste fonti:

1. **Cartelle skill extra**: configurate con `skills.load.extraDirs`
2. **Skills incluse**: distribuite con l'installazione (pacchetto npm o OpenClaw.app)
3. **Skills gestite/locali**: `~/.openclaw/skills`
4. **Skills agent personali**: `~/.agents/skills`
5. **Skills agent del progetto**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Se c'è un conflitto di nome skill, la precedenza è:

`<workspace>/skills` (massima) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluse → `skills.load.extraDirs` (minima)

## Skills per agente vs condivise

Nelle configurazioni **multi-agent**, ogni agente ha il proprio workspace. Questo significa:

- Le **Skills per agente** si trovano in `<workspace>/skills` solo per quell'agente.
- Le **Skills agent del progetto** si trovano in `<workspace>/.agents/skills` e si applicano a
  quel workspace prima della normale cartella `skills/` del workspace.
- Le **Skills agent personali** si trovano in `~/.agents/skills` e si applicano a tutti i
  workspace su quella macchina.
- Le **Skills condivise** si trovano in `~/.openclaw/skills` (gestite/locali) e sono visibili
  a **tutti gli agenti** sulla stessa macchina.
- **Cartelle condivise** possono anche essere aggiunte tramite `skills.load.extraDirs` (precedenza
  minima) se vuoi un pacchetto di Skills comune usato da più agenti.

Se lo stesso nome skill esiste in più posizioni, si applica la normale precedenza:
vince il workspace, poi le Skills agent del progetto, poi le Skills agent personali,
poi quelle gestite/locali, poi quelle incluse, poi le cartelle extra.

## Allowlists delle skill per agente

La **posizione** di una skill e la **visibilità** della skill sono controlli separati.

- Posizione/precedenza decide quale copia di una skill con lo stesso nome vince.
- Le allowlist dell'agente decidono quali skill visibili un agente può effettivamente usare.

Usa `agents.defaults.skills` per una baseline condivisa, poi fai override per agente con
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

- Ometti `agents.defaults.skills` per skill non limitate per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare `agents.defaults.skills`.
- Imposta `agents.list[].skills: []` per nessuna skill.
- Una lista `agents.list[].skills` non vuota è l'insieme finale per quell'agente; non
  viene unita ai default.

OpenClaw applica l'insieme effettivo di skill dell'agente durante la costruzione del prompt,
la discovery dei comandi slash delle skill, la sincronizzazione sandbox e gli snapshot delle skill.

## Plugin + Skills

I plugin possono distribuire le proprie Skills elencando directory `skills` in
`openclaw.plugin.json` (percorsi relativi alla root del plugin). Le skill del plugin vengono caricate
quando il plugin è abilitato. Oggi queste directory vengono unite nello stesso percorso a
bassa precedenza di `skills.load.extraDirs`, quindi una skill inclusa,
gestita, dell'agente o del workspace con lo stesso nome le sovrascrive.
Puoi fare gating tramite `metadata.openclaw.requires.config` sulla voce di configurazione
del plugin. Vedi [Plugins](/it/tools/plugin) per discovery/configurazione e [Tools](/it/tools) per la
superficie degli strumenti che queste skill insegnano.

## Skill Workshop

Il plugin facoltativo e sperimentale Skill Workshop può creare o aggiornare Skills del workspace
a partire da procedure riutilizzabili osservate durante il lavoro dell'agente. È disabilitato per impostazione predefinita e deve essere esplicitamente abilitato tramite
`plugins.entries.skill-workshop`.

Skill Workshop scrive solo in `<workspace>/skills`, analizza il contenuto generato,
supporta approvazione in sospeso o scritture automatiche sicure, mette in quarantena
proposte non sicure e aggiorna lo snapshot delle skill dopo scritture riuscite così che nuove
Skills possano diventare disponibili senza un riavvio del Gateway.

Usalo quando vuoi che correzioni come “la prossima volta, verifica l'attribuzione GIF” o
workflow difficili da conquistare come checklist QA dei media diventino istruzioni procedurali durevoli. Inizia con approvazione in sospeso; usa scritture automatiche solo in workspace fidati dopo aver esaminato le proposte. Guida completa:
[Plugin Skill Workshop](/it/plugins/skill-workshop).

## ClawHub (installazione + sync)

ClawHub è il registro pubblico delle skill per OpenClaw. Sfoglialo su
[https://clawhub.ai](https://clawhub.ai). Usa i comandi nativi `openclaw skills`
per scoprire/installare/aggiornare skill, oppure la CLI separata `clawhub` quando
hai bisogno di flussi di pubblicazione/sincronizzazione.
Guida completa: [ClawHub](/it/tools/clawhub).

Flussi comuni:

- Installa una skill nel tuo workspace:
  - `openclaw skills install <skill-slug>`
- Aggiorna tutte le skill installate:
  - `openclaw skills update --all`
- Sync (scansione + pubblicazione aggiornamenti):
  - `clawhub sync --all`

Il comando nativo `openclaw skills install` installa nella directory `skills/`
del workspace attivo. Anche la CLI separata `clawhub` installa in `./skills` sotto la
directory di lavoro corrente (o usa come fallback il workspace OpenClaw configurato).
OpenClaw la rileva come `<workspace>/skills` nella sessione successiva.

## Note sulla sicurezza

- Tratta le skill di terze parti come **codice non attendibile**. Leggile prima di abilitarle.
- Preferisci esecuzioni sandboxate per input non attendibili e strumenti rischiosi. Vedi [Sandboxing](/it/gateway/sandboxing).
- La discovery delle skill del workspace e delle cartelle extra accetta solo root di skill e file `SKILL.md` il cui realpath risolto rimane dentro la root configurata.
- Le installazioni di dipendenze delle skill supportate dal Gateway (`skills.install`, onboarding e UI impostazioni Skills) eseguono lo scanner integrato di codice pericoloso prima di eseguire i metadati dell'installer. I risultati `critical` bloccano per impostazione predefinita a meno che il chiamante non imposti esplicitamente l'override di pericolo; i risultati sospetti producono ancora solo avvisi.
- `openclaw skills install <slug>` è diverso: scarica una cartella skill da ClawHub nel workspace e non usa il percorso dei metadati dell'installer descritto sopra.
- `skills.entries.*.env` e `skills.entries.*.apiKey` iniettano segreti nel processo **host**
  per quel turno dell'agente (non nella sandbox). Tieni i segreti fuori da prompt e log.
- Per un threat model più ampio e checklist, vedi [Sicurezza](/it/gateway/security).

## Formato (AgentSkills + compatibile con Pi)

`SKILL.md` deve includere almeno:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Note:

- Seguiamo la specifica AgentSkills per layout/intento.
- Il parser usato dall'agente embedded supporta solo chiavi di frontmatter **su singola riga**.
- `metadata` dovrebbe essere un **oggetto JSON su singola riga**.
- Usa `{baseDir}` nelle istruzioni per fare riferimento al percorso della cartella skill.
- Chiavi frontmatter facoltative:
  - `homepage` — URL mostrato come “Website” nella UI macOS delle Skills (supportato anche tramite `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predefinito: `true`). Quando `true`, la skill viene esposta come comando slash utente.
  - `disable-model-invocation` — `true|false` (predefinito: `false`). Quando `true`, la skill viene esclusa dal prompt del modello (resta comunque disponibile tramite invocazione utente).
  - `command-dispatch` — `tool` (facoltativo). Quando impostato a `tool`, il comando slash bypassa il modello e viene inviato direttamente a uno strumento.
  - `command-tool` — nome dello strumento da invocare quando è impostato `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (predefinito). Per il dispatch al tool, inoltra la stringa raw degli argomenti allo strumento (nessun parsing del core).

    Lo strumento viene invocato con i parametri:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtri al momento del caricamento)

OpenClaw **filtra le Skills al momento del caricamento** usando `metadata` (JSON su singola riga):

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

- `always: true` — include sempre la skill (salta gli altri gate).
- `emoji` — emoji facoltativa usata dalla UI macOS delle Skills.
- `homepage` — URL facoltativo mostrato come “Website” nella UI macOS delle Skills.
- `os` — elenco facoltativo di piattaforme (`darwin`, `linux`, `win32`). Se impostato, la skill è idonea solo su quei sistemi operativi.
- `requires.bins` — elenco; ciascuno deve esistere su `PATH`.
- `requires.anyBins` — elenco; deve esisterne almeno uno su `PATH`.
- `requires.env` — elenco; la variabile d'ambiente deve esistere **oppure** essere fornita nella configurazione.
- `requires.config` — elenco di percorsi `openclaw.json` che devono essere truthy.
- `primaryEnv` — nome della variabile d'ambiente associata a `skills.entries.<name>.apiKey`.
- `install` — array facoltativo di specifiche installer usate dalla UI macOS delle Skills (brew/node/go/uv/download).

Nota sul sandboxing:

- `requires.bins` viene controllato sull'**host** al momento del caricamento della skill.
- Se un agente è sandboxato, il binario deve esistere anche **dentro il container**.
  Installalo tramite `agents.defaults.sandbox.docker.setupCommand` (o un'immagine personalizzata).
  `setupCommand` viene eseguito una volta dopo la creazione del container.
  Le installazioni di pacchetti richiedono anche egress di rete, un filesystem root scrivibile e un utente root nella sandbox.
  Esempio: la skill `summarize` (`skills/summarize/SKILL.md`) richiede la CLI `summarize`
  nel container sandbox per poter essere eseguita lì.

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
- Se tutti gli installer sono `download`, OpenClaw elenca ogni voce così puoi vedere gli artifact disponibili.
- Le specifiche installer possono includere `os: ["darwin"|"linux"|"win32"]` per filtrare le opzioni per piattaforma.
- Le installazioni Node rispettano `skills.install.nodeManager` in `openclaw.json` (predefinito: npm; opzioni: npm/pnpm/yarn/bun).
  Questo influisce solo sulle **installazioni di skill**; il runtime del Gateway dovrebbe comunque essere Node
  (Bun non è consigliato per WhatsApp/Telegram).
- La selezione dell'installer supportata dal Gateway è guidata dalle preferenze, non solo da node:
  quando le specifiche di installazione mescolano tipi diversi, OpenClaw preferisce Homebrew quando
  `skills.install.preferBrew` è abilitato e `brew` esiste, poi `uv`, poi il
  node manager configurato, poi altri fallback come `go` o `download`.
- Se tutte le specifiche di installazione sono `download`, OpenClaw mostra tutte le opzioni di download
  invece di ridurle a un solo installer preferito.
- Installazioni Go: se `go` manca e `brew` è disponibile, il gateway installa prima Go tramite Homebrew e imposta `GOBIN` su `bin` di Homebrew quando possibile.
- Installazioni download: `url` (obbligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predefinito: automatico quando viene rilevato un archivio), `stripComponents`, `targetDir` (predefinito: `~/.openclaw/tools/<skillKey>`).

Se `metadata.openclaw` non è presente, la skill è sempre idonea (a meno che
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

Se vuoi generazione/modifica di immagini standard direttamente dentro OpenClaw, usa il tool core
`image_generate` con `agents.defaults.imageGenerationModel` invece di una
skill inclusa. Gli esempi di skill qui sono per workflow personalizzati o di terze parti.

Per l'analisi nativa delle immagini, usa il tool `image` con `agents.defaults.imageModel`.
Per la generazione/modifica nativa delle immagini, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Se scegli `openai/*`, `google/*`,
`fal/*` o un altro modello immagine specifico del provider, aggiungi anche auth/API
key di quel provider.

Le chiavi di configurazione corrispondono per impostazione predefinita al **nome della skill**.
Se una skill definisce `metadata.openclaw.skillKey`, usa quella chiave sotto `skills.entries`.

Regole:

- `enabled: false` disabilita la skill anche se è inclusa/installata.
- `env`: iniettato **solo se** la variabile non è già impostata nel processo.
- `apiKey`: convenience per le skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta stringa plaintext o oggetto SecretRef (`{ source, provider, id }`).
- `config`: bag facoltativa per campi personalizzati per skill; le chiavi personalizzate devono stare qui.
- `allowBundled`: allowlist facoltativa solo per le **Skills incluse**. Se impostata, solo
  le Skills incluse nell'elenco sono idonee (Skills gestite/workspace non interessate).

## Iniezione dell'ambiente (per esecuzione agente)

Quando inizia un'esecuzione agente, OpenClaw:

1. Legge i metadati della skill.
2. Applica eventuali `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Costruisce il prompt di sistema con le Skills **idonee**.
4. Ripristina l'ambiente originale al termine dell'esecuzione.

Questo ha **scope limitato all'esecuzione dell'agente**, non a un ambiente shell globale.

Per il backend incluso `claude-cli`, OpenClaw materializza anche lo stesso
snapshot idoneo come plugin temporaneo Claude Code e lo passa con
`--plugin-dir`. Claude Code può quindi usare il proprio risolutore nativo di skill mentre
OpenClaw continua a possedere precedenza, allowlist per agente, gating e
iniezione env/API key di `skills.entries.*`. Gli altri backend CLI usano solo il catalogo nel prompt.

## Snapshot di sessione (prestazioni)

OpenClaw crea uno snapshot delle Skills idonee **quando una sessione inizia** e riusa quell'elenco per i turni successivi nella stessa sessione. Le modifiche a Skills o configurazione entrano in vigore alla successiva nuova sessione.

Le Skills possono anche aggiornarsi a metà sessione quando il watcher delle skill è abilitato o quando compare un nuovo Node remoto idoneo (vedi sotto). Consideralo come un **hot reload**: l'elenco aggiornato viene recepito al turno successivo dell'agente.

Se l'allowlist effettiva delle skill dell'agente cambia per quella sessione, OpenClaw
aggiorna lo snapshot così che le skill visibili restino allineate con l'agente
corrente.

## Node macOS remoti (Gateway Linux)

Se il Gateway è in esecuzione su Linux ma è connesso un **Node macOS** **con `system.run` consentito** (sicurezza Exec approvals non impostata su `deny`), OpenClaw può trattare come idonee le skill solo macOS quando i binari richiesti sono presenti su quel Node. L'agente dovrebbe eseguire quelle skill tramite il tool `exec` con `host=node`.

Questo si basa sul fatto che il Node riporti il supporto ai comandi e su una probe dei binari tramite `system.run`. Se il Node macOS va offline in seguito, le skill restano visibili; le invocazioni potrebbero fallire finché il Node non si riconnette.

## Watcher delle Skills (auto-refresh)

Per impostazione predefinita, OpenClaw osserva le cartelle skill e incrementa lo snapshot delle Skills quando i file `SKILL.md` cambiano. Configuralo sotto `skills.load`:

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

Quando le Skills sono idonee, OpenClaw inietta un elenco XML compatto delle skill disponibili nel prompt di sistema (tramite `formatSkillsForPrompt` in `pi-coding-agent`). Il costo è deterministico:

- **Overhead base (solo quando ≥1 skill):** 195 caratteri.
- **Per skill:** 97 caratteri + la lunghezza dei valori `<name>`, `<description>` e `<location>` con escape XML.

Formula (caratteri):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Note:

- L'escape XML espande `& < > " '` in entità (`&amp;`, `&lt;`, ecc.), aumentando la lunghezza.
- Il conteggio dei token varia in base al tokenizer del modello. Una stima approssimativa in stile OpenAI è ~4 caratteri/token, quindi **97 caratteri ≈ 24 token** per skill più le lunghezze effettive dei campi.

## Ciclo di vita delle Skills gestite

OpenClaw distribuisce un set base di Skills come **Skills incluse** come parte dell'installazione
(pacchetto npm o OpenClaw.app). `~/.openclaw/skills` esiste per override locali
(per esempio, fissare/applicare patch a una skill senza modificare la copia
inclusa). Le Skills del workspace sono possedute dall'utente e sovrascrivono entrambe in caso di conflitti di nome.

## Riferimento configurazione

Vedi [Configurazione Skills](/it/tools/skills-config) per lo schema completo della configurazione.

## Cerchi altre Skills?

Sfoglia [https://clawhub.ai](https://clawhub.ai).

---

## Correlati

- [Creare Skills](/it/tools/creating-skills) — creazione di skill personalizzate
- [Configurazione Skills](/it/tools/skills-config) — riferimento della configurazione delle skill
- [Comandi slash](/it/tools/slash-commands) — tutti i comandi slash disponibili
- [Plugins](/it/tools/plugin) — panoramica del sistema di plugin
