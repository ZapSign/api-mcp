/**
 * Documentation page for ZapSign MCP Server.
 * Public page at GET /docs for Anthropic MCP Connectors Directory submission.
 */

import type { SupportedLanguage } from '../utils/html.js';
import { COLORS, ZAPSIGN_ICON_SVG, escapeAttr, escapeHtml } from '../utils/html.js';

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    title: 'ZapSign MCP Server',
    subtitle: 'Create, send, and track e-signatures in Claude.',
    whatIsTitle: 'What is this',
    whatIsBody:
      'Bring ZapSign’s e-signature workflow into Claude. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, and track document status—all in one conversation.',
    prereqTitle: 'Prerequisites',
    prereq1: 'A ZapSign account with an API plan',
    prereq2: 'Your own ZapSign API Token, entered during authorization',
    howToTitle: 'How to Connect',
    step1: 'Open your AI client settings and find MCP or Connectors',
    step2: 'Click "Add Connector"',
    step3: 'Enter the connector URL: https://mcp.zapsign.com.br/mcp',
    step4: 'Claude starts OAuth; on the ZapSign authorization page, enter your own API Token. Never add it to the URL.',
    step5: 'Approve the requested access and complete the connection',
    toolsTitle: 'Available Tools',
    domainDocuments: 'Documents',
    domainSigners: 'Signers',
    domainTemplates: 'Templates',
    domainWebhooks: 'Webhooks',
    domainPartner: 'Partner',
    list_documents: 'List documents with filters',
    get_document: 'Get document details by token',
    create_document: 'Create document from PDF/DOCX (optional async)',
    update_document: 'Update document metadata',
    delete_document: 'Delete a document (destructive)',
    place_signatures: 'Place signature fields on a document',
    add_extra_document: 'Add an extra PDF to a document',
    add_extra_document_from_template: 'Add an extra document from a template',
    add_timestamp: 'Timestamp a document URL',
    reorder_envelope_documents: 'Reorder documents in an envelope',
    add_signer: 'Add signer and optionally send the link by email or WhatsApp',
    get_signer: 'Get signer details',
    update_signer: 'Update signer contact info',
    delete_signer: 'Remove signer from document',
    sign_in_batch: 'Sign multiple documents in one batch',
    list_templates: 'List templates',
    get_template: 'Get template with dynamic fields',
    create_from_template: 'Create document from template (optional async)',
    create_webhook: 'Create a company webhook',
    delete_webhook: 'Delete a webhook (destructive)',
    create_webhook_header: 'Add headers to a webhook',
    delete_webhook_header: 'Delete a webhook header (destructive)',
    reprocess_documents_webhooks: 'Reprocess document webhook deliveries',
    create_partner_account: 'Create a partner account',
    update_partner_payment_status: 'Update partner payment status',
    examplesTitle: 'Usage Examples',
    ex1: 'List my ZapSign documents',
    ex2: 'Create a document from this PDF URL with signers Maria and João',
    ex3: 'What templates do I have available?',
    apiRefTitle: 'ZapSign API Reference',
    apiRefBody:
      "The MCP tools map directly to ZapSign's REST API. For detailed parameter documentation, rate limits, and advanced features, visit the official API docs.",
    apiRefLink: 'Visit API Documentation',
    troubleshootTitle: 'Troubleshooting',
    t1q: 'Invalid API Token',
    t1a: 'Check your token in ZapSign Dashboard > Settings > Integrations',
    t2q: 'Permission denied',
    t2a: 'Verify your account has API access and the required permissions',
    t3q: 'Rate limit exceeded',
    t3a: 'ZapSign allows 500 requests/minute. Wait and retry.',
    t4q: 'Connection failed',
    t4a: 'Verify the connector URL is exactly https://mcp.zapsign.com.br/mcp',
    footerColResources: 'Resources',
    footerColLegal: 'Legal',
    footerColTrust: 'Security',
    footerApi: 'API Documentation',
    footerHelp: 'Help Center',
    footerPlans: 'Plans & Pricing',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerDataRequest: 'Data Privacy Request',
    footerTrust: 'Trust Center (ISO 27001)',
    footerSupport: 'Contact Support',
    footerContactLabel: 'Need help?',
    footerLegal: 'Documents signed via ZapSign are legally binding under Medida Provisória 2.200-2/2001.',
  },
  'pt-BR': {
    title: 'ZapSign MCP Server',
    subtitle: 'Crie, envie e acompanhe assinaturas eletrônicas no Claude.',
    whatIsTitle: 'O que é isso',
    whatIsBody:
      'Leve o fluxo de assinaturas eletrônicas do ZapSign para o Claude. Crie solicitações de assinatura a partir de uma URL de PDF ou modelo reutilizável, adicione signatários, envie links por e-mail ou WhatsApp e acompanhe o status do documento em uma só conversa.',
    prereqTitle: 'Pré-requisitos',
    prereq1: 'Uma conta ZapSign com plano de API',
    prereq2: 'Seu próprio Token API do ZapSign, informado durante a autorização',
    howToTitle: 'Como conectar',
    step1: 'Abra as configurações do seu cliente de IA e encontre MCP ou Conectores',
    step2: 'Clique em "Adicionar conector"',
    step3: 'Digite a URL do conector: https://mcp.zapsign.com.br/mcp',
    step4: 'O Claude inicia o OAuth; na página de autorização do ZapSign, informe seu próprio Token API. Nunca o adicione à URL.',
    step5: 'Aprove o acesso solicitado e conclua a conexão',
    toolsTitle: 'Ferramentas disponíveis',
    domainDocuments: 'Documentos',
    domainSigners: 'Signatários',
    domainTemplates: 'Modelos',
    domainWebhooks: 'Webhooks',
    domainPartner: 'Parceiros',
    list_documents: 'Listar documentos com filtros',
    get_document: 'Obter detalhes do documento por token',
    create_document: 'Criar documento a partir de PDF/DOCX (async opcional)',
    update_document: 'Atualizar metadados do documento',
    delete_document: 'Excluir documento (ação destrutiva)',
    place_signatures: 'Posicionar campos de assinatura no documento',
    add_extra_document: 'Adicionar PDF extra ao documento',
    add_extra_document_from_template: 'Adicionar documento extra a partir de modelo',
    add_timestamp: 'Carimbar temporalmente uma URL de documento',
    reorder_envelope_documents: 'Reordenar documentos em um envelope',
    add_signer: 'Adicionar signatário e enviar o link por e-mail ou WhatsApp, opcionalmente',
    get_signer: 'Obter detalhes do signatário',
    update_signer: 'Atualizar informações de contato do signatário',
    delete_signer: 'Remover signatário do documento',
    sign_in_batch: 'Assinar vários documentos em lote',
    list_templates: 'Listar modelos',
    get_template: 'Obter modelo com campos dinâmicos',
    create_from_template: 'Criar documento a partir de modelo (async opcional)',
    create_webhook: 'Criar webhook da empresa',
    delete_webhook: 'Excluir webhook (ação destrutiva)',
    create_webhook_header: 'Adicionar headers a um webhook',
    delete_webhook_header: 'Excluir header de webhook (ação destrutiva)',
    reprocess_documents_webhooks: 'Reprocessar entregas de webhook de documento',
    create_partner_account: 'Criar conta de parceiro',
    update_partner_payment_status: 'Atualizar status de pagamento do parceiro',
    examplesTitle: 'Exemplos de uso',
    ex1: 'Liste meus documentos do ZapSign',
    ex2: 'Crie um documento a partir desta URL de PDF com signatários Maria e João',
    ex3: 'Quais modelos tenho disponíveis?',
    apiRefTitle: 'Referência da API ZapSign',
    apiRefBody:
      'As ferramentas MCP mapeiam diretamente para a API REST do ZapSign. Para documentação detalhada de parâmetros, limites de taxa e recursos avançados, visite a documentação oficial da API.',
    apiRefLink: 'Visitar documentação da API',
    troubleshootTitle: 'Solução de problemas',
    t1q: 'Token API inválido',
    t1a: 'Verifique seu token em ZapSign Dashboard > Configurações > Integrações',
    t2q: 'Permissão negada',
    t2a: 'Verifique se sua conta tem acesso à API e as permissões necessárias',
    t3q: 'Limite de taxa excedido',
    t3a: 'O ZapSign permite 500 requisições/minuto. Aguarde e tente novamente.',
    t4q: 'Falha na conexão',
    t4a: 'Verifique se a URL do conector é exatamente https://mcp.zapsign.com.br/mcp',
    footerColResources: 'Recursos',
    footerColLegal: 'Legal',
    footerColTrust: 'Segurança',
    footerApi: 'Documentação da API',
    footerHelp: 'Central de Ajuda',
    footerPlans: 'Planos e Preços',
    footerPrivacy: 'Política de Privacidade',
    footerTerms: 'Termos de Uso',
    footerDataRequest: 'Proteção de Dados Pessoais',
    footerTrust: 'Trust Center (ISO 27001)',
    footerSupport: 'Falar com Suporte',
    footerContactLabel: 'Precisa de ajuda?',
    footerLegal: 'Documentos assinados via ZapSign têm validade jurídica conforme Medida Provisória 2.200-2/2001.',
  },
  es: {
    title: 'ZapSign MCP Server',
    subtitle: 'Crea, envía y rastrea firmas electrónicas en Claude.',
    whatIsTitle: 'Qué es esto',
    whatIsBody:
      'Lleva el flujo de firma electrónica de ZapSign a Claude. Crea solicitudes de firma desde una URL de PDF o una plantilla reutilizable, añade firmantes, entrega enlaces por correo electrónico o WhatsApp y sigue el estado del documento en una sola conversación.',
    prereqTitle: 'Requisitos previos',
    prereq1: 'Una cuenta ZapSign con plan de API',
    prereq2: 'Tu propio Token API de ZapSign, introducido durante la autorización',
    howToTitle: 'Cómo conectar',
    step1: 'Abre la configuración de tu cliente de IA y busca MCP o Conectores',
    step2: 'Haz clic en "Añadir conector"',
    step3: 'Introduce la URL del conector: https://mcp.zapsign.com.br/mcp',
    step4: 'Claude inicia OAuth; en la página de autorización de ZapSign, introduce tu propio Token API. Nunca lo añadas a la URL.',
    step5: 'Aprueba el acceso solicitado y completa la conexión',
    toolsTitle: 'Herramientas disponibles',
    domainDocuments: 'Documentos',
    domainSigners: 'Firmantes',
    domainTemplates: 'Plantillas',
    domainWebhooks: 'Webhooks',
    domainPartner: 'Partners',
    list_documents: 'Listar documentos con filtros',
    get_document: 'Obtener detalles del documento por token',
    create_document: 'Crear documento desde PDF/DOCX (async opcional)',
    update_document: 'Actualizar metadatos del documento',
    delete_document: 'Eliminar documento (acción destructiva)',
    place_signatures: 'Colocar campos de firma en un documento',
    add_extra_document: 'Añadir un PDF extra a un documento',
    add_extra_document_from_template: 'Añadir documento extra desde plantilla',
    add_timestamp: 'Añadir sello de tiempo a una URL de documento',
    reorder_envelope_documents: 'Reordenar documentos en un envelope',
    add_signer: 'Añadir firmante y enviar el enlace por correo o WhatsApp opcionalmente',
    get_signer: 'Obtener detalles del firmante',
    update_signer: 'Actualizar información de contacto del firmante',
    delete_signer: 'Eliminar firmante del documento',
    sign_in_batch: 'Firmar varios documentos en lote',
    list_templates: 'Listar plantillas',
    get_template: 'Obtener plantilla con campos dinámicos',
    create_from_template: 'Crear documento desde plantilla (async opcional)',
    create_webhook: 'Crear webhook de la empresa',
    delete_webhook: 'Eliminar webhook (acción destructiva)',
    create_webhook_header: 'Añadir headers a un webhook',
    delete_webhook_header: 'Eliminar header de webhook (acción destructiva)',
    reprocess_documents_webhooks: 'Reprocesar entregas de webhook de documento',
    create_partner_account: 'Crear cuenta de partner',
    update_partner_payment_status: 'Actualizar estado de pago del partner',
    examplesTitle: 'Ejemplos de uso',
    ex1: 'Lista mis documentos de ZapSign',
    ex2: 'Crea un documento desde esta URL de PDF con firmantes María y João',
    ex3: '¿Qué plantillas tengo disponibles?',
    apiRefTitle: 'Referencia de la API ZapSign',
    apiRefBody:
      'Las herramientas MCP se mapean directamente a la API REST de ZapSign. Para documentación detallada de parámetros, límites de tasa y funciones avanzadas, visita la documentación oficial de la API.',
    apiRefLink: 'Visitar documentación de la API',
    troubleshootTitle: 'Solución de problemas',
    t1q: 'Token API inválido',
    t1a: 'Verifica tu token en ZapSign Dashboard > Configuración > Integraciones',
    t2q: 'Permiso denegado',
    t2a: 'Verifica que tu cuenta tenga acceso a la API y los permisos necesarios',
    t3q: 'Límite de tasa excedido',
    t3a: 'ZapSign permite 500 solicitudes/minuto. Espera e inténtalo de nuevo.',
    t4q: 'Error de conexión',
    t4a: 'Verifica que la URL del conector sea exactamente https://mcp.zapsign.com.br/mcp',
    footerColResources: 'Recursos',
    footerColLegal: 'Legal',
    footerColTrust: 'Seguridad',
    footerApi: 'Documentación de la API',
    footerHelp: 'Centro de Ayuda',
    footerPlans: 'Planes y Precios',
    footerPrivacy: 'Política de Privacidad',
    footerTerms: 'Términos y Condiciones',
    footerDataRequest: 'Protección de Datos Personales',
    footerTrust: 'Trust Center (ISO 27001)',
    footerSupport: 'Contactar Soporte',
    footerContactLabel: '¿Necesitas ayuda?',
    footerLegal: 'Los documentos firmados vía ZapSign tienen validez legal según Medida Provisória 2.200-2/2001.',
  },
};

