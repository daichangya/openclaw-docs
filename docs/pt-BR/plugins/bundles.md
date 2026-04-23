---
read_when:
    - Você quer instalar um bundle compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do bundle para recursos nativos
    - Você está depurando a detecção de bundles ou capacidades ausentes
summary: Instale e use os bundles do Codex, Claude e Cursor como Plugins do OpenClaw
title: Bundles de Plugin
x-i18n:
    generated_at: "2026-04-23T05:40:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundles de Plugin

O OpenClaw pode instalar Plugins de três ecossistemas externos: **Codex**, **Claude**
e **Cursor**. Eles são chamados de **bundles** — pacotes de conteúdo e metadados que o
OpenClaw mapeia para recursos nativos, como Skills, hooks e ferramentas MCP.

<Info>
  Bundles **não** são a mesma coisa que Plugins nativos do OpenClaw. Plugins nativos são executados
  no processo e podem registrar qualquer capacidade. Bundles são pacotes de conteúdo com
  mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que os bundles existem

Muitos Plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que autores os reescrevam como Plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia seu conteúdo suportado para o conjunto nativo de recursos.
Isso significa que você pode instalar um pacote de comandos do Claude ou um bundle de Skills do Codex
e usá-lo imediatamente.

## Instalar um bundle

