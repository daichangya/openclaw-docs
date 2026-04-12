---
read_when:
    - Vuoi usare GitHub Copilot come provider di modelli
    - Ti serve il flusso `openclaw models auth login-github-copilot`
summary: Accedi a GitHub Copilot da OpenClaw usando il flusso del dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot è l’assistente di coding con IA di GitHub. Fornisce accesso ai modelli Copilot per il tuo account e piano GitHub. OpenClaw può usare Copilot come provider di modelli in due modi diversi.

## Due modi per usare Copilot in OpenClaw

<Tabs>
  <Tab title="Provider integrato (github-copilot)">
    Usa il flusso di accesso nativo del dispositivo per ottenere un token GitHub, quindi scambialo con
    token API Copilot quando OpenClaw è in esecuzione. Questo è il percorso **predefinito** e più semplice
    perché non richiede VS Code.

    <Steps>
      <Step title="Esegui il comando di accesso">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni il
        terminale aperto finché l’operazione non è completata.
      </Step>
      <Step title="Imposta un modello predefinito">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        Oppure nella configurazione:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Usa l’estensione VS Code **Copilot Proxy** come bridge locale. OpenClaw comunica con
    l’endpoint `/v1` del proxy e usa l’elenco di modelli che configuri lì.

    <Note>
    Scegli questa opzione se usi già Copilot Proxy in VS Code o se devi instradare
    attraverso di esso. Devi abilitare il plugin e mantenere in esecuzione l’estensione VS Code.
    </Note>

  </Tab>
</Tabs>

## Flag facoltativi

| Flag            | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Salta il prompt di conferma                         |
| `--set-default` | Applica anche il modello predefinito consigliato dal provider |

```bash
# Salta la conferma
openclaw models auth login-github-copilot --yes

# Accedi e imposta il modello predefinito in un solo passaggio
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interattivo richiesto">
    Il flusso di accesso del dispositivo richiede un TTY interattivo. Eseguilo direttamente in un
    terminale, non in uno script non interattivo o in una pipeline CI.
  </Accordion>

  <Accordion title="La disponibilità dei modelli dipende dal tuo piano">
    La disponibilità dei modelli Copilot dipende dal tuo piano GitHub. Se un modello viene
    rifiutato, prova un altro ID (ad esempio `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Selezione del trasporto">
    Gli ID modello Claude usano automaticamente il trasporto Anthropic Messages. I modelli GPT,
    o-series e Gemini mantengono il trasporto OpenAI Responses. OpenClaw
    seleziona il trasporto corretto in base al riferimento del modello.
  </Accordion>

  <Accordion title="Ordine di risoluzione delle variabili d’ambiente">
    OpenClaw risolve l’autenticazione Copilot dalle variabili d’ambiente nel seguente
    ordine di priorità:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorità massima, specifico per Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | Token GitHub standard (priorità più bassa)   |

    Quando sono impostate più variabili, OpenClaw usa quella con priorità più alta.
    Il flusso di accesso del dispositivo (`openclaw models auth login-github-copilot`) memorizza
    il suo token nell’archivio dei profili di autenticazione e ha la precedenza su tutte le
    variabili d’ambiente.

  </Accordion>

  <Accordion title="Archiviazione del token">
    L’accesso memorizza un token GitHub nell’archivio dei profili di autenticazione e lo scambia
    con un token API Copilot quando OpenClaw è in esecuzione. Non devi gestire il
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Richiede un TTY interattivo. Esegui il comando di accesso direttamente in un terminale, non
all’interno di uno script headless o di un job CI.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
