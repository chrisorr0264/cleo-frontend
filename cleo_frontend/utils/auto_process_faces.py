import os
import sys
import django
import datetime
import environ

# Add the parent directory of cleo_frontend to the Python path
sys.path.append('/var/www/cleo')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleo_frontend.settings')

# Initialize Django
django.setup()

# Import models
from cleo_frontend.apps.media.models import TblMediaObjects, TblFaceLocations, TblFaceMatches
from cleo_frontend.utils.facelabeler import FaceLabeler

def process_image_for_faces(image_path, media_object, log_file):
    face_labeler = FaceLabeler()

    # Process the image to detect faces and update the database
    face_labeler.process_image(image_path, media_object.media_object_id)

    # Fetch all face locations associated with the media_object after processing
    face_locations = TblFaceLocations.objects.filter(media_object=media_object)

    # Write detailed information to the log file
    with open(log_file, 'a') as log:
        log.write(f"\nProcessed image: {media_object.orig_name}\n")
        log.write(f"Path: {image_path}\n")
        log.write(f"Number of faces detected: {face_locations.count()}\n")
        
        for face_location in face_locations:
            known_face = TblFaceMatches.objects.filter(face_location=face_location).first()
            name = known_face.face_name if known_face else "Unknown"
            log.write(f"  Face Location - Top: {face_location.top}, Right: {face_location.right}, "
                      f"Bottom: {face_location.bottom}, Left: {face_location.left}\n")
            log.write(f"    Associated Name: {name}\n")
        
        log.write("-" * 50 + "\n")

    print(f"Processed faces for image: {media_object.orig_name}")

def process_all_images():
    # Directory where images are stored
    image_dir = '/mnt/MOM/Images'
    
    # Log file to record the results
    log_file = f"face_detection_log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    # Get all media objects that have is_active=True
    media_objects = TblMediaObjects.objects.filter(is_active=True)

    total_files = media_objects.count()
    processed_files = 0

    print(f"Starting face detection for {total_files} images...")
    
    with open(log_file, 'a') as log:
        log.write(f"Face Detection Log - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write("=" * 50 + "\n")
    
    for media_object in media_objects:
        image_path = os.path.join(image_dir, media_object.new_name)
        if os.path.exists(image_path):
            process_image_for_faces(image_path, media_object, log_file)
            processed_files += 1
            print(f"Processed {processed_files}/{total_files}")
        else:
            print(f"Image not found: {image_path}")
            with open(log_file, 'a') as log:
                log.write(f"Image not found: {image_path}\n")
    
    print(f"Face detection completed. Processed {processed_files}/{total_files} images.")
    with open(log_file, 'a') as log:
        log.write(f"Face detection completed. Processed {processed_files}/{total_files} images.\n")

if __name__ == "__main__":
    process_all_images()
