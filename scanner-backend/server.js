const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
// Dynamic port for Render / Railway / cloud environments
const port = process.env.PORT || 3000;

// Open the gates for the frontend (Vercel, localhost, custom domains)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const USERS_DB = './users.json'; // Local mock database fallback
const REPORT_FILE = './latest_scan_report.json';

// --- CLOUD DATABASE ADAPTER (MONGODB ATLAS WITH LOCAL FALLBACK) ---
let isMongoConnected = false;
let UserModel = null;
let ReportModel = null;

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB Atlas Cloud Database!');
            isMongoConnected = true;
        })
        .catch(err => {
            console.error('⚠️ MongoDB Atlas connection error, using local disk fallback:', err.message);
        });

    const userSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        name: String,
        email: { type: String, unique: true },
        password: String,
        registeredAt: String
    });

    const reportSchema = new mongoose.Schema({
        operator_id: String,
        device: String,
        timestamp: String,
        type: String,
        risk_level: String,
        report: mongoose.Schema.Types.Mixed
    });

    UserModel = mongoose.models.User || mongoose.model('User', userSchema);
    ReportModel = mongoose.models.Report || mongoose.model('Report', reportSchema);
}

let latestScanReport = null;
if (fs.existsSync(REPORT_FILE)) {
    try {
        latestScanReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    } catch (e) {
        latestScanReport = null;
    }
}

// Health check endpoints for Render, Railway, Vercel pings
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "online", 
        service: "Guardian Cybersecurity Platform API", 
        version: "2.0.0",
        database: isMongoConnected ? "MongoDB Atlas (Cloud)" : "Local Storage"
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Helper function to read the local database
const readUsers = () => {
    if (!fs.existsSync(USERS_DB)) return [];
    try {
        const data = fs.readFileSync(USERS_DB);
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// The Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required operator data." });
    }

    try {
        if (isMongoConnected && UserModel) {
            const existing = await UserModel.findOne({ email });
            if (existing) {
                return res.status(409).json({ error: "Identity already established for this comm channel." });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = await UserModel.create({
                id: Date.now().toString(),
                name,
                email,
                password: hashedPassword,
                registeredAt: new Date().toISOString()
            });

            console.log(`✅ Operator [${name}] successfully registered in MongoDB Atlas.`);
            return res.status(201).json({ message: "Identity successfully established.", operatorId: newUser.id });
        }

        // Local storage fallback
        const users = readUsers();

        if (users.find(u => u.email === email)) {
            return res.status(409).json({ error: "Identity already established for this comm channel." });
        }

        console.log(`\n🔒 Encrypting credentials for new operator: ${name}...`);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: hashedPassword,
            registeredAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2));

        console.log(`✅ Operator [${name}] successfully registered to the Guardian Protocol.`);
        res.status(201).json({ message: "Identity successfully established.", operatorId: newUser.id });
    } catch (error) {
        console.error(`❌ Registration Failure: ${error.message}`);
        res.status(500).json({ error: "Internal server error during registration." });
    }
});


// --- YOUR EXISTING VULNERABILITY SCANNER CODE BELOW ---

