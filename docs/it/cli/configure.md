---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o valori predefiniti degli agenti
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattiva)
title: Configura
x-i18n:
    generated_at: "2026-04-25T13:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e valori predefiniti degli agenti.

Nota: la sezione **Model** ora include una selezione multipla per la allowlist
`agents.defaults.models` (ciò che viene mostrato in `/model` e nel selettore del modello).
Le scelte di configurazione con ambito provider uniscono i modelli selezionati alla
allowlist esistente invece di sostituire provider non correlati già presenti nella configurazione.
Rieseguire l'autenticazione del provider da configure preserva un valore esistente di
`agents.defaults.model.primary`; usa `openclaw models auth login --provider <id> --set-default`
oppure `openclaw models set <model>` quando vuoi intenzionalmente cambiare il modello predefinito.

Quando configure parte da una scelta di autenticazione del provider, i selettori del
modello predefinito e della allowlist danno automaticamente priorità a quel provider. Per provider accoppiati come
Volcengine/BytePlus, la stessa preferenza corrisponde anche alle loro varianti
del piano coding (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del
provider preferito produrrebbe un elenco vuoto, configure torna al catalogo
non filtrato invece di mostrare un selettore vuoto.

Suggerimento: `openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa
`openclaw config get|set|unset` per modifiche non interattive.

Per la ricerca web, `openclaw configure --section web` ti permette di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt successivi specifici del provider:

- **Grok** può offrire una configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  permetterti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

Correlati:

- Riferimento della configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- Config CLI: [Config](/it/cli/config)

## Opzioni

- `--section <section>`: filtro di sezione ripetibile

Sezioni disponibili:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Note:

- Scegliere dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continua" senza altre sezioni se è tutto ciò di cui hai bisogno.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono liste di consentiti di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e, se `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non rende persistenti i valori di token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni operative per la correzione.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, configure blocca l'installazione del daemon finché la modalità non viene impostata esplicitamente.

## Esempi

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
