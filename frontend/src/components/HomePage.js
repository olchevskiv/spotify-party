import React, { useState, useEffect } from "react";
import RoomJoinPage from './RoomJoinPage';
import CreateRoomPage from './CreateRoomPage';
import RoomPage from './RoomPage';

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom"
import { Button, ButtonGroup, Grid, Typography } from '@mui/material';

export default function HomePage() {
    const [roomCode, setRoomCode] = useState('');

    useEffect(() => {
        fetch('/api/user-in-room')
        .then((response) => response.json())
        .then((data) => {
            setRoomCode(data.code);
        });
    }, [roomCode]);

    function renderHomePage() {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12} align="center">
                    <Typography variant="h3" component="h3">Spotify Party</Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <ButtonGroup disableElevation variant="contained">
                        <Button color="primary" href="/join">Join Room</Button>
                        <Button color="secondary" href="/create">Create Room</Button>
                    </ButtonGroup>
                </Grid>
            </Grid>
        );
    }

    
    return (<Router>
        <Routes>
            <Route exact path='/' element={roomCode ? ( <Navigate replace to={'/room/' + roomCode} /> ) : ( renderHomePage() ) }></Route>
            <Route path='/join' element={<RoomJoinPage />}></Route>
            <Route path='/create' element={<CreateRoomPage />}></Route>
            <Route path='/room/:roomCode' element={<RoomPage />}></Route>
        </Routes>
    </Router>);
}
