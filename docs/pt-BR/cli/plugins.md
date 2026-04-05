---
read_when:
    - Você quer instalar ou gerenciar plugins/extensões do Gateway ou bundles compatíveis
    - Você quer depurar falhas no carregamento de plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-05T12:38:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gerencie plugins/extensões do Gateway, pacotes de hooks e bundles compatíveis.

Relacionado:

- Sistema de plugins: [Plugins](/tools/plugin)
- Compatibilidade de bundles: [Plugin bundles](/plugins/bundles)
- Manifesto + schema de plugin: [Plugin manifest](/plugins/manifest)
- Reforço de segurança: [Security](/gateway/security)

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugins incluídos são distribuídos com o OpenClaw. Alguns vêm ativados por padrão (por exemplo,
providers de modelo incluídos, providers de fala incluídos e o plugin de navegador
incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON
Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios
manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info
também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) mais as capacidades do bundle
detectadas.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primeiro, depois npm
openclaw plugins install clawhub:<package>              # apenas ClawHub
openclaw plugins install <package> --force              # sobrescreve instalação existente
openclaw plugins install <package> --pin                # fixa a versão
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # caminho local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nomes simples de pacote são verificados primeiro no ClawHub e depois no npm. Observação de segurança:
trate instalações de plugins como execução de código. Prefira versões fixadas.

Se a config for inválida, `plugins install` normalmente falha em modo fechado e orienta você a
executar `openclaw doctor --fix` primeiro. A única exceção documentada é um caminho restrito de recuperação de plugin incluído para plugins que optem explicitamente por
`openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza o destino de instalação existente e sobrescreve no local um
plugin ou pacote de hooks já instalado. Use quando estiver reinstalando
intencionalmente o mesmo id a partir de um novo caminho local, archive, pacote do ClawHub ou artifact do npm.

`--pin` se aplica apenas a instalações npm. Não é compatível com `--marketplace`,
porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma
spec npm.

`--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos
no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo
quando o scanner integrado reporta achados `critical`, mas **não**
ignora bloqueios de política de hooks `before_install` do plugin e **não** ignora falhas de scan.

Essa flag de CLI se aplica a fluxos de instalação/atualização de plugins. Instalações de dependências de Skills com suporte do Gateway
usam a substituição correspondente de requisição `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

`plugins install` também é a superfície de instalação para pacotes de hooks que expõem
`openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada
de hooks e ativação por hook, não para instalação de pacote.

Specs npm são **apenas de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Specs git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas com `--ignore-scripts` por segurança.

Specs simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer um
deles para uma versão de pré-lançamento, o OpenClaw para e solicita que você faça opt-in explicitamente com uma
tag de pré-lançamento como `@beta`/`@rc` ou uma versão exata de pré-lançamento como
`@1.2.3-beta.4`.

Se uma spec simples de instalação corresponder a um id de plugin incluído (por exemplo `diffs`), o OpenClaw
instala o plugin incluído diretamente. Para instalar um pacote npm com o mesmo
nome, use uma spec com escopo explícito (por exemplo `@scope/diffs`).

Archives compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalações de marketplace Claude também são compatíveis.

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

O OpenClaw agora também prefere o ClawHub para specs de plugin seguras para npm sem escopo explícito. Ele só recorre
ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

O OpenClaw baixa o archive do pacote a partir do ClawHub, verifica a
API de plugin anunciada / compatibilidade mínima do gateway e, em seguida, o instala pelo caminho normal
de archive. Instalações registradas mantêm seus metadados de origem do ClawHub para atualizações futuras.

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no cache local do registro do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

As origens de marketplace podem ser:

- um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
- uma raiz local de marketplace ou caminho `marketplace.json`
- uma forma abreviada de repositório GitHub como `owner/repo`
- uma URL de repositório GitHub como `https://github.com/owner/repo`
- uma URL git

