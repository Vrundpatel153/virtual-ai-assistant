// no React import needed
import { useI18n } from "../../lib/i18n";
import { GuestTemplate } from "../Template/GuestTemplate";

export const Landing = (): JSX.Element => {
  useI18n();
  // Dashboard-style landing for guests: render a copy of dashboard UI
  return <GuestTemplate />;
};
