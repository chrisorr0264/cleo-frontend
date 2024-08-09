"""
WSGI config for cleo_frontend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
import sys

sys.path.append('/var/www/cleo')
sys.path.append('/var/www/cleo/cleo_frontend')


# Add the virtual environment's site-packages directory to the sys.path
sys.path.append('/var/www/cleo/var/venv/lib/python3.12/site-packages')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleo_frontend.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
