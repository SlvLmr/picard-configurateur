import { useCallback, useMemo, useState } from 'react';
import { decors, doors, colors, handles, glasses, finishes } from '../data';

export const STEPS = [
  { id: 1, key: 'personalize', label: 'Personnalisation' },
  { id: 2, key: 'summary', label: 'Récapitulatif' },
];

const MAX_STEP = STEPS.length;

const DEFAULT_STATE = {
  step: 0, // 0 = intro, 1..3 = steps
  decorId: 1,
  customPhoto: null, // base64 data url
  doorId: doors[0].id,
  view: 'exterior',
  colorId: colors[0].id,
  handleId: handles[0].id,
  glassId: glasses[0].id,
  accessoryIds: [],
  finishId: finishes[1].id,
};

export default function useConfiguratorState() {
  const [state, setState] = useState(DEFAULT_STATE);

  const set = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, MAX_STEP) }));
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }, []);

  const goTo = useCallback((step) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const restore = useCallback((saved) => {
    setState((prev) => ({ ...prev, ...saved, step: MAX_STEP }));
  }, []);

  const toggleAccessory = useCallback((accessoryId) => {
    setState((prev) => {
      const isSelected = prev.accessoryIds.includes(accessoryId);
      return {
        ...prev,
        accessoryIds: isSelected
          ? prev.accessoryIds.filter((id) => id !== accessoryId)
          : [...prev.accessoryIds, accessoryId],
      };
    });
  }, []);

  const selections = useMemo(() => {
    return {
      decor: decors.find((d) => d.id === state.decorId) || null,
      door: doors.find((d) => d.id === state.doorId) || doors[0],
      color: colors.find((c) => c.id === state.colorId) || colors[0],
      handle: handles.find((h) => h.id === state.handleId) || handles[0],
      glass: glasses.find((g) => g.id === state.glassId) || glasses[0],
      finish: finishes.find((f) => f.id === state.finishId) || finishes[1],
    };
  }, [state.decorId, state.doorId, state.colorId, state.handleId, state.glassId, state.finishId]);

  const persistablePayload = useMemo(
    () => ({
      decorId: state.decorId,
      customPhoto: state.customPhoto,
      doorId: state.doorId,
      view: state.view,
      colorId: state.colorId,
      handleId: state.handleId,
      glassId: state.glassId,
      accessoryIds: state.accessoryIds,
      finishId: state.finishId,
    }),
    [state],
  );

  return {
    state,
    set,
    next,
    back,
    goTo,
    reset,
    restore,
    toggleAccessory,
    selections,
    persistablePayload,
  };
}
