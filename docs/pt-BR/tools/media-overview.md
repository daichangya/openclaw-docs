---
read_when:
    - Procurando uma visão geral dos recursos de mídia
    - Decidindo qual provider de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
summary: Página inicial unificada para geração de mídia, compreensão e recursos de fala
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-04-23T05:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Geração e compreensão de mídia

O OpenClaw gera imagens, vídeos e música, compreende mídia de entrada (imagens, áudio, vídeo) e fala respostas em voz alta com texto para fala. Todos os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base na conversa, e cada ferramenta só aparece quando pelo menos um provider de suporte está configurado.

## Capacidades em resumo

| Capacidade           | Ferramenta       | Providers                                                                                   | O que faz                                              |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Geração de imagem    | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Cria ou edita imagens a partir de prompts de texto ou referências |
| Geração de vídeo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Cria vídeos a partir de texto, imagens ou vídeos existentes |
| Geração de música    | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Cria música ou faixas de áudio a partir de prompts de texto |
| Texto para fala (TTS) | `tts`           | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                 | Converte respostas de saída em áudio falado            |
| Compreensão de mídia | (automático)     | Qualquer provider de modelo com capacidade de visão/áudio, além de fallbacks por CLI        | Resume imagens, áudio e vídeo de entrada               |

## Matriz de capacidades dos providers

Esta tabela mostra quais providers oferecem suporte a quais capacidades de mídia em toda a plataforma.

| Provider   | Imagem | Vídeo | Música | TTS | STT / Transcrição | Compreensão de mídia |
| ---------- | ------ | ------ | ------ | --- | ----------------- | -------------------- |
| Alibaba    |        | Sim    |        |     |                   |                      |
| BytePlus   |        | Sim    |        |     |                   |                      |
| ComfyUI    | Sim    | Sim    | Sim    |     |                   |                      |
| Deepgram   |        |        |        |     | Sim               |                      |
| ElevenLabs |        |        |        | Sim | Sim               |                      |
| fal        | Sim    | Sim    |        |     |                   |                      |
| Google     | Sim    | Sim    | Sim    |     |                   | Sim                  |
| Microsoft  |        |        |        | Sim |                   |                      |
| MiniMax    | Sim    | Sim    | Sim    | Sim |                   |                      |
| Mistral    |        |        |        |     | Sim               |                      |
| OpenAI     | Sim    | Sim    |        | Sim | Sim               | Sim                  |
| Qwen       |        | Sim    |        |     |                   |                      |
| Runway     |        | Sim    |        |     |                   |                      |
| Together   |        | Sim    |        |     |                   |                      |
| Vydra      | Sim    | Sim    |        |     |                   |                      |
| xAI        | Sim    | Sim    |        | Sim | Sim               | Sim                  |

<Note>
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado na sua config de provider. A tabela acima destaca providers com suporte dedicado à compreensão de mídia; a maioria dos providers de LLM com modelos multimodais (Anthropic, Google, OpenAI etc.) também pode compreender mídia de entrada quando configurada como o modelo de resposta ativo.
</Note>

## Como funciona a geração assíncrona

A geração de vídeo e música é executada como tarefas em segundo plano porque o processamento do provider normalmente leva de 30 segundos a vários minutos. Quando o agente chama `video_generate` ou `music_generate`, o OpenClaw envia a solicitação ao provider, retorna imediatamente um ID de tarefa e acompanha o trabalho no registro de tarefas. O agente continua respondendo a outras mensagens enquanto o trabalho está em andamento. Quando o provider conclui, o OpenClaw desperta o agente para que ele possa publicar a mídia finalizada de volta no canal original. A geração de imagem e TTS são síncronas e são concluídas inline com a resposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI podem todos transcrever
áudio de entrada pelo caminho em lote `tools.media.audio` quando configurados. Deepgram,
ElevenLabs, Mistral, OpenAI e xAI também registram providers de STT por streaming do Voice Call,
então áudio ao vivo de chamadas telefônicas pode ser encaminhado para o vendor selecionado
sem esperar por uma gravação concluída.

A OpenAI é mapeada para as superfícies do OpenClaw de imagem, vídeo, TTS em lote, STT em lote, STT por streaming do Voice Call, voz em tempo real e embeddings de memória. A xAI atualmente é
mapeada para as superfícies do OpenClaw de imagem, vídeo, pesquisa, execução de código, TTS em lote, STT em lote
e STT por streaming do Voice Call. Voz em tempo real da xAI é uma
capacidade upstream, mas não está registrada no OpenClaw até que o contrato compartilhado de
voz em tempo real possa representá-la.

## Links rápidos

- [Geração de imagem](/pt-BR/tools/image-generation) -- gerar e editar imagens
- [Geração de vídeo](/pt-BR/tools/video-generation) -- texto para vídeo, imagem para vídeo e vídeo para vídeo
- [Geração de música](/pt-BR/tools/music-generation) -- criar música e faixas de áudio
- [Texto para fala](/pt-BR/tools/tts) -- converter respostas em áudio falado
- [Compreensão de mídia](/pt-BR/nodes/media-understanding) -- compreender imagens, áudio e vídeo de entrada
