---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o mecanismo legado e um mecanismo de plugin
    - Você está criando um plugin de mecanismo de contexto
summary: 'Mecanismo de contexto: montagem de contexto conectável, compactação e ciclo de vida de subagentes'
title: Mecanismo de Contexto
x-i18n:
    generated_at: "2026-04-05T12:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Mecanismo de Contexto

Um **mecanismo de contexto** controla como o OpenClaw constrói o contexto do modelo para cada execução.
Ele decide quais mensagens incluir, como resumir o histórico mais antigo e como
gerenciar o contexto entre limites de subagentes.

O OpenClaw inclui um mecanismo integrado `legacy`. Plugins podem registrar
mecanismos alternativos que substituem o ciclo de vida do mecanismo de contexto ativo.

## Início rápido

Verifique qual mecanismo está ativo:

```bash
openclaw doctor
# ou inspecione a configuração diretamente:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalando um plugin de mecanismo de contexto

Plugins de mecanismo de contexto são instalados como qualquer outro plugin do OpenClaw. Instale
primeiro e depois selecione o mecanismo no slot:

```bash
# Instalar pelo npm
openclaw plugins install @martian-engineering/lossless-claw

# Ou instalar de um caminho local (para desenvolvimento)
openclaw plugins install -l ./my-context-engine
```

Depois, ative o plugin e selecione-o como o mecanismo ativo na sua configuração:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // deve corresponder ao id do mecanismo registrado pelo plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // A configuração específica do plugin vai aqui (consulte a documentação do plugin)
      },
    },
  },
}
```

Reinicie o gateway após instalar e configurar.

Para voltar ao mecanismo integrado, defina `contextEngine` como `"legacy"` (ou
remova a chave por completo — `"legacy"` é o padrão).

## Como funciona

Sempre que o OpenClaw executa um prompt de modelo, o mecanismo de contexto participa em
quatro pontos do ciclo de vida:

1. **Ingest** — chamado quando uma nova mensagem é adicionada à sessão. O mecanismo
   pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
2. **Assemble** — chamado antes de cada execução do modelo. O mecanismo retorna um conjunto
   ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe dentro
   do orçamento de tokens.
3. **Compact** — chamado quando a janela de contexto está cheia, ou quando o usuário executa
   `/compact`. O mecanismo resume o histórico mais antigo para liberar espaço.
4. **After turn** — chamado após a conclusão de uma execução. O mecanismo pode persistir estado,
   disparar compactação em segundo plano ou atualizar índices.

### Ciclo de vida de subagentes (opcional)

Atualmente, o OpenClaw chama um hook do ciclo de vida de subagentes:

- **onSubagentEnded** — faz limpeza quando uma sessão de subagente é concluída ou varrida.

O hook `prepareSubagentSpawn` faz parte da interface para uso futuro, mas
o runtime ainda não o invoca.

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw
a prefixa ao prompt do sistema da execução. Isso permite que mecanismos injetem
orientações dinâmicas de recuperação, instruções de recuperação de informação ou dicas
sensíveis ao contexto sem exigir arquivos estáticos no workspace.

## O mecanismo legado

O mecanismo integrado `legacy` preserva o comportamento original do OpenClaw:

- **Ingest**: no-op (o gerenciador de sessão lida diretamente com a persistência de mensagens).
- **Assemble**: pass-through (o pipeline existente sanitize → validate → limit
  no runtime cuida da montagem do contexto).
- **Compact**: delega para a compactação integrada baseada em resumo, que cria
  um único resumo das mensagens mais antigas e mantém intactas as mensagens recentes.
- **After turn**: no-op.

O mecanismo legado não registra ferramentas nem fornece `systemPromptAddition`.

Quando `plugins.slots.contextEngine` não está definido (ou está definido como `"legacy"`), esse
mecanismo é usado automaticamente.

## Mecanismos de plugin

