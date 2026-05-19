import { SESClient, GetSendQuotaCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const client = new SESClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const checkQuota = async () => {
    try {
        const data = await client.send(new GetSendQuotaCommand({}));
        console.log("SES Quota Details:");
        console.log("- Max 24h Send:", data.Max24HourSend);
        console.log("- Max Send Rate:", data.MaxSendRate);
        console.log("- Sent in last 24h:", data.SentLast24Hours);

        if (data.Max24HourSend === 200) {
            console.log("\nStatus: Likely in SANDBOX mode (Max 24h Send is 200).");
        } else {
            console.log("\nStatus: Likely in PRODUCTION mode (Max 24h Send is > 200).");
        }
    } catch (err) {
        console.error("Error fetching quota:", err);
    }
};

checkQuota();
