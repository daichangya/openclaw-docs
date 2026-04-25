---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Come funziona il sandboxing in OpenClaw: modalità, ambiti, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw può eseguire **strumenti all'interno di backend sandbox** per ridurre la blast radius.
Questa funzione è **facoltativa** ed è controllata dalla configurazione (`agents.defaults.sandbox` o
`agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host.
Il Gateway resta sull'host; l'esecuzione degli strumenti avviene in un sandbox isolato
quando è abilitata.

Questa non è una barriera di sicurezza perfetta, ma limita materialmente l'accesso al filesystem
e ai processi quando il modello fa qualcosa di stupido.

## Cosa viene messo in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandbox facoltativo (`agents.defaults.sandbox.browser`).
  - Per impostazione predefinita, il browser sandbox si avvia automaticamente (garantisce che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno.
    Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Per impostazione predefinita, i container del browser sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`.
    Configura con `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` facoltativo limita l'ingresso CDP al bordo del container con un'allowlist CIDR (ad esempio `172.21.0.1/32`).
  - L'accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL token di breve durata che serve una pagina bootstrap locale e apre noVNC con la password nel fragment URL (non nei log di query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandboxed di puntare esplicitamente al browser host.
  - Allowlist facoltative controllano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non vengono messi in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dal sandbox (ad esempio `tools.elevated`).
  - **L'exec elevated bypassa il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non cambia l'esecuzione (già sull'host). Vedi [Elevated Mode](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

- `"off"`: nessun sandboxing.
- `"non-main"`: mette in sandbox solo le sessioni **non-main** (predefinito se vuoi le chat normali sull'host).
- `"all"`: ogni sessione viene eseguita in un sandbox.
  Nota: `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id agente.
  Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno messe in sandbox.

## Ambito

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni sandboxed.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce il sandbox:

- `"docker"` (predefinito quando il sandboxing è abilitato): runtime sandbox locale basato su Docker.
- `"ssh"`: runtime sandbox remoto generico basato su SSH.
- `"openshell"`: runtime sandbox basato su OpenShell.

La configurazione specifica di SSH si trova sotto `agents.defaults.sandbox.ssh`.
La configurazione specifica di OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scelta di un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale              | Qualsiasi host accessibile via SSH | Sandbox gestito da OpenShell                    |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                      |
| **Modello workspace** | Bind-mount o copia             | Canonico remoto (inizializzato una volta) | `mirror` o `remote`                         |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall'host remoto     | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                       | Non supportato                 | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remoti gestiti con sync bidirezionale facoltativo |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un
backend, OpenClaw usa il backend Docker. Esegue strumenti e browser sandbox
localmente tramite il socket del demone Docker (`/var/run/docker.sock`). L'isolamento dei container sandbox
è determinato dai namespace Docker.

**Vincoli Docker-out-of-Docker (DooD)**:
Se distribuisci il Gateway OpenClaw stesso come container Docker, orchestri container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` in `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (ad esempio `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al demone Docker di avviare un sandbox, il demone valuta i percorsi rispetto al namespace del sistema operativo host, non al namespace del Gateway.
- **Parità del bridge FS (mappa volume identica)**: il processo nativo del Gateway OpenClaw scrive anche file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta la stessa stringa esatta (il percorso host) dall'interno del proprio ambiente containerizzato, la distribuzione del Gateway DEVE includere una mappa volume identica che colleghi nativamente il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se mappi i percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` tentando di scrivere il proprio heartbeat all'interno dell'ambiente container perché la stringa di percorso completamente qualificata non esiste nativamente.

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw metta in sandbox `exec`, strumenti file e letture di media su
una macchina arbitraria accessibile via SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Oppure usa SecretRef / contenuti inline invece dei file locali:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Come funziona:

- OpenClaw crea una root remota per ambito sotto `sandbox.ssh.workspaceRoot`.
- Al primo utilizzo dopo create o recreate, OpenClaw inizializza una volta quel workspace remoto dal workspace locale.
- Dopo di ciò, `exec`, `read`, `write`, `edit`, `apply_patch`, letture di media del prompt e staging dei media in ingresso vengono eseguiti direttamente sul workspace remoto via SSH.
- OpenClaw non sincronizza automaticamente le modifiche remote di nuovo nel workspace locale.

Materiale di autenticazione:

- `identityFile`, `certificateFile`, `knownHostsFile`: usa file locali esistenti e passali tramite la configurazione OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usa stringhe inline o SecretRef. OpenClaw li risolve tramite il normale snapshot runtime dei secrets, li scrive in file temporanei con `0600` e li elimina alla fine della sessione SSH.
- Se per lo stesso elemento sono impostati sia `*File` sia `*Data`, per quella sessione SSH ha la precedenza `*Data`.

Questo è un modello **remote-canonical**. Il workspace SSH remoto diventa il vero stato del sandbox dopo l'inizializzazione iniziale.

Conseguenze importanti:

- Le modifiche locali sull'host effettuate fuori da OpenClaw dopo il passaggio di inizializzazione non sono visibili in remoto finché non ricrei il sandbox.
- `openclaw sandbox recreate` elimina la root remota per ambito e al successivo utilizzo esegue di nuovo l'inizializzazione dal locale.
- Il browser sandbox non è supportato nel backend SSH.
- Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw metta gli strumenti in sandbox in un
ambiente remoto gestito da OpenShell. Per la guida completa alla configurazione, il riferimento
di configurazione e il confronto delle modalità workspace, vedi la pagina dedicata
[OpenShell page](/it/gateway/openshell).

OpenShell riutilizza lo stesso trasporto SSH core e lo stesso bridge filesystem remoto del
backend SSH generico, e aggiunge un ciclo di vita specifico di OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace
facoltativa `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modalità OpenShell:

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza il workspace remoto di nuovo dopo exec.
- `remote`: il workspace OpenShell è canonico dopo la creazione del sandbox. OpenClaw inizializza una volta il workspace remoto dal workspace locale, poi gli strumenti file ed exec operano direttamente sul sandbox remoto senza sincronizzare indietro le modifiche.

Dettagli del trasporto remoto:

- OpenClaw chiede a OpenShell la configurazione SSH specifica del sandbox tramite `openshell sandbox ssh-config <name>`.
- Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riutilizza lo stesso bridge filesystem remoto usato da `backend: "ssh"`.
- In modalità `mirror` cambia solo il ciclo di vita: sync da locale a remoto prima di exec, poi sync di ritorno dopo exec.

Limitazioni attuali di OpenShell:

- il browser sandbox non è ancora supportato
- `sandbox.docker.binds` non è supportato nel backend OpenShell
- le manopole runtime specifiche di Docker sotto `sandbox.docker.*` continuano ad applicarsi solo al backend Docker

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nel sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti file continuano a operare tramite il bridge sandbox, ma il workspace locale resta la source of truth tra i turni.

Usalo quando:

- modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche compaiano automaticamente nel sandbox
- vuoi che il sandbox OpenShell si comporti il più possibile come il backend Docker
- vuoi che il workspace host rifletta le scritture del sandbox dopo ogni turno exec

Controindicazione:

- costo di sync aggiuntivo prima e dopo exec

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

Comportamento:

- Quando il sandbox viene creato per la prima volta, OpenClaw inizializza una volta il workspace remoto dal workspace locale.
- Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sul workspace remoto OpenShell.
- OpenClaw **non** sincronizza le modifiche remote nel workspace locale dopo `exec`.
- Le letture di media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono tramite il bridge sandbox invece di presumere un percorso host locale.
- Il trasporto usa SSH nel sandbox OpenShell restituito da `openshell sandbox ssh-config`.

Conseguenze importanti:

- Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di inizializzazione, il sandbox remoto **non** vedrà automaticamente tali modifiche.
- Se il sandbox viene ricreato, il workspace remoto viene inizializzato di nuovo dal workspace locale.
- Con `scope: "agent"` o `scope: "shared"`, quel workspace remoto viene condiviso allo stesso ambito.

Usalo quando:

- il sandbox deve vivere principalmente sul lato remoto OpenShell
- vuoi un overhead di sync minore per turno
- non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato del sandbox remoto

Scegli `mirror` se pensi al sandbox come a un ambiente di esecuzione temporaneo.
Scegli `remote` se pensi al sandbox come al vero workspace.

#### Ciclo di vita OpenShell

I sandbox OpenShell continuano a essere gestiti tramite il normale ciclo di vita del sandbox:

- `openclaw sandbox list` mostra i runtime OpenShell oltre ai runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e lascia che OpenClaw lo ricrei al successivo utilizzo
- anche la logica di prune è consapevole del backend

Per la modalità `remote`, recreate è particolarmente importante:

- recreate elimina il workspace remoto canonico per quell'ambito
- l'utilizzo successivo inizializza un nuovo workspace remoto dal workspace locale

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di esecuzione remoto
perché il workspace locale resta comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **cosa il sandbox può vedere**:

- `"none"` (predefinito): gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
- `"ro"`: monta il workspace dell'agente in sola lettura su `/agent` (disabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta il workspace dell'agente in lettura/scrittura su `/workspace`.

Con il backend OpenShell:

- la modalità `mirror` continua a usare il workspace locale come sorgente canonica tra i turni exec
- la modalità `remote` usa il workspace remoto OpenShell come sorgente canonica dopo l'inizializzazione iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura nello stesso modo

I media in ingresso vengono copiati nel workspace sandbox attivo (`media/inbound/*`).
Nota sulle Skills: lo strumento `read` è radicato nel sandbox. Con `workspaceAccess: "none"`,
OpenClaw esegue il mirroring delle Skills idonee nel workspace sandbox (`.../skills`) in modo
che possano essere lette. Con `"rw"`, le Skills del workspace sono leggibili da
`/workspace/skills`.

## Bind mount personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container.
Formato: `host:container:mode` (ad esempio `"/home/user/source:/source:rw"`).

I bind globali e per-agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per-agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser sandbox**.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container browser.
- Quando è omesso, il container browser usa come fallback `agents.defaults.sandbox.docker.binds` (retrocompatibile).

Esempio (sorgente in sola lettura + directory dati aggiuntiva):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Note di sicurezza:

- I bind bypassano il filesystem sandbox: espongono percorsi host con la modalità che imposti (`:ro` o `:rw`).
- OpenClaw blocca sorgenti bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mount genitori che le esporrebbero).
- OpenClaw blocca anche radici comuni di credenziali nella home directory come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La convalida dei bind non si basa solo sul confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo tramite l'antenato esistente più profondo prima di ricontrollare i percorsi bloccati e le radici consentite.
- Questo significa che le fughe tramite genitore symlink continuano a fallire in modalità fail-closed anche quando la foglia finale non esiste ancora. Esempio: `/workspace/run-link/new-file` continua a risolversi come `/var/run/...` se `run-link` punta lì.
- Le radici sorgente consentite vengono canonicalizzate allo stesso modo, quindi un percorso che sembra rientrare nell'allowlist solo prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (secrets, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo necessità assoluta.
- Combina con `workspaceAccess: "ro"` se hai bisogno solo di accesso in lettura al workspace; le modalità bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per capire come i bind interagiscono con la tool policy e con exec elevated.

## Immagini + configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

Costruiscila una volta:

```bash
scripts/sandbox-setup.sh
```

Nota: l'immagine predefinita **non** include Node. Se una Skill ha bisogno di Node (o
di altri runtime), crea un'immagine personalizzata oppure installa tramite
`sandbox.docker.setupCommand` (richiede egress di rete + root scrivibile +
utente root).

Se vuoi un'immagine sandbox più funzionale con tooling comune (ad esempio
`curl`, `jq`, `nodejs`, `python3`, `git`), costruisci:

```bash
scripts/sandbox-common-setup.sh
```

Poi imposta `agents.defaults.sandbox.docker.image` su
`openclaw-sandbox-common:bookworm-slim`.

Immagine browser sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Per impostazione predefinita, i container sandbox Docker vengono eseguiti **senza rete**.
Sovrascrivi con `agents.defaults.sandbox.docker.network`.

L'immagine browser sandbox bundled applica anche impostazioni di avvio Chromium conservative
per carichi di lavoro containerizzati. I valori predefiniti correnti del container includono:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` quando `noSandbox` è abilitato.
- I tre flag di hardening grafico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sono facoltativi e sono utili
  quando i container non supportano la GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se il tuo carico di lavoro richiede WebGL o altre funzionalità 3D/browser.
- `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
- `--renderer-process-limit=2` è controllato da
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

Se hai bisogno di un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci
il tuo entrypoint. Per profili Chromium locali (non containerizzati), usa
`browser.extraArgs` per aggiungere flag di avvio aggiuntivi.

Valori predefiniti di sicurezza:

- `network: "host"` è bloccato.
- `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass del namespace join).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Le installazioni Docker e il gateway containerizzato si trovano qui:
[Docker](/it/install/docker)

Per le distribuzioni Docker del gateway, `scripts/docker/setup.sh` può inizializzare la configurazione sandbox.
Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare quel percorso. Puoi
sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Riferimento completo
di setup e env: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione one-time del container)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione).
Viene eseguito all'interno del container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per-agente: `agents.list[].sandbox.docker.setupCommand`

Problemi comuni:

- Il valore predefinito di `docker.network` è `"none"` (nessun egress), quindi le installazioni di pacchetti falliranno.
- `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo break-glass.
- `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` o crea un'immagine personalizzata.
- `user` deve essere root per le installazioni di pacchetti (ometti `user` o imposta `user: "0:0"`).
- L'exec sandbox non eredita `process.env` dell'host. Usa
  `agents.defaults.sandbox.docker.env` (o un'immagine personalizzata) per le chiavi API delle Skills.

## Tool policy + vie di fuga

Le policy allow/deny degli strumenti continuano ad applicarsi prima delle regole sandbox. Se uno strumento è negato
globalmente o per agente, il sandboxing non lo ripristina.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dal sandbox (`gateway` per impostazione predefinita, o `node` quando il target exec è `node`).
Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare rigidamente
`exec`, usa il deny della tool policy (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, la tool policy e le chiavi di configurazione fix-it.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale “perché questo è bloccato?”.
  Mantieni tutto ben bloccato.

## Override multi-agente

Ogni agente può sovrascrivere sandbox + strumenti:
`agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la tool policy del sandbox).
Vedi [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) per la precedenza.

## Esempio minimo di abilitazione

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Documentazione correlata

- [OpenShell](/it/gateway/openshell) -- configurazione del backend sandbox gestito, modalità workspace e riferimento di configurazione
- [Sandbox Configuration](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di "perché questo è bloccato?"
- [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Security](/it/gateway/security)
