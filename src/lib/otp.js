// Extracts an OTP code from a message, or null. Only returns a match when the text also
// reads like an OTP message (avoids grabbing amounts / reference numbers).
export function extractOtp(text) {
  if (!text) return null;
  const match = text.match(/\b\d{4,8}\b/);
  if (!match) return null;
  const keywords = [
    "otp",
    "one-time password",
    "one time password",
    "verification code",
    "verification",
    "passcode",
    "password",
    "code is",
    "security code",
  ];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k)) ? match[0] : null;
}
