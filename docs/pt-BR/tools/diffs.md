---
read_when:
    - Você quer que agentes mostrem edições de código ou Markdown como diffs
    - Você quer uma URL de visualização pronta para Canvas ou um arquivo de diff renderizado
    - Você precisa de artefatos de diff temporários e controlados com padrões seguros
summary: Visualizador de diff somente leitura e renderizador de arquivos para agentes (ferramenta opcional de plugin)
title: Diffs
x-i18n:
    generated_at: "2026-04-05T12:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` é uma ferramenta opcional de plugin com uma orientação curta integrada ao sistema e uma Skill complementar que transforma conteúdo de mudanças em um artefato de diff somente leitura para agentes.

Ela aceita:

- texto `before` e `after`
- um `patch` unificado

Ela pode retornar:

- uma URL de visualização do gateway para apresentação em Canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega por mensagem
- ambas as saídas em uma chamada

Quando habilitado, o plugin adiciona orientação de uso concisa ao espaço do prompt do sistema e também expõe uma Skill detalhada para casos em que o agente precisa de instruções mais completas.

## Início rápido

1. Habilite o plugin.
2. Chame `diffs` com `mode: "view"` para fluxos priorizando Canvas.
3. Chame `diffs` com `mode: "file"` para fluxos de entrega de arquivo no chat.
4. Chame `diffs` com `mode: "both"` quando precisar de ambos os artefatos.

## Habilitar o plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Desabilitar a orientação integrada do sistema

Se você quiser manter a ferramenta `diffs` habilitada, mas desabilitar sua orientação integrada no prompt do sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Isso bloqueia o hook `before_prompt_build` do plugin diffs, mantendo o plugin, a ferramenta e a Skill complementar disponíveis.

Se você quiser desabilitar tanto a orientação quanto a ferramenta, desabilite o plugin.

## Workflow típico do agente

1. O agente chama `diffs`.
2. O agente lê os campos `details`.
3. O agente então:
   - abre `details.viewerUrl` com `canvas present`
   - envia `details.filePath` com `message` usando `path` ou `filePath`
   - faz ambos

## Exemplos de entrada

Before e after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referência de entrada da ferramenta

Todos os campos são opcionais, salvo indicação em contrário:

- `before` (`string`): texto original. Obrigatório com `after` quando `patch` é omitido.
- `after` (`string`): texto atualizado. Obrigatório com `before` quando `patch` é omitido.
- `patch` (`string`): texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
- `path` (`string`): nome de arquivo exibido para o modo before e after.
- `lang` (`string`): dica de sobrescrita de linguagem para o modo before e after. Valores desconhecidos usam texto simples como fallback.
- `title` (`string`): sobrescrita do título do visualizador.
- `mode` (`"view" | "file" | "both"`): modo de saída. O padrão é o padrão do plugin `defaults.mode`.
  Alias obsoleto: `"image"` se comporta como `"file"` e ainda é aceito por compatibilidade retroativa.
- `theme` (`"light" | "dark"`): tema do visualizador. O padrão é o padrão do plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): layout do diff. O padrão é o padrão do plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): expande seções inalteradas quando o contexto completo está disponível. Opção apenas por chamada (não é uma chave padrão do plugin).
- `fileFormat` (`"png" | "pdf"`): formato do arquivo renderizado. O padrão é o padrão do plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset de qualidade para renderização em PNG ou PDF.
- `fileScale` (`number`): sobrescrita da escala do dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): largura máxima de renderização em pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL do artefato em segundos para o visualizador e saídas de arquivo independentes. Padrão 1800, máximo 21600.
- `baseUrl` (`string`): sobrescrita da origem da URL do visualizador. Sobrescreve `viewerBaseUrl` do plugin. Deve ser `http` ou `https`, sem query/hash.

Aliases legados de entrada ainda aceitos por compatibilidade retroativa:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validação e limites:

