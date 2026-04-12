---
read_when:
    - Vuoi usare Cloudflare AI Gateway con OpenClaw
    - Hai bisogno dell'ID account, dell'ID del Gateway o della variabile env della chiave API
summary: Configurazione di Cloudflare AI Gateway (autenticazione + selezione del modello)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway si trova davanti alle API del provider e ti permette di aggiungere analisi, caching e controlli. Per Anthropic, OpenClaw usa l'API Anthropic Messages tramite il tuo endpoint Gateway.

| Proprietà     | Valore                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| URL di base   | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| Modello predefinito | `cloudflare-ai-gateway/claude-sonnet-4-5`                                         |
| Chiave API    | `CLOUDFLARE_AI_GATEWAY_API_KEY` (la chiave API del tuo provider per le richieste tramite il Gateway) |

<Note>
Per i modelli Anthropic instradati tramite Cloudflare AI Gateway, usa la tua **chiave API Anthropic** come chiave del provider.
</Note>

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API del provider e i dettagli del Gateway">
    Esegui l'onboarding e scegli l'opzione di autenticazione Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Ti verranno richiesti l'ID account, l'ID del Gateway e la chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    Aggiungi il modello alla configurazione di OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni scriptate o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Gateway autenticati">
    Se hai abilitato l'autenticazione Gateway in Cloudflare, aggiungi l'header `cf-aig-authorization`. Questo è **in aggiunta a** la chiave API del provider.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    L'header `cf-aig-authorization` autentica con il Gateway Cloudflare stesso, mentre la chiave API del provider (per esempio, la tua chiave Anthropic) autentica con il provider upstream.
    </Tip>

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `CLOUDFLARE_AI_GATEWAY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave presente solo in `~/.profile` non aiuterà un daemon launchd/systemd a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per garantire che il processo gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
