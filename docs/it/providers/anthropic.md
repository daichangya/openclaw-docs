---
read_when:
    - Vuoi usare i modelli Anthropic in OpenClaw
summary: Usa Anthropic Claude tramite chiavi API o Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T23:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic sviluppa la famiglia di modelli **Claude**. OpenClaw supporta due modalità di autenticazione:

- **Chiave API** — accesso diretto all'API Anthropic con fatturazione basata sull'utilizzo (modelli `anthropic/*`)
- **Claude CLI** — riuso di un accesso Claude CLI esistente sullo stesso host

<Warning>
Lo staff di Anthropic ci ha detto che l'utilizzo di Claude CLI in stile OpenClaw è di nuovo consentito, quindi
OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come approvati, a meno che
Anthropic non pubblichi una nuova policy.

Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque il percorso di produzione più chiaro e
prevedibile.

Documentazione pubblica attuale di Anthropic:

- [Riferimento Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Panoramica di Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usare Claude Code con il piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usare Claude Code con il piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## Per iniziare

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso API standard e fatturazione basata sull'utilizzo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea una chiave API nella [Console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # scegli: chiave API Anthropic
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideale per:** riutilizzare un accesso Claude CLI esistente senza una chiave API separata.

    <Steps>
      <Step title="Assicurati che Claude CLI sia installato e che l'accesso sia effettuato">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        # scegli: Claude CLI
        ```

        OpenClaw rileva e riutilizza le credenziali Claude CLI esistenti.
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    I dettagli di configurazione e runtime per il backend Claude CLI sono in [CLI Backends](/it/gateway/cli-backends).
    </Note>

    <Tip>
    Se vuoi il percorso di fatturazione più chiaro, usa invece una chiave API Anthropic. OpenClaw supporta anche opzioni in stile abbonamento da [OpenAI Codex](/it/providers/openai), [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Z.AI / GLM](/it/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valori predefiniti di thinking (Claude 4.6)

I modelli Claude 4.6 usano per impostazione predefinita il thinking `adaptive` in OpenClaw quando non è impostato alcun livello di thinking esplicito.

Sovrascrivi per messaggio con `/think:<level>` o nei parametri del modello:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentazione Anthropic correlata:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Caching del prompt

OpenClaw supporta la funzionalità di caching del prompt di Anthropic per l'autenticazione tramite chiave API.

| Valore              | Durata cache | Descrizione                                 |
| ------------------- | ------------ | ------------------------------------------- |
| `"short"` (predefinito) | 5 minuti     | Applicato automaticamente per l'autenticazione con chiave API |
| `"long"`            | 1 ora        | Cache estesa                                |
| `"none"`            | Nessuna cache | Disabilita il caching del prompt            |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override della cache per agente">
    Usa i parametri a livello di modello come baseline, poi sovrascrivi agenti specifici tramite `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordine di merge della configurazione:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` corrispondente, sovrascrive per chiave)

    Questo consente a un agente di mantenere una cache di lunga durata mentre un altro agente sullo stesso modello disabilita il caching per traffico intermittente o con basso riutilizzo.

  </Accordion>

  <Accordion title="Note su Bedrock Claude">
    - I modelli Anthropic Claude su Bedrock (`amazon-bedrock/*anthropic.claude*`) accettano il pass-through di `cacheRetention` quando configurato.
    - I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.
    - I valori predefiniti intelligenti per l'autenticazione con chiave API impostano anche `cacheRetention: "short"` per i riferimenti Claude-on-Bedrock quando non è impostato alcun valore esplicito.
  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità fast">
    L'interruttore condiviso `/fast` di OpenClaw supporta traffico Anthropic diretto (chiave API e OAuth verso `api.anthropic.com`).

    | Comando | Corrisponde a |
    |---------|---------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Inserito solo per richieste dirette a `api.anthropic.com`. I percorsi proxy lasciano `service_tier` invariato.
    - Parametri espliciti `serviceTier` o `service_tier` sovrascrivono `/fast` quando entrambi sono impostati.
    - Negli account senza capacità Priority Tier, `service_tier: "auto"` può risolversi in `standard`.
    </Note>

  </Accordion>

  <Accordion title="Comprensione dei media (immagini e PDF)">
    Il plugin Anthropic integrato registra la comprensione di immagini e PDF. OpenClaw
    risolve automaticamente le capacità multimediali dall'autenticazione Anthropic configurata — non è necessaria
    alcuna configurazione aggiuntiva.

    | Proprietà       | Valore               |
    | --------------- | -------------------- |
    | Modello predefinito | `claude-opus-4-6` |
    | Input supportato | Immagini, documenti PDF |

    Quando un'immagine o un PDF viene allegato a una conversazione, OpenClaw lo instrada automaticamente attraverso il provider Anthropic per la comprensione dei media.

  </Accordion>

  <Accordion title="Finestra di contesto da 1M (beta)">
    La finestra di contesto da 1M di Anthropic è protetta da beta. Abilitala per modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw la mappa in `anthropic-beta: context-1m-2025-08-07` nelle richieste.

    <Warning>
    Richiede accesso long-context sulla tua credenziale Anthropic. L'autenticazione token legacy (`sk-ant-oat-*`) viene rifiutata per le richieste con contesto 1M — OpenClaw registra un avviso e torna alla finestra di contesto standard.
    </Warning>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori 401 / token improvvisamente non valido">
    L'autenticazione token Anthropic può scadere o essere revocata. Per le nuove configurazioni, passa a una chiave API Anthropic.
  </Accordion>

  <Accordion title='Nessuna chiave API trovata per il provider "anthropic"'>
    L'autenticazione è **per agente**. I nuovi agenti non ereditano le chiavi dell'agente principale. Riesegui l'onboarding per quell'agente oppure configura una chiave API sull'host Gateway, poi verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='Nessuna credenziale trovata per il profilo "anthropic:default"'>
    Esegui `openclaw models status` per vedere quale profilo di autenticazione è attivo. Riesegui l'onboarding oppure configura una chiave API per il percorso di quel profilo.
  </Accordion>

  <Accordion title="Nessun profilo di autenticazione disponibile (tutti in cooldown)">
    Controlla `openclaw models status --json` per `auth.unusableProfiles`. I cooldown del rate limit Anthropic possono essere limitati al modello, quindi un modello Anthropic correlato potrebbe essere ancora utilizzabile. Aggiungi un altro profilo Anthropic oppure attendi la fine del cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Troubleshooting](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Backend CLI" href="/it/gateway/cli-backends" icon="terminal">
    Configurazione del backend Claude CLI e dettagli di runtime.
  </Card>
  <Card title="Caching del prompt" href="/it/reference/prompt-caching" icon="database">
    Come funziona il caching del prompt tra i vari provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
