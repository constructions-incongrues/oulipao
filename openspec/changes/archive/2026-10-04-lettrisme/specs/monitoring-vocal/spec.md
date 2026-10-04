# Spec Delta

## ADDED Requirements

### Requirement: Source de la voix
The system SHALL offer in the listening transport a choice « La voix dit : le résultat / l'original », « le résultat » by default, kept in the browser with the tempo and the voice, validated when read back and reset to its default when invalid. With « l'original », each step SHALL say its original word, without punctuation, when its track is audible, and SHALL otherwise stay silent for a gap; the page SHALL keep showing the resulting text and the played step. A change of source SHALL apply from the next step on.

#### Scenario: Discrépance
- **GIVEN** un S+7 sur les noms qui remplace « chat », la voix réglée sur « l'original »
- **WHEN** la tête atteint le pas de « chat »
- **THEN** la voix dit « chat » et la page montre le nom remplacé

#### Scenario: Piste muette
- **GIVEN** la piste des noms muette, la voix réglée sur « l'original »
- **WHEN** la tête atteint le pas de « chat »
- **THEN** la voix se tait le temps d'un blanc

## MODIFIED Requirements

### Requirement: Mention « réglé en écoutant »
The system SHALL end the chain mention with « réglé en écoutant » when playback has run at least once since the text was last put on tracks or reopened from the notebook, and with « écouté en discrépance » when playback has run at least once with the voice set to « l'original » in that time; when both apply, « réglé en écoutant » SHALL come first. The mention SHALL then read « — {parts} · réglé en écoutant (Oulipao) », « — {parts} · réglé en écoutant · écouté en discrépance (Oulipao) », or the same without « {parts} · » when no rule is active. The same mention SHALL be appended by the copy control and stored in the notebook. Putting the text on tracks again or reopening an entry SHALL reset this state.

#### Scenario: Texte gardé après écoute
- **GIVEN** un S+7 sur les noms, et une lecture lancée puis arrêtée depuis la mise en pistes
- **WHEN** l'utilisateur garde le texte
- **THEN** l'entrée du carnet porte la mention « — S+7 … · réglé en écoutant (Oulipao) », « réglé en écoutant » en dernière partie

#### Scenario: Texte gardé après une écoute discrépante
- **GIVEN** un S+7 sur les noms, et une lecture lancée sur « l'original » depuis la mise en pistes
- **WHEN** l'utilisateur garde le texte
- **THEN** la mention se termine par « · réglé en écoutant · écouté en discrépance (Oulipao) »

#### Scenario: Sans écoute
- **GIVEN** un texte mis en pistes et aucune lecture lancée depuis
- **WHEN** l'utilisateur copie le texte résultant
- **THEN** la mention ne contient ni « réglé en écoutant » ni « écouté en discrépance »

#### Scenario: Remise en pistes
- **GIVEN** une lecture lancée, puis le texte remis en pistes
- **WHEN** l'utilisateur garde le texte sans relancer la lecture
- **THEN** la mention ne contient ni « réglé en écoutant » ni « écouté en discrépance »
