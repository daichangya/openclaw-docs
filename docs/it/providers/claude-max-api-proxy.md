---
read_when:
    - Vuoi usare l'abbonamento Claude Max con strumenti compatibili con OpenAI
    - Vuoi un server API locale che incapsula la CLI di Claude Code
    - Vuoi valutare l'accesso Anthropic basato su abbonamento rispetto a quello basato su chiave API
summary: Proxy della community per esporre le credenziali di abbonamento Claude come endpoint compatibile con OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-04-12T23:29:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Proxy API Claude Max

**claude-max-api-proxy** è uno strumento della community che espone il tuo abbonamento Claude Max/Pro come endpoint API compatibile con OpenAI. Questo ti consente di usare il tuo abbonamento con qualsiasi strumento che supporti il formato API di OpenAI.

<Warning>
Questo percorso offre solo compatibilità tecnica. In passato Anthropic ha bloccato alcuni utilizzi dell'abbonamento
al di fuori di Claude Code. Devi decidere autonomamente se usarlo
e verificare i termini attuali di Anthropic prima di farci affidamento.
</Warning>

## Perché usarlo?

| Approccio               | Costo                                               | Ideale per                                 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API Anthropic           | Pagamento per token (~$15/M input, $75/M output per Opus) | App di produzione, alto volume             |
| Abbonamento Claude Max  | $200/mese fissi                                     | Uso personale, sviluppo, utilizzo illimitato |

Se hai un abbonamento Claude Max e vuoi usarlo con strumenti compatibili con OpenAI, questo proxy può ridurre i costi per alcuni flussi di lavoro. Le chiavi API restano il percorso di policy più chiaro per l'uso in produzione.

## Come funziona

```
La tua app → claude-max-api-proxy → Claude Code CLI → Anthropic (tramite abbonamento)
(formato OpenAI)               (converte il formato)       (usa il tuo login)
```

Il proxy:

1. Accetta richieste in formato OpenAI su `http://localhost:3456/v1/chat/completions`
2. Le converte in comandi Claude Code CLI
3. Restituisce risposte in formato OpenAI (streaming supportato)

## Per iniziare

<Steps>
  <Step title="Installa il proxy">
    Richiede Node.js 20+ e Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifica che Claude CLI sia autenticata
    claude --version
    ```

  </Step>
  <Step title="Avvia il server">
    ```bash
    claude-max-api
    # Il server è in esecuzione su http://localhost:3456
    ```
  </Step>
  <Step title="Testa il proxy">
    ```bash
    # Controllo di stato
    curl http://localhost:3456/health

    # Elenca i modelli
    curl http://localhost:3456/v1/models

    # Completamento chat
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configura OpenClaw">
    Punta OpenClaw al proxy come endpoint personalizzato compatibile con OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Modelli disponibili

| ID modello         | Corrisponde a   |
| ------------------ | --------------- |
| `claude-opus-4`    | Claude Opus 4   |
| `claude-sonnet-4`  | Claude Sonnet 4 |
| `claude-haiku-4`   | Claude Haiku 4  |

## Avanzato

<AccordionGroup>
  <Accordion title="Note sul percorso compatibile con OpenAI in stile proxy">
    Questo percorso usa lo stesso instradamento compatibile con OpenAI in stile proxy degli altri backend personalizzati
    `/v1`:

    - Il modellamento nativo delle richieste solo OpenAI non si applica
    - Nessun `service_tier`, nessun Responses `store`, nessun suggerimento per la prompt cache e nessun
      modellamento del payload di compatibilità del ragionamento OpenAI
    - Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`)
      non vengono iniettati nell'URL del proxy

  </Accordion>

  <Accordion title="Avvio automatico su macOS con LaunchAgent">
    Crea un LaunchAgent per eseguire automaticamente il proxy:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Link

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issue:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Note

- Questo è uno **strumento della community**, non supportato ufficialmente da Anthropic o OpenClaw
- Richiede un abbonamento Claude Max/Pro attivo con Claude Code CLI autenticata
- Il proxy viene eseguito localmente e non invia dati a server di terze parti
- Le risposte in streaming sono pienamente supportate

<Note>
Per l'integrazione nativa Anthropic con Claude CLI o chiavi API, vedi [provider Anthropic](/it/providers/anthropic). Per gli abbonamenti OpenAI/Codex, vedi [provider OpenAI](/it/providers/openai).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider Anthropic" href="/it/providers/anthropic" icon="bolt">
    Integrazione OpenClaw nativa con Claude CLI o chiavi API.
  </Card>
  <Card title="Provider OpenAI" href="/it/providers/openai" icon="robot">
    Per gli abbonamenti OpenAI/Codex.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
