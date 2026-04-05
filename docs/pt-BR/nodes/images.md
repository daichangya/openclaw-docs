---
read_when:
    - Modificando o pipeline de mídia ou anexos
summary: Regras de tratamento de imagens e mídia para envio, gateway e respostas do agente
title: Suporte a imagem e mídia
x-i18n:
    generated_at: "2026-04-05T12:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Suporte a imagem e mídia (2025-12-05)

O canal do WhatsApp é executado via **Baileys Web**. Este documento registra as regras atuais de tratamento de mídia para envio, gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter limites por tipo razoáveis e previsíveis.

## Superfície da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` é opcional; a legenda pode estar vazia para envios somente com mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e construir o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048 px), mirando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passthrough de até 16 MB; áudio é enviado como mensagem de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com o nome do arquivo preservado quando disponível.
- Reprodução estilo GIF no WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop inline.
- A detecção de MIME prioriza magic bytes, depois cabeçalhos, depois extensão do arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logging: o modo não detalhado mostra `↩️`/`✅`; o modo detalhado inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia presente, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente, se fornecidas.

## Mídia de entrada para comandos (Pi)

- Quando mensagens web de entrada incluem mídia, o OpenClaw faz o download para um arquivo temporário e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL para a mídia de entrada.
  - `{{MediaPath}}` caminho local temporário gravado antes de executar o comando.
- Quando um sandbox Docker por sessão está ativado, a mídia de entrada é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- O entendimento de mídia (se configurado via `tools.media.*` ou `tools.media.models` compartilhado) é executado antes do templating e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para análise do comando, para que comandos com barra continuem funcionando.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise do comando.
  - Se o modelo de imagem principal ativo já oferecer suporte nativo a visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original ao modelo.
- Por padrão, apenas o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio web do WhatsApp)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após recompressão.
- Áudio/mensagem de voz/vídeo: limite de 16 MB; documentos: 100 MB.
- Mídia grande demais ou ilegível → erro claro nos logs e a resposta é ignorada.

**Limites de entendimento de mídia (transcrição/descrição)**

- Padrão de imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão de áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão de vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia grande demais ignora o entendimento, mas as respostas ainda seguem com o corpo original.

## Observações para testes

- Cubra fluxos de envio + resposta para casos de imagem/áudio/documento.
- Valide a recompressão para imagens (limite de tamanho) e a flag de mensagem de voz para áudio.
- Garanta que respostas com várias mídias sejam distribuídas em envios sequenciais.
