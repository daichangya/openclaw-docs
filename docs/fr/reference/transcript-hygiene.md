---
read_when:
    - Vous déboguez des rejets de requêtes fournisseur liés à la forme de la transcription
    - Vous modifiez le nettoyage des transcriptions ou la logique de réparation des appels d’outils
    - Vous enquêtez sur des incohérences d’identifiant d’appel d’outil entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions spécifiques au fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-04-25T18:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Ce document décrit les **correctifs spécifiques au fournisseur** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). La plupart sont des ajustements **en mémoire**
utilisés pour satisfaire des exigences strictes des fournisseurs. Un passage distinct de réparation
du fichier de session peut aussi réécrire le JSONL stocké avant le chargement de la session, soit en supprimant
les lignes JSONL malformées, soit en réparant des tours persistés syntaxiquement valides mais connus pour être rejetés par un
fournisseur lors de la relecture. Lorsqu’une réparation a lieu, le fichier original est sauvegardé à côté
du fichier de session.

Le périmètre inclut :

- Contexte de prompt uniquement à l’exécution restant hors des tours de transcription visibles par l’utilisateur
- Nettoyage des identifiants d’appel d’outil
- Validation des entrées d’appel d’outil
- Réparation de l’appariement des résultats d’outil
- Validation / ordonnancement des tours
- Nettoyage des signatures de pensée
- Nettoyage des charges utiles d’image
- Marquage de provenance des entrées utilisateur (pour les prompts routés entre sessions)
- Réparation des tours d’erreur d’assistant vides pour la relecture Bedrock Converse

Si vous avez besoin des détails de stockage des transcriptions, voir :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté au prompt du modèle pour un tour, mais ce
n’est pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps de prompt
séparé, côté transcription, pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les exécutions Pi
intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription à la place du
prompt enrichi à l’exécution.

Pour les anciennes sessions qui ont déjà persisté des wrappers d’exécution, les
surfaces d’historique Gateway appliquent une projection d’affichage avant de renvoyer les messages à WebChat,
TUI, REST ou aux clients SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application du nettoyage/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider de ce qu’il faut appliquer.

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur intégré)

---

## Règle globale : nettoyage des images

Les charges utiles d’image sont toujours nettoyées pour éviter le rejet côté fournisseur à cause de limites
de taille (réduction/recompression des images base64 surdimensionnées).

Cela aide aussi à contrôler la pression de jetons induite par les images pour les modèles capables de vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal des images est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outil malformés

Les blocs d’appel d’outil assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets de fournisseur dus à des appels d’outil
partiellement persistés (par exemple après un échec dû à une limitation de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie un prompt dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce agent-vers-agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Ces métadonnées sont écrites au moment de l’ajout à la transcription et ne changent pas le rôle
(`role: "user"` reste pour la compatibilité fournisseur). Les lecteurs de transcription peuvent utiliser cela
pour éviter de traiter les prompts internes routés comme des instructions rédigées par l’utilisateur final.

Lors de la reconstruction du contexte, OpenClaw ajoute aussi en mémoire un court marqueur
`[Inter-session message]` à ces tours utilisateur afin que le modèle puisse les distinguer des
instructions externes de l’utilisateur final.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Nettoyage des images uniquement.
- Supprime les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprime le raisonnement rejouable OpenAI après un changement de route de modèle.
- Aucun nettoyage des identifiants d’appel d’outil.
- La réparation de l’appariement des résultats d’outil peut déplacer les sorties réelles correspondantes et synthétiser des sorties `aborted` de style Codex pour les appels d’outil manquants.
- Aucune validation ni réordonnancement des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées comme `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucun retrait des signatures de pensée.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Nettoyage des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordre des tours Google (ajoute un minuscule bootstrap utilisateur si l’historique commence par un assistant).
- Antigravity Claude : normalise les signatures de réflexion ; supprime les blocs de réflexion non signés.

**Anthropic / Minimax (compatibles Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire une alternance stricte).

**Amazon Bedrock (API Converse)**

- Les tours vides d’assistant issus d’erreurs de flux sont réparés en un bloc de texte de repli non vide
  avant la relecture. Bedrock Converse rejette les messages assistant avec `content: []`, donc
  les tours assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  réparés sur disque avant chargement.
- La relecture filtre les tours assistant miroir de livraison OpenClaw et injectés par la Gateway.
- Le nettoyage des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Nettoyage des identifiants d’appel d’outil : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve le base64).

**Tout le reste**

- Nettoyage des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension de nettoyage de transcription** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement usage d’outil/résultat.
  - Nettoyer les identifiants d’appel d’outil (y compris un mode non strict qui conservait `_`/`-`).
- L’exécuteur effectuait aussi un nettoyage spécifique au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte assistant avant persistance.
  - Suppression des tours d’erreur d’assistant vides.
  - Tronquage du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment l’appariement `openai-responses`
`call_id|fc_id`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur, et rendu OpenAI **intouché** au-delà du nettoyage des images.

## Liens associés

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
