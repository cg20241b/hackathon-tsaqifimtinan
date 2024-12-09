import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

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
        glowColor: { type: 'c', value: new THREE.Color(0xffffff) }, // Pure white color
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
            gl_FragColor = vec4(1.0, 1.0, 1.0, intensity); // Force white color with varying intensity
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


function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}