import { Select, type SelectOption } from "@/components/Input";
import type { DictationPillSide } from "electron/src/types";
import { type FC, useEffect, useState } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";

const PILL_POSITION_OPTIONS: SelectOption<DictationPillSide>[] = [
  { label: "Top", value: "top" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Bottom", value: "bottom" },
];

/**
 * The pill's edge lives in the main process, which also moves it when the
 * user drags. This mirrors that state so the Select follows both.
 */
function useDictationPillSide(): DictationPillSide {
  const [side, setSide] = useState<DictationPillSide>("bottom");

  useEffect(() => {
    const dictation = window.electron?.dictation;
    // A drag can land while the snapshot is in flight; the push is newer, so
    // the stale snapshot must not overwrite it.
    let pushed = false;
    const unsubscribe = dictation?.onSide?.((next) => {
      pushed = true;
      setSide(next);
    });
    void dictation?.getSide?.().then((saved) => {
      if (!pushed) setSide(saved);
    });
    return unsubscribe;
  }, []);

  return side;
}

export const DictationSettingsPillPosition: FC = () => {
  const side = useDictationPillSide();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingLabel
          title="Pill position"
          description="Which edge of the screen the floating pill rests on. You can also drag it to another edge."
          id="setting-label-dictation-pill-position"
        />
        <Select
          value={side}
          onValueChange={(next) =>
            window.electron?.dictation?.setPillSide?.(next)
          }
          options={PILL_POSITION_OPTIONS}
          aria-labelledby="setting-label-dictation-pill-position"
        />
      </SettingField>
    </SettingsGroup>
  );
};
