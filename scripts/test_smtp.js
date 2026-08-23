const path = require('path');
const nodemailer = require(path.join(__dirname, '../node_modules/nodemailer'));

async function testSmtp() {
  console.log('Connecting to SMTP smtp.turkticaret.net:465...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.turkticaret.net',
    port: 465,
    secure: true,
    auth: {
      user: 'info@pekefe.com',
      pass: 'Pekefe.25'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('SMTP Connection Successful!');

    const info = await transporter.sendMail({
      from: '"PEKEFE İSPİR YÖRESEL" <info@pekefe.com>',
      to: 'info@pekefe.com',
      subject: 'Pekefe SMTP Test Email',
      text: 'Pekefe E-Posta Servisi Test Mesajıdır.'
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('SMTP Test Error:', err);
  }
}

testSmtp();
