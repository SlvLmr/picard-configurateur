import { useCallback, useMemo, useState } from 'react';
import {
  ambiances,
  doors,
  colors,
  handles,
  glasses,
  finishes,
  panels,
} from '../data';

export const STEPS = [
  { id: 1, key: 'personalize', label: 'Personnalisation' },
  { id: 2, key: 'summary', label: 'Récapitulatif' },
];

const MAX_STEP = STEPS.length;

const DEFAULT_STATE = {
  step: 0, // 0 = intro, 1..2 = steps
  ambianceId: ambiances[0].id,
  customPhoto: null,
  doorId: doors[0].id,
  view: 'exterior',
  // 4 distinct color slots
  doorColorExteriorId: colors[0].id,
  doorColorInteriorId: colors[0].id,
  frameColorExteriorId: colors[0].id,
  frameColorInteriorId: colors[0].id,
  panelId: panels[0].id,
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
    const door = doors.find((d) => d.id === state.doorId) || doors[0];
    return {
      ambiance: ambiances.find((a) => a.id === state.ambianceId) || null,
      door,
      doorColorExterior: colors.find((c) => c.id === state.doorColorExteriorId) || colors[0],
      doorColorInterior: colors.find((c) => c.id === state.doorColorInteriorId) || colors[0],
      frameColorExterior: colors.find((c) => c.id === state.frameColorExteriorId) || colors[0],
      frameColorInterior: colors.find((c) => c.id === state.frameColorInteriorId) || colors[0],
      panel: panels.find((p) => p.id === state.panelId) || panels[0],
      handle: handles.find((h) => h.id === state.handleId) || handles[0],
      glass: glasses.find((g) => g.id === state.glassId) || glasses[0],
      finish: finishes.find((f) => f.id === state.finishId) || finishes[1],
    };
  }, [
    state.ambianceId,
    state.doorId,
    state.doorColorExteriorId,
    state.doorColorInteriorId,
    state.frameColorExteriorId,
    state.frameColorInteriorId,
    state.panelId,
    state.handleId,
    state.glassId,
    state.finishId,
  ]);

  const persistablePayload = useMemo(
    () => ({
      ambianceId: state.ambianceId,
      customPhoto: state.customPhoto,
      doorId: state.doorId,
      view: state.view,
      doorColorExteriorId: state.doorColorExteriorId,
      doorColorInteriorId: state.doorColorInteriorId,
      frameColorExteriorId: state.frameColorExteriorId,
      frameColorInteriorId: state.frameColorInteriorId,
      panelId: state.panelId,
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
