// map.js
// This function handles Google Maps initialization and related operations.

// Initial debug statement
console.log("map.js loaded");

// Initialize the map
export function initMap() {
    const mapElement = document.getElementById('map');
    const mediaId = mapElement.getAttribute('data-media-id');

    fetch(`/media/get-location-data/${mediaId}/`)
        .then(response => response.json())
        .then(data => {
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                const location = { lat: lat, lng: lng };

                const map = new google.maps.Map(mapElement, {
                    zoom: 8,
                    center: location
                });

                new google.maps.Marker({
                    position: location,
                    map: map
                });
            } else {
                console.error("Invalid latitude or longitude received from server.");
            }
        })
        .catch(error => console.error("Error fetching location data:", error));
}

