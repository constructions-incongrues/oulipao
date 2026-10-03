/** Le journal des versions, tenu par release-please dans le dépôt. */
export const CHANGELOG_URL = 'https://github.com/constructions-incongrues/oulipao/blob/main/CHANGELOG.md';

/** Le libellé affiché pour une version (« 0.2.0 » → « v0.2.0 ») et le lien vers le journal. */
export const versionLink = (version: string) => ({ text: `v${version}`, href: CHANGELOG_URL });
