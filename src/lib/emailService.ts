import { API_BASE } from '../config';
import { authJsonFetch } from './authFetch';

export async function sendSignupEmail(toEmail: string) {
    try {
        const response = await authJsonFetch(`${API_BASE}/api/send-email`, 'POST', { toEmail });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        const result = await response.json();
        console.log("Email sent successfully via backend:", result.message);
        return result;
    } catch (error) {
        console.error("Error sending email via backend:", error);
        throw error;
    }
}
