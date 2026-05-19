import { API_BASE } from '../config';
import { authFetch } from './authFetch';

export type XUserProfile = {
    name: string;
    screenName: string;
    description: string;
    profileImageUrl: string;
    profileBannerUrl?: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    verified: boolean;
};


export type ShadowbanStatus = {
    screenName: string;
    status: {
        searchBan: boolean;
        suggestionBan: boolean;
        ghostBan: boolean;
        replyDeboosting: boolean;
    };
    timestamp: number;
};

export async function fetchXUserProfile(screenName: string): Promise<XUserProfile | null> {
    try {
        const cleanScreenName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
        const response = await authFetch(`${API_BASE}/api/x/profile/${cleanScreenName}`);

        if (!response.ok) {
            const error = await response.json();
            console.error("Error fetching X profile from backend:", error);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching X profile via backend:", error);
        return null;
    }
}

export async function fetchXUserProfileByAccountId(accountId: string): Promise<XUserProfile | null> {
    try {
        const response = await authFetch(`${API_BASE}/api/accounts/profile/${accountId}`);

        if (!response.ok) {
            const error = await response.json();
            console.error("Error fetching account profile:", error);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching account profile:", error);
        return null;
    }
}

export async function checkShadowban(screenName: string): Promise<ShadowbanStatus | null> {
    try {
        const cleanScreenName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
        const response = await authFetch(`${API_BASE}/api/x/shadowban/${cleanScreenName}`);

        if (!response.ok) {
            const error = await response.json();
            console.error("Error checking shadowban from backend:", error);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error checking shadowban via backend:", error);
        return null;
    }
}
