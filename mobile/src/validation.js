export function validateName(value) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 80) {
    return 'Enter a name between 2 and 80 characters.';
  }
  return '';
}

export function validateEmail(value) {
  if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Enter a valid email address.';
  }
  return '';
}

export function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128 ||
      !/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Use at least 8 characters, including a letter and a number.';
  }
  return '';
}

export function validateRegistration(values) {
  return {
    fullName: validateName(values.fullName),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
