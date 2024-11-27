import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  AdvancedDynamicTexture,
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
} from "@babylonjs/core";

export default class App {
  scene: Scene;
  labelTexture: AdvancedDynamicTexture;
  uiPanel!: StackPanel;

  constructor(canvas: HTMLCanvasElement) {
    // initialize babylon scene and engine
    var engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
    });
    const scene = new Scene(engine);
    this.scene = scene;
    const camera1 = this.init(canvas);
    const camera2 = this.initUI();

    const labelTexture =
      AdvancedDynamicTexture.CreateFullscreenUI("UI for label");
    labelTexture.layer && (labelTexture.layer.layerMask = 1);
    this.labelTexture = labelTexture;

    scene.activeCameras = [camera1, camera2];

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

    loadAssetContainerAsync(
      import.meta.env.BASE_URL + "ground/scene.gltf",
      scene
    ).then((res) => {
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

    return camera1;
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
    return camera2;
  }

  public draw(id: string) {
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
