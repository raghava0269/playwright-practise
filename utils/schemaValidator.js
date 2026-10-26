import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// allErrors: report every mismatch, not just the first one.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv); // adds "email", "uri", "date-time", ... formats

/**
 * SCHEMA VALIDATION with AJV.
 * @returns {{ valid: boolean, errors: string }}
 */
export function validateSchema(schema, data) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: ajv.errorsText(validate.errors) };
}
