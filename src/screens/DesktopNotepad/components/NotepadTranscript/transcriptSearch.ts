import type { TranscriptMarks } from "@/components/Transcript";
import type { Caption } from "@/features/transcript";

export interface TranscriptSearchResult {
  marks: TranscriptMarks;
  /** Caption index for each match occurrence, in transcript order. */
  matches: number[];
}

type SearchableCaption = { index: number; text: string };

/**
 * Pure, self-contained search over captions. Must not reference any outer scope
 * so it can be serialized and run inside a Web Worker.
 */
function searchCaptions(
  captions: SearchableCaption[],
  rawQuery: string,
): TranscriptSearchResult {
  const query = rawQuery.toLowerCase().trim();
  const marks: Record<number, { word: string }[]> = {};
  const matches: number[] = [];
  if (!query) return { marks, matches };

  for (const caption of captions) {
    const lower = caption.text.toLowerCase();
    let from = lower.indexOf(query);
    while (from !== -1) {
      if (!marks[caption.index]) marks[caption.index] = [];
      marks[caption.index].push({
        word: caption.text.slice(from, from + query.length),
      });
      matches.push(caption.index);
      from = lower.indexOf(query, from + query.length);
    }
  }

  return { marks, matches };
}

let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<number, (result: TranscriptSearchResult) => void>();

function getWorker(): Worker | null {
  if (
    typeof Worker === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return null;
  }
  if (worker) return worker;

  try {
    const source = `const searchCaptions = ${searchCaptions.toString()};
self.onmessage = (event) => {
  const { id, captions, query } = event.data;
  self.postMessage({ id, result: searchCaptions(captions, query) });
};`;
    const blob = new Blob([source], { type: "text/javascript" });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = (event: MessageEvent) => {
      const { id, result } = event.data as {
        id: number;
        result: TranscriptSearchResult;
      };
      pending.get(id)?.(result);
      pending.delete(id);
    };
    return worker;
  } catch {
    return null;
  }
}

/**
 * Run a transcript search off the main thread when a Web Worker is available
 * (web/desktop), falling back to a synchronous search elsewhere.
 */
export function runTranscriptSearch(
  captions: Caption[],
  query: string,
): Promise<TranscriptSearchResult> {
  const input: SearchableCaption[] = captions.map((caption) => ({
    index: caption.index,
    text: caption.text,
  }));

  const activeWorker = getWorker();
  if (!activeWorker) {
    return Promise.resolve(searchCaptions(input, query));
  }

  return new Promise((resolve) => {
    const id = ++sequence;
    pending.set(id, resolve);
    activeWorker.postMessage({ id, captions: input, query });
  });
}
