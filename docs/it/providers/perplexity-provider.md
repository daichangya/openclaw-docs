---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - Ti serve la chiave API Perplexity o la configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtri)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:56:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Il Plugin Perplexity fornisce capacità di ricerca web tramite la Perplexity Search API o Perplexity Sonar via OpenRouter.

<Note>
Questa pagina copre la configurazione del **provider** Perplexity. Per lo **strumento** Perplexity (come l'agente lo usa), vedi [Strumento Perplexity](/it/tools/perplexity-search).
</Note>

| Proprietà    | Valore                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Tipo         | Provider di ricerca web (non un provider di modelli)                   |
| Autenticazione | `PERPLEXITY_API_KEY` (diretta) o `OPENROUTER_API_KEY` (via OpenRouter) |
| Percorso config | `plugins.entries.perplexity.config.webSearch.apiKey`                |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui il flusso interattivo di configurazione della ricerca web:

    ```bash
    openclaw configure --section web
    ```

    Oppure imposta direttamente la chiave:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Inizia a cercare">
    L'agente userà automaticamente Perplexity per le ricerche web una volta che la chiave è configurata. Non sono richiesti passaggi aggiuntivi.
  </Step>
</Steps>

## Modalità di ricerca

Il Plugin seleziona automaticamente il transport in base al prefisso della chiave API:

<Tabs>
  <Tab title="API Perplexity nativa (pplx-)">
    Quando la tua chiave inizia con `pplx-`, OpenClaw usa la Perplexity Search API nativa. Questo transport restituisce risultati strutturati e supporta filtri per dominio, lingua e data (vedi le opzioni di filtro sotto).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando la tua chiave inizia con `sk-or-`, OpenClaw instrada tramite OpenRouter usando il modello Perplexity Sonar. Questo transport restituisce risposte sintetizzate dall'AI con citazioni.
  </Tab>
</Tabs>

| Prefisso chiave | Transport                    | Funzionalità                                     |
| --------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`         | API Perplexity Search nativa | Risultati strutturati, filtri dominio/lingua/data |
| `sk-or-`        | OpenRouter (Sonar)           | Risposte sintetizzate dall'AI con citazioni      |

## Filtri API nativi

<Note>
Le opzioni di filtro sono disponibili solo quando si usa l'API Perplexity nativa (`pplx-`). Le ricerche OpenRouter/Sonar non supportano questi parametri.
</Note>

Quando si usa l'API Perplexity nativa, le ricerche supportano i seguenti filtri:

| Filtro         | Descrizione                             | Esempio                             |
| -------------- | --------------------------------------- | ----------------------------------- |
| Paese          | Codice paese di 2 lettere               | `us`, `de`, `jp`                    |
| Lingua         | Codice lingua ISO 639-1                 | `en`, `fr`, `zh`                    |
| Intervallo date | Finestra di recenza                    | `day`, `week`, `month`, `year`      |
| Filtri dominio | Allowlist o denylist (max 20 domini)    | `example.com`                       |
| Budget contenuto | Limiti di token per risposta / per pagina | `max_tokens`, `max_tokens_per_page` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi demone">
    Se il Gateway OpenClaw è eseguito come demone (launchd/systemd), assicurati che `PERPLEXITY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave impostata solo in `~/.profile` non sarà visibile a un demone launchd/systemd a meno che quell'ambiente non venga importato esplicitamente. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo gateway possa leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Configurazione del proxy OpenRouter">
    Se preferisci instradare le ricerche Perplexity tramite OpenRouter, imposta invece `OPENROUTER_API_KEY` (prefisso `sk-or-`) al posto di una chiave Perplexity nativa.
    OpenClaw rileverà il prefisso e passerà automaticamente al transport Sonar.

    <Tip>
    Il transport OpenRouter è utile se hai già un account OpenRouter e vuoi una fatturazione consolidata su più provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento di ricerca Perplexity" href="/it/tools/perplexity-search" icon="magnifying-glass">
    Come l'agente invoca le ricerche Perplexity e interpreta i risultati.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione, incluse le voci dei Plugin.
  </Card>
</CardGroup>
