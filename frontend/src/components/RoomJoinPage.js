import React, { useState } from "react";

import { TextField, Button, Grid, Typography, FormControl } from '@mui/material';
import { Link, useNavigate } from "react-router-dom";

export default function RoomJoinPage() {

    const navigate = useNavigate();
    const [roomData, setRoomData] = useState({ roomCode: "", error: false, errorMessage: ""});

    function handleTextFieldChange(e) {
        setRoomData({roomCode: e.target.value, error: false, errorMessage: ""})
    }

    function handleRoomButtonPress(e) {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                code: roomData.roomCode
            }),
        }
        fetch('/api/join-room', requestOptions)
        .then((response) => {
            if (response.ok) {
                navigate('/room/' + roomData.roomCode, {})
            } else {
                setRoomData({roomCode: roomData.roomCode, error: true, errorMessage: "Room not found."})
            }
        }).catch((error) => {
            console.log(error)
        });
       
    }

    return (
        <Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <Typography component="h4" variant="h4">
                    Join A Room
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl >
                    <TextField label="Code" type="text" error={roomData.error} helperText={roomData.errorMessage} defaultValue={roomData.roomCode} inputProps={{min:1, style:{textAlign:"center", color:"#dddddd"}}} placeholder="Enter a Room Code" onChange={handleTextFieldChange}></TextField>  
                </FormControl>
            </Grid> 
            <Grid item xs={12} align="center">
                <Button variant="contained" color="secondary" onClick={handleRoomButtonPress}>Enter Room</Button>
            </Grid>
            <Grid item xs={12} align="center">
                <Button variant="contained" color="primary" href="/">Back</Button>
            </Grid>
        </Grid>
    );
}
