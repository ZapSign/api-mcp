import { describe, expect, it } from 'vitest';
import readme from '../../../README.md?raw';

describe('README template conversation example', () => {
  it('should use exact braced strings returned by get_template inputs', () => {
    expect(readme).toContain('`inputs[].variable`: `{{name}}`, `{{address}}`, `{{start_date}}`');
    expect(readme).toContain('those exact braced keys as `data` keys');
  });
});
