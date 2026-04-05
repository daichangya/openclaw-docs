---
read_when:
    - Adicionando suporte de localização para node ou UI de permissões
    - Projetando permissões de localização no Android ou comportamento em foreground
summary: Comando de localização para nodes (location.get), modos de permissão e comportamento em foreground no Android
title: Comando de localização
x-i18n:
    generated_at: "2026-04-05T12:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Comando de localização (nodes)

## Resumo

- `location.get` é um comando de node (via `node.invoke`).
- Desabilitado por padrão.
- As configurações do app Android usam um seletor: Desativado / Em uso.
- Toggle separado: Localização precisa.

## Por que um seletor (e não apenas um switch)

As permissões do SO têm vários níveis. Podemos expor um seletor no app, mas o SO ainda decide a permissão real concedida.

- iOS/macOS pode expor **Em uso** ou **Sempre** em prompts/configurações do sistema.
- O app Android atualmente oferece suporte apenas a localização em foreground.
- A localização precisa é uma permissão separada (iOS 14+ “Precise”, Android “fine” vs “coarse”).

O seletor na UI controla o modo solicitado; a permissão real fica nas configurações do SO.

## Modelo de configurações

Por dispositivo node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento da UI:

- Selecionar `whileUsing` solicita permissão de foreground.
- Se o SO negar o nível solicitado, reverta para o nível mais alto concedido e mostre o status.

## Mapeamento de permissões (`node.permissions`)

Opcional. O node macOS informa `location` pelo mapa de permissões; iOS/Android podem omiti-lo.

## Comando: `location.get`

Chamado via `node.invoke`.

Parâmetros (sugeridos):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload de resposta:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erros (códigos estáveis):

- `LOCATION_DISABLED`: o seletor está desativado.
- `LOCATION_PERMISSION_REQUIRED`: falta a permissão para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: o app está em segundo plano, mas apenas Em uso é permitido.
- `LOCATION_TIMEOUT`: nenhuma localização obtida a tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema / nenhum provedor.

## Comportamento em segundo plano

- O app Android nega `location.get` quando está em segundo plano.
- Mantenha o OpenClaw aberto ao solicitar localização no Android.
- Outras plataformas de node podem ser diferentes.

## Integração com modelo/ferramentas

- Superfície de ferramenta: a ferramenta `nodes` adiciona a ação `location_get` (node obrigatório).
- CLI: `openclaw nodes location get --node <id>`.
- Diretrizes para agentes: chame apenas quando o usuário tiver habilitado a localização e entender o escopo.

## Texto de UX (sugerido)

- Desativado: “O compartilhamento de localização está desativado.”
- Em uso: “Somente quando o OpenClaw estiver aberto.”
- Precisa: “Usar localização GPS precisa. Desative para compartilhar localização aproximada.”
