---
read_when:
    - Gerar imagens via o agente
    - Configurar provedores e modelos de geração de imagens
    - Entender os parâmetros da ferramenta `image_generate`
summary: Gere e edite imagens usando provedores configurados (OpenAI, Google Gemini, fal, MiniMax)
title: Geração de imagens
x-i18n:
    generated_at: "2026-04-05T12:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Geração de imagens

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens está disponível. Se você não vê `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel` ou defina uma chave de API de provedor.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Opcionalmente, defina seu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Peça ao agente: _"Gere uma imagem de um mascote lagosta amigável."_

O agente chama `image_generate` automaticamente. Não é necessário allow-listing da ferramenta — ela é habilitada por padrão quando um provedor está disponível.

## Provedores compatíveis

| Provedor | Modelo padrão                   | Suporte a edição       | Chave de API                                           |
| -------- | ------------------------------- | ---------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                   | Sim (até 5 imagens)    | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sim                    | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                   |
| fal      | `fal-ai/flux/dev`               | Sim                    | `FAL_KEY`                                              |
| MiniMax  | `image-01`                      | Sim (imagem de referência de assunto) | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |

Use `action: "list"` para inspecionar os provedores e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

| Parâmetro    | Tipo     | Descrição                                                                             |
| ------------ | -------- | ------------------------------------------------------------------------------------- |
| `prompt`     | string   | Prompt de geração de imagem (obrigatório para `action: "generate"`)                   |
| `action`     | string   | `"generate"` (padrão) ou `"list"` para inspecionar provedores                         |
| `model`      | string   | Substituição de provedor/modelo, por exemplo `openai/gpt-image-1`                     |
| `image`      | string   | Caminho ou URL de imagem de referência única para o modo de edição                    |
| `images`     | string[] | Várias imagens de referência para o modo de edição (até 5)                            |
| `size`       | string   | Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`      |
| `aspectRatio` | string  | Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`    |
| `resolution` | string   | Dica de resolução: `1K`, `2K` ou `4K`                                                 |
| `count`      | number   | Número de imagens a gerar (1–4)                                                       |
| `filename`   | string   | Dica de nome de arquivo de saída                                                      |

Nem todos os provedores oferecem suporte a todos os parâmetros. A ferramenta passa o que cada provedor aceita e ignora o restante.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      // Forma string: apenas modelo principal
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Forma objeto: principal + fallbacks ordenados
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordem de seleção de provedor

Ao gerar uma imagem, o OpenClaw tenta os provedores nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa apenas padrões de provedor com autenticação:
   - provedor padrão atual primeiro
   - provedores restantes de geração de imagens registrados em ordem de id do provedor

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo candidato será tentado automaticamente. Se todos falharem, o erro incluirá detalhes de cada tentativa.

Observações:

- A detecção automática considera autenticação. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw realmente consegue autenticar esse provedor.
- Use `action: "list"` para inspecionar os provedores registrados no momento, seus
  modelos padrão e dicas de variáveis de ambiente de autenticação.

### Edição de imagem

OpenAI, Google, fal e MiniMax oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Gere uma versão em aquarela desta foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google oferecem suporte a até 5 imagens de referência via o parâmetro `images`. fal e MiniMax oferecem suporte a 1.

A geração de imagens MiniMax está disponível pelos dois caminhos de autenticação empacotados do MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capacidades do provedor

| Capacidade             | OpenAI             | Google               | fal                 | MiniMax                     |
| ---------------------- | ------------------ | -------------------- | ------------------- | --------------------------- |
| Gerar                  | Sim (até 4)        | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                 |
| Editar/referência      | Sim (até 5 imagens) | Sim (até 5 imagens) | Sim (1 imagem)      | Sim (1 imagem, ref de assunto) |
| Controle de tamanho    | Sim                | Sim                  | Sim                 | Não                         |
| Proporção              | Não                | Sim                  | Sim (apenas geração) | Sim                        |
| Resolução (1K/2K/4K)   | Não                | Sim                  | Sim                 | Não                         |

## Relacionado

- [Visão geral das ferramentas](/tools) — todas as ferramentas de agente disponíveis
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — configuração `imageGenerationModel`
- [Models](/pt-BR/concepts/models) — configuração de modelo e failover
