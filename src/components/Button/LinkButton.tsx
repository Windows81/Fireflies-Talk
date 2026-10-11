import { useTheme } from "@/styles";
import { useState, type FC, type PropsWithChildren } from "react";
import type { Href } from "../Link";
import { LinkView } from "../Link";
import { Text } from "../Typography";
import { getStyles } from "./styles";
import type { ButtonProps } from "./types";

export const LinkButton: FC<
  PropsWithChildren<Omit<ButtonProps, "disabled">> & {
    href: Href;
  }
> = ({ href, ...props }) => {
  const [pressed, setPressed] = useState(false);
  const { children, Icon, ...restProps } = props;

  const isStringChildren = Array.isArray(children)
    ? !children.some((child) => typeof child === "object")
    : typeof children !== "object";

  const theme = useTheme();

  const { pressableStyle, textColor, textVariant, iconOnly, iconSize } =
    getStyles(theme, props);

  return (
    <LinkView
      {...restProps}
      href={href}
      style={pressableStyle({ pressed })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {Icon && (
        <Icon
          width={iconSize}
          height={iconSize}
          color={theme.colors[textColor]}
          strokeWidth={1.5}
        />
      )}
      {isStringChildren && !iconOnly ? (
        <Text color={textColor} variant={textVariant}>
          {children}
        </Text>
      ) : (
        children
      )}
    </LinkView>
  );
};