Para marketplaces remotos carregados do GitHub ou git, entradas de plugin precisam permanecer
dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativas desse
repositório e rejeita origens HTTP(S), de caminho absoluto, git, GitHub e outras origens de plugin que não sejam caminhos em manifestos remotos.

Para caminhos locais e archives, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- bundles compatíveis com Codex (`.codex-plugin/plugin.json`)
- bundles compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- bundles compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Bundles compatíveis são instalados na raiz normal de extensões e participam do mesmo fluxo de list/info/enable/disable. Hoje, Skills de bundles, command-Skills do Claude, padrões `settings.json` do Claude, padrões `lspServers` declarados em `.lsp.json` / manifesto do Claude, command-Skills do Cursor e diretórios de hooks compatíveis do Codex são compatíveis; outras capacidades detectadas de bundle são mostradas em diagnósticos/info, mas ainda não estão conectadas à execução em runtime.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Use `--enabled` para mostrar apenas plugins carregados. Use `--verbose` para mudar da
visualização em tabela para linhas detalhadas por plugin com metadados de origem/procedência/versão/ativação. Use `--json` para inventário legível por máquina mais diagnósticos do registro.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o
caminho-fonte em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a spec exata resolvida (`name@version`) em
`plugins.installs`, mantendo o comportamento padrão sem fixação.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros do plugin de `plugins.entries`, `plugins.installs`,
da allowlist de plugins e de entradas vinculadas de `plugins.load.paths` quando aplicável.
Para plugins de memória ativos, o slot de memória é redefinido para `memory-core`.

Por padrão, `uninstall` também remove o diretório de instalação do plugin sob a raiz ativa de plugins no
diretório de estado. Use
`--keep-files` para manter os arquivos em disco.

`--keep-config` é compatível como alias obsoleto para `--keep-files`.

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações rastreadas em `plugins.installs` e a instalações rastreadas de pacotes de hooks em `hooks.internal.installs`.

Quando você passa um id de plugin, o OpenClaw reutiliza a spec de instalação registrada para esse
plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas
continuam sendo usadas em execuções posteriores de `update <id>`.

Para instalações npm, você também pode passar uma spec explícita de pacote npm com uma dist-tag
ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado,
atualiza esse plugin instalado e registra a nova spec npm para futuras
atualizações baseadas em id.

Quando existe um hash de integridade armazenado e o hash do artifact obtido muda,
o OpenClaw exibe um aviso e solicita confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções de CI/não interativas.

`--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma
substituição de emergência para falsos positivos do scan integrado de código perigoso durante
atualizações de plugins. Ainda assim, ele não ignora bloqueios de política `before_install` do plugin
nem bloqueio por falha de scan, e se aplica apenas a atualizações de plugins, não a atualizações de pacotes de hooks.

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspecção profunda de um único plugin. Mostra identidade, status de carregamento, origem,
capacidades registradas, hooks, ferramentas, comandos, serviços, métodos do gateway,
rotas HTTP, flags de política, diagnósticos, metadados de instalação, capacidades de bundle
e qualquer suporte MCP ou LSP detectado.

Cada plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (ex.: um plugin apenas de provider)
- **hybrid-capability** — vários tipos de capacidade (ex.: texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Plugin shapes](/plugins/architecture#plugin-shapes) para mais informações sobre o modelo de capacidades.

A flag `--json` gera um relatório legível por máquina adequado para scripting e
auditoria.

`inspect --all` renderiza uma tabela de toda a frota com colunas de shape, tipos de
capacidades, avisos de compatibilidade, capacidades de bundle e resumo de hooks.

`info` é um alias para `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` reporta erros de carregamento de plugin, diagnósticos de manifesto/descoberta e
avisos de compatibilidade. Quando tudo está limpo, ele exibe `No plugin issues
detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A lista de marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma
forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json`
imprime o rótulo de origem resolvido mais o manifesto de marketplace analisado e as
entradas de plugin.