function sanitizeName(name) {
    return name
        .replace(/\b\d+(\.\d+)+\b/g, '')
        .replace(/\(x64\)|\(x86\)|64Bit|32Bit/g, '')
        .replace(/Standard Library|Core Interpreter|pip Bootstrap/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractCvss(metrics) {
    if (!metrics) return { score: null, severity: 'INFORMATIONAL' };

    const v31 = metrics.cvssMetricV31?.[0]?.cvssData;
    const v30 = metrics.cvssMetricV30?.[0]?.cvssData;
    const v40 = metrics.cvssMetricV40?.[0]?.cvssData;
    const v2 = metrics.cvssMetricV2?.[0];
    const v2Data = v2?.cvssData;

    const score = v31?.baseScore ?? v30?.baseScore ?? v40?.baseScore ?? v2Data?.baseScore ?? null;
    let severity = v31?.baseSeverity ?? v30?.baseSeverity ?? v40?.baseSeverity ?? v2?.baseSeverity ?? v2Data?.baseSeverity ?? null;

    if (!severity || severity === 'UNKNOWN') {
        if (score !== null && score !== undefined) {
            const num = Number(score);
            if (num >= 9.0) severity = 'CRITICAL';
            else if (num >= 7.0) severity = 'HIGH';
            else if (num >= 4.0) severity = 'MEDIUM';
            else if (num > 0) severity = 'LOW';
            else severity = 'INFORMATIONAL';
        } else {
            severity = 'INFORMATIONAL';
        }
    }

    return {
        score: score !== null && score !== undefined ? Number(score).toFixed(1) : null,
        severity: String(severity).toUpperCase()
    };
}

const KNOWN_EDGE_INFRA = {
    'esf': { name: 'Google Frontend (ESF)', desc: 'Enterprise Service Fabric / Edge Load Balancer', isEdge: true },
    'gws': { name: 'Google Web Server (GWS)', desc: 'Google Cloud Edge Infrastructure', isEdge: true },
    'cloudflare': { name: 'Cloudflare Edge', desc: 'Cloudflare Anycast Proxy & WAF', isEdge: true },
    'cloudflare-nginx': { name: 'Cloudflare Edge', desc: 'Cloudflare Anycast Proxy & WAF', isEdge: true },
    'akamaighost': { name: 'Akamai Edge (GHost)', desc: 'Akamai Intelligent Edge Platform', isEdge: true },
    'akamaistorage': { name: 'Akamai NetStorage', desc: 'Akamai Content Delivery Network', isEdge: true },
    'amazons3': { name: 'Amazon S3', desc: 'AWS Object Storage Edge', isEdge: true },
    'github.com': { name: 'GitHub Edge', desc: 'GitHub High-Availability Infrastructure', isEdge: true },
    'vercel': { name: 'Vercel Edge', desc: 'Vercel Serverless Edge Network', isEdge: true },
    'netlify': { name: 'Netlify Edge', desc: 'Netlify High-Performance CDN', isEdge: true },
    'fastly': { name: 'Fastly Edge', desc: 'Fastly Real-Time CDN', isEdge: true },
    'envoy': { name: 'Envoy Proxy', desc: 'High-performance cloud-native edge proxy', isEdge: true }
};

function parseServerBanner(rawBanner) {
    if (!rawBanner || typeof rawBanner !== 'string') return null;
    const trimmed = rawBanner.trim();
    const lower = trimmed.toLowerCase();

    for (const [key, info] of Object.entries(KNOWN_EDGE_INFRA)) {
        if (lower === key || lower.startsWith(key + '/') || lower.startsWith(key + ' ') || lower.startsWith(key + '-')) {
            return {
                raw: trimmed,
                name: info.name,
                version: null,
                isEdge: true,
                desc: info.desc,
                masked: true
            };
        }
    }

    const match = trimmed.match(/^([A-Za-z0-9_\-\.]+)(?:[\/\s]([0-9]+(?:\.[0-9]+)+(?:[a-zA-Z0-9_\-]*)?))?/);
    if (match) {
        const name = match[1];
        const version = match[2] || null;
        return {
            raw: trimmed,
            name: name,
            version: version,
            isEdge: false,
            desc: `${name} Web Server`,
            masked: !version
        };
    }

    return {
        raw: trimmed,
        name: trimmed,
        version: null,
        isEdge: false,
        desc: trimmed,
        masked: true
    };
}

async function queryNvd(searchQuery, softwareFilter = null) {
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(searchQuery)}`;
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'GuardianReconScanner/2.0 (Security Intelligence Scanner)' },
            timeout: 9000
        });
        
        const vulnerabilities = response.data.vulnerabilities || [];
        const foundCves = [];

        vulnerabilities.forEach(item => {
            const cve = item.cve;
            const cveId = cve.id;
            const description = cve.descriptions.find(d => d.lang === 'en')?.value || 'No description available.';
            
            // Software relevance verification to eliminate false-positive keyword collisions
            if (softwareFilter) {
                const descLower = description.toLowerCase();
                const filterLower = softwareFilter.toLowerCase();
                const configMatches = JSON.stringify(cve.configurations || {}).toLowerCase().includes(filterLower);
                if (!descLower.includes(filterLower) && !configMatches) {
                    return;
                }
            }

            const { score, severity } = extractCvss(cve.metrics);

            foundCves.push({
                id: cveId,
                score: score,
                severity: severity,
                description: description
            });
        });
        return foundCves;
    } catch (error) {
        console.error(`❌ API Error for "${searchQuery}": ${error.message}`);
        return null;
    }
}

async function checkVulnerabilities(softwareList) {
    const scanResults = [];
    const targets = softwareList.slice(0, 5);
    console.log(`\n🔍 Initiating live API analysis for ${targets.length} applications...`);

    for (let app of targets) {
        const cleanName = sanitizeName(app.name);
        let searchQuery = `${cleanName} ${app.version}`.trim();
        console.log(`📡 Querying NVD (Primary): "${searchQuery}"...`);
        
        let foundCves = await queryNvd(searchQuery, cleanName);
        
        if (foundCves && foundCves.length === 0 && cleanName.length > 2) {
            console.log(`⚠️  0 CVEs found. Retrying Fallback: "${cleanName}"...`);
            await sleep(6000);
            const fallbackCves = await queryNvd(cleanName, cleanName);
            if (fallbackCves) foundCves = fallbackCves;
        }

        if (foundCves) {
            console.log(`✅ Completed. Found ${foundCves.length} potential CVEs.`);
            scanResults.push({
                app_name: app.name,
                version: app.version,
                vulnerabilities_found: foundCves.length,
                cves: foundCves.slice(0, 3)
            });
        } else {
            scanResults.push({ app_name: app.name, version: app.version, error: "Scan dropped due to network timeout." });
        }
        await sleep(6000);
    }
    return scanResults;
}

app.post('/api/scan', async (req, res) => {
    const metadata = req.body.agent_metadata || { hostname: "Unknown Host", os: "Unknown OS", scan_time_utc: new Date().toISOString() };
    const telemetry = req.body.edr_telemetry || req.body;

    if (!telemetry) {
        return res.status(400).json({ error: "Invalid EDR payload format." });
    }

    console.log(`\n🔥 EDR Telemetry received from: ${metadata.hostname} (${metadata.os})`);
    
    let riskLevel = telemetry.risk_level || "LOW";
    const dangerousPorts = [21, 23, 3389, 445]; // FTP, Telnet, RDP, SMB

    const portsList = Array.isArray(telemetry.open_ports) 
        ? telemetry.open_ports.map(p => typeof p === 'object' ? p.port : p)
        : [];

    const exposedDangerousPorts = portsList.filter(port => dangerousPorts.includes(port));
    const anomalies = Array.isArray(telemetry.suspicious_processes) ? telemetry.suspicious_processes : [];
    
    if (anomalies.length > 0 || exposedDangerousPorts.length > 0) {
        riskLevel = "CRITICAL";
    } else if (portsList.length > 15) {
        riskLevel = "ELEVATED";
    }

    console.log(`📡 Threat Analysis: ${portsList.length} Open Ports, ${anomalies.length} Anomalies.`);
    console.log(`⚠️  System Risk Level: ${riskLevel}`);

    // Store in memory AND persist to disk so restarts don't wipe the report
    latestScanReport = {
        device: metadata.hostname,
        timestamp: metadata.scan_time_utc,
        type: "EDR_RECON",
        risk_level: riskLevel,
        report: telemetry
    };

    if (isMongoConnected && ReportModel) {
        try {
            await ReportModel.findOneAndUpdate(
                { device: metadata.hostname },
                latestScanReport,
                { upsert: true, new: true }
            );
        } catch (dbErr) {
            console.error("MongoDB report save error:", dbErr.message);
        }
    }

    try {
        fs.writeFileSync(REPORT_FILE, JSON.stringify(latestScanReport, null, 2));
    } catch (err) {
        console.error("Warning: Could not save scan report to disk:", err.message);
    }

    res.status(200).json({
        status: "EDR Scan completed",
        device: metadata.hostname,
        risk_level: riskLevel,
        anomalies_found: anomalies.length
    });
});

// --- UPGRADED: REMOTE URL SCANNER ENGINE WITH SMART RECON & NVD INTEGRATION ---
app.post('/api/scan-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Missing target URL." });
    }

    try {
        console.log(`\n🌐 Initiating remote reconnaissance on: ${url}`);
        const target = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        
        const response = await axios.get(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GuardianRecon/2.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        const headers = response.headers;
        const issues = [];
        const passedChecks = [];

        // 1. Comprehensive Security Header Audit
        if (headers['strict-transport-security']) {
            passedChecks.push({
                name: "Strict-Transport-Security (HSTS)",
                detail: "Enforces TLS encryption and guards against SSL-stripping MITM attacks."
            });
        } else {
            issues.push("Missing Strict-Transport-Security (HSTS) Header (Vulnerable to downgrade attacks)");
        }

        const csp = headers['content-security-policy'] || '';
        const xfo = headers['x-frame-options'];
        if (xfo || csp.includes('frame-ancestors')) {
            passedChecks.push({
                name: "Clickjacking Defense",
                detail: xfo ? `X-Frame-Options: ${xfo}` : "CSP frame-ancestors directive active."
            });
        } else {
            issues.push("Missing X-Frame-Options Header (Clickjacking & UI redressing risk)");
        }

        if (headers['content-security-policy']) {
            passedChecks.push({
                name: "Content-Security-Policy (CSP)",
                detail: "Strict script & asset loading rules mitigate Cross-Site Scripting (XSS)."
            });
        } else {
            issues.push("Missing Content-Security-Policy (CSP) Header (Elevated XSS risk)");
        }

        if (headers['x-content-type-options']) {
            passedChecks.push({
                name: "MIME-Type Sniffing Protection",
                detail: "X-Content-Type-Options: nosniff active."
            });
        } else {
            issues.push("Missing X-Content-Type-Options Header (MIME-sniffing drive-by risk)");
        }

        if (headers['permissions-policy']) {
            passedChecks.push({
                name: "Permissions-Policy",
                detail: "Restricts browser sensor and hardware API delegation."
            });
        }

        if (headers['referrer-policy']) {
            passedChecks.push({
                name: "Referrer-Policy",
                detail: `Referrer policy configured (${headers['referrer-policy']}).`
            });
        }

        // 2. Automated Version Banner & Technology Stack Recon
        console.log(`\n🔍 Parsing headers for technology banners...`);
        const serverRaw = headers['server'];
        const poweredRaw = headers['x-powered-by'];
        const serverInfo = parseServerBanner(serverRaw);
        const poweredInfo = parseServerBanner(poweredRaw);

        const techToQuery = [];

        if (serverInfo) {
            if (serverInfo.version) {
                // Exact version disclosed -> Security risk (Information Disclosure)
                issues.push(`Server Banner Discloses Exact Version: ${serverInfo.name} ${serverInfo.version} (Information Disclosure - CWE-200)`);
                techToQuery.push({
                    name: serverInfo.name,
                    version: serverInfo.version,
                    query: `${serverInfo.name} ${serverInfo.version}`
                });
            } else {
                // Version is masked/hidden or behind Cloud/CDN edge -> Positive security posture
                passedChecks.push({
                    name: "Server Version Obfuscation",
                    detail: `${serverInfo.name} banner concealed or protected behind edge proxy. Direct version queries prevented.`
                });
            }
        }

        if (poweredInfo) {
            if (poweredInfo.version) {
                issues.push(`Runtime Banner Discloses Exact Version: ${poweredInfo.name} ${poweredInfo.version} (Information Disclosure)`);
                techToQuery.push({
                    name: poweredInfo.name,
                    version: poweredInfo.version,
                    query: `${poweredInfo.name} ${poweredInfo.version}`
                });
            } else {
                passedChecks.push({
                    name: "Runtime Obfuscation",
                    detail: `${poweredInfo.name} runtime detected without explicit version disclosure.`
                });
            }
        }

        // 3. Query NVD ONLY for Explicitly Exposed Versions (Eliminates false positives like ESF -> EsForum)
        const discoveredCves = [];
        if (techToQuery.length > 0) {
            console.log(`📡 Discovered exposed versions: ${techToQuery.map(t => t.query).join(', ')}. Querying NVD...`);
            
            for (let tech of techToQuery) {
                const cves = await queryNvd(tech.query, tech.name);
                if (cves && cves.length > 0) {
                    discoveredCves.push({
                        technology: `${tech.name} ${tech.version}`,
                        cve_count: cves.length,
                        top_cves: cves.slice(0, 3)
                    });
                }
                await sleep(5000); 
            }
        } else {
            console.log(`🛡️ No exposed software versions found. Skipping NVD lookup to avoid false positives.`);
        }

        // 4. Determine Overall Security Posture and Grade
        let securityGrade = "A+";
        let posture = "HARDENED & SECURE";

        if (discoveredCves.length > 0) {
            securityGrade = "F";
            posture = "CRITICAL VULNERABILITIES DETECTED";
        } else if (issues.length === 0) {
            securityGrade = "A+";
            posture = "HARDENED & SECURE";
        } else if (issues.length === 1) {
            securityGrade = "A";
            posture = "GOOD SECURITY POSTURE";
        } else if (issues.length <= 2) {
            securityGrade = "B";
            posture = "MODERATE RISK";
        } else {
            securityGrade = "C";
            posture = "ELEVATED RISK";
        }

        console.log(`✅ Recon complete for ${target}. Grade: ${securityGrade} | ${issues.length} issues | ${discoveredCves.length} vulnerable software versions.`);

        res.status(200).json({
            target: target,
            server: serverInfo ? serverInfo.name : (serverRaw || "Unknown"),
            server_info: serverInfo,
            status_code: response.status,
            security_grade: securityGrade,
            posture: posture,
            vulnerabilities_found: issues.length + discoveredCves.reduce((acc, curr) => acc + curr.cve_count, 0),
            issues: issues,
            passed_checks: passedChecks,
            cves: discoveredCves
        });

    } catch (error) {
        console.error(`❌ Target unreachable: ${error.message}`);
        res.status(500).json({ error: `Target unreachable (${error.message}). The domain might be down or blocking automated requests.` });
    }
});

// --- TELEMETRY RETRIEVAL ENDPOINTS ---
// Get list of all distinct scanned devices
app.get('/api/devices', async (req, res) => {
    try {
        if (isMongoConnected && ReportModel) {
            const devices = await ReportModel.find({}, 'device timestamp risk_level').sort({ _id: -1 });
            return res.status(200).json({ devices });
        }
        if (latestScanReport) {
            return res.status(200).json({ 
                devices: [{ 
                    device: latestScanReport.device, 
                    timestamp: latestScanReport.timestamp, 
                    risk_level: latestScanReport.risk_level 
                }] 
            });
        }
        res.status(200).json({ devices: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retrieve telemetry (supports optional ?device=HOSTNAME or gets latest)
app.get('/api/reports', async (req, res) => {
    try {
        const { device } = req.query;

        if (isMongoConnected && ReportModel) {
            const filter = device ? { device } : {};
            const doc = await ReportModel.findOne(filter).sort({ _id: -1 });
            if (doc) {
                return res.status(200).json({ data: doc });
            }
        }

        // If not in Mongo or not connected, check memory/file
        if (!latestScanReport) {
            return res.status(404).json({ error: "No telemetry data available yet." });
        }

        if (device && latestScanReport.device !== device) {
            return res.status(404).json({ error: `No report found for device: ${device}` });
        }
        
        res.status(200).json({ data: latestScanReport });
    } catch (err) {
        console.error("Telemetry retrieval error:", err.message);
        if (latestScanReport) {
            return res.status(200).json({ data: latestScanReport });
        }
        res.status(500).json({ error: "Internal server error retrieving telemetry." });
    }
});

// The Authentication Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing encrypted comms or security key." });
    }

    try {
        if (isMongoConnected && UserModel) {
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: "Invalid operator credentials." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid operator credentials." });
            }

            console.log(`🔓 Operator [${user.name}] successfully authenticated via MongoDB Atlas.`);
            return res.status(200).json({ 
                message: "Authentication successful.", 
                operator: { id: user.id, name: user.name, email: user.email } 
            });
        }

        // Local storage fallback
        const users = readUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: "Invalid operator credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid operator credentials." });
        }

        console.log(`🔓 Operator [${user.name}] successfully authenticated via local storage.`);
        res.status(200).json({ 
            message: "Authentication successful.", 
            operator: { id: user.id, name: user.name, email: user.email } 
        });
        
    } catch (error) {
        console.error(`❌ Authentication Failure: ${error.message}`);
        res.status(500).json({ error: "Internal server error during authentication." });
    }
});

app.listen(port, () => {
    console.log(`Backend brain listening on http://localhost:${port}`);
});