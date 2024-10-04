from django.core.paginator import Paginator
from django.shortcuts import render, get_object_or_404
from django.urls import get_resolver
from django.http import JsonResponse, HttpRequest, HttpResponse
from .models import TblMediaObjects, TblTags, TblTagsToMedia, TblFaceLocations, TblFaceMatches, TblKnownFaces, TblIdentities
from ..account.models import GallerySettings
from django.conf import settings
from django.db import transaction
from django.db.models import Q, F, Value
from django.db.models.functions import Coalesce
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from PIL import Image
import os
import random
import json
from ...utils.facelabeler import FaceLabeler
from ...utils.custom_paginator import CustomPaginator 
import numpy as np
import hashlib
import face_recognition
import shutil
import mimetypes
import zipfile
from io import BytesIO
import logging
from datetime import datetime
from django.core.serializers.json import DjangoJSONEncoder
from PIL import Image, ExifTags

logger = logging.getLogger('django')

def generate_paths(media):
    media.full_path = os.path.join(settings.IMAGE_PATH, media.new_name)
    media.thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)
    media.media_object_id = media.media_object_id
    width, height = media.width, media.height
    media.size_raw = os.path.getsize(media.full_path)

    media.size = convert_size(media.size_raw)

    if width and height and height != 0:
        media.aspect_ratio = width / height
    else:
        media.aspect_ratio = 1  # Default ratio if width or height is None or height is zero

    # Assign column class based on aspect ratio
    if media.aspect_ratio > 2.0:
        media.col_class = 'col-lg-8 col-md-12'
    elif media.aspect_ratio > 1.5:
        media.col_class = 'col-lg-6 col-md-12'
    elif media.aspect_ratio > 1.0:
        media.col_class = 'col-lg-4 col-md-6'
    else:
        media.col_class = 'col-lg-3 col-md-6'

