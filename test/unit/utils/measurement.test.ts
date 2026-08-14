import { describe, expect, it } from 'vitest';
import { CspProfile, withSecurityHeaders } from '../../../src/utils/html.js';
import {
  readMeasurementIds,
  renderMeasurementSnippets,
} from '../../../src/utils/measurement.js';

describe('readMeasurementIds', () => {
  it('returns empty strings when env values are unset', () => {
    expect(readMeasurementIds({
      GA4_MEASUREMENT_ID: '',
      CLARITY_PROJECT_ID: '',
    })).toEqual({
      ga4MeasurementId: '',
      clarityProjectId: '',
    });
  });

  it('normalizes valid IDs and rejects invalid values', () => {
    expect(readMeasurementIds({
      GA4_MEASUREMENT_ID: ' g-abc123 ',
      CLARITY_PROJECT_ID: ' Ab12Cd ',
    })).toEqual({
      ga4MeasurementId: 'G-ABC123',
      clarityProjectId: 'ab12cd',
    });

    expect(readMeasurementIds({
      GA4_MEASUREMENT_ID: 'not-a-ga4-id',
      CLARITY_PROJECT_ID: 'bad id!',
    })).toEqual({
      ga4MeasurementId: '',
      clarityProjectId: '',
    });
  });
});

describe('renderMeasurementSnippets', () => {
  it('returns empty string when both IDs are unset', () => {
    expect(renderMeasurementSnippets({
      ga4MeasurementId: '',
      clarityProjectId: '',
    }, 'en')).toBe('');
  });

  it('emits consent banner and bootstrap when an ID is set', () => {
    const html = renderMeasurementSnippets({
      ga4MeasurementId: 'G-TEST123',
      clarityProjectId: 'clarity99',
    }, 'en');

    expect(html).toContain('id="zs-consent"');
    expect(html).toContain('<script>');
    expect(html).toContain('G-TEST123');
    expect(html).toContain('clarity99');
    expect(html).toContain('analytics_storage');
    expect(html).toContain('https://mcp.zapsign.com.br/privacy');
  });
});

describe('CSP profiles', () => {
  it('keeps script-src none on auth pages', () => {
    const response = withSecurityHeaders(new Response('ok'), CspProfile.Auth);
    const csp = response.headers.get('Content-Security-Policy') ?? '';

    expect(csp).toContain("script-src 'none'");
    expect(csp).not.toContain('googletagmanager.com');
  });

  it('allows GA4 and Clarity on marketing pages', () => {
    const response = withSecurityHeaders(new Response('ok'), CspProfile.Marketing);
    const csp = response.headers.get('Content-Security-Policy') ?? '';

    expect(csp).toContain('googletagmanager.com');
    expect(csp).toContain('clarity.ms');
    expect(csp).toContain("script-src 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'none'");
  });
});
