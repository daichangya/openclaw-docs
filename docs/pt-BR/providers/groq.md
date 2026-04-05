---
read_when:
    - Você quer usar o Groq com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Groq (autenticação + seleção de modelo)
title: Groq
x-i18n:
    generated_at: "2026-04-05T12:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) oferece inferência ultrarrápida em modelos de código aberto
(Llama, Gemma, Mistral e outros) usando hardware LPU personalizado. O OpenClaw se conecta
ao Groq por meio de sua API compatível com OpenAI.

- Provedor: `groq`
- Autenticação: `GROQ_API_KEY`
- API: compatível com OpenAI

## Início rápido

1. Obtenha uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).

2. Defina a chave de API:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Exemplo de arquivo de configuração

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Transcrição de áudio

O Groq também oferece transcrição rápida de áudio baseada em Whisper. Quando configurado como um
provedor de entendimento de mídia, o OpenClaw usa o modelo `whisper-large-v3-turbo` do Groq
para transcrever mensagens de voz por meio da superfície compartilhada `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Observação sobre o ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `GROQ_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Observações sobre áudio

- Caminho de configuração compartilhado: `tools.media.audio`
- URL base padrão de áudio do Groq: `https://api.groq.com/openai/v1`
- Modelo de áudio padrão do Groq: `whisper-large-v3-turbo`
- A transcrição de áudio do Groq usa o caminho compatível com OpenAI `/audio/transcriptions`

## Modelos disponíveis

O catálogo de modelos do Groq muda com frequência. Execute `openclaw models list | grep groq`
para ver os modelos atualmente disponíveis, ou consulte
[console.groq.com/docs/models](https://console.groq.com/docs/models).

As opções populares incluem:

- **Llama 3.3 70B Versatile** - uso geral, contexto amplo
- **Llama 3.1 8B Instant** - rápido, leve
- **Gemma 2 9B** - compacto, eficiente
- **Mixtral 8x7B** - arquitetura MoE, raciocínio sólido

## Links

- [Groq Console](https://console.groq.com)
- [Documentação da API](https://console.groq.com/docs)
- [Lista de modelos](https://console.groq.com/docs/models)
- [Preços](https://groq.com/pricing)
