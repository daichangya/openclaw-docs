---
read_when:
    - Exécution de scripts depuis le dépôt
    - Ajout ou modification de scripts sous ./scripts
summary: 'Scripts du dépôt : objectif, portée et remarques de sécurité'
title: Scripts
x-i18n:
    generated_at: "2026-04-05T12:44:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Scripts

Le répertoire `scripts/` contient des scripts d’assistance pour les flux de travail locaux et les tâches opérationnelles.
Utilisez-les lorsqu’une tâche est clairement liée à un script ; sinon, préférez la CLI.

## Conventions

- Les scripts sont **facultatifs** sauf s’ils sont référencés dans la documentation ou les checklists de publication.
- Préférez les surfaces CLI lorsqu’elles existent (exemple : la surveillance de l’authentification utilise `openclaw models status --check`).
- Supposez que les scripts sont spécifiques à l’hôte ; lisez-les avant de les exécuter sur une nouvelle machine.

## Scripts de surveillance de l’authentification

La surveillance de l’authentification est couverte dans [Authentication](/gateway/authentication). Les scripts sous `scripts/` sont des compléments facultatifs pour les flux de travail systemd/Termux sur téléphone.

## Lors de l’ajout de scripts

- Gardez les scripts ciblés et documentés.
- Ajoutez une courte entrée dans la documentation pertinente (ou créez-en une si elle manque).
