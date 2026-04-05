---
read_when:
    - Projetando ou refatorando o entendimento de mídia
    - Ajustando o pré-processamento de áudio/vídeo/imagem de entrada
summary: Entendimento de imagem/áudio/vídeo de entrada (opcional) com fallbacks por provider + CLI
title: Entendimento de mídia
x-i18n:
    generated_at: "2026-04-05T12:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Entendimento de mídia - Entrada (2026-01-17)

O OpenClaw pode **resumir mídia de entrada** (imagem/áudio/vídeo) antes de o pipeline de resposta ser executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provider estão disponíveis e pode ser desativado ou personalizado. Se o entendimento estiver desativado, os modelos ainda receberão os arquivos/URLs originais normalmente.

O comportamento de mídia específico de cada fornecedor é registrado por plugins do fornecedor, enquanto o
core do OpenClaw é proprietário da configuração compartilhada `tools.media`, da ordem de fallback e da integração com o pipeline de resposta.

## Objetivos

- Opcional: fazer um pré-processamento da mídia de entrada em texto curto para roteamento mais rápido + melhor análise de comandos.
- Preservar sempre a entrega da mídia original ao modelo.
- Oferecer suporte a **APIs de provider** e **fallbacks por CLI**.
- Permitir vários modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

1. Coletar anexos de entrada (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidade ativada (imagem/áudio/vídeo), selecionar anexos conforme a política (padrão: **primeiro**).
3. Escolher a primeira entrada de modelo elegível (tamanho + capacidade + autenticação).
4. Se um modelo falhar ou a mídia for grande demais, **recorrer à próxima entrada**.
5. Em caso de sucesso:
   - `Body` se torna um bloco `[Image]`, `[Audio]` ou `[Video]`.
   - Áudio define `{{Transcript}}`; a análise de comandos usa o texto da legenda quando presente,
     caso contrário usa a transcrição.
   - As legendas são preservadas como `User text:` dentro do bloco.

Se o entendimento falhar ou estiver desativado, **o fluxo de resposta continua** com o corpo original + anexos.

## Visão geral da configuração

`tools.media` oferece suporte a **modelos compartilhados** mais substituições por capacidade:

- `tools.media.models`: lista compartilhada de modelos (use `capabilities` para limitar).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - substituições de provider (`baseUrl`, `headers`, `providerOptions`)
  - opções de áudio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - controles de eco da transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
  - **lista `models` opcional por capacidade** (preferida antes dos modelos compartilhados)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (bloqueio opcional por canal/chatType/chave de sessão)
- `tools.media.concurrency`: número máximo de execuções concorrentes de capacidade (padrão **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartilhada */
      ],
      image: {
        /* substituições opcionais */
      },
      audio: {
        /* substituições opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* substituições opcionais */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` pode ser de **provider** ou **CLI**:

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

- Se a mídia exceder `maxBytes`, esse modelo é ignorado e o **próximo modelo é tentado**.
- Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provider/CLI.
- Se o modelo retornar mais que `maxChars`, a saída será truncada.
- `prompt` usa por padrão um simples “Descreva a {media}.” mais a orientação de `maxChars` (somente imagem/vídeo).
- Se o modelo de imagem principal ativo já oferecer suporte nativo a visão, o OpenClaw
  ignora o bloco de resumo `[Image]` e passa a imagem original ao
  modelo.
- Se `<capability>.enabled: true`, mas nenhum modelo estiver configurado, o OpenClaw tentará o
  **modelo de resposta ativo** quando o provider dele oferecer suporte à capacidade.

### Detecção automática de entendimento de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não tiver
configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira
opção funcional**:

1. **Modelo de resposta ativo** quando o provider dele oferece suporte à capacidade.
2. **`agents.defaults.imageModel`** refs primários/fallbacks (somente imagem).
3. **CLIs locais** (somente áudio; se instaladas)
   - `sherpa-onnx-offline` (exige `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; baixa modelos automaticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticação de provider**
   - Entradas configuradas em `models.providers.*` com suporte à capacidade são
     tentadas antes da ordem de fallback incluída.
   - Providers de config apenas para imagem com um modelo compatível com imagem se registram automaticamente para
     entendimento de mídia, mesmo quando não são um plugin incluído do fornecedor.
   - Ordem de fallback incluída:
     - Áudio: OpenAI → Groq → Deepgram → Google → Mistral
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

Observação: a detecção de binários é best-effort em macOS/Linux/Windows; verifique se a CLI está no `PATH` (expandimos `~`) ou defina um modelo CLI explícito com o caminho completo do comando.

### Suporte a ambiente de proxy (modelos de provider)

Quando o entendimento de mídia por provider de **áudio** e **vídeo** está ativado, o OpenClaw
respeita as variáveis de ambiente padrão de proxy de saída para chamadas HTTP ao provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de proxy estiver definida, o entendimento de mídia usa saída direta.
Se o valor do proxy estiver malformado, o OpenClaw registra um aviso e recorre à
busca direta.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada será executada apenas para esses tipos de mídia. Para listas compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagem:
  **image**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências surpreendentes.
Se você omitir `capabilities`, a entrada será elegível para a lista em que aparece.

## Matriz de suporte de providers (integrações OpenClaw)

| Capacidade | Integração de provider                                                             | Observações                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Imagem     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers de config | Plugins do fornecedor registram suporte a imagem; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; providers de config compatíveis com imagem se registram automaticamente. |
| Áudio      | OpenAI, Groq, Deepgram, Google, Mistral                                            | Transcrição por provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Vídeo      | Google, Qwen, Moonshot                                                             | Entendimento de vídeo por provider via plugins do fornecedor; o entendimento de vídeo do Qwen usa os endpoints padrão do DashScope.      |

Observação sobre MiniMax:

- O entendimento de imagem de `minimax` e `minimax-portal` vem do provider de mídia
  `MiniMax-VL-01`, de propriedade do plugin.
- O catálogo de texto incluído do MiniMax continua começando apenas com texto; entradas explícitas em
  `models.providers.minimax` materializam refs de chat M2.7 compatíveis com imagem.

## Orientação para seleção de modelo

- Prefira o modelo mais forte e de geração mais recente disponível para cada capacidade de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas lidando com entradas não confiáveis, evite modelos de mídia mais antigos/mais fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks por CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provider não estão disponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos que não sejam `txt` recorrem a stdout.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

- `mode`: `first` (padrão) ou `all`
- `maxAttachments`: limita o número processado (padrão **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, as saídas recebem rótulos `[Image 1/2]`, `[Audio 2/2]` etc.

Comportamento de extração de anexos de arquivo:

- O texto extraído do arquivo é envolvido como **conteúdo externo não confiável** antes de ser
  acrescentado ao prompt de mídia.
- O bloco injetado usa marcadores explícitos de limite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados
  `Source: External`.
- Esse caminho de extração de anexos omite intencionalmente o banner longo
  `SECURITY NOTICE:` para evitar aumentar demais o prompt de mídia; os marcadores
  de limite e os metadados ainda permanecem.
- Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
- Se um PDF recorrer a imagens renderizadas das páginas nesse caminho, o prompt de mídia mantém
  o placeholder `[PDF content rendered to images; images not forwarded to model]`
  porque essa etapa de extração de anexos encaminha blocos de texto, não as imagens renderizadas do PDF.

## Exemplos de configuração

### 1) Lista compartilhada de modelos + substituições

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

### 3) Entendimento opcional de imagem

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

Quando o entendimento de mídia é executado, `/status` inclui uma linha curta de resumo:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Isso mostra os resultados por capacidade e o provider/modelo escolhido, quando aplicável.

## Observações

- O entendimento é **best-effort**. Erros não bloqueiam respostas.
- Os anexos ainda são passados aos modelos mesmo quando o entendimento está desativado.
- Use `scope` para limitar onde o entendimento é executado (por exemplo, apenas DMs).

## Documentação relacionada

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
