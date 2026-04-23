---
read_when:
    - Você está alterando o runtime de agente incorporado ou o registro de harnesses
    - Você está registrando um agent harness a partir de um plugin empacotado ou confiável
    - Você precisa entender como o plugin Codex se relaciona com providers de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental de SDK para plugins que substituem o executor incorporado de baixo nível do agente
title: Plugins de Agent Harness
x-i18n:
    generated_at: "2026-04-23T05:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins de Agent Harness

Um **agent harness** é o executor de baixo nível de um turno preparado de agente do OpenClaw.
Ele não é um provider de modelo, não é um canal e não é um registro de ferramentas.

Use esta superfície apenas para plugins nativos empacotados ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro espelham intencionalmente o runner
incorporado atual.

## Quando usar um harness

Registre um agent harness quando uma família de modelos tiver seu próprio runtime
nativo de sessão e o transporte normal de provider do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de programação que controla threads e Compaction
- uma CLI ou daemon local que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa do seu próprio ID de retomada além da
  transcrição de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs normais de modelo por HTTP ou
WebSocket, crie um [plugin de provider](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provider e modelo
- estado de autenticação do runtime
- nível de raciocínio e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback de modelo e troca dinâmica de modelo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe
providers, não substitui a entrega do canal e não troca modelos silenciosamente.

## Registrar um harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Meu agent harness nativo",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Inicie ou retome sua thread nativa.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent e os outros campos de tentativa preparada.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Meu agente nativo",
  description: "Executa modelos selecionados por meio de um daemon de agente nativo.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provider/modelo:

1. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id.
2. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI interno.
3. `OPENCLAW_AGENT_RUNTIME=auto` pede aos harnesses registrados que informem se oferecem suporte ao
   provider/modelo resolvido.
4. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja
   desativado.

Falhas de harness de plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI é
usado apenas quando nenhum harness de plugin registrado oferece suporte ao
provider/modelo resolvido. Quando um harness de plugin já assumiu uma execução, o OpenClaw não
reexecuta esse mesmo turno por PI porque isso pode alterar a semântica de autenticação/runtime
ou duplicar efeitos colaterais.

O plugin Codex empacotado registra `codex` como seu id de harness. O core trata isso
como um id comum de harness de plugin; aliases específicos do Codex pertencem ao plugin
ou à config do operador, não ao seletor compartilhado de runtime.

## Pareamento de provider e harness

A maioria dos harnesses também deve registrar um provider. O provider torna refs de modelo,
status de autenticação, metadados de modelo e seleção de `/model` visíveis para o restante do
OpenClaw. O harness então assume esse provider em `supports(...)`.

O plugin Codex empacotado segue esse padrão:

- id do provider: `codex`
- refs de modelo do usuário: `codex/gpt-5.4`, `codex/gpt-5.2` ou outro modelo retornado
  pelo servidor de aplicativo do Codex
- id do harness: `codex`
- autenticação: disponibilidade sintética do provider, porque o harness Codex controla o
  login/sessão nativo do Codex
- requisição ao servidor de aplicativo: o OpenClaw envia o id simples do modelo para o Codex e deixa o
  harness falar com o protocolo nativo do servidor de aplicativo

O plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam sendo refs de provider OpenAI
e seguem usando o caminho normal de provider do OpenClaw. Selecione `codex/gpt-*`
quando quiser autenticação gerenciada pelo Codex, descoberta de modelos do Codex, threads nativas e
execução pelo servidor de aplicativo do Codex. `/model` pode alternar entre os modelos do Codex retornados
pelo servidor de aplicativo do Codex sem exigir credenciais do provider OpenAI.

Para configuração do operador, exemplos de prefixo de modelo e configs exclusivas do Codex, consulte
[Codex Harness](/pt-BR/plugins/codex-harness).

O OpenClaw exige servidor de aplicativo do Codex `0.118.0` ou mais recente. O plugin Codex verifica
o handshake de inicialização do servidor de aplicativo e bloqueia servidores mais antigos ou sem versão para que
o OpenClaw execute apenas na superfície de protocolo com a qual foi testado.

### Middleware de resultado de ferramenta do servidor de aplicativo do Codex

Plugins empacotados também podem anexar middleware específico de `tool_result` do servidor de aplicativo do Codex por meio de `api.registerCodexAppServerExtensionFactory(...)` quando seu
manifest declara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Essa é a seam de plugin confiável para transformações assíncronas de resultado de ferramenta que precisam
ser executadas dentro do harness nativo do Codex antes que a saída da ferramenta seja projetada de volta
na transcrição do OpenClaw.

### Modo de harness nativo do Codex

O harness `codex` empacotado é o modo nativo do Codex para turnos de agente incorporado do OpenClaw.
Ative primeiro o plugin `codex` empacotado e inclua `codex` em
`plugins.allow` se sua config usar uma allowlist restritiva. Ele é diferente de `openai-codex/*`:

- `openai-codex/*` usa OAuth do ChatGPT/Codex pelo caminho normal de provider do OpenClaw.
- `codex/*` usa o provider Codex empacotado e roteia o turno pelo
  servidor de aplicativo do Codex.

Quando este modo é executado, o Codex controla o id nativo da thread, comportamento de retomada,
Compaction e execução no servidor de aplicativo. O OpenClaw ainda controla o canal de chat,
espelho visível da transcrição, política de ferramentas, aprovações, entrega de mídia e seleção
de sessão. Use `embeddedHarness.runtime: "codex"` com
`embeddedHarness.fallback: "none"` quando precisar provar que apenas o caminho do
servidor de aplicativo do Codex pode assumir a execução. Essa config é apenas um guarda de seleção:
falhas do servidor de aplicativo do Codex já falham diretamente em vez de tentar novamente por PI.

## Desativar fallback para PI

Por padrão, o OpenClaw executa agentes incorporados com `agents.defaults.embeddedHarness`
definido como `{ runtime: "auto", fallback: "pi" }`. No modo `auto`, harnesses de plugin registrados
podem assumir um par provider/modelo. Se nenhum corresponder, o OpenClaw usa fallback para PI.

Defina `fallback: "none"` quando precisar que a ausência de seleção de harness de plugin resulte em falha
em vez de usar PI. Falhas de harness de plugin já selecionado já falham de forma rígida. Isso
não bloqueia um `runtime: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções incorporadas exclusivas do Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se você quiser que qualquer harness de plugin registrado assuma modelos correspondentes, mas nunca
quiser que o OpenClaw use fallback silencioso para PI, mantenha `runtime: "auto"` e desative
o fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Sobrescritas por agente usam o mesmo formato:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ainda sobrescreve o runtime configurado. Use
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desativar o fallback para PI a partir do
ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, uma sessão falha antecipadamente quando o harness solicitado não está
registrado, não oferece suporte ao provider/modelo resolvido ou falha antes de
produzir efeitos colaterais do turno. Isso é intencional para implantações exclusivas do Codex e
para testes ao vivo que precisam provar que o caminho do servidor de aplicativo do Codex está realmente em uso.

Essa configuração controla apenas o harness de agente incorporado. Ela não desativa
roteamento específico de provider para imagem, vídeo, música, TTS, PDF ou outros modelos.

## Sessões nativas e espelho da transcrição

Um harness pode manter um id de sessão nativa, id de thread ou token de retomada do lado do daemon.
Mantenha esse vínculo explicitamente associado à sessão do OpenClaw e continue
espelhando saída visível ao usuário do assistente/ferramenta para a transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação da transcrição
- voltar a usar o harness PI interno em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se seu harness armazenar um vínculo auxiliar, implemente `reset(...)` para que o OpenClaw possa
limpá-lo quando a sessão correspondente do OpenClaw for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a repassa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta por meio
do formato de resultado do harness em vez de enviar mídia de canal por conta própria.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramenta de mensagens
no mesmo caminho de entrega das execuções com suporte de PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira plugins de provider
  até precisar de um runtime nativo de sessão.
- A troca de harness é compatível entre turnos. Não troque harnesses no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de
  mensagem tiverem começado.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins)
- [Codex Harness](/pt-BR/plugins/codex-harness)
- [Providers de modelo](/pt-BR/concepts/model-providers)
