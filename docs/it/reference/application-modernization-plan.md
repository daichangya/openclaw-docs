---
read_when:
    - Pianificazione di un'ampia modernizzazione dell'applicazione OpenClaw
    - Aggiornamento degli standard di implementazione frontend per il lavoro sull'app o sulla Control UI
    - Trasformazione di un'ampia revisione della qualità del prodotto in lavoro ingegneristico per fasi
summary: Piano completo di modernizzazione dell'applicazione con aggiornamenti delle competenze di delivery frontend
title: Piano di modernizzazione dell'applicazione
x-i18n:
    generated_at: "2026-04-25T13:56:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Piano di modernizzazione dell'applicazione

## Obiettivo

Portare l'applicazione verso un prodotto più pulito, veloce e manutenibile senza
rompere i flussi di lavoro attuali o nascondere il rischio in refactor ampi. Il
lavoro dovrebbe arrivare come piccole porzioni revisionabili, con prove per ogni
superficie toccata.

## Principi

- Preservare l'architettura attuale a meno che un confine non stia causando in modo dimostrabile churn, costo prestazionale o bug visibili agli utenti.
- Preferire la patch corretta più piccola per ogni problema, poi ripetere.
- Separare le correzioni necessarie dal polish opzionale in modo che i maintainer possano integrare lavoro ad alto valore senza aspettare decisioni soggettive.
- Mantenere documentato e retrocompatibile il comportamento rivolto ai Plugin.
- Verificare comportamento rilasciato, contratti delle dipendenze e test prima di dichiarare corretta una regressione.
- Migliorare prima il percorso utente principale: onboarding, autenticazione, chat, configurazione dei provider, gestione dei Plugin e diagnostica.

## Fase 1: Audit di base

Inventaria l'applicazione attuale prima di modificarla.

- Identifica i principali workflow utente e le superfici di codice che li possiedono.
- Elenca affordance morte, impostazioni duplicate, stati di errore poco chiari e percorsi di rendering costosi.
- Raccogli gli attuali comandi di validazione per ogni superficie.
- Contrassegna i problemi come necessari, consigliati o opzionali.
- Documenta i blocchi noti che richiedono revisione del proprietario, in particolare cambi di API, sicurezza, rilascio e contratto dei Plugin.

Definizione di completato:

- Un unico elenco di issue con riferimenti ai file relativi alla root del repo.
- Ogni issue ha gravità, superficie proprietaria, impatto utente atteso e un percorso di validazione proposto.
- Nessuna voce di cleanup speculativo è mescolata alle correzioni necessarie.

## Fase 2: Pulizia di prodotto e UX

Dai priorità ai workflow visibili e rimuovi la confusione.

- Rafforza il testo di onboarding e gli stati vuoti intorno ad auth del modello, stato del gateway e configurazione del Plugin.
- Rimuovi o disabilita le affordance morte dove nessuna azione è possibile.
- Mantieni visibili le azioni importanti su larghezze responsive invece di nasconderle dietro assunzioni fragili di layout.
- Consolida il linguaggio di stato ripetuto così gli errori hanno un'unica fonte di verità.
- Aggiungi progressive disclosure per le impostazioni avanzate mantenendo rapida la configurazione di base.

Validazione consigliata:

- Percorso manuale felice per la configurazione al primo avvio e per l'avvio di utenti esistenti.
- Test mirati per qualsiasi logica di routing, persistenza della configurazione o derivazione dello stato.
- Screenshot del browser per le superfici responsive modificate.

## Fase 3: Rafforzamento dell'architettura frontend

Migliora la manutenibilità senza una riscrittura ampia.

- Sposta le trasformazioni ripetute dello stato UI in helper tipizzati e ristretti.
- Mantieni separate le responsabilità di recupero dati, persistenza e presentazione.
- Preferisci hook, store e pattern di componenti esistenti invece di nuove astrazioni.
- Dividi i componenti troppo grandi solo quando riduce l'accoppiamento o chiarisce i test.
- Evita di introdurre stato globale ampio per interazioni locali di pannello.

Guardrail richiesti:

- Non cambiare il comportamento pubblico come effetto collaterale dello splitting dei file.
- Mantieni intatto il comportamento di accessibilità per menu, finestre di dialogo, tab e navigazione da tastiera.
- Verifica che gli stati loading, empty, error e optimistic continuino a essere renderizzati.

## Fase 4: Prestazioni e affidabilità

Punta al dolore misurato invece che a un'ottimizzazione teorica ampia.

- Misura costi di avvio, transizione di route, liste grandi e trascrizioni chat.
- Sostituisci dati derivati costosi e ripetuti con selector memoizzati o helper in cache dove il profiling dimostra valore.
- Riduci scansioni evitabili di rete o filesystem sui percorsi caldi.
- Mantieni ordinamento deterministico per prompt, registry, file, Plugin e input di rete prima della costruzione del payload per il modello.
- Aggiungi test di regressione leggeri per helper caldi e confini di contratto.

Definizione di completato:

- Ogni cambiamento prestazionale registra baseline, impatto atteso, impatto reale e gap rimanente.
- Nessuna patch di performance arriva basandosi solo sull'intuizione quando è disponibile una misurazione economica.

