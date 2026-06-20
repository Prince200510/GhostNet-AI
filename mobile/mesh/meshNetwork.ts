import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import GhostnetBle from '../modules/ghostnet-ble/src/GhostnetBleModule';

export interface MeshMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  path: string[]; // Traces route: e.g. ["A", "B", "C"]
}

const GHOSTNET_SERVICE_UUID = "f43f5e00-1234-5678-1234-567812345678";
const GHOSTNET_CHAR_UUID = "f43f5e01-1234-5678-1234-567812345678";

let BleManager: any = null;
let bleEmitter: any = null;
export let isHardwareActive = false;

// Global memory caches to store messages/decisions received/sent via BLE offline
export const meshMessagesCache: MeshMessage[] = [];
export const meshDecisionsCache: any[] = [];

try {
  // Attempt to load native BLE bindings (only exists in compiled APK/IPA, not Expo Go)
  const BleManagerLib = require('react-native-ble-manager').default;
  if (NativeModules.BleManager) {
    BleManager = BleManagerLib;
    bleEmitter = new NativeEventEmitter(NativeModules.BleManager);
    isHardwareActive = true;
    console.log("[GHOSTNET BLE] Native Bluetooth LE hardware libraries successfully bound.");
  } else {
    console.log("[GHOSTNET BLE] Native module missing in this runtime. Running in Sandbox SIMULATOR mode.");
  }
} catch (e) {
  console.log("[GHOSTNET BLE] Native BLE dependencies not compiled. Running in Sandbox SIMULATOR mode.");
}

function decodeBytesToString(bytes: any): string {
  let raw = bytes;
  if (typeof bytes === 'object' && bytes.data) {
    raw = bytes.data;
  }
  let str = '';
  for (let i = 0; i < raw.length; i++) {
    str += String.fromCharCode(raw[i]);
  }
  return str;
}

let isPhysicalBLEInitialized = false;

export async function initPhysicalBLE() {
  if (!isHardwareActive || isPhysicalBLEInitialized) return;
  isPhysicalBLEInitialized = true;
  
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    }

    await BleManager.start({ showAlert: false });
    console.log("[PHYSICAL BLE] Physical BLE hardware client started.");
    
    // Request permissions and enable adapter
    await BleManager.enableBluetooth();
    
    // Scan continuously (0 timeout) with no filter to bypass buggy vendor hardware filters
    await BleManager.scan([], 0, true);
    console.log("[PHYSICAL BLE] Wide BLE scan started.");
    
    const activeConnections = new Set<string>();
    
    // Register discovery listener
    bleEmitter.addListener('BleManagerDiscoverPeripheral', async (peripheral: any) => {
      if (!peripheral.id) return;
      
      // Filter for GhostNet Service UUID in discovery listener
      const advertisedUUIDs = peripheral.advertising?.serviceUUIDs || peripheral.advertising?.serviceUuids || [];
      const hasGhostNetService = advertisedUUIDs.some(
        (u: string) => u.toLowerCase() === GHOSTNET_SERVICE_UUID.toLowerCase()
      );
      
      if (!hasGhostNetService) return;
      
      if (activeConnections.has(peripheral.id)) return;
      activeConnections.add(peripheral.id);
      
      try {
        console.log(`[PHYSICAL BLE] Discovered GhostNet peripheral: ${peripheral.id}. Connecting...`);
        await BleManager.connect(peripheral.id);
        console.log(`[PHYSICAL BLE] Connected to ${peripheral.id}. Retrieving services...`);
        await BleManager.retrieveServices(peripheral.id);
        
        console.log(`[PHYSICAL BLE] Reading characteristic...`);
        const readData = await BleManager.read(
          peripheral.id,
          GHOSTNET_SERVICE_UUID,
          GHOSTNET_CHAR_UUID
        );
        
        const payloadString = decodeBytesToString(readData);
        console.log(`[PHYSICAL BLE] Read payload: ${payloadString}`);
        const msg: MeshMessage = JSON.parse(payloadString);
        
        processReceivedMessageGlobally(msg, peripheral.id);
      } catch (e) {
        console.warn(`[PHYSICAL BLE] Error processing peripheral ${peripheral.id}:`, e);
      } finally {
        try {
          await BleManager.disconnect(peripheral.id);
        } catch (e) {
          // Ignore
        }
        setTimeout(() => {
          activeConnections.delete(peripheral.id);
        }, 10000); // 10s cooldown
      }
    });
  } catch (err) {
    console.warn("[PHYSICAL BLE] Failed to init physical BLE hardware:", err);
    isPhysicalBLEInitialized = false;
  }
}

