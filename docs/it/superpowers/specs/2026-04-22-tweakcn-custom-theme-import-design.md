---
x-i18n:
    generated_at: "2026-04-25T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Design di importazione del tema personalizzato Tweakcn

Stato: approvato nel terminale il 2026-04-22

## Riepilogo

Aggiungere esattamente uno slot di tema personalizzato locale al browser per la Control UI che possa essere importato da un link di condivisione tweakcn. Le famiglie di temi integrate esistenti restano `claw`, `knot` e `dash`. La nuova famiglia `custom` si comporta come una normale famiglia di temi OpenClaw e supporta la modalità `light`, `dark` e `system` quando il payload tweakcn importato include sia il set di token light sia quello dark.

Il tema importato viene memorizzato solo nel profilo del browser corrente insieme al resto delle impostazioni della Control UI. Non viene scritto nella configurazione del Gateway e non viene sincronizzato tra dispositivi o browser.

## Problema

Il sistema di temi della Control UI è attualmente chiuso su tre famiglie di temi codificate in modo statico:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Gli utenti possono passare tra famiglie integrate e varianti di modalità, ma non possono importare un tema da tweakcn senza modificare il CSS del repository. Il risultato richiesto è più limitato di un sistema di theming generale: mantenere i tre temi integrati e aggiungere uno slot importato controllato dall'utente che possa essere sostituito tramite un link tweakcn.

## Obiettivi

- Mantenere invariate le famiglie di temi integrate esistenti.
- Aggiungere esattamente uno slot personalizzato importato, non una libreria di temi.
- Accettare un link di condivisione tweakcn o un URL diretto `https://tweakcn.com/r/themes/{id}`.
- Rendere persistente il tema importato solo nel local storage del browser.
- Fare in modo che lo slot importato funzioni con i controlli di modalità `light`, `dark` e `system` esistenti.
- Mantenere sicuro il comportamento in caso di errore: un'importazione non valida non deve mai rompere il tema UI attivo.

## Non obiettivi

- Nessuna libreria multi-tema o elenco locale al browser di importazioni.
- Nessuna persistenza lato Gateway o sincronizzazione tra dispositivi.
- Nessun editor CSS arbitrario o editor JSON grezzo del tema.
- Nessun caricamento automatico di asset font remoti da tweakcn.
- Nessun tentativo di supportare payload tweakcn che espongono una sola modalità.
- Nessun refactor del theming esteso all'intero repository oltre ai punti di integrazione richiesti per la Control UI.

## Decisioni utente già prese

- Mantenere i tre temi integrati.
- Aggiungere uno slot di importazione basato su tweakcn.
- Memorizzare il tema importato nel browser, non nella configurazione del Gateway.
- Supportare `light`, `dark` e `system` per il tema importato.
- Sovrascrivere lo slot personalizzato con l'importazione successiva è il comportamento previsto.

## Approccio consigliato

Aggiungere un quarto id di famiglia tema, `custom`, al modello dei temi della Control UI. La famiglia `custom` diventa selezionabile solo quando è presente un'importazione tweakcn valida. Il payload importato viene normalizzato in un record di tema personalizzato specifico di OpenClaw e memorizzato nel local storage del browser insieme al resto delle impostazioni UI.

In fase di esecuzione, OpenClaw renderizza un tag `<style>` gestito che definisce i blocchi di variabili CSS personalizzate risolti:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Questo mantiene le variabili del tema personalizzato circoscritte alla famiglia `custom` ed evita che variabili CSS inline si propaghino nelle famiglie integrate.

## Architettura

### Modello del tema

Aggiornare `ui/src/ui/theme.ts`:

