BABYLON.Database.IDBStorageEnabled = true;

// Custom Loading Screen
class MyLoadingScreen {
    constructor(htmlElement) {
        this.element = htmlElement;
        this.createSpinner();
    }
    displayLoadingUI() {
        this.element.appendChild(this.spinner);
    }
    hideLoadingUI() {
        this.element.removeChild(this.spinner);
    }
    createSpinner() {
        this.spinner = document.createElement('img');
        this.spinner.src = 'img/spinner.svg';
        this.spinner.classList.add('loadingIndicator');
    }
}

/*
| ################################################################################
| INIT
| ################################################################################
*/

let canvasContainer = document.querySelector('.canvasContainer');
let canvas = document.querySelector('.renderCanvas');
var loadingScreen = new MyLoadingScreen(canvasContainer);
let engine = new BABYLON.Engine(canvas, true);
engine.loadingScreen = loadingScreen;

// GLTF Scene load
BABYLON.SceneLoader.LoadAsync(
    './_assets/scene.glb',
    null,
    engine,
    (progress) => {
        console.log(progress);
    }
). then(scene => {
    // ########## Scene ##########
    scene.clearColor = new BABYLON.Color4(0.75, 0.75, 0.75, 1);
        
    // ########## Camera ##########
    let mainCamera = new BABYLON.ArcRotateCamera(
        "Camera",
        -BABYLON.Angle.FromDegrees(45).radians(), // Alpha
        BABYLON.Angle.FromDegrees(80).radians(), // Beta
        30, // Radius
        new BABYLON.Vector3(0, -0.5, 0),
        scene
    );
    
    mainCamera.lowerAlphaLimit = -BABYLON.Angle.FromDegrees(45).radians();
    mainCamera.upperAlphaLimit = BABYLON.Angle.FromDegrees(45).radians();
    mainCamera.lowerBetaLimit = BABYLON.Angle.FromDegrees(30).radians();
    mainCamera.upperBetaLimit = BABYLON.Angle.FromDegrees(90).radians();
    mainCamera.lowerRadiusLimit = mainCamera.upperRadiusLimit = mainCamera.radius;

    mainCamera.attachControl(canvas, true);
    
    // ########## Light ##########
    var light = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.25;
    // light.diffuse = BABYLON.Color3. FromInts(227, 205, 167);
    
    // ########## Environment ##########
    // var hdrTexture = new BABYLON.HDRCubeTexture("assets/textures/environment.hdr", scene, 512);
    // hdrTexture.gammaSpace = true;
    // scene.environmentTexture = hdrTexture;
    
    // ########## Skybox ##########
    var hdrTexture = new BABYLON.CubeTexture("_assets/textures/env", scene);
    hdrTexture.gammaSpace = false;
    scene.environmentTexture = hdrTexture;

    // ########## Physics ##########
    scene.enablePhysics(new BABYLON.Vector3(0,-10,0), new BABYLON.AmmoJSPlugin());

    // Ground
    let groundMesh = scene.getMeshByName('Ground-sb');
    let ground = makePhysicsObject('Ground-sb', scene, 0);

    // Crate
    let crate = makePhysicsObject('Crate-rb', scene).getChildMeshes()[0];
    // Crate action
    crate.actionManager = new BABYLON.ActionManager(scene);
    crate.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            (evt) => {
                evt.source.parent.physicsImpostor.applyImpulse(evt.source.forward.scale(100), evt.source.getAbsolutePosition().add(new BABYLON.Vector3(0, 0.5, 0)));
            }
        )
    );

    // ########## Render ##########
    engine.runRenderLoop(() => {
        scene.render();
    });
});

/*
| ################################################################################
| UTILS
| ################################################################################
*/

function makePhysicsObject(meshName, scene, mass = 8) {
    let mesh = scene.getMeshByName(meshName);
    meshName = mass == 0 ? mesh.name.split('-sb')[0] : mesh.name.split('-rb')[0];
    
    let meshColl = scene.getMeshByName(`${meshName}-coll`);
    meshColl.isVisible = false;
    meshColl.physicsImpostor = new BABYLON.PhysicsImpostor(meshColl, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    let meshRoot = new BABYLON.Mesh(`${meshName}Root`, scene);
    meshRoot.position = mesh.getAbsolutePosition();
    meshRoot.addChild(mesh);
    meshRoot.addChild(meshColl);

    // Collider params
    let params = {mass: mass};

    meshRoot.physicsImpostor = new BABYLON.PhysicsImpostor(meshRoot, BABYLON.PhysicsImpostor.NoImpostor, params, scene);

    return meshRoot;
}