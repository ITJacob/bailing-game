import "./style.css";
import { Button, Control } from "@babylonjs/gui/2D";
import { KeyboardEventTypes } from "@babylonjs/core";
import { global, initAcc } from "./account";
import App from "./app";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const app = new App(canvas);
start();

async function start() {
  const { rooms, join, create } = await initAcc();
  if (rooms) {
    rooms.forEach((room: any, i) => {
      const { roomCode } = room;
      var roomPanel = Button.CreateSimpleButton("but" + i, roomCode);
      roomPanel.height = "40px";
      roomPanel.color = "white";
      roomPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      roomPanel.paddingTop = "10px";
      roomPanel.onPointerClickObservable.add(() => {
        join(roomCode).then(() => {
          startGameLoop();
        });
      });
      app.uiPanel.addControl(roomPanel);
    });
  }

  var createPanel = Button.CreateSimpleButton("but0", "new");
  createPanel.height = "40px";
  createPanel.color = "green";
  createPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  createPanel.paddingTop = "10px";
  createPanel.onPointerClickObservable.add(() => {
    create().then(() => {
      startGameLoop();
    });
  });
  app.uiPanel.addControl(createPanel);
}

function startGameLoop() {
  const players: any = {};
  const speed = 0.2; // 玩家移动速度
  const input = { l: false, r: false, f: false, b: false };

  app.scene.onKeyboardObservable.add((kbInfo) => {
    const value = kbInfo.type === KeyboardEventTypes.KEYDOWN;
    switch (kbInfo.event.key) {
      case "a":
      case "A":
        input.l = value;
        break;
      case "d":
      case "D":
        input.r = value;

        break;
      case "w":
      case "W":
        input.f = value;

        break;
      case "s":
      case "S":
        input.b = value;

        break;
    }
  });

  global.room.onStartFrameSync(() => {
    // 发送帧数据，房间内玩家可通过该方法向联机对战服务端发送帧数据
    setInterval(() => {
      const frameData = JSON.stringify(input);
      global.room.sendFrame(frameData);
    }, 100);
  });

  // 添加接收帧同步信息回调
  global.room.onRecvFrame((msg: string) => {
    let last;
    // 处理帧数据msg
    if (Array.isArray(msg)) {
      // 处理补帧数据
      last = msg.pop();
    } else {
      // 处理实时帧数据
      last = msg;
    }
    if (!last.frameInfo) return;

    last.frameInfo.forEach((info: any) => {
      const { playerId, data, timestamp } = info;
      const _data = JSON.parse(data[0]);
      if (!players[playerId]) {
        players[playerId] = {
          playerId,
          box: app.draw(playerId.substr(-5)),
          timestamp,
        };
      }
      const player = players[playerId];
      // const delt = (timestamp - player.timestamp) / 1000;
      const { l, r, f, b } = _data;
      player.box.position.x += (l ? -1 : r ? 1 : 0) * speed; // x轴朝右
      player.box.position.z += (f ? 1 : b ? -1 : 0) * speed;
    });
  });
}
