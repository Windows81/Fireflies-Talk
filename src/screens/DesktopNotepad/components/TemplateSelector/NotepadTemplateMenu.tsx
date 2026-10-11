import { IconList } from "@/assets/svg";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { useState } from "react";
import { ScrollView } from "react-native";
import { SUMMARY_LABEL } from "../../constants";
import { TemplateCategoryRow } from "./TemplateCategoryRow";
import { TemplateMenuRow } from "./TemplateMenuRow";
import type { NotepadTemplateCategory } from "./useNotepadTemplates";

interface NotepadTemplateMenuProps {
  categories: NotepadTemplateCategory[];
  isGeneralSelected: boolean;
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
}

export const NotepadTemplateMenu: FC<NotepadTemplateMenuProps> = ({
  categories,
  isGeneralSelected,
  selectedTemplateId,
  onSelect,
}) => {
  // Only one category submenu is open at a time; hovering a row activates it.
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  return (
    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
      <TemplateMenuRow
        label={SUMMARY_LABEL}
        icon={IconList}
        selected={isGeneralSelected}
        onPress={() => onSelect(null)}
        onHoverIn={() => setActiveCategoryId(null)}
      />
      {categories.map((category) => (
        <TemplateCategoryRow
          key={category.id}
          category={category}
          isActive={activeCategoryId === category.id}
          onActivate={() => setActiveCategoryId(category.id)}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={onSelect}
        />
      ))}
    </ScrollView>
  );
};

const styles = createStyles({
  list: {
    maxHeight: 360,
  },
});
