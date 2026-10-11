"use strict";
/**
 * In-memory store for meeting URLs detected via the audio pipeline.
 * setDetectedMeetingUrl is called when CoreAudioTap enriches a mic_started event
 * or a notification action routes to /add-to-meeting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDetectedMeetingUrl = setDetectedMeetingUrl;
exports.getDetectedMeetingUrl = getDetectedMeetingUrl;
const DETECTED_URL_TTL_MS = 4 * 60 * 60 * 1000;
let detectedMeetingUrl = null;
function setDetectedMeetingUrl(url) {
    detectedMeetingUrl = { url, setAt: Date.now() };
}
function getDetectedMeetingUrl() {
    if (!detectedMeetingUrl)
        return null;
    if (Date.now() - detectedMeetingUrl.setAt > DETECTED_URL_TTL_MS) {
        detectedMeetingUrl = null;
        return null;
    }
    return detectedMeetingUrl.url;
}
//# sourceMappingURL=meeting-url-store.js.map