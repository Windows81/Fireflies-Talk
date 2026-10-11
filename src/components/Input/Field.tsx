import { useId, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../Typography";
import { Select, type SelectProps } from "./Select";
import type { TagInputProps } from "./TagInput";
import { TagInput } from "./TagInput";
import type { InputProps } from "./TextInput";
import { TextInput } from "./TextInput";

interface FieldProps {
  label: string;
  description?: string;
}

export const FieldLabel: FC<FieldProps & { labelId: string }> = ({
  label,
  description,
  labelId,
}) => {
  return (
    <View style={styles.row}>
      <Text variant="label2Weight" id={labelId}>
        {label}
      </Text>
      {description && (
        <Text variant="body2Regular" color="textMuted">
          {description}
        </Text>
      )}
    </View>
  );
};

export const TextField: FC<InputProps & FieldProps> = ({
  label,
  description,
  ...props
}) => {
  const labelId = useId();
  return (
    <View style={styles.root}>
      <FieldLabel label={label} description={description} labelId={labelId} />
      <TextInput aria-labelledby={labelId} {...props} />
    </View>
  );
};

export function SelectField<TValue>({
  label,
  description,
  ...props
}: SelectProps<TValue> & FieldProps) {
  const labelId = useId();
  return (
    <View style={styles.root}>
      <FieldLabel label={label} description={description} labelId={labelId} />
      <Select aria-labelledby={labelId} {...props} />
    </View>
  );
}

export const TagInputField: FC<TagInputProps & FieldProps> = ({
  label,
  description,
  ...props
}) => {
  const labelId = useId();
  return (
    <View style={styles.root}>
      <FieldLabel label={label} description={description} labelId={labelId} />
      <TagInput aria-labelledby={labelId} {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  row: {
    gap: 4,
  },
});
