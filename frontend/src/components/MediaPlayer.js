import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, IconButton, Grid, Typography, LinearProgress } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function MediaPlayer({title, artist, duration, time, album_image_url, is_playing, votes, votes_required}) {
    const songProgress = (time / duration) * 100;

    function handlePausePlaySong() {
        const requestOptions = {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'}
        };
        if (is_playing) {
            fetch('/spotify/pause-song', requestOptions);
        } else {
            fetch('/spotify/play-song', requestOptions);
        }
    }

    function handleSkipSong() {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        fetch('/spotify/skip-song', requestOptions);
    }

    return (
        <Card>
            <Grid container alignItems="center">
                <Grid item align="center" xs={4}>
                    <img src={album_image_url} height="100%" width="100%"></img>

                </Grid>
                <Grid item align="center" xs={8}>
                    <Typography component="h5" variant="h5">
                        { title }
                    </Typography>
                    <Typography color="textSecondary" variant="subtitle1">
                        { artist }
                    </Typography>
                    <div>
                        <IconButton onClick={handlePausePlaySong}>
                            { is_playing ? <PauseIcon></PauseIcon> : <PlayArrowIcon></PlayArrowIcon> }
                        </IconButton>
                        <IconButton onClick={handleSkipSong}>
                            <Typography color="textSecondary" variant="subtitle1">{ " " } {votes} / { " " } {votes_required}</Typography> <SkipNextIcon></SkipNextIcon> 
                        </IconButton>
                    </div>
                </Grid>
            </Grid>
            <LinearProgress variant="determinate" value={songProgress}></LinearProgress>
        </Card>
    );
}