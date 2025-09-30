const ARTWORK_CONFIG = [
    { id: 'artwork1', label: 'Back Wall - Left', defaultSrc: 'images/artwork1.jpg' },
    { id: 'artwork2', label: 'Back Wall - Center', defaultSrc: 'images/artwork2.jpg' },
    { id: 'artwork3', label: 'Back Wall - Right', defaultSrc: 'images/artwork3.jpg' },
    { id: 'artwork4', label: 'Front Wall - Left', defaultSrc: 'images/artwork4.jpg' },
    { id: 'artwork5', label: 'Front Wall - Center', defaultSrc: 'images/artwork5.jpg' },
    { id: 'artwork6', label: 'Front Wall - Right', defaultSrc: 'images/artwork6.jpg' },
    { id: 'artwork7', label: 'Right Wall - Left', defaultSrc: 'images/artwork7.jpg' },
    { id: 'artwork8', label: 'Right Wall - Center', defaultSrc: 'images/artwork8.jpg' },
    { id: 'artwork9', label: 'Right Wall - Right', defaultSrc: 'images/artwork9.jpg' },
    { id: 'artwork10', label: 'Left Wall - Left', defaultSrc: 'images/artwork10.jpg' },
    { id: 'artwork11', label: 'Left Wall - Center', defaultSrc: 'images/artwork11.jpg' },
    { id: 'artwork12', label: 'Left Wall - Right', defaultSrc: 'images/artwork12.jpg' }
];

const ARTWORK_STORAGE_PREFIX = '3d-gallery-artwork:';
const artworkConfigMap = new Map(ARTWORK_CONFIG.map(config => [config.id, config]));
const artworkImageMap = new Map();
const artworkPreviewElements = new Map();
const artworkSlots = new Map();

const baseArtworkHeight = 2.5;
const artworkDepth = 0.05;

const artworkTextureLoader = new THREE.TextureLoader();

// --- Three.js Setup ---
let scene, camera, renderer;

const localStorageAvailable = (() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
        return false;
    }
    try {
        const testKey = `${ARTWORK_STORAGE_PREFIX}__test__`;
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn('LocalStorage is not available. Artwork customisation will not persist.', error);
        return false;
    }
})();

function getDefaultArtworkImage(artworkId) {
    const config = artworkConfigMap.get(artworkId);
    return config ? config.defaultSrc : '';
}

function loadStoredArtworkImage(artworkId) {
    if (!localStorageAvailable) {
        return null;
    }
    try {
        return window.localStorage.getItem(`${ARTWORK_STORAGE_PREFIX}${artworkId}`);
    } catch (error) {
        console.warn('Unable to load stored artwork image', artworkId, error);
        return null;
    }
}

function saveArtworkImage(artworkId, dataUrl) {
    if (!localStorageAvailable) {
        return;
    }
    const storageKey = `${ARTWORK_STORAGE_PREFIX}${artworkId}`;
    try {
        if (dataUrl) {
            window.localStorage.setItem(storageKey, dataUrl);
        } else {
            window.localStorage.removeItem(storageKey);
        }
    } catch (error) {
        console.warn('Unable to store artwork image', artworkId, error);
    }
}

function initialiseArtworkImages() {
    ARTWORK_CONFIG.forEach(config => {
        const stored = loadStoredArtworkImage(config.id);
        artworkImageMap.set(config.id, stored || config.defaultSrc);
    });
}

function getArtworkImage(artworkId) {
    return artworkImageMap.get(artworkId) || getDefaultArtworkImage(artworkId);
}

function refreshArtworkPreview(artworkId, imageSrc) {
    const preview = artworkPreviewElements.get(artworkId);
    if (preview) {
        preview.src = imageSrc || getDefaultArtworkImage(artworkId);
    }
}

function updateArtworkImage(artworkId, dataUrl) {
    const config = artworkConfigMap.get(artworkId);
    if (!config) {
        console.warn('Unknown artwork id:', artworkId);
        return;
    }

    saveArtworkImage(artworkId, dataUrl);

    const finalSrc = dataUrl || config.defaultSrc;
    artworkImageMap.set(artworkId, finalSrc);

    applyArtworkTexture(artworkId, finalSrc);
    refreshArtworkPreview(artworkId, finalSrc);
}