export function processReceivedMessageGlobally(msg: MeshMessage, fromNeighborId: string) {
  if (!msg || !msg.id) return;
  
  const existingIndex = meshMessagesCache.findIndex(m => m.id === msg.id);
  const updatedPath = msg.path.includes("BLE Receiver") ? msg.path : [...msg.path, "BLE Receiver"];
  const updatedMsg = { ...msg, path: updatedPath };

  if (existingIndex === -1) {
    meshMessagesCache.push(updatedMsg);
    
    // Create local ledger mock decision
    const mockDecision = {
      id: updatedMsg.id,
      messageHash: "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
      action: `Received via BLE: "${updatedMsg.text}"`,
      resource: "BLE Mesh Signal",
      priority: "OFFLINE",
      timestamp: Math.floor(updatedMsg.timestamp / 1000),
      txHash: "OFFLINE_MESH",
      isVerified: true,
      economics: {
        utilityScore: 50,
        scarcityCost: 0.0,
        decision: "RELAYED",
        originalResource: "BLE_BANDWIDTH"
      }
    };
    meshDecisionsCache.push(mockDecision);
    console.log(`[MeshNode] Locally cached BLE message ${msg.id} & generated mock decision.`);
  } else {
    // If the newly received packet has a longer/more complete routing path, update it!
    if (updatedPath.length > meshMessagesCache[existingIndex].path.length) {
      meshMessagesCache[existingIndex] = updatedMsg;
      console.log(`[MeshNode] Updated routing path for BLE message ${msg.id}: ${updatedPath.join(" ➔ ")}`);
    }
  }

  // Propagate message to local simulated nodes in the app
  Object.keys(globalMeshRegistry).forEach((nodeId) => {
    const node = globalMeshRegistry[nodeId];
    if (node && !node.messageHistory.has(msg.id)) {
      node.messageHistory.set(msg.id, updatedMsg);
      if (node.onReceiveCallback) {
        node.onReceiveCallback(updatedMsg, fromNeighborId);
      }
    }
  });
}

export class MeshNode {
  id: string;
  neighbors: string[];
  messageHistory: Map<string, MeshMessage>;
  onReceiveCallback?: (msg: MeshMessage, from: string) => void;

  constructor(id: string, neighbors: string[] = []) {
    this.id = id;
    this.neighbors = neighbors;
    this.messageHistory = new Map();
  }

  addNeighbor(neighborId: string) {
    if (!this.neighbors.includes(neighborId)) {
      this.neighbors.push(neighborId);
    }
  }

