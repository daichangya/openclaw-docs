---
read_when:
    - Vuoi aggiornare un checkout della sorgente in modo sicuro
    - Devi capire il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento della sorgente abbastanza sicuro + riavvio automatico del gateway)
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-26T11:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore di pacchetti in [Aggiornamento](/it/install/updating).

## Utilizzo

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opzioni

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia esito positivo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive il target del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (canale/tag/target/flusso di riavvio) senza scrivere la configurazione, installare, sincronizzare i Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, inclusi
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una deriva di
  integrità degli artifact dei plugin npm durante la sincronizzazione post-aggiornamento dei Plugin.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800 s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade)

Nota: i downgrade richiedono conferma perché le versioni meno recenti possono rompere la configurazione.

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout della sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile da macchina.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3 s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git,
offre di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio dell'aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene anche
allineato il metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando `beta` è
  assente o più vecchio della release stable corrente.

L'auto-updater del core Gateway (quando abilitato tramite configurazione) riutilizza questo stesso percorso di aggiornamento.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la
versione target del pacchetto prima di invocare il gestore di pacchetti. Anche quando la versione installata
corrisponde già al target, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei Plugin, l'aggiornamento del completamento e il lavoro di riavvio. Questo mantiene allineati
i sidecar pacchettizzati e i record dei Plugin posseduti dal canale con la build OpenClaw
installata.

## Flusso del checkout git

Canali:

- `stable`: esegue il checkout dell'ultimo tag non beta, poi build + doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable
  quando `beta` è assente o più vecchio.
- `dev`: esegue il checkout di `main`, poi fetch + rebase.

Panoramica di alto livello:

1. Richiede un worktree pulito (nessuna modifica non sottoposta a commit).
2. Passa al canale selezionato (tag o branch).
3. Esegue fetch dell'upstream (solo dev).
4. Solo dev: preflight lint + build TypeScript in un worktree temporaneo; se il tip fallisce, torna indietro fino a 10 commit per trovare la build pulita più recente.
5. Esegue il rebase sul commit selezionato (solo dev).
6. Installa le dipendenze con il gestore di pacchetti del repo. Per i checkout pnpm, l'updater esegue il bootstrap di `pnpm` on demand (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
7. Esegue la build + la build della Control UI.
8. Esegue `openclaw doctor` come controllo finale di “aggiornamento sicuro”.
9. Sincronizza i Plugin con il canale attivo (dev usa Plugin inclusi; stable/beta usa npm) e aggiorna i plugin installati tramite npm.

Se un aggiornamento esatto di un plugin npm fissato risolve a un artifact la cui integrità
differisce dal record di installazione memorizzato, `openclaw update` interrompe
quell'aggiornamento dell'artifact del plugin invece di installarlo. Reinstalla o aggiorna il Plugin
esplicitamente solo dopo aver verificato di fidarti del nuovo artifact.

I fallimenti della sincronizzazione post-aggiornamento dei Plugin fanno fallire il risultato dell'aggiornamento e arrestano il lavoro di riavvio successivo. Correggi l'errore di installazione/aggiornamento del plugin, poi riesegui
`openclaw update`.

Se il bootstrap di pnpm continua a fallire, l'updater ora si ferma subito con un errore specifico del gestore di pacchetti invece di tentare `npm run build` nel checkout.

## Forma abbreviata `--update`

`openclaw --update` viene riscritto come `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (offre di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
