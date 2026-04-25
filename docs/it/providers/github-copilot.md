---
read_when:
    - Vuoi usare GitHub Copilot come provider di modelli
    - Hai bisogno del flusso `openclaw models auth login-github-copilot`
summary: Accedi a GitHub Copilot da OpenClaw usando il flusso dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot è l'assistente AI per il coding di GitHub. Fornisce accesso ai
modelli Copilot per il tuo account e piano GitHub. OpenClaw può usare Copilot come provider di modelli in due modi diversi.

## Due modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Provider integrato (github-copilot)">
    Usa il flusso di login dispositivo nativo per ottenere un token GitHub, poi scambialo con
    token API Copilot quando OpenClaw è in esecuzione. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni il
        terminale aperto fino al completamento.
      </Step>
      <Step title="Imposta un modello predefinito">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Oppure nella configurazione:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa l'estensione VS Code **Copilot Proxy** come bridge locale. OpenClaw parla con
    l'endpoint `/v1` del proxy e usa l'elenco di modelli che configuri lì.

    <Note>
    Scegli questa opzione quando esegui già Copilot Proxy in VS Code o hai bisogno di instradare
    attraverso di esso. Devi abilitare il Plugin e mantenere in esecuzione l'estensione VS Code.
    </Note>

  </Tab>
</Tabs>

## Flag facoltativi

| Flag            | Descrizione                                           |
| --------------- | ----------------------------------------------------- |
| `--yes`         | Salta il prompt di conferma                           |
| `--set-default` | Applica anche il modello predefinito consigliato dal provider |

```bash
# Salta la conferma
openclaw models auth login-github-copilot --yes

# Login e impostazione del modello predefinito in un solo passaggio
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interattiva richiesta">
    Il flusso di login dispositivo richiede una TTY interattiva. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (ad esempio `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selezione del trasporto">
    Gli ID dei modelli Claude usano automaticamente il trasporto Anthropic Messages. I modelli GPT,
    serie o e Gemini mantengono il trasporto OpenAI Responses. OpenClaw
    seleziona il trasporto corretto in base al riferimento del modello.
  </Accordion>

  <Accordion title="Compatibilità delle richieste">
    OpenClaw invia header di richiesta in stile IDE Copilot sui trasporti Copilot,
    inclusi turni di Compaction integrata, risultato degli strumenti e follow-up su immagini. Non
    abilita la continuazione Responses a livello provider per Copilot a meno che
    tale comportamento non sia stato verificato contro l'API Copilot.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili d'ambiente">
    OpenClaw risolve l'auth Copilot dalle variabili d'ambiente nel seguente
    ordine di priorità:

    | Priorità | Variabile              | Note                               |
    | -------- | ---------------------- | ---------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifica Copilot |
    | 2        | `GH_TOKEN`             | Token GitHub CLI (fallback)        |
    | 3        | `GITHUB_TOKEN`         | Token GitHub standard (priorità più bassa) |

    Quando sono impostate più variabili, OpenClaw usa quella con priorità più alta.
    Il flusso di login dispositivo (`openclaw models auth login-github-copilot`) memorizza
    il proprio token nell'archivio dei profili auth e ha la precedenza su tutte le
    variabili d'ambiente.

  </Accordion>

  <Accordion title="Archiviazione del token">
    Il login memorizza un token GitHub nell'archivio dei profili auth e lo scambia
    con un token API Copilot quando OpenClaw è in esecuzione. Non devi gestire il
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Richiede una TTY interattiva. Esegui il comando di login direttamente in un terminale, non
all'interno di uno script headless o di un job CI.
</Warning>

## Embeddings per memory search

GitHub Copilot può anche fungere da provider di embedding per
[memory search](/it/concepts/memory-search). Se hai un abbonamento Copilot e
hai effettuato il login, OpenClaw può usarlo per gli embedding senza una chiave API separata.

### Rilevamento automatico

Quando `memorySearch.provider` è `"auto"` (predefinito), GitHub Copilot viene provato
con priorità 15 -- dopo gli embedding locali ma prima di OpenAI e altri
provider a pagamento. Se è disponibile un token GitHub, OpenClaw individua i
modelli di embedding disponibili dall'API Copilot e sceglie automaticamente il migliore.

### Configurazione esplicita

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facoltativo: override del modello individuato automaticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Come funziona

1. OpenClaw risolve il tuo token GitHub (da variabili env o profilo auth).
2. Lo scambia con un token API Copilot a breve durata.
3. Interroga l'endpoint Copilot `/models` per individuare i modelli di embedding disponibili.
4. Sceglie il modello migliore (preferisce `text-embedding-3-small`).
5. Invia le richieste di embedding all'endpoint Copilot `/embeddings`.

La disponibilità dei modelli dipende dal tuo piano GitHub. Se nessun modello di embedding è
disponibile, OpenClaw salta Copilot e prova il provider successivo.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riuso delle credenziali.
  </Card>
</CardGroup>
