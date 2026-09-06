export function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for non-browser environments if any (shouldn't be needed in client side, but just in case)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * charset.length);
    }
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure it meets requirements: upper, lower, digit, symbol
  if (!validatePassword(password).isValid) {
    return generateSecurePassword(length);
  }
  
  return password;
}

const OBVIOUS_PATTERNS: RegExp[] = [
  /^(.)\1+$/, /^(?:012|123|234|345|456|567|678|789|890)+/,
  /password/i, /qwerty/i, /^yalla\d*!?$/i,
];

export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one digit.' };
  }
  
  if (OBVIOUS_PATTERNS.some(re => re.test(password))) {
    return { isValid: false, message: 'Password is too predictable.' };
  }

  return { isValid: true, message: 'Valid password.' };
}
