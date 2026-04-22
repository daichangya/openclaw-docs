---
read_when:
    - Introduzione a ClawHub per i nuovi utenti
    - Installare, cercare o pubblicare Skills o Plugin
    - Spiegare i flag della CLI di ClawHub e il comportamento di sincronizzazione
summary: 'Guida di ClawHub: registro pubblico, flussi di installazione nativi di OpenClaw e flussi di lavoro della CLI di ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub è il registro pubblico per **Skills e Plugin OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare/installare/aggiornare Skills e installare
  Plugin da ClawHub.
- Usa la CLI separata `clawhub` quando ti servono autenticazione al registro, pubblicazione, eliminazione,
  ripristino o flussi di sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Flussi nativi OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Le specifiche di Plugin bare npm-safe vengono provate anche su ClawHub prima di npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

I comandi nativi `openclaw` installano nel tuo workspace attivo e persistono i
metadati della sorgente così le successive chiamate `update` possono restare su ClawHub.

Le installazioni dei Plugin validano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima che venga eseguita l'installazione dell'archivio, così gli host incompatibili falliscono in modo fail-closed
in anticipo invece di installare parzialmente il pacchetto.

`openclaw plugins install clawhub:...` accetta solo famiglie di Plugin installabili.
Se un pacchetto ClawHub è in realtà una Skill, OpenClaw si ferma e ti indirizza invece a
`openclaw skills install <slug>`.

## Cos'è ClawHub

- Un registro pubblico per Skills e Plugin OpenClaw.
- Un archivio versionato di bundle di Skills e metadati.
- Una superficie di discovery per ricerca, tag e segnali di utilizzo.

## Come funziona

1. Un utente pubblica un bundle di Skill (file + metadati).
2. ClawHub archivia il bundle, analizza i metadati e assegna una versione.
3. Il registro indicizza la Skill per ricerca e discovery.
4. Gli utenti sfogliano, scaricano e installano Skills in OpenClaw.

## Cosa puoi fare

- Pubblicare nuove Skills e nuove versioni di Skills esistenti.
- Scoprire Skills per nome, tag o ricerca.
- Scaricare bundle di Skill e ispezionarne i file.
- Segnalare Skills abusive o non sicure.
- Se sei un moderatore, nascondere, mostrare, eliminare o bannare.

## Per chi è pensato (facile per principianti)

Se vuoi aggiungere nuove capacità al tuo agent OpenClaw, ClawHub è il modo più semplice per trovare e installare Skills. Non hai bisogno di sapere come funziona il backend. Puoi:

- Cercare Skills in linguaggio naturale.
- Installare una Skill nel tuo workspace.
- Aggiornare le Skills in seguito con un solo comando.
- Eseguire il backup delle tue Skills pubblicandole.

## Avvio rapido (non tecnico)

1. Cerca qualcosa di cui hai bisogno:
   - `openclaw skills search "calendar"`
2. Installa una Skill:
   - `openclaw skills install <skill-slug>`
3. Avvia una nuova sessione OpenClaw così rileva la nuova Skill.
4. Se vuoi pubblicare o gestire l'autenticazione al registro, installa anche la CLI
   separata `clawhub`.

## Installa la CLI ClawHub

Ti serve solo per i flussi autenticati al registro come publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Come si integra in OpenClaw

Il comando nativo `openclaw skills install` installa nella directory `skills/` del workspace attivo. `openclaw plugins install clawhub:...` registra una normale
installazione gestita del Plugin più i metadati sorgente di ClawHub per gli aggiornamenti.

Le installazioni anonime di Plugin da ClawHub falliscono anch'esse in modo fail-closed per i pacchetti privati.
Canali community o altri canali non ufficiali possono comunque installare, ma OpenClaw avvisa
così gli operatori possono verificare sorgente e validazione prima di abilitarli.

