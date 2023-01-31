from django.shortcuts import redirect, render
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from requests import Request, Response, post, put, get
from .models import SpotifyToken, Vote
from api.models import Room
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse

BASE_URL = "https://api.spotify.com/v1/me/"

def execute_spotify_api_call(session_key, endpoint, post_=False, put_=False):
    queryset = SpotifyToken.objects.filter(user=session_key)
    if queryset.exists():
        tokens = queryset[0]
        headers = {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + tokens.access_token
        }
        if post_:
            post(BASE_URL + endpoint, headers=headers)
        if put_:
            put(BASE_URL + endpoint, headers=headers)

        response = get(BASE_URL + endpoint, {}, headers=headers)
        try:
            return response.json()
        except:
            return {'error': True, 'Message': 'Error occured.'}
    else:
        return {'error': True, 'Message': 'User not authenticated.'}

class AuthURL(APIView):
    def get(self, request, format=None):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return JsonResponse({'url': url}, status=status.HTTP_200_OK)

class IsAuthenticated(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        is_authenticated = False 
        
        queryset = SpotifyToken.objects.filter(user=self.request.session.session_key)
        if queryset.exists():
            tokens = queryset[0]
            expiry = tokens.expires_in
            if expiry <= timezone.now():
                response = post('https://accounts.spotify.com/api/token', data={
                    'grant_type': 'refresh_token',
                    'refresh_token': tokens.refresh_token,
                    'client_id': CLIENT_ID,
                    'client_secret': CLIENT_SECRET
                }).json()

                tokens.access_token = response.get('access_token')
                tokens.refresh_token = tokens.refresh_token
                tokens.expires_in = timezone.now() + timedelta(seconds=response.get('expires_in'))
                tokens.token_type = response.get('token_type') 

                tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])

            is_authenticated = True
        
        return JsonResponse({'authenticated': is_authenticated}, status=status.HTTP_200_OK)

def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = timezone.now() + timedelta(seconds=response.get('expires_in'))
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    queryset = SpotifyToken.objects.filter(user=request.session.session_key)
    if queryset.exists():
        tokens = queryset[0]
        
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type 
        tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
    else:
        tokens = SpotifyToken(user=request.session.session_key, access_token=access_token, token_type=token_type, expires_in=expires_in, refresh_token=refresh_token)
        tokens.save()


    return redirect('frontend:')

class GetCurrentSong(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        room_code = self.request.session.get('room_code')
        queryset = Room.objects.filter(code=room_code)

        if queryset.exists():
            room = queryset[0]
            host = room.host
            endpoint = "player/currently-playing"

            response = execute_spotify_api_call(host, endpoint)

            if 'error' in response or 'item' not in response:
                return JsonResponse({'error': True}, status=status.HTTP_204_NO_CONTENT)

            item = response.get('item')
        
            artist_str = ""
            for i, artist in enumerate(item.get('artists')):
                if i > 0:
                    artist_str += ', '
                name = artist.get('name')
                artist_str += name

            votes = Vote.objects.filter(room=room, song_id=item.get('id'))
            num_votes = 0
            if votes.exists():
                num_votes = len(votes)

            song = {
                'title': item.get('name'),
                'artist': artist_str,
                'duration': item.get('duration_ms'),
                'time': response.get('progress_ms'),
                'album_image_url': item.get('album').get('images')[0].get('url'),
                'is_playing': response.get('is_playing'),
                'votes': num_votes,
                'votes_required': room.votes_to_skip,
                'id': item.get('id'),
                'error': False
            }

            if room.current_song != item.get('id'):
                room.current_song = item.get('id')
                room.save(update_fields=['current_song'])
                Vote.objects.filter(room=room).delete()

            return JsonResponse(song, status=status.HTTP_200_OK)
        else:
            return JsonResponse({'error': True}, status=status.HTTP_404_NOT_FOUND)


class PauseSong(APIView):
    def put(self, response, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        room_code = self.request.session.get('room_code')
        queryset = Room.objects.filter(code=room_code) 

        if queryset.exists():
            room = queryset[0]

            if self.request.session.session_key == room.host or room.guest_can_pause:
                execute_spotify_api_call(self.request.session.session_key, "player/pause", put_=True)
                return JsonResponse({'success': True, 'message': 'Song set to pause.'}, status=status.HTTP_200_OK)
            else:
                return JsonResponse({'success': False, 'message': 'Do not have permission to pause song.'}, status=status.HTTP_200_OK)
        else:
            return JsonResponse({'success': False, 'message': 'An error occured.'}, status=status.HTTP_200_OK)

class PlaySong(APIView):
    def put(self, response, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        room_code = self.request.session.get('room_code')
        queryset = Room.objects.filter(code=room_code) 

        if queryset.exists():
            room = queryset[0]

            if self.request.session.session_key == room.host or room.guest_can_pause:
                execute_spotify_api_call(self.request.session.session_key, "player/play", put_=True)
                return JsonResponse({'success': True, 'message': 'Song set to play.'}, status=status.HTTP_200_OK)
            else:
                return JsonResponse({'success': False, 'message': 'Do not have permission to play song.'}, status=status.HTTP_200_OK)
        else:
            return JsonResponse({'success': False, 'message': 'An error occured.'}, status=status.HTTP_200_OK)
        
class SkipSong(APIView):
    def post(self, response, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        room_code = self.request.session.get('room_code')
        queryset = Room.objects.filter(code=room_code) 

        if queryset.exists():
            room = queryset[0]
            votes_needed = room.votes_to_skip
            votes = Vote.objects.filter(room=room, song_id=room.current_song)

            if (self.request.session.session_key == room.host) or (votes.exists() and (len(votes) + 1) >= votes_needed):
                votes.delete()
                execute_spotify_api_call(self.request.session.session_key, "player/next", post_=True)
                return JsonResponse({'success': True, 'message': 'Song skipped.'}, status=status.HTTP_200_OK)
            else:
                vote = Vote(user=self.request.session.session_key, room=room, song_id=room.current_song)
                vote.save()
                return JsonResponse({'success': False, 'message': 'Voted to skip.'}, status=status.HTTP_200_OK)
            
        else:
            return JsonResponse({'success': False, 'message': 'An error occured.'}, status=status.HTTP_200_OK)