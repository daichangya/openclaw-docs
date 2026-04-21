---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Como o sandbox do OpenClaw funciona: modos, escopos, acesso ao workspace e imagens'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T05:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

O OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto.
Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Se o sandbox estiver desativado, as ferramentas serão executadas no host.
O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado
quando habilitada.

Isto não é uma barreira de segurança perfeita, mas limita de forma material o
acesso ao sistema de arquivos e a processos quando o modelo faz algo imprudente.

## O que entra em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` etc.).
- Navegador opcional em sandbox (`agents.defaults.sandbox.browser`).
  - Por padrão, o navegador do sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele.
    Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Por padrão, contêineres de navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`.
    Configure com `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada de CDP na borda do contêiner com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
  - O acesso de observação por noVNC é protegido por senha por padrão; o OpenClaw emite uma URL com token de curta duração que serve uma página local de bootstrap e abre o noVNC com a senha no fragmento da URL (não em logs de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox tenham como alvo explicitamente o navegador do host.
  - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Não entram em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a rodar fora do sandbox (por exemplo `tools.elevated`).
  - **Exec elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de exec é `node`).**
  - Se o sandbox estiver desativado, `tools.elevated` não altera a execução (já está no host). Veja [Elevated Mode](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandbox é usado:

- `"off"`: sem sandbox.
- `"non-main"`: sandbox apenas para sessões **non-main** (padrão se você quiser chats normais no host).
- `"all"`: toda sessão roda em sandbox.
  Observação: `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente.
  Sessões de grupo/canal usam suas próprias chaves, então contam como non-main e entrarão em sandbox.

## Escopo

`agents.defaults.sandbox.scope` controla **quantos contêineres** são criados:

- `"agent"` (padrão): um contêiner por agente.
- `"session"`: um contêiner por sessão.
- `"shared"`: um contêiner compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão quando o sandbox está habilitado): runtime de sandbox local com Docker.
- `"ssh"`: runtime remoto genérico de sandbox com SSH.
- `"openshell"`: runtime de sandbox com OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`.
A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde é executado** | Contêiner local                 | Qualquer host acessível por SSH | Sandbox gerenciado pelo OpenShell                   |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Bind-mount ou cópia          | Remoto-canônico (semeia uma vez) | `mirror` ou `remote`                              |
| **Controle de rede** | `docker.network` (padrão: nenhuma) | Depende do host remoto        | Depende do OpenShell                                |
| **Sandbox de navegador** | Suportado                   | Não suportado                  | Ainda não suportado                                 |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**     | Desenvolvimento local, isolamento completo | Deslocar para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O sandbox vem desativado por padrão. Se você habilitar o sandbox e não escolher um
backend, o OpenClaw usará o backend Docker. Ele executa ferramentas e navegadores em sandbox
localmente via o socket do daemon Docker (`/var/run/docker.sock`). O isolamento do contêiner de sandbox
é determinado pelos namespaces do Docker.

**Restrições de Docker-out-of-Docker (DooD)**:
Se você implantar o próprio Gateway do OpenClaw como um contêiner Docker, ele orquestrará contêineres de sandbox irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: a configuração `workspace` em `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo `/home/user/.openclaw/workspaces`), não o caminho interno do contêiner do Gateway. Quando o OpenClaw pede ao daemon Docker para criar um sandbox, o daemon avalia caminhos relativos ao namespace do SO do host, não ao namespace do Gateway.
- **Paridade de ponte de FS (mapa de volume idêntico)**: o processo nativo do Gateway do OpenClaw também grava arquivos de heartbeat e bridge no diretório `workspace`. Como o Gateway avalia a mesma string exata (o caminho do host) de dentro do seu próprio ambiente em contêiner, a implantação do Gateway DEVE incluir um mapeamento de volume idêntico ligando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lançará nativamente um erro de permissão `EACCES` ao tentar gravar seu heartbeat dentro do ambiente do contêiner, porque a string do caminho totalmente qualificado não existe nativamente.

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenClaw coloque `exec`, ferramentas de arquivo e leituras de mídia em sandbox
em uma máquina arbitrária acessível por SSH.

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
          // Ou use SecretRefs / conteúdo inline em vez de arquivos locais:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Como funciona:

- O OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
- No primeiro uso após criação ou recriação, o OpenClaw semeia esse workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia do prompt e preparação de mídia de entrada rodam diretamente contra o workspace remoto por SSH.
- O OpenClaw não sincroniza mudanças remotas de volta para o workspace local automaticamente.

Material de autenticação:

- `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os repassam pela configuração do OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve pelo snapshot normal de runtime de segredos, grava-os em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
- Se `*File` e `*Data` estiverem ambos definidos para o mesmo item, `*Data` vence para aquela sessão SSH.

Este é um modelo **remoto-canônico**. O workspace SSH remoto torna-se o estado real do sandbox após a semeadura inicial.

Consequências importantes:

- Edições locais no host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até você recriar o sandbox.
- `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
- O sandbox de navegador não é suportado no backend SSH.
- As configurações `sandbox.docker.*` não se aplicam ao backend SSH.

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw coloque ferramentas em sandbox em um
ambiente remoto gerenciado por OpenShell. Para o guia completo de configuração,
referência de configuração e comparação de modos de workspace, veja a
página dedicada do [OpenShell](/pt-BR/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH central e a mesma bridge de sistema de arquivos remoto do
backend SSH genérico e adiciona o ciclo de vida específico do OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) mais o modo opcional de workspace `mirror`.

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

Modos do OpenShell:

- `mirror` (padrão): o workspace local permanece canônico. O OpenClaw sincroniza arquivos locais para o OpenShell antes do exec e sincroniza o workspace remoto de volta depois do exec.
- `remote`: o workspace do OpenShell é canônico depois que o sandbox é criado. O OpenClaw semeia o workspace remoto uma vez a partir do workspace local, então ferramentas de arquivo e exec rodam diretamente contra o sandbox remoto sem sincronizar mudanças de volta.

Detalhes de transporte remoto:

- O OpenClaw solicita ao OpenShell a configuração SSH específica do sandbox via `openshell sandbox ssh-config <name>`.
- O núcleo grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma bridge de sistema de arquivos remoto usada por `backend: "ssh"`.
- No modo `mirror`, apenas o ciclo de vida difere: sincroniza do local para o remoto antes do exec e depois sincroniza de volta.

Limitações atuais do OpenShell:

- o navegador em sandbox ainda não é suportado
- `sandbox.docker.binds` não é suportado no backend OpenShell
- knobs de runtime específicos de Docker em `sandbox.docker.*` continuam se aplicando apenas ao backend Docker

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

##### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local com o sandbox do OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- Ferramentas de arquivo ainda operam pela bridge do sandbox, mas o workspace local permanece a fonte da verdade entre turnos.

Use isto quando:

- você edita arquivos localmente fora do OpenClaw e quer que essas mudanças apareçam no sandbox automaticamente
- você quer que o sandbox do OpenShell se comporte o máximo possível como o backend Docker
- você quer que o workspace do host reflita gravações do sandbox após cada turno de exec

Tradeoff:

- custo extra de sincronização antes e depois do exec

##### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace do OpenShell se torne canônico**.

Comportamento:

- Quando o sandbox é criado pela primeira vez, o OpenClaw semeia o workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente contra o workspace remoto do OpenShell.
- O OpenClaw **não** sincroniza mudanças remotas de volta para o workspace local após o exec.
- Leituras de mídia no momento do prompt continuam funcionando porque ferramentas de arquivo e mídia leem pela bridge do sandbox em vez de presumir um caminho local do host.
- O transporte é via SSH para o sandbox do OpenShell retornado por `openshell sandbox ssh-config`.

Consequências importantes:

- Se você editar arquivos no host fora do OpenClaw após a etapa de semeadura, o sandbox remoto **não** verá essas mudanças automaticamente.
- Se o sandbox for recriado, o workspace remoto será semeado novamente a partir do workspace local.
- Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

Use isto quando:

- o sandbox deve viver principalmente no lado remoto do OpenShell
- você quer menor sobrecarga de sincronização por turno
- você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto do sandbox

Escolha `mirror` se você pensa no sandbox como um ambiente temporário de execução.
Escolha `remote` se você pensa no sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Sandboxes do OpenShell ainda são gerenciados pelo ciclo de vida normal de sandbox:

- `openclaw sandbox list` mostra runtimes do OpenShell assim como runtimes do Docker
- `openclaw sandbox recreate` exclui o runtime atual e deixa o OpenClaw recriá-lo no próximo uso
- a lógica de remoção também reconhece o backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico desse escopo
- o próximo uso semeia um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar serve principalmente para redefinir o ambiente remoto de execução,
porque o workspace local continua canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

- `"none"` (padrão): as ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
- `"ro"`: monta o workspace do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta o workspace do agente para leitura/escrita em `/workspace`.

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como fonte canônica após a semeadura inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de escrita da mesma forma

Mídia de entrada é copiada para o workspace ativo do sandbox (`media/inbound/*`).
Observação sobre Skills: a ferramenta `read` é enraizada no sandbox. Com `workspaceAccess: "none"`,
o OpenClaw espelha Skills elegíveis para o workspace do sandbox (`.../skills`) para
que possam ser lidos. Com `"rw"`, Skills do workspace podem ser lidos em
`/workspace/skills`.

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner.
Formato: `host:container:mode` (ex.: `"/home/user/source:/source:rw"`).

Bind mounts globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, bind mounts por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do **navegador em sandbox**.

- Quando definido (incluindo `[]`), ele substitui `agents.defaults.sandbox.docker.binds` para o contêiner do navegador.
- Quando omitido, o contêiner do navegador recorre a `agents.defaults.sandbox.docker.binds` (compatível com versões anteriores).

Exemplo (código-fonte somente leitura + um diretório extra de dados):

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

Observações de segurança:

- Bind mounts contornam o sistema de arquivos do sandbox: eles expõem caminhos do host com o modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens perigosas de bind (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais no diretório home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas comparação de strings. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de revalidar caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pai com symlink continuam falhando de forma fechada mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda resolve como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonicalizadas da mesma forma, então um caminho que só parece estar dentro da allowlist antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você só precisar de acesso de leitura ao workspace; os modos de bind continuam independentes.
- Veja [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para como bind mounts interagem com a política de ferramentas e exec elevado.

## Imagens + configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

Crie-a uma vez:

```bash
scripts/sandbox-setup.sh
```

Observação: a imagem padrão **não** inclui Node. Se uma Skill precisar de Node (ou
outros runtimes), inclua isso em uma imagem personalizada ou instale via
`sandbox.docker.setupCommand` (requer saída de rede + raiz gravável +
usuário root).

Se você quiser uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), execute:

```bash
scripts/sandbox-common-setup.sh
```

Depois defina `agents.defaults.sandbox.docker.image` como
`openclaw-sandbox-common:bookworm-slim`.

Imagem do navegador em sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Por padrão, contêineres Docker de sandbox são executados **sem rede**.
Substitua isso com `agents.defaults.sandbox.docker.network`.

A imagem empacotada do navegador em sandbox também aplica padrões conservadores de inicialização do Chromium
para cargas de trabalho em contêiner. Os padrões atuais do contêiner incluem:

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
- `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está habilitado.
- As três flags de endurecimento gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e são úteis
  quando contêineres não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se sua carga de trabalho exigir WebGL ou outros recursos 3D/do navegador.
- `--disable-extensions` vem habilitado por padrão e pode ser desabilitado com
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
- `--renderer-process-limit=2` é controlado por
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, onde `0` mantém o padrão do Chromium.

Se você precisar de um perfil de runtime diferente, use uma imagem personalizada do navegador e forneça
seu próprio entrypoint. Para perfis locais (sem contêiner) do Chromium, use
`browser.extraArgs` para acrescentar flags adicionais de inicialização.

Padrões de segurança:

- `network: "host"` é bloqueado.
- `network: "container:<id>"` é bloqueado por padrão (risco de contorno por ingresso em namespace).
- Sobrescrita break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalações Docker e o gateway em contêiner ficam aqui:
[Docker](/pt-BR/install/docker)

Para implantações do gateway com Docker, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox.
Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode
sobrescrever a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e
referência de variáveis de ambiente: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` é executado **uma vez** depois que o contêiner de sandbox é criado (não em toda execução).
Ele é executado dentro do contêiner via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Armadilhas comuns:

- O padrão de `docker.network` é `"none"` (sem saída), então instalações de pacotes falharão.
- `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é apenas para break-glass.
- `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou inclua isso em uma imagem personalizada.
- `user` deve ser root para instalação de pacotes (omita `user` ou defina `user: "0:0"`).
- O exec do sandbox **não** herda `process.env` do host. Use
  `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.

## Política de ferramentas + rotas de escape

As políticas de permissão/bloqueio de ferramentas ainda se aplicam antes das regras do sandbox. Se uma ferramenta for negada
globalmente ou por agente, o sandbox não a trará de volta.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o destino de exec é `node`).
Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desabilitar rigidamente
`exec`, use bloqueio na política de ferramentas (veja [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo efetivo de sandbox, a política de ferramentas e chaves de configuração para correção.
- Veja [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de “por que isso está bloqueado?”.
  Mantenha isso bem restrito.

## Sobrescritas multiagente

Cada agente pode sobrescrever sandbox + ferramentas:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para política de ferramentas do sandbox).
Veja [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) para precedência.

## Exemplo mínimo de habilitação

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

## Documentação relacionada

- [OpenShell](/pt-BR/gateway/openshell) -- configuração do backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Sandbox Configuration](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de "por que isso está bloqueado?"
- [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente e precedência
- [Security](/pt-BR/gateway/security)
