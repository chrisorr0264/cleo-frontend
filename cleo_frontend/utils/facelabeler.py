'''
A face recognition utility used throughout the cleo project.
2024 Christopher Orr
'''

from PIL import UnidentifiedImageError
import hashlib
import face_recognition
import numpy as np
import time
from ..apps.media.models import TblKnownFaces, TblFaceMatches, TblFaceLocations, TblIdentities, TblTags, TblTagsToMedia


class FaceLabeler:
    def __init__(self):

        self.known_face_encodings = []
        self.known_face_names = []
        self._load_known_faces_from_db()
        

    def _load_known_faces_from_db(self):
        """
        Load all known faces and their encodings from the database
        """
        known_faces = TblKnownFaces.objects.select_related('identity').all()

        for known_face in known_faces:
            name = known_face.identity.name
            encoding = known_face.encoding

            self.known_face_names.append(name)
            self.known_face_encodings.append(np.frombuffer(encoding, dtype=np.float64))

    def validate_image(self, image_path):
        """
        Validate that the image can be opened and return the loaded image.
        """
        try:
            image = face_recognition.load_image_file(image_path)
            return image
        except UnidentifiedImageError as e:
            print(f"Failed to load image file {image_path}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error loading image file {image_path}: {e}")
            return None   
        
    def get_face_locations_and_encodings(self, image):
        
        """
        Get face locations and their corresponding encodings from the image
        """
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        return face_locations, face_encodings

    def create_unknown_identity(self, media_object_id, encoding):
        """
        Create a unique 'unknown' identity using a hash of the encoding
        """
        encoding_hash = hashlib.sha256(encoding).hexdigest()
        unknown_name = f"unknown_{media_object_id}_{encoding_hash[:8]}"

        # Update or create TblIdentities for the unknown face
        identity, created = TblIdentities.objects.get_or_create(name=unknown_name)
        return identity
    
    def match_face_to_known(self, encoding):
        """
        Try to match a face encoding to known faces.  Returns the matched identity or None.
        """

        matches = face_recognition.compare_faces(self.known_face_encodings, encoding)
        if True in matches:
            first_match_index = matches.index(True)
            matched_name = self.known_face_names[first_match_index]
            identity = TblIdentities.objects.get(name=matched_name)
            return identity
        return None
    
    def save_face_data(self, media_object_id, face_location, encoding, identity):
        """
        Save the face location, encoding, and identity to the database
        """
        top, right, bottom, left = face_location

        #Save or update TblKnownFaces
        known_face, created = TblKnownFaces.objects.get_or_create(
            encoding=encoding.tobytes(),
            identity=identity
        )

        # Save or update TblFaceLocations
        face_location_obj, created = TblFaceLocations.objects.update_or_create(
            media_object_id=media_object_id,
            top=top,
            right=right,
            bottom=bottom,
            left=left,
            defaults={'encoding': encoding.tobytes(), 'is_invalid': False}
        )

        # Save or update TblFaceMatches
        TblFaceMatches.objects.update_or_create(
            face_location=face_location_obj,
            known_face_id=known_face.id,
            defaults={'face_name': identity.name, 'is_invalid': False}
        )

    def process_image(self, image_path, media_object_id):
        """
        Main function to process the image: validate, detect, match, and save face data
        """
        image = self.validate_image(image_path)
        if image is None:
            return
        
        face_locations, face_encodings = self.get_face_locations_and_encodings(image)

        for i, face_location in enumerate(face_locations):
            encoding = face_encodings[i]

            # Try to match with known faces
            identity = self.match_face_to_known(encoding)

            # If no match found, create an unknown identitiy
            if identity is None:
                identity = self.create_unknown_identity(media_object_id, encoding)

            # Save the face data to the database
            self.save_face_data(media_object_id, face_location, encoding, identity)


    def update_identity_for_face_location(self, face_location_id, new_name):
        """
        Update the identity for a specific face location with a new name.
        Handle cases where the name already exists in the TblIdentities table.
        """
        try:
            # Get the current face location record
            face_location = TblFaceLocations.objects.get(id=face_location_id)
            old_identity = face_location.identity

            # Check if the new name already exists in TblIdentities
            new_identity, created = TblIdentities.objects.get_or_create(name=new_name)

            if not created:
                # The new name already exists, update face location and face matches to use the new identity
                face_location.identity = new_identity
                face_location.save()    

                TblFaceMatches.objects.filter(face_location=face_location).update(
                    face_name=new_identity.name,
                    known_face_id=new_identity.id
                )

                # Check if the old identity (unknonw) is still in use
                if not TblFaceLocations.objects.filter(identity=old_identity).exists():
                    # If no records are referencing the old 'unknown' idenity, delete it
                    old_identity.delete()
            else:
                # The new identity was created, update the existing records
                face_location.identity = new_identity
                face_location.save()

                TblFaceMatches.objects.filter(face_location=face_location).update(
                    face_name=new_identity.name,
                    known_face_id=new_identity.id
                )

            return new_identity
            
        except TblFaceLocations.DoesNotExist:
            print(f"Face location with ID {face_location_id} does not exist.", )
            return None