- Estendere `ThemeName` per includere `custom`.
- Estendere `ResolvedTheme` per includere `custom` e `custom-light`.
- Estendere `VALID_THEME_NAMES`.
- Aggiornare `resolveTheme()` in modo che `custom` rispecchi il comportamento esistente della famiglia:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` o `custom-light` in base alla preferenza del sistema operativo

Non vengono aggiunti alias legacy per `custom`.

### Modello di persistenza

Estendere la persistenza di `UiSettings` in `ui/src/ui/storage.ts` con un payload opzionale per il tema personalizzato:

- `customTheme?: ImportedCustomTheme`

Forma memorizzata consigliata:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Note:

- `sourceUrl` memorizza l'input utente originale dopo la normalizzazione.
- `themeId` è l'id del tema tweakcn estratto dall'URL.
- `label` è il campo tweakcn `name` quando presente, altrimenti `Custom`.
- `light` e `dark` sono già mappe di token OpenClaw normalizzate, non payload tweakcn grezzi.
- Il payload importato vive accanto alle altre impostazioni locali del browser ed è serializzato nello stesso documento di local storage.
- Se i dati del tema personalizzato memorizzati sono mancanti o non validi al caricamento, ignorare il payload e tornare a `theme: "claw"` quando la famiglia persistita era `custom`.

### Applicazione in fase di esecuzione

Aggiungere un gestore di stylesheet del tema personalizzato ristretto nel runtime della Control UI, gestito vicino a `ui/src/ui/app-settings.ts` e `ui/src/ui/theme.ts`.

Responsabilità:

- Creare o aggiornare un singolo tag stabile `<style id="openclaw-custom-theme">` in `document.head`.
- Emettere CSS solo quando esiste un payload di tema personalizzato valido.
- Rimuovere il contenuto del tag style quando il payload viene cancellato.
- Mantenere il CSS delle famiglie integrate in `ui/src/styles/base.css`; non inserire i token importati nello stylesheet versionato.

Questo gestore viene eseguito ogni volta che le impostazioni vengono caricate, salvate, importate o cancellate.

### Selettori della modalità light

L'implementazione dovrebbe preferire `data-theme-mode="light"` per lo stile light cross-family invece di gestire casi speciali per `custom-light`. Se un selettore esistente è vincolato a `data-theme="light"` e deve applicarsi a ogni famiglia light, ampliarlo come parte di questo lavoro.

## UX di importazione

Aggiornare `ui/src/ui/views/config.ts` nella sezione `Appearance`:

- Aggiungere una scheda tema `Custom` accanto a `Claw`, `Knot` e `Dash`.
- Mostrare la scheda come disabilitata quando non esiste alcun tema personalizzato importato.
- Aggiungere un pannello di importazione sotto la griglia dei temi con:
  - un input di testo per un link di condivisione tweakcn o un URL `/r/themes/{id}`
  - un pulsante `Import`
  - un percorso `Replace` quando esiste già un payload personalizzato
  - un'azione `Clear` quando esiste già un payload personalizzato
- Mostrare l'etichetta del tema importato e l'host di origine quando esiste un payload.
- Se il tema attivo è `custom`, l'importazione di una sostituzione si applica immediatamente.
- Se il tema attivo non è `custom`, l'importazione memorizza solo il nuovo payload finché l'utente non seleziona la scheda `Custom`.

Anche il selettore rapido del tema in `ui/src/ui/views/config-quick.ts` dovrebbe mostrare `Custom` solo quando esiste un payload.

## Parsing dell'URL e fetch remoto

Il percorso di importazione nel browser accetta:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

L'implementazione dovrebbe normalizzare entrambe le forme in:

- `https://tweakcn.com/r/themes/{id}`

Il browser esegue quindi il fetch direttamente dell'endpoint normalizzato `/r/themes/{id}`.

Usare un validatore di schema ristretto per il payload esterno. È preferibile uno schema zod perché si tratta di un confine esterno non affidabile.

Campi remoti richiesti:

- `name` di primo livello come stringa facoltativa
- `cssVars.theme` come oggetto facoltativo
- `cssVars.light` come oggetto
- `cssVars.dark` come oggetto

Se manca `cssVars.light` o `cssVars.dark`, rifiutare l'importazione. È intenzionale: il comportamento di prodotto approvato prevede il supporto completo delle modalità, non una sintesi best-effort della parte mancante.

