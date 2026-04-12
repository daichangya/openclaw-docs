---
read_when:
    - Vuoi usare Volcano Engine o i modelli Doubao con OpenClaw
    - Ti serve la configurazione della chiave API di Volcengine
summary: Configurazione di Volcano Engine (modelli Doubao, endpoint generali + per coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Il provider Volcengine offre accesso ai modelli Doubao e a modelli di terze parti
ospitati su Volcano Engine, con endpoint separati per carichi di lavoro generali e di coding.

| Detail    | Value                                               |
| --------- | --------------------------------------------------- |
| Providers | `volcengine` (generale) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | Compatibile con OpenAI                              |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding interattivo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Questo registra sia il provider generale (`volcengine`) sia il provider coding (`volcengine-plan`) a partire da una singola chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Per una configurazione non interattiva (CI, scripting), passa direttamente la chiave:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider ed endpoint

| Provider          | Endpoint                                  | Caso d'uso      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelli generali |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelli di coding |

<Note>
Entrambi i provider vengono configurati da una singola chiave API. La configurazione li registra automaticamente entrambi.
</Note>

## Modelli disponibili

<Tabs>
  <Tab title="Generale (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | testo, immagine | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | testo, immagine | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | testo, immagine | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | testo, immagine | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | testo, immagine | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | testo | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | testo | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | testo | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | testo | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | testo | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | testo | 256,000 |
  </Tab>
</Tabs>

## Note avanzate

<AccordionGroup>
  <Accordion title="Modello predefinito dopo l'onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` attualmente imposta
    `volcengine-plan/ark-code-latest` come modello predefinito registrando anche
    il catalogo generale `volcengine`.
  </Accordion>

  <Accordion title="Comportamento di fallback del selettore modelli">
    Durante l'onboarding/la configurazione della selezione del modello, la scelta auth Volcengine privilegia
    sia le righe `volcengine/*` sia le righe `volcengine-plan/*`. Se questi modelli non sono
    ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un
    selettore con ambito provider vuoto.
  </Accordion>

  <Accordion title="Variabili d'ambiente per processi daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `VOLCANO_ENGINE_API_KEY` sia disponibile per quel processo (ad esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Quando OpenClaw viene eseguito come servizio in background, le variabili d'ambiente impostate nella tua
shell interattiva non vengono ereditate automaticamente. Vedi la nota sui daemon qui sopra.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione per agent, modelli e provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
