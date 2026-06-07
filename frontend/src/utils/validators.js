export const passwordRules = [
  { required: true, message: 'Password is required' },
  {
    validator(_, value) {
      if (!value) return Promise.resolve();
      const ok = value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/;`~]/.test(value);
      return ok ? Promise.resolve() : Promise.reject(new Error('Use 8+ chars with uppercase, lowercase, number and special character.'));
    }
  }
];
export const emailRules = [{ type: 'email', message: 'Enter a valid email' }, { required: true, message: 'Email is required' }];
