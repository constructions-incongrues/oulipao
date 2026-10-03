// Chargement du modèle Xenova/french-camembert-postag-model (poids quantifiés ~111 Mo) par
// Transformers.js : WASM dans le navigateur, onnxruntime sous Node. Le texte n'est envoyé
// nulle part ; seuls la bibliothèque et les poids sont téléchargés, puis mis en cache.
// Exclu de la couverture de tests (modèle trop lourd pour un test unitaire) : toute la logique
// testable est dans camembert-tagger.ts.
// ponytail: bibliothèque et poids servis par des tiers (jsDelivr, Hugging Face) ; à héberger
// soi-même si on retient cette approche — la licence du modèle n'est pas déclarée.
import type { LabelledPiece, PieceClassifier } from './camembert-tagger.ts';

const MODEL = 'Xenova/french-camembert-postag-model';
const LIBRARY =
  typeof window === 'undefined'
    ? '@huggingface/transformers'
    : 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';

interface Loaded {
  tokenizer: {
    (text: string): Promise<{ input_ids: { data: ArrayLike<bigint | number> } }>;
    decode(ids: number[], options: { skip_special_tokens: boolean }): string;
  };
  model: {
    (inputs: unknown): Promise<{ logits: { dims: number[]; data: ArrayLike<number> } }>;
    config: { id2label: Record<number, string> };
  };
}

export function createCamembertClassifier(): PieceClassifier {
  let loaded: Promise<Loaded> | undefined;
  const load = () =>
    (loaded ??= (async () => {
      const { AutoTokenizer, AutoModelForTokenClassification } = await import(/* @vite-ignore */ LIBRARY);
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(MODEL),
        AutoModelForTokenClassification.from_pretrained(MODEL, { dtype: 'q8' }),
      ]);
      return { tokenizer, model } as Loaded;
    })());

  return {
    async classify(sentence: string): Promise<LabelledPiece[]> {
      const { tokenizer, model } = await load();
      const inputs = await tokenizer(sentence);
      const { logits } = await model(inputs);
      const labelCount = logits.dims[2]!;
      return Array.from(inputs.input_ids.data, Number).map((id, i) => {
        let best = 0;
        for (let j = 1; j < labelCount; j++) {
          if (logits.data[i * labelCount + j]! > logits.data[i * labelCount + best]!) best = j;
        }
        return { piece: tokenizer.decode([id], { skip_special_tokens: true }), label: model.config.id2label[best]! };
      });
    },
  };
}
