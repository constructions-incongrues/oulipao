// Chargement du modèle Xenova/french-camembert-postag-model (poids quantifiés ~111 Mo) par
// Transformers.js : WASM dans le navigateur, onnxruntime sous Node. Le texte n'est envoyé
// nulle part ; seuls la bibliothèque et les poids sont téléchargés, puis mis en cache.
// Exclu de la couverture de tests (modèle trop lourd pour un test unitaire) : toute la logique
// testable est dans camembert-tagger.ts.
// ponytail: bibliothèque et poids servis par des tiers (jsDelivr, Hugging Face) ; à héberger
// soi-même si on retient cette approche — la licence du modèle n'est pas déclarée.
import type { LabelledPiece, PieceClassifier } from './camembert-tagger.ts';

const MODEL = 'Xenova/french-camembert-postag-model';
/**
 * La révision des poids, figée : le dépôt appartient à un tiers, et sa branche `main` peut changer
 * sans prévenir. Relevée le 2026-10-04 ; dernière modification du dépôt le 2024-10-08.
 */
export const MODEL_REVISION = '39f044ac95da4c5fd3832cbc5658c027fc027127';
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

/** Le classifieur, et son chargement : à appeler d'avance pour suivre l'avancement du téléchargement. */
export interface CamembertClassifier extends PieceClassifier {
  load(onProgress?: (loaded: number, total: number) => void): Promise<void>;
}

/** Avancement global du téléchargement des poids, tel que le rapporte Transformers.js. */
interface ProgressInfo {
  status: string;
  loaded?: number;
  total?: number;
}

/** Ce que le chargement demande à Transformers.js : remplacé dans les tests pour vérifier les options. */
export interface TransformersLibrary {
  AutoTokenizer: { from_pretrained(model: string, options?: object): Promise<unknown> };
  AutoModelForTokenClassification: { from_pretrained(model: string, options?: object): Promise<unknown> };
}

export function createCamembertClassifier(importLibrary: () => Promise<TransformersLibrary> = () => import(/* @vite-ignore */ LIBRARY)): CamembertClassifier {
  let loaded: Promise<Loaded> | undefined;
  const load = (onProgress?: (loaded: number, total: number) => void) =>
    (loaded ??= (async () => {
      const { AutoTokenizer, AutoModelForTokenClassification } = await importLibrary();
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(MODEL, { revision: MODEL_REVISION }),
        AutoModelForTokenClassification.from_pretrained(MODEL, {
          revision: MODEL_REVISION,
          dtype: 'q8',
          progress_callback: (info: ProgressInfo) => {
            if (info.status === 'progress_total') onProgress?.(info.loaded ?? 0, info.total ?? 0);
          },
        }),
      ]);
      return { tokenizer, model } as Loaded;
    })().catch((error: unknown) => {
      loaded = undefined; // un échec n'est pas gardé : le prochain essai retélécharge
      throw error;
    }));

  return {
    async load(onProgress) {
      await load(onProgress);
    },
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
