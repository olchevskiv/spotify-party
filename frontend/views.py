from django.shortcuts import render

# Fontend views
def index(request, *args, **kwargs):
    return render(request, 'frontend/index.html')