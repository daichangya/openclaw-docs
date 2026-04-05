---
read_when:
    - Vous voulez contribuer avec des constats de sécurité ou des scénarios de menace
    - Révision ou mise à jour du modèle de menace
summary: Comment contribuer au modèle de menace OpenClaw
title: Contribuer au modèle de menace
x-i18n:
    generated_at: "2026-04-05T12:54:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuer au modèle de menace OpenClaw

Merci d’aider à rendre OpenClaw plus sûr. Ce modèle de menace est un document vivant et nous accueillons les contributions de tout le monde — vous n’avez pas besoin d’être un expert en sécurité.

## Façons de contribuer

### Ajouter une menace

Vous avez repéré un vecteur d’attaque ou un risque que nous n’avons pas couvert ? Ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues) et décrivez-la avec vos propres mots. Vous n’avez pas besoin de connaître des frameworks ni de remplir tous les champs — décrivez simplement le scénario.

**Utile à inclure (mais pas obligatoire) :**

- Le scénario d’attaque et la manière dont il pourrait être exploité
- Quelles parties d’OpenClaw sont affectées (CLI, gateway, canaux, ClawHub, serveurs MCP, etc.)
- À quel point vous pensez que c’est grave (faible / moyen / élevé / critique)
- Tous liens vers des recherches associées, CVE ou exemples réels

Nous nous chargerons de la correspondance ATLAS, des IDs de menace et de l’évaluation du risque pendant la revue. Si vous voulez inclure ces détails, très bien — mais ce n’est pas attendu.

> **Ceci sert à enrichir le modèle de menace, pas à signaler des vulnérabilités actives.** Si vous avez trouvé une vulnérabilité exploitable, consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de divulgation responsable.

### Suggérer une mesure d’atténuation

Vous avez une idée de la manière d’adresser une menace existante ? Ouvrez une issue ou une PR en référant la menace. Les mesures d’atténuation utiles sont spécifiques et exploitables — par exemple, « limitation de débit par expéditeur à 10 messages/minute au niveau de la gateway » vaut mieux que « implémenter une limitation de débit ».

### Proposer une chaîne d’attaque

Les chaînes d’attaque montrent comment plusieurs menaces se combinent dans un scénario d’attaque réaliste. Si vous voyez une combinaison dangereuse, décrivez les étapes et comment un attaquant enchaînerait ces éléments. Un court récit de la manière dont l’attaque se déroule concrètement a plus de valeur qu’un modèle formel.

### Corriger ou améliorer du contenu existant

Coquilles, clarifications, informations obsolètes, meilleurs exemples — les PR sont bienvenues, sans issue préalable nécessaire.

## Ce que nous utilisons

### MITRE ATLAS

Ce modèle de menace est construit sur [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework conçu spécifiquement pour les menaces IA/ML comme l’injection de prompt, l’abus d’outils et l’exploitation d’agents. Vous n’avez pas besoin de connaître ATLAS pour contribuer — nous mappons les soumissions vers le framework pendant la revue.

### IDs de menace

Chaque menace reçoit un ID comme `T-EXEC-003`. Les catégories sont :

| Code    | Catégorie                                   |
| ------- | ------------------------------------------- |
| RECON   | Reconnaissance — collecte d’informations    |
| ACCESS  | Accès initial — obtention d’une entrée      |
| EXEC    | Exécution — lancement d’actions malveillantes |
| PERSIST | Persistance — maintien de l’accès           |
| EVADE   | Évasion des défenses — éviter la détection  |
| DISC    | Découverte — comprendre l’environnement     |
| EXFIL   | Exfiltration — vol de données               |
| IMPACT  | Impact — dommage ou perturbation            |

Les IDs sont attribués par les mainteneurs pendant la revue. Vous n’avez pas besoin d’en choisir un.

### Niveaux de risque

| Niveau       | Signification                                                        |
| ------------ | -------------------------------------------------------------------- |
| **Critique** | Compromission complète du système, ou forte probabilité + impact critique |
| **Élevé**    | Dommage important probable, ou probabilité moyenne + impact critique |
| **Moyen**    | Risque modéré, ou faible probabilité + impact élevé                 |
| **Faible**   | Peu probable et impact limité                                        |

Si vous n’êtes pas sûr du niveau de risque, décrivez simplement l’impact et nous l’évaluerons.

## Processus de revue

1. **Triage** — nous examinons les nouvelles soumissions sous 48 heures
2. **Évaluation** — nous vérifions la faisabilité, attribuons la correspondance ATLAS et l’ID de menace, validons le niveau de risque
3. **Documentation** — nous nous assurons que tout est correctement formaté et complet
4. **Fusion** — ajout au modèle de menace et à la visualisation

## Ressources

- [Site ATLAS](https://atlas.mitre.org/)
- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [Modèle de menace OpenClaw](/security/THREAT-MODEL-ATLAS)

## Contact

- **Vulnérabilités de sécurité :** consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de signalement
- **Questions sur le modèle de menace :** ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Discussion générale :** canal Discord #security

## Reconnaissance

Les contributeurs au modèle de menace sont reconnus dans les remerciements du modèle de menace, les notes de version et le hall of fame sécurité OpenClaw pour les contributions significatives.
