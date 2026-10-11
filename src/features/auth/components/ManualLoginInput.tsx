import type { FC } from "react";
import { ManualLoginTextInput } from "./ManualLoginTextInput";
import { useManualLogin, type ManualLoginProps } from "./useManualLogin";

/** Single always-visible field, submitted with Enter. */
export const ManualLoginInput: FC<
  ManualLoginProps & { placeholder?: string }
> = ({ onLogin, placeholder = "Enter the authentication URL" }) => {
  const login = useManualLogin({ onLogin });
  return <ManualLoginTextInput login={login} placeholder={placeholder} />;
};
