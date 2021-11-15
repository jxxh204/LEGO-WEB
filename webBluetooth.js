


class WebBlueTooth {
    constructor(uuid){
        this.uuid = uuid;
        this.bluetoothDevice;
        this.getChar;
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
        try{
            this.bluetoothDevice = await navigator.bluetooth.requestDevice(options);
            //블루투스 디바이스 찾기
            this.bluetoothDevice.addEventListener('gattserverdisconnected', async event => {
                console.log("어떤경우?")
                await disconnectCallback();
            });
            this.getCharacteristic(this.bluetoothDevice)
        } catch(err){
            console.log(err)
        }
    }
    async getCharacteristic(device) {
        const server = await device.gatt.connect(); 
        // device를 스크립트 실행환경에 연결.
        const service = await server.getPrimaryService(service_uuid); 
        // 명확한 service_uuid를 제공한다면 service를 제공.
        this.getChar = await service.getCharacteristic(Characteristic_uuid);
        // Characteristic을 제공.

        // this.addListeners()
    }
}