function disposeMeshResources(mesh) {
    if (!mesh) {
        return;
    }
    if (mesh.geometry) {
        mesh.geometry.dispose();
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(material => {
        if (!material) {
            return;
        }
        if (material.map) {
            material.map.dispose();
        }
        material.dispose();
    });
}

function setSlotMesh(slot, mesh) {
    if (slot.mesh) {
        slot.group.remove(slot.mesh);
        disposeMeshResources(slot.mesh);
    }
    slot.mesh = mesh;
    if (mesh) {
        slot.group.add(mesh);
    }
}

function setSlotPlaceholder(slot, color = 0x333333) {
    const fallbackGeo = new THREE.BoxGeometry(baseArtworkHeight * 0.75, baseArtworkHeight, artworkDepth);
    const fallbackMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.0 });
    const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMaterial);
    fallbackMesh.castShadow = true;
    fallbackMesh.receiveShadow = true;
    setSlotMesh(slot, fallbackMesh);
}

function applyArtworkTexture(artworkId, imageSrcOverride) {
    const slot = artworkSlots.get(artworkId);
    if (!slot) {
        return;
    }

    const imageSrc = imageSrcOverride || getArtworkImage(artworkId);
    const loadToken = (slot.loadToken || 0) + 1;
    slot.loadToken = loadToken;

    if (!imageSrc) {
        setSlotPlaceholder(slot, 0x333333);
        return;
    }

    setSlotPlaceholder(slot, 0x333333);

    artworkTextureLoader.load(
        imageSrc,
        texture => {
            if (slot.loadToken !== loadToken) {
                texture.dispose();
                return;
            }

            texture.colorSpace = THREE.SRGBColorSpace;
            const imageElement = texture.image;
            const naturalWidth = imageElement.naturalWidth || imageElement.width || baseArtworkHeight;
            const naturalHeight = imageElement.naturalHeight || imageElement.height || baseArtworkHeight;
            const aspectRatio = naturalWidth / Math.max(naturalHeight, 1);

            const artworkWidth = baseArtworkHeight * aspectRatio;
            const artworkGeo = new THREE.BoxGeometry(artworkWidth, baseArtworkHeight, artworkDepth);
            const artworkMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, metalness: 0.1 });

            const artworkMesh = new THREE.Mesh(artworkGeo, artworkMaterial);
            artworkMesh.castShadow = true;
            artworkMesh.receiveShadow = true;

            setSlotMesh(slot, artworkMesh);
        },
        undefined,
        error => {
            if (slot.loadToken !== loadToken) {
                return;
            }
            console.error(`Failed to load artwork texture for ${artworkId}`, error);
            setSlotPlaceholder(slot, 0x550000);
        }
    );
}

function createArtworkManagerCard(config) {
    const card = document.createElement('div');
    card.className = 'artwork-manager-card';

    const title = document.createElement('h3');
    title.textContent = config.label;
    card.appendChild(title);

    const preview = document.createElement('img');
    preview.alt = `${config.label} preview`;
    preview.className = 'artwork-manager-preview';
    preview.src = getArtworkImage(config.id);
    artworkPreviewElements.set(config.id, preview);
    card.appendChild(preview);

    const fileInputLabel = document.createElement('label');
    fileInputLabel.className = 'artwork-manager-upload';
    fileInputLabel.textContent = 'Upload new image';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        processImageFile(file)
            .then(dataUrl => {
                if (!dataUrl) {
                    return;
                }
                if (dataUrl.length > 2.5 * 1024 * 1024) {
                    alert('Image is too large after compression. Please choose a smaller file.');
                    return;
                }
                updateArtworkImage(config.id, dataUrl);
                fileInput.value = '';
            })
            .catch(error => {
                console.error('Failed to process image', error);
                alert('Unable to process the selected image. Please try a different file.');
            });
    });
    fileInputLabel.appendChild(fileInput);
    card.appendChild(fileInputLabel);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'artwork-manager-actions';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset to default';
    resetButton.addEventListener('click', () => {
        updateArtworkImage(config.id, null);
    });
    actionsRow.appendChild(resetButton);

    card.appendChild(actionsRow);

    return card;
}

function processImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const maxDimension = 1024;
                let { width, height } = image;
                if (width > height && width > maxDimension) {
                    height = Math.round((height / width) * maxDimension);
                    width = maxDimension;
                } else if (height >= width && height > maxDimension) {
                    width = Math.round((width / height) * maxDimension);
                    height = maxDimension;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);

                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = mimeType === 'image/png' ? undefined : 0.85;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                resolve(dataUrl);
            };
            image.onerror = () => reject(new Error('Unable to load image for processing.'));
            image.src = reader.result;
        };
        reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
        reader.readAsDataURL(file);
    });
}

function setupArtworkManagerUI() {
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = 'artwork-manager-toggle';
    toggleButton.textContent = 'Manage Artworks';
    document.body.appendChild(toggleButton);

    const overlay = document.createElement('div');
    overlay.id = 'artwork-manager-overlay';

    const modal = document.createElement('div');
    modal.className = 'artwork-manager-modal';
    overlay.appendChild(modal);

    const header = document.createElement('div');
    header.className = 'artwork-manager-header';

    const title = document.createElement('h2');
    title.textContent = 'Artwork Manager';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'artwork-manager-close';
    closeButton.textContent = '×';
    header.appendChild(closeButton);

    modal.appendChild(header);

    if (!localStorageAvailable) {
        const warning = document.createElement('p');
        warning.className = 'artwork-manager-warning';
        warning.textContent = 'Local storage is not available in this browser. Custom artworks will reset when the page reloads.';
        modal.appendChild(warning);
    }

    const grid = document.createElement('div');
    grid.className = 'artwork-manager-grid';
    ARTWORK_CONFIG.forEach(config => {
        const card = createArtworkManagerCard(config);
        grid.appendChild(card);
    });
    modal.appendChild(grid);

    document.body.appendChild(overlay);

    const closeModal = () => {
        overlay.classList.remove('open');
    };

    const openModal = () => {
        overlay.classList.add('open');
    };

    toggleButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            closeModal();
        }
    });
}

// --- Cannon.js Setup ---
let world;
let playerBody;
const playerMass = 70; // kg
const playerRadius = 0.5; // meters
const playerEyeHeight = 1.6; // meters, camera height offset from playerBody center

// --- Controls ---
let controlsEnabled = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isOnGround = false;

const playerMoveSpeed = 5.0; // m/s
const playerJumpVelocity = 5.0; // m/s

const clock = new THREE.Clock();
const cannonStep = 1 / 60;

