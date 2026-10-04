// Fige les sorties du banc de référence des contraintes, ou mesure ses temps.
// Usage : node scripts/chain-golden.ts > test/support/chain-golden.json
//         node scripts/chain-golden.ts --time   (95e centile par chaîne et par texte, sur 20 passages)
import { goldenRuns, GOLDEN_CHAINS, loadResources, references, runGolden } from '../test/support/chain-golden.ts';

const resources = await loadResources();
if (process.argv.includes('--time')) {
  for (const { file, reference } of references()) {
    for (const chain of Object.keys(GOLDEN_CHAINS)) {
      runGolden(chain, reference, resources); // premier passage : caches chauds
      const times = Array.from({ length: 20 }, () => {
        const start = performance.now();
        runGolden(chain, reference, resources);
        return performance.now() - start;
      }).sort((a, b) => a - b);
      console.log(`${file} ${chain} : ${times[18]!.toFixed(1)} ms (p95)`);
    }
  }
} else {
  process.stdout.write(`${JSON.stringify(goldenRuns(resources), null, 1)}\n`);
}
