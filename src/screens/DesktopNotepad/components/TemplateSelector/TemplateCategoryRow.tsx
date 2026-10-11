import { MenuPopover } from "@/components/Menu";
import type { FC } from "react";
import { useRef } from "react";
import type { View } from "react-native";
import { getCategoryIcon } from "./categoryIcons";
import { TemplateMenuRow } from "./TemplateMenuRow";
import type { NotepadTemplateCategory } from "./useNotepadTemplates";

interface TemplateCategoryRowProps {
  category: NotepadTemplateCategory;
  isActive: boolean;
  onActivate: () => void;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateCategoryRow: FC<TemplateCategoryRowProps> = ({
  category,
  isActive,
  onActivate,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const rowRef = useRef<View>(null);
  const hasTemplates = category.templates.length > 0;

  return (
    <>
      <TemplateMenuRow
        rowRef={rowRef}
        label={category.name}
        icon={getCategoryIcon(category.name)}
        hasSubmenu={hasTemplates}
        active={isActive}
        onHoverIn={onActivate}
        onPress={onActivate}
      />

      {hasTemplates && (
        <MenuPopover
          isOpen={isActive}
          close={onActivate}
          triggerRef={rowRef}
          placement="right"
          width={200}
          disableBackdrop
        >
          {category.templates.map((template) => (
            <TemplateMenuRow
              key={template.id}
              label={template.title}
              selected={template.id === selectedTemplateId}
              onPress={() => onSelectTemplate(template.id)}
            />
          ))}
        </MenuPopover>
      )}
    </>
  );
};