// Mouse look controls helper
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const minPitchAngle = -_PI_2 + 0.01; // Min pitch (looking almost straight down)
const maxPitchAngle = _PI_2 - 0.01;  // Max pitch (looking almost straight up)

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Deep black background

    artworkSlots.clear();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Camera position will be updated by playerBody

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // --- Gallery Dimensions ---
    const hallSize = 20; // Overall size of the square hall (e.g., 20x20)
    let wallHeight = 3;  // Height of the walls - will be doubled
    wallHeight *= 2;
    const halfHallSize = hallSize / 2; // Thickness can be defined later when walls are actually created

    // Lighting
    // Ambient light provides a very subtle base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15); // Reduced significantly
    scene.add(ambientLight);

    // Directional light (simulating external light, now very minimal)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.05); // Further dimmed
    directionalLight.position.set(10, 15, 10);
    // directionalLight.castShadow = false; // External light probably shouldn't cast detailed shadows inside
    scene.add(directionalLight);

    // Gallery Interior Lights (SpotLights)
    const spotLightY = wallHeight - 0.5; // Position spotlights just below the NEW, TALLER ceiling
    const spotLightProperties = {
        color: 0xffeedd,       // Warm white
        intensity: 1.5,        // Adjusted intensity
        distance: hallSize * 0.8, // Effective distance
        angle: Math.PI / 6,    // Cone angle (approx 30 degrees) - Increased for wider spread
        penumbra: 0.6,         // Softness of the edge - Increased for softer edges
        decay: 2               // Physical falloff
    };

    const createSpotlight = (x, y, z, targetX, targetY, targetZ) => {
        const light = new THREE.SpotLight(
            spotLightProperties.color,
            spotLightProperties.intensity,
            spotLightProperties.distance,
            spotLightProperties.angle,
            spotLightProperties.penumbra,
            spotLightProperties.decay
        );
        light.position.set(x, y, z);
        light.target.position.set(targetX, targetY, targetZ);
        scene.add(light.target); // Target must be added to the scene
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = spotLightProperties.distance;
        // light.shadow.focus = 1; // For sharper shadows, if needed
        scene.add(light);
        return light;
    };

    const wallTargetY = wallHeight / 2.5; // Target lights towards typical artwork height
    const spotLightOffsetFromWall = 2;
    const zPositions = [-hallSize / 3.5, 0, hallSize / 3.5]; // 3 lights per wall

    // Spotlights for +X wall (Wall at x = hallSize / 2)
    zPositions.forEach(zPos => {
        createSpotlight(
            hallSize / 2 - spotLightOffsetFromWall, spotLightY, zPos, // Light position
            hallSize / 2, wallTargetY, zPos                       // Target position on the wall
        );
    });

    // Spotlights for -X wall (Wall at x = -hallSize / 2)
    zPositions.forEach(zPos => {
        createSpotlight(
            -hallSize / 2 + spotLightOffsetFromWall, spotLightY, zPos, // Light position
            -hallSize / 2, wallTargetY, zPos                        // Target position on the wall
        );
    });

    // Spotlights for +Z wall (Wall at z = hallSize / 2)
    const xPositions = [-hallSize / 3.5, 0, hallSize / 3.5];
    xPositions.forEach(xPos => {
        createSpotlight(
            xPos, spotLightY, hallSize / 2 - spotLightOffsetFromWall, // Light position
            xPos, wallTargetY, hallSize / 2                        // Target position on the wall
        );
    });

    // Spotlights for -Z wall (Wall at z = -hallSize / 2)
    xPositions.forEach(xPos => {
        createSpotlight(
            xPos, spotLightY, -hallSize / 2 + spotLightOffsetFromWall, // Light position
            xPos, wallTargetY, -hallSize / 2                       // Target position on the wall
        );
    });

    // Central Ceiling Light for overall ambiance
    const centralLight = new THREE.PointLight(0xfff5e1, 0.25, hallSize * 1.2, 2); // Warmish white, weak, covers gallery, physical decay
    centralLight.position.set(0, wallHeight - 0.3, 0); // Just below NEW, TALLER ceiling center
    centralLight.castShadow = false; // No shadows for this ambient light
    scene.add(centralLight);

    // --- Cannon.js World Setup ---
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10; // Improve solver accuracy

    // Ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const floorTextureLoader = new THREE.TextureLoader();
    const woodFloorTexture = floorTextureLoader.load('https://cdn.polyhaven.com/asset_img/primary/wood_planks.png?height=720', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set((hallSize / 4) * 10, (hallSize / 4) * 10); // Increase tiling by 10x
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improve texture quality at glancing angles
        texture.needsUpdate = true;
    });
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: woodFloorTexture,
        side: THREE.DoubleSide,
        roughness: 0.8, // Adjust for desired wood shininess
        metalness: 0.1  // Wood is not very metallic
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Gallery Bench (Legless and Scaled)
    const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.7, metalness: 0.2 }); // Dark grey
    const benchScaleFactor = 3.0;
    let originalSeatHeight = 0.4; // Will be halved
    originalSeatHeight /= 2;
    const originalSeatWidth = 2.0;
    const originalSeatDepth = 0.5;

    const seatHeight = originalSeatHeight * benchScaleFactor;
    const seatWidth = originalSeatWidth * benchScaleFactor;
    const seatDepth = originalSeatDepth * benchScaleFactor;

    // Three.js Bench Mesh (just the seat)
    const benchGroup = new THREE.Group(); // Still use a group in case we want to rotate the whole bench later
    benchGroup.position.set(0, 0, 0); // Bench at gallery center, on the ground.
    scene.add(benchGroup);

    const seatGeo = new THREE.BoxGeometry(seatWidth, seatHeight, seatDepth);
    const seatMesh = new THREE.Mesh(seatGeo, benchMaterial);
    seatMesh.position.y = seatHeight / 2; // Seat rests directly on the ground
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    benchGroup.add(seatMesh);

    // Cannon.js Bench Physics Body (just the seat)
    const benchBody = new CANNON.Body({ mass: 0 }); // Static body
    
    const seatShape = new CANNON.Box(new CANNON.Vec3(seatWidth / 2, seatHeight / 2, seatDepth / 2));
    // The position of the seat shape is relative to the benchBody's origin (which is at 0,0,0 on the ground)
    // Since the benchBody itself is at y=0, and the seatMesh is also positioned with its bottom at y=0 relative to the group,
    // the shape's offset y should also be seatHeight / 2.
    benchBody.addShape(seatShape, new CANNON.Vec3(0, seatHeight / 2, 0));

    benchBody.position.set(0, 0, 0); // Matches benchGroup's initial position (on the ground at gallery center)
    world.addBody(benchBody);

    // Ceiling
    const ceilingSize = hallSize; // Ceiling covers the whole hall
    const ceilingYPos = wallHeight;

    // Three.js Ceiling Mesh
    const ceilingGeometry = new THREE.PlaneGeometry(ceilingSize, ceilingSize);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, side: THREE.DoubleSide }); // Very dark grey
    const ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceilingMesh.position.set(0, ceilingYPos, 0);
    ceilingMesh.rotation.x = Math.PI / 2; // Rotate to be horizontal, facing downwards by default from this rotation
    ceilingMesh.receiveShadow = true; // Optional, if lights are added above pointing down
    scene.add(ceilingMesh);

    // Cannon.js Ceiling Physics Body
    const ceilingShape = new CANNON.Plane();
    const ceilingBody = new CANNON.Body({ mass: 0 }); // Static body
    ceilingBody.addShape(ceilingShape);
    ceilingBody.position.set(0, ceilingYPos, 0);
    // Rotate the Cannon.js plane so its normal points downwards (-Y direction)
    ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    world.addBody(ceilingBody);

    // Ceiling stars removed as per request.

    // Player Physics Body
    const playerShape = new CANNON.Sphere(playerRadius);
    playerBody = new CANNON.Body({
        mass: playerMass,
        shape: playerShape,
        position: new CANNON.Vec3(0, playerRadius + 0.1, 5), // Start slightly above ground
        linearDamping: 0.9, // To prevent sliding forever
        angularDamping: 1.0 // To prevent spinning from collisions
    });
    playerBody.addEventListener("collide", onPlayerCollision);
    world.addBody(playerBody);

    // Example Box has been removed.

    // Create Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const wallThickness = 0.5; // meters
    // hallSize and wallHeight are now defined earlier, before the Lighting section.

    // Artwork placement and texture setup
    const artworkYPos = wallHeight / 2.2;

    let artworkConfigIndex = 0;
    const getNextArtworkConfig = () =>
        artworkConfigIndex < ARTWORK_CONFIG.length ? ARTWORK_CONFIG[artworkConfigIndex++] : null;

    const createArtworkSlot = (x, y, z, rotationY) => {
        const config = getNextArtworkConfig();
        if (!config) {
            return;
        }

        const artworkGroup = new THREE.Group();
        artworkGroup.position.set(x, y, z);
        artworkGroup.rotation.y = rotationY;
        artworkGroup.userData.artworkId = config.id;
        scene.add(artworkGroup);

        const slot = { group: artworkGroup, mesh: null, loadToken: 0 };
        artworkSlots.set(config.id, slot);
        applyArtworkTexture(config.id);
    };

    // All positions are relative to the gallery center (0,0,0), where the bench is.
    // Artworks are placed so their back is flush with the inner surface of the walls.

    const ARTWORK_PLACEMENT_Y = artworkYPos;

    // Define an offset to move artworks from the wall surface towards the gallery center.
    const artworkOffsetFromWallTowardCenter = 0.3; // Adjusted: 0.3m from wall towards center.

    // Calculate the base distance from the gallery center (0,0,0) to where the artwork's center will be.
    // This accounts for hall size, wall thickness, artwork depth, and the new offset.
    const artworkCenterCoordinateMagnitude = hallSize / 2 - wallThickness / 2 - artworkDepth / 2 - artworkOffsetFromWallTowardCenter;

    // Coordinates for artwork centers on walls along negative and positive axes.
    const ART_PLACEMENT_NEG_AXIS = -artworkCenterCoordinateMagnitude;
    const ART_PLACEMENT_POS_AXIS =  artworkCenterCoordinateMagnitude;

    // Define offsets for placing artworks along the length of a wall (relative to wall center)
    const ALONG_WALL_OFFSET_CENTER = 0;
    const ALONG_WALL_OFFSET_SIDE = hallSize / 3.5; // e.g., positions at -5 and +5 for hallSize 20

    // --- Create Artworks (3 per wall) ---

    // Back wall artworks (-Z wall, facing +Z)
    createArtworkSlot(-ALONG_WALL_OFFSET_SIDE, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_NEG_AXIS, 0);
    createArtworkSlot( ALONG_WALL_OFFSET_SIDE, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_NEG_AXIS, 0);
    createArtworkSlot( ALONG_WALL_OFFSET_CENTER, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_NEG_AXIS, 0);

    // Front wall artworks (+Z wall, facing -Z)
    createArtworkSlot(-ALONG_WALL_OFFSET_SIDE, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_POS_AXIS, Math.PI);
    createArtworkSlot( ALONG_WALL_OFFSET_SIDE, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_POS_AXIS, Math.PI);
    createArtworkSlot( ALONG_WALL_OFFSET_CENTER, ARTWORK_PLACEMENT_Y, ART_PLACEMENT_POS_AXIS, Math.PI);

    // Left wall artworks (-X wall, facing +X)
    createArtworkSlot(ART_PLACEMENT_NEG_AXIS, ARTWORK_PLACEMENT_Y, -ALONG_WALL_OFFSET_SIDE, Math.PI / 2);
    createArtworkSlot(ART_PLACEMENT_NEG_AXIS, ARTWORK_PLACEMENT_Y,  ALONG_WALL_OFFSET_CENTER, Math.PI / 2);
    createArtworkSlot(ART_PLACEMENT_NEG_AXIS, ARTWORK_PLACEMENT_Y,  ALONG_WALL_OFFSET_SIDE, Math.PI / 2);

    // Right wall artworks (+X wall, facing -X)
    createArtworkSlot(ART_PLACEMENT_POS_AXIS, ARTWORK_PLACEMENT_Y, -ALONG_WALL_OFFSET_SIDE, -Math.PI / 2);
    createArtworkSlot(ART_PLACEMENT_POS_AXIS, ARTWORK_PLACEMENT_Y,  ALONG_WALL_OFFSET_CENTER, -Math.PI / 2);
    createArtworkSlot(ART_PLACEMENT_POS_AXIS, ARTWORK_PLACEMENT_Y,  ALONG_WALL_OFFSET_SIDE, -Math.PI / 2);

    if (artworkConfigIndex < ARTWORK_CONFIG.length) {
        console.warn('Not all artwork configurations were placed in the gallery. Remaining:', ARTWORK_CONFIG.length - artworkConfigIndex);
    }

    function createWall(width, height, depth, x, y, z, rotationY = 0) {
        // Three.js Wall
        const wallGeo = new THREE.BoxGeometry(width, height, depth);
        const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
        wallMesh.position.set(x, y, z);
        if (rotationY !== 0) wallMesh.rotation.y = rotationY;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);

        // Cannon.js Wall
        const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const wallBody = new CANNON.Body({ mass: 0 }); // Static body
        wallBody.addShape(wallShape);
        wallBody.position.set(x, y, z);
        if (rotationY !== 0) wallBody.quaternion.setFromEuler(0, rotationY, 0);
        world.addBody(wallBody);
    }

    // const halfHallSize = hallSize / 2; // Moved to the top of init()
    const wallYPos = wallHeight / 2;

    // Front Wall (positive Z)
    createWall(hallSize, wallHeight, wallThickness, 0, wallYPos, halfHallSize - wallThickness / 2);
    // Back Wall (negative Z)
    createWall(hallSize, wallHeight, wallThickness, 0, wallYPos, -halfHallSize + wallThickness / 2);
    // Right Wall (positive X)
    createWall(wallThickness, wallHeight, hallSize, halfHallSize - wallThickness / 2, wallYPos, 0, 0);
    // Left Wall (negative X)
    createWall(wallThickness, wallHeight, hallSize, -halfHallSize + wallThickness / 2, wallYPos, 0, 0);


    // Pointer Lock Controls Setup
    const instructions = document.createElement('div');
    instructions.innerHTML = 'Click to play';
    instructions.style.position = 'absolute';
    instructions.style.top = '50%';
    instructions.style.left = '50%';
    instructions.style.transform = 'translate(-50%, -50%)';
    instructions.style.fontSize = '24px';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0,0,0,0.5)';
    instructions.style.padding = '10px';
    instructions.style.cursor = 'pointer';
    document.body.appendChild(instructions);

    instructions.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('pointerlockerror', onPointerLockError, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        controlsEnabled = true;
        const instructions = document.querySelector('div[style*="absolute"]');
        if (instructions) instructions.style.display = 'none';
    } else {
        controlsEnabled = false;
        const instructions = document.querySelector('div[style*="absolute"]');
        if (instructions) instructions.style.display = 'block';
    }
}

