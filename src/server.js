require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const { parseCV, saveToGoogleSheets } = require('./cvParser');
const { sendFollowUpEmail } = require('./emailService');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Google Drive setup
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

app.use(express.static('public'));

app.post('/submit', upload.single('cv'), async (req, res) => {
    const { name, email, phone } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No CV file uploaded.' });
    }

    let cvLink;

    try {
        // Task 2: Upload to Google Drive
        const fileMetadata = {
            name: `${Date.now()}-${file.originalname}`,
            parents: ['1BiZmmR7g-uJDcJ0d6j9ILejavVU2J_9v']
        };
        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path)
        };
        const driveResponse = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        });
        cvLink = driveResponse.data.webViewLink;

        await drive.permissions.create({
            fileId: driveResponse.data.id,
            resource: { role: 'reader', type: 'anyone' }
        });
        console.log('CV uploaded to Drive:', cvLink);

        // Task 3: Parse CV and save to Google Sheets
        const cvData = await parseCV(file.path);
        cvData.personalInfo.name = name;
        cvData.personalInfo.email = email;
        cvData.personalInfo.phone = phone;
        await saveToGoogleSheets(cvData, cvLink);
        console.log('CV data saved to Sheets');

        // Task 4: Send webhook (non-critical)
        const payload = {
            cv_data: {
                personal_info: {
                    name: cvData.personalInfo.name,
                    email: cvData.personalInfo.email,
                    phone: cvData.personalInfo.phone
                },
                education: cvData.education,
                qualifications: cvData.qualifications,
                projects: cvData.projects,
                cv_public_link: cvLink,
                cv_processed: true // Added back to test endpoint requirement
            },
            metadata: {
                applicant_name: name,
                email: email,
                status: 'prod',
                cv_witnessed: true,
                processed_timestamp: new Date().toISOString()
            }
        };

        console.log('Webhook Payload:', JSON.stringify(payload, null, 2));
        try {
            const webhookResponse = await axios.post(
                'https://rnd-assignment.automations-3d6.workers.dev/',
                payload,
                {
                    headers: {
                        'X-Candidate-Email': 'rusthyahamed2001@gmail.com',
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Webhook Response:', webhookResponse.status, webhookResponse.data);
        } catch (webhookError) {
            console.warn('Webhook failed (non-critical):', webhookError.response ? webhookError.response.data : webhookError.message);
        }

        // Task 5: Send follow-up email
        await sendFollowUpEmail(email, name);
        console.log('Follow-up email scheduled');

        // Cleanup
        fs.unlinkSync(file.path);

        res.json({ message: `Thank you, ${name}! Your application has been processed.` });
    } catch (error) {
        console.error('Critical Error:', error.message, error.stack);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ message: `Failed to process application: ${error.message}` });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));