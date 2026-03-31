// ═══════════════════════════════════════════════════════════
//  Notification Service (DEMO WIN UPGRADE)
//  Sends real-time alerts to Slack/Discord Webhooks
// ═══════════════════════════════════════════════════════════

const axios = require("axios");

const SLACK_URL = process.env.SLACK_WEBHOOK_URL || null;
const DISCORD_URL = process.env.DISCORD_WEBHOOK_URL || null;

/**
 * Send a notification when a major threat is detected.
 * 
 * @param {Object} alert - { type, user_id, ip, score, reasons, blocked }
 */
async function sendAlert(alert) {
    const message = `🚨 *Aegis.AI SECURITY ALERT* 🚨\n` + 
                    `*Type:* ${alert.type}\n` + 
                    `*User:* ${alert.user_id}\n` + 
                    `*IP:* ${alert.ip}\n` + 
                    `*Risk Score:* ${alert.score}/100\n` + 
                    `*Reasons:* ${alert.reasons.join(", ")}\n` + 
                    `*Status:* ${alert.blocked ? "🚫 AUTO-BLOCKED" : "⚠️ MONITORED"}`;

    const data = {
        text: message,
        content: message, // For Discord
    };

    // Slack
    if (SLACK_URL) {
        axios.post(SLACK_URL, { text: message }).catch(() => {});
    }

    // Discord
    if (DISCORD_URL) {
        axios.post(DISCORD_URL, { content: message }).catch(() => {});
    }

    // Always log to console for the demo terminal view
    console.log(`\n🔔 NOTIFICATION SENT: [${alert.type.toUpperCase()}] ${alert.ip} (Score: ${alert.score})\n`);
}

module.exports = { sendAlert };
