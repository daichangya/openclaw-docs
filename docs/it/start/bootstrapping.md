---
read_when:
    - Capire cosa succede alla prima esecuzione dell'agente
    - Spiegare dove si trovano i file di bootstrap
    - Debug dell'impostazione dell'identità di onboarding
sidebarTitle: Bootstrapping
summary: Rituale di bootstrap dell'agente che inizializza i file dell'area di lavoro e dell'identità
title: Bootstrap dell'agente
x-i18n:
    generated_at: "2026-04-25T13:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

Il bootstrapping è il rituale di **prima esecuzione** che prepara un workspace dell'agente e
raccoglie i dettagli dell'identità. Avviene dopo l'onboarding, quando l'agente si avvia
per la prima volta.

## Cosa fa il bootstrapping

Alla prima esecuzione dell'agente, OpenClaw esegue il bootstrapping del workspace (predefinito
`~/.openclaw/workspace`):

- Inizializza `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Esegue un breve rituale di domande e risposte (una domanda alla volta).
- Scrive identità + preferenze in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Rimuove `BOOTSTRAP.md` al termine, così viene eseguito una sola volta.

## Saltare il bootstrapping

Per saltarlo in un workspace già inizializzato, esegui `openclaw onboard --skip-bootstrap`.

## Dove viene eseguito

Il bootstrapping viene sempre eseguito sull'**host del Gateway**. Se l'app macOS si connette a
un Gateway remoto, il workspace e i file di bootstrapping si trovano su quella macchina remota.

<Note>
Quando il Gateway viene eseguito su un'altra macchina, modifica i file del workspace sull'host del gateway
(ad esempio, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentazione correlata

- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Struttura del workspace: [Workspace dell'agente](/it/concepts/agent-workspace)