La CLI separata `clawhub` installa anche le Skills in `./skills` sotto la tua
directory di lavoro corrente. Se è configurato un workspace OpenClaw, `clawhub`
fa fallback a quel workspace a meno che tu non sovrascriva `--workdir` (o
`CLAWHUB_WORKDIR`). OpenClaw carica le Skills del workspace da `<workspace>/skills`
e le rileverà nella **prossima** sessione. Se usi già
`~/.openclaw/skills` o Skills incluse, le Skills del workspace hanno precedenza.

Per maggiori dettagli su come le Skills vengono caricate, condivise e sottoposte a gating, vedi
[Skills](/it/tools/skills).

## Panoramica del sistema Skills

Una Skill è un bundle versionato di file che insegna a OpenClaw come eseguire un
task specifico. Ogni pubblicazione crea una nuova versione e il registro mantiene una
cronologia delle versioni così gli utenti possono verificare le modifiche.

Una Skill tipica include:

- Un file `SKILL.md` con la descrizione principale e l'uso.
- Configurazioni, script o file di supporto facoltativi usati dalla Skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per abilitare la discovery e mostrare in sicurezza le capacità delle Skills.
Il registro tiene anche traccia dei segnali di utilizzo (come stelle e download) per migliorare
ranking e visibilità.

## Cosa offre il servizio (funzionalità)

- **Navigazione pubblica** delle Skills e del loro contenuto `SKILL.md`.
- **Ricerca** basata su embeddings (ricerca vettoriale), non solo su parole chiave.
- **Versionamento** con semver, changelog e tag (incluso `latest`).
- **Download** come zip per versione.
- **Stelle e commenti** per feedback della community.
- Hook di **moderazione** per approvazioni e audit.
- **API adatta alla CLI** per automazione e scripting.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita. Chiunque può caricare Skills, ma per pubblicare un account GitHub deve
avere almeno una settimana. Questo aiuta a rallentare gli abusi senza bloccare
i contributori legittimi.

Segnalazione e moderazione:

- Qualsiasi utente autenticato può segnalare una Skill.
- I motivi della segnalazione sono obbligatori e vengono registrati.
- Ogni utente può avere fino a 20 segnalazioni attive contemporaneamente.
- Le Skills con più di 3 segnalazioni uniche vengono nascoste automaticamente per impostazione predefinita.
- I moderatori possono vedere le Skills nascoste, mostrarle di nuovo, eliminarle o bannare gli utenti.
- L'abuso della funzione di segnalazione può comportare il ban dell'account.

Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un
moderatore o manutentore.

## Comandi e parametri CLI

Opzioni globali (si applicano a tutti i comandi):

- `--workdir <dir>`: Directory di lavoro (predefinita: dir corrente; fa fallback al workspace OpenClaw).
- `--dir <dir>`: Directory delle Skills, relativa a workdir (predefinita: `skills`).
- `--site <url>`: URL base del sito (login da browser).
- `--registry <url>`: URL base dell'API del registro.
- `--no-input`: Disabilita i prompt (non interattivo).
- `-V, --cli-version`: Stampa la versione della CLI.

Autenticazione:

