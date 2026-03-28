// Centralized config — single source of truth
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production!');
    }
    return 'dev-secret-DO-NOT-USE-IN-PROD';
  })(),
  JWT_EXPIRES_IN: '7d',

  // Allowed email domains for registration
  EMAIL_DOMAINS: [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'protonmail.com', 'icloud.com', 'mail.com', 'aol.com',
    'zoho.com', 'yandex.com',
  ],

  // Build regex from domain list (also allows edu.* and ac.*)
  get EMAIL_REGEX() {
    const escaped = this.EMAIL_DOMAINS.map(d => d.replace('.', '\\.'));
    return new RegExp(`^[a-zA-Z0-9._%+-]+@(${escaped.join('|')}|edu\\..+|ac\\..+)$`, 'i');
  },

  PASSWORD_RULES_DESCRIPTION: [
    'At least 8 characters',
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one digit',
    'At least one special character',
  ],

  // Cookie settings for httpOnly JWT storage
  COOKIE_OPTIONS: {
    httpOnly: true,                                         // JS cannot read this cookie
    secure: process.env.NODE_ENV === 'production',          // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days (matches JWT_EXPIRES_IN)
    path: '/',
  },
};
