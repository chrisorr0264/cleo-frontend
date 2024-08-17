// initTagManagement.js
// This module handles the initialization of tag management functionality.

// Initial debug statement
console.log("initTagManagement.js loaded");

// 


export function initTagManagement() {
    // Functions to open, load, edit, save, delete tags
    $('#manageTagsButton').on('click', function() {
        $('#manageTagsModal').modal('show');
        loadExistingTags();
    });

    // Handle tag creation/update
    $('#tagForm').on('submit', function(event) {
        event.preventDefault();
        const tagName = $('#tagName').val();

        $.ajax({
            url: '/media/manage_tag/', // Replace with your actual endpoint
            method: 'POST',
            data: {
                name: tagName,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function() {
                $('#tagName').val('');
                loadExistingTags();
            }
        });
    });

    // Handle tag deletion
    $('#existingTagsList').on('click', '.delete-tag', function() {
        const tagId = $(this).data('tag-id');
        
        const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');

        if (confirm('Are you sure you want to delete this tag?')) {
            $.ajax({
                url: `/media/delete_tag/${tagId}/`,
                method: 'POST',
                data: {
                    csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
                },
                success: function() {
                    fetchandUpdateTags(mediaId);  // Refresh the list after deletion
                    // Remove the deleted tag from the modal list of available tags
                    $(`#availableTagsModal option[value='${tagId}']`).remove();
                },
                error: function() {
                    alert('An error occurred while deleting the tag.');
                }
            });
        }
    });

    // Handle Edit Button Click
    $('#existingTagsList').on('click', '.edit-tag', function() {
        const tagId = $(this).data('tag-id');
        const tagName = $(this).data('tag-name');

        // Replace the tag name with an input field for editing
        const tagElement = $(this).closest('li').find('.tag-name');
        
        // Check if the input field already exists
        if (!tagElement.find('input').length) {
            tagElement.html(`<input type="text" class="form-control tag-edit-input" value="${tagName}">`);
        }

        // Change the Edit button to a Save button
        $(this).text('Save').removeClass('edit-tag btn-secondary').addClass('save-tag btn-success');

        // Disable the Delete button while editing
        $(this).closest('li').find('.delete-tag').prop('disabled', true);
    });

    // Handle Save Button Click (after editing)
    $('#existingTagsList').on('click', '.save-tag', function() {
        const tagId = $(this).data('tag-id');
        const newTagName = $(this).closest('li').find('.tag-edit-input').val().trim();
    
        if (newTagName === '') {
            alert('Tag name cannot be empty.');
            return;
        }
    
        console.log("Sending data:", { tag_id: tagId, name: newTagName });  // Log the data being sent
    
        $.ajax({
            url: '/media/manage_tag/',
            method: 'POST',
            data: {
                tag_id: tagId,
                name: newTagName,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function() {
                loadExistingTags();  // Refresh the list after saving
            },
            error: function() {
                alert('An error occurred while updating the tag.');
            }
        });
    });

    function loadExistingTags() {
        $.ajax({
            url: '/media/get_tags/',
            method: 'GET',
            success: function(data) {
                const existingTagsList = $('#existingTagsList');
                existingTagsList.empty();
                data.tags.forEach(tag => {
                    existingTagsList.append(`
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span class="tag-name">${tag.tag_name}</span>
                            <div>
                                <button class="btn btn-secondary btn-sm edit-tag" data-tag-id="${tag.tag_id}" data-tag-name="${tag.tag_name}">Edit</button>
                                <button class="btn btn-danger btn-sm delete-tag" data-tag-id="${tag.tag_id}">Delete</button>
                            </div>
                        </li>
                    `);
                });
            }
        });
    }
}
