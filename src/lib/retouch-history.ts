import type { RefynToolValues } from '@/components/refyn/refyn-types';
import type { RefynFilter } from '@/components/refyn/refyn-filters';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  toolLabel: string;
  values: RefynToolValues;
  cssOverrides?: RefynFilter['cssOverrides'];
}

export class RetouchHistory {
  private stack: HistoryEntry[] = [];
  private pointer = -1;
  private maxDepth: number;

  constructor(maxDepth = 25) {
    this.maxDepth = maxDepth;
  }

  push(
    toolLabel: string,
    values: RefynToolValues,
    cssOverrides?: RefynFilter['cssOverrides']
  ): void {
    // Truncate any redo entries
    this.stack = this.stack.slice(0, this.pointer + 1);

    this.stack.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      toolLabel,
      values: structuredClone(values),
      cssOverrides: cssOverrides ? { ...cssOverrides } : undefined,
    });

    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
    }

    this.pointer = this.stack.length - 1;
  }

  undo(): HistoryEntry | null {
    if (this.pointer <= 0) return null;
    this.pointer--;
    return structuredClone(this.stack[this.pointer]);
  }

  redo(): HistoryEntry | null {
    if (this.pointer >= this.stack.length - 1) return null;
    this.pointer++;
    return structuredClone(this.stack[this.pointer]);
  }

  get canUndo() { return this.pointer > 0; }
  get canRedo() { return this.pointer < this.stack.length - 1; }

  get undoLabel() {
    return this.canUndo ? this.stack[this.pointer].toolLabel : '';
  }

  get redoLabel() {
    return this.canRedo ? this.stack[this.pointer + 1].toolLabel : '';
  }

  clear() {
    this.stack = [];
    this.pointer = -1;
  }
}
