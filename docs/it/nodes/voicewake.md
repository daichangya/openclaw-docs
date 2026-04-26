---
read_when:
    - Modifica del comportamento o dei valori predefiniti delle parole di attivazione vocale
    - Aggiunta di nuove piattaforme Node che richiedono la sincronizzazione delle parole di attivazione
summary: Parole di attivazione vocali globali (gestite dal Gateway) e come si sincronizzano tra i Node
title: Attivazione vocale
x-i18n:
    generated_at: "2026-04-26T11:33:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw tratta le **parole di attivazione** come un'unica lista globale gestita dal **Gateway**.

- Non esistono **parole di attivazione personalizzate per Node**.
- **Qualsiasi UI di Node/app può modificare** la lista; le modifiche vengono persistite dal Gateway e trasmesse a tutti.
- macOS e iOS mantengono toggle locali **Voice Wake abilitato/disabilitato** (UX locale e permessi sono diversi).
- Android attualmente mantiene Voice Wake disattivato e usa un flusso microfono manuale nella scheda Voice.

## Archiviazione (host Gateway)

Le parole di attivazione sono archiviate sulla macchina gateway in:

- `~/.openclaw/settings/voicewake.json`

Forma:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocollo

### Metodi

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parametri `{ triggers: string[] }` → `{ triggers: string[] }`

Note:

- I trigger vengono normalizzati (spazi rimossi ai bordi, valori vuoti eliminati). Le liste vuote tornano ai valori predefiniti.
- I limiti vengono applicati per sicurezza (tetti su conteggio/lunghezza).

### Metodi di instradamento (trigger → target)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` con parametri `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Forma di `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

I target di route supportano esattamente uno di:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventi

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Chi lo riceve:

- Tutti i client WebSocket (app macOS, WebChat, ecc.)
- Tutti i Node connessi (iOS/Android), e anche alla connessione del Node come push iniziale dello “stato corrente”.

## Comportamento del client

### App macOS

- Usa la lista globale per filtrare i trigger di `VoiceWakeRuntime`.
- La modifica di “Trigger words” nelle impostazioni di Voice Wake chiama `voicewake.set` e poi si affida alla trasmissione per mantenere sincronizzati gli altri client.

### Node iOS

- Usa la lista globale per il rilevamento dei trigger di `VoiceWakeManager`.
- La modifica delle Wake Words nelle Settings chiama `voicewake.set` (tramite il Gateway WS) e mantiene anche reattivo il rilevamento locale delle parole di attivazione.

### Node Android

- Voice Wake è attualmente disabilitato nel runtime/Settings Android.
- L'audio Android usa l'acquisizione manuale del microfono nella scheda Voice invece dei trigger tramite parole di attivazione.

## Correlati

- [Modalità talk](/it/nodes/talk)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
