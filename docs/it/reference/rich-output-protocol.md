---
read_when:
    - Modifica del rendering dell'output dell'assistente nell'interfaccia Control UI
    - Debug di `[embed ...]`, `MEDIA:`, delle direttive di risposta o di presentazione audio
summary: Protocollo shortcode di output avanzato per incorporamenti, contenuti multimediali, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-04-25T13:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

L'output dell'assistente può includere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna degli allegati
- `[[audio_as_voice]]` per i suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per i metadati di risposta
- `[embed ...]` per il rendering avanzato nella Control UI

Queste direttive sono separate. `MEDIA:` e i tag reply/voice restano metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo web.

Quando lo streaming a blocchi è abilitato, `MEDIA:` resta metadato di consegna singola per un
turno. Se lo stesso URL multimediale viene inviato in un blocco in streaming e ripetuto nel payload finale
dell'assistente, OpenClaw consegna l'allegato una sola volta e rimuove il duplicato
dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato esposta all'agente per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per il nuovo output.
- Gli shortcode embed vengono renderizzati solo nella superficie del messaggio dell'assistente.
- Vengono renderizzati solo gli embed supportati da URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed in HTML inline in formato blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering avanzato degli embed.

## Forma di rendering memorizzata

Il blocco di contenuto dell'assistente normalizzato/memorizzato è un elemento `canvas` strutturato:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

I blocchi avanzati memorizzati/renderizzati usano direttamente questa forma `canvas`. `present_view` non è riconosciuto.

## Correlati

- [Adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)
