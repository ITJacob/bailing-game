import "./style.css";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui/2D";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Tools,
  loadAssetContainerAsync,
  StandardMaterial,
  Color3,
  KeyboardEventTypes,
} from "@babylonjs/core";
import { global, initAcc } from "./account";

class App {
  scene: Scene;
  labelTexture: AdvancedDynamicTexture;
  uiPanel!: StackPanel;

  constructor() {
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
    });
    const scene = new Scene(engine);
    this.scene = scene;
    this.init(canvas);
    this.initUI();

    const labelTexture =
      AdvancedDynamicTexture.CreateFullscreenUI("UI for label");
    labelTexture.layer && (labelTexture.layer.layerMask = 1);
    this.labelTexture = labelTexture;

    this.start();

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      }
    });
    // Resize
    window.addEventListener("resize", function () {
      engine.resize();
    });

    // run the main render loop
    engine.runRenderLoop(() => {
      if (!scene.activeCamera) return;
      scene.render();
    });
  }

  init(canvas: HTMLCanvasElement) {
    const scene = this.scene;

    var camera1 = new ArcRotateCamera(
      "camera1",
      Tools.ToRadians(-90), // 沿着z轴正向看
      Tools.ToRadians(70),
      6.1,
      Vector3.Zero(),
      scene
    );
    // This attaches the camera to the canvas
    camera1.attachControl(canvas, false);
    camera1.layerMask = 1;

    new HemisphericLight("light", new Vector3(1, 1, 1), scene);

    loadAssetContainerAsync(import.meta.env.BASE_URL + "ground/scene.gltf", scene).then((res) => {
      const env = res.meshes[0];
      env.layerMask = 1;
      let allMeshes = env.getChildMeshes();

      allMeshes.forEach((m) => {
        m.layerMask = 1;
        m.receiveShadows = true;
        m.checkCollisions = true;
      });
      res.addAllToScene();
    });
  }

  initUI() {
    var camera2 = new ArcRotateCamera(
      "camera",
      Tools.ToRadians(-90),
      Tools.ToRadians(65),
      10,
      Vector3.Zero(),
      this.scene
    );
    camera2.layerMask = 2;
    // GUI - simply set advancedTexture layerMask to 2
    var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    advancedTexture.layer && (advancedTexture.layer.layerMask = 2);

    var panel = new StackPanel();
    panel.width = "220px";
    panel.fontSize = "14px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);

    this.uiPanel = panel;
  }

  async start() {
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
            this.startGameLoop();
          });
        });
        this.uiPanel.addControl(roomPanel);
      });
    }

    var createPanel = Button.CreateSimpleButton("but0", "new");
    createPanel.height = "40px";
    createPanel.color = "green";
    createPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    createPanel.paddingTop = "10px";
    createPanel.onPointerClickObservable.add(() => {
      create().then(() => {
        this.startGameLoop();
      });
    });
    this.uiPanel.addControl(createPanel);
  }

  startGameLoop() {
    const players: any = {};
    const speed = 0.2; // 玩家移动速度
    const input = { l: false, r: false, f: false, b: false };

    this.scene.onKeyboardObservable.add((kbInfo) => {
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
            box: this.draw(playerId.substr(-5)),
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

  private draw(id: string) {
    const scene = this.scene;
    var box = MeshBuilder.CreateBox("box", { size: 0.2 }, scene);
    box.position.y = 0.1;

    let boxMaterial = new StandardMaterial("Box Material", scene);
    boxMaterial.diffuseColor = new Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    box.material = boxMaterial;
    box.checkCollisions = true;
    box.layerMask = 1;

    var rect1 = new Rectangle();
    rect1.width = "100px";
    rect1.height = "40px";
    rect1.cornerRadius = 12;
    rect1.color = "Orange";
    rect1.thickness = 4;
    rect1.background = "green";
    this.labelTexture.addControl(rect1);

    var label = new TextBlock();
    label.text = id;
    rect1.addControl(label);

    rect1.linkWithMesh(box);
    rect1.linkOffsetY = -70;

    return box;
  }
}
new App();
