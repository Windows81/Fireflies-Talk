import mitt from "mitt";

export type RecordEventMaps = {
  expandFloatingCard: void;
  focusTitle: void;
};

export const recordEventEmitter = mitt<RecordEventMaps>();