def convert_size(size):
    """Converts size in bytes to a more readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024

@login_required
def gallery(request: HttpRequest) -> HttpResponse:
    user = request.user
    
    user_display = request.user.get_full_name() if request.user.get_full_name() else request.user.username
    if request.user.is_superuser:
        user_display += " (superuser)"

    gallery_settings = GallerySettings.objects.first()
    if gallery_settings:
        order_by = gallery_settings.order_by
    else:
        order_by = 'date_desc'
    
    # Map the order_by value to the actual field names
    allowed_order_by_fields = {
        'date_asc': Coalesce(F('media_create_date'), Value('9999-12-31')),
        'date_desc': Coalesce(F('media_create_date'), Value('0001-01-01')).desc(),
    }

    order_by_field = allowed_order_by_fields.get(order_by, '-media_create_date')

    # Apply the sorting with the handling for null values
    if user.is_superuser:
        media_files = TblMediaObjects.objects.using('media').filter(
            media_type='image',
            is_active=True
        ).order_by(order_by_field)
    else:
        media_files = TblMediaObjects.objects.using('media').filter(
            media_type='image',
            is_active=True,
            is_secret=False
        ).order_by(order_by_field)



    # Total number of images
    total_images = media_files.count()

    # Convert to list after ordering
    media_files = list(media_files)
    
    # Use the CustomPaginator
    paginator = CustomPaginator(media_files, 20, page_window=2)  # Show 20 images per page and limit to 2 pages before and after the current page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)


    tags = TblTags.objects.all().order_by('tag_name')
    names = TblFaceMatches.objects.exclude(face_name__startswith='unknown_').values('face_name').distinct().order_by('face_name')
    
    return render(request, "gallery.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': "Photos",
        'show_search': True,
        'show_navbar': True,
        'total_images': total_images,
        'page_range': paginator.get_page_range(page_obj.number),
        'user_display': user_display,
        'unknown_filter': request.GET.get('unknown_filter', 'all'),
    })

@login_required
def photo_search(request: HttpRequest) -> HttpResponse:
    

    logger = logging.getLogger('django')
    
    # Log all query parameters
    logger.debug(f'photo_search - query parameters: {request.GET}')


    unknown_filter = request.GET.get('unknown_filter', 'all')

    # Initialize filters
    filters = Q(media_type='image')

    # Apply secret filter for non-superusers
    if not request.user.is_superuser:
        filters &= Q(is_secret=False)

    # Apply other search filters...
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    tags = request.GET.getlist('tags')
    names = request.GET.getlist('names')
    filename = request.GET.get('filename')
    media_object_id = request.GET.get('media_object_id')

    if media_object_id:
        filters &= Q(media_object_id=media_object_id)
    if from_date:
        filters &= Q(media_create_date__gte=from_date)
    if to_date:
        filters &= Q(media_create_date__lte=to_date)
    if filename:
        filters &= Q(orig_name__icontains=filename)
    if tags:
        for tag in tags:
            filters &= Q(tbltagstomedia__tag__tag_id=tag)
    if names:
        for name in names:
            filters &= Q(tblfacelocations__tblfacematches__face_name=name)

    # Apply the unknown_filter logic
    if unknown_filter == 'no_unknown':
        # Exclude results where media_object_id starts with 'unknown'
        filters &= ~Q(new_name__startswith='Unknown')
    elif unknown_filter == 'only_unknown':
        # Include only results where media_object_id starts with 'unknown'
        filters &= Q(new_name__startswith='Unknown')

    filters &= Q(is_active=True)
    # Query the database with filters
    media_files = TblMediaObjects.objects.using('media').filter(filters).distinct()

    # Sorting and pagination logic
    gallery_settings = GallerySettings.objects.first()
    if gallery_settings:
        order_by = gallery_settings.order_by
    else:
        order_by = 'date_desc'
    
    allowed_order_by_fields = {
        'date_asc': Coalesce(F('media_create_date'), Value('9999-12-31')),
        'date_desc': Coalesce(F('media_create_date'), Value('0001-01-01')).desc(),
    }
    order_by_field = allowed_order_by_fields.get(order_by, '-media_create_date')
    media_files = media_files.order_by(order_by_field)

    total_images = media_files.count()

    paginator = CustomPaginator(media_files, 20, page_window=2)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)
        media.has_tags = media.tbltagstomedia_set.exists()

    tags = TblTags.objects.all().order_by('tag_name')
    names = TblFaceMatches.objects.exclude(face_name__startswith='unknown_').values('face_name').distinct().order_by('face_name')

    # Pass the filter and search results to the template
    return render(request, "gallery.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': "Photos",
        'show_search': True,
        'show_navbar': True,
        'total_images': total_images,
        'page_range': paginator.get_page_range(page_obj.number),
        'unknown_filter': unknown_filter,
        'user_display': request.user.get_full_name() if request.user.get_full_name() else request.user.username
    })


@login_required
def edit_media(request, media_id):
    media = get_object_or_404(TblMediaObjects, media_object_id=media_id)
    generate_paths(media)

    face_matches = TblFaceMatches.objects.filter(face_location__media_object=media)

    return render(request, 'edit_media.html', {
        'media': media,
        'face_matches': face_matches,
        'show_navbar': False,  # Hide the navbar
        'google_maps_api_key': settings.GOOGLE_MAPS_API_KEY,
    })

def save_rotation(request, media_id):
    if request.method == 'POST':
        media = get_object_or_404(TblMediaObjects, media_object_id=media_id)
        image_path = os.path.join(settings.IMAGE_PATH, media.new_name)
        thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)

        try:
            angle = int(request.POST.get('angle', 0))
            with Image.open(image_path) as img:
                img = img.rotate(angle, expand=True)
                img.save(image_path)

            with Image.open(thumbnail_path) as thumbnail:
                thumbnail = thumbnail.rotate(angle, expand=True)
                thumbnail.save(thumbnail_path)

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def fetch_tags(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, media_object_id=media_id)
    assigned_tags = TblTags.objects.filter(tbltagstomedia__media_object=media_object)
    available_tags = TblTags.objects.exclude(tbltagstomedia__media_object=media_object)

    assigned_tags_list = [{'id': tag.tag_id, 'name': tag.tag_name} for tag in assigned_tags]
    available_tags_list = [{'id': tag.tag_id, 'name': tag.tag_name} for tag in available_tags]

    return JsonResponse({
        'assigned_tags': assigned_tags_list,
        'available_tags': available_tags_list
    })

def update_tags(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        media_object_id = data['media_object_id']
        assigned_tags = data['assigned_tags']

        media_object = get_object_or_404(TblMediaObjects, pk=media_object_id)
        TblTagsToMedia.objects.filter(media_object=media_object).delete()

        for tag_id in assigned_tags:
            tag = get_object_or_404(TblTags, pk=tag_id)
            TblTagsToMedia.objects.create(media_object=media_object, tag=tag)

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})

def fetch_face_locations(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, pk=media_id)
    face_type = request.GET.get('type', 'all')

    face_locations = []
    if face_type == 'identified':
        identified_faces = TblFaceMatches.objects.filter(
            face_location__media_object=media_object, is_invalid=False
        ).exclude(face_name__startswith='unknown_')

        for face in identified_faces:
            face_location = face.face_location
            face_encoding_hash = None

            # Fetch the known face associated with this match
            if face.known_face_id:
                known_face = TblKnownFaces.objects.filter(id=face.known_face_id).first()
                if known_face:
                    face_encoding_hash = known_face.encoding_hash

            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face.face_name,
                'is_invalid': face_location.is_invalid,
                'encoding_hash': face_encoding_hash  # Include encoding hash if it exists
            })
    else:  # 'all' case
        all_faces = TblFaceLocations.objects.filter(media_object=media_object)
        for face_location in all_faces:
            face_name = None
            face_encoding_hash = None  # Initialize encoding hash variable

            if face_location.is_invalid:
                face_name = 'Invalid'
            elif face_location.tblfacematches_set.exists():
                face_match = face_location.tblfacematches_set.first()
                face_name = face_match.face_name

                # Fetch the known face associated with this match
                if face_match.known_face_id:
                    known_face = TblKnownFaces.objects.filter(id=face_match.known_face_id).first()
                    if known_face:
                        face_encoding_hash = known_face.encoding_hash

            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face_name or '',  # If face_name is None, set to empty string
                'is_invalid': face_location.is_invalid,  # Include is_invalid flag
                'encoding_hash': face_encoding_hash  # Include encoding hash in response
            })

    return JsonResponse({
        'status': 'success',
        'face_locations': face_locations
    })




@csrf_exempt
def search_faces(request, media_id):
    try:
        media_object = get_object_or_404(TblMediaObjects, pk=media_id)
        image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)

        face_labeler = FaceLabeler()
        face_labeler.process_image(image_path, media_id)

        # Fetch all face locations associated with the media_object after processing
        face_locations = TblFaceLocations.objects.filter(media_object=media_object)

        response_data = {'faces': []}
        for face_location in face_locations:
            known_face = face_location.tblfacematches_set.first()
            encoding_hash = face_location.encoding_hash  # Retrieve the hash
            face_name = known_face.face_name if known_face else "Unknown"

            response_data['faces'].append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face_name,
                'encoding_hash': encoding_hash,  # Include the encoding hash in the response
                'is_invalid': face_location.is_invalid
            })

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)



def update_face_name(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_location = data.get('face')
            new_name = data.get('new_name').strip()  # Strip whitespace to ensure proper handling
            face_hash = data.get('face_hash')

            if not (media_id and face_location and face_hash):
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            unknown_name = f"unknown_{media_id}_{face_hash[:8]}"

            tolerance = 5

            # Find the matching face location within a given tolerance
            face_match = TblFaceMatches.objects.filter(
                face_location__media_object_id=media_id,
                face_location__top__gte=face_location['top'] - tolerance,
                face_location__top__lte=face_location['top'] + tolerance,
                face_location__right__gte=face_location['right'] - tolerance,
                face_location__right__lte=face_location['right'] + tolerance,
                face_location__bottom__gte=face_location['bottom'] - tolerance,
                face_location__bottom__lte=face_location['bottom'] + tolerance,
                face_location__left__gte=face_location['left'] - tolerance,
                face_location__left__lte=face_location['left'] + tolerance,
            ).first()

            if not face_match:
                return JsonResponse({'success': False, 'error': 'Face location not found'})

            if face_match.face_location.is_invalid:
                return JsonResponse({'success': False, 'error': 'Cannot update invalid face location'})

            # Store old identity for cleanup after update
            old_identity = face_match.known_face_id and TblKnownFaces.objects.get(id=face_match.known_face_id).identity

            # Handle cases where the new name is empty or set to unknown
            if not new_name or new_name.lower().startswith('unknown_'):
                identity, _ = TblIdentities.objects.get_or_create(name=unknown_name)

                # Remove the old tag associated with the previous name
                if old_identity and not old_identity.name.lower().startswith('unknown_'):
                    old_tag = TblTags.objects.filter(tag_name=old_identity.name).first()
                    if old_tag:
                        TblTagsToMedia.objects.filter(media_object_id=media_id, tag=old_tag).delete()
            else:
                # Ensure that the identity is created if it does not exist
                identity, _ = TblIdentities.objects.get_or_create(name=new_name)

            # Update or create the known face to point to the new identity
            known_face, _ = TblKnownFaces.objects.update_or_create(
                encoding_hash=face_hash,  # Use the hash here
                defaults={'identity': identity}
            )

            # Explicitly update the face match with the new identity and known face ID
            face_match.known_face_id = known_face.id
            face_match.face_name = identity.name
            face_match.save()

            # Update the tags based on the face name, but only if the name is not unknown
            if new_name and not new_name.lower().startswith('unknown_'):
                face_labeler = FaceLabeler()
                face_labeler.update_tags_for_face(media_id, new_name)

            # Clean up the old identity if it was unknown and is no longer used
            if old_identity and old_identity.name.startswith('unknown_'):
                if not TblKnownFaces.objects.filter(identity=old_identity).exists():
                    old_identity.delete()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})



@csrf_exempt
def update_face_validity(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_location = data.get('face')
            is_invalid = data.get('is_invalid', False)

            if not media_id or not face_location:
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            tolerance = 5

            # Find the matching face location within a given tolerance
            face_match = TblFaceMatches.objects.filter(
                face_location__media_object_id=media_id,
                face_location__top__gte=face_location['top'] - tolerance,
                face_location__top__lte=face_location['top'] + tolerance,
                face_location__right__gte=face_location['right'] - tolerance,
                face_location__right__lte=face_location['right'] + tolerance,
                face_location__bottom__gte=face_location['bottom'] - tolerance,
                face_location__bottom__lte=face_location['bottom'] + tolerance,
                face_location__left__gte=face_location['left'] - tolerance,
                face_location__left__lte=face_location['left'] + tolerance,
            ).first()

            if not face_match:
                return JsonResponse({'success': False, 'error': 'Face location not found'})

            # Update the face location and face match records
            face_location_obj = face_match.face_location
            face_location_obj.is_invalid = is_invalid
            face_location_obj.save()

            face_match.is_invalid = is_invalid
            face_match.save()

            if is_invalid:
                # Retrieve the known face associated with the face match
                known_face = TblKnownFaces.objects.get(id=face_match.known_face_id)

                # Mark the known face as "unknown" and update the identity
                encoding_hash = known_face.encoding_hash  # Use the hash instead of the encoding
                unknown_name = f"unknown_{media_id}_{encoding_hash[:8]}"

                # Create or get the "unknown" identity
                unknown_identity, created = TblIdentities.objects.get_or_create(name=unknown_name)

                # Update the known face with the new identity
                old_identity = known_face.identity
                known_face.identity = unknown_identity
                known_face.save()

                # If the old identity was an "unknown" and is no longer used, delete it
                if old_identity.name.startswith('unknown_') and not TblKnownFaces.objects.filter(identity=old_identity).exists():
                    old_identity.delete()

                # Update the face match record with the new identity
                face_match.face_name = unknown_name
                face_match.save()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@csrf_exempt
def manual_face_recognition(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_locations = data.get('face_locations')

            if not media_id or not face_locations:
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            # Retrieve the media object and load the image
            media_object = get_object_or_404(TblMediaObjects, pk=media_id)
            image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)

            face_labeler = FaceLabeler()
            image = face_labeler.validate_image(image_path)
            if image is None:
                return JsonResponse({'success': False, 'error': 'Invalid image'})

            # Add manually specified face location to the image
            top = face_locations['top']
            right = face_locations['right']
            bottom = face_locations['bottom']
            left = face_locations['left']
            manual_face_location = [(top, right, bottom, left)]

            # Process the image with the manual face location
            face_labeler.process_image(image_path, media_id, manual_face_location)

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def get_tags(request):
    tags = TblTags.objects.all().values('tag_id', 'tag_name')
    return JsonResponse({'tags': list(tags)})

@csrf_exempt
@require_POST
def manage_tag(request):
    tag_id = request.POST.get('tag_id')  # Capture the tag_id from the request
    new_tag_name = request.POST.get('name')

    print(f"Received tag_id: {tag_id}, new_tag_name: {new_tag_name}")

    if tag_id:
        # Attempt to update the existing tag by its ID
        try:
            tag = TblTags.objects.get(tag_id=tag_id)
            tag.tag_name = new_tag_name  # Update the tag name
            tag.save()
            return JsonResponse({'status': 'success', 'message': 'Tag updated'})
        except TblTags.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Tag not found'}, status=404)
    else:
        # Create a new tag if no tag ID is provided (this case should normally not happen with your current frontend logic)
        tag, created = TblTags.objects.get_or_create(tag_name=new_tag_name, defaults={'tag_desc': ''})
        if created:
            return JsonResponse({'status': 'success', 'message': 'Tag created', 'tag_id': tag.tag_id})
        else:
            return JsonResponse({'status': 'success', 'message': 'Tag already exists'})

@csrf_exempt
@require_POST
def delete_tag(request, tag_id):
    tag = get_object_or_404(TblTags, tag_id=tag_id)
    # Remove references in tbl_tags_to_media
    TblTagsToMedia.objects.filter(tag=tag).delete()
    # Delete the tag
    tag.delete()
    return JsonResponse({'status': 'success'})


def delete_image(request, media_id):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Retrieve the media object
                media_object = get_object_or_404(TblMediaObjects, pk=media_id)

                # Mark the image as no longer active
                media_object.is_active = False
                media_object.save()

                # Paths
                image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)
                deleted_path = os.path.join(settings.DELETED_PATH, media_object.new_name)
                thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media_object.new_name)

                # Ensure the deleted folder exists
                os.makedirs(os.path.dirname(deleted_path), exist_ok=True)

                # Move the image to the deleted folder
                if os.path.exists(image_path):
                    shutil.move(image_path, deleted_path)

                # Delete the thumbnail
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)

            return JsonResponse({'success': True, 'message': 'Image deleted successfully'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})


def download_image(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, media_object_id=media_id)
    image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)

    # Set the appropriate content type
    mime_type, _ = mimetypes.guess_type(image_path)
    response = HttpResponse(open(image_path, 'rb'), content_type=mime_type)
    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(image_path)}"'
    
    return response

def download_selected_images(request):
    if request.method == 'POST':
        image_ids = request.POST.getlist('image_ids')
        images = TblMediaObjects.objects.filter(media_object_id__in=image_ids)

        # Create a zip file in memory
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for image in images:
                image_path = os.path.join(settings.IMAGE_PATH, image.new_name)
                zip_file.write(image_path, os.path.basename(image_path))

        zip_buffer.seek(0)

        # Send the zip file as a response
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="selected_images.zip"'
        
        return response

def get_location_data(request, media_id):
    media = get_object_or_404(TblMediaObjects, media_object_id=media_id)
    return JsonResponse({
        'latitude': media.latitude,
        'longitude': media.longitude
    })

@csrf_exempt
def update_is_secret(request, media_id):
    if request.method == 'POST':
        media_object = get_object_or_404(TblMediaObjects, media_object_id=media_id)
        data = json.loads(request.body)
        media_object.is_secret = data['is_secret']
        media_object.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)

@require_POST
def update_date(request):
    
    logger.debug("Request method:", request.method)
    logger.debug("Request content type:", request.content_type)
    logger.debug("Request body:", request.body)  # Log the raw request body
    
    try:
            data = json.loads(request.body)
            print("Received data:", data)  # Debugging log

            media_id = data.get('media_id')
            new_date = data.get('media_create_date')

            if not media_id or not new_date:
                return JsonResponse({'success': False, 'error': 'Invalid data'}, status=400)
            
            # Mock response to isolate the issue
            return JsonResponse({'success': True, 'media_id': media_id, 'new_date': new_date})
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': 'Unexpected error: ' + str(e)}, status=500)

def update_media_date_and_filename(media_object_id, new_date):
    media_object = TblMediaObjects.objects.get(media_object_id=media_object_id)
    
    # Update media_create_date
    media_object.media_create_date = new_date
    media_object.save()
    
    # Construct new filename
    new_date_str = new_date.strftime('%Y-%m-%d')
    original_file_path = media_object.file_path
    original_thumbnail_path = media_object.thumbnail_path
    file_extension = os.path.splitext(original_file_path)[1]
    new_filename = f"{new_date_str}-{media_object_id}{file_extension}"
    
    # Set the new file name in the database
    media_object.file_name = new_filename
    media_object.save()
    
    # Copy the image file to the new name
    new_file_path = os.path.join(settings.IMAGE_PATH, new_filename)
    shutil.copy(original_file_path, new_file_path)
    
    # Move the original file to the deleted folder
    deleted_folder = settings.DELETED_PATH
    if not os.path.exists(deleted_folder):
        os.makedirs(deleted_folder)
    shutil.move(original_file_path, os.path.join(deleted_folder, os.path.basename(original_file_path)))
    
    # Rename the thumbnail file
    new_thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, new_filename)
    os.rename(original_thumbnail_path, new_thumbnail_path)
    
    # Update media_object with new file paths
    media_object.file_path = new_file_path
    media_object.thumbnail_path = new_thumbnail_path
    media_object.save()

    return media_object


def handle_media_update(request, media_object_id):
    new_date = request.POST.get('new_date')  # Retrieve the date from form submission
    if new_date:
        try:
            new_date = datetime.strptime(new_date, '%Y-%m-%d')  # Adjust format as necessary
            updated_media = update_media_date_and_filename(media_object_id, new_date)
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid date format'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
        
        return JsonResponse({'success': True, 'media': updated_media})
    return JsonResponse({'success': False, 'error': 'No date provided'}, status=400)


def photo_stream(request):
    media_files = TblMediaObjects.objects.using('media').filter(
        media_type='image',
        is_active=True
    ).order_by('media_object_id')  # Ensure consistent ordering by ID

    paginator = Paginator(media_files, 100)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Calculate starting count for the current page
    start_count = (int(page_number) - 1) * 100

    available_tags = TblTags.objects.all().order_by('tag_name')

    for media in page_obj:
        generate_paths(media)
        media.assigned_tags = TblTagsToMedia.objects.filter(media_object=media).values_list('tag_id', flat=True)



    return render(request, "photo_stream.html", {
        'page_obj': page_obj,
        'title': "Photo Stream",
        'total_images': paginator.count,
        'start_count': start_count,
        'available_tags': available_tags,
    })



def update_secret_status(request, media_object_id):
    if request.method == 'POST':
        data = json.loads(request.body)
        is_secret = data.get('is_secret', False)
        
        try:
            photo = TblMediaObjects.objects.get(media_object_id=media_object_id)
            photo.is_secret = is_secret
            photo.save()
            return JsonResponse({'success': True})
        except TblMediaObjects.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Photo not found'})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request'})
    

@require_POST
def update_tags(request, media_id):
    data = json.loads(request.body)
    selected_tags = data.get('tags', [])

    # Clear existing tags
    TblTagsToMedia.objects.filter(media_object_id=media_id).delete()

    # Add the new tags
    for tag_id in selected_tags:
        TblTagsToMedia.objects.create(media_object_id=media_id, tag_id=tag_id)

    # Optionally, return the updated list of tags for this media object
    updated_tags = TblTagsToMedia.objects.filter(media_object_id=media_id)
    updated_tag_ids = list(updated_tags.values_list('tag_id', flat=True))  # This is JSON serializable

    return JsonResponse({'success': True, 'updated_tags': updated_tag_ids})

def get_tags(request, media_id):
    try:
        media=TblMediaObjects.objects.get(media_object_id=media_id)
        assigned_tags = TblTagsToMedia.objects.filter(media_object=media)
        assigned_tag_ids = list(assigned_tags.values_list('tag_id', flat=True))
        available_tags = TblTags.objects.all().values('tag_id', 'tag_name')

        available_tags = list(available_tags)

        return JsonResponse({
            'success': True,
            'assigned_tags':list(assigned_tag_ids),
            'available_tags': list(available_tags)
        })
    except TblMediaObjects.DoesNotExist:
        return JsonResponse({'success':False, 'error': 'Media object not found.'})
    

def get_image_size(image_path):
    """Get the size of the image in bytes."""
    return os.path.getsize(image_path)

def check_exif_data(image_path):
    """Check if the image has EXIF data."""
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        return exif_data is not None
    except Exception as e:
        return False
    
def duplicate_images_view(request, group_number=0):
    duplicates_file_path = os.path.join(settings.IMAGE_PATH, 'results.json')
    try:
        with open(duplicates_file_path, 'r') as file:
            duplicates_data = json.load(file)
    except Exception as e:
        logger.error(f"Error reading duplicates file: {str(e)}")
        return HttpResponse(status=500)

    # Convert keys to a list so we can use the group_number as an index
    duplicate_keys = list(duplicates_data.keys())
    total_groups = len(duplicate_keys)

    # Ensure the group_number is within a valid range
    group_number = int(group_number)
    group_number = max(0, min(group_number, total_groups - 1))
    
    # Get the current group using the group_number
    current_key = duplicate_keys[group_number]
    group = duplicates_data[current_key]

    images_info = []
    # Add the original image
    original_media_object = get_object_or_404(TblMediaObjects, new_name=os.path.basename(current_key))
    images_info.append({
        'id': original_media_object.media_object_id,
        'name': original_media_object.new_name,
        'size': get_image_size(current_key),
        'exif_present': check_exif_data(current_key),
    })
    
    # Add the duplicate images
    for duplicate in group:
        duplicate_path = duplicate[0]
        duplicate_media_object = get_object_or_404(TblMediaObjects, new_name=os.path.basename(duplicate_path))
        
        images_info.append({
            'id': duplicate_media_object.media_object_id,
            'name': duplicate_media_object.new_name,
            'size': get_image_size(duplicate_path),
            'exif_present': check_exif_data(duplicate_path),
        })

    context = {
        'duplicate_groups': [images_info],  # Wrap in a list for the template
        'total_groups': total_groups,
        'group_number': group_number + 1,  # Human-readable group number (1-indexed)
        'show_navbar':False,
        'IMAGE_PATH': settings.IMAGE_PATH,
    }

    logger.debug(images_info)
    logger.debug(total_groups)

    return render(request, 'duplicate_search.html', context)

def get_duplicate_group(request, group_number):
    duplicates_file_path = os.path.join(settings.IMAGE_PATH, 'results.json')
    try:
        with open(duplicates_file_path, 'r') as file:
            duplicates_data = json.load(file)
    except Exception as e:
        logger.error(f"Error reading duplicates file: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

    duplicate_keys = list(duplicates_data.keys())
    total_groups = len(duplicate_keys)

    group_number = int(group_number)
    if group_number < 0 or group_number >= total_groups:
        return JsonResponse({'error': 'Group number out of range'}, status=400)

    current_key = duplicate_keys[group_number]
    group = duplicates_data[current_key]

    images_info = []
    original_media_object = get_object_or_404(TblMediaObjects, new_name=os.path.basename(current_key))
    images_info.append({
        'id': original_media_object.media_object_id,
        'name': original_media_object.new_name,
        'size': get_image_size(current_key),
        'exif_present': check_exif_data(current_key),
    })

    for duplicate in group:
        duplicate_path = duplicate[0]
        duplicate_media_object = get_object_or_404(TblMediaObjects, new_name=os.path.basename(duplicate_path))
        images_info.append({
            'id': duplicate_media_object.media_object_id,
            'name': duplicate_media_object.new_name,
            'size': get_image_size(duplicate_path),
            'exif_present': check_exif_data(duplicate_path),
        })

    return JsonResponse({
        'group': images_info,
        'group_number': group_number + 1,  # Human-readable group number (1-indexed)
        'total_groups': total_groups,
    })

def photo_tag_stream(request):
    media_files = TblMediaObjects.objects.using('media').filter(
        media_type='image',
        is_active=True
    ).order_by('media_object_id')  # Ensure consistent ordering by ID

    paginator = Paginator(media_files, 100)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Calculate starting count for the current page
    start_count = (int(page_number) - 1) * 100

    available_tags = TblTags.objects.all().order_by('tag_name')

    for media in page_obj:
        generate_paths(media)
        media.thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)  # Generate the thumbnail path
        media.assigned_tags = TblTagsToMedia.objects.filter(media_object=media).values_list('tag_id', flat=True)

    return render(request, "photo_tag_stream.html", {
        'page_obj': page_obj,
        'title': "Photo Tag Stream",
        'total_images': paginator.count,
        'start_count': start_count,
        'available_tags': available_tags,
    })

def copy_image(request, media_id):
    try:
        logger.debug(f"Attempting to copy image with ID: {media_id}")
        
        media = TblMediaObjects.objects.using('media').get(media_object_id=media_id)
        logger.debug(f"Media object retrieved: {media}")

        source_path = os.path.join(settings.IMAGE_PATH, media.new_name)
        destination_dir = os.path.join('mnt/MOM/', 'natasha_wedding')
        destination_path = os.path.join(destination_dir, media.new_name)
        
        logger.debug(f"Source path: {source_path}")
        logger.debug(f"Destination directory: {destination_dir}")
        logger.debug(f"Destination path: {destination_path}")

        # Ensure the destination directory exists
        if not os.path.exists(destination_dir):
            logger.debug(f"Creating destination directory: {destination_dir}")
            os.makedirs(destination_dir, exist_ok=True)
        else:
            logger.debug(f"Destination directory already exists: {destination_dir}")

        # Attempt to copy the file
        logger.debug(f"Copying file from {source_path} to {destination_path}")
        shutil.copy2(source_path, destination_path)
        logger.debug("File copied successfully")

        return JsonResponse({'success': True, 'message': 'Image copied successfully!'})

    except TblMediaObjects.DoesNotExist:
        logger.error(f"Media object with ID {media_id} does not exist")
        return JsonResponse({'success': False, 'error': 'Image not found.'}, status=404)
    except PermissionError as e:
        logger.error(f"Permission error while copying image: {e}")
        return JsonResponse({'success': False, 'error': 'Permission denied.'}, status=403)
    except Exception as e:
        logger.error(f"Unexpected error while copying image: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def photo_stream_simple(request):
    media_files = TblMediaObjects.objects.using('media').filter(
        media_type='image',
        is_active=True,
        media_object_id__gte=31000
    ).order_by('media_object_id')  # Ensure consistent ordering by ID

    paginator = Paginator(media_files, 100)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Calculate starting count for the current page
    start_count = (int(page_number) - 1) * 100

    for media in page_obj:
        generate_paths(media)  # Ensure the paths are generated for each media
        media.thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)  # Generate the thumbnail path

    return render(request, "photo_stream_simple.html", {
        'page_obj': page_obj,
        'title': "Photo Stream",
        'total_images': paginator.count,
        'start_count': start_count,
    })

def video_stream_simple(request):
    # Filter for video media types (assuming 'media_type' distinguishes between images and videos)
    media_files = TblMediaObjects.objects.using('media').filter(
        media_type='movie',  
        is_active=True,
        media_object_id__gte=31000
    ).order_by('media_object_id')  # Ensure consistent ordering by ID

    paginator = Paginator(media_files, 50)  # Change to 50 items per page for videos if needed
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Calculate starting count for the current page
    start_count = (int(page_number) - 1) * 50

    for media in page_obj:

        media.full_path = f"/videos/{media.new_name}"  # URL path for videos


    return render(request, "video_stream_simple.html", {
        'page_obj': page_obj,
        'title': "Video Stream",
        'total_videos': paginator.count,
        'start_count': start_count,
    })
