---
read_when:
    - Examiner la posture de sécurité ou les scénarios de menace
    - Travailler sur des fonctionnalités de sécurité ou des réponses d’audit
summary: Modèle de menace d’OpenClaw mis en correspondance avec le framework MITRE ATLAS
title: Modèle de menace (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T07:32:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modèle de menace OpenClaw v1.0

## Framework MITRE ATLAS

**Version :** 1.0-draft
**Dernière mise à jour :** 2026-02-04
**Méthodologie :** MITRE ATLAS + diagrammes de flux de données
**Framework :** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Attribution du framework

Ce modèle de menace est construit sur [MITRE ATLAS](https://atlas.mitre.org/), le framework de référence du secteur pour documenter les menaces adverses sur les systèmes IA/ML. ATLAS est maintenu par [MITRE](https://www.mitre.org/) en collaboration avec la communauté de sécurité de l’IA.

**Ressources clés ATLAS :**

- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Tactiques ATLAS](https://atlas.mitre.org/tactics/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Contribuer à ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuer à ce modèle de menace

Il s’agit d’un document vivant maintenu par la communauté OpenClaw. Voir [CONTRIBUTING-THREAT-MODEL.md](/fr/security/CONTRIBUTING-THREAT-MODEL) pour les directives de contribution :

- Signaler de nouvelles menaces
- Mettre à jour les menaces existantes
- Proposer des chaînes d’attaque
- Suggérer des mesures d’atténuation

---

## 1. Introduction

### 1.1 Objectif

Ce modèle de menace documente les menaces adverses pesant sur la plateforme d’agents IA OpenClaw et la marketplace de Skills ClawHub, en utilisant le framework MITRE ATLAS conçu spécifiquement pour les systèmes IA/ML.

### 1.2 Périmètre

| Composant             | Inclus | Remarques                                           |
| --------------------- | ------ | --------------------------------------------------- |
| Runtime d’agent OpenClaw | Oui   | Exécution principale de l’agent, appels d’outils, sessions |
| Gateway               | Oui    | Authentification, routage, intégration de canaux    |
| Intégrations de canaux | Oui   | WhatsApp, Telegram, Discord, Signal, Slack, etc.    |
| Marketplace ClawHub   | Oui    | Publication de Skills, modération, distribution     |
| Serveurs MCP          | Oui    | Fournisseurs d’outils externes                      |
| Appareils utilisateur | Partiel | Applications mobiles, clients bureau               |

### 1.3 Hors périmètre

Rien n’est explicitement hors périmètre pour ce modèle de menace.

---

## 2. Architecture du système

### 2.1 Limites de confiance

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONE NON FIABLE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│             LIMITE DE CONFIANCE 1 : accès aux canaux            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Appairage des appareils (1h DM / 5 min de délai de grâce nœud) │   │
│  │  • Validation AllowFrom / AllowList                      │   │
│  │  • Auth token/password/Tailscale                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           LIMITE DE CONFIANCE 2 : isolation des sessions        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSIONS D’AGENT                        │   │
│  │  • Clé de session = agent:channel:peer                   │   │
│  │  • Politiques d’outils par agent                         │   │
│  │  • Journalisation des transcriptions                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         LIMITE DE CONFIANCE 3 : exécution des outils            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                SANDBOX D’EXÉCUTION                        │   │
│  │  • Sandbox Docker OU hôte (exec-approvals)               │   │
│  │  • Exécution distante du nœud                             │   │
│  │  • Protection SSRF (épinglage DNS + blocage IP)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        LIMITE DE CONFIANCE 4 : contenu externe                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         URLS / E-MAILS / WEBHOOKS RÉCUPÉRÉS              │   │
│  │  • Encapsulation du contenu externe (balises XML)        │   │
│  │  • Injection d’avis de sécurité                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        LIMITE DE CONFIANCE 5 : chaîne d’approvisionnement       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publication de Skills (semver, SKILL.md requis)       │   │
│  │  • Indicateurs de modération basés sur des motifs        │   │
│  │  • Analyse VirusTotal (bientôt disponible)               │   │
│  │  • Vérification de l’âge du compte GitHub                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de données

| Flow | Source  | Destination | Data               | Protection           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Canal   | Gateway     | Messages utilisateur | TLS, AllowFrom      |
| F2   | Gateway | Agent       | Messages routés    | Isolation de session |
| F3   | Agent   | Outils      | Appels d’outils    | Application de politique |
| F4   | Agent   | Externe     | requêtes `web_fetch` | Blocage SSRF       |
| F5   | ClawHub | Agent       | Code de Skill      | Modération, analyse  |
| F6   | Agent   | Canal       | Réponses           | Filtrage de sortie   |

---

## 3. Analyse des menaces par tactique ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001 : découverte d’endpoint d’agent

| Attribut                | Valeur                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Active Scanning                                          |
| **Description**         | L’attaquant recherche des endpoints Gateway OpenClaw exposés         |
| **Vecteur d’attaque**   | Scan réseau, requêtes Shodan, énumération DNS                        |
| **Composants affectés** | Gateway, endpoints API exposés                                       |
| **Atténuations actuelles** | Option d’authentification Tailscale, liaison loopback par défaut  |
| **Risque résiduel**     | Moyen - Gateways publics détectables                                 |
| **Recommandations**     | Documenter le déploiement sécurisé, ajouter une limitation de débit sur les endpoints de découverte |

#### T-RECON-002 : sondage des intégrations de canaux

| Attribut                | Valeur                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Active Scanning                                          |
| **Description**         | L’attaquant sonde les canaux de messagerie pour identifier les comptes gérés par IA |
| **Vecteur d’attaque**   | Envoi de messages de test, observation des schémas de réponse        |
| **Composants affectés** | Toutes les intégrations de canaux                                    |
| **Atténuations actuelles** | Aucune spécifique                                                 |
| **Risque résiduel**     | Faible - Valeur limitée de la seule découverte                       |
| **Recommandations**     | Envisager une randomisation du temps de réponse                      |

---

### 3.2 Accès initial (AML.TA0004)

#### T-ACCESS-001 : interception de code d’appairage

| Attribut                | Valeur                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - AI Model Inference API Access                                                                   |
| **Description**         | L’attaquant intercepte un code d’appairage pendant la période de grâce d’appairage (1h pour l’appairage DM de canal, 5 min pour l’appairage de nœud) |
| **Vecteur d’attaque**   | Observation par-dessus l’épaule, sniffing réseau, ingénierie sociale                                        |
| **Composants affectés** | Système d’appairage des appareils                                                                           |
| **Atténuations actuelles** | Expiration à 1h (appairage DM) / 5 min (appairage de nœud), codes envoyés via le canal existant        |
| **Risque résiduel**     | Moyen - Période de grâce exploitable                                                                        |
| **Recommandations**     | Réduire la période de grâce, ajouter une étape de confirmation                                              |

#### T-ACCESS-002 : usurpation d’AllowFrom

| Attribut                | Valeur                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - AI Model Inference API Access                                      |
| **Description**         | L’attaquant usurpe une identité d’expéditeur autorisée dans le canal          |
| **Vecteur d’attaque**   | Dépend du canal — usurpation de numéro de téléphone, imitation de nom d’utilisateur |
| **Composants affectés** | Validation AllowFrom par canal                                                 |
| **Atténuations actuelles** | Vérification d’identité spécifique au canal                                 |
| **Risque résiduel**     | Moyen - Certains canaux sont vulnérables à l’usurpation                        |
| **Recommandations**     | Documenter les risques spécifiques aux canaux, ajouter une vérification cryptographique lorsque possible |

#### T-ACCESS-003 : vol de jeton

| Attribut                | Valeur                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - AI Model Inference API Access                   |
| **Description**         | L’attaquant vole des jetons d’authentification depuis les fichiers de configuration |
| **Vecteur d’attaque**   | Malware, accès non autorisé à l’appareil, exposition d’une sauvegarde de configuration |
| **Composants affectés** | `~/.openclaw/credentials/`, stockage de configuration       |
| **Atténuations actuelles** | Permissions de fichier                                   |
| **Risque résiduel**     | Élevé - Jetons stockés en texte brut                        |
| **Recommandations**     | Implémenter le chiffrement des jetons au repos, ajouter la rotation des jetons |

---

### 3.3 Exécution (AML.TA0005)

#### T-EXEC-001 : injection de prompt directe

| Attribut                | Valeur                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - LLM Prompt Injection: Direct                                          |
| **Description**         | L’attaquant envoie des prompts conçus pour manipuler le comportement de l’agent      |
| **Vecteur d’attaque**   | Messages de canal contenant des instructions adverses                                 |
| **Composants affectés** | LLM de l’agent, toutes les surfaces d’entrée                                          |
| **Atténuations actuelles** | Détection de motifs, encapsulation du contenu externe                              |
| **Risque résiduel**     | Critique - Détection seulement, aucun blocage ; les attaques sophistiquées contournent |
| **Recommandations**     | Implémenter une défense multicouche, validation de sortie, confirmation utilisateur pour les actions sensibles |

#### T-EXEC-002 : injection de prompt indirecte

| Attribut                | Valeur                                                     |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - LLM Prompt Injection: Indirect             |
| **Description**         | L’attaquant intègre des instructions malveillantes dans le contenu récupéré |
| **Vecteur d’attaque**   | URLs malveillantes, e-mails empoisonnés, webhooks compromis |
| **Composants affectés** | `web_fetch`, ingestion d’e-mails, sources de données externes |
| **Atténuations actuelles** | Encapsulation du contenu avec balises XML et avis de sécurité |
| **Risque résiduel**     | Élevé - Le LLM peut ignorer les instructions d’encapsulation |
| **Recommandations**     | Implémenter une désinfection du contenu, des contextes d’exécution séparés |

#### T-EXEC-003 : injection d’arguments d’outil

| Attribut                | Valeur                                                       |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - LLM Prompt Injection: Direct                 |
| **Description**         | L’attaquant manipule les arguments d’outil via injection de prompt |
| **Vecteur d’attaque**   | Prompts conçus pour influencer les valeurs des paramètres d’outil |
| **Composants affectés** | Toutes les invocations d’outils                              |
| **Atténuations actuelles** | Approbations exec pour les commandes dangereuses          |
| **Risque résiduel**     | Élevé - Repose sur le jugement de l’utilisateur              |
| **Recommandations**     | Implémenter une validation des arguments, des appels d’outils paramétrés |

#### T-EXEC-004 : contournement de l’approbation exec

| Attribut                | Valeur                                                     |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Craft Adversarial Data                         |
| **Description**         | L’attaquant fabrique des commandes qui contournent la liste d’autorisation d’approbation |
| **Vecteur d’attaque**   | Obfuscation de commande, exploitation d’alias, manipulation de chemin |
| **Composants affectés** | `exec-approvals.ts`, liste d’autorisation de commandes     |
| **Atténuations actuelles** | Liste d’autorisation + mode ask                         |
| **Risque résiduel**     | Élevé - Aucune désinfection des commandes                  |
| **Recommandations**     | Implémenter une normalisation des commandes, étendre la liste de blocage |

---

### 3.4 Persistance (AML.TA0006)

#### T-PERSIST-001 : installation de Skill malveillante

| Attribut                | Valeur                                                                   |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Supply Chain Compromise: AI Software                     |
| **Description**         | L’attaquant publie une Skill malveillante sur ClawHub                    |
| **Vecteur d’attaque**   | Créer un compte, publier une Skill avec du code malveillant caché        |
| **Composants affectés** | ClawHub, chargement des Skills, exécution de l’agent                     |
| **Atténuations actuelles** | Vérification de l’âge du compte GitHub, indicateurs de modération basés sur des motifs |
| **Risque résiduel**     | Critique - Pas de sandboxing, revue limitée                              |
| **Recommandations**     | Intégration VirusTotal (en cours), sandboxing des Skills, revue communautaire |

#### T-PERSIST-002 : empoisonnement de mise à jour de Skill

| Attribut                | Valeur                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Supply Chain Compromise: AI Software           |
| **Description**         | L’attaquant compromet une Skill populaire et pousse une mise à jour malveillante |
| **Vecteur d’attaque**   | Compromission de compte, ingénierie sociale du propriétaire de la Skill |
| **Composants affectés** | Gestion des versions de ClawHub, flux de mise à jour automatique |
| **Atténuations actuelles** | Empreinte de version                                         |
| **Risque résiduel**     | Élevé - Les mises à jour automatiques peuvent récupérer des versions malveillantes |
| **Recommandations**     | Implémenter la signature des mises à jour, une capacité de rollback, l’épinglage de version |

#### T-PERSIST-003 : altération de la configuration de l’agent

| Attribut                | Valeur                                                          |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Supply Chain Compromise: Data                   |
| **Description**         | L’attaquant modifie la configuration de l’agent pour maintenir son accès |
| **Vecteur d’attaque**   | Modification de fichier de configuration, injection de paramètres |
| **Composants affectés** | Configuration de l’agent, politiques d’outils                   |
| **Atténuations actuelles** | Permissions de fichier                                       |
| **Risque résiduel**     | Moyen - Nécessite un accès local                                |
| **Recommandations**     | Vérification d’intégrité de la configuration, journalisation d’audit des changements de configuration |

---

### 3.5 Contournement des défenses (AML.TA0007)

#### T-EVADE-001 : contournement des motifs de modération

| Attribut                | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Craft Adversarial Data                                     |
| **Description**         | L’attaquant fabrique du contenu de Skill pour contourner les motifs de modération |
| **Vecteur d’attaque**   | Homoglyphes Unicode, astuces d’encodage, chargement dynamique          |
| **Composants affectés** | `moderation.ts` de ClawHub                                             |
| **Atténuations actuelles** | `FLAG_RULES` basées sur des motifs                                  |
| **Risque résiduel**     | Élevé - Regex simples facilement contournables                         |
| **Recommandations**     | Ajouter une analyse comportementale (VirusTotal Code Insight), détection basée sur AST |

#### T-EVADE-002 : échappement à l’encapsulation de contenu

| Attribut                | Valeur                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Craft Adversarial Data                        |
| **Description**         | L’attaquant fabrique un contenu qui s’échappe du contexte d’encapsulation XML |
| **Vecteur d’attaque**   | Manipulation de balises, confusion de contexte, remplacement d’instructions |
| **Composants affectés** | Encapsulation du contenu externe                          |
| **Atténuations actuelles** | Balises XML + avis de sécurité                         |
| **Risque résiduel**     | Moyen - De nouvelles échappatoires sont découvertes régulièrement |
| **Recommandations**     | Plusieurs couches d’encapsulation, validation côté sortie |

---

### 3.6 Découverte (AML.TA0008)

#### T-DISC-001 : énumération des outils

| Attribut                | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - AI Model Inference API Access             |
| **Description**         | L’attaquant énumère les outils disponibles via le prompting |
| **Vecteur d’attaque**   | Requêtes du type « Quels outils as-tu ? »             |
| **Composants affectés** | Registre d’outils de l’agent                          |
| **Atténuations actuelles** | Aucune spécifique                                  |
| **Risque résiduel**     | Faible - Les outils sont généralement documentés      |
| **Recommandations**     | Envisager des contrôles de visibilité des outils      |

#### T-DISC-002 : extraction de données de session

| Attribut                | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - AI Model Inference API Access             |
| **Description**         | L’attaquant extrait des données sensibles du contexte de session |
| **Vecteur d’attaque**   | Requêtes « De quoi avons-nous parlé ? », sondage du contexte |
| **Composants affectés** | Transcriptions de session, fenêtre de contexte        |
| **Atténuations actuelles** | Isolation de session par expéditeur                |
| **Risque résiduel**     | Moyen - Les données intra-session sont accessibles    |
| **Recommandations**     | Implémenter une expurgation des données sensibles dans le contexte |

---

### 3.7 Collecte & exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001 : vol de données via `web_fetch`

| Attribut                | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collection                                                 |
| **Description**         | L’attaquant exfiltre des données en demandant à l’agent de les envoyer vers une URL externe |
| **Vecteur d’attaque**   | Injection de prompt poussant l’agent à POSTer des données vers un serveur de l’attaquant |
| **Composants affectés** | Outil `web_fetch`                                                      |
| **Atténuations actuelles** | Blocage SSRF pour les réseaux internes                              |
| **Risque résiduel**     | Élevé - Les URL externes sont autorisées                               |
| **Recommandations**     | Implémenter une liste d’autorisation d’URL, une sensibilité à la classification des données |

#### T-EXFIL-002 : envoi non autorisé de messages

| Attribut                | Valeur                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collection                                           |
| **Description**         | L’attaquant pousse l’agent à envoyer des messages contenant des données sensibles |
| **Vecteur d’attaque**   | Injection de prompt poussant l’agent à envoyer un message à l’attaquant |
| **Composants affectés** | Outil de message, intégrations de canaux                         |
| **Atténuations actuelles** | Contrôle des envois sortants                                  |
| **Risque résiduel**     | Moyen - Le contrôle peut être contourné                          |
| **Recommandations**     | Exiger une confirmation explicite pour les nouveaux destinataires |

#### T-EXFIL-003 : collecte d’identifiants

| Attribut                | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collection                                  |
| **Description**         | Une Skill malveillante collecte des identifiants depuis le contexte de l’agent |
| **Vecteur d’attaque**   | Le code de la Skill lit les variables d’environnement, les fichiers de configuration |
| **Composants affectés** | Environnement d’exécution de la Skill                   |
| **Atténuations actuelles** | Aucune spécifique aux Skills                         |
| **Risque résiduel**     | Critique - Les Skills s’exécutent avec les privilèges de l’agent |
| **Recommandations**     | Sandboxing des Skills, isolation des identifiants       |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001 : exécution de commande non autorisée

| Attribut                | Valeur                                              |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erode AI Model Integrity                |
| **Description**         | L’attaquant exécute des commandes arbitraires sur le système de l’utilisateur |
| **Vecteur d’attaque**   | Injection de prompt combinée à un contournement d’approbation exec |
| **Composants affectés** | Outil Bash, exécution de commande                   |
| **Atténuations actuelles** | Approbations exec, option de sandbox Docker      |
| **Risque résiduel**     | Critique - Exécution sur l’hôte sans sandbox        |
| **Recommandations**     | Utiliser la sandbox par défaut, améliorer l’UX des approbations |

#### T-IMPACT-002 : épuisement des ressources (DoS)

| Attribut                | Valeur                                             |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erode AI Model Integrity               |
| **Description**         | L’attaquant épuise les crédits API ou les ressources de calcul |
| **Vecteur d’attaque**   | Inondation automatisée de messages, appels d’outils coûteux |
| **Composants affectés** | Gateway, sessions d’agent, fournisseur API         |
| **Atténuations actuelles** | Aucune                                           |
| **Risque résiduel**     | Élevé - Aucune limitation de débit                 |
| **Recommandations**     | Implémenter des limites de débit par expéditeur, des budgets de coût |

#### T-IMPACT-003 : atteinte à la réputation

| Attribut                | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erode AI Model Integrity                    |
| **Description**         | L’attaquant pousse l’agent à envoyer un contenu nuisible/offensant |
| **Vecteur d’attaque**   | Injection de prompt causant des réponses inappropriées |
| **Composants affectés** | Génération de sortie, messagerie de canal               |
| **Atténuations actuelles** | Politiques de contenu du fournisseur LLM            |
| **Risque résiduel**     | Moyen - Les filtres fournisseur sont imparfaits         |
| **Recommandations**     | Ajouter une couche de filtrage de sortie, des contrôles utilisateur |

---

## 4. Analyse de la chaîne d’approvisionnement ClawHub

### 4.1 Contrôles de sécurité actuels

| Contrôle             | Implémentation              | Efficacité                                           |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Âge du compte GitHub | `requireGitHubAccountAge()` | Moyenne - Relève le niveau pour les nouveaux attaquants |
| Désinfection des chemins | `sanitizePath()`         | Élevée - Empêche la traversée de chemins             |
| Validation des types de fichiers | `isTextFile()`   | Moyenne - Fichiers texte uniquement, mais toujours potentiellement malveillants |
| Limites de taille    | 50MB pour le bundle total   | Élevée - Empêche l’épuisement des ressources         |
| `SKILL.md` requis    | Readme obligatoire          | Faible valeur de sécurité - Informatif uniquement    |
| Modération par motifs | `FLAG_RULES` dans `moderation.ts` | Faible - Facilement contournable             |
| Statut de modération | champ `moderationStatus`    | Moyenne - Revue manuelle possible                    |

### 4.2 Motifs d’indicateurs de modération

Motifs actuels dans `moderation.ts` :

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limites :**

- Vérifie uniquement le slug, le nom d’affichage, le résumé, le frontmatter, les métadonnées et les chemins de fichier
- N’analyse pas le contenu réel du code de la Skill
- Les regex simples sont facilement contournables par obfuscation
- Pas d’analyse comportementale

### 4.3 Améliorations prévues

| Amélioration           | Statut                               | Impact                                                                |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Intégration VirusTotal | En cours                             | Élevé - Analyse comportementale Code Insight                          |
| Signalement communautaire | Partiel (`skillReports` table exists) | Moyen                                                             |
| Journalisation d’audit | Partiel (`auditLogs` table exists)   | Moyen                                                                 |
| Système de badges      | Implémenté                           | Moyen - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice des risques

### 5.1 Probabilité vs impact

| ID de menace  | Probabilité | Impact   | Niveau de risque | Priorité |
| ------------- | ----------- | -------- | ---------------- | -------- |
| T-EXEC-001    | Élevée      | Critique | **Critique**     | P0       |
| T-PERSIST-001 | Élevée      | Critique | **Critique**     | P0       |
| T-EXFIL-003   | Moyenne     | Critique | **Critique**     | P0       |
| T-IMPACT-001  | Moyenne     | Critique | **Élevé**        | P1       |
| T-EXEC-002    | Élevée      | Élevé    | **Élevé**        | P1       |
| T-EXEC-004    | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-ACCESS-003  | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-EXFIL-001   | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-IMPACT-002  | Élevée      | Moyen    | **Élevé**        | P1       |
| T-EVADE-001   | Élevée      | Moyen    | **Moyen**        | P2       |
| T-ACCESS-001  | Faible      | Élevé    | **Moyen**        | P2       |
| T-ACCESS-002  | Faible      | Élevé    | **Moyen**        | P2       |
| T-PERSIST-002 | Faible      | Élevé    | **Moyen**        | P2       |

### 5.2 Chaînes d’attaque critiques

**Chaîne d’attaque 1 : vol de données basé sur une Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publier une Skill malveillante) → (Contourner la modération) → (Collecter des identifiants)
```

**Chaîne d’attaque 2 : injection de prompt vers RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injecter un prompt) → (Contourner l’approbation exec) → (Exécuter des commandes)
```

**Chaîne d’attaque 3 : injection indirecte via contenu récupéré**

```
T-EXEC-002 → T-EXFIL-001 → Exfiltration externe
(Empoisonner le contenu d’URL) → (L’agent récupère et suit les instructions) → (Données envoyées à l’attaquant)
```

---

## 6. Résumé des recommandations

### 6.1 Immédiat (P0)

| ID    | Recommandation                               | Traite                      |
| ----- | -------------------------------------------- | --------------------------- |
| R-001 | Finaliser l’intégration VirusTotal           | T-PERSIST-001, T-EVADE-001  |
| R-002 | Implémenter le sandboxing des Skills         | T-PERSIST-001, T-EXFIL-003  |
| R-003 | Ajouter une validation de sortie pour les actions sensibles | T-EXEC-001, T-EXEC-002 |

### 6.2 Court terme (P1)

| ID    | Recommandation                              | Traite        |
| ----- | ------------------------------------------- | ------------- |
| R-004 | Implémenter une limitation de débit         | T-IMPACT-002  |
| R-005 | Ajouter le chiffrement des jetons au repos  | T-ACCESS-003  |
| R-006 | Améliorer l’UX et la validation des approbations exec | T-EXEC-004 |
| R-007 | Implémenter une liste d’autorisation d’URL pour `web_fetch` | T-EXFIL-001 |

### 6.3 Moyen terme (P2)

| ID    | Recommandation                                         | Traite        |
| ----- | ------------------------------------------------------ | ------------- |
| R-008 | Ajouter une vérification cryptographique des canaux lorsque possible | T-ACCESS-002 |
| R-009 | Implémenter une vérification d’intégrité de la configuration | T-PERSIST-003 |
| R-010 | Ajouter la signature des mises à jour et l’épinglage de version | T-PERSIST-002 |

---

## 7. Annexes

### 7.1 Correspondance des techniques ATLAS

| ID ATLAS      | Nom de la technique             | Menaces OpenClaw                                                  |
| ------------- | ------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Active Scanning                 | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Collection                      | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Supply Chain: AI Software       | T-PERSIST-001, T-PERSIST-002                                      |
| AML.T0010.002 | Supply Chain: Data              | T-PERSIST-003                                                     |
| AML.T0031     | Erode AI Model Integrity        | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                          |
| AML.T0040     | AI Model Inference API Access   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002  |
| AML.T0043     | Craft Adversarial Data          | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | LLM Prompt Injection: Direct    | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | LLM Prompt Injection: Indirect  | T-EXEC-002                                                        |

### 7.2 Fichiers de sécurité clés

| Path                                | Purpose                      | Risk Level   |
| ----------------------------------- | ---------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logique d’approbation de commande | **Critique** |
| `src/gateway/auth.ts`               | Authentification Gateway     | **Critique** |
| `src/infra/net/ssrf.ts`             | Protection SSRF              | **Critique** |
| `src/security/external-content.ts`  | Atténuation de l’injection de prompt | **Critique** |
| `src/agents/sandbox/tool-policy.ts` | Application de la politique d’outils | **Critique** |
| `src/routing/resolve-route.ts`      | Isolation de session         | **Moyen**    |

### 7.3 Glossaire

| Term                 | Definition                                                      |
| -------------------- | --------------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems de MITRE            |
| **ClawHub**          | Marketplace de Skills d’OpenClaw                                |
| **Gateway**          | Couche de routage des messages et d’authentification d’OpenClaw |
| **MCP**              | Model Context Protocol - interface de fournisseur d’outils      |
| **Prompt Injection** | Attaque où des instructions malveillantes sont intégrées dans une entrée |
| **Skill**            | Extension téléchargeable pour les agents OpenClaw               |
| **SSRF**             | Server-Side Request Forgery                                     |

---

_Ce modèle de menace est un document vivant. Signalez les problèmes de sécurité à security@openclaw.ai_

## Associé

- [Vérification formelle](/fr/security/formal-verification)
- [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL)
