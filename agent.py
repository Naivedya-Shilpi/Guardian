import json
import platform
import datetime
import urllib.request
import subprocess
import os
import sys
import psutil

# Ensure terminal output encoding doesn't crash on standard Windows cp1252 consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Recognized dangerous / notable ports and plain-English descriptions for non-technical users
PORT_DATABASE = {
    445: {
        "service": "SMB File Sharing",
        "risk": "HIGH",
        "desc": "Windows File & Printer Sharing. If exposed to Public Wi-Fi, attackers can attempt unauthorized file access or exploit network bugs (e.g. WannaCry vector)."
    },
    135: {
        "service": "RPC Endpoint Mapper",
        "risk": "MEDIUM",
        "desc": "Windows Remote Procedure Call. Often queried by network scanners to enumerate local services and OS version."
    },
    139: {
        "service": "NetBIOS Session Service",
        "risk": "MEDIUM",
        "desc": "Legacy Windows networking service. Can leak device and workgroup information to anyone on the same Wi-Fi."
    },
    3389: {
        "service": "Remote Desktop (RDP)",
        "risk": "CRITICAL",
        "desc": "Allows remote graphical access to your PC. If exposed without strong passwords, attackers can attempt brute-force remote takeover."
    },
    21: {
        "service": "FTP (File Transfer)",
        "risk": "HIGH",
        "desc": "Unencrypted file transfer protocol. Usernames and passwords are sent over the network in plain text."
    },
    23: {
        "service": "Telnet",
        "risk": "CRITICAL",
        "desc": "Legacy unencrypted terminal protocol. Highly insecure; sends all commands and passwords in clear text."
    },
    5037: {
        "service": "Android Debug Bridge (ADB)",
        "risk": "MEDIUM",
        "desc": "Developer connection for Android devices. If bound publicly, devices connected to this PC could be remotely manipulated."
    },
    27017: {
        "service": "MongoDB Database",
        "risk": "HIGH",
        "desc": "Local database service. If exposed to 0.0.0.0, anyone on your network can attempt connecting to your database."
    },
    3306: {
        "service": "MySQL Database",
        "risk": "HIGH",
        "desc": "Local relational database. Should only listen on localhost (127.0.0.1) unless specifically hosting a network database."
    },
    5432: {
        "service": "PostgreSQL Database",
        "risk": "HIGH",
        "desc": "Local database server. Insecure if bound to 0.0.0.0 without strict authentication."
    },
    3000: {
        "service": "Dev Web Server (Node/React)",
        "risk": "LOW",
        "desc": "Active web application development port."
    },
    8080: {
        "service": "HTTP Alternate Server",
        "risk": "LOW",
        "desc": "Common development or proxy web server port."
    },
    8000: {
        "service": "Dev Server / Web Proxy",
        "risk": "LOW",
        "desc": "Common Python/Node development server port."
    }
}

def get_listening_ports_detailed():
    """
    Identifies all listening ports, their process names, and whether
    they are exposed to the public network/Wi-Fi (0.0.0.0) or safe localhost (127.0.0.1).
    """
    detailed_ports = []
    seen = set()

    try:
        connections = psutil.net_connections(kind='inet')
    except (psutil.AccessDenied, Exception):
        connections = []

    for conn in connections:
        if conn.status == 'LISTEN':
            ip = conn.laddr.ip
            port = conn.laddr.port
            key = (ip, port)
            if key in seen:
                continue
            seen.add(key)

            # Determine process name
            proc_name = "System / Protected"
            if conn.pid:
                try:
                    proc_name = psutil.Process(conn.pid).name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            is_public_bind = ip in ("0.0.0.0", "::", "")
            port_info = PORT_DATABASE.get(port, {})
            service = port_info.get("service", f"Port {port} Service")
            risk = port_info.get("risk", "LOW")
            
            # If bound to 0.0.0.0, elevate risk for database/admin services
            if is_public_bind and port in (445, 3389, 21, 23):
                risk = "CRITICAL"
            elif is_public_bind and port in (135, 139, 27017, 3306, 5432):
                risk = "HIGH"

            desc = port_info.get("desc", f"Active listening socket managed by {proc_name}.")
            if is_public_bind and "desc" not in port_info:
                desc = f"Bound to all network interfaces (0.0.0.0). Anyone on your current Wi-Fi network can send packets to {proc_name} on this port."

            detailed_ports.append({
                "port": port,
                "ip": ip,
                "process_name": proc_name,
                "service": service,
                "exposed_to_network": is_public_bind,
                "risk": risk,
                "explanation": desc
            })

    # Sort ports: Dangerous/High first, then ascending by port number
    risk_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    detailed_ports.sort(key=lambda p: (risk_rank.get(p["risk"], 4), p["port"]))
    return detailed_ports

