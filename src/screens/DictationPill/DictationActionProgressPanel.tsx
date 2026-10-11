import { IconFred } from "@/assets/svg";
import type { Theme } from "@/styles";
import { useState, type FC } from "react";
import { Text, View } from "react-native";
import {
  actionJobHistory,
  actionJobLinks,
  actionJobResultText,
  actionJobStatusLine,
  type ActionJob,
} from "./dictationActionJob";
import {
  ACTION_PANEL_ICON_SIZE,
  panelStyles,
} from "./dictationActionPanelStyles";
import { DictationActionGlow } from "./DictationActionGlow";
import { DictationActionLinkRow } from "./DictationActionLinkRow";
import { DictationActionResult } from "./DictationActionResult";
import { DictationActionSteps } from "./DictationActionSteps";
import { useNativeTitle } from "./useNativeTitle";

/**
 * The run's own window-in-miniature, shown while the pointer is on its orb.
 *
 * This composes the parts and owns none of them: while it works the panel is
 * one line of status, and it only grows once there is something to take away.
 *
 * There is no status badge and no close button here — the orb already carries
 * both, and repeating them made a panel out of what is mostly one sentence.
 */
export const DictationActionProgressPanel: FC<{
  job: ActionJob;
  theme: Theme;
  onCopy: (job: ActionJob) => void;
  /** Resolves false when the text did not reach the focused input. */
  onPaste: (job: ActionJob) => Promise<boolean>;
  onOpenLink: (url: string) => void;
}> = ({ job, theme, onCopy, onPaste, onOpenLink }) => {
  const [showHistory, setShowHistory] = useState(false);
  const result = actionJobResultText(job);
  const links = actionJobLinks(job);
  const titleRef = useNativeTitle(job.command || job.title);

  return (
    <View
      style={[panelStyles.panel(theme), result && panelStyles.panelWithResult]}
    >
      <DictationActionGlow style={panelStyles.panelGlow} />

      <View style={panelStyles.panelHeader}>
        <IconFred
          width={ACTION_PANEL_ICON_SIZE}
          height={ACTION_PANEL_ICON_SIZE}
        />
        <Text ref={titleRef} style={panelStyles.panelTitle} numberOfLines={1}>
          {job.title}
        </Text>
      </View>

      <DictationActionSteps
        status={actionJobStatusLine(job)}
        history={actionJobHistory(job)}
        expanded={showHistory}
        onToggle={() => setShowHistory((shown) => !shown)}
        theme={theme}
      />

      {job.pasteFailed ? (
        <Text style={panelStyles.panelNotice}>
          Couldn&apos;t paste this into your last input — copy it instead.
        </Text>
      ) : null}

      {result ? (
        <DictationActionResult
          result={result}
          theme={theme}
          onCopy={() => onCopy(job)}
          onPaste={() => onPaste(job)}
        />
      ) : null}

      {links.length ? (
        <DictationActionLinkRow
          links={links}
          theme={theme}
          onOpen={onOpenLink}
        />
      ) : null}

      {job.credits !== undefined ? (
        <Text style={panelStyles.panelCredits}>
          {job.credits} {job.credits === 1 ? "credit" : "credits"}
        </Text>
      ) : null}
    </View>
  );
};
