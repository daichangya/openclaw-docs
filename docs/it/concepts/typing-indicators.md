---
read_when:
    - Modifica del comportamento o dei valori predefiniti dell’indicatore di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come configurarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-04-22T08:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicatori di digitazione

Gli indicatori di digitazione vengono inviati al canale di chat mentre un’esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **con quale frequenza** viene aggiornata.

## Valori predefiniti

Quando `agents.defaults.typingMode` è **non impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente non appena comincia il loop del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia solo quando il testo del messaggio comincia a essere trasmesso in streaming.
- **Esecuzioni Heartbeat**: la digitazione inizia quando l’esecuzione Heartbeat comincia se la destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disabilitata.

## Modalità

Imposta `agents.defaults.typingMode` su uno di questi valori:

- `never` — nessun indicatore di digitazione, mai.
- `instant` — avvia la digitazione **non appena inizia il loop del modello**, anche se l’esecuzione
  in seguito restituisce solo il token di risposta silenziosa.
- `thinking` — avvia la digitazione al **primo delta di ragionamento** (richiede
  `reasoningLevel: "stream"` per l’esecuzione).
- `message` — avvia la digitazione al **primo delta di testo non silenzioso** (ignora
  il token silenzioso `NO_REPLY`).

Ordine di “quanto presto si attiva”:
`never` → `message` → `thinking` → `instant`

## Configurazione

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Puoi sovrascrivere modalità o frequenza per sessione:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Note

- La modalità `message` non mostrerà la digitazione per risposte solo silenziose quando l’intero
  payload è esattamente il token silenzioso (per esempio `NO_REPLY` / `no_reply`,
  con corrispondenza case-insensitive).
- `thinking` si attiva solo se l’esecuzione trasmette in streaming il ragionamento (`reasoningLevel: "stream"`).
  Se il modello non emette delta di ragionamento, la digitazione non inizierà.
- La digitazione Heartbeat è un segnale di attività per la destinazione di consegna risolta. Si
  avvia all’inizio dell’esecuzione Heartbeat invece di seguire la tempistica di streaming di `message` o `thinking`. Imposta `typingMode: "never"` per disabilitarla.
- Gli Heartbeat non mostrano la digitazione quando `target: "none"`, quando la destinazione non può
  essere risolta, quando la consegna in chat è disabilitata per l’Heartbeat o quando il
  canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **frequenza di aggiornamento**, non il momento di avvio.
  Il valore predefinito è 6 secondi.
