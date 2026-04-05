---
read_when:
    - Você quer executar o OpenClaw com modelos em nuvem ou locais via Ollama
    - Você precisa de orientação para configuração e setup do Ollama
summary: Execute o OpenClaw com o Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T12:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

O Ollama é um runtime local de LLM que facilita a execução de modelos open-source na sua máquina. O OpenClaw se integra à API nativa do Ollama (`/api/chat`), oferece suporte a streaming e chamada de ferramentas e pode detectar automaticamente modelos locais do Ollama quando você opta por isso com `OLLAMA_API_KEY` (ou um perfil de autenticação) e não define uma entrada explícita `models.providers.ollama`.

<Warning>
**Usuários de Ollama remoto**: não use a URL compatível com OpenAI em `/v1` (`http://host:11434/v1`) com o OpenClaw. Isso quebra a chamada de ferramentas, e os modelos podem produzir JSON bruto de ferramenta como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Início rápido

### Onboarding (recomendado)

A maneira mais rápida de configurar o Ollama é pelo onboarding:

```bash
openclaw onboard
```

Selecione **Ollama** na lista de provedores. O onboarding irá:

1. Pedir a URL base do Ollama onde sua instância pode ser acessada (padrão `http://127.0.0.1:11434`).
2. Permitir que você escolha **Cloud + Local** (modelos em nuvem e locais) ou **Local** (apenas modelos locais).
3. Abrir um fluxo de login no navegador se você escolher **Cloud + Local** e não estiver autenticado em ollama.com.
4. Detectar os modelos disponíveis e sugerir padrões.
5. Fazer `pull` automaticamente do modelo selecionado se ele não estiver disponível localmente.

O modo não interativo também é compatível:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcionalmente, especifique uma URL base ou modelo personalizado:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Configuração manual

1. Instale o Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Faça `pull` de um modelo local se quiser inferência local:

```bash
ollama pull glm-4.7-flash
# or
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
```

3. Se quiser modelos em nuvem também, faça login:

```bash
ollama signin
```

4. Execute o onboarding e escolha `Ollama`:

```bash
openclaw onboard
```

- `Local`: apenas modelos locais
- `Cloud + Local`: modelos locais mais modelos em nuvem
- Modelos em nuvem como `kimi-k2.5:cloud`, `minimax-m2.5:cloud` e `glm-5:cloud` **não** exigem `ollama pull` local

Atualmente, o OpenClaw sugere:

- padrão local: `glm-4.7-flash`
- padrões em nuvem: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Se preferir a configuração manual, habilite o Ollama para o OpenClaw diretamente (qualquer valor funciona; o Ollama não exige uma chave real):

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Inspecione ou troque de modelo:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Ou defina o padrão na configuração:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama`, o OpenClaw detecta modelos da instância local do Ollama em `http://127.0.0.1:11434`:

- Consulta `/api/tags`
- Usa consultas `/api/show` por melhor esforço para ler `contextWindow` quando disponível
- Marca `reasoning` com uma heurística de nome de modelo (`r1`, `reasoning`, `think`)
- Define `maxTokens` com o limite máximo padrão de tokens do Ollama usado pelo OpenClaw
- Define todos os custos como `0`

Isso evita entradas manuais de modelos, mantendo o catálogo alinhado com a instância local do Ollama.

Para ver quais modelos estão disponíveis:

```bash
ollama list
openclaw models list
```

Para adicionar um novo modelo, basta fazer `pull` com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será detectado automaticamente e ficará disponível para uso.

Se você definir `models.providers.ollama` explicitamente, a detecção automática será ignorada e você precisará definir os modelos manualmente (veja abaixo).

## Configuração

### Configuração básica (descoberta implícita)

A forma mais simples de habilitar o Ollama é por variável de ambiente:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Configuração explícita (modelos manuais)

Use configuração explícita quando:

- O Ollama estiver em outro host/porta.
- Você quiser forçar janelas de contexto ou listas de modelos específicas.
- Você quiser definições totalmente manuais de modelo.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provedor, e o OpenClaw o preencherá para verificações de disponibilidade.

### URL base personalizada (configuração explícita)

