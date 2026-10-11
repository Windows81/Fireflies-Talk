import { HeaderSideContainer } from "@/components/Layout";
import type { StackRouteConfig } from "../types";
import { UploadScreen } from "./UploadScreen";
import { DocumentUploaderButton } from "./components/DocumentUploader";

const UploadRouteConfig: StackRouteConfig<"Upload"> = {
  name: "Upload",
  component: UploadScreen,
  options: {
    headerRight() {
      return (
        <HeaderSideContainer>
          <DocumentUploaderButton />
        </HeaderSideContainer>
      );
    },
  },
};

export default UploadRouteConfig;
