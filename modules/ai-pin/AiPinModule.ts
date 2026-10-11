import { requireOptionalNativeModule } from "expo-modules-core";
import type { AiPinModule } from "./types";

export default requireOptionalNativeModule<AiPinModule>("AiPin");
