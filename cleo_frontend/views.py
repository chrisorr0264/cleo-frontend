from django.shortcuts import render
from django.http import HttpRequest, HttpResponse
import os
from django.conf import settings
from django.contrib.auth.decorators import login_required

@login_required
def home_view(request: HttpRequest) -> HttpResponse:

    main_image = os.path.join(settings.IMAGE_PATH,'2012-07-02-0022805.JPG')



    return render(request, "index.html", {
        'main_image': main_image,
        'show_search': False,
        'show_navbar': True,
    })

