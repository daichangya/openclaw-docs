---
read_when:
    - Projetando ou refatorando a compreensão de mídia
    - Ajustando o pré-processamento de áudio/vídeo/imagem de entrada
summary: Compreensão de imagem/áudio/vídeo de entrada (opcional) com fallbacks de provider + CLI
title: Compreensão de mídia
x-i18n:
    generated_at: "2026-04-23T05:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compreensão de mídia - Entrada (2026-01-17)

O OpenClaw pode **resumir mídia de entrada** (imagem/áudio/vídeo) antes que o pipeline de resposta seja executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provider estão disponíveis, e pode ser desativado ou personalizado. Se a compreensão estiver desativada, os modelos ainda receberão os arquivos/URLs originais normalmente.

O comportamento de mídia específico de vendor é registrado por plugins de vendor, enquanto o
core do OpenClaw é responsável pela config compartilhada `tools.media`, pela ordem de fallback e pela
integração com o pipeline de resposta.

## Objetivos

- Opcional: pré-processar mídia de entrada em texto curto para roteamento mais rápido + melhor parsing de comandos.
- Preservar sempre a entrega da mídia original ao modelo.
- Oferecer suporte a **APIs de provider** e **fallbacks por CLI**.
- Permitir múltiplos modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

1. Coletar anexos de entrada (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidade ativada (imagem/áudio/vídeo), selecionar anexos de acordo com a política (padrão: **primeiro**).
3. Escolher a primeira entrada de modelo elegível (tamanho + capacidade + autenticação).
4. Se um modelo falhar ou a mídia for grande demais, usar **fallback para a próxima entrada**.
5. Em caso de sucesso:
   - `Body` passa a ser um bloco `[Image]`, `[Audio]` ou `[Video]`.
   - Áudio define `{{Transcript}}`; o parsing de comandos usa o texto da legenda quando presente,
     caso contrário usa a transcrição.
   - Legendas são preservadas como `User text:` dentro do bloco.

Se a compreensão falhar ou estiver desativada, **o fluxo de resposta continua** com o corpo + anexos originais.

## Visão geral da config

`tools.media` oferece suporte a **modelos compartilhados** mais sobrescritas por capacidade:

- `tools.media.models`: lista compartilhada de modelos (use `capabilities` para controlar).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sobrescritas de provider (`baseUrl`, `headers`, `providerOptions`)
  - opções de áudio do Deepgram via `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
  - lista opcional de `models` **por capacidade** (preferida antes dos modelos compartilhados)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (controle opcional por canal/chatType/chave de sessão)
- `tools.media.concurrency`: máximo de execuções concorrentes por capacidade (padrão **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartilhada */
      ],
      image: {
        /* sobrescritas opcionais */
      },
      audio: {
        /* sobrescritas opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* sobrescritas opcionais */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada em `models[]` pode ser de **provider** ou **CLI**:

```json5
{
  type: "provider", // padrão se omitido
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Descreva a imagem em <= 500 caracteres.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcional, usado para entradas multimodais
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Leia a mídia em {{MediaPath}} e descreva-a em <= {{MaxChars}} caracteres.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Templates de CLI também podem usar:

- `{{MediaDir}}` (diretório que contém o arquivo de mídia)
- `{{OutputDir}}` (diretório temporário criado para esta execução)
- `{{OutputBase}}` (caminho base do arquivo temporário, sem extensão)

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, amigável para comandos)
- `maxChars`: **não definido** para áudio (transcrição completa, a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

Regras:

- Se a mídia exceder `maxBytes`, esse modelo será ignorado e **o próximo modelo será tentado**.
- Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provider/CLI.
- Se o modelo retornar mais que `maxChars`, a saída será truncada.
- `prompt` usa por padrão algo simples como “Descreva a {mídia}.” mais a orientação de `maxChars` (somente imagem/vídeo).
- Se o modelo de imagem principal ativo já oferecer suporte nativo a visão, o OpenClaw
  ignora o bloco de resumo `[Image]` e passa a imagem original diretamente para o
  modelo.
- Solicitações explícitas de `openclaw infer image describe --model <provider/model>` são diferentes: elas executam diretamente esse provider/modelo com capacidade de imagem, incluindo
  refs do Ollama como `ollama/qwen2.5vl:7b`.
- Se `<capability>.enabled: true`, mas nenhum modelo estiver configurado, o OpenClaw tenta o
  **modelo de resposta ativo** quando o provider dele oferece suporte à capacidade.

### Detecção automática de compreensão de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** for definido como `false` e você não tiver
configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira
opção funcional**:

1. **Modelo de resposta ativo** quando o provider dele oferece suporte à capacidade.
2. Refs principal/fallback de **`agents.defaults.imageModel`** (somente imagem).
3. **CLIs locais** (somente áudio; se instaladas)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny empacotado)
   - `whisper` (CLI Python; baixa modelos automaticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticação de provider**
   - Entradas configuradas em `models.providers.*` que oferecem suporte à capacidade são
     tentadas antes da ordem de fallback empacotada.
   - Providers de config somente de imagem com um modelo com capacidade de imagem são registrados automaticamente para
     compreensão de mídia, mesmo quando não são um plugin de vendor empacotado.
   - A compreensão de imagem com Ollama está disponível quando selecionada explicitamente, por
     exemplo, por meio de `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordem de fallback empacotada:
     - Áudio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Imagem: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vídeo: Google → Qwen → Moonshot

Para desativar a detecção automática, defina:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Observação: a detecção de binários é best-effort em macOS/Linux/Windows; garanta que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho completo para o comando.

### Suporte a ambiente de proxy (modelos de provider)

Quando a compreensão de mídia por **áudio** e **vídeo** baseada em provider está ativada, o OpenClaw
respeita variáveis de ambiente padrão de proxy de saída para chamadas HTTP do provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a compreensão de mídia usa saída direta.
Se o valor do proxy estiver malformado, o OpenClaw registra um aviso e usa fallback para busca direta.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada será executada apenas para esses tipos de mídia. Para
listas compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo com capacidade de imagem:
  **image**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências surpreendentes.
Se você omitir `capabilities`, a entrada será elegível para a lista em que aparece.

## Matriz de suporte de provider (integrações do OpenClaw)

| Capacidade | Integração de provider                                                               | Observações                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagem     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers de config | Plugins de vendor registram suporte a imagem; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; providers de config com capacidade de imagem são registrados automaticamente. |
| Áudio      | OpenAI, Groq, Deepgram, Google, Mistral                                              | Transcrição por provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                  |
| Vídeo      | Google, Qwen, Moonshot                                                               | Compreensão de vídeo por provider via plugins de vendor; a compreensão de vídeo do Qwen usa os endpoints Standard DashScope.                |

Observação sobre o MiniMax:

- A compreensão de imagem com `minimax` e `minimax-portal` vem do provider de mídia
  `MiniMax-VL-01` pertencente ao plugin.
- O catálogo de texto empacotado do MiniMax continua começando apenas com texto; entradas explícitas de
  `models.providers.minimax` materializam refs de chat M2.7 com capacidade de imagem.

## Orientação para seleção de modelo

- Prefira o modelo mais forte e de geração mais recente disponível para cada capacidade de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas lidando com entradas não confiáveis, evite modelos de mídia mais antigos/fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks por CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provider não estão disponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos que não sejam `txt` usam stdout como fallback.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

- `mode`: `first` (padrão) ou `all`
- `maxAttachments`: limita o número processado (padrão **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, as saídas são rotuladas como `[Image 1/2]`, `[Audio 2/2]` etc.

Comportamento de extração de anexo de arquivo:

- O texto extraído do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser
  anexado ao prompt de mídia.
- O bloco injetado usa marcadores explícitos de limite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados
  `Source: External`.
- Este caminho de extração de anexo intencionalmente omite o banner longo
  `SECURITY NOTICE:` para evitar aumentar demais o prompt de mídia; os marcadores de
  limite e os metadados ainda permanecem.
- Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
- Se um PDF usar fallback para imagens renderizadas de páginas neste caminho, o prompt de mídia mantém
  o placeholder `[PDF content rendered to images; images not forwarded to model]`
  porque esta etapa de extração de anexo encaminha blocos de texto, não as imagens renderizadas do PDF.

## Exemplos de config

### 1) Lista compartilhada de modelos + sobrescritas

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Leia a mídia em {{MediaPath}} e descreva-a em <= {{MaxChars}} caracteres.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Somente áudio + vídeo (imagem desativada)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Leia a mídia em {{MediaPath}} e descreva-a em <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Compreensão opcional de imagem

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Leia a mídia em {{MediaPath}} e descreva-a em <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entrada única multimodal (capacidades explícitas)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Saída de status

Quando a compreensão de mídia é executada, `/status` inclui uma linha curta de resumo:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Isso mostra resultados por capacidade e o provider/modelo escolhido quando aplicável.

## Observações

- A compreensão é **best-effort**. Erros não bloqueiam respostas.
- Os anexos ainda são passados aos modelos mesmo quando a compreensão está desativada.
- Use `scope` para limitar onde a compreensão é executada (por exemplo, apenas em DMs).

## Documentos relacionados

- [Configuração](/pt-BR/gateway/configuration)
- [Suporte a imagem e mídia](/pt-BR/nodes/images)
