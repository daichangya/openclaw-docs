---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - Hai bisogno di configurazione/stato/porte isolati per ogni Gateway
summary: Eseguire più Gateway OpenClaw su un singolo host (isolamento, porte e profili)
title: Gateway multipli
x-i18n:
    generated_at: "2026-04-25T13:47:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

La maggior parte delle configurazioni dovrebbe usare un solo Gateway perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento più forte o di ridondanza (ad esempio un bot di recupero), esegui Gateway separati con profili/porte isolati.

## Configurazione migliore consigliata

Per la maggior parte degli utenti, la configurazione più semplice per un bot di recupero è:

- mantenere il bot principale sul profilo predefinito
- eseguire il bot di recupero con `--profile rescue`
- usare un bot Telegram completamente separato per l'account di recupero
- mantenere il bot di recupero su una porta base diversa, ad esempio `19789`

Questo mantiene il bot di recupero isolato dal bot principale così può eseguire debug o applicare
modifiche di configurazione se il bot primario è fuori servizio. Lascia almeno 20 porte di distanza tra le
porte base così le porte derivate di browser/canvas/CDP non entreranno mai in conflitto.

## Avvio rapido del bot di recupero

Usalo come percorso predefinito a meno che tu non abbia un motivo forte per fare
diversamente:

```bash
# Bot di recupero (bot Telegram separato, profilo separato, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il tuo bot principale è già in esecuzione, di solito è tutto ciò che ti serve.

Durante `openclaw --profile rescue onboard`:

- usa il token del bot Telegram separato
- mantieni il profilo `rescue`
- usa una porta base almeno 20 più alta rispetto al bot principale
- accetta il workspace di recupero predefinito a meno che tu non ne gestisca già uno

Se l'onboarding ha già installato il servizio di recupero per te, il comando finale
`gateway install` non è necessario.

## Perché funziona

Il bot di recupero resta indipendente perché ha il proprio:

- profilo/configurazione
- directory di stato
- workspace
- porta base (più porte derivate)
- token del bot Telegram

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di recupero:

- facile da mantenere solo per operatori
- token e identità del bot separati
- indipendente dall'installazione del canale/app del bot principale
- semplice percorso di recupero basato su DM quando il bot principale è guasto

## Cosa cambia con `--profile rescue onboard`

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma
scrive tutto in un profilo separato.

In pratica, questo significa che il bot di recupero ottiene il proprio:

- file di configurazione
- directory di stato
- workspace (per impostazione predefinita `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono gli stessi del normale onboarding.

## Configurazione generale multi-Gateway

La disposizione del bot di recupero qui sopra è il valore predefinito più semplice, ma lo stesso schema
di isolamento funziona per qualsiasi coppia o gruppo di Gateway su un singolo host.

Per una configurazione più generale, assegna a ogni Gateway aggiuntivo il proprio profilo nominato e la
propria porta base:

```bash
# main (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# gateway aggiuntivo
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Se vuoi che entrambi i Gateway usino profili nominati, funziona ugualmente:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

I servizi seguono lo stesso schema:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa l'avvio rapido del bot di recupero quando vuoi una corsia operatore di fallback. Usa lo
schema generale con profili quando vuoi più Gateway di lunga durata per
canali, tenant, workspace o ruoli operativi differenti.

## Checklist di isolamento

Mantieni unici questi elementi per ogni istanza Gateway:

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali, cache per istanza
- `agents.defaults.workspace` — root workspace per istanza
- `gateway.port` (o `--port`) — univoco per istanza
- porte browser/canvas/CDP derivate

Se questi elementi sono condivisi, avrai race di configurazione e conflitti di porta.

## Mappatura porte (derivata)

Porta base = `gateway.port` (oppure `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo browser = base + 2 (solo loopback)
- l'host canvas è servito dal server HTTP Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sovrascrivi uno di questi valori in config o env, devi mantenerli unici per istanza.

## Note browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` agli stessi valori su più istanze.
- Ogni istanza ha bisogno della propria porta di controllo browser e del proprio intervallo CDP (derivato dalla sua porta gateway).
- Se ti servono porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio env manuale

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Controlli rapidi

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretazione:

- `gateway status --deep` aiuta a individuare servizi launchd/systemd/schtasks obsoleti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, ad esempio `multiple reachable gateways detected`, è previsto solo quando esegui intenzionalmente più gateway isolati.

## Correlati

- [Runbook Gateway](/it/gateway)
- [Lock del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
