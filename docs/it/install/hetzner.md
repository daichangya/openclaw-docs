---
read_when:
    - Vuoi che OpenClaw sia in esecuzione 24/7 su un VPS cloud (non sul tuo laptop)
    - Vuoi un Gateway di livello production, sempre attivo, sul tuo VPS
    - Vuoi il controllo completo su persistenza, binari e comportamento di riavvio
    - Stai eseguendo OpenClaw in Docker su Hetzner o un provider simile
summary: Esegui OpenClaw Gateway 24/7 su un VPS Hetzner economico (Docker) con stato persistente e binari inclusi
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw su Hetzner (Docker, guida per VPS production)

## Obiettivo

Eseguire un Gateway OpenClaw persistente su un VPS Hetzner usando Docker, con stato durevole, binari inclusi nell'immagine e comportamento di riavvio sicuro.

Se vuoi “OpenClaw 24/7 per circa $5”, questa è la configurazione affidabile più semplice.
I prezzi di Hetzner cambiano; scegli il VPS Debian/Ubuntu più piccolo e aumenta le risorse se incontri OOM.

Promemoria sul modello di sicurezza:

- Gli agenti condivisi in azienda vanno bene quando tutti rientrano nello stesso confine di fiducia e il runtime è solo per uso aziendale.
- Mantieni una separazione rigorosa: VPS/runtime dedicato + account dedicati; niente profili personali Apple/Google/browser/password manager su quell'host.
- Se gli utenti sono avversari tra loro, separa per gateway/host/utente OS.

Vedi [Security](/it/gateway/security) e [VPS hosting](/it/vps).

## Cosa stiamo facendo (in parole semplici)?

- Noleggiare un piccolo server Linux (VPS Hetzner)
- Installare Docker (runtime applicativo isolato)
- Avviare il Gateway OpenClaw in Docker
- Rendere persistenti `~/.openclaw` + `~/.openclaw/workspace` sull'host (sopravvive a riavvii/ricostruzioni)
- Accedere alla Control UI dal tuo laptop tramite un tunnel SSH

Lo stato montato in `~/.openclaw` include `openclaw.json`, il file per agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

È possibile accedere al Gateway tramite:

- Inoltro di porta SSH dal tuo laptop
- Esposizione diretta della porta se gestisci tu stesso firewall e token

Questa guida presuppone Ubuntu o Debian su Hetzner.  
Se usi un altro VPS Linux, adatta i pacchetti di conseguenza.
Per il flusso Docker generico, vedi [Docker](/it/install/docker).

---

## Percorso rapido (operatori esperti)

1. Provisioning del VPS Hetzner
2. Installazione di Docker
3. Clonazione del repository OpenClaw
4. Creazione delle directory host persistenti
5. Configurazione di `.env` e `docker-compose.yml`
6. Inclusione dei binari richiesti nell'immagine
7. `docker compose up -d`
8. Verifica della persistenza e dell'accesso al Gateway

---

## Cosa ti serve

- VPS Hetzner con accesso root
- Accesso SSH dal tuo laptop
- Familiarità di base con SSH + copia/incolla
- ~20 minuti
- Docker e Docker Compose
- Credenziali di autenticazione del modello
- Credenziali opzionali dei provider
  - QR WhatsApp
  - Token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Esegui il provisioning del VPS">
    Crea un VPS Ubuntu o Debian in Hetzner.

    Connettiti come root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Questa guida presuppone che il VPS sia con stato persistente.
    Non trattarlo come infrastruttura usa e getta.

  </Step>

  <Step title="Installa Docker (sul VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifica:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clona il repository OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Questa guida presuppone che tu voglia creare un'immagine personalizzata per garantire la persistenza dei binari.

  </Step>

  <Step title="Crea directory host persistenti">
    I container Docker sono effimeri.
    Tutto lo stato a lunga durata deve trovarsi sull'host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Imposta la proprietà all'utente del container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configura le variabili d'ambiente">
    Crea `.env` nella radice del repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Lascia `OPENCLAW_GATEWAY_TOKEN` vuoto a meno che tu non voglia esplicitamente
    gestirlo tramite `.env`; OpenClaw scrive un token gateway casuale nella
    configurazione al primo avvio. Genera una password per il keyring e incollala in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non fare commit di questo file.**

    Questo file `.env` è per l'ambiente del container/runtime, ad esempio `OPENCLAW_GATEWAY_TOKEN`.
    L'autenticazione OAuth/API key dei provider memorizzata si trova nel mount di
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configurazione Docker Compose">
    Crea o aggiorna `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Consigliato: mantieni il Gateway accessibile solo in loopback sul VPS; accedi tramite tunnel SSH.
          # Per esporlo pubblicamente, rimuovi il prefisso `127.0.0.1:` e configura il firewall di conseguenza.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` serve solo per comodità durante il bootstrap, non sostituisce una configurazione corretta del gateway. Imposta comunque l'autenticazione (`gateway.auth.token` o password) e usa impostazioni di bind sicure per il tuo deployment.

  </Step>

  <Step title="Passaggi runtime condivisi per Docker VM">
    Usa la guida runtime condivisa per il flusso host Docker comune:

    - [Includi i binari richiesti nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e avvio](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa persiste e dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accesso specifico per Hetzner">
    Dopo i passaggi condivisi di build e avvio, crea un tunnel dal tuo laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Apri:

    `http://127.0.0.1:18789/`

    Incolla il segreto condiviso configurato. Questa guida usa il token gateway per
    impostazione predefinita; se sei passato all'autenticazione con password, usa invece quella password.

  </Step>
</Steps>

La mappa condivisa della persistenza si trova in [Docker VM Runtime](/it/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Per i team che preferiscono flussi Infrastructure as Code, una configurazione Terraform gestita dalla community offre:

- Configurazione Terraform modulare con gestione dello stato remoto
- Provisioning automatizzato tramite cloud-init
- Script di deployment (bootstrap, deploy, backup/restore)
- Hardening della sicurezza (firewall, UFW, accesso solo SSH)
- Configurazione del tunnel SSH per l'accesso al gateway

**Repository:**

- Infrastruttura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configurazione Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Questo approccio integra la configurazione Docker sopra con deployment riproducibili, infrastruttura sotto controllo di versione e disaster recovery automatizzato.

> **Nota:** Gestito dalla community. Per problemi o contributi, vedi i link ai repository sopra.

## Passaggi successivi

- Configura i canali di messaggistica: [Channels](/it/channels)
- Configura il Gateway: [Gateway configuration](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Updating](/it/install/updating)
