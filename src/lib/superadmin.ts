export const SUPER_ADMIN_EMAILS = [
  'marquisogre@gmail.com',
  'prakashgroup555@gmail.com',
  'adarshbharadwaj1234@gmail.com',
];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
}