- `before` e `after` têm no máximo 512 KiB cada.
- `patch` tem no máximo 2 MiB.
- `path` tem no máximo 2048 bytes.
- `lang` tem no máximo 128 bytes.
- `title` tem no máximo 1024 bytes.
- Limite de complexidade do patch: no máximo 128 arquivos e 120000 linhas totais.
- `patch` junto com `before` ou `after` é rejeitado.
- Limites de segurança do arquivo renderizado, válidos para PNG e PDF:
  - `fileQuality: "standard"`: máximo de 8 MP (8.000.000 pixels renderizados).
  - `fileQuality: "hq"`: máximo de 14 MP (14.000.000 pixels renderizados).
  - `fileQuality: "print"`: máximo de 24 MP (24.000.000 pixels renderizados).
  - PDF também tem limite máximo de 50 páginas.

## Contrato de saída de `details`

A ferramenta retorna metadados estruturados em `details`.

Campos compartilhados para modos que criam um visualizador:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` quando disponível)

Campos de arquivo quando PNG ou PDF é renderizado:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (mesmo valor de `filePath`, para compatibilidade com a ferramenta de mensagem)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Aliases de compatibilidade também retornados para chamadores existentes:

- `format` (mesmo valor de `fileFormat`)
- `imagePath` (mesmo valor de `filePath`)
- `imageBytes` (mesmo valor de `fileBytes`)
- `imageQuality` (mesmo valor de `fileQuality`)
- `imageScale` (mesmo valor de `fileScale`)
- `imageMaxWidth` (mesmo valor de `fileMaxWidth`)

Resumo do comportamento por modo:

- `mode: "view"`: apenas campos do visualizador.
- `mode: "file"`: apenas campos do arquivo, sem artefato de visualizador.
- `mode: "both"`: campos do visualizador mais campos do arquivo. Se a renderização do arquivo falhar, o visualizador ainda retorna com `fileError` e o alias de compatibilidade `imageError`.

## Seções inalteradas recolhidas

- O visualizador pode mostrar linhas como `N unmodified lines`.
- Os controles de expansão nessas linhas são condicionais e não são garantidos para todo tipo de entrada.
- Os controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico em entradas before e after.
- Em muitos inputs de patch unificado, os corpos de contexto omitidos não estão disponíveis nos hunks do patch analisado, então a linha pode aparecer sem controles de expansão. Esse é o comportamento esperado.
- `expandUnchanged` se aplica apenas quando existe contexto expansível.

## Padrões do plugin

Defina padrões globais do plugin em `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Padrões compatíveis:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Parâmetros explícitos da ferramenta sobrescrevem esses padrões.

Configuração persistente da URL do visualizador:

- `viewerBaseUrl` (`string`, opcional)
  - Fallback pertencente ao plugin para links de visualizador retornados quando uma chamada da ferramenta não passa `baseUrl`.
  - Deve ser `http` ou `https`, sem query/hash.

Exemplo:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Configuração de segurança

- `security.allowRemoteViewer` (`boolean`, padrão `false`)
  - `false`: solicitações fora de loopback para rotas do visualizador são negadas.
  - `true`: visualizadores remotos são permitidos se o caminho com token for válido.

Exemplo:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Ciclo de vida e armazenamento de artefatos

- Os artefatos são armazenados na subpasta temporária: `$TMPDIR/openclaw-diffs`.
- Os metadados do artefato do visualizador contêm:
  - ID de artefato aleatório (20 caracteres hex)
  - token aleatório (48 caracteres hex)
  - `createdAt` e `expiresAt`
  - caminho armazenado de `viewer.html`
- O TTL padrão do artefato é de 30 minutos quando não especificado.
- O TTL máximo aceito para visualizador é de 6 horas.
- A limpeza roda de forma oportunista após a criação do artefato.
- Artefatos expirados são excluídos.
- A limpeza de fallback remove pastas obsoletas com mais de 24 horas quando os metadados estão ausentes.

## URL do visualizador e comportamento de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Ativos do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

O documento do visualizador resolve esses ativos relativamente à URL do visualizador, então um prefixo opcional de caminho em `baseUrl` também é preservado para as solicitações de ativos.

Comportamento de construção da URL:

