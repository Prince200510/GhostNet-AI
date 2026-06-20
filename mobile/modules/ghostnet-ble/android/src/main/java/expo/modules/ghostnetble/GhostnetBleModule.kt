package expo.modules.ghostnetble

import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

class GhostnetBleModule : Module() {
  private var bluetoothManager: BluetoothManager? = null
  private var bluetoothGattServer: BluetoothGattServer? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var isAdvertising = false
  private var currentPayload: String = ""

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onCharacteristicReadRequest(
      device: BluetoothDevice?,
      requestId: Int,
      offset: Int,
      characteristic: BluetoothGattCharacteristic?
    ) {
      super.onCharacteristicReadRequest(device, requestId, offset, characteristic)
      try {
        val payloadBytes = currentPayload.toByteArray(Charsets.UTF_8)
        val response = if (offset < payloadBytes.size) {
          payloadBytes.copyOfRange(offset, payloadBytes.size)
        } else {
          ByteArray(0)
        }
        bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, response)
      } catch (e: Exception) {
        Log.e("GhostnetBle", "Error on read request: ${e.message}")
        bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, offset, null)
      }
    }
  }

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
      super.onStartSuccess(settingsInEffect)
      isAdvertising = true
      Log.d("GhostnetBle", "BLE Advertising started successfully.")
    }

    override fun onStartFailure(errorCode: Int) {
      super.onStartFailure(errorCode)
      isAdvertising = false
      Log.e("GhostnetBle", "BLE Advertising failed with code: $errorCode")
    }
  }

  override fun definition() = ModuleDefinition {
    Name("GhostnetBle")

    Function("startPeripheral") { payload: String ->
      try {
        currentPayload = payload
        val context = appContext.reactContext ?: return@Function false
        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = bluetoothManager?.adapter ?: return@Function false

        if (!adapter.isEnabled) {
          Log.e("GhostnetBle", "Bluetooth is disabled.")
          return@Function false
        }

        stopPeripheralInternal()

        bluetoothGattServer = bluetoothManager?.openGattServer(context, gattServerCallback)
        if (bluetoothGattServer == null) {
          Log.e("GhostnetBle", "Failed to open GATT Server.")
          return@Function false
        }

        val serviceUuid = UUID.fromString("f43f5e00-1234-5678-1234-567812345678")
        val charUuid = UUID.fromString("f43f5e01-1234-5678-1234-567812345678")

        val service = BluetoothGattService(serviceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        val characteristic = BluetoothGattCharacteristic(
          charUuid,
          BluetoothGattCharacteristic.PROPERTY_READ,
          BluetoothGattCharacteristic.PERMISSION_READ
        )
        service.addCharacteristic(characteristic)
        bluetoothGattServer?.addService(service)

        advertiser = adapter.bluetoothLeAdvertiser
        if (advertiser == null) {
          Log.e("GhostnetBle", "GATT Advertiser not available.")
          return@Function false
        }

        val settings = AdvertiseSettings.Builder()
          .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
          .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
          .setConnectable(true)
          .setTimeout(0)
          .build()

        val data = AdvertiseData.Builder()
          .setIncludeDeviceName(false)
          .setIncludeTxPowerLevel(false)
          .addServiceUuid(ParcelUuid(serviceUuid))
          .build()

        advertiser?.startAdvertising(settings, data, advertiseCallback)
        return@Function true
      } catch (e: Exception) {
        Log.e("GhostnetBle", "Error starting peripheral: ${e.message}", e)
        return@Function false
      }
    }

    Function("stopPeripheral") {
      stopPeripheralInternal()
      true
    }
  }

  private fun stopPeripheralInternal() {
    try {
      if (isAdvertising) {
        advertiser?.stopAdvertising(advertiseCallback)
        isAdvertising = false
      }
      bluetoothGattServer?.close()
      bluetoothGattServer = null
    } catch (e: Exception) {
      Log.e("GhostnetBle", "Error during stop: ${e.message}", e)
    }
  }
}
