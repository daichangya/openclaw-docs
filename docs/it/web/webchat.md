---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico loopback di WebChat e uso del Gateway WS per l'interfaccia chat
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Stato: l'interfaccia chat SwiftUI di macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos'è

- Un'interfaccia chat nativa per il gateway (senza browser incorporato e senza server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della UI di controllo.
3. Assicurati che sia configurato un percorso valido di autenticazione del gateway (segreto condiviso per impostazione predefinita, anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per garantire stabilità: il Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto runtime-only di OpenClaw, i wrapper envelope in ingresso, i tag inline di direttiva di recapito come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML plain-text delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati), e i token di controllo del modello ASCII/full-width trapelati vengono rimossi dal testo visibile, e le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply` vengono omesse.
- `chat.inject` aggiunge direttamente una nota dell'assistente alla trascrizione e la trasmette alla UI (senza eseguire l'agente).
- Le esecuzioni interrotte possono mantenere visibile nella UI l'output parziale dell'assistente.
- Il Gateway rende persistente nella cronologia della trascrizione il testo parziale dell'assistente delle esecuzioni interrotte quando esiste output nel buffer e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (senza monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello degli strumenti degli agenti nella UI di controllo

- Il pannello Strumenti di `/agents` nella UI di controllo ha due viste separate:
  - **Disponibili in questo momento** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente può effettivamente usare a runtime, inclusi strumenti core, Plugin e strumenti di proprietà del canale.
  - **Configurazione degli strumenti** usa `tools.catalog` e rimane focalizzato su profili, override e semantica del catalogo.
- La disponibilità runtime è limitata alla sessione. Cambiare sessione sullo stesso agente può modificare l'elenco **Disponibili in questo momento**.
- L'editor di configurazione non implica disponibilità runtime; l'accesso effettivo continua a seguire la precedenza della policy (`allow`/`deny`, override per agente e per provider/canale).

## Uso remoto

- La modalità remota instrada il WebSocket del gateway tramite tunnel SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni di WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce della trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi troppo grandi con un segnaposto. Il client può anche inviare `maxChars` per richiesta per sostituire questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta del WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket con segreto condiviso.
- `gateway.auth.allowTailscale`: la scheda chat della UI di controllo nel browser può usare gli header di identità di Tailscale Serve quando abilitati.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell'identità (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione gateway remota.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

## Correlati

- [UI di controllo](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)
