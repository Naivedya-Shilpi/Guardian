const express = require('express');
const cors = require('cors'); // ADDED: Allows your Next.js frontend to talk to this server
const axios = require('axios');
const bcrypt = require('bcryptjs'); // ADDED: Military-grade password hashing
const fs = require('fs'); // ADDED: File system access to write our mock database
const app = express();
const port = 3000;

// Open the gates for the frontend
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const USERS_DB = './users.json'; // Our local mock database
let latestScanReport = null; // Temporarily holding the latest intel in memory

// --- NEW: THE AUTHENTICATION ENGINE ---

// Helper function to read the local database
const readUsers = () => {
    if (!fs.existsSync(USERS_DB)) return [];
    const data = fs.readFileSync(USERS_DB);
    return JSON.parse(data);
};

// The Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required operator data." });
    }

    try {
        const users = readUsers();

        // Check if the operator already exists
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ error: "Identity already established for this comm channel." });
        }

        console.log(`\n🔒 Encrypting credentials for new operator: ${name}...`);
        
        // Hash the password with 10 salt rounds (standard secure practice)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the new user profile
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: hashedPassword, // Storing the HASH, never the raw password
            registeredAt: new Date().toISOString()
        };

        // Save to our "database"
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

async function queryNvd(searchQuery) {
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(searchQuery)}`;
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'VulnerabilityScannerAgent/1.0' }
        });
        
        const vulnerabilities = response.data.vulnerabilities || [];
        const foundCves = [];

        vulnerabilities.forEach(item => {
            const cve = item.cve;
            const cveId = cve.id;
            const description = cve.descriptions.find(d => d.lang === 'en')?.value || 'No description available.';
            
            let severity = 'UNKNOWN';
            const metrics = cve.metrics;
            if (metrics.cvssMetricV31) {
                severity = metrics.cvssMetricV31[0].cvssData.baseSeverity;
            } else if (metrics.cvssMetricV30) {
                severity = metrics.cvssMetricV30[0].cvssData.baseSeverity;
            }

            foundCves.push({ id: cveId, severity: severity, description: description });
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
        
        let foundCves = await queryNvd(searchQuery);
        
        if (foundCves && foundCves.length === 0 && cleanName.length > 2) {
            console.log(`⚠️  0 CVEs found. Retrying Fallback: "${cleanName}"...`);
            await sleep(6000);
            const fallbackCves = await queryNvd(cleanName);
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
    const metadata = req.body.agent_metadata;
    const software = req.body.scanned_software;

    console.log(`\n🔥 Payload received from: ${metadata.hostname}`);
    const vulnerabilitiesReport = await checkVulnerabilities(software);
    latestScanReport = {
        device: metadata.hostname,
        timestamp: new Date().toISOString(),
        report: vulnerabilitiesReport
    };

    res.status(200).json({
        status: "Scan completed",
        device: metadata.hostname,
        report: vulnerabilitiesReport
    });
});

// Endpoint for the Next.js frontend to fetch the latest report
app.get('/api/reports', (req, res) => {
    res.json({ data: latestScanReport });
});

app.listen(port, () => {
    console.log(`Backend brain listening on http://localhost:${port}`);
});

// The Authentication Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing encrypted comms or security key." });
    }

    try {
        const users = readUsers();
        
        // 1. Find the operator by email
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: "Invalid operator credentials." });
        }

        // 2. Mathematically compare the typed password against the hashed database password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid operator credentials." });
        }

        console.log(`🔓 Operator [${user.name}] successfully authenticated.`);
        
        // 3. Send success response (NEVER send the password hash back to the frontend)
        res.status(200).json({ 
            message: "Authentication successful.", 
            operator: { id: user.id, name: user.name, email: user.email } 
        });
        
    } catch (error) {
        console.error(`❌ Authentication Failure: ${error.message}`);
        res.status(500).json({ error: "Internal server error during authentication." });
    }
});