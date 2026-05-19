
/**
 * Handles affiliate URL replacement for DMM and MGS.
 */

interface AffiliateSettings {
    dmmId?: string;
    mgsId?: string;
}

/**
 * Generates an affiliate URL based on the provided settings and original URL.
 * Automatically detects the platform (DMM/FANZA or MGS) based on the domain.
 * 
 * @param originalUrl The original URL from the referenced content.
 * @param settings The affiliate settings containing both DMM and MGS IDs.
 * @returns The URL with the affiliate ID injected, or the original URL if no match/settings.
 */
export function generateAffiliateUrl(originalUrl: string, settings: AffiliateSettings): string {
    if (!originalUrl) return '';

    // DMM/FANZA Auto-detection
    // Matches: al.fanza.co.jp, dmm.co.jp, fanza.com
    if (settings.dmmId && (
        originalUrl.includes('fanza.co.jp') ||
        originalUrl.includes('dmm.co.jp') ||
        originalUrl.includes('fanza.com') ||
        originalUrl.includes('dmm.com')
    )) {
        // Replace 'id=...' with the user's DMM ID
        const dmmRegex = /(id=)([^&]+)/;
        if (dmmRegex.test(originalUrl)) {
            return originalUrl.replace(dmmRegex, `$1${settings.dmmId}`);
        }
    }

    // MGS (MGStage) Auto-detection
    // Matches: mgstage.com
    if (settings.mgsId && (originalUrl.includes('mgstage.com'))) {
        // Replace 'c=...' with the user's MGS ID
        const mgsRegex = /(c=)([^&]+)/;
        if (mgsRegex.test(originalUrl)) {
            return originalUrl.replace(mgsRegex, `$1${settings.mgsId}`);
        }
    }

    return originalUrl;
}
