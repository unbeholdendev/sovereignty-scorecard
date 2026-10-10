export const mailRules = [
  { id: "google-workspace", name: "Google Workspace", company: "Google", hosts: ["google.com", "googlemail.com"], selector: "google" },
  { id: "microsoft-365", name: "Microsoft 365", company: "Microsoft", hosts: ["protection.outlook.com", "onmicrosoft.com"] },
  { id: "proton", name: "Proton Mail", company: "Proton", hosts: ["protonmail.ch", "proton.me", "proton.ch"] },
  { id: "fastmail", name: "Fastmail", company: "Fastmail", hosts: ["messagingengine.com", "fmhosted.com"] },
  { id: "zoho", name: "Zoho Mail", company: "Zoho", hosts: ["zoho.com", "zoho.eu", "zoho.in", "zoho.com.au", "zohomail.com"], selector: "zmail" },
  { id: "sendgrid", name: "SendGrid", company: "Twilio", hosts: ["sendgrid.net"] },
  { id: "mailchimp", name: "Mailchimp", company: "Intuit", hosts: ["mcsv.net"] },
  { id: "mandrill", name: "Mandrill", company: "Intuit", hosts: ["mandrillapp.com"], selector: "mandrill" },
  { id: "amazon-ses", name: "Amazon SES", company: "Amazon", hosts: ["amazonses.com"] },
  { id: "postmark", name: "Postmark", company: "ActiveCampaign", hosts: ["mtasv.net"] },
  { id: "hubspot", name: "HubSpot", company: "HubSpot", hosts: ["hubspotemail.net", "hubspot.com"] },
  { id: "mailgun", name: "Mailgun", company: "Sinch", hosts: ["mailgun.org"] },
  { id: "brevo", name: "Brevo", company: "Brevo", hosts: ["brevo.com", "sendinblue.com"] },
  { id: "mailjet", name: "Mailjet", company: "Sinch", hosts: ["mailjet.com"], selector: "mailjet" },
  { id: "zendesk", name: "Zendesk", company: "Zendesk", hosts: ["zendesk.com"] },
  { id: "salesforce", name: "Salesforce", company: "Salesforce", hosts: ["salesforce.com"] },
  { id: "smtp2go", name: "SMTP2GO", company: "SMTP2GO", hosts: ["smtp2go.com"] },
  { id: "marketo", name: "Marketo", company: "Adobe", hosts: ["mktomail.com"] },
];

export const dkimSelectors = [
  "google", "selector1", "selector2", "k1", "k2", "k3", "s1", "s2", "mandrill", "mailjet", "zmail",
  "fm1", "fm2", "fm3", "protonmail", "protonmail2", "protonmail3", "brevo1", "brevo2",
];
