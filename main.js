import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Set up post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,  // bloom strength
    0.4,  // radius
    0.85  // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// Adjust renderer settings for better glow visibility
renderer.setClearColor(0x000000); // Black background
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5; // Increase exposure
renderer.outputEncoding = THREE.sRGBEncoding;

// Update existing cube with glow material
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const glowShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(1.0, 1.0, 1.0, intensity);
        }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

// Update existing cube
cube.geometry = cubeGeometry;
cube.material = glowShaderMaterial;
cube.position.set(0, 0, 0);

// Set up renderer for transparency
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

// Add point light at cube's position
const pointLight = new THREE.PointLight(0xffffff, 3, 100);
pointLight.position.copy(cube.position);
scene.add(pointLight);

// Shared uniforms for both shaders
const shaderUniforms = {
    lightPosition: { value: new THREE.Vector3(0, 0, 0) },
    lightColor: { value: new THREE.Vector3(1, 1, 1) },
    ambientIntensity: { value: 0.331 }, // (131 + 200) / 1000
    viewPosition: { value: camera.position }
};

// Create and add text meshes
const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    // Alphabet shader (F)
    const alphabetShaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            ...shaderUniforms,
            baseColor: { value: new THREE.Color('#f3e3d3') },
            shininess: { value: 32.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            
            void main() {
                vNormal = normalMatrix * normal;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 lightPosition;
            uniform vec3 lightColor;
            uniform float ambientIntensity;
            uniform vec3 baseColor;
            uniform float shininess;
            uniform vec3 viewPosition;
            
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(lightPosition - vWorldPosition);
                vec3 viewDir = normalize(viewPosition - vWorldPosition);
                
                // Ambient
                vec3 ambient = ambientIntensity * baseColor;
                
                // Diffuse
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = diff * lightColor * baseColor;
                
                // Specular (Blinn-Phong)
                vec3 halfDir = normalize(lightDir + viewDir);
                float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
                vec3 specular = spec * lightColor * 0.5;
                
                vec3 result = ambient + diffuse + specular;
                gl_FragColor = vec4(result, 1.0);
            }
        `
    });

    const digitShaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            ...shaderUniforms,
            baseColor: { value: new THREE.Color(1 - 0xf3/0xff, 1 - 0xe3/0xff, 1 - 0xd3/0xff) },
            shininess: { value: 128.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            
            void main() {
                vNormal = normalMatrix * normal;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 lightPosition;
            uniform vec3 lightColor;
            uniform float ambientIntensity;
            uniform vec3 baseColor;
            uniform float shininess;
            uniform vec3 viewPosition;
            
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(lightPosition - vWorldPosition);
                vec3 viewDir = normalize(viewPosition - vWorldPosition);
                
                vec3 ambient = ambientIntensity * baseColor;
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = diff * lightColor * baseColor;
                
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
                vec3 specular = spec * baseColor;
                
                vec3 result = ambient + diffuse + specular;
                gl_FragColor = vec4(result, 1.0);
            }
        `
    });

    // Create F text geometry
    const textGeometryF = new TextGeometry('F', {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 12
    });

    // Center the geometry
    textGeometryF.computeBoundingBox();
    const centerOffsetF = - 0.5 * (textGeometryF.boundingBox.max.x - textGeometryF.boundingBox.min.x);
    
    const textMeshF = new THREE.Mesh(textGeometryF, alphabetShaderMaterial);
    textMeshF.position.set(-3 + centerOffsetF, 0, 0);
    scene.add(textMeshF);

    // Create digit "1" with similar process
    const digitGeometry = new TextGeometry('1', {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 12
    });

    digitGeometry.computeBoundingBox();
    const centerOffset1 = - 0.5 * (digitGeometry.boundingBox.max.x - digitGeometry.boundingBox.min.x);

    const digitMesh = new THREE.Mesh(digitGeometry, digitShaderMaterial);
    digitMesh.position.set(3 + centerOffset1, 0, 0);
    scene.add(digitMesh);
});

// Add keyboard controls
document.addEventListener('keydown', (event) => {
    const moveSpeed = 0.1; // Adjust speed as needed
    
    switch(event.key.toLowerCase()) {
        case 'w':
            cube.position.y += moveSpeed;
            // Update point light position to follow cube
            pointLight.position.copy(cube.position);
            break;
        case 's':
            cube.position.y -= moveSpeed;
            // Update point light position to follow cube
            pointLight.position.copy(cube.position);
            break;
    }
});

// Make sure cube is in scene
if (!scene.children.includes(cube)) {
    scene.add(cube);
}

function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.0005;
    cube.rotation.y += 0.0005;

    // Update uniforms
    shaderUniforms.lightPosition.value.copy(cube.position);
    shaderUniforms.viewPosition.value.copy(camera.position);

    // Render scene
    composer.render();
}

// Start the animation
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});