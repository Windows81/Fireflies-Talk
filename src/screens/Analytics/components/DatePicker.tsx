import { IconCalendar } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DateInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { useBooleanState } from "@/utils/states";
import { endOfDay, format } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const maxDate = endOfDay(new Date());

const DatePickerModalContent: FC<{
  currentDateRange: [Date, Date];
  setDateRange: (dateRange: [Date, Date]) => void;
  close: () => void;
}> = ({ currentDateRange, setDateRange: setFinalDateRange, close }) => {
  const [dateRange, setDateRange] = useState(currentDateRange);

  const onSave = () => {
    setFinalDateRange(dateRange);
    close();
  };

  return (
    <View style={styles.datePicker}>
      <View style={styles.datePickerDates}>
        <View style={styles.dateCol}>
          <Text color="textHint" id="date-picker-from">
            From
          </Text>
          <DateInput
            value={dateRange[0]}
            onChangeValue={(date) => setDateRange([date, dateRange[1]])}
            max={dateRange[1]}
            style={styles.date}
            aria-labelledby="date-picker-from"
          />
        </View>
        <View style={styles.dateCol}>
          <Text color="textHint" id="date-picker-to">
            To
          </Text>
          <DateInput
            value={dateRange[1]}
            onChangeValue={(date) => setDateRange([dateRange[0], date])}
            min={dateRange[0]}
            max={maxDate}
            style={styles.date}
            aria-labelledby="date-picker-to"
          />
        </View>
      </View>
      <Button onPress={onSave}>Save</Button>
    </View>
  );
};

export const DatePickerButton: FC<{
  dateRange: [Date, Date];
  setDateRange: (dateRange: [Date, Date]) => void;
}> = ({ dateRange, setDateRange }) => {
  const [isOpen, open, close] = useBooleanState();

  return (
    <>
      <Button onPress={open} Icon={IconCalendar} variant="outlined">
        {format(dateRange[0], "dd MMM, yyyy")} -{" "}
        {format(dateRange[1], "dd MMM, yyyy")}
      </Button>
      <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
        <DatePickerModalContent
          currentDateRange={dateRange}
          setDateRange={setDateRange}
          close={close}
        />
      </Dialog.Root>
    </>
  );
};

const styles = StyleSheet.create({
  datePicker: {
    flexDirection: "column",
    gap: 8,
    padding: 24,
  },
  datePickerDates: {
    padding: 8,
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    width: 128,
  },
  dateCol: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
});
