import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHANGELOG_URL, versionLink } from '../../src/ui/version.ts';

test('la version se lit « v0.2.0 » et mène au journal des versions', () => {
  assert.deepEqual(versionLink('0.2.0'), { text: 'v0.2.0', href: CHANGELOG_URL });
  assert.equal(CHANGELOG_URL, 'https://github.com/constructions-incongrues/oulipao/blob/main/CHANGELOG.md');
});