Um plugin pode registrar um mecanismo de contexto usando a API de plugins:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Armazene a mensagem no seu armazenamento de dados
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Retorne mensagens que cabem no orçamento
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Resuma o contexto mais antigo
      return { ok: true, compacted: true };
    },
  }));
}
```

Depois, ative-o na configuração:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### A interface ContextEngine

Membros obrigatórios:

| Membro             | Tipo      | Finalidade                                               |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Propriedade | ID, nome, versão do mecanismo e se ele controla a compactação |
| `ingest(params)`   | Método    | Armazenar uma única mensagem                             |
| `assemble(params)` | Método    | Construir contexto para uma execução de modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reduzir o contexto                               |

`assemble` retorna um `AssembleResult` com:

- `messages` — as mensagens ordenadas a serem enviadas ao modelo.
- `estimatedTokens` (obrigatório, `number`) — a estimativa do mecanismo do total de
  tokens no contexto montado. O OpenClaw usa isso para decisões de limiar de compactação
  e relatórios de diagnóstico.
- `systemPromptAddition` (opcional, `string`) — prefixado ao prompt do sistema.

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                       |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do mecanismo para uma sessão. Chamado uma vez quando o mecanismo vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como lote. Chamado após a conclusão de uma execução, com todas as mensagens desse turno de uma só vez. |
| `afterTurn(params)`            | Método | Trabalho pós-execução do ciclo de vida (persistir estado, disparar compactação em segundo plano).              |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha.                                                           |
| `onSubagentEnded(params)`      | Método | Fazer limpeza após o término de um subagente.                                                                    |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do gateway ou recarga do plugin — não por sessão.             |

### ownsCompaction

`ownsCompaction` controla se a compactação automática integrada do Pi durante a tentativa permanece
ativada para a execução:

- `true` — o mecanismo controla o comportamento de compactação. O OpenClaw desativa a
  compactação automática integrada do Pi para essa execução, e a implementação `compact()` do mecanismo
  é responsável por `/compact`, compactação de recuperação por overflow e qualquer compactação
  proativa que ele queira fazer em `afterTurn()`.
- `false` ou não definido — a compactação automática integrada do Pi ainda pode ser executada durante a
  execução do prompt, mas o método `compact()` do mecanismo ativo ainda é chamado para
  `/compact` e recuperação por overflow.

`ownsCompaction: false` **não** significa que o OpenClaw faz fallback automaticamente para
o caminho de compactação do mecanismo legado.

Isso significa que há dois padrões válidos de plugin:

- **Modo proprietário** — implemente seu próprio algoritmo de compactação e defina
  `ownsCompaction: true`.
- **Modo delegante** — defina `ownsCompaction: false` e faça `compact()` chamar
  `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar
  o comportamento de compactação integrado do OpenClaw.

Um `compact()` no-op é inseguro para um mecanismo ativo não proprietário porque
desativa o caminho normal de compactação de `/compact` e de recuperação por overflow para esse
slot de mecanismo.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Seleciona o mecanismo de contexto ativo. Padrão: "legacy".
      // Defina como um id de plugin para usar um mecanismo de plugin.
      contextEngine: "legacy",
    },
  },
}
```

O slot é exclusivo em runtime — apenas um mecanismo de contexto registrado é
resolvido para uma determinada execução ou operação de compactação. Outros
plugins `kind: "context-engine"` ativados ainda podem ser carregados e executar seu código de
registro; `plugins.slots.contextEngine` apenas seleciona qual id de mecanismo registrado
o OpenClaw resolve quando precisa de um mecanismo de contexto.

## Relação com compactação e memória

- **Compactação** é uma das responsabilidades do mecanismo de contexto. O mecanismo legado
  delega para o resumo integrado do OpenClaw. Mecanismos de plugin podem implementar
  qualquer estratégia de compactação (resumos em DAG, recuperação vetorial etc.).
- **Plugins de memória** (`plugins.slots.memory`) são separados dos mecanismos de contexto.
  Plugins de memória fornecem busca/recuperação; mecanismos de contexto controlam o que o
  modelo vê. Eles podem funcionar juntos — um mecanismo de contexto pode usar dados de
  plugin de memória durante a montagem.
- **Poda de sessão** (remover resultados antigos de ferramentas da memória) ainda é executada
  independentemente de qual mecanismo de contexto esteja ativo.

## Dicas

- Use `openclaw doctor` para verificar se o seu mecanismo está sendo carregado corretamente.
- Ao alternar de mecanismo, sessões existentes continuam com o histórico atual.
  O novo mecanismo assume para execuções futuras.
- Erros do mecanismo são registrados e exibidos em diagnósticos. Se um mecanismo de plugin
  falhar ao registrar ou se o id de mecanismo selecionado não puder ser resolvido, o OpenClaw
  não faz fallback automaticamente; as execuções falham até que você corrija o plugin ou
  altere `plugins.slots.contextEngine` de volta para `"legacy"`.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um
  diretório de plugin local sem copiar.

Consulte também: [Compactação](/concepts/compaction), [Contexto](/concepts/context),
[Plugins](/tools/plugin), [Manifesto do plugin](/plugins/manifest).

## Relacionado

- [Contexto](/concepts/context) — como o contexto é construído para turnos do agente
- [Arquitetura de Plugins](/plugins/architecture) — registro de plugins de mecanismo de contexto
- [Compactação](/concepts/compaction) — resumindo conversas longas
