import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON from 'cannon'
import { BufferGeometryUtils } from 'three'



/**
 * Debug
 */
const gui = new dat.GUI()
const debugobject = {}
debugobject.createSphere=()=>
{
    createSphere(
        Math.random()*0.5,
        {x:(Math.random()-0.5)*3,
        y:3,
        z:(Math.random()-0.5)*3
    })
}
gui.add(debugobject,'createSphere')


debugobject.createBox = () =>
{
    createBox(
        Math.random(),
        Math.random(),
        Math.random(),
        {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3
        }
    )
}
gui.add(debugobject, 'createBox')


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

//cannon

const world = new CANNON.World()
world.broadphase=new CANNON.SAPBroadphase(world)
world.allowSleep=true
world.gravity.set(0,-9.82,0)

const defaultmaterial = new CANNON.Material('default')
defaultmaterial.side= THREE.DoubleSide;
const defaultcontactmaterial=new CANNON.ContactMaterial(
    defaultmaterial,
    defaultmaterial,
    {
       friction: 1.1,
       restitution: 0.7
    }

)
world.addContactMaterial(defaultcontactmaterial)



// const sphereShape = new CANNON.Sphere(0.5)
// const sphereBody = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0,3,0),
//     shape: sphereShape,
//     material: defaultmaterial
// })

// sphereBody.applyLocalForce(new CANNON.Vec3(150,0,0),new CANNON.Vec3(0,0,0))
// world.addBody(sphereBody)



 const floorShape = new CANNON.Plane()
 const floorBody = new CANNON.Body()
 floorBody.material = defaultmaterial
 floorBody.material.side= THREE.DoubleSide;
 floorBody.mass = 0
 floorBody.addShape(floorShape)
 floorBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(-1,0,0),
      Math.PI *0.5
 ) 
 world.addBody(floorBody)



/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//     new THREE.SphereBufferGeometry(0.5, 32, 32),
//     new THREE.MeshStandardMaterial({
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture
//     })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5
// scene.add(sphere)


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, -5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})    
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))





//sounds
const hitsound = new Audio('/sounds/hit.mp3')

const playhitsound = (collision) =>
{ 
    const impactstrenght = collision.contact.getImpactVelocityAlongNormal()
    
    if(impactstrenght> 2)
    {
        hitsound.volume=Math.random()
        hitsound.currentTime = 0
        hitsound.play()

    }
    // console.log("playing")
}



//sphere
const objectsTOUpdate = []
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20,20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness:0.3,
    roughness:0.4,
    envMap: environmentMapTexture
})    

const createSphere = (radius,position) =>
{
    //three js mesh creation
    const mesh = new THREE.Mesh(sphereGeometry,sphereMaterial)
    mesh.scale.set(radius,radius,radius)
    mesh.castShadow = true;
    mesh.position.copy(position);
    scene.add(mesh);


    // //cannon js part
    const shape =new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass:1,
        position: new CANNON.Vec3(0,3,0),
        shape:shape,
        material: defaultmaterial
    })    
    
    body.position.copy(position);
    body.addEventListener('collide',playhitsound)
    world.addBody(body);
  //save thm in objectsTOUpdate  
  objectsTOUpdate.push({
      mesh: mesh,
      body: body
  })    

}  

createSphere(0.5,{x:0,y:3,z:0})



//box

const boxGeometry = new THREE.BoxBufferGeometry(1,1,1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness:0.3,
    roughness:0.4,
    envMap: environmentMapTexture
})

const createBox = (width, height, depth, position) =>
{
    // Three.js mesh
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultmaterial
    })
    body.position.copy(position)
    body.addEventListener('collide',playhitsound)
    world.addBody(body)

    // Save in objects
    objectsTOUpdate.push({
        mesh: mesh,
        body: body
    })
}

// createBox(1, 1.5, 2, { x: 0, y: 3, z: 0 })
// createBox(1,1,1,1)

//reset

debugobject.reset= ()=>
{
   for(const object of  objectsTOUpdate)
   {
       object.body.removeEventListener('collide',playhitsound)
       world.removeBody(object.body)
       scene.remove(object.mesh)
   }
}

gui.add(debugobject, 'reset')












/**
 * Animate
 */
const clock = new THREE.Clock()
let oldelapsedTime = 0;
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    const deltatime = elapsedTime - oldelapsedTime;
    oldelapsedTime = elapsedTime;

    // sphereBody.applyForce(new CANNON.Vec3(-0.5,0,0),sphereBody.position)



    // console.log(deltatime)
    //physics world update
    world.step(1/60, deltatime, 3)

//   console.log(sphereBody.position.y)
//   sphere.position.x=sphereBody.position.x;
//   sphere.position.y=sphereBody.position.y;
//   sphere.position.z=sphereBody.position.z;
    //  sphere.position.copy(sphereBody.position)
   for(const object of objectsTOUpdate)
   {
       object.mesh.position.copy(object.body.position)
       object.mesh.quaternion.copy(object.body.quaternion)
   }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()