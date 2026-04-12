---
read_when:
    - Vuoi usare i modelli Amazon Bedrock con OpenClaw
    - Ti serve la configurazione delle credenziali AWS/della regione per le chiamate ai modelli
summary: Usa i modelli Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:29:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw può usare i modelli **Amazon Bedrock** tramite il provider di streaming **Bedrock Converse**
di pi-ai. L’autenticazione Bedrock usa la **catena di credenziali predefinita dell’AWS SDK**,
non una chiave API.

| Property | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | Credenziali AWS (variabili d’ambiente, configurazione condivisa o ruolo dell’istanza) |
| Region   | `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinita: `us-east-1`) |

## Per iniziare

Scegli il tuo metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiavi di accesso / variabili d’ambiente">
    **Ideale per:** macchine di sviluppo, CI o host in cui gestisci direttamente le credenziali AWS.

    <Steps>
      <Step title="Imposta le credenziali AWS sull’host del Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Facoltativo:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Facoltativo (chiave API/token bearer Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Aggiungi un provider Bedrock e un modello alla tua configurazione">
        Non è richiesta alcuna `apiKey`. Configura il provider con `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con l’autenticazione basata su marker di ambiente (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw abilita automaticamente il provider implicito Bedrock per il rilevamento dei modelli senza configurazione aggiuntiva.
    </Tip>

  </Tab>

  <Tab title="Ruoli di istanza EC2 (IMDS)">
    **Ideale per:** istanze EC2 con un ruolo IAM associato, che usano il servizio di metadati dell’istanza per l’autenticazione.

    <Steps>
      <Step title="Abilita esplicitamente il rilevamento">
        Quando usi IMDS, OpenClaw non può rilevare l’autenticazione AWS dai soli marker di ambiente, quindi devi attivarla esplicitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Aggiungi facoltativamente un marker di ambiente per la modalità automatica">
        Se vuoi anche che il percorso di rilevamento automatico tramite marker di ambiente funzioni (ad esempio, per le superfici `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Non** ti serve una chiave API fittizia.
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Il ruolo IAM associato alla tua istanza EC2 deve avere i seguenti permessi:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (per il rilevamento automatico)
    - `bedrock:ListInferenceProfiles` (per il rilevamento dei profili di inferenza)

    Oppure associa la policy gestita `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Ti serve `AWS_PROFILE=default` solo se vuoi specificamente un marker di ambiente per la modalità automatica o per le superfici di stato. Il vero percorso di autenticazione runtime di Bedrock usa la catena predefinita dell’AWS SDK, quindi l’autenticazione IMDS con ruolo di istanza funziona anche senza marker di ambiente.
    </Note>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

OpenClaw può rilevare automaticamente i modelli Bedrock che supportano **streaming**
e **output di testo**. Il rilevamento usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e i risultati vengono memorizzati nella cache (predefinita: 1 ora).

Come viene abilitato il provider implicito:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` è `true`,
  OpenClaw proverà il rilevamento anche quando non è presente alcun marker di ambiente AWS.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` non è impostato,
  OpenClaw aggiunge automaticamente il provider implicito Bedrock
  solo quando vede uno di questi marker di autenticazione AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, oppure `AWS_PROFILE`.
- Il vero percorso di autenticazione runtime di Bedrock usa comunque la catena predefinita dell’AWS SDK, quindi
  configurazione condivisa, SSO e autenticazione IMDS con ruolo di istanza possono funzionare anche quando il rilevamento
  ha richiesto `enabled: true` per l’attivazione esplicita.

<Note>
Per le voci esplicite `models.providers["amazon-bedrock"]`, OpenClaw può comunque risolvere anticipatamente l’autenticazione Bedrock basata su marker di ambiente dai marker AWS come `AWS_BEARER_TOKEN_BEDROCK` senza forzare il caricamento completo dell’autenticazione runtime. Il vero percorso di autenticazione per le chiamate al modello usa comunque la catena predefinita dell’AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opzioni di configurazione del rilevamento">
    Le opzioni di configurazione si trovano sotto `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Option | Default | Description |
    | ------ | ------- | ----------- |
    | `enabled` | auto | In modalità automatica, OpenClaw abilita il provider implicito Bedrock solo quando vede un marker di ambiente AWS supportato. Imposta `true` per forzare il rilevamento. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Regione AWS usata per le chiamate API di rilevamento. |
    | `providerFilter` | (tutti) | Corrisponde ai nomi dei provider Bedrock (ad esempio `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durata della cache in secondi. Imposta `0` per disabilitare la cache. |
    | `defaultContextWindow` | `32000` | Finestra di contesto usata per i modelli rilevati (sostituiscila se conosci i limiti del tuo modello). |
    | `defaultMaxTokens` | `4096` | Numero massimo di token in output usato per i modelli rilevati (sostituiscilo se conosci i limiti del tuo modello). |

  </Accordion>
</AccordionGroup>

## Configurazione rapida (percorso AWS)

Questa procedura crea un ruolo IAM, associa i permessi Bedrock, collega
il profilo di istanza e abilita il rilevamento OpenClaw sull’host EC2.

```bash
# 1. Crea il ruolo IAM e il profilo di istanza
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Associalo alla tua istanza EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Sull’istanza EC2, abilita esplicitamente il rilevamento
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Facoltativo: aggiungi un marker di ambiente se vuoi la modalità automatica senza abilitazione esplicita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifica che i modelli vengano rilevati
openclaw models list
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Profili di inferenza">
    OpenClaw rileva **profili di inferenza regionali e globali** insieme ai
    modelli foundation. Quando un profilo corrisponde a un modello foundation noto, il
    profilo eredita le capacità di quel modello (finestra di contesto, numero massimo di token,
    reasoning, visione) e la corretta regione di richiesta Bedrock viene inserita
    automaticamente. Questo significa che i profili Claude cross-region funzionano senza sostituzioni manuali del provider.

    Gli ID dei profili di inferenza hanno un aspetto come `us.anthropic.claude-opus-4-6-v1:0` (regionale)
    oppure `anthropic.claude-opus-4-6-v1:0` (globale). Se il modello sottostante è già
    nei risultati del rilevamento, il profilo eredita il suo set completo di capacità;
    altrimenti si applicano valori predefiniti sicuri.

    Non è richiesta alcuna configurazione aggiuntiva. Finché il rilevamento è abilitato e il principal IAM
    ha `bedrock:ListInferenceProfiles`, i profili compaiono insieme ai
    modelli foundation in `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrail">
    Puoi applicare le [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a tutte le invocazioni di modelli Bedrock aggiungendo un oggetto `guardrail` alla
    configurazione del plugin `amazon-bedrock`. Le Guardrails ti permettono di applicare filtraggio dei contenuti,
    blocco di argomenti, filtri di parole, filtri per informazioni sensibili e controlli di
    ancoraggio contestuale.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID guardrail o ARN completo
                guardrailVersion: "1", // numero di versione o "DRAFT"
                streamProcessingMode: "sync", // facoltativo: "sync" o "async"
                trace: "enabled", // facoltativo: "enabled", "disabled" o "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Required | Description |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sì | ID della guardrail (ad es. `abc123`) o ARN completo (ad es. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sì | Numero di versione pubblicata oppure `"DRAFT"` per la bozza di lavoro. |
    | `streamProcessingMode` | No | `"sync"` oppure `"async"` per la valutazione della guardrail durante lo streaming. Se omesso, Bedrock usa il proprio valore predefinito. |
    | `trace` | No | `"enabled"` oppure `"enabled_full"` per il debug; omettilo oppure imposta `"disabled"` per la produzione. |

    <Warning>
    Il principal IAM usato dal Gateway deve avere il permesso `bedrock:ApplyGuardrail` oltre ai normali permessi di invocazione.
    </Warning>

  </Accordion>

  <Accordion title="Embedding per la ricerca nella memoria">
    Bedrock può servire anche come provider di embedding per
    [Memory Search](/it/concepts/memory-search). Questo si configura separatamente dal
    provider di inferenza: imposta `agents.defaults.memorySearch.provider` su `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // predefinito
          },
        },
      },
    }
    ```

    Gli embedding Bedrock usano la stessa catena di credenziali AWS SDK dell’inferenza (ruoli
    di istanza, SSO, chiavi di accesso, configurazione condivisa e web identity). Non è necessaria
    alcuna chiave API. Quando `provider` è `"auto"`, Bedrock viene rilevato automaticamente se quella
    catena di credenziali viene risolta con successo.

    I modelli di embedding supportati includono Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulta
    [Riferimento della configurazione della memoria -- Bedrock](/it/reference/memory-config#bedrock-embedding-config)
    per l’elenco completo dei modelli e le opzioni di dimensione.

  </Accordion>

  <Accordion title="Note e limitazioni">
    - Bedrock richiede che l’**accesso al modello** sia abilitato nel tuo account/regione AWS.
    - Il rilevamento automatico richiede i permessi `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se ti affidi alla modalità automatica, imposta uno dei marker di autenticazione AWS supportati sull’host
      del Gateway. Se preferisci l’autenticazione IMDS/configurazione condivisa senza marker di ambiente, imposta
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw mostra l’origine delle credenziali in questo ordine: `AWS_BEARER_TOKEN_BEDROCK`,
      poi `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, poi `AWS_PROFILE`, poi la
      catena predefinita dell’AWS SDK.
    - Il supporto al reasoning dipende dal modello; controlla la scheda del modello Bedrock per
      le capacità aggiornate.
    - Se preferisci un flusso con chiave gestita, puoi anche mettere un proxy
      compatibile con OpenAI davanti a Bedrock e configurarlo invece come provider OpenAI.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="Memory Search" href="/it/concepts/memory-search" icon="magnifying-glass">
    Configurazione degli embedding Bedrock per la ricerca nella memoria.
  </Card>
  <Card title="Riferimento della configurazione della memoria" href="/it/reference/memory-config#bedrock-embedding-config" icon="database">
    Elenco completo dei modelli di embedding Bedrock e delle opzioni di dimensione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
