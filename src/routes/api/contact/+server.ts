import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';
import { lookup } from 'node:dns';

export async function POST({ request }) {
	const { name, email, type, message } = await request.json();

	if (!name || !message) {
		return json({ error: 'Name and message are required.' }, { status: 400 });
	}

	const gmailUser = env.GMAIL_USER;
	const gmailAppPass = env.GMAIL_APP_PASSWORD;

	if (!gmailUser || !gmailAppPass) {
		console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
		return json({ error: 'Email service not configured.' }, { status: 500 });
	}

	const recipients = (env.CONTACT_RECIPIENTS || 'an.lam@sintef.no').split(',').map((r) => r.trim());
	const replyTo = email ? `${name} <${email}>` : undefined;

	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		lookup: (hostname, options, callback) => lookup(hostname, { ...options, family: 4 }, callback),
		auth: {
			user: gmailUser,
			pass: gmailAppPass
		},
		connectionTimeout: 10000,
		socketTimeout: 10000
	});

	try {
		await transporter.sendMail({
			from: `"SINDIT Contact" <${gmailUser}>`,
			to: recipients,
			...(replyTo ? { replyTo } : {}),
			subject: `[SINDIT] [${type || 'General Inquiry'}] Message from ${name}`,
			text: `Type: ${type || 'General Inquiry'}\nName: ${name}\nEmail: ${email || '(not provided)'}\n\nMessage:\n${message}`,
			html: `<p><strong>Type:</strong> ${type || 'General Inquiry'}</p>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email ? `<a href="mailto:${email}">${email}</a>` : '(not provided)'}</p>
<hr/>
<p>${message.replace(/\n/g, '<br/>')}</p>`
		});
	} catch (err) {
		console.error('Failed to send email:', err);
		return json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
	}

	return json({ success: true });
}
