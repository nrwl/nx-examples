import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import {
  Scene,
  WebGLRenderer,
  PCFSoftShadowMap,
  DirectionalLight,
  AmbientLight,
  PlaneGeometry,
  Mesh,
  ShadowMaterial,
  Matrix4,
  Vector3,
  Color,
  BoxGeometry,
  MeshBasicMaterial,
  VertexColors,
  Quaternion
} from 'three';
import { ARUtils, ARPerspectiveCamera, ARView, ARDebug } from 'three.ar.js';
import { VRControls } from '../VRControls';
@Component({
  selector: 'app-create-at-camera',
  templateUrl: './create-at-camera.component.html',
  styleUrls: ['./create-at-camera.component.scss']
})
export class CreateAtCameraComponent implements OnInit {
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

  scene = new Scene();
  camera;
  renderer;
  vrDisplay;
  vrFrameData;
  vrControls;
  arDebug;
  arView;
  model;
  cube;
  shadowMesh;
  // Make a large plane to receive our shadows
  planeGeometry = new PlaneGeometry(2000, 2000);
  light = new AmbientLight();
  directionalLight = new DirectionalLight();
  boxGeometry = new BoxGeometry(0.05, 0.05, 0.05);

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
    ARUtils.getARDisplay().then(this.arDisplayCallback.bind(this));
  }

  arDisplayCallback(display) {
    if (display) {
      this.vrFrameData = new VRFrameData() || {};
      this.vrDisplay = display;
      this.setUp();
    } else {
      ARUtils.displayUnsupportedMessage();
    }
  }

  onClick(e) {
    // // Fetch the pose data from the current frame
    var pose = this.vrFrameData && this.vrFrameData.pose && this.vrFrameData.pose;

    // // Convert the pose orientation and position into
    // // Quaternion and Vector3 respectively
    // // This is used for rotating things without encountering the dreaded gimbal lock issue, amongst other advantages.
    // // More info: https://threejs.org/docs/index.html#api/math/Quaternion
    // const ori = new Quaternion(
    //   pose.orientation[0],
    //   pose.orientation[1],
    //   pose.orientation[2],
    //   pose.orientation[3]
    // );
    // var pos = new Vector3(
    //   pose.position[0],
    //   pose.position[1],
    //   pose.position[2]
    // );
    // const dirMtx = new Matrix4();
    // dirMtx.makeRotationFromQuaternion(ori);
    // const push = new Vector3(0, 0, -1.0);
    // push.transformDirection(dirMtx);
    // pos.addScaledVector(push, 0.125);
    // // Clone our cube object and place it at the camera's
    // // current position
    // let clone = this.cube.clone();
    // this.scene.add(clone);
    // clone.position.copy(pos);
    // clone.quaternion.copy(ori);
  }

  setUp() {
    // this.arDebug = new ARDebug(this.vrDisplay);
    // document.body.appendChild(this.arDebug.getElement());
    // Setup the js rendering environment
    this.renderer = new WebGLRenderer({ alpha: true, canvas: this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight); //this.canvas.width, this.canvas.height);
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
    const clr = new Color(0x111111);
    this.shadowMesh = new Mesh(
      this.planeGeometry,
      new ShadowMaterial({
        opacity: 0.15
      })
    );
    this.shadowMesh.receiveShadow = true;
    this.scene.add(this.shadowMesh);

    // Create the cube geometry that we'll copy and place in the
    // scene when the user clicks the screen

    var faceIndices = ['a', 'b', 'c'];
    for (var i = 0; i < this.boxGeometry.faces.length; i++) {
      var f = this.boxGeometry.faces[i];
      for (var j = 0; j < 3; j++) {
        var vertexIndex = f[faceIndices[j]];
        f.vertexColors[j] = this.colors[vertexIndex];
      }
    }
    const material = new MeshBasicMaterial({ vertexColors: VertexColors });
    this.cube = new Mesh(this.boxGeometry, material);

    // ARUtils.loadModel({ß
    //   objPath: OBJ_PATH,
    //   mtlPath: MTL_PATH,
    //   OBJLoader: undefined,
    //   MTLLoader: undefined, // uses window.MTLLoader by default
    // }).then(function(group) {
    //   this.model = group;
    //   // As OBJ models may contain a group with several meshes,
    //   // we want all of them to cast shadow
    //   this.model.children.forEach(function(mesh) { mesh.castShadow = true; });
    //   this.model.scale.set(SCALE, SCALE, SCALE);
    //   // Place the model very far to initialize
    //   this.model.position.set(10000, 10000, 10000);
    //   this.scene.add(this.model);
    // });

    this.update();
  }

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

  onWindowResize(e) {
    console.log('setRenderer size', window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onError() {
    console.log('VRControls error');
  }
}
