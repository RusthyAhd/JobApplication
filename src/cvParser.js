const fs = require('fs');
const pdf = require('pdf-parse');
const { google } = require('googleapis');

async function parseCV(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    const personalInfo = { name: '', email: '', phone: '' };
    const education = [];
    const qualifications = [];
    const projects = [];

    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.includes('@')) personalInfo.email = line.trim();
        if (/^\d{10}$/.test(line.trim())) personalInfo.phone = line.trim();
        if (line.toLowerCase().includes('education')) education.push(line);
        if (line.toLowerCase().includes('qualification')) qualifications.push(line);
        if (line.toLowerCase().includes('project')) projects.push(line);
    });

    return { personalInfo, education, qualifications, projects };
}

async function saveToGoogleSheets(data, cvLink) {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1bhEYrgiC99VOrCLtGV5FjjOzBXbL7nmNvDmeSxNpY_A'; // Create a sheet and add ID here

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
            values: [[
                data.personalInfo.name, data.personalInfo.email, data.personalInfo.phone,
                JSON.stringify(data.education), JSON.stringify(data.qualifications),
                JSON.stringify(data.projects), cvLink
            ]]
        }
    });
}

module.exports = { parseCV, saveToGoogleSheets };