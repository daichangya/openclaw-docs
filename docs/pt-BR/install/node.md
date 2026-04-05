---
read_when:
    - Você precisa instalar o Node.js antes de instalar o OpenClaw
    - Você instalou o OpenClaw, mas `openclaw` retorna comando não encontrado
    - '`npm install -g` falha com problemas de permissões ou PATH'
summary: Instale e configure o Node.js para o OpenClaw — requisitos de versão, opções de instalação e solução de problemas de PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T12:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

O OpenClaw exige **Node 22.14 ou mais recente**. **Node 24 é o runtime padrão e recomendado** para instalações, CI e fluxos de release. O Node 22 continua compatível pela linha LTS ativa. O [script de instalação](/install#alternative-install-methods) detectará e instalará o Node automaticamente — esta página é para quando você quiser configurar o Node por conta própria e garantir que tudo esteja conectado corretamente (versões, PATH, instalações globais).

## Verifique sua versão

```bash
node -v
```

Se isso mostrar `v24.x.x` ou superior, você está no padrão recomendado. Se mostrar `v22.14.x` ou superior, você está no caminho compatível do Node 22 LTS, mas ainda recomendamos atualizar para o Node 24 quando for conveniente. Se o Node não estiver instalado ou a versão for muito antiga, escolha um método de instalação abaixo.

## Instalar o Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    Ou baixe o instalador para macOS em [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Ou use um gerenciador de versões (veja abaixo).

  </Tab>
  <Tab title="Windows">
    **winget** (recomendado):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Ou baixe o instalador para Windows em [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Usando um gerenciador de versões (nvm, fnm, mise, asdf)">
  Gerenciadores de versões permitem alternar facilmente entre versões do Node. Opções populares:

- [**fnm**](https://github.com/Schniz/fnm) — rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) — amplamente usado em macOS/Linux
- [**mise**](https://mise.jdx.dev/) — poliglota (Node, Python, Ruby etc.)

Exemplo com fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Certifique-se de que seu gerenciador de versões esteja inicializado no arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`). Caso contrário, `openclaw` pode não ser encontrado em novas sessões de terminal porque o PATH não incluirá o diretório bin do Node.
  </Warning>
</Accordion>

## Solução de problemas

### `openclaw: comando não encontrado`

Isso quase sempre significa que o diretório bin global do npm não está no seu PATH.

<Steps>
  <Step title="Encontre seu prefixo global do npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verifique se ele está no seu PATH">
    ```bash
    echo "$PATH"
    ```

    Procure por `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) na saída.

  </Step>
  <Step title="Adicione-o ao arquivo de inicialização do seu shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Adicione a `~/.zshrc` ou `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Depois abra um novo terminal (ou execute `rehash` no zsh / `hash -r` no bash).
      </Tab>
      <Tab title="Windows">
        Adicione a saída de `npm prefix -g` ao PATH do sistema em Configurações → Sistema → Variáveis de ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erros de permissão em `npm install -g` (Linux)

Se você vir erros `EACCES`, mude o prefixo global do npm para um diretório gravável pelo usuário:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Adicione a linha `export PATH=...` ao seu `~/.bashrc` ou `~/.zshrc` para torná-la permanente.

## Relacionados

- [Visão geral de instalação](/install) — todos os métodos de instalação
- [Atualização](/install/updating) — como manter o OpenClaw atualizado
- [Primeiros passos](/pt-BR/start/getting-started) — primeiros passos após a instalação