def audit_os_hardening():
    """
    Performs focused security checks on Windows configuration without crawling files.
    """
    vulnerabilities = []

    # 1. Windows Firewall Check
    try:
        res = subprocess.run(['netsh', 'advfirewall', 'show', 'allprofiles', 'state'], capture_output=True, text=True, timeout=5)
        out = res.stdout
        if "State                                 OFF" in out or "State OFF" in out:
            vulnerabilities.append({
                "check": "Windows Firewall",
                "status": "VULNERABLE",
                "severity": "CRITICAL",
                "detail": "Windows Firewall is turned OFF on one or more network profiles! Incoming network connections are not filtered.",
                "recommendation": "Turn Windows Firewall ON immediately in Windows Security settings."
            })
        else:
            vulnerabilities.append({
                "check": "Windows Firewall",
                "status": "PASSED",
                "severity": "LOW",
                "detail": "Windows Firewall is ACTIVE across all network profiles (Domain, Private, Public).",
                "recommendation": None
            })
    except Exception:
        vulnerabilities.append({
            "check": "Windows Firewall",
            "status": "UNKNOWN",
            "severity": "LOW",
            "detail": "Unable to verify firewall state via netsh.",
            "recommendation": None
        })

    # 2. User Account Control (UAC) Check
    if platform.system() == "Windows":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System") as k:
                uac_val = winreg.QueryValueEx(k, "EnableLUA")[0]
                if uac_val == 0:
                    vulnerabilities.append({
                        "check": "User Account Control (UAC)",
                        "status": "VULNERABLE",
                        "severity": "HIGH",
                        "detail": "UAC is DISABLED. Malware and unauthorized scripts can run as Administrator without prompt.",
                        "recommendation": "Re-enable User Account Control (UAC) in Windows Control Panel to guard against silent privilege escalation."
                    })
                else:
                    vulnerabilities.append({
                        "check": "User Account Control (UAC)",
                        "status": "PASSED",
                        "severity": "LOW",
                        "detail": "UAC is active, prompting for administrator approval on system changes.",
                        "recommendation": None
                    })
        except Exception:
            pass

        # 3. Remote Desktop (RDP) Exposure Check
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"System\CurrentControlSet\Control\Terminal Server") as k:
                rdp_denied = winreg.QueryValueEx(k, "fDenyTSConnections")[0]
                if rdp_denied == 0:
                    vulnerabilities.append({
                        "check": "Remote Desktop (RDP)",
                        "status": "WARNING",
                        "severity": "MEDIUM",
                        "detail": "Remote Desktop is ENABLED on this PC. Attackers on the same network could attempt password guessing.",
                        "recommendation": "If you don't remotely access this computer, turn off Remote Desktop in Windows Settings."
                    })
                else:
                    vulnerabilities.append({
                        "check": "Remote Desktop (RDP)",
                        "status": "PASSED",
                        "severity": "LOW",
                        "detail": "Remote Desktop incoming connections are blocked.",
                        "recommendation": None
                    })
        except Exception:
            pass

        # 4. Windows Defender / Real-Time Antivirus Protection
        try:
            cmd = ['powershell', '-NoProfile', '-Command', 'Get-MpComputerStatus | Select-Object -Property RealTimeProtectionEnabled | ConvertTo-Json']
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if '"RealTimeProtectionEnabled":  false' in res.stdout or '"RealTimeProtectionEnabled": false' in res.stdout:
                vulnerabilities.append({
                    "check": "Real-Time Antivirus Protection",
                    "status": "VULNERABLE",
                    "severity": "CRITICAL",
                    "detail": "Real-time antivirus scanning is DISABLED. The device is unprotected against active malicious files.",
                    "recommendation": "Enable Real-time protection in Windows Security."
                })
            elif '"RealTimeProtectionEnabled":  true' in res.stdout or '"RealTimeProtectionEnabled": true' in res.stdout:
                vulnerabilities.append({
                    "check": "Real-Time Antivirus Protection",
                    "status": "PASSED",
                    "severity": "LOW",
                    "detail": "Real-time antivirus protection is actively monitoring running applications.",
                    "recommendation": None
                })
        except Exception:
            pass

        # 5. Guest Account Status
        try:
            res = subprocess.run(['net', 'user', 'guest'], capture_output=True, text=True, timeout=5)
            if 'Account active               Yes' in res.stdout:
                vulnerabilities.append({
                    "check": "Guest Account",
                    "status": "VULNERABLE",
                    "severity": "MEDIUM",
                    "detail": "Built-in Guest account is ACTIVE without password authentication.",
                    "recommendation": "Disable the Guest account via 'net user guest /active:no'."
                })
            else:
                vulnerabilities.append({
                    "check": "Guest Account",
                    "status": "PASSED",
                    "severity": "LOW",
                    "detail": "Built-in Guest account is inactive.",
                    "recommendation": None
                })
        except Exception:
            pass

    return vulnerabilities