  sendMessage(text: string): MeshMessage {
    const msg: MeshMessage = {
      id: `msg_${this.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      text,
      sender: this.id,
      timestamp: Date.now(),
      path: [this.id]
    };
    
    this.messageHistory.set(msg.id, msg);
    console.log(`[MeshNode ${this.id}] Created original alert: "${text}"`);
    
    // Add to global cache
    const existingIndex = meshMessagesCache.findIndex(m => m.id === msg.id);
    if (existingIndex === -1) {
      meshMessagesCache.push(msg);
      
      const mockDecision = {
        id: msg.id,
        messageHash: "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
        action: `Broadcasting offline over BLE: "${msg.text}"`,
        resource: "BLE Mesh Broadcast",
        priority: "BROADCASTED",
        timestamp: Math.floor(msg.timestamp / 1000),
        txHash: "PENDING_UPLINK",
        isVerified: true,
        economics: {
          utilityScore: 50,
          scarcityCost: 0.0,
          decision: "BROADCAST",
          originalResource: "BLE_BANDWIDTH"
        }
      };
      meshDecisionsCache.push(mockDecision);
    }
    
    // Broadcast
    this.forwardMessage(msg);
    return msg;
  }

  receiveMessage(msg: MeshMessage, fromNeighborId: string) {
    if (this.messageHistory.has(msg.id)) {
      return; // Deduplicate
    }

    const updatedMsg: MeshMessage = {
      ...msg,
      path: [...msg.path, this.id]
    };
    
    this.messageHistory.set(msg.id, updatedMsg);
    console.log(`[MeshNode ${this.id}] Captured packet. Hops: ${updatedMsg.path.join(" ➔ ")}`);
    
    // Add to global cache
    const existingIndex = meshMessagesCache.findIndex(m => m.id === msg.id);
    if (existingIndex === -1) {
      meshMessagesCache.push(updatedMsg);
      
      const mockDecision = {
        id: updatedMsg.id,
        messageHash: "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
        action: `Received via BLE Mesh: ${updatedMsg.text}`,
        resource: "BLE Mesh Relay",
        priority: "OFFLINE",
        timestamp: Math.floor(updatedMsg.timestamp / 1000),
        txHash: "OFFLINE_MESH",
        isVerified: true,
        economics: {
          utilityScore: 50,
          scarcityCost: 0.0,
          decision: "RELAYED",
          originalResource: "BLE_BANDWIDTH"
        }
      };
      meshDecisionsCache.push(mockDecision);
    } else {
      // Update with the longer path
      if (updatedMsg.path.length > meshMessagesCache[existingIndex].path.length) {
        meshMessagesCache[existingIndex] = updatedMsg;
        const decIndex = meshDecisionsCache.findIndex(d => d.id === msg.id);
        if (decIndex !== -1) {
          meshDecisionsCache[decIndex].action = `Relayed via BLE Mesh: ${updatedMsg.text}`;
        }
      }
    }

    if (this.onReceiveCallback) {
      this.onReceiveCallback(updatedMsg, fromNeighborId);
    }

    // Forward to next neighbors
    this.forwardMessage(updatedMsg);
  }

  forwardMessage(msg: MeshMessage) {
    // 1. PHYSICAL HARDWARE TRANSMISSION (BLE GATT Server + Advertising)
    if (isHardwareActive) {
      try {
        console.log(`[PHYSICAL BLE] Advertising packet ${msg.id} via local GATT Server...`);
        const payloadString = JSON.stringify(msg);
        GhostnetBle.startPeripheral(payloadString);
      } catch (err) {
        console.warn("Failed to transmit via BLE hardware peripheral:", err);
      }
    }

    // 2. SOFTWARE SIMULATION FALLBACK (Runs inside Expo Go)
    this.neighbors.forEach((neighborId) => {
      if (!msg.path.includes(neighborId)) {
        setTimeout(() => {
          const neighborNode = globalMeshRegistry[neighborId];
          if (neighborNode) {
            neighborNode.receiveMessage(msg, this.id);
          }
        }, 150); // Simulate BLE latency
      }
    });
  }
}

// Global lookup table of all nodes
export const globalMeshRegistry: { [id: string]: MeshNode } = {};

// Default setup: A <-> B <-> C <-> D
export function initializeDefaultMesh(forceReset = false) {
  if (!forceReset && Object.keys(globalMeshRegistry).length > 0) {
    return;
  }
  const ids = ["A", "B", "C", "D"];
  
  Object.keys(globalMeshRegistry).forEach((key) => {
    delete globalMeshRegistry[key];
  });
  
  ids.forEach((id) => {
    globalMeshRegistry[id] = new MeshNode(id);
  });

  globalMeshRegistry["A"].addNeighbor("B");
  globalMeshRegistry["B"].addNeighbor("A");

  globalMeshRegistry["B"].addNeighbor("C");
  globalMeshRegistry["C"].addNeighbor("B");

  globalMeshRegistry["C"].addNeighbor("D");
  globalMeshRegistry["D"].addNeighbor("C");
  
  console.log("Mesh network nodes loaded. Dual-mode active (Physical hardware / Software simulation).");

  if (isHardwareActive) {
    initPhysicalBLE();
  }
}

