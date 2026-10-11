import type { PartComponentsMap } from "@firefliesai/fred-react";
import { ContextSummarizedPart } from "../components/parts/ContextSummarizedPart";
import { HitlPart } from "../components/parts/hitl/HitlPart";
import { ReasoningPart } from "../components/parts/ReasoningPart";
import { SubagentPart } from "../components/parts/SubagentPart";
import { TextPart } from "../components/parts/TextPart";
import { TodoUpdatePart } from "../components/parts/TodoUpdatePart";
import { ToolCallUiPart } from "../components/parts/ToolCallUiPart";

export const askFredOPartComponents: PartComponentsMap = {
  text: TextPart,
  reasoning: ReasoningPart,
  "tool-call-ui": ToolCallUiPart,
  "todo-update": TodoUpdatePart,
  subagent: SubagentPart,
  "context-summarized": ContextSummarizedPart,
  hitl: HitlPart,
};
