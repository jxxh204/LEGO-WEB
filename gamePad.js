import ConnectLego from "./webBluetooth.js"

class GamePad extends ConnectLego {

    constructor(getChar) {
        super()
        this.getChar = getChar

        this.gamePad
        this.controllers = []
    }
    //Start
    addListenerGamePad = () => {
        window.addEventListener("gamepadconnected", this.gamepadHandler)
        window.addEventListener("gamepaddisconnected", this.gamepadHandler)
    }
    gamepadHandler = (event, connecting) => {
        this.addgamepad(event.gamepad);
    }

    addgamepad = (gamepad) => {
        console.log("gamepad : ",gamepad)
        this.controllers[gamepad.index] = gamepad; 
        setInterval(() => {
            this.scangamepads()
        }, 50)
    }
    
    scangamepads = () => {
        let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && (gamepads[i].index in this.controllers)) {
            this.controllers[gamepads[i].index] = gamepads[i];
            }
        }
        this.gamePad = {
            x : this.controllers[0].axes[0],
            y : this.controllers[0].axes[1]
        }
        console.log(this.getChar)
        //charcter, port, value
            if (this.gamePad.x === -1) { //왼쪽
                console.log("좌")
                super.send(this.getChar, 'B', -20)
            }
            if (this.gamePad.x === 1) { // 오른쪽
                console.log("오른")
                super.send(this.getChar, 'B', 20)
            }
            if (this.gamePad.y === -1) {// 위
                console.log("위")
                super.send(this.getChar, 'A', -100)
            }
            if (this.gamePad.y === 1) { // 아래
                console.log("아래")
                super.send(this.getChar, 'A', 100)
            }
            if (this.gamePad.x === -0) {
                super.send(this.getChar, 'B', 0)
            } else if (this.gamePad.y === -0) {
                super.send(this.getChar, 'A', 0)
            }
    }
}
export default GamePad

