---
read_when:
    - Você quer usar modelos Google Gemini com o OpenClaw
    - Você precisa do fluxo de auth por chave de API ou OAuth
summary: Configuração do Google Gemini (chave de API + OAuth, geração de imagens, entendimento de mídia, busca na web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T12:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

O plugin Google fornece acesso aos modelos Gemini por meio do Google AI Studio, além de
geração de imagens, entendimento de mídia (imagem/áudio/vídeo) e busca na web via
Gemini Grounding.

- Provedor: `google`
- Auth: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API: API Google Gemini
- Provedor alternativo: `google-gemini-cli` (OAuth)

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Um provedor alternativo, `google-gemini-cli`, usa OAuth PKCE em vez de uma
chave de API. Esta é uma integração não oficial; alguns usuários relatam
restrições de conta. Use por sua conta e risco.

- Modelo padrão: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Pré-requisito de instalação: Gemini CLI local disponível como `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Variáveis de ambiente:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Ou as variantes `GEMINI_CLI_*`.)

Se as solicitações OAuth do Gemini CLI falharem após o login, defina
`GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway e
tente novamente.

Se o login falhar antes do início do fluxo no navegador, verifique se o comando local `gemini`
está instalado e no `PATH`. O OpenClaw oferece suporte tanto a instalações via Homebrew
quanto a instalações globais via npm, incluindo layouts comuns do Windows/npm.

Observações sobre uso de JSON no Gemini CLI:

- O texto da resposta vem do campo JSON `response` da CLI.
- O uso recorre a `stats` quando a CLI deixa `usage` vazio.
- `stats.cached` é normalizado em `cacheRead` no OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

## Capacidades

| Capacidade             | Suportado        |
| ---------------------- | ---------------- |
| Conclusões de chat     | Sim              |
| Geração de imagens     | Sim              |
| Entendimento de imagem | Sim              |
| Transcrição de áudio   | Sim              |
| Entendimento de vídeo  | Sim              |
| Busca na web (Grounding) | Sim            |
| Thinking/raciocínio    | Sim (Gemini 3.1+) |

## Reutilização direta do cache do Gemini

Para execuções diretas da API Gemini (`api: "google-generative-ai"`), o OpenClaw agora
passa um identificador `cachedContent` configurado para as solicitações ao Gemini.

- Configure params por modelo ou globais com
  `cachedContent` ou o legado `cached_content`
- Se ambos estiverem presentes, `cachedContent` tem prioridade
- Valor de exemplo: `cachedContents/prebuilt-context`
- O uso de acerto de cache do Gemini é normalizado em `cacheRead` no OpenClaw a partir de
  `cachedContentTokenCount` do upstream

Exemplo:

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

## Geração de imagens

O provedor empacotado de geração de imagens `google` usa por padrão
`google/gemini-3.1-flash-image-preview`.

- Também oferece suporte a `google/gemini-3-pro-image-preview`
- Gerar: até 4 imagens por solicitação
- Modo de edição: ativado, com até 5 imagens de entrada
- Controles de geometria: `size`, `aspectRatio` e `resolution`

O provedor `google-gemini-cli`, somente OAuth, é uma superfície separada de
inferência de texto. A geração de imagens, o entendimento de mídia e o Gemini Grounding continuam no
ID de provedor `google`.

## Observação sobre ambiente

Se o Gateway for executado como daemon (`launchd`/`systemd`), verifique se `GEMINI_API_KEY`
está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
