from django.core.paginator import Paginator
from django.shortcuts import render, get_object_or_404
from django.urls import get_resolver
from django.http import JsonResponse, HttpRequest, HttpResponse
from .models import TblMediaObjects, TblTags, TblTagsToMedia, TblFaceLocations, TblFaceMatches, TblKnownFaces, TblIdentities
from ..account.models import GallerySettings
from django.conf import settings
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from PIL import Image
import os
import random
import json
from ...utils.facelabeler import FaceLabeler 
import numpy as np
import hashlib
import face_recognition
import shutil

def generate_paths(media):
    media.full_path = os.path.join(settings.IMAGE_PATH, media.new_name)
    media.thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)
    media.media_object_id = media.media_object_id
    width, height = media.width, media.height

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

@login_required
def gallery(request: HttpRequest) -> HttpResponse:
    user = request.user

    gallery_settings = GallerySettings.objects.first()
    if gallery_settings:
        order_by = gallery_settings.order_by
    else:
        order_by = 'date_desc'
    
    # Map the order_by value to the actual field names
    allowed_order_by_fields = {
        'date_asc': 'media_create_date',
        'date_desc': '-media_create_date',
    }
    order_by_field = allowed_order_by_fields.get(order_by, '-media_create_date')


    if user.is_superuser:
        media_files = list(TblMediaObjects.objects.using('media').filter(media_type='image')).order_by(order_by_field)
    else:
        media_files = list(TblMediaObjects.objects.using('media').filter(media_type='image', is_secret=False)).order_by(order_by_field)
    
    random.shuffle(media_files)
    media_files = media_files[:100]

    # Pagination
    paginator = Paginator(media_files, 20)  # Show 20 images per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)
        print(media.full_path) # Debug

    tags = TblTags.objects.all()
    names = TblFaceMatches.objects.values('face_name').distinct()

    return render(request, "gallery.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': "Photos",
        'show_search': True,
        'show_navbar': True
    })

def photo_search(request: HttpRequest) -> HttpResponse:
    user = request.user
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    tags = request.GET.getlist('tags')
    names = request.GET.getlist('names')
    filename = request.GET.get('filename')
    media_object_id = request.GET.get('media_object_id')  # Add media_object_id to the search parameters

    filters = Q(media_type='image')

    if not user.is_superuser:
        filters &= Q(is_secret=False)

    title_parts = []

    if media_object_id:
        filters &= Q(media_object_id=media_object_id)
        title_parts.append(f"Media ID: {media_object_id}")

    if from_date:
        filters &= Q(media_create_date__gte=from_date)
        title_parts.append(f"From {from_date}")
    if to_date:
        filters &= Q(media_create_date__lte=to_date)
        title_parts.append(f"To {to_date}")

    media_files = TblMediaObjects.objects.using('media').filter(filters).distinct()

    if filename:
        filters &= Q(orig_name__icontains=filename)
        media_files = media_files.filter(filters)
        title_parts.append(f"Filename: {filename}")

    if tags:
        tags = [tag for tag in tags if tag]
        if tags:
            for tag in tags:
                media_files = media_files.filter(tbltagstomedia__tag__tag_id=tag)
            tag_names = TblTags.objects.filter(tag_id__in=tags).values_list('tag_name', flat=True)
            title_parts.append(f"Tags: {', '.join(tag_names)}")
    if names:
        names = [name for name in names if name]
        if names:
            for name in names:
                media_files = media_files.filter(tblfacematches__face_name=name)
            title_parts.append(f"Names: {', '.join(names)}")

    media_files = media_files.order_by('media_object_id')

    paginator = Paginator(media_files, 20)  # Show 20 images per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)
        media.has_tags = media.tbltagstomedia_set.exists()

    title = "Photos"
    if title_parts:
        title += " - " + " | ".join(title_parts)

    tags = TblTags.objects.all()
    names = TblFaceMatches.objects.exclude(face_name__startswith='unknown_').values('face_name').distinct()

    return render(request, "gallery.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': title,
        'show_search': True,
        'show_navbar': True
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
    media_object = get_object_or_404(TblMediaObjects, pk=media_id)
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
        identified_faces = TblFaceMatches.objects.filter(face_location__media_object=media_object, is_invalid=False).exclude(face_name__startswith='unknown_')
        for face in identified_faces:
            face_location = face.face_location
            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face.face_name,
                'is_invalid': face_location.is_invalid  # Include is_invalid flag
            })
    else:  # 'all' case
        all_faces = TblFaceLocations.objects.filter(media_object=media_object)
        for face_location in all_faces:
            face_name = None
            if face_location.is_invalid:
                face_name = 'Invalid'
            elif face_location.tblfacematches_set.exists():
                face_match = face_location.tblfacematches_set.first()
                face_name = face_match.face_name
            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face_name or '',  # If face_name is None, set to empty string
                'is_invalid': face_location.is_invalid  # Include is_invalid flag
            })

    return JsonResponse({
        'status': 'success',
        'face_locations': face_locations
    })


@csrf_exempt
def search_faces(request, media_id):
    try:
        print("Starting search_faces view")  # Debug line
        media_object = get_object_or_404(TblMediaObjects, pk=media_id)
        print(f"Media object found: {media_object}")  # Debug line
        image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)
        print(f"Image path: {image_path}")  # Debug line

        face_labeler = FaceLabeler()
        print("Facelabeler instance created successfully.")

        
        face_labeler.process_image(image_path, media_id)
        print("Processed image with face_labeler")  # Debug line

        # Fetch all face locations associated with the media_object after processing
        face_locations = TblFaceLocations.objects.filter(media_object=media_object)
        print(f"Found {face_locations.count()} face locations")  # Debug line

        response_data = {'faces': []}
        for face_location in face_locations:
            known_face = face_location.tblfacematches_set.first()
            response_data['faces'].append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': known_face.face_name if known_face else "Unknown",
                'encoding': np.frombuffer(face_location.encoding, dtype=np.float64).tolist(),
                'is_invalid': face_location.is_invalid
            })
        print("Returning JSON response")  # Debug line
        return JsonResponse(response_data)

    except Exception as e:
        print(f"Error processing faces: {str(e)}")  # Debug line
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def update_face_name(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_location = data.get('face')
            new_name = data.get('new_name').strip()  # Strip whitespace to ensure proper handling
            face_encoding = data.get('face_encoding')

            if not (media_id and face_location and face_encoding):
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            # Convert the face encoding to bytes if it's provided as a list
            if isinstance(face_encoding, list):
                face_encoding_np = np.array(face_encoding, dtype=np.float64)
                face_encoding_bytes = face_encoding_np.tobytes()
            else:
                face_encoding_bytes = face_encoding

            encoding_hash = hashlib.sha256(face_encoding_bytes).hexdigest()
            unknown_name = f"unknown_{media_id}_{encoding_hash[:8]}"

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
                encoding=face_encoding_bytes,
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
                face_encoding_bytes = known_face.encoding
                encoding_hash = hashlib.sha256(face_encoding_bytes).hexdigest()
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
            # Retrieve the media object
            media_object = get_object_or_404(TblMediaObjects, pk=media_id)

            # Mark the image as no longer active
            media_object.is_active = False
            media_object.save()

            # Move the image to the deleted folder
            image_path = os.path.join(settings.IMAGE_PATH, media_object.new_name)
            deleted_path = os.path.join(settings.DELETED_PATH, media_object.new_name)

            if os.path.exists(image_path):
                shutil.move(image_path, deleted_path)

            # Delete the thumbnail
            thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media_object.new_name)
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)

            return JsonResponse({'success': True, 'message': 'Image deleted successfully'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})