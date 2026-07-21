/**
 * Consent-gated GA4 + Microsoft Clarity snippets for marketing HTML only.
 * Never inject on OAuth authorize pages.
 */

import type { Env } from '../types/env.js';
import { escapeAttr, escapeHtml, type SupportedLanguage } from './html.js';

const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/i;
const CLARITY_ID_PATTERN = /^[a-z0-9]+$/i;
const PRIVACY_POLICY_URL = 'https://zapsign.co/politica-de-privacidade';
const CONSENT_STORAGE_KEY = 'zapsign_mcp_analytics_consent';

type ConsentCopy = {
  message: string;
  accept: string;
  reject: string;
  privacy: string;
};

const CONSENT_COPY: Record<SupportedLanguage, ConsentCopy> = {
  en: {
    message: 'We use analytics and session insights to improve these docs. No tracking on the authorization page.',
    accept: 'Accept',
    reject: 'Reject',
    privacy: 'Privacy Policy',
  },
  'pt-BR': {
    message: 'Usamos analytics e insights de sessão para melhorar esta documentação. Sem rastreamento na página de autorização.',
    accept: 'Aceitar',
    reject: 'Recusar',
    privacy: 'Política de Privacidade',
  },
  es: {
    message: 'Usamos analytics e insights de sesión para mejorar esta documentación. Sin seguimiento en la página de autorización.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    privacy: 'Política de Privacidad',
  },
};

export type MeasurementIds = {
  ga4MeasurementId: string;
  clarityProjectId: string;
};

/**
 * Reads public measurement IDs from Worker env. Invalid or empty values become unset.
 *
 * @param env - Cloudflare Env bindings
 * @returns Normalized IDs (empty strings when unset)
 */
export function readMeasurementIds(env: Pick<Env, 'GA4_MEASUREMENT_ID' | 'CLARITY_PROJECT_ID'>): MeasurementIds {
  return {
    ga4MeasurementId: normalizeGa4Id(env.GA4_MEASUREMENT_ID),
    clarityProjectId: normalizeClarityId(env.CLARITY_PROJECT_ID),
  };
}

/**
 * Renders consent banner + GA4/Clarity bootstrap, or empty string when both IDs are unset.
 *
 * @param ids - Measurement IDs from env
 * @param lang - UI language for consent copy
 * @returns HTML snippet safe to inject before `</body>`
 */
export function renderMeasurementSnippets(ids: MeasurementIds, lang: SupportedLanguage): string {
  if (!ids.ga4MeasurementId && !ids.clarityProjectId) {
    return '';
  }

  const copy = CONSENT_COPY[lang] ?? CONSENT_COPY.en;
  return `${renderConsentBanner(copy)}\n${renderMeasurementBootstrap(ids)}`;
}

function normalizeGa4Id(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || !GA4_ID_PATTERN.test(trimmed)) {
    return '';
  }
  return trimmed.toUpperCase();
}

function normalizeClarityId(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || !CLARITY_ID_PATTERN.test(trimmed)) {
    return '';
  }
  return trimmed.toLowerCase();
}

function renderConsentBanner(copy: ConsentCopy): string {
  const message = escapeHtml(copy.message);
  const accept = escapeHtml(copy.accept);
  const reject = escapeHtml(copy.reject);
  const privacy = escapeHtml(copy.privacy);
  const privacyHref = escapeAttr(PRIVACY_POLICY_URL);

  return `<div id="zs-consent" style="display:none;position:fixed;z-index:9999;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;padding:16px 18px;background:#fff;border:1px solid #D1D1D1;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);font:14px/1.45 system-ui,-apple-system,sans-serif;color:#030712;">
  <p style="margin:0 0 12px;">${message} <a href="${privacyHref}" target="_blank" rel="noopener noreferrer" style="color:#1F5EF4;">${privacy}</a></p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button type="button" id="zs-consent-accept" style="border:0;border-radius:8px;padding:10px 14px;background:#1F5EF4;color:#fff;font-weight:600;cursor:pointer;">${accept}</button>
    <button type="button" id="zs-consent-reject" style="border:1px solid #D1D1D1;border-radius:8px;padding:10px 14px;background:#F7F7F7;color:#030712;font-weight:600;cursor:pointer;">${reject}</button>
  </div>
</div>`;
}

function renderMeasurementBootstrap(ids: MeasurementIds): string {
  const ga4 = JSON.stringify(ids.ga4MeasurementId);
  const clarity = JSON.stringify(ids.clarityProjectId);
  const storageKey = JSON.stringify(CONSENT_STORAGE_KEY);
  return `<script>${buildBootstrapSource(ga4, clarity, storageKey)}</script>`;
}

function buildBootstrapSource(ga4Json: string, clarityJson: string, keyJson: string): string {
  return [
    '(function(){',
    `var GA4_ID=${ga4Json};`,
    `var CLARITY_ID=${clarityJson};`,
    `var KEY=${keyJson};`,
    "var banner=document.getElementById('zs-consent');",
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){window.dataLayer.push(arguments);}',
    'window.gtag=gtag;',
    "gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});",
    'function loadGa4(){',
    "if(!GA4_ID){return;}",
    "gtag('js',new Date());",
    "gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});",
    "gtag('config',GA4_ID,{anonymize_ip:true});",
    "var s=document.createElement('script');s.async=true;",
    "s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA4_ID);",
    'document.head.appendChild(s);',
    '}',
    'function loadClarity(){',
    'if(!CLARITY_ID){return;}',
    '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments);};',
    "t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;",
    'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);',
    "})(window,document,'clarity','script',CLARITY_ID);",
    '}',
    "function loadTags(){loadGa4();loadClarity();}",
    "function setConsent(state){try{localStorage.setItem(KEY,state);}catch(e){}",
    "if(banner){banner.style.display='none';}",
    "if(state==='granted'){loadTags();}}",
    'var stored=null;try{stored=localStorage.getItem(KEY);}catch(e){}',
    "if(stored==='granted'){loadTags();return;}",
    "if(stored==='denied'){return;}",
    "if(banner){banner.style.display='block';}",
    "var accept=document.getElementById('zs-consent-accept');",
    "var reject=document.getElementById('zs-consent-reject');",
    "if(accept){accept.addEventListener('click',function(){setConsent('granted');});}",
    "if(reject){reject.addEventListener('click',function(){setConsent('denied');});}",
    '})();',
  ].join('');
}
