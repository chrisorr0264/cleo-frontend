// tags.js
// This module contains functions related to fetching and updating tags.

// Initial debug statement
console.log("tags.js loaded");

// Function to fetch tags and update the lists
export function fetchAndUpdateTags(mediaId) {
    fetch(`/media/fetch-tags/${mediaId}/`)
        .then(response => response.json())
        .then(data => {
            const assignedTags = document.getElementById('assigned-tags');
            const availableTags = document.getElementById('available-tags');

            assignedTags.innerHTML = '';
            availableTags.innerHTML = '';

            // Sort the assigned tags alphabetically by name
            data.assigned_tags.sort((a, b) => a.name.localeCompare(b.name));

            // Append the sorted assigned tags to the DOM
            data.assigned_tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                assignedTags.appendChild(option);
            });

            // Sort the available tags alphabetically by name
            data.available_tags.sort((a, b) => a.name.localeCompare(b.name));

            // Append the sorted available tags to the DOM
            data.available_tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                availableTags.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching tags:', error));
}

// Function to update tags for the current media item
export function updateTags() {
    const assignedTags = Array.from(document.getElementById('assigned-tags').options).map(option => option.value);
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');

    fetch('/media/update-tags/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            media_object_id: mediaId,
            assigned_tags: assignedTags
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchAndUpdateTags(mediaId);
        } else {
            alert('Failed to update tags.');
        }
    });   
}

// Helper function to move all tags to the left (assigned)
export function moveAllLeft(mediaId) {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');

    while (availableTags.options.length > 0) {
        assignedTags.appendChild(availableTags.options[0]);
    }

    // Call updateTags to refresh lists
    updateTags();
}

// Helper function to move selected tags to the left (assigned)
export function moveOneLeft(mediaId) {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(availableTags.selectedOptions);

    selectedOptions.forEach(option => {
        assignedTags.appendChild(option);
    });

    // Call updateTags to refresh lists
    updateTags();
}
 
// Helper function to move all tags to the right (available)
export function moveAllRight(mediaId) {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');

    while (assignedTags.options.length > 0) {
        availableTags.appendChild(assignedTags.options[0]);
    }

    // Call updateTags to refresh lists
    updateTags();
}

// Helper function to move selected tags to the right (available)
export function moveOneRight(mediaId) {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(assignedTags.selectedOptions);

    selectedOptions.forEach(option => {
        availableTags.appendChild(option);
    });

    // Call updateTags to refresh lists
    updateTags();
}

// Function to reset all tags by reloading the database tags
export function resetTags() {
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
    fetchAndUpdateTags(mediaId);
}
