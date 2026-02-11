import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

interface FeedbackEmailData {
  id: string;
  type: string;
  message: string;
  screen_path?: string;
  url?: string;
  user_agent?: string;
  app_version?: string;
  viewport?: string;
  user_id?: string;
  created_at: string;
  can_contact?: boolean;
  email?: string;
  severity?: string;
  steps_to_reproduce?: string;
  expected_result?: string;
  actual_result?: string;
  user_intent?: string;
  expectation?: string;
  problem_solved?: string;
  target_user?: string;
  value_rating?: string;
  screenshot_url?: string;
  referrer?: string;
  session_id?: string;
  user_email?: string | null;
  user_display_name?: string | null;
  user_full_name?: string | null;
  is_authenticated?: boolean;
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    praise: 'Praise / Good',
    idea: 'Idea / Suggestion',
    bug: 'Bug / Issue',
    confusing: 'Confusing',
    other: 'Other',
  };
  return labels[type] || type;
}

function senderLabel(data: FeedbackEmailData): string {
  if (data.is_authenticated) {
    return data.user_display_name || data.user_full_name || data.user_email || 'Authenticated User';
  }
  return 'Guest';
}

function buildSubject(data: FeedbackEmailData): string {
  const parts = ['[PfPE Feedback]', typeLabel(data.type)];
  if (data.screen_path) parts.push(`| ${data.screen_path}`);
  parts.push(`| ${senderLabel(data)}`);
  if (data.severity && data.type === 'bug') parts.push(`| ${data.severity}`);
  return parts.join(' ');
}

function buildHtmlBody(data: FeedbackEmailData): string {
  const sections: string[] = [];

  sections.push(`<h2 style="color:#16a34a;">Play for Planet Earth — Feedback</h2>`);

  sections.push(`<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">`);
  sections.push(`<h3 style="margin:0 0 8px;color:#166534;font-size:14px;">Sender</h3>`);
  if (data.is_authenticated) {
    const name = data.user_display_name || data.user_full_name || 'Unknown';
    sections.push(`<p style="margin:2px 0;"><strong>From:</strong> ${escapeHtml(name)}</p>`);
    if (data.user_email) sections.push(`<p style="margin:2px 0;"><strong>Email:</strong> ${escapeHtml(data.user_email)}</p>`);
    if (data.user_id) sections.push(`<p style="margin:2px 0;"><strong>User ID:</strong> ${escapeHtml(data.user_id)}</p>`);
  } else {
    sections.push(`<p style="margin:2px 0;"><strong>From:</strong> Guest (not logged in)</p>`);
    if (data.can_contact && data.email) {
      sections.push(`<p style="margin:2px 0;"><strong>Contact email:</strong> ${escapeHtml(data.email)}</p>`);
    }
  }
  sections.push(`</div>`);

  sections.push(`<p><strong>Type:</strong> ${typeLabel(data.type)}</p>`);
  sections.push(`<p><strong>Message:</strong></p><blockquote style="border-left:3px solid #16a34a;padding-left:12px;color:#333;">${escapeHtml(data.message)}</blockquote>`);

  if (data.type === 'bug') {
    if (data.severity) sections.push(`<p><strong>Severity:</strong> ${escapeHtml(data.severity)}</p>`);
    if (data.steps_to_reproduce) sections.push(`<p><strong>Steps to reproduce:</strong></p><pre style="background:#f5f5f5;padding:8px;border-radius:4px;">${escapeHtml(data.steps_to_reproduce)}</pre>`);
    if (data.expected_result) sections.push(`<p><strong>Expected result:</strong> ${escapeHtml(data.expected_result)}</p>`);
    if (data.actual_result) sections.push(`<p><strong>Actual result:</strong> ${escapeHtml(data.actual_result)}</p>`);
  }

  if (data.type === 'confusing') {
    if (data.user_intent) sections.push(`<p><strong>What they were trying to do:</strong> ${escapeHtml(data.user_intent)}</p>`);
    if (data.expectation) sections.push(`<p><strong>What they expected:</strong> ${escapeHtml(data.expectation)}</p>`);
  }

  if (data.type === 'idea') {
    if (data.problem_solved) sections.push(`<p><strong>Problem it solves:</strong> ${escapeHtml(data.problem_solved)}</p>`);
    if (data.target_user) sections.push(`<p><strong>Who is it for:</strong> ${escapeHtml(data.target_user)}</p>`);
    if (data.value_rating) sections.push(`<p><strong>Value rating:</strong> ${escapeHtml(data.value_rating)}</p>`);
  }

  if (data.screenshot_url) {
    sections.push(`<p><strong>Screenshot:</strong> <a href="${escapeHtml(data.screenshot_url)}">View Screenshot</a></p>`);
  }

  if (data.can_contact && data.email) {
    sections.push(`<p><strong>Contact permission:</strong> Yes — ${escapeHtml(data.email)}</p>`);
  } else {
    sections.push(`<p><strong>Contact permission:</strong> No</p>`);
  }

  sections.push(`<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;" />`);
  sections.push(`<h3 style="color:#666;font-size:14px;">Metadata</h3>`);
  const meta = [
    ['Feedback ID', data.id],
    ['Screen', data.screen_path],
    ['URL', data.url],
    ['Time', data.created_at],
    ['User ID', data.user_id],
    ['User Agent', data.user_agent],
    ['Viewport', data.viewport],
    ['App Version', data.app_version],
    ['Referrer', data.referrer],
    ['Session', data.session_id],
  ];
  sections.push('<table style="font-size:12px;color:#666;">');
  for (const [label, value] of meta) {
    if (value) {
      sections.push(`<tr><td style="padding:2px 8px 2px 0;font-weight:600;">${label}</td><td>${escapeHtml(value)}</td></tr>`);
    }
  }
  sections.push('</table>');

  return sections.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendFeedbackEmail(data: FeedbackEmailData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    const toEmail = 'info@playearth.co.uk';

    const result = await client.emails.send({
      from: fromEmail || 'Play for Planet Earth <onboarding@resend.dev>',
      to: toEmail,
      subject: buildSubject(data),
      html: buildHtmlBody(data),
    });

    if (result.error) {
      console.error('Resend email error:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send feedback email:', error);
    return false;
  }
}
