---
read_when:
    - Vuoi comprendere OAuth in OpenClaw end-to-end
    - Hai riscontrato problemi di invalidazione del token / logout
    - Vuoi flussi di autenticazione Claude CLI o OAuth
    - Vuoi più account o l'instradamento dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw supporta la “subscription auth” tramite OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la suddivisione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione API Anthropic
- **Anthropic Claude CLI / subscription auth all'interno di OpenClaw**: il personale Anthropic
  ci ha detto che questo utilizzo è di nuovo consentito

OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw. Questa pagina spiega:

Per Anthropic in produzione, l'autenticazione con chiave API è il percorso consigliato più sicuro.

- come funziona lo **scambio di token** OAuth (PKCE)
- dove i token vengono **archiviati** (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **provider Plugin** che distribuiscono i propri flussi OAuth o con chiave API.
Eseguili tramite:

```bash
openclaw models auth login --provider <id>
```

## Il token sink (perché esiste)

I provider OAuth spesso generano un **nuovo refresh token** durante i flussi di login/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token più vecchi quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- accedi tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due in seguito risulta casualmente “disconnesso”

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **token sink**:

- il runtime legge le credenziali da **un solo posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- il riutilizzo della CLI esterna dipende dal provider: Codex CLI può inizializzare un profilo vuoto
  `openai-codex:default`, ma una volta che OpenClaw ha un profilo OAuth locale,
  il refresh token locale è canonico; altre integrazioni possono restare
  gestite esternamente e rileggere il proprio archivio auth della CLI

## Archiviazione (dove vivono i token)

I segreti sono archiviati **per agente**:

- Profili auth (OAuth + chiavi API + riferimenti opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando individuate)

File legacy solo per importazione (ancora supportato, ma non archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutto quanto sopra rispetta anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti a segreti statici e il comportamento di attivazione degli snapshot a runtime, vedi [Secrets Management](/it/gateway/secrets).

## Compatibilità legacy dei token Anthropic

<Warning>
La documentazione pubblica di Claude Code di Anthropic afferma che l'uso diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e il personale Anthropic ci ha detto che l'uso di Claude
CLI in stile OpenClaw è di nuovo consentito. OpenClaw quindi tratta il riutilizzo di Claude CLI e
l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic
non pubblichi una nuova policy.

Per la documentazione attuale di Anthropic sui piani diretti Claude Code, vedi [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, vedi [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/glm).
</Warning>

OpenClaw espone anche il setup-token Anthropic come percorso supportato di autenticazione con token, ma ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.

## Migrazione ad Anthropic Claude CLI

OpenClaw supporta di nuovo il riutilizzo di Anthropic Claude CLI. Se hai già un
login Claude locale sull'host, onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona il login)

I flussi di login interattivi di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati ai wizard/comandi.

### Setup-token Anthropic

Forma del flusso:

1. avvia setup-token Anthropic o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo auth
3. la selezione del modello resta su `anthropic/...`
4. i profili auth Anthropic esistenti restano disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori di Codex CLI, inclusi i flussi di lavoro OpenClaw.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non può fare bind (o sei in remoto/headless), incolla l'URL/code di redirect
5. effettua lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dall'access token e archivia `{ access, refresh, expires, accountId }`

Il percorso del wizard è `openclaw onboard` → scelta auth `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa l'access token archiviato
- se è scaduto → esegui il refresh (sotto file lock) e sovrascrivi le credenziali archiviate
- eccezione: alcune credenziali CLI esterne restano gestite esternamente; OpenClaw
  rilegge quegli archivi auth della CLI invece di usare refresh token copiati.
  L'inizializzazione di Codex CLI è intenzionalmente più limitata: semina un profilo vuoto
  `openai-codex:default`, poi i refresh gestiti da OpenClaw mantengono canonico
  il profilo locale.

Il flusso di refresh è automatico; in genere non devi gestire i token manualmente.

## Più account (profili) + instradamento

Due modelli:

### 1) Consigliato: agenti separati

Se vuoi che “personale” e “lavoro” non interagiscano mai, usa agenti isolati (sessioni + credenziali + spazio di lavoro separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l'auth per agente (wizard) e instrada le chat all'agente corretto.

### 2) Avanzato: più profili in un agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo usare:

- globalmente tramite ordinamento della configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documentazione correlata:

- [Model failover](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [Slash commands](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Authentication](/it/gateway/authentication) — panoramica dell'autenticazione dei provider di modelli
- [Secrets](/it/gateway/secrets) — archiviazione delle credenziali e SecretRef
- [Configuration Reference](/it/gateway/configuration-reference#auth-storage) — chiavi di configurazione auth
