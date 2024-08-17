// main.js
// Main entry point for all other cleo modules

// Initial debug statement
console.log("main.js loaded");

// Imports for all the function modules
import {initAOS} from './aosInit.js';
import {siteMenuClone} from './menu.js';
import {fetchAndUpdateTags, updateTags, moveAllLeft, moveOneLeft, moveAllRight, moveOneRight, resetTags} from './tags.js';
import {toggleFaceLocations, searchFaces, updateFaceName, updateFaceValidity, markFaceAsInvalid, triggerManualFaceRecognition, drawRectangle, finishDrawing, enableManualDrawing, disableDrawing, removeDrawnBoxes, processManualFaces, sendManualFaceData} from './faces.js';
import { initMap } from './map.js';
import { initImageRotation } from './imageRotation.js';
import { initTagManagement } from './tagManagement.js';
import { bindEventListeners } from './eventListeners.js';


// Load all the functions
document.addEventListener('DOMContentLoaded', function() {
    initAOS();
    siteMenuClone();
    initTagManagement();
    initMap();
    initImageRotation();
    bindEventListeners();
});