const URLS = {
  plans: 'https://zapsign.co/plans-and-prices',
  integrations: 'https://app.zapsign.co/conta/configuracoes/integration?tab=api-zapsign',
  apiDocs: 'https://docs.zapsign.com.br/',
  support: 'mailto:support@zapsign.com.br',
  helpCenter: 'https://clients.zapsign.com.br/en/help',
  trustCenter: 'https://app.vanta.com/zapsign.com.br/trust/2r7pzu657cx76es2ji28l',
  privacy: 'https://zapsign.co/politica-de-privacidade',
  terms: 'https://zapsign.co/termos-de-uso',
  dataRequest: 'https://cl3jb.share.hsforms.com/2C5HgRQBzTQySthuwNJ0zAQ',
} as const;

type ToolEntry = [string, string];

type EscapedUrls = { [Key in keyof typeof URLS]: string };

function escapeTranslations(translations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(translations).map(([key, value]) => [key, escapeHtml(value)]),
  );
}

function escapeUrls(urls: typeof URLS): EscapedUrls {
  return {
    plans: escapeAttr(urls.plans),
    integrations: escapeAttr(urls.integrations),
    apiDocs: escapeAttr(urls.apiDocs),
    support: escapeAttr(urls.support),
    helpCenter: escapeAttr(urls.helpCenter),
    trustCenter: escapeAttr(urls.trustCenter),
    privacy: escapeAttr(urls.privacy),
    terms: escapeAttr(urls.terms),
    dataRequest: escapeAttr(urls.dataRequest),
  };
}

