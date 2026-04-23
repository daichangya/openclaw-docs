---
read_when:
    - Você quer resultados mais curtos de ferramentas `exec` ou `bash` no OpenClaw
    - Você quer ativar o plugin Tokenjuice empacotado
    - Você precisa entender o que o tokenjuice altera e o que ele deixa bruto
summary: Compactar resultados ruidosos de ferramentas exec e bash com um plugin empacotado opcional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T05:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` é um plugin empacotado opcional que compacta resultados ruidosos de ferramentas `exec` e `bash`
depois que o comando já foi executado.

Ele altera o `tool_result` retornado, não o próprio comando. O Tokenjuice não
reescreve entrada de shell, não executa comandos novamente e não altera códigos de saída.

Hoje isso se aplica a execuções incorporadas de Pi, em que o Tokenjuice se conecta ao
caminho incorporado de `tool_result` e reduz a saída que volta para a sessão.

## Ativar o plugin

Caminho rápido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

O OpenClaw já distribui o plugin. Não existe uma etapa separada de `plugins install`
ou `tokenjuice install openclaw`.

Se você preferir editar a config diretamente:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## O que o Tokenjuice altera

- Compacta resultados ruidosos de `exec` e `bash` antes que sejam devolvidos à sessão.
- Mantém a execução original do comando intacta.
- Preserva leituras exatas de conteúdo de arquivo e outros comandos que o Tokenjuice deve deixar brutos.
- Continua sendo opt-in: desative o plugin se quiser saída literal em todos os lugares.

## Verificar se está funcionando

1. Ative o plugin.
2. Inicie uma sessão que possa chamar `exec`.
3. Execute um comando ruidoso, como `git status`.
4. Verifique se o resultado retornado da ferramenta está mais curto e mais estruturado do que a saída bruta do shell.

## Desativar o plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou:

```bash
openclaw plugins disable tokenjuice
```
