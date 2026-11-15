import type { KnowledgeHit } from '../../shared/knowledge';

/** An answer composed from the knowledge base, with the passages it cites. */
export type Answer = {
  answer: {
    paragraphs: { text: string; citations: { id: string; quote: string }[] }[];
    limitation: string;
  };
  sources: KnowledgeHit[];
};
export type VectorState = {
  model: string;
  bundled: boolean;
  active: boolean;
  selection_error: string | null;
  index: 'ready' | 'stale' | 'not_built';
  vector_count: number;
};
