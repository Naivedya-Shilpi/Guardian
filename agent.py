import winreg
import json
import platform
import datetime
import urllib.request

def get_installed_software():
    software_list = []
    reg_paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]
    
    # Add any other annoying keywords you see in your terminal to this list
    noise_keywords = [
        "nvidia", 
        "microsoft visual c++", 
        "hp ", 
        "redistributable", 
        "update", 
        "telemetry",
        "documentation",
        "prerequisites"
    ]
    
    # WE START THE LOOP HERE
    for reg_path in reg_paths:
        try:
            # It will open the 64-bit path first, then loop back and open the 32-bit path
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_path)
            
            for i in range(0, winreg.QueryInfoKey(key)[0]):
                try:
                    subkey_name = winreg.EnumKey(key, i)
                    subkey = winreg.OpenKey(key, subkey_name)
                    
                    name, _ = winreg.QueryValueEx(subkey, "DisplayName")
                    version, _ = winreg.QueryValueEx(subkey, "DisplayVersion")
                    
                    # The Filtering Logic
                    is_noise = False
                    for keyword in noise_keywords:
                        if keyword.lower() in name.lower():
                            is_noise = True
                            break 
                    
                    if not is_noise:
                        software_list.append({"name": name, "version": version})
                        
                except EnvironmentError:
                    continue
                    
        except Exception as e:
            # Modified this slightly to tell you WHICH path failed if it crashes
            print(f"Error accessing registry path {reg_path}: {e}")
            
    return software_list

def generate_payload(software_list):
    # Gather system metadata to give the backend context
    hostname = platform.node() # Grabs your PC name (e.g., DESKTOP-VICTUS)
    os_version = f"{platform.system()} {platform.release()}"
    timestamp = datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z")

    # Wrap the software list in a structured JSON envelope
    payload = {
        "agent_metadata": {
            "hostname": hostname,
            "os": os_version,
            "scan_time_utc": timestamp
        },
        "scanned_software": software_list
    }
    
    # Convert the Python dictionary into a formatted JSON string
    return json.dumps(payload, indent=4)

# --- Execution ---
print("Scanning for installed software (Clean Output)...\n")
apps = get_installed_software()

print("Formatting data into JSON payload...\n")
json_payload = generate_payload(apps)

# Print the final payload to verify it looks correct
print(json_payload)

# --- Send the Payload to the Backend ---
print("Firing payload to the backend server...\n")
req = urllib.request.Request("http://localhost:3000/api/scan", data=json_payload.encode('utf-8'), headers={'Content-Type': 'application/json'})
response = urllib.request.urlopen(req)
print(f"Backend Status: {response.read().decode('utf-8')}")