import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Scene, WebGLRenderer, PCFSoftShadowMap,
  DirectionalLight, AmbientLight, PlaneGeometry,
  Mesh, ShadowMaterial, Matrix4, Vector3, Color } from 'three';
import { ARUtils, ARPerspectiveCamera, ARView } from 'three.ar.js';
import { VRControls } from '../VRControls';
import { OBJLoader } from "../OBJLoader";
// declare var VRControls;
// Get these as input
const OBJ_PATH = './assets/obj/narwhal/Mesh_Narwhal.obj';
const MTL_PATH = './assets/obj/narwhal/Mesh_Narwhal.mtl';
const SCALE = 0.1;

@Component({
  selector: 'app-model-loader',
  templateUrl: './model-loader.component.html',
  styleUrls: ['./model-loader.component.css']
})
export class ModelLoaderComponent implements OnInit {
  scene = new Scene();
  camera;
  renderer;
  vrDisplay;
  vrControls;
  arView;
  model;
  shadowMesh;
  // Make a large plane to receive our shadows
  planeGeometry = new PlaneGeometry(2000, 2000);
  light = new AmbientLight();
  directionalLight = new DirectionalLight();

  // raycaster = new Raycaster();

  @ViewChild('canvas') private canvasRef: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  constructor() {}

  ngOnInit() {
    /**
     * Use the `getARDisplay()` utility to leverage the WebVR API
     * to see if there are any AR-capable WebVR VRDisplays. Returns
     * a valid display if found. Otherwise, display the unsupported
     * browser message.
     */
    ARUtils.getARDisplay().then(this.arCallback.bind(this));
  }

  arCallback(display){
    if (display) {
        this.vrDisplay = display;
        this.setUp();
    } else {
      ARUtils.displayUnsupportedMessage();
    }
  }

  setUp(){
    // Setup the three.js rendering environment
    this.renderer = new WebGLRenderer({ alpha: true, canvas: this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight); //this.canvas.width, this.canvas.height);
    this.renderer.autoClear = false;

    // Creating the ARView, which is the object that handles
    // the rendering of the camera stream behind the three.js
    // scene
    this.arView = new ARView(this.vrDisplay, this.renderer);

    // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
    // except when using an AR-capable browser, the camera uses
    // the projection matrix provided from the device, so that the
    // perspective camera's depth planes and field of view matches
    // the physical camera on the device.
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
    this.renderer.shadowMap.type = PCFSoftShadowMap;

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
    const clr =  new Color(0x111111);
    this.shadowMesh = new Mesh(this.planeGeometry, new ShadowMaterial({
      opacity: 0.15,
    }));
    this.shadowMesh.receiveShadow = true;
    this.scene.add(this.shadowMesh);

    ARUtils.loadModel({
      objPath: OBJ_PATH,
      mtlPath: MTL_PATH,
      OBJLoader: OBJLoader,
      MTLLoader: undefined, // uses window.THREE.MTLLoader by default
    }).then(function(group) {
      this.model = group;
      // As OBJ models may contain a group with several meshes,
      // we want all of them to cast shadow
      this.model.children.forEach(function(mesh) { mesh.castShadow = true; });
      this.model.scale.set(SCALE, SCALE, SCALE);
      // Place the model very far to initialize
      this.model.position.set(10000, 10000, 10000);
      this.scene.add(this.model);
    });

    this.update();

  }

  update(){
    // Clears color from the frame before rendering the camera (arView) or scene.
    this.renderer.clearColor();
    // Render the device's camera stream on screen first of all.
    // It allows to get the right pose synchronized with the right frame.
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
    this.vrDisplay.requestAnimationFrame(this.update);
  }

  onClick(e) {
    // Inspect the event object and generate normalize screen coordinates
    // (between 0 and 1) for the screen position.
    var x = e.clientX / window.innerWidth;
    var y = e.clientY / window.innerHeight;
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
      const matrix = new Matrix4();
      const position = new Vector3();
      matrix.fromArray(hit.modelMatrix);
      position.setFromMatrixPosition(matrix);
      // Set our shadow mesh to be at the same Y value
      // as our hit where we're placing our model
      // @TODO use the rotation from hit.modelMatrix
      this.shadowMesh.position.y = position.y;
      // Use the `placeObjectAtHit` utility to position
      // the cube where the hit occurred
      ARUtils.placeObjectAtHit(this.model,  // The object to place
        hit,   // The VRHit object to move the cube to
        1,     // Easing value from 0 to 1; we want to move
        // the cube directly to the hit position
        true); // Whether or not we also apply orientation
      // Rotate the model to be facing the user
      const angle = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );
      this.model.rotation.set(0, angle, 0);
    }
  }

  onResize() {

  }

  onError() {
    console.log('VRControls error');
  }
}
