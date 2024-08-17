// aosInit.js
// This module handles the initialization of AOS (Animate on Scroll) library.

// Initial debug statement
console.log("aosInit.js loaded");

// 

export function initAOS() {
    AOS.init({
        duration: 800,
        easing: 'slide',
        once: false
    });
}
