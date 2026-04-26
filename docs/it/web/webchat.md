---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Uso dell'host statico WebChat in local loopback e del Gateway WS per l'interfaccia chat
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Stato: l'interfaccia chat SwiftUI di macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos'è

- Un'interfaccia chat nativa per il gateway (nessun browser incorporato e nessun server statico locale).
- Usa le stesse sessioni e le stesse regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione gateway valido (shared-secret per impostazione predefinita,
   anche su local loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare i campi di testo lunghi, omettere metadati pesanti e sostituire le voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto OpenClaw solo-runtime,
  i wrapper envelope in ingresso, i tag direttiva di consegna inline
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML di tool-call in testo semplice
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di tool-call troncati), e
  i token di controllo del modello ASCII/full-width trapelati vengono rimossi dal testo visibile,
  e le voci assistant il cui intero testo visibile è solo l'esatto
  token silenzioso `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come reasoning (`isReasoning: true`) sono esclusi dal contenuto assistant di WebChat, dal testo di replay del transcript e dai blocchi di contenuto audio, così i payload solo-thinking non emergono come messaggi assistant visibili o audio riproducibile.
- `chat.inject` aggiunge direttamente una nota assistant al transcript e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia un output assistant parziale.
- Il Gateway rende persistente nello storico del transcript il testo assistant parziale interrotto quando esiste output nel buffer e contrassegna tali voci con metadati di interruzione.
- Lo storico viene sempre recuperato dal gateway (nessun monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello strumenti agenti della Control UI

- Il pannello Strumenti di `/agents` nella Control UI ha due viste separate:
  - **Disponibili ora** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, del Plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzato su profili, override e
    semantica del catalogo.
- La disponibilità a runtime ha ambito di sessione. Cambiando sessione sullo stesso agente può cambiare
  l'elenco **Disponibili ora**.
- L'editor di configurazione non implica disponibilità a runtime; l'accesso effettivo continua a seguire la precedenza
  dei criteri (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota instrada in tunnel il WebSocket del gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce del transcript supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi troppo grandi con un segnaposto. Il client può anche inviare `maxChars` per richiesta per sovrascrivere questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat browser della Control UI può usare gli header di identità Tailscale
  Serve quando abilitato.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** identity-aware (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione gateway remota.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)
