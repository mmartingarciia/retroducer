import requests
import argparse
import time
import sys

def simulate_upload(ip, filename="test_song.mp3", size_kb=100):
    url = f"http://{ip}/upload"
    print(f"[{ip}] Simulating UPLOAD event...")
    print(f"Target: {url}")
    
    # Generate dummy content
    content = b"0" * (size_kb * 1024)
    files = {'file': (filename, content, 'application/octet-stream')}
    
    try:
        start_time = time.time()
        print(">> Sending file...")
        response = requests.post(url, files=files)
        end_time = time.time()
        
        if response.status_code == 200:
            print(f"<< Success! Upload complete in {end_time - start_time:.2f} seconds.")
            print(f"   Server says: {response.text}")
        else:
            print(f"!! Failed. Status code: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"!! Error: {e}")

def simulate_status(ip):
    url = f"http://{ip}/api/status"
    print(f"[{ip}] Simulating STATUS event...")
    print(f"Target: {url}")
    
    try:
        print(">> Checking status...")
        response = requests.get(url, timeout=2)
        
        if response.status_code == 200:
            print(f"<< Success! ESP32 is online.")
            print(f"   Data: {response.json()}")
        else:
            print(f"!! Failed. Status code: {response.status_code}")
            
    except Exception as e:
        print(f"!! Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Simulate events for ESP32.')
    parser.add_argument('--ip', type=str, default='192.168.4.1', help='IP address of the ESP32')
    parser.add_argument('--action', type=str, choices=['upload', 'status'], default='upload', help='Action to simulate')
    parser.add_argument('--size', type=int, default=50, help='Size of dummy file in KB (for upload)')
    
    args = parser.parse_args()
    
    if args.action == 'upload':
        simulate_upload(args.ip, size_kb=args.size)
    elif args.action == 'status':
        simulate_status(args.ip)
