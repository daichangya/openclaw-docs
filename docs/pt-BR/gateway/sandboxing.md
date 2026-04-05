---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Como o sandboxing do OpenClaw funciona: modos, escopos, acesso ao workspace e imagens'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T12:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

O OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto.
Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas serão executadas no host.
O Gateway permanece no host; a execução das ferramentas roda em um sandbox isolado
quando ativada.

Isso não é um limite de segurança perfeito, mas limita de forma material o acesso ao sistema de arquivos
e a processos quando o modelo faz algo imprudente.

## O que é colocado em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` etc.).
- Navegador opcional em sandbox (`agents.defaults.sandbox.browser`).
  - Por padrão, o navegador em sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele.
    Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Por padrão, contêineres de navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`.
    Configure com `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe o ingresso CDP na borda do contêiner com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
  - O acesso de observação via noVNC é protegido por senha por padrão; o OpenClaw emite uma URL com token de curta duração que serve uma página de bootstrap local e abre o noVNC com a senha no fragmento da URL (não em logs de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox direcionem explicitamente o navegador do host.
  - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Não é colocado em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente permitida para rodar fora do sandbox (por exemplo `tools.elevated`).
  - **Exec elevado ignora o sandboxing e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de exec é `node`).**
  - Se o sandboxing estiver desativado, `tools.elevated` não altera a execução (já está no host). Consulte [Elevated Mode](/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

- `"off"`: sem sandboxing.
- `"non-main"`: sandbox apenas para sessões **não principais** (padrão se você quiser chats normais no host).
- `"all"`: toda sessão roda em um sandbox.
  Observação: `"non-main"` se baseia em `session.mainKey` (padrão `"main"`), não no id do agente.
  Sessões de grupo/canal usam suas próprias chaves, então contam como não principais e entrarão em sandbox.

## Escopo

`agents.defaults.sandbox.scope` controla **quantos contêineres** são criados:

- `"agent"` (padrão): um contêiner por agente.
- `"session"`: um contêiner por sessão.
- `"shared"`: um contêiner compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão): runtime de sandbox local baseado em Docker.
- `"ssh"`: runtime de sandbox remoto genérico baseado em SSH.
- `"openshell"`: runtime de sandbox baseado em OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`.
A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde roda**       | Contêiner local                  | Qualquer host acessível por SSH | Sandbox gerenciado pelo OpenShell                  |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell ativado                            |
| **Modelo de workspace** | Bind-mount ou cópia         | Remoto-canônico (inicializa uma vez) | `mirror` ou `remote`                           |
| **Controle de rede** | `docker.network` (padrão: none) | Depende do host remoto         | Depende do OpenShell                                |
| **Navegador em sandbox** | Compatível                 | Não compatível                 | Ainda não compatível                                |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Ideal para**      | Desenvolvimento local, isolamento total | Descarregar para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenClaw coloque `exec`, ferramentas de arquivo e leituras de mídia em sandbox em
uma máquina arbitrária acessível por SSH.

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
- No primeiro uso após create ou recreate, o OpenClaw inicializa esse workspace remoto a partir do workspace local uma única vez.
- Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia no prompt e preparação de mídia de entrada são executados diretamente no workspace remoto por SSH.
- O OpenClaw não sincroniza automaticamente alterações remotas de volta para o workspace local.

Material de autenticação:

- `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve pelo snapshot normal de segredos em runtime, grava em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
- Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` tem prioridade nessa sessão SSH.

Este é um modelo **remoto-canônico**. O workspace SSH remoto se torna o estado real do sandbox após a inicialização inicial.

Consequências importantes:

- Edições locais no host feitas fora do OpenClaw após a etapa de inicialização não ficam visíveis remotamente até que você recrie o sandbox.
- `openclaw sandbox recreate` exclui a raiz remota por escopo e inicializa novamente a partir do local no próximo uso.
- O navegador em sandbox não é compatível com o backend SSH.
- Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw coloque ferramentas em sandbox em um
ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração,
referência de configuração e comparação entre modos de workspace, consulte a página dedicada de
[OpenShell](/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH principal e a mesma ponte de sistema de arquivos remoto do
backend SSH genérico e adiciona ciclo de vida específico do OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) além do modo opcional de workspace `mirror`.

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

- `mirror` (padrão): o workspace local continua sendo o canônico. O OpenClaw sincroniza arquivos locais com o OpenShell antes de exec e sincroniza o workspace remoto de volta após exec.
- `remote`: o workspace OpenShell se torna o canônico após a criação do sandbox. O OpenClaw inicializa o workspace remoto uma vez a partir do workspace local, então ferramentas de arquivo e exec rodam diretamente no sandbox remoto sem sincronizar alterações de volta.

Detalhes do transporte remoto:

- O OpenClaw solicita ao OpenShell a configuração SSH específica do sandbox por meio de `openshell sandbox ssh-config <name>`.
- O núcleo grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
- No modo `mirror`, apenas o ciclo de vida difere: sincroniza de local para remoto antes de exec e depois sincroniza de volta após exec.

Limitações atuais do OpenShell:

- navegador em sandbox ainda não é compatível
- `sandbox.docker.binds` não é compatível com o backend OpenShell
- parâmetros de runtime específicos do Docker em `sandbox.docker.*` continuam se aplicando apenas ao backend Docker

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

##### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local continue sendo o canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local com o sandbox OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- As ferramentas de arquivo ainda operam por meio da ponte do sandbox, mas o workspace local permanece como fonte da verdade entre turnos.

Use isso quando:

- você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam no sandbox automaticamente
- você quer que o sandbox OpenShell se comporte o máximo possível como o backend Docker
- você quer que o workspace do host reflita gravações do sandbox após cada turno de exec

Trade-off:

- custo extra de sincronização antes e depois de exec

##### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace OpenShell se torne o canônico**.

Comportamento:

- Quando o sandbox é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente sobre o workspace remoto do OpenShell.
- O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após exec.
- Leituras de mídia no momento do prompt continuam funcionando porque ferramentas de arquivo e mídia leem por meio da ponte do sandbox em vez de assumir um caminho local do host.
- O transporte é SSH para dentro do sandbox OpenShell retornado por `openshell sandbox ssh-config`.

Consequências importantes:

- Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, o sandbox remoto **não** verá essas alterações automaticamente.
- Se o sandbox for recriado, o workspace remoto será inicializado novamente a partir do workspace local.
- Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto será compartilhado nesse mesmo escopo.

Use isso quando:

- o sandbox deve viver principalmente no lado remoto do OpenShell
- você quer menor sobrecarga de sincronização por turno
- você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto do sandbox

Escolha `mirror` se você pensa no sandbox como um ambiente temporário de execução.
Escolha `remote` se você pensa no sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Sandboxes OpenShell ainda são gerenciados pelo ciclo de vida normal de sandbox:

- `openclaw sandbox list` mostra runtimes OpenShell além de runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de prune também reconhece o backend

Para o modo `remote`, recreate é especialmente importante:

- recreate exclui o workspace remoto canônico desse escopo
- o próximo uso inicializa um novo workspace remoto a partir do workspace local

Para o modo `mirror`, recreate redefine principalmente o ambiente remoto de execução
porque o workspace local continua sendo canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

- `"none"` (padrão): as ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
- `"ro"`: monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`).
- `"rw"`: monta o workspace do agente como leitura/gravação em `/workspace`.

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como fonte canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de gravação da mesma forma

