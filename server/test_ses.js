import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Using Access Key:", process.env.AWS_ACCESS_KEY_ID?.substring(0, 5) + "...");

const client = new SESClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const sendTestEmail = async () => {
    const params = {
        Destination: {
            ToAddresses: ["info@sns-tool.online"],
        },
        Message: {
            Body: {
                Text: { Data: "Amazon SES Integration Test\n\nThis is a test email from the Posutto application." },
            },
            Subject: { Data: "SES Test - Posutto" },
        },
        Source: "info@sns-tool.online",
    };

    try {
        const data = await client.send(new SendEmailCommand(params));
        console.log("Email sent successfully:", data.MessageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
};

sendTestEmail();