function onPointerLockError() {
    console.error('PointerLock Error');
}

function onMouseMove(event) {
    if (!controlsEnabled) return;

    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    _euler.setFromQuaternion(camera.quaternion); // Get current camera orientation

    _euler.y -= movementX * 0.002; // Yaw (rotation around Y axis)
    _euler.x -= movementY * 0.002; // Pitch (rotation around X axis)

    // Clamp pitch angle
    _euler.x = Math.max(minPitchAngle, Math.min(maxPitchAngle, _euler.x));

    camera.quaternion.setFromEuler(_euler); // Apply the new orientation
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': if (isOnGround) canJump = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function onPlayerCollision({ contact }) {
    // Check if the contact normal is pointing upwards, indicating we are on something.
    const contactNormal = new CANNON.Vec3();
    const upAxis = new CANNON.Vec3(0, 1, 0);
    // contact.bi and contact.bj are the colliding bodies
    // contact.ni is the contact normal
    // We need to check if the normal is against the player's direction of gravity
    if (contact.bi.id === playerBody.id) { // If body A is the player
        contact.ni.negate(contactNormal); // Normal points away from body A
    } else { // If body B is the player
        contactNormal.copy(contact.ni); // Normal points away from body A (towards B)
    }
    // If the dot product is high, it means we are on a fairly flat surface
    if (contactNormal.dot(upAxis) > 0.5) {
        isOnGround = true;
    }
}

