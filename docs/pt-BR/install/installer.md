---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / headless)
    - Você quer instalar a partir de um checkout do GitHub
summary: Como os scripts de instalação funcionam (`install.sh`, `install-cli.sh`, `install.ps1`), flags e automação
title: Detalhes internos do instalador
x-i18n:
    generated_at: "2026-04-05T12:45:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: eced891572b8825b1f8a26ccc9d105ae8a38bd8ad89baef2f1927e27d4619e04
    source_path: install/installer.md
    workflow: 15
---

# Detalhes internos do instalador

O OpenClaw distribui três scripts de instalação, servidos a partir de `openclaw.ai`.

| Script                             | Plataforma           | O que faz                                                                                                         |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git e pode executar onboarding.                 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw em um prefixo local (`~/.openclaw`) com modos npm ou checkout git. Não requer root.      |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git e pode executar onboarding.                 |

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se a instalação for concluída com sucesso, mas `openclaw` não for encontrado em um novo terminal, consulte [solução de problemas do Node.js](/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas em macOS/Linux/WSL.
</Tip>

### Fluxo (`install.sh`)

<Steps>
  <Step title="Detectar o SO">
    Compatível com macOS e Linux (incluindo WSL). Se detectar macOS, instala Homebrew se estiver ausente.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Verifica a versão do Node e instala Node 24 se necessário (Homebrew no macOS, scripts de configuração do NodeSource em Linux apt/dnf/yum). O OpenClaw ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`, por compatibilidade.
  </Step>
  <Step title="Garantir Git">
    Instala Git se estiver ausente.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (padrão): instalação global com npm
    - Método `git`: clona/atualiza o repositório, instala dependências com pnpm, compila e então instala o wrapper em `~/.local/bin/openclaw`
  </Step>
  <Step title="Tarefas pós-instalação">
    - Atualiza um serviço de gateway já carregado no modo best-effort (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em upgrades e instalações via git (best effort)
    - Tenta fazer onboarding quando apropriado (TTY disponível, onboarding não desativado e verificações de bootstrap/configuração aprovadas)
    - Define `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão
  </Step>
</Steps>

### Detecção de checkout de origem

Se for executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar o checkout (`git`), ou
- usar a instalação global (`npm`)

Se não houver TTY disponível e nenhum método de instalação for definido, ele usa `npm` por padrão e emite um aviso.

O script sai com código `2` para seleção de método inválida ou valores inválidos de `--install-method`.

### Exemplos (`install.sh`)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pular onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação via git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Simulação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                  | Descrição                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Escolhe o método de instalação (padrão: `npm`). Alias: `--method` |
| `--npm`                               | Atalho para o método npm                                   |
| `--git`                               | Atalho para o método git. Alias: `--github`                |
| `--version <version\|dist-tag\|spec>` | Versão npm, dist-tag ou package spec (padrão: `latest`)    |
| `--beta`                              | Usa a dist-tag beta se disponível; caso contrário, fallback para `latest` |
| `--git-dir <path>`                    | Diretório do checkout (padrão: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pula `git pull` para um checkout existente                 |
| `--no-prompt`                         | Desativa prompts                                           |
| `--no-onboard`                        | Pula onboarding                                            |
| `--onboard`                           | Ativa onboarding                                           |
| `--dry-run`                           | Mostra as ações sem aplicar mudanças                       |
| `--verbose`                           | Ativa saída de depuração (`set -x`, logs npm no nível notice) |
| `--help`                              | Mostra o uso (`-h`)                                        |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                                | Descrição                                     |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalação                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versão npm, dist-tag ou package spec          |
| `OPENCLAW_BETA=0\|1`                                    | Usar beta se disponível                       |
| `OPENCLAW_GIT_DIR=<path>`                               | Diretório do checkout                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Ativar/desativar atualizações git             |
| `OPENCLAW_NO_PROMPT=1`                                  | Desativar prompts                             |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pular onboarding                              |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de simulação                             |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuração                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nível de log do npm                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controla o comportamento do sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes em que você quer tudo sob um prefixo local
(padrão `~/.openclaw`) e sem dependência de Node do sistema. Oferece suporte a instalações
npm por padrão, além de instalações por checkout git no mesmo fluxo de prefixo.
</Info>

### Fluxo (`install-cli.sh`)

<Steps>
  <Step title="Instalar runtime local do Node">
    Baixa um tarball fixado de uma versão LTS compatível do Node (a versão está embutida no script e é atualizada independentemente) para `<prefix>/tools/node-v<version>` e verifica o SHA-256.
  </Step>
  <Step title="Garantir Git">
    Se o Git estiver ausente, tenta instalar via apt/dnf/yum no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar OpenClaw sob o prefixo">
    - Método `npm` (padrão): instala sob o prefixo com npm e então grava o wrapper em `<prefix>/bin/openclaw`
    - Método `git`: clona/atualiza um checkout (padrão `~/openclaw`) e ainda assim grava o wrapper em `<prefix>/bin/openclaw`
  </Step>
  <Step title="Atualizar serviço de gateway carregado">
    Se um serviço de gateway já estiver carregado a partir desse mesmo prefixo, o script executa
    `openclaw gateway install --force`, depois `openclaw gateway restart` e
    testa a integridade do gateway no modo best-effort.
  </Step>
</Steps>

### Exemplos (`install-cli.sh`)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefixo personalizado + versão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalação via git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Saída JSON para automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Executar onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefixo de instalação (padrão: `~/.openclaw`)                                       |
| `--install-method npm\|git` | Escolhe o método de instalação (padrão: `npm`). Alias: `--method`                   |
| `--npm`                     | Atalho para o método npm                                                            |
| `--git`, `--github`         | Atalho para o método git                                                            |
| `--git-dir <path>`          | Diretório do checkout git (padrão: `~/openclaw`). Alias: `--dir`                    |
| `--version <ver>`           | Versão do OpenClaw ou dist-tag (padrão: `latest`)                                   |
| `--node-version <ver>`      | Versão do Node (padrão: `22.22.0`)                                                  |
| `--json`                    | Emite eventos NDJSON                                                                |
| `--onboard`                 | Executa `openclaw onboard` após a instalação                                        |
| `--no-onboard`              | Pula onboarding (padrão)                                                            |
| `--set-npm-prefix`          | No Linux, força o prefixo do npm para `~/.npm-global` se o prefixo atual não puder ser gravado |
| `--help`                    | Mostra o uso (`-h`)                                                                 |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                    | Descrição                                      |
| ------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefixo de instalação                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalação                           |
| `OPENCLAW_VERSION=<ver>`                    | Versão do OpenClaw ou dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versão do Node                                 |
| `OPENCLAW_GIT_DIR=<path>`                   | Diretório do checkout git para instalações git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Ativa/desativa atualizações git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Pula onboarding                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controla o comportamento do sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Fluxo (`install.ps1`)

<Steps>
  <Step title="Garantir ambiente PowerShell + Windows">
    Requer PowerShell 5+.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Se estiver ausente, tenta instalar via winget, depois Chocolatey e depois Scoop. O Node 22 LTS, atualmente `22.14+`, continua compatível por motivos de compatibilidade.
  </Step>
  <Step title="Instalar OpenClaw">
    - Método `npm` (padrão): instalação global com npm usando a `-Tag` selecionada
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Tarefas pós-instalação">
    - Adiciona o diretório de bin necessário ao PATH do usuário quando possível
    - Atualiza um serviço de gateway carregado no modo best-effort (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em upgrades e instalações git (best effort)
  </Step>
</Steps>

### Exemplos (`install.ps1`)

<Tabs>
  <Tab title="Padrão">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalação via git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Diretório git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Simulação">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Rastreamento de depuração">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                       |
| `-Tag <tag\|version\|spec>` | npm dist-tag, versão ou package spec (padrão: `latest`)    |
| `-GitDir <path>`            | Diretório do checkout (padrão: `%USERPROFILE%\openclaw`)   |
| `-NoOnboard`                | Pula onboarding                                            |
| `-NoGitUpdate`              | Pula `git pull`                                            |
| `-DryRun`                   | Apenas mostra as ações                                     |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                           | Descrição              |
| ---------------------------------- | ---------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação   |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório do checkout  |
| `OPENCLAW_NO_ONBOARD=1`            | Pula onboarding        |
| `OPENCLAW_GIT_UPDATE=0`            | Desativa `git pull`    |
| `OPENCLAW_DRY_RUN=1`               | Modo de simulação      |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script sai e exibe o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (npm não interativo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git não interativo)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (pular onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Por que o Git é necessário?">
    O Git é necessário para o método de instalação `git`. Em instalações `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm encontra EACCES no Linux?">
    Algumas configurações Linux apontam o prefixo global do npm para caminhos pertencentes ao root. `install.sh` pode mudar o prefixo para `~/.npm-global` e acrescentar exportações de PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title="Problemas com sharp/libvips">
    Os scripts definem `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão para evitar que o sharp compile contra o libvips do sistema. Para substituir:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instale o Git for Windows, reabra o PowerShell e execute novamente o instalador.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Execute `npm config get prefix` e adicione esse diretório ao PATH do usuário (sem sufixo `\bin` no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter saída detalhada do instalador">
    `install.ps1` atualmente não expõe uma opção `-Verbose`.
    Use rastreamento do PowerShell para diagnóstico no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw não encontrado após a instalação">
    Normalmente é um problema de PATH. Consulte [solução de problemas do Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
