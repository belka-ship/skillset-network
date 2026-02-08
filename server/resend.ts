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
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  enquiryType: string;
  message: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const { client } = await getUncachableResendClient();
  
  const emailHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
    <p><strong>Enquiry Type:</strong> ${data.enquiryType}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br>')}</p>
  `;

  const result = await client.emails.send({
    from: 'onboarding@resend.dev',
    to: 'vpikarevskis@gmail.com',
    subject: `Skillset Contact: ${data.enquiryType} from ${data.name}`,
    html: emailHtml,
    replyTo: data.email
  });
  
  console.log('Resend API response:', JSON.stringify(result, null, 2));
  
  if (result.error) {
    console.error('Resend error:', result.error);
    throw new Error(result.error.message || 'Failed to send email');
  }
}
