---
read_when:
    - Trabalhando em caminhos de ativação por voz ou PTT
summary: Modos de ativação por voz e apertar para falar, além de detalhes de roteamento no app para Mac
title: Ativação por Voz (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Ativação por Voz e Apertar para Falar

## Modos

- **Modo de palavra de ativação** (padrão): o reconhecedor de fala sempre ativo aguarda tokens de disparo (`swabbleTriggerWords`). Ao corresponder, ele inicia a captura, mostra a sobreposição com texto parcial e envia automaticamente após silêncio.
- **Apertar para falar (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente — nenhum disparo é necessário. A sobreposição aparece enquanto a tecla estiver pressionada; ao soltar, a captura é finalizada e encaminhada após um curto atraso para que você possa ajustar o texto.

## Comportamento em runtime (palavra de ativação)

- O reconhecedor de fala fica em `VoiceWakeRuntime`.
- O disparo só ocorre quando há uma **pausa significativa** entre a palavra de ativação e a próxima palavra (intervalo de ~0,55 s). A sobreposição/o som pode começar na pausa mesmo antes de o comando começar.
- Janelas de silêncio: 2,0 s quando a fala está fluindo, 5,0 s se apenas o disparador foi ouvido.
- Parada forçada: 120 s para evitar sessões fora de controle.
- Debounce entre sessões: 350 ms.
- A sobreposição é controlada por `VoiceWakeOverlayController` com coloração committed/volatile.
- Após o envio, o reconhecedor reinicia de forma limpa para ouvir o próximo disparo.

## Invariantes do ciclo de vida

- Se a Ativação por Voz estiver habilitada e as permissões tiverem sido concedidas, o reconhecedor da palavra de ativação deverá estar ouvindo (exceto durante uma captura explícita de apertar para falar).
- A visibilidade da sobreposição (incluindo o fechamento manual pelo botão X) nunca deve impedir que o reconhecedor volte a funcionar.

## Modo de falha de sobreposição travada (anterior)

Anteriormente, se a sobreposição ficasse visivelmente travada e você a fechasse manualmente, a Ativação por Voz podia parecer “morta” porque a tentativa de reinício do runtime podia ser bloqueada pela visibilidade da sobreposição e nenhum reinício subsequente era agendado.

Endurecimento:

- O reinício do runtime de ativação não é mais bloqueado pela visibilidade da sobreposição.
- A conclusão do fechamento da sobreposição aciona `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, de modo que o fechamento manual pelo X sempre retoma a escuta.

## Especificidades de apertar para falar

- A detecção de atalho usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos os eventos (sem interceptá-los).
- O pipeline de captura fica em `VoicePushToTalk`: inicia a fala imediatamente, transmite parciais para a sobreposição e chama `VoiceWakeForwarder` ao soltar.
- Quando o apertar para falar começa, pausamos o runtime da palavra de ativação para evitar taps de áudio concorrentes; ele reinicia automaticamente após soltar.
- Permissões: requer Microfone + Fala; para ver eventos é necessária aprovação de Acessibilidade/Input Monitoring.
- Teclados externos: alguns podem não expor a tecla Option direita como esperado — ofereça um atalho alternativo se os usuários relatarem falhas.

## Configurações voltadas ao usuário

- Alternância **Ativação por Voz**: habilita o runtime da palavra de ativação.
- **Segure Cmd+Fn para falar**: habilita o monitor de apertar para falar. Desabilitado no macOS < 26.
- Seletores de idioma e microfone, medidor de nível em tempo real, tabela de palavras de ativação, testador (somente local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo for desconectado, mostra uma dica de desconectado e recorre temporariamente ao padrão do sistema até que ele volte.
- **Sons**: sons ao detectar o disparo e ao enviar; por padrão usa o som de sistema “Glass” do macOS. Você pode escolher qualquer arquivo carregável por `NSSound` (por exemplo, MP3/WAV/AIFF) para cada evento ou escolher **No Sound**.

## Comportamento de encaminhamento

- Quando a Ativação por Voz está habilitada, as transcrições são encaminhadas para o gateway/agente ativo (o mesmo modo local ou remoto usado pelo restante do app para Mac).
- As respostas são entregues ao **último provedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro será registrado em log e a execução ainda ficará visível via WebChat/logs de sessão.

## Carga útil de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona a dica da máquina antes do envio. Compartilhado entre os caminhos de palavra de ativação e apertar para falar.

## Verificação rápida

- Ative o apertar para falar, segure Cmd+Fn, fale e solte: a sobreposição deve mostrar parciais e depois enviar.
- Enquanto estiver segurando, as orelhas da barra de menu devem permanecer ampliadas (usa `triggerVoiceEars(ttl:nil)`); elas voltam ao normal após soltar.
