---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de autenticação por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, compreensão de mídia, TTS, pesquisa na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

O Plugin do Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, compreensão de mídia (imagem/áudio/vídeo), conversão de texto em fala e pesquisa na web via
Gemini Grounding.

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Provedor alternativo: `google-gemini-cli` (OAuth)

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API">
    **Melhor para:** acesso padrão à API Gemini por meio do Google AI Studio.

    <Steps>
      <Step title="Executar onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    As variáveis de ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` são ambas aceitas. Use a que você já tiver configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Melhor para:** reutilizar um login existente do Gemini CLI via OAuth PKCE em vez de uma chave de API separada.

    <Warning>
    O provedor `google-gemini-cli` é uma integração não oficial. Alguns usuários
    relatam restrições de conta ao usar OAuth dessa forma. Use por sua própria conta e risco.
    </Warning>

    <Steps>
      <Step title="Instalar o Gemini CLI">
        O comando local `gemini` deve estar disponível no `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        O OpenClaw oferece suporte tanto a instalações via Homebrew quanto a instalações globais via npm, incluindo
        layouts comuns do Windows/npm.
      </Step>
      <Step title="Fazer login via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variáveis de ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou as variantes `GEMINI_CLI_*`.)

    <Note>
    Se as solicitações OAuth do Gemini CLI falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e tente novamente.
    </Note>

    <Note>
    Se o login falhar antes de o fluxo no navegador começar, verifique se o comando local `gemini`
    está instalado e no `PATH`.
    </Note>

    O provedor somente OAuth `google-gemini-cli` é uma superfície separada de
    inferência de texto. Geração de imagens, compreensão de mídia e Gemini Grounding continuam no
    id de provedor `google`.

  </Tab>
</Tabs>

## Capacidades

| Capacidade                 | Compatível                    |
| -------------------------- | ----------------------------- |
| Conclusões de chat         | Sim                           |
| Geração de imagens         | Sim                           |
| Geração de música          | Sim                           |
| Conversão de texto em fala | Sim                           |
| Compreensão de imagem      | Sim                           |
| Transcrição de áudio       | Sim                           |
| Compreensão de vídeo       | Sim                           |
| Pesquisa na web (Grounding) | Sim                          |
| Thinking/raciocínio        | Sim (Gemini 2.5+ / Gemini 3+) |
| Modelos Gemma 4            | Sim                           |

<Tip>
Os modelos Gemini 3 usam `thinkingLevel` em vez de `thinkingBudget`. O OpenClaw mapeia
os controles de raciocínio dos aliases Gemini 3, Gemini 3.1 e `gemini-*-latest` para
`thinkingLevel`, para que execuções padrão/de baixa latência não enviem valores de
`thinkingBudget` desativados.

Os modelos Gemma 4 (por exemplo, `gemma-4-26b-a4b-it`) oferecem suporte ao modo thinking. O OpenClaw
reescreve `thinkingBudget` para um `thinkingLevel` do Google compatível no Gemma 4.
Definir thinking como `off` preserva o thinking desativado em vez de mapear para
`MINIMAL`.
</Tip>

## Geração de imagens

O provedor incluído de geração de imagens `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por solicitação
- Modo de edição: habilitado, até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

Para usar o Google como provedor de imagem padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Consulte [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O Plugin incluído `google` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `google/veo-3.1-fast-generate-preview`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência de vídeo único
- Oferece suporte a `aspectRatio`, `resolution` e `audio`
- Limite de duração atual: **4 a 8 segundos**

Para usar o Google como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Consulte [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de música

O Plugin incluído `google` também registra geração de música por meio da ferramenta compartilhada
`music_generate`.

- Modelo de música padrão: `google/lyria-3-clip-preview`
- Também oferece suporte a `google/lyria-3-pro-preview`
- Controles de prompt: `lyrics` e `instrumental`
- Formato de saída: `mp3` por padrão, além de `wav` em `google/lyria-3-pro-preview`
- Entradas de referência: até 10 imagens
- Execuções com suporte a sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o Google como provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Consulte [Music Generation](/pt-BR/tools/music-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Conversão de texto em fala

O provedor de fala incluído `google` usa o caminho de TTS da API Gemini com
`gemini-3.1-flash-tts-preview`.

- Voz padrão: `Kore`
- Autenticação: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Saída: WAV para anexos TTS normais, PCM para Talk/telefonia
- Saída nativa de mensagem de voz: não compatível neste caminho da API Gemini porque a API retorna PCM em vez de Opus

Para usar o Google como provedor de TTS padrão:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

O TTS da API Gemini aceita tags de áudio expressivas entre colchetes no texto, como
`[whispers]` ou `[laughs]`. Para manter as tags fora da resposta visível no chat enquanto
as envia para o TTS, coloque-as dentro de um bloco `[[tts:text]]...[[/tts:text]]`:

```text
Aqui está o texto limpo da resposta.

[[tts:text]][whispers] Aqui está a versão falada.[[/tts:text]]
```

<Note>
Uma chave de API do Google Cloud Console restrita à API Gemini é válida para este
provedor. Este não é o caminho separado da API Cloud Text-to-Speech.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reutilização direta do cache do Gemini">
    Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw
    encaminha um identificador `cachedContent` configurado para as solicitações do Gemini.

    - Configure parâmetros por modelo ou globais com
      `cachedContent` ou o legado `cached_content`
    - Se ambos estiverem presentes, `cachedContent` prevalece
    - Exemplo de valor: `cachedContents/prebuilt-context`
    - O uso de acerto de cache do Gemini é normalizado em `cacheRead` do OpenClaw a partir de
      `cachedContentTokenCount` do upstream

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Observações sobre uso de JSON do Gemini CLI">
    Ao usar o provedor OAuth `google-gemini-cli`, o OpenClaw normaliza
    a saída JSON do CLI da seguinte forma:

    - O texto da resposta vem do campo `response` do JSON do CLI.
    - O uso recorre a `stats` quando o CLI deixa `usage` vazio.
    - `stats.cached` é normalizado em `cacheRead` do OpenClaw.
    - Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), verifique se `GEMINI_API_KEY`
    está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
</CardGroup>
