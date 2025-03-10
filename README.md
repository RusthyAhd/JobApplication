# Job Application Processing Pipeline

## Overview
This project is my take on automating job application processing! It features a sleek web form where candidates can submit their details and CVs. The pipeline handles CV uploads to Google Drive, extracts key data to save in Google Sheets, sends a webhook notification (with a bit of a hiccup I’ll explain), and schedules a follow-up email via SendGrid. I built it using Node.js and Express, tapping into Google APIs and SendGrid for the heavy lifting. It’s designed to handle anywhere from 100 to 1 million applications a month with low costs, thanks to its modular setup. 

## Tech Stack
- **Front-end**: HTML, Tailwind CSS, JavaScript (for that smooth UI)
- **Back-end**: Node.js, Express, Multer (for file uploads), pdf-parse (to read CVs), axios (for webhook calls), dotenv (for secrets)
- **Storage/Services**: Google Drive, Google Sheets, SendGrid
- **Deployment**: Works on localhost for now, but could scale to Google Cloud Platform or Heroku
- **APIs**: Google Drive API, Google Sheets API, SendGrid API
- **Tools**: Postman, Webhook.site (for testing)
- **Libraries**: pdf-parse, multer, axios

## Architecture
Here’s how it flows:
- The form at `http://localhost:3000` sends data to my Node.js server.
- CVs get uploaded to a Google Drive folder: `https://drive.google.com/drive/folders/1BiZmmR7g-uJDcJ0d6j9ILejavVU2J_9v?usp=drive_link`.
- Parsed CV data lands in this Google Sheet: `https://docs.google.com/spreadsheets/d/1bhEYrgiC99VOrCLtGV5FjjOzBXbL7nmNvDmeSxNpY_A/edit?usp=sharing`.
- A webhook pings the endpoint (I used `https://webhook.site/#!/b1b1b1b1-1b1b-1b1b-1b1b-1b1b1b1b1b1b` for testing), though it’s hitting a snag (more on that below).
- A follow-up email is scheduled using SendGrid, set to send 24 hours later.

## Setup
Getting it running is pretty straightforward:
1. Grab the dependencies with `npm install`.
2. Set up your `.env` file with your API keys and secrets.
3. Drop your Google API `credentials.json` in the root folder.
4. Fire it up with `node src/server.js`.
5. Hit `http://localhost:3000` in your browser to try it out!

## Cost Estimation
Here’s a rough breakdown of what it might cost:
- **100 applications/month**:
  - Google Drive: Free (15GB limit, no cost yet).
  - Google Sheets API: Free (stays within limits).
  - SendGrid: Free tier (100 emails/day, so $0).
  - **Total**: ~$0/month.

- **10K applications/month**:
  - Google Drive: 1TB storage ($10/month) + API calls (~$0.05/10k requests) = ~$15.
  - Google Sheets API: Still free within limits.
  - SendGrid: Free tier covers some, but extras at $0.00025/email = ~$250.
  - **Total**: ~$265/month.

- **1M applications/month**:
  - Google Drive: 1TB ($10/month) + API costs (~$15).
  - Google Sheets API: Might need BigQuery (~$5/TB processed).
  - SendGrid: $15/month (40k emails) + $0.00025/extra email = ~$265.
  - **Total**: ~$285/month.

- **Optimization Tips**: Compress CV files to save space, batch API requests to cut costs.

## Challenges
I ran into a few bumps along the way:
- The CV parsing is pretty basic right now—could use some NLP love (like Google NLP API) for better accuracy.
- Google Drive’s free tier might hit storage limits as it scales.
- Google Sheets API has rate limits that could slow things down.
- SendGrid’s email limits might need upgrading for high volumes.
- The webhook endpoint gave me a headache (more in the Task 4 section)!

## Task Breakdown

### Task 1: Create a Web Form
Built a nice form with Tailwind CSS, complete with a gradient background, animated particles, and a loading spinner on submit. It’s responsive and user-friendly—check it out at `http://localhost:3000`.

### Task 2: Upload CV to Google Drive
CVs are uploaded to the folder `https://drive.google.com/drive/folders/1BiZmmR7g-uJDcJ0d6j9ILejavVU2J_9v?usp=drive_link`. I used the Google Drive API with permissions set to `reader` for anyone, and it logs the upload URL to the console.

### Task 3: Parse CV and Save to Google Sheets
I used `pdf-parse` to extract data (name, email, phone, education, etc.) from the CV and saved it to `https://docs.google.com/spreadsheets/d/1bhEYrgiC99VOrCLtGV5FjjOzBXbL7nmNvDmeSxNpY_A/edit?usp=sharing`. It works, but the parsing could be smarter with more advanced tools.

### Task 4: Send an HTTP Request (Webhook) After Processing
I set up a webhook to hit `https://rnd-assignment.automations-3d6.workers.dev/` after processing each CV, using `axios` in `src/server.js`. I included the `X-Candidate-Email` header with my email (`rusthyahamed2001@gmail.com`) to identify my submissions. The payload follows the assignment’s example, like this:

```json
{
  "cv_data": {
    "personal_info": {
      "name": "Test",
      "email": "test@gmail.com",
      "phone": "0777473617"
    },
    "education": ["Education"],
    "qualifications": [],
    "projects": [
      "grow and contribute to impactful projects.",
      "Projects",
      "Developed a text summarization pipeline using NLP techniques. The project"
    ],
    "cv_public_link": "https://drive.google.com/file/d/1evDbw9uK7OD-Pp-e1J2AXl9QPbSbFduu/view?usp=drivesdk"
  },
  "metadata": {
    "applicant_name": "Test",
    "email": "test@gmail.com",
    "status": "prod",
    "cv_witnessed": true,
    "processed_timestamp": "2025-03-10T04:20:56.361Z"
  }
}
