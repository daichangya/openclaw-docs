---
read_when:
    - Vuoi i modelli GLM in OpenClaw
    - Hai bisogno della convenzione di denominazione dei modelli e della configurazione
summary: Panoramica della famiglia di modelli GLM + come usarla in OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T23:30:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# Modelli GLM

GLM è una **famiglia di modelli** (non un'azienda) disponibile tramite la piattaforma Z.AI. In OpenClaw, i modelli GLM
sono accessibili tramite il provider `zai` e ID modello come `zai/glm-5`.

## Per iniziare

<Steps>
  <Step title="Scegli un percorso di autenticazione ed esegui l'onboarding">
    Scegli l'opzione di onboarding che corrisponde al tuo piano Z.AI e alla tua regione:

    | Scelta di autenticazione | Ideale per |
    | ----------- | -------- |
    | `zai-api-key` | Configurazione generica con chiave API e rilevamento automatico dell'endpoint |
    | `zai-coding-global` | Utenti Coding Plan (globale) |
    | `zai-coding-cn` | Utenti Coding Plan (regione Cina) |
    | `zai-global` | API generica (globale) |
    | `zai-cn` | API generica (regione Cina) |

    ```bash
    # Esempio: rilevamento automatico generico
    openclaw onboard --auth-choice zai-api-key

    # Esempio: Coding Plan globale
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Imposta GLM come modello predefinito">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Esempio di configurazione

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` consente a OpenClaw di rilevare dall chiave l'endpoint Z.AI corrispondente e
di applicare automaticamente l'URL di base corretto. Usa le scelte regionali esplicite quando
vuoi forzare una superficie specifica di Coding Plan o API generica.
</Tip>

## Modelli GLM integrati

OpenClaw attualmente inizializza il provider integrato `zai` con questi riferimenti GLM:

| Modello         | Modello          |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Il riferimento al modello integrato predefinito è `zai/glm-5.1`. Le versioni e la disponibilità di GLM
possono cambiare; consulta la documentazione di Z.AI per le informazioni più aggiornate.
</Note>

## Note avanzate

<AccordionGroup>
  <Accordion title="Rilevamento automatico dell'endpoint">
    Quando usi la scelta di autenticazione `zai-api-key`, OpenClaw ispeziona il formato della chiave
    per determinare l'URL di base Z.AI corretto. Le scelte regionali esplicite
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) sovrascrivono
    il rilevamento automatico e fissano direttamente l'endpoint.
  </Accordion>

  <Accordion title="Dettagli del provider">
    I modelli GLM sono forniti dal provider runtime `zai`. Per la configurazione completa del provider,
    gli endpoint regionali e le capacità aggiuntive, vedi la
    [documentazione del provider Z.AI](/it/providers/zai).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider Z.AI" href="/it/providers/zai" icon="server">
    Configurazione completa del provider Z.AI ed endpoint regionali.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
</CardGroup>