## Fase 5: Rafforzamento di tipi, contratti e test

Aumenta la correttezza nei punti di confine da cui dipendono utenti e autori di Plugin.

- Sostituisci stringhe runtime lasche con unioni discriminate o elenchi chiusi di codici.
- Valida gli input esterni con helper di schema esistenti o zod.
- Aggiungi test di contratto attorno a manifest dei Plugin, cataloghi provider, messaggi del protocollo gateway e comportamento della migrazione della configurazione.
- Mantieni i percorsi di compatibilità in flussi doctor o di riparazione invece che in migrazioni nascoste al momento dell'avvio.
- Evita accoppiamenti nei test con gli interni dei Plugin; usa facade SDK e barrel documentati.

Validazione consigliata:

- `pnpm check:changed`
- Test mirati per ogni confine modificato.
- `pnpm build` quando cambiano lazy boundary, packaging o superfici pubblicate.

## Fase 6: Documentazione e prontezza al rilascio

Mantieni allineata la documentazione rivolta all'utente al comportamento.

- Aggiorna la documentazione con modifiche di comportamento, API, configurazione, onboarding o Plugin.
- Aggiungi voci di changelog solo per modifiche visibili agli utenti.
- Mantieni la terminologia Plugin rivolta all'utente; usa i nomi interni dei pacchetti solo dove necessario per i contributor.
- Conferma che istruzioni di rilascio e installazione corrispondano ancora alla superficie di comandi attuale.

Definizione di completato:

- La documentazione rilevante è aggiornata nello stesso branch delle modifiche di comportamento.
- I controlli di drift della documentazione o delle API generate passano quando sono stati toccati.
- Il handoff nomina qualsiasi validazione saltata e il motivo per cui è stata saltata.

## Prima porzione consigliata

Inizia con un passaggio mirato su Control UI e onboarding:

- Esegui l'audit di first-run setup, readiness dell'auth del provider, stato del gateway e superfici di configurazione del Plugin.
- Rimuovi azioni morte e chiarisci gli stati di errore.
- Aggiungi o aggiorna test mirati per derivazione dello stato e persistenza della configurazione.
- Esegui `pnpm check:changed`.

Questo offre alto valore per l'utente con rischio architetturale limitato.

## Aggiornamento della skill frontend

Usa questa sezione per aggiornare il file `SKILL.md` focalizzato sul frontend fornito con il task di modernizzazione. Se adotti questa guida come skill OpenClaw locale al repo, crea prima `.agents/skills/openclaw-frontend/SKILL.md`, mantieni il frontmatter che appartiene a quella skill di destinazione, poi aggiungi o sostituisci la guida nel body con il seguente contenuto.

```markdown
# Standard di delivery frontend

Usa questa skill quando implementi o rivedi lavoro UI rivolto all'utente in React, Next.js, webview desktop o app.

## Regole operative

- Parti dal workflow di prodotto esistente e dalle convenzioni di codice.
- Preferisci la patch corretta più piccola che migliori il percorso utente attuale.
- Separa nel handoff le correzioni necessarie dal polish opzionale.
- Non costruire pagine marketing quando la richiesta riguarda una superficie applicativa.
- Mantieni le azioni visibili e usabili su tutte le dimensioni di viewport supportate.
- Rimuovi le affordance morte invece di lasciare controlli che non possono agire.
- Preserva gli stati loading, empty, error, success e permission.
- Usa componenti, hook, store e icone del design system esistenti prima di aggiungere nuove primitive.

## Checklist di implementazione

1. Identifica il task utente primario e il componente o la route che lo possiede.
2. Leggi i pattern locali dei componenti prima di modificare.
3. Applica la patch alla superficie più ristretta che risolve il problema.
4. Aggiungi vincoli responsive per controlli a formato fisso, toolbar, griglie e contatori in modo che testo e stati hover non possano ridimensionare in modo inatteso il layout.
5. Mantieni chiare le responsabilità di caricamento dati, derivazione dello stato e rendering.
6. Aggiungi test quando cambiano logica, persistenza, routing, permessi o helper condivisi.
7. Verifica il percorso felice principale e il caso limite più rilevante.

## Gate di qualità visiva

- Il testo deve stare dentro il suo contenitore su mobile e desktop.
- Le toolbar possono andare a capo, ma i controlli devono restare raggiungibili.
- I pulsanti dovrebbero usare icone familiari quando l'icona è più chiara del testo.
- Le card dovrebbero essere usate per elementi ripetuti, modali e strumenti incorniciati, non per ogni sezione di pagina.
- Evita palette monotone e sfondi decorativi che competono con il contenuto operativo.
- Le superfici di prodotto dense dovrebbero ottimizzare scansione, confronto e uso ripetuto.

## Formato del handoff

Riporta:

- Cosa è cambiato.
- Quale comportamento utente è cambiato.
- Quale validazione richiesta è passata.
- Qualsiasi validazione saltata e il motivo concreto.
- Eventuale lavoro opzionale successivo, chiaramente separato dalle correzioni necessarie.
```
