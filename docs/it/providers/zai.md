---
read_when:
    - Vuoi usare i modelli Z.AI / GLM in OpenClaw
    - Hai bisogno di una semplice configurazione di `ZAI_API_KEY`
summary: Usa Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T23:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e usa chiavi API
per l'autenticazione. Crea la tua chiave API nella console Z.AI. OpenClaw usa il provider `zai`
con una chiave API Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (auth Bearer)

## Per iniziare

<Tabs>
  <Tab title="Rilevamento automatico dell'endpoint">
    **Ideale per:** la maggior parte degli utenti. OpenClaw rileva l'endpoint Z.AI corrispondente dalla chiave e applica automaticamente il base URL corretto.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regionale esplicito">
    **Ideale per:** utenti che vogliono forzare una specifica superficie API Coding Plan o API generale.

    <Steps>
      <Step title="Scegli l'opzione di onboarding corretta">
        ```bash
        # Coding Plan Global (consigliato per gli utenti Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (regione Cina)
        openclaw onboard --auth-choice zai-coding-cn

        # API generale
        openclaw onboard --auth-choice zai-global

        # API generale CN (regione Cina)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catalogo GLM bundled

OpenClaw al momento inizializza il provider bundled `zai` con:

| Model ref            | Note              |
| -------------------- | ----------------- |
| `zai/glm-5.1`        | Modello predefinito |
| `zai/glm-5`          |                   |
| `zai/glm-5-turbo`    |                   |
| `zai/glm-5v-turbo`   |                   |
| `zai/glm-4.7`        |                   |
| `zai/glm-4.7-flash`  |                   |
| `zai/glm-4.7-flashx` |                   |
| `zai/glm-4.6`        |                   |
| `zai/glm-4.6v`       |                   |
| `zai/glm-4.5`        |                   |
| `zai/glm-4.5-air`    |                   |
| `zai/glm-4.5-flash`  |                   |
| `zai/glm-4.5v`       |                   |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`). Il model ref bundled predefinito è `zai/glm-5.1`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Risoluzione forward dei modelli GLM-5 sconosciuti">
    Gli id sconosciuti `glm-5*` continuano a essere risolti in forward sul percorso del provider bundled
    sintetizzando metadati posseduti dal provider dal template `glm-4.7` quando l'id
    corrisponde alla forma attuale della famiglia GLM-5.
  </Accordion>

  <Accordion title="Streaming delle chiamate agli strumenti">
    `tool_stream` è abilitato per impostazione predefinita per lo streaming delle chiamate agli strumenti di Z.AI. Per disabilitarlo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Comprensione delle immagini">
    Il plugin bundled Z.AI registra la comprensione delle immagini.

    | Proprietà    | Valore      |
    | ------------ | ----------- |
    | Modello      | `glm-4.6v`  |

    La comprensione delle immagini viene risolta automaticamente dall'auth Z.AI configurata — non
    è necessaria alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli dell'auth">
    - Z.AI usa auth Bearer con la tua chiave API.
    - L'opzione di onboarding `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente dal prefisso della chiave.
    - Usa le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando vuoi forzare una specifica superficie API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Famiglia di modelli GLM" href="/it/providers/glm" icon="microchip">
    Panoramica della famiglia di modelli GLM.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, model ref e comportamento di failover.
  </Card>
</CardGroup>
