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
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
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

function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}