function updatePlayer(deltaTime) {
    if (!controlsEnabled && !playerBody) return;

    const inputVelocity = new THREE.Vector3();
    
    // Create a temporary Euler angle to get the current camera yaw
    const cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    cameraEuler.setFromQuaternion(camera.quaternion); // Get current orientation from the camera's quaternion

    // We only want the yaw component (rotation around Y axis) for movement direction.
    // Create a new Euler with only the yaw from the camera.
    const movementEuler = new THREE.Euler(0, cameraEuler.y, 0, 'YXZ');

    if (moveForward) inputVelocity.z = -playerMoveSpeed;
    if (moveBackward) inputVelocity.z = playerMoveSpeed;
    if (moveLeft) inputVelocity.x = -playerMoveSpeed;
    if (moveRight) inputVelocity.x = playerMoveSpeed;

    // Apply the camera's YAW rotation to the movement vector
    inputVelocity.applyEuler(movementEuler);

    playerBody.velocity.x = inputVelocity.x;
    playerBody.velocity.z = inputVelocity.z;

    if (canJump && isOnGround) {
        playerBody.velocity.y = playerJumpVelocity;
        canJump = false;
        isOnGround = false; // Assume we are not on ground immediately after jump
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (controlsEnabled || document.pointerLockElement === document.body) {
         updatePlayer(deltaTime);
    }
   
    // Step the physics world
    if (world) {
        world.step(cannonStep, deltaTime, 3);

        // Update Three.js meshes based on Cannon.js bodies (e.g., the example box)
        // Update Three.js meshes based on Cannon.js bodies (if any other than player)
        scene.traverse(function(object) {
            // Ensure we are not trying to update the player's visual representation here,
            // as the camera itself is the player's visual representation in FPV.
            // If we had a visible player model, we would update it here.
            // For now, this loop might only be relevant if we add other dynamic physics objects.
            if (object.isMesh && object.userData.physicsBody && object.userData.physicsBody !== playerBody) {
                object.position.copy(object.userData.physicsBody.position);
                object.quaternion.copy(object.userData.physicsBody.quaternion);
            }
        });

        // Update camera position to player body
        if (playerBody) {
            const targetPosition = new THREE.Vector3();
            targetPosition.copy(playerBody.position);
            targetPosition.y += playerEyeHeight;
            camera.position.lerp(targetPosition, 0.2); // Adjust 0.2 for more/less smoothing
        }
    }

    renderer.render(scene, camera);
}

initialiseArtworkImages();
init();
setupArtworkManagerUI();
