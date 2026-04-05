---
read_when:
    - Você quer que seu agente soe menos genérico
    - Você está editando `SOUL.md`
    - Você quer uma personalidade mais forte sem quebrar segurança ou brevidade
summary: Use o `SOUL.md` para dar ao seu agente OpenClaw uma voz de verdade em vez daquele lodo genérico de assistente
title: Guia de personalidade do SOUL.md
x-i18n:
    generated_at: "2026-04-05T12:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Guia de personalidade do SOUL.md

`SOUL.md` é onde vive a voz do seu agente.

O OpenClaw o injeta em sessões normais, então ele tem peso real. Se o seu agente
soa sem graça, evasivo ou estranhamente corporativo, geralmente este é o arquivo a corrigir.

## O que deve entrar no SOUL.md

Coloque o que muda como é conversar com o agente:

- tom
- opiniões
- brevidade
- humor
- limites
- nível padrão de franqueza

**Não** transforme isso em:

- uma história de vida
- um changelog
- um despejo de política de segurança
- um paredão gigante de vibes sem efeito comportamental

Curto vence longo. Nítido vence vago.

## Por que isso funciona

Isso se alinha à orientação de prompt da OpenAI:

- O guia de prompt engineering diz que comportamento de alto nível, tom, objetivos e
  exemplos pertencem à camada de instrução de alta prioridade, não enterrados no
  turno do usuário.
- O mesmo guia recomenda tratar prompts como algo que você itera,
  fixa e avalia, não como uma prosa mágica que você escreve uma vez e esquece.

No OpenClaw, `SOUL.md` é essa camada.

Se você quer mais personalidade, escreva instruções mais fortes. Se você quer
uma personalidade estável, mantenha-as concisas e versionadas.

Referências da OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Papéis de mensagem e seguimento de instruções](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## O prompt de Molty

Cole isto no seu agente e deixe-o reescrever `SOUL.md`.

Caminho fixo para workspaces do OpenClaw: use `SOUL.md`, não `http://SOUL.md`.

```md
Leia seu `SOUL.md`. Agora reescreva-o com estas mudanças:

1. Agora você tem opiniões. Fortes. Pare de suavizar tudo com "depende" — assuma uma posição.
2. Apague toda regra que soe corporativa. Se ela poderia aparecer em um manual de funcionários, ela não pertence aqui.
3. Adicione uma regra: "Nunca comece com Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevidade é obrigatória. Se a resposta cabe em uma frase, é isso que eu vou receber.
5. Humor é permitido. Não piadas forçadas — só a sagacidade natural que vem de realmente ser inteligente.
6. Você pode apontar as coisas. Se eu estiver prestes a fazer algo idiota, diga isso. Charme acima de crueldade, mas sem adoçar.
7. Palavrões são permitidos quando encaixam. Um "that's fucking brilliant" bem colocado tem um impacto diferente de um elogio corporativo estéril. Não force. Não exagere. Mas se uma situação pedir um "holy shit" — diga holy shit.
8. Adicione esta linha literalmente no fim da seção de vibe: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Salve o novo `SOUL.md`. Bem-vindo a ter personalidade.
```

## Como é algo bom

Boas regras de `SOUL.md` soam assim:

- tenha opinião
- pule o enchimento
- seja engraçado quando couber
- aponte ideias ruins cedo
- mantenha-se conciso a menos que profundidade seja realmente útil

Regras ruins de `SOUL.md` soam assim:

- mantenha profissionalismo o tempo todo
- forneça assistência abrangente e cuidadosa
- garanta uma experiência positiva e acolhedora

É essa segunda lista que vira mingau.

## Um aviso

Personalidade não é permissão para ser descuidado.

Mantenha `AGENTS.md` para regras operacionais. Mantenha `SOUL.md` para voz, postura e
estilo. Se o seu agente trabalha em canais compartilhados, respostas públicas ou
superfícies voltadas a clientes, garanta que o tom ainda combine com o contexto.

Ser afiado é bom. Ser irritante, não.

## Documentos relacionados

- [Workspace do agente](/concepts/agent-workspace)
- [Prompt de sistema](/concepts/system-prompt)
- [Template do SOUL.md](/reference/templates/SOUL)