## Mappatura dei token

Non rispecchiare ciecamente le variabili tweakcn. Normalizzare un sottoinsieme limitato nei token OpenClaw e derivare il resto in un helper.

### Token importati direttamente

Da ciascun blocco di modalità tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Da `cssVars.theme` condiviso quando presente:

- `font-sans`
- `font-mono`

Se un blocco di modalità sovrascrive `font-sans`, `font-mono` o `radius`, il valore locale della modalità ha la precedenza.

### Token derivati per OpenClaw

L'importatore deriva le variabili specifiche di OpenClaw dai colori base importati:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Le regole di derivazione vivono in un helper puro in modo da poter essere testate in modo indipendente. Le formule esatte di color mixing sono un dettaglio implementativo, ma l'helper deve soddisfare due vincoli:

- preservare un contrasto leggibile vicino all'intento del tema importato
- produrre un output stabile per lo stesso payload importato

### Token ignorati nella v1

Questi token tweakcn vengono intenzionalmente ignorati nella prima versione:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Questo mantiene l'ambito concentrato sui token di cui la Control UI attuale ha realmente bisogno.

### Font

Le stringhe degli stack di font vengono importate se presenti, ma OpenClaw non carica asset font remoti nella v1. Se lo stack importato fa riferimento a font non disponibili nel browser, si applica il normale comportamento di fallback.

## Comportamento in caso di errore

Le importazioni non valide devono fallire in modalità chiusa.

- Formato URL non valido: mostrare un errore di validazione inline, non eseguire il fetch.
- Host o forma del percorso non supportati: mostrare un errore di validazione inline, non eseguire il fetch.
- Errore di rete, risposta non OK o JSON malformato: mostrare un errore inline, mantenere invariato il payload memorizzato corrente.
- Errore di schema o blocchi light/dark mancanti: mostrare un errore inline, mantenere invariato il payload memorizzato corrente.
- Azione di cancellazione:
  - rimuove il payload personalizzato memorizzato
  - rimuove il contenuto del tag style personalizzato gestito
  - se `custom` è attivo, riporta la famiglia tema a `claw`
- Payload del tema personalizzato memorizzato non valido al primo caricamento:
  - ignorare il payload memorizzato
  - non emettere CSS personalizzato
  - se la famiglia tema persistita era `custom`, tornare a `claw`

In nessun momento un'importazione fallita deve lasciare il documento attivo con variabili CSS personalizzate parziali applicate.

## File che si prevede cambieranno nell'implementazione

File principali:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Nuovi helper probabili:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Test:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nuovi test mirati per parsing URL e normalizzazione del payload

## Testing

Copertura minima dell'implementazione:

- analizzare un URL share-link per ricavarne l'id del tema tweakcn
- normalizzare `/themes/{id}` e `/r/themes/{id}` nell'URL di fetch
- rifiutare host non supportati e id malformati
- validare la forma del payload tweakcn
- mappare un payload tweakcn valido in mappe di token OpenClaw light e dark normalizzate
- caricare e salvare il payload personalizzato nelle impostazioni locali del browser
- risolvere `custom` per `light`, `dark` e `system`
- disabilitare la selezione `Custom` quando non esiste alcun payload
- applicare immediatamente il tema importato quando `custom` è già attivo
- tornare a `claw` quando il tema personalizzato attivo viene cancellato

Obiettivo di verifica manuale:

- importare un tema tweakcn noto da Settings
- passare tra `light`, `dark` e `system`
- passare tra `custom` e le famiglie integrate
- ricaricare la pagina e confermare che il tema personalizzato importato persista localmente

## Note di rollout

Questa funzionalità è intenzionalmente piccola. Se in seguito gli utenti richiedono più temi importati, rinomina, esportazione o sincronizzazione tra dispositivi, trattarlo come un design successivo. Non pre-costruire un'astrazione di libreria di temi in questa implementazione.
