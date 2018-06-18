import { Injectable } from '@angular/core';
import { BoxGeometry, Color, Mesh, MeshBasicMaterial, Scene, VertexColors } from 'three';
import { ARUtils, ARDebug } from 'three.ar.js';

const colors = [
  new Color(0xffffff),
  new Color(0xffff00),
  new Color(0xff00ff),
  new Color(0xff0000),
  new Color(0x00ffff),
  new Color(0x00ff00),
  new Color(0x0000ff),
  new Color(0x000000)
];

@Injectable()
export class ArService {
  vrDisplay;
  vrControls;
  arView;

  scene = new Scene();
  camera;
  renderer;
  arDebug;

  cube;
  boxSize = 0.2;
  boxGeometry;

  constructor() {}

  initAR(options) {
    ARUtils.getARDisplay().then(this.arDisplayCallback.bind(this));
    if (options.debug) {
      this.arDebug = new ARDebug(this.vrDisplay);
      document.body.appendChild(this.arDebug.getElement());
    }
  }

  arDisplayCallback(display, cb) {
    if (display) {
      this.vrDisplay = display;
      cb();
    } else {
      ARUtils.displayUnsupportedMessage();
    }
  }

  onError(e) {
    console.warn('VRControls error ', e);
  }

  // setUp() {
  //   this.arDebug = new ARDebug(this.vrDisplay);
  //   document.body.appendChild(this.arDebug.getElement());
  //
  //   // Setup the js rendering environment
  //   this.renderer = new WebGLRenderer({ alpha: true, canvas: this.canvas });
  //   this.renderer.setPixelRatio(window.devicePixelRatio);
  //   this.renderer.setSize(window.innerWidth, window.innerHeight);
  //   this.renderer.autoClear = false;
  //
  //   // Creates an ARView with a VRDisplay and a WebGLRenderer.
  //   // Handles the pass through camera differences between ARCore and ARKit platforms,
  //   // and renders the camera behind your scene.
  //   this.arView = new ARView(this.vrDisplay, this.renderer);
  //
  //   // The ARPerspectiveCamera is very similar to PerspectiveCamera,
  //   // except when using an AR-capable browser, the camera uses
  //   // the projection matrix provided from the device, so that the
  //   // perspective camera's depth planes and field of view matches
  //   // the physical camera on the device.
  //   // Only the projectionMatrix is updated if using an AR-capable device, and the fov, aspect, near, far properties are not applicable.
  //   this.camera = new ARPerspectiveCamera(
  //     this.vrDisplay,
  //     60,
  //     window.innerWidth / window.innerHeight,
  //     this.vrDisplay.depthNear,
  //     this.vrDisplay.depthFar
  //   );
  //
  //   // VRControls is a utility from js that applies the device's
  //   // orientation/position to the perspective camera, keeping our
  //   // real world and virtual world in sync.
  //   this.vrControls = new VRControls(this.camera, this.onError);
  //
  //   // TODO: move to service with create box method
  //   this.boxGeometry = new BoxGeometry(this.boxSize, this.boxSize, this.boxSize);
  //   var faceIndices = ['a', 'b', 'c'];
  //   for (var i = 0; i < this.boxGeometry.faces.length; i++) {
  //     var f = this.boxGeometry.faces[i];
  //     for (var j = 0; j < 3; j++) {
  //       var vertexIndex = f[faceIndices[j]];
  //       f.vertexColors[j] = this.colors[vertexIndex];
  //     }
  //   }
  //
  //   // Shift the cube geometry vertices upwards, so that the "pivot" of
  //   // the cube is at it's base. When the cube is added to the scene,
  //   // this will help make it appear to be sitting on top of the real-
  //   // world surface.
  //   this.boxGeometry.translate(0, this.boxSize / 2, 0);
  //   const material = new MeshBasicMaterial({ vertexColors: VertexColors });
  //   this.cube = new Mesh(this.boxGeometry, material);
  //   this.cube.position.set(10000, 10000, 10000);
  //
  //   this.scene.add(this.cube);
  //   this.zone.runOutsideAngular(this.update.bind(this));
  // }

  update() {
    // Clears color from the frame before rendering the camera (arView) or scene.
    this.renderer.clearColor();
    // Render the device's camera stream on screen first of all.
    // It allows to get the right pose synchronized with the right frame.
    // Usually called on every frame in a render loop before rendering other objects in the scene.
    this.arView.render();
    // Update our camera projection matrix in the event that
    // the near or far planes have updated
    this.camera.updateProjectionMatrix();
    // Update our perspective camera's positioning
    this.vrControls.update();
    // Render our js virtual scene
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    // Kick off the requestAnimationFrame to call this function
    // when a new VRDisplay frame is rendered

    this.vrDisplay.requestAnimationFrame(this.update.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  createCube() {
    let boxGeometry = new BoxGeometry(this.boxSize, this.boxSize, this.boxSize);
    var faceIndices = ['a', 'b', 'c'];
    for (var i = 0; i < boxGeometry.faces.length; i++) {
      var f = this.boxGeometry.faces[i];
      for (var j = 0; j < 3; j++) {
        var vertexIndex = f[faceIndices[j]];
        f.vertexColors[j] = colors[vertexIndex];
      }
    }

    // Shift the cube geometry vertices upwards, so that the "pivot" of
    // the cube is at it's base. When the cube is added to the scene,
    // this will help make it appear to be sitting on top of the real-
    // world surface.
    boxGeometry.translate(0, this.boxSize / 2, 0);
    const material = new MeshBasicMaterial({ vertexColors: VertexColors });
    let cube = new Mesh(this.boxGeometry, material);
    cube.position.set(10000, 10000, 10000);
    return cube;
  }

  createModel() {}
}
