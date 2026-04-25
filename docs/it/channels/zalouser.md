---
read_when:
    - Configurazione di Zalo personale per OpenClaw
    - Debug del flusso di accesso o dei messaggi di Zalo personale
summary: Supporto per account personali Zalo tramite zca-js nativo (accesso con QR), funzionalità e configurazione
title: Zalo personale
x-i18n:
    generated_at: "2026-04-25T13:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Stato: sperimentale. Questa integrazione automatizza un **account personale Zalo** tramite `zca-js` nativo all'interno di OpenClaw.

> **Avviso:** questa è un'integrazione non ufficiale e può comportare la sospensione/il ban dell'account. Usala a tuo rischio.

## Plugin incluso

Zalo personale viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build più vecchia o un'installazione personalizzata che esclude Zalo personale, installalo manualmente:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Oppure da un checkout del sorgente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo personale sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Accedi (QR, sulla macchina del Gateway):
   - `openclaw channels login --channel zalouser`
   - Scansiona il codice QR con l'app mobile Zalo.
3. Abilita il canale:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Riavvia il Gateway (oppure completa la configurazione).
5. L'accesso DM usa come impostazione predefinita l'associazione; approva il codice di associazione al primo contatto.

## Che cos'è

- Funziona interamente in-process tramite `zca-js`.
- Usa listener di eventi nativi per ricevere i messaggi in entrata.
- Invia le risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso con “account personale” in cui l'API Bot di Zalo non è disponibile.

## Denominazione

L'id del canale è `zalouser` per rendere esplicito che automatizza un **account utente personale Zalo** (non ufficiale). Manteniamo `zalo` riservato a una possibile futura integrazione ufficiale con l'API di Zalo.

## Trovare gli ID (directory)

Usa la CLI della directory per individuare peer/gruppi e i relativi ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limiti

- Il testo in uscita viene suddiviso in blocchi di circa 2000 caratteri (limiti del client Zalo).
- Lo streaming è bloccato per impostazione predefinita.

## Controllo degli accessi (DM)

`channels.zalouser.dmPolicy` supporta: `pairing | allowlist | open | disabled` (predefinito: `pairing`).

`channels.zalouser.allowFrom` accetta ID utente o nomi. Durante la configurazione, i nomi vengono risolti in ID usando la ricerca contatti in-process del Plugin.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- Limita a una lista di consentiti con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi dovrebbero essere ID di gruppo stabili; i nomi vengono risolti in ID all'avvio quando possibile)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può richiedere liste di consentiti per i gruppi.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti nelle liste di consentiti in ID e registra la mappatura nei log.
- La corrispondenza della lista di consentiti dei gruppi usa solo gli ID per impostazione predefinita. I nomi non risolti vengono ignorati per l'autorizzazione a meno che non sia abilitato `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità break-glass che riabilita la corrispondenza con nomi di gruppo modificabili.
- Se `groupAllowFrom` non è impostato, il runtime usa `allowFrom` come fallback per i controlli dei mittenti nei gruppi.
- I controlli dei mittenti si applicano sia ai normali messaggi di gruppo sia ai comandi di controllo (ad esempio `/new`, `/reset`).

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Controllo delle menzioni nei gruppi

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte nei gruppi richiedono una menzione.
- Ordine di risoluzione: id/nome gruppo esatto -> slug di gruppo normalizzato -> `*` -> predefinito (`true`).
- Questo si applica sia ai gruppi in lista di consentiti sia alla modalità gruppi aperti.
- Citare un messaggio del bot conta come menzione implicita per l'attivazione nel gruppo.
- I comandi di controllo autorizzati (ad esempio `/new`) possono aggirare il controllo delle menzioni.
- Quando un messaggio di gruppo viene saltato perché è richiesta una menzione, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
- Il limite della cronologia di gruppo usa come predefinito `messages.groupChat.historyLimit` (fallback `50`). Puoi sovrascriverlo per account con `channels.zalouser.historyLimit`.

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-account

Gli account vengono mappati ai profili `zalouser` nello stato di OpenClaw. Esempio:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitazione, reazioni e conferme di consegna

- OpenClaw invia un evento di digitazione prima di inviare una risposta (best-effort).
- L'azione di reazione ai messaggi `react` è supportata per `zalouser` nelle azioni del canale.
  - Usa `remove: true` per rimuovere una specifica emoji di reazione da un messaggio.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in entrata che includono metadati evento, OpenClaw invia conferme di consegna + visualizzazione (best-effort).

## Risoluzione dei problemi

**L'accesso non resta attivo:**

- `openclaw channels status --probe`
- Esegui nuovamente l'accesso: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La lista di consentiti/il nome del gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom`/`groups`, oppure nomi esatti di amici/gruppi.

**Aggiornato da una vecchia configurazione basata su CLI:**

- Rimuovi qualsiasi vecchia ipotesi di processo `zca` esterno.
- Il canale ora funziona interamente all'interno di OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