def find_anomalies():
    """
    Checks active processes for known notorious tools without scanning disk files.
    """
    suspicious = []
    blacklisted = ['mimikatz.exe', 'nc.exe', 'cain.exe', 'crypto_miner.exe', 'trojan.exe', 'psexec.exe']
    
    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name']
            if name and name.lower() in blacklisted:
                suspicious.append(name)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
            
    return suspicious

def generate_payload():
    hostname = platform.node() 
    os_version = f"{platform.system()} {platform.release()}"
    timestamp = datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z")

    ports = get_listening_ports_detailed()
    system_vulns = audit_os_hardening()
    anomalies = find_anomalies()

    # Calculate overall risk level & score
    critical_count = sum(1 for p in ports if p["risk"] == "CRITICAL") + sum(1 for v in system_vulns if v.get("severity") == "CRITICAL" and v["status"] == "VULNERABLE")
    high_count = sum(1 for p in ports if p["risk"] == "HIGH") + sum(1 for v in system_vulns if v.get("severity") == "HIGH" and v["status"] == "VULNERABLE")
    
    if len(anomalies) > 0 or critical_count > 0:
        risk_level = "CRITICAL"
        security_score = max(35, 70 - (critical_count * 15 + high_count * 10))
    elif high_count > 0:
        risk_level = "ELEVATED"
        security_score = max(60, 85 - high_count * 8)
    else:
        risk_level = "LOW"
        security_score = 95

    # Compile actionable recommendations
    recommendations = []
    for v in system_vulns:
        if v["status"] in ("VULNERABLE", "WARNING") and v.get("recommendation"):
            recommendations.append({
                "title": f"Fix {v['check']}",
                "severity": v.get("severity", "MEDIUM"),
                "advice": v["recommendation"]
            })

    for p in ports:
        if p["risk"] in ("CRITICAL", "HIGH") and p["exposed_to_network"]:
            recommendations.append({
                "title": f"Protect Exposed {p['service']} (Port {p['port']})",
                "severity": p["risk"],
                "advice": f"Port {p['port']} ({p['service']}) is bound to 0.0.0.0. If you are on Public Wi-Fi, ensure your network profile is set to 'Public' so Windows blocks unauthorized inbound access."
            })

    # Raw port numbers for backward compatibility
    raw_ports = [p["port"] for p in ports]

    payload = {
        "agent_metadata": {
            "hostname": hostname,
            "os": os_version,
            "scan_time_utc": timestamp
        },
        "edr_telemetry": {
            "security_score": security_score,
            "risk_level": risk_level,
            "open_ports": raw_ports,
            "open_ports_detailed": ports,
            "system_vulnerabilities": system_vulns,
            "suspicious_processes": anomalies,
            "recommendations": recommendations,
            "summary": {
                "total_open_ports": len(ports),
                "public_ports_count": sum(1 for p in ports if p["exposed_to_network"]),
                "dangerous_ports_count": critical_count + high_count,
                "checks_passed": sum(1 for v in system_vulns if v["status"] == "PASSED"),
                "checks_failed": sum(1 for v in system_vulns if v["status"] == "VULNERABLE")
            }
        }
    }
    
    return payload

def get_config_file_path():
    exe_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    return os.path.join(exe_dir, 'guardian_config.json')

def resolve_server_url():
    """
    Resolves the Guardian backend URL from:
    1. CLI argument: --server <url> or -s <url>
    2. Environment variable: GUARDIAN_SERVER_URL
    3. guardian_config.json in the executable directory or current working directory
    4. Fallback: http://localhost:3000
    """
    # 1. CLI argument
    for i, arg in enumerate(sys.argv):
        if arg in ('--server', '-s') and i + 1 < len(sys.argv):
            url = sys.argv[i + 1].strip().rstrip('/')
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            return url

    # 2. Environment variable
    env_url = os.environ.get('GUARDIAN_SERVER_URL')
    if env_url and env_url.strip():
        url = env_url.strip().rstrip('/')
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        return url

    # 3. guardian_config.json
    cfg_paths = [
        get_config_file_path(),
        os.path.join(os.getcwd(), 'guardian_config.json')
    ]
    for p in cfg_paths:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    if 'server_url' in cfg and cfg['server_url'].strip():
                        url = cfg['server_url'].strip().rstrip('/')
                        if not url.startswith(('http://', 'https://')):
                            url = 'https://' + url
                        return url
            except Exception:
                pass

    # 4. Default fallback
    return "http://localhost:3000"

