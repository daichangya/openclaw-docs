---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non vengono recapitate
    - Hai bisogno di controlli specifici del canale prima di consultare la documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per ciascun canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-04-22T04:20:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi dei canali

Usa questa pagina quando un canale si connette ma il comportamento non è corretto.

## Sequenza di comandi

Esegui prima questi comandi in questo ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Riferimento di stato corretto:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oppure `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` oppure `audit ok`

## WhatsApp

### Firme di errore di WhatsApp

| Sintomo                        | Controllo più rapido                                | Correzione                                              |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| Connesso ma nessuna risposta DM | `openclaw pairing list whatsapp`                    | Approva il mittente oppure cambia il criterio DM/allowlist. |
| I messaggi di gruppo vengono ignorati | Controlla `requireMention` e i pattern di menzione nella configurazione | Menziona il bot oppure allenta il criterio di menzione per quel gruppo. |
| Disconnessioni casuali/cicli di nuovo accesso | `openclaw channels status --probe` + log           | Effettua di nuovo l'accesso e verifica che la directory delle credenziali sia integra. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore di Telegram

| Sintomo                            | Controllo più rapido                              | Correzione                                                                                                                 |
| ---------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                 | Approva il pairing oppure cambia il criterio DM.                                                                           |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disattiva la modalità privacy per la visibilità nel gruppo oppure menziona il bot.                                        |
| Errori di invio con errori di rete | Controlla i log per gli errori delle chiamate API Telegram | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                                                              |
| Il polling si blocca o si riconnette lentamente | `openclaw logs --follow` per la diagnostica del polling | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti continuano a indicare problemi di proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Controlla i log per `BOT_COMMANDS_TOO_MUCH`         | Riduci i comandi Telegram di plugin/Skills/personalizzati oppure disattiva i menu nativi.                                 |
| Hai aggiornato e l'allowlist ti blocca | `openclaw security audit` e allowlist nella configurazione | Esegui `openclaw doctor --fix` oppure sostituisci `@username` con ID numerici del mittente.                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore di Discord

| Sintomo                        | Controllo più rapido                      | Correzione                                              |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| Bot online ma nessuna risposta nel server | `openclaw channels status --probe`  | Consenti server/canale e verifica l'intent del contenuto dei messaggi. |
| I messaggi di gruppo vengono ignorati | Controlla i log per gli scarti dovuti al controllo delle menzioni | Menziona il bot oppure imposta `requireMention: false` per server/canale. |
| Mancano risposte nei DM        | `openclaw pairing list discord`           | Approva il pairing DM oppure regola il criterio DM.     |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore di Slack

| Sintomo                               | Controllo più rapido                      | Correzione                                                                                                                                             |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode connessa ma nessuna risposta | `openclaw channels status --probe`        | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                           | `openclaw pairing list slack`             | Approva il pairing oppure allenta il criterio DM.                                                                                                      |
| Messaggio nel canale ignorato         | Controlla `groupPolicy` e l'allowlist del canale | Consenti il canale oppure cambia il criterio in `open`.                                                                                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore di iMessage e BlueBubbles

| Sintomo                         | Controllo più rapido                                                          | Correzione                                             |
| ------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Nessun evento in ingresso       | Verifica raggiungibilità del webhook/server e permessi dell'app              | Correggi l'URL del webhook o lo stato del server BlueBubbles. |
| Può inviare ma non riceve su macOS | Controlla i permessi privacy macOS per l'automazione di Messaggi                 | Concedi di nuovo i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato            | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles`       | Approva il pairing oppure aggiorna l'allowlist.        |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)
- [Risoluzione dei problemi di BlueBubbles](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore di Signal

| Sintomo                        | Controllo più rapido                      | Correzione                                             |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------ |
| Demone raggiungibile ma bot silenzioso | `openclaw channels status --probe`         | Verifica URL/account del demone `signal-cli` e la modalità di ricezione. |
| DM bloccato                    | `openclaw pairing list signal`             | Approva il mittente oppure regola il criterio DM.      |
| Le risposte nei gruppi non si attivano | Controlla allowlist del gruppo e pattern di menzione | Aggiungi mittente/gruppo oppure allenta i controlli.   |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## Bot QQ

### Firme di errore del bot QQ

| Sintomo                        | Controllo più rapido                         | Correzione                                                     |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------- |
| Il bot risponde "gone to Mars" | Verifica `appId` e `clientSecret` nella configurazione | Imposta le credenziali oppure riavvia il Gateway.              |
| Nessun messaggio in ingresso   | `openclaw channels status --probe`           | Verifica le credenziali nella QQ Open Platform.                |
| La voce non viene trascritta   | Controlla la configurazione del provider STT | Configura `channels.qqbot.stt` oppure `tools.media.audio`.     |
| I messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza un'interazione recente. |

Risoluzione completa dei problemi: [Risoluzione dei problemi del bot QQ](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                            | Controllo più rapido                    | Correzione                                                               |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Accesso effettuato ma i messaggi nelle stanze vengono ignorati | `openclaw channels status --probe`     | Controlla `groupPolicy`, allowlist delle stanze e controllo delle menzioni. |
| I DM non vengono elaborati         | `openclaw pairing list matrix`          | Approva il mittente oppure regola il criterio DM.                        |
| Le stanze cifrate falliscono       | `openclaw matrix verify status`         | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso/non funziona | `openclaw matrix verify backup status` | Esegui `openclaw matrix verify backup restore` oppure riprova con una chiave di ripristino. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`     | Ripara in un solo passaggio archiviazione dei segreti, cross-signing e stato del backup. |

Configurazione e impostazione complete: [Matrix](/it/channels/matrix)
