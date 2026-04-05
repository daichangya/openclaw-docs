---
read_when:
    - Ajustar o comportamento da sobreposição de voz
summary: Ciclo de vida da sobreposição de voz quando a palavra de ativação e o push-to-talk se sobrepõem
title: Sobreposição de voz
x-i18n:
    generated_at: "2026-04-05T12:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ciclo de vida da sobreposição de voz (macOS)

Público: colaboradores do app para macOS. Objetivo: manter a sobreposição de voz previsível quando a palavra de ativação e o push-to-talk se sobrepõem.

## Intenção atual

- Se a sobreposição já estiver visível por causa da palavra de ativação e o usuário pressionar a tecla de atalho, a sessão da tecla de atalho _adota_ o texto existente em vez de redefini-lo. A sobreposição permanece visível enquanto a tecla de atalho estiver pressionada. Quando o usuário soltar: enviar se houver texto aparado; caso contrário, dispensar.
- A palavra de ativação sozinha ainda envia automaticamente no silêncio; push-to-talk envia imediatamente ao soltar.

## Implementado (9 de dezembro de 2025)

- As sessões da sobreposição agora carregam um token por captura (palavra de ativação ou push-to-talk). Atualizações de parcial/final/envio/dispensa/nível são descartadas quando o token não corresponde, evitando callbacks antigos.
- Push-to-talk adota qualquer texto visível na sobreposição como prefixo (portanto, pressionar a tecla de atalho enquanto a sobreposição de ativação estiver visível preserva o texto e acrescenta nova fala). Ele espera até 1,5 s por uma transcrição final antes de recorrer ao texto atual.
- O registro em log do som/da sobreposição é emitido em `info` nas categorias `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (início da sessão, parcial, final, envio, dispensa, motivo do som).

## Próximas etapas

1. **VoiceSessionCoordinator (actor)**
   - Controla exatamente uma `VoiceSession` por vez.
   - API (baseada em token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que carregam tokens antigos (impede que reconhecedores antigos reabram a sobreposição).
2. **VoiceSession (model)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto confirmado/volátil, sinalizadores de som, temporizadores (envio automático, inatividade), `overlayMode` (display|editing|sending), prazo de cooldown.
3. **Vinculação da sobreposição**
   - `VoiceSessionPublisher` (`ObservableObject`) espelha a sessão ativa no SwiftUI.
   - `VoiceWakeOverlayView` renderiza apenas via o publisher; nunca altera singletons globais diretamente.
   - As ações do usuário na sobreposição (`sendNow`, `dismiss`, `edit`) chamam de volta o coordinator com o token da sessão.
4. **Caminho de envio unificado**
   - Em `endCapture`: se o texto aparado estiver vazio → dispensar; caso contrário, `performSend(session:)` (toca o som de envio uma vez, encaminha, dispensa).
   - Push-to-talk: sem atraso; palavra de ativação: atraso opcional para envio automático.
   - Aplique um cooldown curto ao runtime de ativação após o término do push-to-talk para que a palavra de ativação não dispare novamente imediatamente.
5. **Registro em log**
   - O coordinator emite logs `.info` no subsistema `ai.openclaw`, nas categorias `voicewake.overlay` e `voicewake.chime`.
   - Eventos principais: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist de depuração

- Transmita os logs enquanto reproduz uma sobreposição persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique se há apenas um token de sessão ativo; callbacks antigos devem ser descartados pelo coordinator.
- Garanta que a liberação do push-to-talk sempre chame `endCapture` com o token ativo; se o texto estiver vazio, espere `dismiss` sem som nem envio.

## Etapas de migração (sugeridas)

1. Adicionar `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refatorar `VoiceWakeRuntime` para criar/atualizar/encerrar sessões em vez de tocar `VoiceWakeOverlayController` diretamente.
3. Refatorar `VoicePushToTalk` para adotar sessões existentes e chamar `endCapture` ao soltar; aplicar cooldown no runtime.
4. Conectar `VoiceWakeOverlayController` ao publisher; remover chamadas diretas do runtime/PTT.
5. Adicionar testes de integração para adoção de sessão, cooldown e dispensa com texto vazio.
