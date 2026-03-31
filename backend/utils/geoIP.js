// ═══════════════════════════════════════════════════════════
//  Geo-IP Simulation Service
//  Maps IPs to countries for hackathon visualization
// ═══════════════════════════════════════════════════════════

const countries = ["US", "CN", "RU", "IN", "BR", "VN", "DE", "GB", "CA", "FR"];

/**
 * Simulate a Geo-IP lookup.
 * @param {string} ip
 * @returns {Object} { country_code, country_name }
 */
function getGeoFromIP(ip) {
  // Local/Private IPs
  if (ip.startsWith("192.168") || ip.startsWith("10.") || ip.startsWith("172.16") || ip === "::1" || ip === "127.0.0.1") {
    return { country_code: "Local", country_name: "Internal Network" };
  }

  // Use the sum of IP parts as a seed for consistent mock results
  const parts = ip.split(".").map((p) => parseInt(p) || 0);
  const sum = parts.length === 4 ? parts.reduce((a, b) => a + b, 0) : 42;
  const index = sum % countries.length;

  const code = countries[index];
  const names = {
    US: "United States",
    CN: "China",
    RU: "Russia",
    IN: "India",
    BR: "Brazil",
    VN: "Vietnam",
    DE: "Germany",
    GB: "United Kingdom",
    CA: "Canada",
    FR: "France",
  };

  return {
    country_code: code,
    country_name: names[code] || "Unknown",
  };
}

module.exports = { getGeoFromIP };
