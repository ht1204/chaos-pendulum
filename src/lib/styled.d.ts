import "styled-components";
import type { ThemeMode, ThemeTokens } from "./theme";

declare module "styled-components" {
  export interface DefaultTheme extends ThemeTokens {
    mode: ThemeMode;
    fontSans: string;
    fontMono: string;
  }
}
