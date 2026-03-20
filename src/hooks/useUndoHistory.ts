import { useState, useCallback, useRef } from 'react';

export interface HistoryEntry<T = any> {
  id: string;
  label: string;
  state: T;
  timestamp: number;
}

const MAX_HISTORY = 50;

export function useUndoHistory<T>() {
  const stackRef = useRef<HistoryEntry<T>[]>([]);
  const indexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoLabel, setUndoLabel] = useState('');
  const [redoLabel, setRedoLabel] = useState('');

  const updateFlags = useCallback(() => {
    const idx = indexRef.current;
    const stack = stackRef.current;
    setCanUndo(idx > 0);
    setCanRedo(idx < stack.length - 1);
    setUndoLabel(idx > 0 ? stack[idx].label : '');
    setRedoLabel(idx < stack.length - 1 ? stack[idx + 1].label : '');
  }, []);

  const push = useCallback((label: string, state: T) => {
    const stack = stackRef.current;
    // Truncate any redo states
    stack.splice(indexRef.current + 1);
    stack.push({
      id: crypto.randomUUID(),
      label,
      state: structuredClone(state),
      timestamp: Date.now(),
    });
    // Cap history length
    if (stack.length > MAX_HISTORY) stack.shift();
    indexRef.current = stack.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((): T | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    updateFlags();
    return structuredClone(stackRef.current[indexRef.current].state);
  }, [updateFlags]);

  const redo = useCallback((): T | null => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current++;
    updateFlags();
    return structuredClone(stackRef.current[indexRef.current].state);
  }, [updateFlags]);

  const clear = useCallback(() => {
    stackRef.current = [];
    indexRef.current = -1;
    updateFlags();
  }, [updateFlags]);

  return { push, undo, redo, clear, canUndo, canRedo, undoLabel, redoLabel };
}