- Se `baseUrl` for fornecido na chamada da ferramenta, ele será usado após validação rigorosa.
- Caso contrário, se `viewerBaseUrl` do plugin estiver configurado, ele será usado.
- Sem nenhuma dessas sobrescritas, a URL do visualizador usa por padrão loopback `127.0.0.1`.
- Se o modo de bind do gateway for `custom` e `gateway.customBindHost` estiver definido, esse host será usado.

Regras de `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- Origem mais caminho base opcional são permitidos.

## Modelo de segurança

Proteção do visualizador:

- Apenas loopback por padrão.
- Caminhos tokenizados do visualizador com validação rígida de ID e token.
- CSP da resposta do visualizador:
  - `default-src 'none'`
  - scripts e ativos apenas do próprio host
  - sem `connect-src` de saída
- Limitação de tentativas para erros remotos quando o acesso remoto está habilitado:
  - 40 falhas por 60 segundos
  - bloqueio de 60 segundos (`429 Too Many Requests`)

Proteção da renderização de arquivo:

- O roteamento de solicitações do navegador para screenshot é deny-by-default.
- Apenas ativos locais do visualizador de `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
- Solicitações de rede externas são bloqueadas.

## Requisitos de navegador para o modo arquivo

`mode: "file"` e `mode: "both"` exigem um navegador compatível com Chromium.

Ordem de resolução:

1. `browser.executablePath` na configuração do OpenClaw.
2. Variáveis de ambiente:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback de descoberta de comando/caminho pela plataforma.

Texto comum de falha:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija isso instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho do executável acima.

## Solução de problemas

Erros de validação de entrada:

- `Provide patch or both before and after text.`
  - Inclua `before` e `after`, ou forneça `patch`.
- `Provide either patch or before/after input, not both.`
  - Não misture modos de entrada.
- `Invalid baseUrl: ...`
  - Use origem `http(s)` com caminho opcional, sem query/hash.
- `{field} exceeds maximum size (...)`
  - Reduza o tamanho do payload.
- Rejeição de patch grande
  - Reduza a quantidade de arquivos ou o total de linhas do patch.

Problemas de acessibilidade do visualizador:

- A URL do visualizador usa `127.0.0.1` por padrão.
- Para cenários de acesso remoto:
  - defina `viewerBaseUrl` no plugin, ou
  - passe `baseUrl` por chamada da ferramenta, ou
  - use `gateway.bind=custom` e `gateway.customBindHost`
- Se `gateway.trustedProxies` incluir loopback para um proxy no mesmo host, por exemplo Tailscale Serve, solicitações brutas ao visualizador em loopback sem headers encaminhados de IP do cliente falham em modo fail-closed por projeto.
- Para essa topologia de proxy:
  - prefira `mode: "file"` ou `mode: "both"` quando precisar apenas de um anexo, ou
  - habilite intencionalmente `security.allowRemoteViewer` e defina `viewerBaseUrl` no plugin ou passe um `baseUrl` de proxy/público quando precisar de uma URL de visualizador compartilhável
- Habilite `security.allowRemoteViewer` apenas quando você quiser acesso externo ao visualizador.

A linha de linhas não modificadas não tem botão de expandir:

- Isso pode acontecer com entrada de patch quando o patch não carrega contexto expansível.
- Isso é esperado e não indica falha no visualizador.

Artefato não encontrado:

- O artefato expirou devido ao TTL.
- O token ou o caminho mudou.
- A limpeza removeu dados obsoletos.

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais em Canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de um anexo.
- Mantenha `allowRemoteViewer` desabilitado, a menos que sua implantação exija URLs remotas de visualizador.
- Defina `ttlSeconds` curtos e explícitos para diffs sensíveis.
- Evite enviar segredos na entrada do diff quando isso não for necessário.
- Se o seu canal comprime imagens agressivamente, por exemplo Telegram ou WhatsApp, prefira saída em PDF (`fileFormat: "pdf"`).

Engine de renderização de diff:

- Desenvolvido por [Diffs](https://diffs.com).

## Documentação relacionada

- [Visão geral das ferramentas](/tools)
- [Plugins](/tools/plugin)
- [Navegador](/tools/browser)
