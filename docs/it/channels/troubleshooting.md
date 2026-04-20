---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non vengono inviate
    - Sono necessari controlli specifici del canale prima di passare alla documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni specifiche per canale
title: Risoluzione dei problemi del canale
x-i18n:
    generated_at: "2026-04-20T08:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aef31742cd5cc4af3fa3d3ea1acba51875ad4a1423c0e8c87372c3df31b0528
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del canale

Usa questa pagina quando un canale si connette ma il comportamento non è corretto.

## Sequenza di comandi

Esegui prima questi comandi, in questo ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline sana:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oppure `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` oppure `audit ok`

## WhatsApp

### Firme di errore di WhatsApp

| Sintomo                         | Controllo più rapido                                | Correzione                                                  |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Connesso ma nessuna risposta nei DM | `openclaw pairing list whatsapp`                    | Approva il mittente oppure cambia il criterio DM/allowlist. |
| I messaggi di gruppo vengono ignorati | Controlla `requireMention` + i pattern di menzione nella config | Menziona il bot oppure allenta il criterio di menzione per quel gruppo. |
| Disconnessioni casuali/cicli di nuovo login | `openclaw channels status --probe` + log           | Esegui di nuovo il login e verifica che la directory delle credenziali sia integra.   |

Risoluzione completa dei problemi: [/channels/whatsapp#troubleshooting](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore di Telegram

| Sintomo                             | Controllo più rapido                            | Correzione                                                                  |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile   | `openclaw pairing list telegram`                | Approva l'associazione oppure cambia il criterio DM.                         |
| Bot online ma il gruppo resta silenzioso   | Verifica il requisito di menzione e la modalità privacy del bot | Disattiva la modalità privacy per la visibilità nel gruppo oppure menziona il bot. |
| Invii che falliscono con errori di rete   | Ispeziona i log per gli errori delle chiamate API di Telegram     | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                           |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`        | Riduci i comandi Telegram di plugin/Skills/personalizzati oppure disabilita i menu nativi.       |
| Hai aggiornato e l'allowlist ti blocca   | `openclaw security audit` e le allowlist nella config | Esegui `openclaw doctor --fix` oppure sostituisci `@username` con ID numerici del mittente. |

Risoluzione completa dei problemi: [/channels/telegram#troubleshooting](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore di Discord

| Sintomo                         | Controllo più rapido                      | Correzione                                                    |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Bot online ma nessuna risposta nel server | `openclaw channels status --probe`  | Consenti il server/canale e verifica l'intento message content.    |
| I messaggi di gruppo vengono ignorati          | Controlla nei log gli scarti dovuti al filtro per menzione | Menziona il bot oppure imposta `requireMention: false` per server/canale. |
| Risposte DM mancanti              | `openclaw pairing list discord`     | Approva l'associazione DM oppure regola il criterio DM.                   |

Risoluzione completa dei problemi: [/channels/discord#troubleshooting](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore di Slack

| Sintomo                                | Controllo più rapido                              | Correzione                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connessa ma nessuna risposta | `openclaw channels status --probe`        | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`             | Approva l'associazione oppure allenta il criterio DM.                                                                                                                  |
| Messaggio del canale ignorato                | Controlla `groupPolicy` e l'allowlist del canale | Consenti il canale oppure cambia il criterio in `open`.                                                                                                        |

Risoluzione completa dei problemi: [/channels/slack#troubleshooting](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore di iMessage e BlueBubbles

| Sintomo                          | Controllo più rapido                                                            | Correzione                                                |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Nessun evento in ingresso                | Verifica la raggiungibilità del webhook/server e i permessi dell'app                  | Correggi l'URL del webhook o lo stato del server BlueBubbles.          |
| Può inviare ma non riceve su macOS | Controlla i permessi privacy di macOS per l'automazione di Messaggi                 | Concedi di nuovo i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato                | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Approva l'associazione oppure aggiorna l'allowlist.                  |

Risoluzione completa dei problemi:

- [/channels/imessage#troubleshooting](/it/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore di Signal

| Sintomo                         | Controllo più rapido                               | Correzione                                                       |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Demone raggiungibile ma bot silenzioso | `openclaw channels status --probe`         | Verifica l'URL/account del demone `signal-cli` e la modalità di ricezione. |
| DM bloccato                      | `openclaw pairing list signal`             | Approva il mittente oppure regola il criterio DM.                      |
| Le risposte nei gruppi non si attivano    | Controlla l'allowlist dei gruppi e i pattern di menzione | Aggiungi mittente/gruppo oppure allenta il filtro.                       |

Risoluzione completa dei problemi: [/channels/signal#troubleshooting](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore di QQ Bot

| Sintomo                         | Controllo più rapido                                | Correzione                                                              |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| Il bot risponde "gone to Mars"      | Verifica `appId` e `clientSecret` nella config | Imposta le credenziali oppure riavvia il Gateway.                         |
| Nessun messaggio in ingresso             | `openclaw channels status --probe`          | Verifica le credenziali sulla QQ Open Platform.                     |
| La voce non viene trascritta           | Controlla la config del provider STT                   | Configura `channels.qqbot.stt` oppure `tools.media.audio`.          |
| I messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ  | QQ può bloccare i messaggi avviati dal bot senza una recente interazione. |

Risoluzione completa dei problemi: [/channels/qqbot#troubleshooting](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                             | Controllo più rapido                           | Correzione                                                                        |
| ----------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ha eseguito il login ma ignora i messaggi nella stanza | `openclaw channels status --probe`     | Controlla `groupPolicy`, l'allowlist della stanza e il filtro per menzione.                  |
| I DM non vengono elaborati                  | `openclaw pairing list matrix`         | Approva il mittente oppure regola il criterio DM.                                       |
| Le stanze cifrate falliscono                | `openclaw matrix verify status`        | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`.  |
| Il ripristino del backup è in attesa/non funziona    | `openclaw matrix verify backup status` | Esegui `openclaw matrix verify backup restore` oppure riesegui con una chiave di recupero. |
| Il bootstrap/cross-signing sembra errato | `openclaw matrix verify bootstrap`     | Ripara in un solo passaggio l'archiviazione dei segreti, il cross-signing e lo stato del backup.       |

Configurazione e impostazione complete: [Matrix](/it/channels/matrix)
