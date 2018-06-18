import { Component, ElementRef, OnInit, ViewChild, Input, NgZone } from '@angular/core';
import { BoxGeometry, Color, Mesh, MeshBasicMaterial, Scene, VertexColors, WebGLRenderer } from 'three';
import { ARUtils, ARPerspectiveCamera, ARView, ARDebug } from 'three.ar.js';
import { VRControls } from '@nx-examples/ar/src/VRControls';
import { ArService } from '@nx-examples/ar/src/ar.service';

@Component({
  selector: 'app-create-at-surface',
  templateUrl: './create-at-surface.component.html',
  styleUrls: ['./create-at-surface.component.scss']
})
export class CreateAtSurfaceComponent implements OnInit {
  @Input() boxSize = 0.2;

  @ViewChild('canvas') private canvasRef: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  colors = [
    new Color(0xffffff),
    new Color(0xffff00),
    new Color(0xff00ff),
    new Color(0xff0000),
    new Color(0x00ffff),
    new Color(0x00ff00),
    new Color(0x0000ff),
    new Color(0x000000)
  ];

  vrDisplay;
  vrControls;
  arView;

  scene = new Scene();
  camera;
  renderer;
  arDebug;
  cube;

  boxGeometry;

  constructor(private zone: NgZone, private arService: ArService) {}

  ngOnInit() {
    /**
     * Use the `getARDisplay()` utility to leverage the WebVR API
     * to see if there are any AR-capable WebVR VRDisplays. Returns
     * a valid display if found. Otherwise, display the unsupported
     * browser message.
     */
    ARUtils.getARDisplay().then(this.arDisplayCallback.bind(this));
  }

  arDisplayCallback(display) {
    if (display) {
      this.vrDisplay = display;
      this.setUp();
    } else {
      ARUtils.displayUnsupportedMessage();
    }
  }

  setUp() {
    // Setup the js rendering environment
    this.renderer = new WebGLRenderer({ alpha: true, canvas: this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;

    // Creates an ARView with a VRDisplay and a WebGLRenderer.
    // Handles the pass through camera differences between ARCore and ARKit platforms,
    // and renders the camera behind your scene.
    this.arView = new ARView(this.vrDisplay, this.renderer);

    // The ARPerspectiveCamera is very similar to PerspectiveCamera,
    // except when using an AR-capable browser, the camera uses
    // the projection matrix provided from the device, so that the
    // perspective camera's depth planes and field of view matches
    // the physical camera on the device.
    // Only the projectionMatrix is updated if using an AR-capable device, and the fov, aspect, near, far properties are not applicable.
    this.camera = new ARPerspectiveCamera(
      this.vrDisplay,
      60,
      window.innerWidth / window.innerHeight,
      this.vrDisplay.depthNear,
      this.vrDisplay.depthFar
    );

    // VRControls is a utility from js that applies the device's
    // orientation/position to the perspective camera, keeping our
    // real world and virtual world in sync.
    this.vrControls = new VRControls(this.camera, this.onError);

    // TODO: move to service with create box method
    // this.boxGeometry = new BoxGeometry(this.boxSize, this.boxSize, this.boxSize);
    // var faceIndices = ['a', 'b', 'c'];
    // for (var i = 0; i < this.boxGeometry.faces.length; i++) {
    //   var f = this.boxGeometry.faces[i];
    //   for (var j = 0; j < 3; j++) {
    //     var vertexIndex = f[faceIndices[j]];
    //     f.vertexColors[j] = this.colors[vertexIndex];
    //   }
    // }

    // Shift the cube geometry vertices upwards, so that the "pivot" of
    // the cube is at it's base. When the cube is added to the scene,
    // this will help make it appear to be sitting on top of the real-
    // world surface.
    // this.boxGeometry.translate(0, this.boxSize / 2, 0);
    // const material = new MeshBasicMaterial({ vertexColors: VertexColors });
    // this.cube = new Mesh(this.boxGeometry, material);
    // this.cube.position.set(10000, 10000, 10000);
    let cube = this.arService.createCube({});
    this.scene.add(cube);
    this.zone.runOutsideAngular(this.update.bind(this));
  }

  // TODO: move to a service
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

  onClick(e) {
    // Inspect the event object and generate normalize screen coordinates
    // (between 0 and 1) for the screen position.
    var x = e.touches[0].pageX / window.innerWidth;
    var y = e.touches[0].pageY / window.innerHeight;

    var hits = this.vrDisplay.hitTest(x, y);

    // If a hit is found, just use the first one
    if (hits && hits.length) {
      var hit = hits[0];

      // Use the `placeObjectAtHit` utility to position
      // the cube where the hit occurred
      ARUtils.placeObjectAtHit(
        this.cube, // The object to place
        hit, // The VRHit object to move the cube to
        1, // Easing value from 0 to 1; we want to move
        // the cube directly to the hit position
        true
      );
    }
  }

  onWindowResize(e) {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onError(e) {
    console.warn('VRControls error ', e);
  }
}
