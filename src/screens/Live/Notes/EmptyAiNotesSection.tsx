import { IconNotesGreen } from "@/assets/svg";
import { Placeholder } from "@/components/Placeholder";
import { createStyles } from "@/styles";
import { type FC } from "react";

export const EmptyAiNoteSection: FC = () => {
  return (
    <Placeholder
      style={styles.root}
      icon={<IconNotesGreen width={48} height={48} />}
      title="Fireflies is writing notes"
      description="As the meeting goes on, important points and topics will appear here automatically."
    />
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    marginBottom: 140,
  },
});
