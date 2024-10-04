from .dif import build  # Assuming dif.py is in your project path

def find_image_duplicates(directory, recursive=True, px_size=50):
    """
    Uses the difPy utility to find duplicate images in a directory.

    :param directory: Directory to scan for duplicates
    :param recursive: Whether to scan directories recursively
    :param px_size: Size to which images are resized for comparison
    :return: Dictionary with duplicate images grouped together
    """
    # Initialize difPy with the desired options
    dif = build(directory, recursive=recursive, px_size=px_size)
    
    # Get the duplicate images from difPy
    duplicates = defaultdict(list)
    for key, value in dif.result.items():
        duplicates[value['location'].split("/")[-1]].append(value['location'])

    return duplicates