<Steps>
  <Step title="Instale a partir de um diretório, arquivo ou marketplace">
    ```bash
    # Diretório local
    openclaw plugins install ./my-bundle

    # Arquivo
    openclaw plugins install ./my-bundle.tgz

    # Marketplace do Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifique a detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles aparecem como `Format: bundle` com um subtipo `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Reinicie e use">
    ```bash
    openclaw gateway restart
    ```

    Recursos mapeados (Skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia a partir de bundles

Nem todos os recursos de bundle são executados no OpenClaw hoje. Veja o que
funciona e o que é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso         | Como é mapeado                                                                              | Aplica-se a    |
| --------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Conteúdo de Skill | Raízes de Skill do bundle são carregadas como Skills normais do OpenClaw                  | Todos os formatos |
| Comandos        | `commands/` e `.cursor/commands/` tratados como raízes de Skill                             | Claude, Cursor |
| Pacotes de hooks | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                    | Codex          |
| Ferramentas MCP | A configuração MCP do bundle é mesclada às configurações embutidas do Pi; servidores stdio e HTTP suportados são carregados | Todos os formatos |
| Servidores LSP  | O `.lsp.json` do Claude e `lspServers` declarados no manifesto são mesclados aos padrões embutidos de LSP do Pi | Claude         |
| Configurações   | `settings.json` do Claude é importado como padrões embutidos do Pi                          | Claude         |

#### Conteúdo de Skill

- raízes de Skill do bundle são carregadas como raízes normais de Skill do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de Skill
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de Skill

Isso significa que arquivos de comando Markdown do Claude funcionam pelo carregador normal de Skills do OpenClaw.
Markdown de comandos do Cursor funciona pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hook do bundle funcionam **somente** quando usam o layout normal de pacote de hooks do OpenClaw.
  Hoje, este é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- bundles habilitados podem contribuir com configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do bundle às configurações embutidas efetivas do Pi como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP de bundle suportadas durante turnos do agente Pi embutido
  iniciando servidores stdio ou conectando-se a servidores HTTP
- os perfis de ferramenta `coding` e `messaging` incluem ferramentas MCP de bundle por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativar isso em um agente ou gateway
- configurações locais de Pi do projeto ainda se aplicam após os padrões do bundle, então
  configurações do workspace podem substituir entradas MCP do bundle quando necessário
- catálogos de ferramentas MCP de bundle são ordenados deterministicamente antes do registro, para
  que mudanças na ordem de `listTools()` do upstream não causem instabilidade nos blocos de ferramenta do cache de prompt

##### Transportes

Servidores MCP podem usar transporte stdio ou HTTP:

**Stdio** inicia um processo-filho:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** conecta-se a um servidor MCP em execução por `sse` por padrão, ou `streamable-http` quando solicitado:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` pode ser definido como `"streamable-http"` ou `"sse"`; quando omitido, o OpenClaw usa `sse`
- somente esquemas de URL `http:` e `https:` são permitidos
- valores de `headers` oferecem suporte à interpolação `${ENV_VAR}`
- uma entrada de servidor com `command` e `url` é rejeitada
- credenciais de URL (userinfo e parâmetros de consulta) são ocultadas de descrições de ferramenta
  e logs
- `connectionTimeoutMs` substitui o timeout padrão de conexão de 30 segundos para
  transportes stdio e HTTP

##### Nomes de ferramentas

O OpenClaw registra ferramentas MCP de bundle com nomes seguros para provider no formato
`serverName__toolName`. Por exemplo, um servidor com chave `"vigil-harbor"` expondo uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- prefixos de servidor têm limite de 30 caracteres
- nomes completos de ferramenta têm limite de 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes sanitizados em colisão são desambiguados com sufixos numéricos
- a ordem final exposta das ferramentas é determinística por nome seguro para manter turnos repetidos do Pi
  estáveis em cache
- a filtragem de perfil trata todas as ferramentas de um servidor MCP de bundle como de propriedade do Plugin
  `bundle-mcp`, então listas de permissões e negações do perfil podem incluir
  nomes individuais de ferramentas expostas ou a chave do Plugin `bundle-mcp`

#### Configurações embutidas do Pi

- `settings.json` do Claude é importado como configuração embutida padrão do Pi quando o
  bundle está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP embutido do Pi

- bundles Claude habilitados podem contribuir com configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do bundle é mesclada aos padrões efetivos de LSP embutido do Pi
- somente servidores LSP suportados com stdio podem ser executados hoje; transportes não suportados
  ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes são reconhecidos e mostrados em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/do app do Codex além do relatório de capacidade

## Formatos de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundles Codex se encaixam melhor no OpenClaw quando usam raízes de Skill e
    diretórios de pacote de hooks no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skill
    - `settings.json` é importado para as configurações embutidas do Pi (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio suportadas ao Pi embutido
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto são carregados nos padrões embutidos de LSP do Pi
    - `hooks/hooks.json` é detectado, mas não executado
    - caminhos de componentes personalizados no manifesto são aditivos (estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de Skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são apenas detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de Plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **Plugin nativo**
2. Marcadores de bundle (`.codex-plugin/`, `.claude-plugin/` ou layout padrão de Claude/Cursor) — tratado como **bundle**

Se um diretório contiver ambos, o OpenClaw usa o caminho nativo. Isso evita que
pacotes de formato duplo sejam parcialmente instalados como bundles.

## Segurança

Bundles têm um limite de confiança mais restrito do que Plugins nativos:

- o OpenClaw **não** carrega módulos arbitrários de runtime do bundle no processo
- caminhos de Skills e pacotes de hooks devem permanecer dentro da raiz do Plugin (com verificação de limite)
- arquivos de configuração são lidos com as mesmas verificações de limite
- servidores MCP stdio suportados podem ser iniciados como subprocessos

Isso torna bundles mais seguros por padrão, mas você ainda deve tratar bundles de terceiros
como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bundle é detectado, mas as capacidades não são executadas">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é um limite do produto — não uma instalação com problema.
  </Accordion>

  <Accordion title="Arquivos de comando do Claude não aparecem">
    Verifique se o bundle está habilitado e se os arquivos Markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="As configurações do Claude não são aplicadas">
    Somente configurações embutidas do Pi vindas de `settings.json` são suportadas. O OpenClaw não
    trata configurações de bundle como patches brutos de configuração.
  </Accordion>

  <Accordion title="Hooks do Claude não são executados">
    `hooks/hooks.json` é apenas detectado. Se você precisar de hooks executáveis, use o
    layout de pacote de hooks do OpenClaw ou forneça um Plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Instalar e configurar Plugins](/pt-BR/tools/plugin)
- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie um Plugin nativo
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
