/** Result of a settings action; success of sign-out / delete redirects instead. */
export type SettingsActionResult = { ok: true } | { ok: false };

export type SettingsAction = () => Promise<SettingsActionResult>;

export interface SettingsActions {
  signOut: SettingsAction;
  deleteAccount: SettingsAction;
  resetDemo: SettingsAction;
}
