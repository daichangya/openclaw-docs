---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA adossés au dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios de départ et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-06T03:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: df35f353d5ab0e0432e6a828c82772f9a88edb41c20ec5037315b7ba310b28e6
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation QA E2E

La pile QA privée est conçue pour tester OpenClaw d’une manière plus réaliste,
structurée comme un canal, qu’un simple test unitaire.

Composants actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources de départ adossées au dépôt pour la tâche de lancement et les
  scénarios QA de référence.

L’objectif à long terme est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de style Slack et le plan de scénario.

Cela permet à un opérateur ou à une boucle d’automatisation de donner à l’agent
une mission QA, d’observer le comportement réel du canal et d’enregistrer ce qui
a fonctionné, échoué ou est resté bloqué.

## Ressources de départ adossées au dépôt

Les ressources de départ se trouvent dans `qa/` :

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Elles sont volontairement versionnées dans git afin que le plan QA soit visible
à la fois pour les humains et pour l’agent. La liste de référence doit rester
assez large pour couvrir :

- chat DM et canal
- comportement des fils
- cycle de vie des actions sur les messages
- callbacks cron
- rappel de mémoire
- changement de modèle
- transfert à un sous-agent
- lecture du dépôt et lecture de la documentation
- une petite tâche de build, comme Lobster Invaders

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observée.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

## Documentation associée

- [Tests](/fr/help/testing)
- [Canal QA](/channels/qa-channel)
- [Tableau de bord](/web/dashboard)
