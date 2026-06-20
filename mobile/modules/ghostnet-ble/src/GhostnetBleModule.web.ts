import { registerWebModule, NativeModule } from 'expo';

class GhostnetBleModule extends NativeModule<{}> {}

export default registerWebModule(GhostnetBleModule, 'GhostnetBleModule');
