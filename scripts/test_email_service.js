const path = require('path');

async function runTest() {
  try {
    const { emailNotificationService } = require(path.join(__dirname, '../src/lib/email-notification-service'));
    console.log('Sending test email via emailNotificationService...');
    
    const result = await emailNotificationService.queueEmail(
      'info@pekefe.com',
      'welcome',
      { kullanici_adi: 'İlhan Efe (Test)' }
    );

    console.log('Test Email Result:', result);
  } catch (err) {
    console.error('Test Email Exception:', err);
  }
}

runTest();