Se o Ollama estiver em execução em outro host ou porta, a configuração explícita desabilita a detecção automática, então defina os modelos manualmente:

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
        api: "ollama", // Set explicitly to guarantee native tool-calling behavior
      },
    },
  },
}
```

<Warning>
Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, no qual a chamada de ferramentas não é confiável. Use a URL base do Ollama sem sufixo de caminho.
</Warning>

### Seleção de modelo

Depois de configurado, todos os seus modelos Ollama ficam disponíveis:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Modelos em nuvem

Os modelos em nuvem permitem executar modelos hospedados na nuvem, por exemplo `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`, junto com seus modelos locais.

Para usar modelos em nuvem, selecione o modo **Cloud + Local** durante a configuração. O assistente verifica se você está autenticado e abre um fluxo de login no navegador quando necessário. Se a autenticação não puder ser verificada, o assistente volta para os padrões de modelo local.

Você também pode fazer login diretamente em [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

O OpenClaw também oferece suporte ao **Ollama Web Search** como um provedor empacotado de `web_search`.

- Ele usa o host Ollama configurado (`models.providers.ollama.baseUrl` quando definido; caso contrário, `http://127.0.0.1:11434`).
- Não exige chave.
- Exige que o Ollama esteja em execução e autenticado com `ollama signin`.

Escolha **Ollama Web Search** durante `openclaw onboard` ou `openclaw configure --section web`, ou defina:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Para detalhes completos de configuração e comportamento, consulte [Ollama Web Search](/tools/ollama-search).

## Avançado

### Modelos com raciocínio

O OpenClaw trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como capazes de raciocínio por padrão:

```bash
ollama pull deepseek-r1:32b
```

### Custos de modelo

O Ollama é gratuito e executado localmente, então todos os custos dos modelos são definidos como $0.

### Configuração de streaming

A integração do OpenClaw com o Ollama usa a **API nativa do Ollama** (`/api/chat`) por padrão, que oferece suporte completo a streaming e chamada de ferramentas ao mesmo tempo. Nenhuma configuração especial é necessária.

#### Modo legado compatível com OpenAI

<Warning>
**A chamada de ferramentas não é confiável no modo compatível com OpenAI.** Use esse modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramentas.
</Warning>

Se você precisar usar o endpoint compatível com OpenAI em vez disso, por exemplo, atrás de um proxy que só suporta o formato OpenAI, defina `api: "openai-completions"` explicitamente:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Esse modo pode não oferecer suporte a streaming + chamada de ferramentas simultaneamente. Talvez seja necessário desabilitar o streaming com `params: { streaming: false }` na configuração do modelo.

Quando `api: "openai-completions"` é usado com o Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não volte silenciosamente para uma janela de contexto de 4096. Se o seu proxy/upstream rejeitar campos `options` desconhecidos, desabilite esse comportamento:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Janelas de contexto

Para modelos detectados automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível; caso contrário, volta para a janela de contexto padrão do Ollama usada pelo OpenClaw. Você pode sobrescrever `contextWindow` e `maxTokens` na configuração explícita do provedor.

## Solução de problemas

### Ollama não detectado

Certifique-se de que o Ollama esteja em execução, de que você definiu `OLLAMA_API_KEY` (ou um perfil de autenticação) e de que você **não** definiu uma entrada explícita `models.providers.ollama`:

```bash
ollama serve
```

E de que a API está acessível:

```bash
curl http://localhost:11434/api/tags
```

### Nenhum modelo disponível

Se o seu modelo não estiver listado, faça uma destas ações:

- Faça `pull` do modelo localmente, ou
- Defina o modelo explicitamente em `models.providers.ollama`.

Para adicionar modelos:

```bash
ollama list  # See what's installed
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Or another model
```

### Conexão recusada

Verifique se o Ollama está em execução na porta correta:

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## Veja também

- [Provedores de modelos](/pt-BR/concepts/model-providers) - visão geral de todos os provedores
- [Seleção de modelos](/pt-BR/concepts/models) - como escolher modelos
- [Configuração](/pt-BR/gateway/configuration) - referência completa de configuração
