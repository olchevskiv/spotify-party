import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, formControlLabelClasses, formLabelClasses, Grid, Typography } from '@mui/material';

import CreateRoomPage from './CreateRoomPage';
import MediaPlayer from './MediaPlayer';

export default function RoomPage() {
    let { roomCode } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState({
        roomExists: false, 
        votesToSkip: 2, 
        guestCanPause: false, 
        isHost: false
    });
    const [currentSong, setCurrentSong] = useState({
        title: 'No Song Playing :(',
        artist: 'There is currently no song set to play.',
        duration: 0,
        time: 0,
        album_image_url: 'https://tidal.com/browse/assets/images/defaultImages/defaultPlaylistImage.png',
        is_playing: false,
        votes: 0,
        votes_required: 0,
        id: 0,
        error: false,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);

    function authenticateSpotify() {
        const requestOptions = {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        }
        fetch('/spotify/is-authenticated', requestOptions)
        .then((response) => response.json())
        .then((data) => {
            setSpotifyAuthenticated(data.authenticated);
            if (!data.authenticated) {
                fetch('/spotify/get-auth-url')
                .then((response) => response.json())
                .then((data) => {
                    window.location.replace(data.url);
                });
            }
        });
    }

    function getCurrentSong() {
        if (roomCode) {
            fetch('/spotify/get-current-song')
            .then((response) => response.json())
            .then((data) => {
                if (!data.error) {
                    setCurrentSong(data);
                }
            });
        }
    }

    function getRoomDetails() {
        fetch('/api/get-room' + '?code=' + roomCode)
        .then((response) => response.json())
        .then((data) => {
            if ("code" in data) {
                setRoomData({roomExists: true, votesToSkip: data.votes_to_skip, guestCanPause: data.guest_can_pause, isHost: data.is_host});

                if (data.is_host) {
                    authenticateSpotify();
                }
            } else {
                setRoomData({roomExists: false});
            }
        });
    }
    
    useEffect(() => getRoomDetails(), [roomCode]);
    useEffect(() => {
        if (roomCode) {
            const interval = setInterval(() => {
                getCurrentSong()
            }, 1000);
            return () => clearInterval(interval);
        }
    }, []);
    useEffect(() => getRoomDetails(), [showSettings]);

    function handleLeaveButtonPress() {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }

        fetch('/api/leave-room', requestOptions).then((response) => navigate('/') )
    }

    function renderSettingsBtn() {
        return (
            <Grid item xs={12} align="center">
                <Button color="primary" variant="contained" onClick={() => setShowSettings(true)}>Settings</Button>
            </Grid>
        );
    }

    function renderSettings() {
        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <CreateRoomPage update={true} room_code={roomCode} votes_to_skip={roomData.votesToSkip} guest_can_pause={roomData.guestCanPause}></CreateRoomPage>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button color="secondary" variant="contained" onClick={() => setShowSettings(false)}>Close</Button>
                </Grid>
            </Grid>
        );
    }

    function renderRoom() {
        return (
            <Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <Typography component="h4" variant="h4">
                    Room {roomCode}
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <MediaPlayer title={currentSong.title} artist={currentSong.artist} duration={currentSong.duration} time={currentSong.time} album_image_url={currentSong.album_image_url} is_playing={currentSong.is_playing} votes={currentSong.votes} votes_required={currentSong.votes_required}></MediaPlayer>
            </Grid>
            { roomData.isHost ? renderSettingsBtn() : null }
            <Grid item xs={12} align="center">
                <Button color="secondary" variant="contained" onClick={handleLeaveButtonPress}>Leave Room</Button>
            </Grid>
        </Grid>
        );
    }

    return (
        roomData.roomExists ?
        ( showSettings ? renderSettings() : renderRoom()) : (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <Typography component="h4" variant="h4">
                        Room Does Not Exist
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button color="secondary" variant="contained" href="/">Back To Home</Button>
                </Grid>
            </Grid>
        )
    );
}
