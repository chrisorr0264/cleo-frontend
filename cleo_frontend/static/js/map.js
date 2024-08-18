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
            let lat = parseFloat(data.latitude);
            let lng = parseFloat(data.longitude);

            // Check if latitude and longitude are valid
            let location, zoomLevel;

            if (isNaN(lat) || isNaN(lng)) {
                // Default to the center of Canada if no valid location data is found
                location = { lat: 56.1304, lng: -106.3468 }; // Center of Canada
                zoomLevel = 4; // Zoom out to show all of Canada
            } else {
                location = { lat: lat, lng: lng };
                zoomLevel = 8; // Default zoom level for specific location
            }

            const map = new google.maps.Map(mapElement, {
                zoom: zoomLevel,
                center: location,
                mapId: "6673aa6547bec883"  // Replace with your actual Map ID
            });

            console.log(location);
            console.log(typeof map);

            // Only add the marker if there's a valid location
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: location,
                    title: "Location",
                });
            }
        })
        .catch(error => console.error("Error fetching location data:", error));
}

