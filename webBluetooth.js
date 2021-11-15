
'use strick';

class WebBlueTooth {
    constructor(uuid){
        this.uuid = uuid;
        this.bluetoothDevice;
        this.getChar;
        this.ports = [];
        this.portInfoTimeout;
        this.num2type = {
            23: 'LED',
            37: 'DISTANCE',
            38: 'IMOTOR',
            39: 'MOTOR',
            40: 'TILT',
        };
        this.port2num = {
            A: 0x00,
            B: 0x01,
            C: 0x02,
            D: 0x03,
            AB: 0x10,
            LED: 0x32,
            TILT: 0x3a,
        };
    }
    async connect () {
        this.clearLog();
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
            this.setLog('Requesting any Bluetooth Device...');
            this.bluetoothDevice = await navigator.bluetooth.requestDevice(options);
            this.setLog(this.bluetoothDevice.name)
            //블루투스 디바이스 찾기
            this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnected);
            return this.getCharacteristic(this.bluetoothDevice)
        } catch(err){
            console.log(err)
        }
    }
    async getCharacteristic(device) {
        this.setLog('Connecting to GATT Server...');
        const server = await device.gatt.connect(); 
        // device를 스크립트 실행환경에 연결.
        this.setLog('Getting Service...');
        const service = await server.getPrimaryService(uuid.service_uuid); 
        // 명확한 service_uuid를 제공한다면 service를 제공.
        this.setLog('Getting Characteristic...');
        this.getChar = await service.getCharacteristic(uuid.Characteristic_uuid);
        // Characteristic을 제공.

        this.addListeners()
        return this.getChar
    }
    addListeners() {
        this.getChar.addEventListener('characteristicvaluechanged', event => {
        // https://googlechrome.github.io/samples/web-bluetooth/read-characteristic-value-changed.html
        // @ts-ignore
        // characteristicvalue만큼? 이벤트.
        const data = new Uint8Array(event.target.value.buffer)
        this.parseMessage(data);
    });

        setTimeout(() => {
            // Without timout missed first characteristicvaluechanged events
            this.setLog('Starting startNotifications...');
            this.getChar.startNotifications();
            //이제 준비되었다고 기기에 알림.
        }, 1000);
    }

    parseMessage(data) {//found
        switch (data[2]) {
          case 0x04: {
            clearTimeout(this.portInfoTimeout);
            this.portInfoTimeout = setTimeout(() => {
              /**
               * Fires when a connection to the Move Hub is established
               * @event Hub#connect
               */
              if (this.autoSubscribe) {
                this.setLog("subscribeAll")
                this.subscribeAll();
              }
    
            //   if (!this.connected) {
            //     this.connected = true;
            //     this.emit('connect');
            //   }
            }, 1000);
            if (typeof(data[5]) === undefined) data[5] = 0;
            console.log(data[5])
            // if (this.num2type[data[5]]) { // data[5] 달려있는 포트의 넘버
                this.setLog('Found: ' + this.num2type[data[5]]);
            // }
              if (data[4] === 0x01) {
                //어떤 포트가 달려있는지. 확인. 모터를 인식못함.
                this.ports[data[3]] = {
                  type: 'port',
                  deviceType: this.num2type[data[5]],
                  deviceTypeNum: data[5],
                };
                console.log(this.ports)
              } else if (data[4] === 0x02) {
                this.ports[data[3]] = {
                  type: 'group',
                  deviceType: this.num2type[data[5]],
                  deviceTypeNum: data[5],
                  members: [data[7], data[8]],
                };
              }
              break;
          }
          case 0x05: {
            console.log('Malformed message');
            console.log('<', data);
          }
          case 0x45: {//값을 받을 떄.
              this.parseSensor(data)
          }
          case 0x47: {
            // 0x47 subscription acknowledgements
            // https://github.com/JorgePe/BOOSTreveng/blob/master/Notifications.md
            break;
          }
          case 0x82: {
            break;
          }
          default:
        }
    }
    subscribe(port,option) {
        if (typeof option === 'function') {
          // TODO: Why we have function check here?
          callback = option;
          option = 0x00;
        }
        const portNum = typeof port === 'string' ? this.port2num[port] : port;
        this.write(
            new Uint8Array([0x0a, 0x00, 0x41, portNum, option, 0x01, 0x00, 0x00, 0x00, 0x01]),
          callback()
        );
    }

    subscribeAll() {
    Object.entries(this.ports).forEach(([port, data]) => {
    console.log("subscribe : ",port, data)

        if (data.deviceType === 'DISTANCE') {
        this.subscribe(parseInt(port, 10), 8);
        } else if (data.deviceType === 'TILT') {
        this.subscribe(parseInt(port, 10), 0);
        } else if (data.deviceType === 'IMOTOR') {
        this.subscribe(parseInt(port, 10), 2);
        } else if (data.deviceType === 'MOTOR') {
        this.subscribe(parseInt(port, 10), 2);
        } else {
        this.logDebug(`Port subscribtion not sent: ${port}`);
        }
    });
    }
    parseSensor(data) {
        if (!this.ports[data[3]]) {
          this.setLog('parseSensor unknown port 0x' + data[3].toString(16));
          return;
        }
        switch (this.ports[data[3]].deviceType) {
          case 'DISTANCE': {
            /**
             * @event Hub#color
             * @param color {string}
             */
            this.emit('color', this.num2color[data[4]]);
    
            // TODO: improve distance calculation!
            let distance;
            if (data[7] > 0 && data[5] < 2) {
              distance = Math.floor(20 - data[7] * 2.85);
            } else if (data[5] > 9) {
              distance = Infinity;
            } else {
              distance = Math.floor(20 + data[5] * 18);
            }
            /**
             * @event Hub#distance
             * @param distance {number} distance in millimeters
             */
            this.emit('distance', distance);
            break;
          }
          case 'TILT': {
            const roll = data.readInt8(4);
            const pitch = data.readInt8(5);
    
            /**
             * @event Hub#tilt
             * @param tilt {object}
             * @param tilt.roll {number}
             * @param tilt.pitch {number}
             */
            this.emit('tilt', { roll, pitch });
            break;
          }
          case 'MOTOR':
          case 'IMOTOR': {
            const angle = data.readInt32LE(4);
    
            /**
             * @event Hub#rotation
             * @param rotation {object}
             * @param rotation.port {string}
             * @param rotation.angle
             */
            this.emit('rotation', {
              port: this.num2port[data[3]],
              angle,
            });
            break;
          }
          default:
            this.log('unknown sensor type 0x' + data[3].toString(16), data[3], this.ports[data[3]].deviceType);
        }
    }
    // A: 0x00,
    // B: 0x01,
    // C: 0x02,
    // D: 0x03,
    // AB: 0x10,
    // LED: 0x32,
    // TILT: 0x3a,

    // 0: 'black',
    // 3: 'blue',
    // 5: 'green',
    // 7: 'yellow',
    // 9: 'red',   
    // 10: 'white',
    async send(charcter, port, value) {
        if (this.isWriting) return 
        console.log("send",port)
        if (!charcter) {
            return Promise.reject(new Error('No characteristic'));
        }
        switch(port) {
            case 'A' :
                port = 0x00
                break;
            case 'B' : //회전 : 변수의 최대값을 100으로 정해서 10씩 증가하여 100이되면 못보내도록 한다.
                port = 0x01
                break;
            case 'AB' :
                port = 0x02
                break;
            case 'LED' :
                port = 0x32
                if (typeof(value) === 'string') {
                    switch(value) {
                        case 'red' :
                            value = 0x03
                        break;
                    }
                } else {
                    console.log(Error("please string type - color, ex : red"))
                }
                break;
        }
        //Motor Sub 0x81
        this.isWriting = true
        const write = await this.buf([0x81, port, 0x11, 0x51, 0x00, value])
        charcter.writeValue(write)
        .then((write) => {
          this.isWriting = false;
          if (typeof el.callback === 'function') el.callback();
          return write
        })
        .catch(err => {
          this.isWriting = false;
          console.log(`Error while writing: ${write}} - Error ${err.toString()}`);
          // TODO: Notify of failure
          console.log("catch: ",write)
          return write
        })
        .finally(() => {
            console.log("finally : ",write) //수저앻야함
        //   this.send(write);
        });
    }
    buf(buf) {
        var ab = new ArrayBuffer(buf.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }

      setLog(text) {
        const logs = document.getElementById('logs');
        logs.innerHTML = logs.innerHTML +'\n'+ text;
      }
      clearLog() {
        const logs = document.getElementById('logs');
        logs.innerHTML = "";
      }
      async onDisconnected () {
        this.setLog('> Bluetooth Device disconnected');
        try {
          await this.getCharacteristic()
        } catch(error) {
            setLog('Argh! ' + error);
        }
      }
    //   async reconnect() {
    //     if (this.bluetoothDevice) {
    //       const bluetooth = await this.getCharacteristic(this.bluetoothDevice);
    //       return [true, bluetooth];
    //     }
    //     }
    //     disconnect() {
    //         if (this.bluetoothDevice) {
    //         this.bluetoothDevice.gatt.disconnect();
    //         return true;
    //         }
    //         return false;
    //     }
}

