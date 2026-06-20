import asyncio
import logging
import requests
import json
from bleak import BleakScanner, BleakClient

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

import os

GHOSTNET_SERVICE_UUID = "f43f5e00-1234-5678-1234-567812345678"
GHOSTNET_CHAR_UUID = "f43f5e01-1234-5678-1234-567812345678"

# Load environment configurations
def load_backend_url():
    is_production = os.environ.get("IS_PRODUCTION", "false").lower() == "true"
    
    # Try parsing from backend/.env or local .env
    for path in ["../backend/.env", ".env", "ai/.env", "backend/.env"]:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        if line.startswith("IS_PRODUCTION="):
                            is_production = line.split("=", 1)[1].strip().strip('"').strip("'").lower() == "true"
            except Exception:
                pass
    
    var_name = "PROD_BACKEND_URL" if is_production else "LOCAL_BACKEND_URL"
    url = os.environ.get(var_name)
    
    if not url:
        for path in ["../backend/.env", ".env", "ai/.env", "backend/.env"]:
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        for line in f:
                            if line.startswith(f"{var_name}="):
                                url = line.split("=", 1)[1].strip().strip('"').strip("'")
                                break
                except Exception:
                    pass
            if url:
                break
                
    return url or "http://127.0.0.1:5000/api/emergency"

BACKEND_URL = load_backend_url()
logger.info(f"BLE Listener initialized with backend uplink URL: {BACKEND_URL}")


# Keep track of recently processed message IDs to avoid double-submitting
processed_messages = set()
# Keep track of active connection tasks to avoid duplicate concurrent connections to the same device
active_connections = set()

async def process_device(device):
    if device.address in active_connections:
        return
    active_connections.add(device.address)
    
    logger.info(f"Connecting to GhostNet Device: {device.name or 'Unknown'} ({device.address})...")
    try:
        async with BleakClient(device) as client:
            logger.info(f"Connected to {device.address} successfully! Reading characteristic...")
            
            # Read payload characteristic
            payload_bytes = await client.read_gatt_char(GHOSTNET_CHAR_UUID)
            payload_str = payload_bytes.decode('utf-8')
            logger.info(f"Raw data received: {payload_str}")
            
            # Parse JSON
            try:
                data = json.loads(payload_str)
            except json.JSONDecodeError:
                logger.error("Failed to parse payload as JSON.")
                return

            msg_id = data.get("id")
            if not msg_id:
                logger.error("Payload missing message ID.")
                return

            if msg_id in processed_messages:
                logger.info(f"Message {msg_id} already processed. Skipping.")
                return

            # Forward to local Express server
            logger.info(f"Forwarding alert to Express backend...")
            headers = {"Content-Type": "application/json"}
            response = requests.post(BACKEND_URL, json={
                "id": msg_id,
                "text": data.get("text"),
                "sender": f"BLE Mesh ({data.get('sender')})",
                "meshPath": data.get("path", []) + ["BLE Gateway"]
            }, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"Alert {msg_id} uploaded to ledger successfully!")
                processed_messages.add(msg_id)
            else:
                logger.error(f"Uplink upload failed: {response.status_code} - {response.text}")
                
    except Exception as e:
        logger.error(f"Failed to process device {device.address}: {e}")
    finally:
        active_connections.remove(device.address)

def detection_callback(device, advertisement_data):
    # Check if the service UUID is in the advertised UUIDs
    # Lowercase compare to match Bleak's representation
    uuids = [str(u).lower() for u in advertisement_data.service_uuids]
    if GHOSTNET_SERVICE_UUID.lower() in uuids:
        logger.info(f"Detected GhostNet BLE Broadcast from {device.address}!")
        # Run process_device in the main event loop
        asyncio.create_task(process_device(device))

async def start_ble_listener():
    logger.info("=========================================")
    logger.info(" GHOSTNET AI - OFFLINE BLUETOOTH RECEIVER ")
    logger.info("=========================================")
    logger.info("Scanning for Bluetooth Mesh devices...")

    scanner = BleakScanner(detection_callback=detection_callback)
    await scanner.start()
    
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("BLE Listener background task stopping...")
    finally:
        await scanner.stop()
        logger.info("BLE Listener stopped.")

if __name__ == "__main__":
    asyncio.run(start_ble_listener())