function buildToolsTable(t: Record<string, string>): string {
  const docTools: ToolEntry[] = [
    ['list_documents', t['list_documents']],
    ['get_document', t['get_document']],
    ['create_document', t['create_document']],
    ['update_document', t['update_document']],
    ['delete_document', t['delete_document']],
    ['place_signatures', t['place_signatures']],
    ['add_extra_document', t['add_extra_document']],
    ['add_extra_document_from_template', t['add_extra_document_from_template']],
    ['add_timestamp', t['add_timestamp']],
    ['reorder_envelope_documents', t['reorder_envelope_documents']],
  ];
  const signerTools: ToolEntry[] = [
    ['add_signer', t['add_signer']],
    ['get_signer', t['get_signer']],
    ['update_signer', t['update_signer']],
    ['delete_signer', t['delete_signer']],
    ['sign_in_batch', t['sign_in_batch']],
  ];
  const templateTools: ToolEntry[] = [
    ['list_templates', t['list_templates']],
    ['get_template', t['get_template']],
    ['create_from_template', t['create_from_template']],
  ];
  const webhookTools: ToolEntry[] = [
    ['create_webhook', t['create_webhook']],
    ['delete_webhook', t['delete_webhook']],
    ['create_webhook_header', t['create_webhook_header']],
    ['delete_webhook_header', t['delete_webhook_header']],
    ['reprocess_documents_webhooks', t['reprocess_documents_webhooks']],
  ];
  const partnerTools: ToolEntry[] = [
    ['create_partner_account', t['create_partner_account']],
    ['update_partner_payment_status', t['update_partner_payment_status']],
  ];

  const row = (name: string, desc: string) =>
    `<tr><td><code>${escapeHtml(name)}</code></td><td>${desc}</td></tr>`;
  const group = (domain: string, tools: ToolEntry[]) =>
    `<div class="tools-group"><h3 class="tools-domain">${domain}</h3><table class="tools-table"><tbody>${tools.map(([n, d]) => row(n, d)).join('')}</tbody></table></div>`;

  return group(`${t['domainDocuments']} (${docTools.length})`, docTools) +
    group(`${t['domainSigners']} (${signerTools.length})`, signerTools) +
    group(`${t['domainTemplates']} (${templateTools.length})`, templateTools) +
    group(`${t['domainWebhooks']} (${webhookTools.length})`, webhookTools) +
    group(`${t['domainPartner']} (${partnerTools.length})`, partnerTools);
}

