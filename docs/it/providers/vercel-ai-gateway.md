---
read_when:
    - Vuoi usare Vercel AI Gateway con OpenClaw
    - Hai bisogno della variabile d'ambiente della chiave API o della scelta di autenticazione della CLI
summary: Configurazione di Vercel AI Gateway (autenticazione + selezione del modello)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:32:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Il [Vercel AI Gateway](https://vercel.com/ai-gateway) fornisce un'API unificata per
accedere a centinaia di modelli tramite un singolo endpoint.

| Proprietà      | Valore                         |
| -------------- | ------------------------------ |
| Provider       | `vercel-ai-gateway`            |
| Auth           | `AI_GATEWAY_API_KEY`           |
| API            | compatibile con Anthropic Messages |
| Catalogo modelli | rilevato automaticamente tramite `/v1/models` |

<Tip>
OpenClaw rileva automaticamente il catalogo `/v1/models` del Gateway, quindi
`/models vercel-ai-gateway` include i model ref correnti come
`vercel-ai-gateway/openai/gpt-5.4`.
</Tip>

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding e scegli l'opzione di autenticazione AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Imposta un modello predefinito">
    Aggiungi il modello alla tua configurazione OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni scriptate o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abbreviazione dell'ID modello

OpenClaw accetta model ref abbreviati di Vercel Claude e li normalizza a
runtime:

| Input abbreviato                    | Model ref normalizzato                       |
| ----------------------------------- | -------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puoi usare sia l'abbreviazione sia il model ref completamente qualificato nella tua
configurazione. OpenClaw risolve automaticamente la forma canonica.
</Tip>

## Note avanzate

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi daemon">
    Se il Gateway OpenClaw è in esecuzione come daemon (launchd/systemd), assicurati che
    `AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave impostata solo in `~/.profile` non sarà visibile a un daemon launchd/systemd
    a meno che quell'ambiente non venga importato esplicitamente. Imposta la chiave in
    `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo gateway possa
    leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Instradamento del provider">
    Vercel AI Gateway instrada le richieste al provider upstream in base al
    prefisso del model ref. Per esempio, `vercel-ai-gateway/anthropic/claude-opus-4.6` viene instradato
    tramite Anthropic, mentre `vercel-ai-gateway/openai/gpt-5.4` viene instradato tramite
    OpenAI. La tua singola `AI_GATEWAY_API_KEY` gestisce l'autenticazione per tutti i
    provider upstream.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
