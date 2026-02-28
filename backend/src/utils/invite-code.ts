const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
const LENGTH = 6;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}