/**
 * Renders the complete documentation page HTML for the given language.
 *
 * @param lang - Preferred language (en, pt-BR, es)
 * @returns Complete HTML document string
 */
export function renderDocumentationPage(lang: SupportedLanguage): string {
  const t = escapeTranslations(TRANSLATIONS[lang]);
  const urls = escapeUrls(URLS);
  const escapedLang = escapeAttr(lang);

  return `<!DOCTYPE html>
<html lang="${escapedLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t['title']}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: ${COLORS.neutral0};
      min-height: 100vh;
      padding: 24px;
      color: ${COLORS.neutral950};
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 720px; margin: 0 auto; }
    .card {
      background: ${COLORS.white};
      border: 1px solid ${COLORS.neutral200};
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(3,7,18,0.08), 0 4px 6px -4px rgba(3,7,18,0.05);
      padding: 32px;
      margin-bottom: 24px;
    }
    .header { text-align: center; margin-bottom: 32px; }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .logo-row svg { flex-shrink: 0; }
    h1 { font-size: 24px; font-weight: 600; color: ${COLORS.neutral950}; }
    .subtitle { font-size: 14px; color: ${COLORS.neutral600}; margin-top: 4px; }
    h2 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: ${COLORS.neutral950}; }
    p { font-size: 14px; line-height: 1.6; color: ${COLORS.neutral600}; margin-bottom: 12px; }
    .card p:last-of-type { margin-bottom: 0; }
    a { color: ${COLORS.brand500}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .step-number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${COLORS.brand500};
      color: ${COLORS.white};
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-text { font-size: 14px; line-height: 24px; color: ${COLORS.neutral950}; }
    .tools-group { margin-bottom: 20px; }
    .tools-group:last-child { margin-bottom: 0; }
    .tools-domain { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${COLORS.neutral950}; }
    .tools-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 0;
    }
    .tools-table th, .tools-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid ${COLORS.neutral200}; }
    .tools-table th { font-weight: 600; color: ${COLORS.neutral950}; }
    .tools-table td { color: ${COLORS.neutral600}; }
    .tools-table code { font-size: 12px; background: ${COLORS.neutral0}; padding: 2px 6px; border-radius: 4px; }
    .example { background: ${COLORS.neutral0}; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 8px; color: ${COLORS.neutral950}; }
    details { margin-bottom: 8px; border: 1px solid ${COLORS.neutral200}; border-radius: 8px; overflow: hidden; }
    details:last-child { margin-bottom: 0; }
    summary { padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer; color: ${COLORS.neutral950}; }
    details[open] summary { border-bottom: 1px solid ${COLORS.neutral200}; }
    details p { padding: 12px 16px; margin: 0; font-weight: 400; }
    .footer-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 20px;
    }
    @media (max-width: 540px) {
      .footer-columns { grid-template-columns: 1fr; gap: 20px; }
    }
    .footer-col-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${COLORS.neutral950};
      margin-bottom: 10px;
    }
    .footer-col a {
      display: block;
      font-size: 13px;
      color: ${COLORS.neutral600};
      padding: 3px 0;
      transition: color 0.15s;
    }
    .footer-col a:hover { color: ${COLORS.brand500}; text-decoration: none; }
    .footer-divider {
      border: none;
      border-top: 1px solid ${COLORS.neutral200};
      margin: 0 0 16px;
    }
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .footer-legal { font-size: 11px; color: ${COLORS.neutral600}; line-height: 1.5; }
    .footer-support {
      font-size: 12px;
      color: ${COLORS.neutral600};
    }
    .footer-support a { font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <header class="card header">
      <div class="logo-row">${ZAPSIGN_ICON_SVG}<h1>${t['title']}</h1></div>
      <p class="subtitle">${t['subtitle']}</p>
    </header>

    <section class="card">
      <h2>${t['whatIsTitle']}</h2>
      <p>${t['whatIsBody']}</p>
    </section>

    <section class="card">
      <h2>${t['prereqTitle']}</h2>
      <p><a href="${urls.plans}" target="_blank" rel="noopener noreferrer">${t['prereq1']} &#8599;</a></p>
      <p><a href="${urls.integrations}" target="_blank" rel="noopener noreferrer">${t['prereq2']} &#8599;</a></p>
    </section>

    <section class="card">
      <h2>${t['howToTitle']}</h2>
      <div class="step"><span class="step-number">1</span><span class="step-text">${t['step1']}</span></div>
      <div class="step"><span class="step-number">2</span><span class="step-text">${t['step2']}</span></div>
      <div class="step"><span class="step-number">3</span><span class="step-text">${t['step3']}</span></div>
      <div class="step"><span class="step-number">4</span><span class="step-text">${t['step4']}</span></div>
      <div class="step"><span class="step-number">5</span><span class="step-text">${t['step5']}</span></div>
    </section>

    <section class="card">
      <h2>${t['toolsTitle']}</h2>
      ${buildToolsTable(t)}
    </section>

    <section class="card">
      <h2>${t['examplesTitle']}</h2>
      <div class="example">${t['ex1']}</div>
      <div class="example">${t['ex2']}</div>
      <div class="example">${t['ex3']}</div>
    </section>

    <section class="card">
      <h2>${t['apiRefTitle']}</h2>
      <p>${t['apiRefBody']} <a href="${urls.apiDocs}" target="_blank" rel="noopener noreferrer">${t['apiRefLink']} &#8599;</a></p>
    </section>

    <section class="card">
      <h2>${t['troubleshootTitle']}</h2>
      <details><summary>${t['t1q']}</summary><p>${t['t1a']}</p></details>
      <details><summary>${t['t2q']}</summary><p>${t['t2a']}</p></details>
      <details><summary>${t['t3q']}</summary><p>${t['t3a']}</p></details>
      <details><summary>${t['t4q']}</summary><p>${t['t4a']}</p></details>
    </section>

    <footer class="card">
      <div class="footer-columns">
        <div class="footer-col">
          <div class="footer-col-title">${t['footerColResources']}</div>
          <a href="${urls.apiDocs}" target="_blank" rel="noopener noreferrer">${t['footerApi']}</a>
          <a href="${urls.helpCenter}" target="_blank" rel="noopener noreferrer">${t['footerHelp']}</a>
          <a href="${urls.plans}" target="_blank" rel="noopener noreferrer">${t['footerPlans']}</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">${t['footerColLegal']}</div>
          <a href="${urls.privacy}" target="_blank" rel="noopener noreferrer">${t['footerPrivacy']}</a>
          <a href="${urls.terms}" target="_blank" rel="noopener noreferrer">${t['footerTerms']}</a>
          <a href="${urls.dataRequest}" target="_blank" rel="noopener noreferrer">${t['footerDataRequest']}</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">${t['footerColTrust']}</div>
          <a href="${urls.trustCenter}" target="_blank" rel="noopener noreferrer">${t['footerTrust']}</a>
          <a href="${urls.support}">${t['footerSupport']}</a>
        </div>
      </div>
      <hr class="footer-divider">
      <div class="footer-bottom">
        <p class="footer-legal">${t['footerLegal']}</p>
        <p class="footer-support">${t['footerContactLabel']} <a href="${urls.support}">support@zapsign.com.br</a></p>
      </div>
    </footer>
  </div>
</body>
</html>`;
}
