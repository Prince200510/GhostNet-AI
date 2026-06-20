import { NativeModule, requireNativeModule } from 'expo';

declare class GhostnetBleModule extends NativeModule {
  startPeripheral(payload: string): boolean;
  stopPeripheral(): boolean;
}

let GhostnetBle: any = null;

try {
  GhostnetBle = requireNativeModule<GhostnetBleModule>('GhostnetBle');
} catch (e) {
  console.log("[GhostnetBle] Native module GhostnetBle missing in this runtime. Using simulator mock fallback.");
  GhostnetBle = {
    startPeripheral: (payload: string) => {
      console.log("[GHOSTNET BLE SIM] Mock startPeripheral:", payload);
      return true;
    },
    stopPeripheral: () => {
      console.log("[GHOSTNET BLE SIM] Mock stopPeripheral");
      return true;
    }
  };
}

export default GhostnetBle;
