import { toast } from "@/components/Toast";
import { useState } from "react";
import { resolveManualLoginTokens } from "../manualLogin";
import { authApi } from "../store";

export type ManualLoginProps = {
  onLogin: () => void;
};

/**
 * Non-production helper: logs in with a pasted access token or a full auth
 * callback URL. Shared by the mobile/web and desktop login screens.
 */
export function useManualLogin({ onLogin }: ManualLoginProps) {
  const [value, setValue] = useState("");

  async function submit() {
    const candidate = value.trim();
    if (!candidate) return;
    try {
      await authApi.doLogin(resolveManualLoginTokens(candidate));
      onLogin();
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { value, setValue, submit, canSubmit: value.trim().length > 0 };
}

export type ManualLoginState = ReturnType<typeof useManualLogin>;
