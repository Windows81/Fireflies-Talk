import { NativeModule } from "expo";
import type {
  ShareTargetModule,
  ShareTargetModuleEvents,
} from "./ShareTarget.types";

export class ShareTargetModuleWeb
  extends NativeModule<ShareTargetModuleEvents>
  implements ShareTargetModule
{
  async getInitialShare() {
    return null;
  }
  async cleanup() {
    return;
  }
}

export default new ShareTargetModuleWeb();
