# 3D Art Gallery Online

This project is an online 3D art gallery built using Three.js for 3D rendering and Cannon.js for physics simulation. A built-in
artwork manager allows you to replace each canvas in the scene with your own images directly from the browser.

## How to Run

1.  Ensure you have a modern web browser that supports WebGL.
2.  Simply open the `index.html` file in your web browser.
3.  Click **Manage Artworks** to upload or reset gallery images. Custom images are saved in the browser's `localStorage`.

## Project Structure

-   `index.html`: The main HTML file.
-   `main.js`: Contains the JavaScript code for Three.js and Cannon.js logic.
-   `style.css`: Basic CSS for the page.
-   `README.md`: This file.
-   `images/`: Default artwork textures used when no custom images are provided.

All application logic now runs entirely in the browser—no backend services are required.

## Libraries Used

-   [Three.js](https://threejs.org/): A JavaScript 3D library.
-   [Cannon.js](https://schteppe.github.io/cannon.js/): A lightweight 3D physics engine for the web.

CDN links are used in `index.html` for these libraries, so no local installation is required to run the basic example.
