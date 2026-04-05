---
read_when:
    - Você quer instalar um bundle compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do bundle para recursos nativos
    - Você está depurando a detecção de bundle ou capacidades ausentes
summary: Instale e use bundles do Codex, Claude e Cursor como plugins do OpenClaw
title: Bundles de plugins
x-i18n:
    generated_at: "2026-04-05T12:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundles de plugins

O OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**
e **Cursor**. Eles são chamados de **bundles** — pacotes de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos como skills, hooks e ferramentas MCP.

<Info>
  Bundles **não** são o mesmo que plugins nativos do OpenClaw. Plugins nativos são executados
  em processo e podem registrar qualquer capacidade. Bundles são pacotes de conteúdo com
  mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que os bundles existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que os autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia seu conteúdo compatível para o conjunto de recursos nativos.
Isso significa que você pode instalar um pacote de comandos do Claude ou um bundle de skills do Codex
e usá-lo imediatamente.

## Instalar um bundle

<Steps>
  <Step title="Instalar de um diretório, arquivo compactado ou marketplace">
    ```bash
    # Diretório local
    openclaw plugins install ./my-bundle

    # Arquivo compactado
    openclaw plugins install ./my-bundle.tgz

    # Marketplace do Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verificar detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Os bundles aparecem como `Format: bundle` com um subtipo `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Reiniciar e usar">
    ```bash
    openclaw gateway restart
    ```

    Os recursos mapeados (skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia dos bundles

Nem todo recurso de bundle funciona no OpenClaw hoje. Aqui está o que funciona e o que
é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso         | Como é mapeado                                                                            | Aplica-se a     |
| --------------- | ----------------------------------------------------------------------------------------- | --------------- |
| Conteúdo de skill | Raízes de skill do bundle são carregadas como skills normais do OpenClaw                | Todos os formatos |
| Comandos        | `commands/` e `.cursor/commands/` são tratados como raízes de skill                      | Claude, Cursor  |
| Pacotes de hook | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                  | Codex           |
| Ferramentas MCP | A configuração MCP do bundle é mesclada às configurações incorporadas do Pi; servidores stdio e HTTP compatíveis são carregados | Todos os formatos |
| Servidores LSP  | `.lsp.json` do Claude e `lspServers` declarados no manifesto são mesclados aos padrões de LSP do Pi incorporado | Claude          |
| Configurações   | `settings.json` do Claude é importado como padrões do Pi incorporado                     | Claude          |

#### Conteúdo de skill

- raízes de skill do bundle são carregadas como raízes normais de skill do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de skill
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de skill

Isso significa que arquivos de comando markdown do Claude funcionam por meio do carregador normal de skills do OpenClaw.
Comandos markdown do Cursor funcionam pelo mesmo caminho.

#### Pacotes de hook

- raízes de hook do bundle funcionam **apenas** quando usam o layout normal de pacote de hook do OpenClaw.
  Hoje, esse é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- bundles habilitados podem contribuir com configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do bundle às configurações incorporadas efetivas do Pi como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP compatíveis do bundle durante turnos do agente Pi incorporado ao
  iniciar servidores stdio ou conectar-se a servidores HTTP
- as configurações locais de projeto do Pi ainda são aplicadas após os padrões do bundle, então as
  configurações do workspace podem substituir entradas MCP do bundle quando necessário
- os catálogos de ferramentas MCP do bundle são ordenados de forma determinística antes do registro, para que
  mudanças na ordem de `listTools()` a montante não desestabilizem blocos de ferramenta no cache de prompt

##### Transportes

Servidores MCP podem usar transporte stdio ou HTTP:

**Stdio** inicia um processo filho:

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

**HTTP** conecta-se a um servidor MCP em execução usando `sse` por padrão, ou `streamable-http` quando solicitado:

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
- apenas esquemas de URL `http:` e `https:` são permitidos
- valores de `headers` oferecem suporte à interpolação `${ENV_VAR}`
- uma entrada de servidor com `command` e `url` é rejeitada
- credenciais de URL (userinfo e parâmetros de consulta) são ocultadas nas descrições
  de ferramenta e nos logs
- `connectionTimeoutMs` substitui o tempo limite de conexão padrão de 30 segundos para
  transportes stdio e HTTP

##### Nomenclatura de ferramentas

O OpenClaw registra ferramentas MCP de bundle com nomes seguros para o provedor no formato
`serverName__toolName`. Por exemplo, um servidor com chave `"vigil-harbor"` que expõe uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramenta são limitados a 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes saneados em colisão são desambiguados com sufixos numéricos
- a ordem final exposta das ferramentas é determinística por nome seguro para manter
  turnos repetidos do Pi estáveis no cache

#### Configurações incorporadas do Pi

- `settings.json` do Claude é importado como configuração padrão do Pi incorporado quando o
  bundle está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP do Pi incorporado

- bundles Claude habilitados podem contribuir com configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` além de quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do bundle é mesclada aos padrões efetivos de LSP do Pi incorporado
- apenas servidores LSP compatíveis baseados em stdio podem ser executados hoje; transportes
  não compatíveis ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Eles são reconhecidos e exibidos em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de app do Codex além do relatório de capacidades

## Formatos de bundle

<AccordionGroup>
  <Accordion title="Bundles do Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundles do Codex se encaixam melhor no OpenClaw quando usam raízes de skill e
    diretórios de pacote de hook no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles do Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de skill
    - `settings.json` é importado para as configurações incorporadas do Pi (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao Pi incorporado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto são carregados nos padrões de LSP do Pi incorporado
    - `hooks/hooks.json` é detectado, mas não executado
    - caminhos de componente personalizados no manifesto são aditivos (estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Bundles do Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são apenas detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **plugin nativo**
2. Marcadores de bundle (`.codex-plugin/`, `.claude-plugin/` ou layout padrão de Claude/Cursor) — tratado como **bundle**

Se um diretório contiver ambos, o OpenClaw usará o caminho nativo. Isso evita
que pacotes de formato duplo sejam instalados parcialmente como bundles.

## Segurança

Bundles têm um limite de confiança mais restrito do que plugins nativos:

- o OpenClaw **não** carrega módulos arbitrários de runtime do bundle em processo
- caminhos de skills e pacote de hook devem permanecer dentro da raiz do plugin (verificados por limite)
- arquivos de configuração são lidos com as mesmas verificações de limite
- servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna bundles mais seguros por padrão, mas você ainda deve tratar bundles
de terceiros como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bundle é detectado, mas as capacidades não funcionam">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é uma limitação do produto — não uma instalação com problema.
  </Accordion>

  <Accordion title="Arquivos de comando do Claude não aparecem">
    Verifique se o bundle está habilitado e se os arquivos markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="As configurações do Claude não são aplicadas">
    Apenas as configurações incorporadas do Pi vindas de `settings.json` são compatíveis. O OpenClaw não
    trata configurações de bundle como patches brutos de configuração.
  </Accordion>

  <Accordion title="Hooks do Claude não são executados">
    `hooks/hooks.json` é apenas detectado. Se você precisar de hooks executáveis, use o
    layout de pacote de hook do OpenClaw ou distribua um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/tools/plugin)
- [Criando plugins](/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de plugin](/plugins/manifest) — esquema de manifesto nativo
