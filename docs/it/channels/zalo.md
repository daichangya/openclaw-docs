---
read_when:
    - Lavorare sulle funzionalità o sui Webhook di Zalo
summary: Stato del supporto del bot Zalo, capacità e configurazione
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Stato: sperimentale. I DM sono supportati. La sezione [Capacità](#capabilities) qui sotto riflette il comportamento attuale dei bot Marketplace.

## Plugin incluso

Zalo è distribuito come Plugin incluso nelle attuali versioni di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se stai usando una build più vecchia o un'installazione personalizzata che esclude Zalo, installalo
manualmente:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalo`
- Oppure da un checkout del sorgente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Imposta il token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oppure nella configurazione: `channels.zalo.accounts.default.botToken: "..."`.
3. Riavvia il gateway (oppure completa la configurazione).
4. L'accesso DM usa l'abbinamento per impostazione predefinita; approva il codice di abbinamento al primo contatto.

Configurazione minima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Che cos'è

Zalo è un'app di messaggistica molto diffusa in Vietnam; la sua API Bot consente al Gateway di eseguire un bot per conversazioni 1:1.
È una buona soluzione per supporto o notifiche quando vuoi un instradamento deterministico di ritorno verso Zalo.

Questa pagina riflette il comportamento attuale di OpenClaw per i **bot Zalo Bot Creator / Marketplace**.
I **bot Zalo Official Account (OA)** appartengono a una diversa superficie di prodotto Zalo e potrebbero comportarsi in modo diverso.

- Un canale API Zalo Bot gestito dal Gateway.
- Instradamento deterministico: le risposte tornano a Zalo; il modello non sceglie mai i canali.
- I DM condividono la sessione principale dell'agente.
- La sezione [Capacità](#capabilities) qui sotto mostra il supporto attuale dei bot Marketplace.

## Configurazione iniziale (percorso rapido)

### 1) Crea un token bot (Zalo Bot Platform)

1. Vai su [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e accedi.
2. Crea un nuovo bot e configura le sue impostazioni.
3. Copia il token completo del bot (in genere `numeric_id:secret`). Per i bot Marketplace, il token di runtime utilizzabile può comparire nel messaggio di benvenuto del bot dopo la creazione.

### 2) Configura il token (env o config)

Esempio:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Se in seguito passi a una superficie bot Zalo in cui i gruppi sono disponibili, puoi aggiungere esplicitamente configurazioni specifiche per i gruppi come `groupPolicy` e `groupAllowFrom`. Per il comportamento attuale dei bot Marketplace, vedi [Capacità](#capabilities).

Opzione env: `ZALO_BOT_TOKEN=...` (funziona solo per l'account predefinito).

Supporto multi-account: usa `channels.zalo.accounts` con token per account e `name` opzionale.

3. Riavvia il gateway. Zalo si avvia quando un token viene risolto (env o config).
4. L'accesso DM usa l'abbinamento per impostazione predefinita. Approva il codice quando il bot viene contattato per la prima volta.

## Come funziona (comportamento)

- I messaggi in ingresso vengono normalizzati nell'envelope del canale condiviso con segnaposto per i media.
- Le risposte vengono sempre instradate di nuovo alla stessa chat Zalo.
- Long-polling per impostazione predefinita; modalità Webhook disponibile con `channels.zalo.webhookUrl`.

## Limiti

- Il testo in uscita viene suddiviso in blocchi da 2000 caratteri (limite API di Zalo).
- I download/upload dei media sono limitati da `channels.zalo.mediaMaxMb` (predefinito 5).
- Lo streaming è bloccato per impostazione predefinita perché il limite di 2000 caratteri lo rende meno utile.

## Controllo accessi (DM)

### Accesso DM

- Predefinito: `channels.zalo.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di abbinamento; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- L'abbinamento è lo scambio di token predefinito. Dettagli: [Abbinamento](/it/channels/pairing)
- `channels.zalo.allowFrom` accetta ID utente numerici (non è disponibile la ricerca per username).

## Controllo accessi (Gruppi)

Per i **bot Zalo Bot Creator / Marketplace**, il supporto dei gruppi non era disponibile in pratica perché il bot non poteva essere aggiunto a un gruppo.

Ciò significa che le chiavi di configurazione relative ai gruppi qui sotto esistono nello schema, ma non erano utilizzabili per i bot Marketplace:

- `channels.zalo.groupPolicy` controlla la gestione dei messaggi di gruppo in ingresso: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limita quali ID mittente possono attivare il bot nei gruppi.
- Se `groupAllowFrom` non è impostato, Zalo usa `allowFrom` come fallback per il controllo dei mittenti.
- Nota di runtime: se `channels.zalo` manca del tutto, il runtime usa comunque `groupPolicy="allowlist"` come fallback per sicurezza.

I valori della policy di gruppo (quando l'accesso ai gruppi è disponibile sulla superficie del tuo bot) sono:

- `groupPolicy: "disabled"` — blocca tutti i messaggi di gruppo.
- `groupPolicy: "open"` — consente qualsiasi membro del gruppo (con vincolo di mention).
- `groupPolicy: "allowlist"` — predefinito fail-closed; sono accettati solo i mittenti consentiti.

Se stai usando una diversa superficie di prodotto bot Zalo e hai verificato che il comportamento di gruppo funziona, documentalo separatamente invece di presumere che corrisponda al flusso dei bot Marketplace.

## Long-polling vs Webhook

- Predefinito: long-polling (non è richiesto alcun URL pubblico).
- Modalità Webhook: imposta `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - Il secret del Webhook deve essere lungo da 8 a 256 caratteri.
  - L'URL del Webhook deve usare HTTPS.
  - Zalo invia gli eventi con l'header `X-Bot-Api-Secret-Token` per la verifica.
  - L'HTTP Gateway gestisce le richieste Webhook in `channels.zalo.webhookPath` (predefinito: il percorso dell'URL Webhook).
  - Le richieste devono usare `Content-Type: application/json` (oppure tipi di media `+json`).
  - Gli eventi duplicati (`event_name + message_id`) vengono ignorati per una breve finestra di replay.
  - Il traffico a raffica è limitato in frequenza per percorso/sorgente e può restituire HTTP 429.

**Nota:** `getUpdates` (polling) e Webhook si escludono a vicenda secondo la documentazione dell'API Zalo.

## Tipi di messaggio supportati

Per una rapida panoramica del supporto, vedi [Capacità](#capabilities). Le note qui sotto aggiungono dettagli dove il comportamento richiede contesto aggiuntivo.

- **Messaggi di testo**: supporto completo con suddivisione in blocchi da 2000 caratteri.
- **URL semplici nel testo**: si comportano come normale input testuale.
- **Anteprime di link / schede link avanzate**: vedi lo stato dei bot Marketplace in [Capacità](#capabilities); non attivavano in modo affidabile una risposta.
- **Messaggi immagine**: vedi lo stato dei bot Marketplace in [Capacità](#capabilities); la gestione delle immagini in ingresso era inaffidabile (indicatore di digitazione senza risposta finale).
- **Sticker**: vedi lo stato dei bot Marketplace in [Capacità](#capabilities).
- **Note vocali / file audio / video / allegati file generici**: vedi lo stato dei bot Marketplace in [Capacità](#capabilities).
- **Tipi non supportati**: registrati nei log (per esempio, messaggi da utenti protetti).

## Capacità

Questa tabella riassume il comportamento attuale dei **bot Zalo Bot Creator / Marketplace** in OpenClaw.

| Funzionalità                | Stato                                   |
| --------------------------- | --------------------------------------- |
| Messaggi diretti            | ✅ Supportati                            |
| Gruppi                      | ❌ Non disponibili per i bot Marketplace |
| Media (immagini in ingresso) | ⚠️ Limitati / verifica nel tuo ambiente |
| Media (immagini in uscita)  | ⚠️ Non ritestati per i bot Marketplace   |
| URL semplici nel testo      | ✅ Supportati                            |
| Anteprime di link           | ⚠️ Inaffidabili per i bot Marketplace    |
| Reazioni                    | ❌ Non supportate                        |
| Sticker                     | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Note vocali / audio / video | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Allegati file               | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Thread                      | ❌ Non supportati                        |
| Sondaggi                    | ❌ Non supportati                        |
| Comandi nativi              | ❌ Non supportati                        |
| Streaming                   | ⚠️ Bloccato (limite di 2000 caratteri)   |

## Destinazioni di consegna (CLI/cron)

- Usa un id chat come destinazione.
- Esempio: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Risoluzione dei problemi

**Il bot non risponde:**

- Controlla che il token sia valido: `openclaw channels status --probe`
- Verifica che il mittente sia approvato (abbinamento o `allowFrom`)
- Controlla i log del gateway: `openclaw logs --follow`

**Il Webhook non riceve eventi:**

- Assicurati che l'URL Webhook usi HTTPS
- Verifica che il token secret sia lungo da 8 a 256 caratteri
- Conferma che l'endpoint HTTP del gateway sia raggiungibile sul percorso configurato
- Controlla che il polling `getUpdates` non sia in esecuzione (si escludono a vicenda)

## Riferimento configurazione (Zalo)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Le chiavi flat di primo livello (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e simili) sono una scorciatoia legacy per il single-account. Per le nuove configurazioni, preferisci `channels.zalo.accounts.<id>.*`. Entrambe le forme sono ancora documentate qui perché esistono nello schema.

Opzioni del provider:

- `channels.zalo.enabled`: abilita/disabilita l'avvio del canale.
- `channels.zalo.botToken`: token del bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: legge il token da un normale percorso file. I symlink vengono rifiutati.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID utente). `open` richiede `"*"`. La procedura guidata richiederà ID numerici.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist). Presente nella configurazione; vedi [Capacità](#capabilities) e [Controllo accessi (Gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente). Usa `allowFrom` come fallback se non impostato.
- `channels.zalo.mediaMaxMb`: limite dei media in ingresso/in uscita (MB, predefinito 5).
- `channels.zalo.webhookUrl`: abilita la modalità Webhook (HTTPS richiesto).
- `channels.zalo.webhookSecret`: secret del Webhook (8-256 caratteri).
- `channels.zalo.webhookPath`: percorso Webhook sul server HTTP del gateway.
- `channels.zalo.proxy`: URL proxy per le richieste API.

Opzioni multi-account:

- `channels.zalo.accounts.<id>.botToken`: token per account.
- `channels.zalo.accounts.<id>.tokenFile`: file token regolare per account. I symlink vengono rifiutati.
- `channels.zalo.accounts.<id>.name`: nome visualizzato.
- `channels.zalo.accounts.<id>.enabled`: abilita/disabilita l'account.
- `channels.zalo.accounts.<id>.dmPolicy`: policy DM per account.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per account.
- `channels.zalo.accounts.<id>.groupPolicy`: policy di gruppo per account. Presente nella configurazione; vedi [Capacità](#capabilities) e [Controllo accessi (Gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist dei mittenti di gruppo per account.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per account.
- `channels.zalo.accounts.<id>.webhookSecret`: secret Webhook per account.
- `channels.zalo.accounts.<id>.webhookPath`: percorso Webhook per account.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per account.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e vincolo di mention
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