def save_server_url(url):
    try:
        cfg_path = get_config_file_path()
        with open(cfg_path, 'w', encoding='utf-8') as f:
            json.dump({"server_url": url}, f, indent=2)
        print(f"[+] Saved server URL to {cfg_path}")
    except Exception:
        pass

def transmit_telemetry(server_url, payload_json):
    endpoint = f"{server_url}/api/scan"
    print(f"\n[>>] Transmitting telemetry to Guardian Command Center ({endpoint})...")
    req = urllib.request.Request(
        endpoint,
        data=payload_json.encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read().decode('utf-8')

# --- Execution ---
if __name__ == "__main__":
    print("=" * 60)
    print("     GUARDIAN PROTOCOL - ENDPOINT VULNERABILITY AUDIT")
    print("=" * 60)
    print("\n[1/3] Mapping listening ports & network exposure...")
    print("[2/3] Auditing OS security posture (Firewall, Defender, UAC)...")
    print("[3/3] Inspecting active memory for unauthorized anomalies...")
    
    data = generate_payload()
    telemetry = data["edr_telemetry"]
    metadata = data["agent_metadata"]
    
    print("\n" + "-" * 60)
    print(f"Device: {metadata['hostname']} ({metadata['os']})")
    print(f"Overall Risk Level: {telemetry['risk_level']} (Security Score: {telemetry['security_score']}/100)")
    print(f"Open Ports Detected: {telemetry['summary']['total_open_ports']} ({telemetry['summary']['public_ports_count']} bound to 0.0.0.0/Wi-Fi)")
    print(f"Security Hardening Checks: {telemetry['summary']['checks_passed']} Passed, {telemetry['summary']['checks_failed']} Vulnerable")
    print(f"Rogue Process Anomalies: {len(telemetry['suspicious_processes'])}")
    print("-" * 60)

    # Send payload to backend
    server_url = resolve_server_url()
    json_payload = json.dumps(data, indent=2)
    transmitted = False

    try:
        status_text = transmit_telemetry(server_url, json_payload)
        print(f"[+] SUCCESS: Telemetry successfully synchronized with Guardian Command Center!")
        print(f"    Backend Response: {status_text}")
        transmitted = True
    except Exception as e:
        print(f"\n[!] Transmission Failed to {server_url}: {e}")
        
        # If running on remote PC where localhost has no server, prompt for cloud URL
        if "localhost" in server_url or "127.0.0.1" in server_url:
            print("\n" + "*" * 60)
            print("  [?] Running on a remote machine without local backend?")
            print("  Enter your deployed Guardian Backend URL (Render / Railway)")
            print("  Example: https://guardian-backend.onrender.com")
            print("*" * 60)
            try:
                user_input = input("Enter Guardian Server URL (or press Enter to skip): ").strip()
                if user_input:
                    if not user_input.startswith(('http://', 'https://')):
                        user_input = 'https://' + user_input
                    new_url = user_input.rstrip('/')
                    try:
                        status_text = transmit_telemetry(new_url, json_payload)
                        print(f"\n[+] SUCCESS: Telemetry synchronized with cloud backend!")
                        print(f"    Backend Response: {status_text}")
                        save_server_url(new_url)
                        transmitted = True
                    except Exception as retry_err:
                        print(f"\n[!] Cloud Transmission Failed ({new_url}): {retry_err}")
            except (EOFError, KeyboardInterrupt):
                pass

    if transmitted:
        print(f"\n[i] Scan complete! Open your Guardian Dashboard to view your live report.")
    else:
        print("\n[!] Telemetry could not be delivered to the command center.")
        print("    Tip: You can pass your server URL directly:")
        print("    guardian-agent-v1.0.exe --server https://your-server.onrender.com")

    print("\n" + "=" * 60)
    # Pause so the console window does not immediately vanish on double-click
    try:
        input("Press Enter to exit...")
    except (EOFError, KeyboardInterrupt):
        pass