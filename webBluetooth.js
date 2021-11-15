


class WebBlueTooth {
    constructor(uuid){
        this.uuid = uuid;
        this.bluetoothDevice;
    }
    async connect () {
        let options;
        if (uuid.service_uuid) {
            options = {
                acceptAllDevices: false,
                filters : [{services : [uuid.service_uuid]}],
                optionalServices: [uuid.service_uuid],
            }
        } else {
            options = {
                acceptAllDevices: true // 모든 디바이스와 연결
            }
        }

        this.bluetoothDevice = await navigator.bluetooth.requestDevice(options)
            console.log("bluetoothDevice",this.bluetoothDevice)
    
        this.bluetoothDevice.addEventListener('gattserverdisconnected', async event => {
            await disconnectCallback();
        });
        // return this.getCharacteristic(this.bluetoothDevice)
    
        //  const server = await bluetoothDevice.gatt.connect()
        //     console.log("gattConnect",server)
    
        //  const gattServer = await server.getPrimaryService(this.s_uuid)
        //      console.log('> Found GATT server : ',server);
     
        //  this.characteristic = await gattServer.getCharacteristic(this.c_uuid);
        //  console.log('> Found sendCharacteristic : ',this.characteristic)
    }
}

