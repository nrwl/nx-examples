import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import * as THREE from 'three';
import '../js/EnableThreeExamples';
import 'three/examples/js/loaders/OBJLoader';
import 'three/examples/js/loaders/MTLLoader';
import { ARUtils, ARPerspectiveCamera, ARView } from 'three.ar.js';
import { VRControls } from '../VRControls';
// Get these as input
const OBJ_PATH = 'assets/obj/nrwl/Narwhal.obj';
const MTL_PATH = 'assets/obj/nrwl/Narwhal.mtl';
const SCALE = 0.1;
@Component({
  selector: 'app-model-loader',
  templateUrl: './model-loader.component.html',
  styleUrls: ['./model-loader.component.scss']
})
export class ModelLoaderComponent implements OnInit {
  @ViewChild('canvas') private canvasRef: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  scene = new THREE.Scene();
  camera;
  renderer;

  vrDisplay;
  vrControls;
  arView;

  model;
  // Make a large plane to receive our shadows
  shadowMesh;
  planeGeometry = new THREE.PlaneGeometry(2000, 2000);

  light = new THREE.AmbientLight();
  directionalLight = new THREE.DirectionalLight();

  // raycaster = new Raycaster();

  constructor(private zone: NgZone) {}

  ngOnInit() {
    /**
     * Use the `getARDisplay()` utility to leverage the WebVR API
     * to see if there are any AR-capable WebVR VRDisplays. Returns
     * a valid display if found. Otherwise, display the unsupported
     * browser message.
     */
    ARUtils.getARDisplay().then(this.arCallback.bind(this));
  }

  arCallback(display) {
    if (display) {
      this.vrDisplay = display;
      this.zone.runOutsideAngular(this.setUp.bind(this));
    } else {
      ARUtils.displayUnsupportedMessage();
    }
  }

  setUp() {
    // Setup the three.js rendering environment
    this.renderer = new THREE.WebGLRenderer({ alpha: true, canvas: this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight); //this.canvas.width, this.canvas.height);
    this.renderer.autoClear = false;

    // Creates an ARView with a VRDisplay and a THREE.WebGLRenderer.
    // Handles the pass through camera differences between ARCore and ARKit platforms,
    // and renders the camera behind your scene.
    this.arView = new ARView(this.vrDisplay, this.renderer);

    // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
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

    // VRControls is a utility from three.js that applies the device's
    // orientation/position to the perspective camera, keeping our
    // real world and virtual world in sync.
    this.vrControls = new VRControls(this.camera, this.onError);

    // For shadows to work
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.directionalLight.intensity = 0.3;
    this.directionalLight.position.set(10, 15, 10);
    // We want this light to cast shadow
    this.directionalLight.castShadow = true;

    this.scene.add(this.light);
    this.scene.add(this.directionalLight);

    // Rotate our plane to be parallel to the floor
    this.planeGeometry.rotateX(-Math.PI / 2);

    // Create a mesh with a shadow material, resulting in a mesh
    // that only renders shadows once we flip the `receiveShadow` property
    const clr = new THREE.Color(0x111111);
    this.shadowMesh = new THREE.Mesh(
      this.planeGeometry,
      new THREE.ShadowMaterial({
        opacity: 0.15
      })
    );
    this.shadowMesh.receiveShadow = true;
    this.scene.add(this.shadowMesh);

    ARUtils.loadModel({
      objPath: OBJ_PATH,
      mtlPath: MTL_PATH,
      OBJLoader: THREE.OBJLoader, //undefined, //THREE.OBJLoader,
      MTLLoader: THREE.MTLLoader //undefined//THREE.MTLLoader //by default
    }).then(this.loadModelCb.bind(this));

    this.update();
  }

  loadModelCb(group) {
    this.model = group;
    // As OBJ models may contain a group with several meshes,
    // we want all of them to cast shadow
    this.model.children.forEach(function(mesh) {
      mesh.castShadow = true;
    });
    this.model.scale.set(SCALE, SCALE, SCALE);
    // Place the model very far to initialize
    this.model.position.set(10000, 10000, 10000);
    console.log('Adding model ', this.model);
    this.scene.add(this.model);
  }

  update() {
    // if(this.model){
    // this.model.rotation.x += 0.1;
    // this.model.rotation.y += 0.1;
    // }
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
    // Render our three.js virtual scene
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);

    // Kick off the requestAnimationFrame to call this function
    // when a new VRDisplay frame is rendered
    this.vrDisplay.requestAnimationFrame(this.update.bind(this));
  }

  onClick(e) {
    // Inspect the event object and generate normalize screen coordinates
    // (between 0 and 1) for the screen position.
    var x = e.changedTouches[0].clientX / window.innerWidth;
    var y = e.changedTouches[0].clientY / window.innerHeight;

    // Send a ray from the point of click to the real world surface
    // and attempt to find a hit. `hitTest` returns an array of potential
    // hits.
    var hits = this.vrDisplay.hitTest(x, y);
    if (!this.model) {
      console.warn('Model not yet loaded');
      return;
    }
    // If a hit is found, just use the first one
    if (hits && hits.length) {
      var hit = hits[0];
      // Turn the model matrix from the VRHit into a
      // THREE.Matrix4 so we can extract the position
      // elements out so we can position the shadow mesh
      // to be directly under our model. This is a complicated
      // way to go about it to illustrate the process, and could
      // be done by manually extracting the "Y" value from the
      // hit matrix via `hit.modelMatrix[13]`
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      matrix.fromArray(hit.modelMatrix);
      position.setFromMatrixPosition(matrix);
      // Set our shadow mesh to be at the same Y value
      // as our hit where we're placing our model
      // @TODO use the rotation from hit.modelMatrix
      this.shadowMesh.position.y = position.y;
      // Use the `placeObjectAtHit` utility to position
      // the cube where the hit occurred
      console.log('model at hit ', this.model);
      ARUtils.placeObjectAtHit(
        this.model, // The object to place
        hit, // The VRHit object to move the cube to
        1, // Easing value from 0 to 1; we want to move
        // the cube directly to the hit position
        true
      ); // Whether or not we also apply orientation
      // Rotate the model to be facing the user
      const angle = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );
      this.model.rotation.set(0, angle, 0);
    }
  }

  onWindowResize(e) {}

  onError() {
    console.log('VRControls error');
  }
}
