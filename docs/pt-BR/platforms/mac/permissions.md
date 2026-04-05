---
read_when:
    - Depurar prompts de permissão do macOS ausentes ou travados
    - Empacotar ou assinar o app do macOS
    - Alterar IDs de bundle ou caminhos de instalação do app
summary: Persistência de permissões do macOS (TCC) e requisitos de assinatura
title: Permissões do macOS
x-i18n:
    generated_at: "2026-04-05T12:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# Permissões do macOS (TCC)

As concessões de permissão do macOS são frágeis. O TCC associa uma concessão de permissão à
assinatura de código do app, ao identificador do bundle e ao caminho em disco. Se qualquer um deles mudar,
o macOS trata o app como novo e pode descartar ou ocultar prompts.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o app a partir de um local fixo (para o OpenClaw, `dist/OpenClaw.app`).
- Mesmo identificador do bundle: alterar o ID do bundle cria uma nova identidade de permissão.
- App assinado: builds não assinadas ou assinadas ad hoc não persistem permissões.
- Assinatura consistente: use um certificado Apple Development ou Developer ID real
  para que a assinatura permaneça estável entre reconstruções.

Assinaturas ad hoc geram uma nova identidade a cada build. O macOS esquecerá concessões
anteriores, e os prompts podem desaparecer completamente até que as entradas antigas sejam removidas.

## Checklist de recuperação quando os prompts desaparecem

1. Encerre o app.
2. Remova a entrada do app em Ajustes do Sistema -> Privacidade e Segurança.
3. Reinicie o app a partir do mesmo caminho e conceda as permissões novamente.
4. Se o prompt ainda não aparecer, redefina as entradas do TCC com `tccutil` e tente de novo.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinição (substitua o ID do bundle conforme necessário):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Desktop/Documentos/Downloads)

O macOS também pode restringir Desktop, Documentos e Downloads para processos de terminal/em segundo plano. Se leituras de arquivos ou listagens de diretórios travarem, conceda acesso ao mesmo contexto de processo que executa as operações de arquivo (por exemplo, Terminal/iTerm, app iniciada por LaunchAgent ou processo SSH).

Solução alternativa: mova os arquivos para o workspace do OpenClaw (`~/.openclaw/workspace`) se quiser evitar concessões por pasta.

Se você estiver testando permissões, sempre assine com um certificado real. Builds ad hoc
só são aceitáveis para execuções locais rápidas em que as permissões não importam.
