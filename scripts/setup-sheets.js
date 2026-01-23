const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function setupSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  console.log('Setting up Google Sheet:', spreadsheetId);

  // Get current sheets
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
  console.log('Existing sheets:', existingSheets);

  // Create Contact sheet if it doesn't exist
  if (!existingSheets.includes('Contact')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: 'Contact' }
          }
        }]
      }
    });
    console.log('Created Contact sheet');
  }

  // Create Bookings sheet if it doesn't exist
  if (!existingSheets.includes('Bookings')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: 'Bookings' }
          }
        }]
      }
    });
    console.log('Created Bookings sheet');
  }

  // Add headers to Contact sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Contact!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'Timestamp',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Subject',
        'Message'
      ]]
    }
  });
  console.log('Added Contact headers');

  // Add headers to Bookings sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Bookings!A1:Q1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'Booking Ref',
        'Timestamp',
        'Session Type',
        'Location',
        'Age Group',
        'Child First Name',
        'Child Last Name',
        'Child DOB',
        'Medical Info',
        'Parent First Name',
        'Parent Last Name',
        'Parent Email',
        'Parent Phone',
        'Emergency Contact',
        'Emergency Phone',
        'Payment Method',
        'Photo Consent'
      ]]
    }
  });
  console.log('Added Bookings headers');

  // Format headers (bold, freeze row)
  const sheetsToFormat = [];
  const refreshedSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

  for (const sheet of refreshedSpreadsheet.data.sheets) {
    if (sheet.properties.title === 'Contact' || sheet.properties.title === 'Bookings') {
      sheetsToFormat.push(sheet.properties.sheetId);
    }
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: sheetsToFormat.flatMap(sheetId => [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)'
          }
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { frozenRowCount: 1 }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        }
      ])
    }
  });
  console.log('Formatted headers');

  console.log('\n✅ Google Sheet setup complete!');
  console.log(`View at: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

// Load env and run
require('dotenv').config({ path: '.env.local' });
setupSheets().catch(console.error);
