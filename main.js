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

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// Adjust renderer settings for better glow visibility
renderer.setClearColor(0x000000); // Black background
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Set up post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // bloom strength
    0.4,  // radius
    0.85  // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const alphabetColor = new THREE.Color('#f3e3d3');
    const digitColor = new THREE.Color(1 - alphabetColor.r, 1 - alphabetColor.g, 1 - alphabetColor.b);

    const alphabetMaterial = new THREE.MeshBasicMaterial({ color: alphabetColor });
    const digitMaterial = new THREE.MeshBasicMaterial({ color: digitColor });

    const textGeometryF = new TextGeometry('F', {
        font: font,
        size: 1,
        height: 0.1,
    });
    const textMeshF = new THREE.Mesh(textGeometryF, alphabetMaterial);
    textMeshF.position.set(-3, 0, 0); // Position on the left side
    scene.add(textMeshF);

    const textGeometry1 = new TextGeometry('1', {
        font: font,
        size: 1,
        height: 0.1,
    });
    const textMesh1 = new THREE.Mesh(textGeometry1, digitMaterial);
    textMesh1.position.set(3, 0, 0); // Position on the right side
    scene.add(textMesh1);
});

const glowShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: { type: 'c', value: new THREE.Color(0xffffff) },
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
            float intensity = pow(0.9 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); // Increased power and base value
            gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * 1.5); // Increased intensity multiplier
        }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

// Glow cube
const glowCube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), glowShaderMaterial);
scene.add(glowCube);

// White point light
const pointLight = new THREE.PointLight(0xffffff, 2, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Shared uniforms for both shaders
const shaderUniforms = {
    lightPosition: { value: new THREE.Vector3(0, 0, 0) },
    lightColor: { value: new THREE.Vector3(1, 1, 1) },
    ambientIntensity: { value: 0.331 }, // (131 + 200) / 1000
    viewPosition: { value: camera.position }
};

// Alphabet ShaderMaterial (Plastic)
const alphabetShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        ...shaderUniforms,
        baseColor: { value: new THREE.Color('#f3e3d3') },
        shininess: { value: 32.0 } // Moderate shininess for plastic
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 lightPosition;
        uniform vec3 lightColor;
        uniform float ambientIntensity;
        uniform vec3 baseColor;
        uniform vec3 viewPosition;
        uniform float shininess;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // Ambient
            vec3 ambient = ambientIntensity * baseColor;
            
            // Diffuse
            vec3 lightDir = normalize(lightPosition - vPosition);
            float diff = max(dot(vNormal, lightDir), 0.0);
            vec3 diffuse = diff * lightColor * baseColor;
            
            // Specular (Blinn-Phong)
            vec3 viewDir = normalize(viewPosition - vPosition);
            vec3 halfwayDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(vNormal, halfwayDir), 0.0), shininess);
            vec3 specular = spec * lightColor;
            
            vec3 result = ambient + diffuse + specular;
            gl_FragColor = vec4(result, 1.0);
        }
    `
});


function animate() {

    // Animate the glow cube
    glowCube.rotation.x += 0.005;
    glowCube.rotation.y += 0.005;

    cube.rotation.x += 0.001;
    cube.rotation.y += 0.001;
    
    // Update shader uniforms if needed
    shaderUniforms.lightPosition.value.copy(glowCube.position);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    composer.render();
}

// Start animation
animate();