A mídia de entrada é copiada para o workspace ativo do sandbox (`media/inbound/*`).
Observação sobre Skills: a ferramenta `read` é enraizada no sandbox. Com `workspaceAccess: "none"`,
o OpenClaw espelha Skills elegíveis no workspace do sandbox (`.../skills`) para
que possam ser lidos. Com `"rw"`, Skills do workspace são legíveis em
`/workspace/skills`.

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner.
Formato: `host:container:mode` (por exemplo, `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do **navegador em sandbox**.

- Quando definido (inclusive `[]`), ele substitui `agents.defaults.sandbox.docker.binds` para o contêiner do navegador.
- Quando omitido, o contêiner do navegador usa `agents.defaults.sandbox.docker.binds` como fallback (compatibilidade retroativa).

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

- Binds ignoram o sistema de arquivos do sandbox: eles expõem caminhos do host com o modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que os exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais no diretório home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de string. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de verificar novamente caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pai de symlink ainda falham de forma segura, mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá.
- As raízes de origem permitidas são canonizadas da mesma forma, então um caminho que apenas parece estar dentro da allowlist antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você precisar apenas de acesso de leitura ao workspace; os modos de bind continuam independentes.
- Consulte [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para entender como binds interagem com a política de ferramentas e exec elevado.

## Imagens + configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

Construa-a uma vez:

```bash
scripts/sandbox-setup.sh
```

Observação: a imagem padrão **não** inclui Node. Se uma Skill precisar de Node (ou
outros runtimes), crie uma imagem personalizada ou instale via
`sandbox.docker.setupCommand` (requer saída de rede + raiz gravável +
usuário root).

Se você quiser uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), construa:

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
Substitua com `agents.defaults.sandbox.docker.network`.

A imagem de navegador em sandbox empacotada também aplica padrões conservadores de inicialização do Chromium
para cargas de trabalho em contêiner. Os padrões atuais de contêiner incluem:

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
- `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` estiver ativado.
- As três flags de hardening gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e são úteis
  quando os contêineres não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se sua carga de trabalho exigir WebGL ou outros recursos 3D/do navegador.
- `--disable-extensions` fica ativado por padrão e pode ser desativado com
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
- `--renderer-process-limit=2` é controlado por
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, onde `0` mantém o padrão do Chromium.

Se você precisar de um perfil de runtime diferente, use uma imagem personalizada de navegador e forneça
seu próprio entrypoint. Para perfis locais (fora de contêiner) do Chromium, use
`browser.extraArgs` para acrescentar flags adicionais de inicialização.

Padrões de segurança:

- `network: "host"` é bloqueado.
- `network: "container:<id>"` é bloqueado por padrão (risco de ignorar namespace join).
- Substituição break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalações Docker e o gateway em contêiner ficam aqui:
[Docker](/install/docker)

Para implantações do gateway em Docker, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox.
Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para ativar esse caminho. Você pode
substituir a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env:
[Docker](/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` roda **uma vez** após a criação do contêiner do sandbox (não a cada execução).
Ele é executado dentro do contêiner via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Armadilhas comuns:

- O padrão de `docker.network` é `"none"` (sem saída), então instalações de pacotes falharão.
- `docker.network: "container:<id>"` exige `dangerouslyAllowContainerNamespaceJoin: true` e é apenas break-glass.
- `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou crie uma imagem personalizada.
- `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
- O exec em sandbox **não** herda `process.env` do host. Use
  `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.

## Política de ferramentas + caminhos de escape

Políticas de allow/deny de ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta estiver negada
globalmente ou por agente, o sandboxing não a traz de volta.

`tools.elevated` é um caminho de escape explícito que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o destino de exec é `node`).
Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desativar
`exec` de forma rígida, use deny na política de ferramentas (consulte [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar modo efetivo de sandbox, política de ferramentas e chaves de configuração para correção.
- Consulte [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de “por que isso está bloqueado?”.
  Mantenha tudo bloqueado.

## Substituições para vários agentes

Cada agente pode substituir sandbox + ferramentas:
`agents.list[].sandbox` e `agents.list[].tools` (além de `agents.list[].tools.sandbox.tools` para política de ferramentas do sandbox).
Consulte [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para precedência.

## Exemplo mínimo de ativação

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

- [OpenShell](/gateway/openshell) -- configuração do backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de "por que isso está bloqueado?"
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [Security](/gateway/security)
