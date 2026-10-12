import { z } from 'zod';

/**
 * Plain-language validation messages, in place of zod's defaults ("String must contain at least
 * 1 character(s)", "Number must be greater than or equal to 1950") that the admin forms showed
 * verbatim. A message written on a schema (`.min(1, 'A name is required')`) still wins; this only
 * replaces the generic fallback.
 */
const friendly: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      return {
        message:
          issue.received === 'undefined' || issue.received === 'null'
            ? 'This field is required'
            : `Expected ${issue.expected}`,
      };
    case 'too_small':
      if (issue.type === 'string') {
        return {
          message:
            Number(issue.minimum) <= 1
              ? 'This field is required'
              : `Must be at least ${issue.minimum} characters`,
        };
      }
      if (issue.type === 'number') {
        return {
          message: `Must be ${issue.inclusive ? 'at least' : 'more than'} ${issue.minimum}`,
        };
      }
      if (issue.type === 'array') return { message: `Add at least ${issue.minimum}` };
      break;
    case 'too_big':
      if (issue.type === 'string')
        return { message: `Must be at most ${issue.maximum} characters` };
      if (issue.type === 'number') {
        return { message: `Must be ${issue.inclusive ? 'at most' : 'less than'} ${issue.maximum}` };
      }
      if (issue.type === 'array') return { message: `At most ${issue.maximum} allowed` };
      break;
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'Enter a valid email address' };
      if (issue.validation === 'url')
        return { message: 'Enter a full link starting with https://' };
      break;
    case 'invalid_enum_value':
      return { message: 'Choose one of the listed options' };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(friendly);
