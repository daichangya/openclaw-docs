---
read_when:
    - Procurando uma visão geral dos recursos de mídia
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração de mídia assíncrona
summary: Página de destino unificada para recursos de geração, compreensão e fala de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-04-24T09:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Geração e compreensão de mídia

O OpenClaw gera imagens, vídeos e músicas, compreende mídia recebida (imagens, áudio, vídeo) e vocaliza respostas com conversão de texto em fala. Todos os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte está configurado.

## Recursos em resumo

| Recurso              | Ferramenta       | Provedores                                                                                  | O que faz                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Geração de imagens   | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Cria ou edita imagens a partir de prompts de texto ou referências |
| Geração de vídeo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Cria vídeos a partir de texto, imagens ou vídeos existentes |
| Geração de música    | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Cria músicas ou faixas de áudio a partir de prompts de texto |
| Texto para fala (TTS) | `tts`           | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                         | Converte respostas de saída em áudio falado             |
| Compreensão de mídia | (automática)     | Qualquer provedor de modelo com suporte a visão/áudio, além de fallbacks da CLI            | Resume imagens, áudios e vídeos recebidos               |

## Matriz de recursos por provedor

Esta tabela mostra quais provedores oferecem suporte a quais recursos de mídia em toda a plataforma.

| Provedor   | Imagem | Vídeo | Música | TTS | STT / Transcrição | Voz em tempo real | Compreensão de mídia |
| ---------- | ------ | ----- | ------ | --- | ----------------- | ----------------- | -------------------- |
| Alibaba    |        | Sim   |        |     |                   |                   |                      |
| BytePlus   |        | Sim   |        |     |                   |                   |                      |
| ComfyUI    | Sim    | Sim   | Sim    |     |                   |                   |                      |
| Deepgram   |        |       |        |     | Sim               |                   |                      |
| ElevenLabs |        |       |        | Sim | Sim               |                   |                      |
| fal        | Sim    | Sim   |        |     |                   |                   |                      |
| Google     | Sim    | Sim   | Sim    | Sim |                   | Sim               | Sim                  |
| Microsoft  |        |       |        | Sim |                   |                   |                      |
| MiniMax    | Sim    | Sim   | Sim    | Sim |                   |                   |                      |
| Mistral    |        |       |        |     | Sim               |                   |                      |
| OpenAI     | Sim    | Sim   |        | Sim | Sim               | Sim               | Sim                  |
| Qwen       |        | Sim   |        |     |                   |                   |                      |
| Runway     |        | Sim   |        |     |                   |                   |                      |
| Together   |        | Sim   |        |     |                   |                   |                      |
| Vydra      | Sim    | Sim   |        |     |                   |                   |                      |
| xAI        | Sim    | Sim   |        | Sim | Sim               |                   | Sim                  |

<Note>
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado na sua configuração de provedor. A tabela acima destaca os provedores com suporte dedicado à compreensão de mídia; a maioria dos provedores de LLM com modelos multimodais (Anthropic, Google, OpenAI etc.) também consegue compreender mídia recebida quando configurada como o modelo de resposta ativo.
</Note>

## Como funciona a geração assíncrona

A geração de vídeo e música é executada como tarefas em segundo plano porque o processamento do provedor normalmente leva de 30 segundos a vários minutos. Quando o agente chama `video_generate` ou `music_generate`, o OpenClaw envia a solicitação ao provedor, retorna imediatamente um ID de tarefa e acompanha o trabalho no registro de tarefas. O agente continua respondendo a outras mensagens enquanto o trabalho está em execução. Quando o provedor termina, o OpenClaw desperta o agente para que ele possa publicar a mídia concluída de volta no canal original. A geração de imagens e o TTS são síncronos e são concluídos inline com a resposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI podem transcrever áudio recebido
pelo caminho em lote `tools.media.audio` quando configurados. Deepgram,
ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT de
streaming para Voice Call, para que o áudio telefônico ao vivo possa ser
encaminhado ao fornecedor selecionado sem esperar por uma gravação concluída.

Google corresponde às superfícies de imagem, vídeo, música, TTS em lote, voz
em tempo real no backend e compreensão de mídia do OpenClaw. OpenAI corresponde
às superfícies de imagem, vídeo, TTS em lote, STT em lote, STT de streaming
para Voice Call, voz em tempo real no backend e embeddings de memória do
OpenClaw. xAI atualmente corresponde às superfícies de imagem, vídeo, busca,
execução de código, TTS em lote, STT em lote e STT de streaming para Voice Call
do OpenClaw. A voz Realtime do xAI é um recurso upstream, mas não está
registrada no OpenClaw até que o contrato compartilhado de voz em tempo real
consiga representá-la.

## Links rápidos

- [Geração de imagens](/pt-BR/tools/image-generation) -- gerar e editar imagens
- [Geração de vídeo](/pt-BR/tools/video-generation) -- texto para vídeo, imagem para vídeo e vídeo para vídeo
- [Geração de música](/pt-BR/tools/music-generation) -- criar músicas e faixas de áudio
- [Texto para fala](/pt-BR/tools/tts) -- converter respostas em áudio falado
- [Compreensão de mídia](/pt-BR/nodes/media-understanding) -- compreender imagens, áudios e vídeos recebidos

## Relacionados

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