- `clawhub login` (flusso browser) oppure `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opzioni:

- `--token <token>`: Incolla un token API.
- `--label <label>`: Etichetta salvata per i token di login via browser (predefinita: `CLI token`).
- `--no-browser`: Non aprire un browser (richiede `--token`).

Ricerca:

- `clawhub search "query"`
- `--limit <n>`: Numero massimo di risultati.

Installazione:

- `clawhub install <slug>`
- `--version <version>`: Installa una versione specifica.
- `--force`: Sovrascrive se la cartella esiste già.

Aggiornamento:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Aggiorna a una versione specifica (solo slug singolo).
- `--force`: Sovrascrive quando i file locali non corrispondono ad alcuna versione pubblicata.

Elenco:

- `clawhub list` (legge `.clawhub/lock.json`)

Pubblicare Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug della Skill.
- `--name <name>`: Nome visualizzato.
- `--version <version>`: Versione semver.
- `--changelog <text>`: Testo del changelog (può essere vuoto).
- `--tags <tags>`: Tag separati da virgole (predefinito: `latest`).

Pubblicare Plugin:

- `clawhub package publish <source>`
- `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref` o un URL GitHub.
- `--dry-run`: Costruisce il piano esatto di pubblicazione senza caricare nulla.
- `--json`: Emette output leggibile dalla macchina per CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Override facoltativi quando il rilevamento automatico non basta.

Eliminazione/ripristino (solo owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizzazione (scansione delle Skills locali + pubblicazione di nuove/aggiornate):

- `clawhub sync`
- `--root <dir...>`: Root aggiuntive da analizzare.
- `--all`: Carica tutto senza prompt.
- `--dry-run`: Mostra cosa verrebbe caricato.
- `--bump <type>`: `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
- `--changelog <text>`: Changelog per aggiornamenti non interattivi.
- `--tags <tags>`: Tag separati da virgole (predefinito: `latest`).
- `--concurrency <n>`: Controlli del registro (predefinito: 4).

## Flussi di lavoro comuni per agent

### Cercare Skills

```bash
clawhub search "postgres backups"
```

### Scaricare nuove Skills

```bash
clawhub install my-skill-pack
```

### Aggiornare le Skills installate

```bash
clawhub update --all
```

### Eseguire il backup delle tue Skills (pubblicare o sincronizzare)

Per una singola cartella Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Per analizzare ed eseguire il backup di molte Skills in una volta:

```bash
clawhub sync --all
```

### Pubblicare un Plugin da GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

I Plugin di codice devono includere i metadati OpenClaw richiesti in `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

I pacchetti pubblicati dovrebbero distribuire JavaScript buildato e puntare `runtimeExtensions`
a quell'output. Le installazioni da checkout Git possono comunque fare fallback al sorgente TypeScript
quando non esistono file buildati, ma gli entry runtime buildati evitano la compilazione
runtime di TypeScript nei percorsi di avvio, doctor e caricamento dei Plugin.

## Dettagli avanzati (tecnici)

### Versionamento e tag

- Ogni pubblicazione crea una nuova **semver** `SkillVersion`.
- I tag (come `latest`) puntano a una versione; spostare i tag consente il rollback.
- I changelog sono associati per versione e possono essere vuoti durante sync o pubblicazione di aggiornamenti.

### Modifiche locali rispetto alle versioni del registro

Gli aggiornamenti confrontano i contenuti locali della Skill con le versioni del registro usando un hash del contenuto. Se i file locali non corrispondono ad alcuna versione pubblicata, la CLI chiede prima di sovrascrivere (oppure richiede `--force` nelle esecuzioni non interattive).

### Analisi sync e root di fallback

`clawhub sync` analizza prima la tua workdir corrente. Se non trova Skills, fa fallback a posizioni legacy note (ad esempio `~/openclaw/skills` e `~/.openclaw/skills`). Questo è pensato per trovare installazioni più vecchie di Skills senza flag aggiuntivi.

### Archiviazione e lockfile

- Le Skills installate vengono registrate in `.clawhub/lock.json` sotto la tua workdir.
- I token di autenticazione vengono salvati nel file di configurazione della CLI ClawHub (override tramite `CLAWHUB_CONFIG_PATH`).

### Telemetria (conteggi di installazione)

Quando esegui `clawhub sync` mentre sei autenticato, la CLI invia uno snapshot minimo per calcolare i conteggi di installazione. Puoi disabilitare completamente questa funzione:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variabili d'ambiente

- `CLAWHUB_SITE`: Sovrascrive l'URL del sito.
- `CLAWHUB_REGISTRY`: Sovrascrive l'URL dell'API del registro.
- `CLAWHUB_CONFIG_PATH`: Sovrascrive dove la CLI salva token/configurazione.
- `CLAWHUB_WORKDIR`: Sovrascrive la workdir predefinita.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Disabilita la telemetria su `sync`.
