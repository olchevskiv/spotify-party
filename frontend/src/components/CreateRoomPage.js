import React, { useState } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Link, useNavigate } from "react-router-dom";

export default function CreateRoomPage({update, room_code, votes_to_skip, guest_can_pause}) {

    const navigate = useNavigate();

    const [votesToSkip, setVotes] = useState((update ? votes_to_skip : 2 ));
    const [guestCanPause, setGuestCanPause] = useState((update ? guest_can_pause : true));

    function handleVotesChange(e) {
        setVotes(e.target.value);
    }

    function handleGuestCanPauseChange(e) {
        setGuestCanPause(e.target.value === 'true' ? true : false);
    }

    function handleCreateRoomButtonPress(e) {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                votes_to_skip: votesToSkip,
                guest_can_pause: guestCanPause
            }),
        }
        fetch('/api/create-room', requestOptions)
        .then((response) => response.json())
        .then((data) => navigate('/room/' + data.code));
    }

    return (  
        <Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <Typography component="h4" variant="h4">
                    { update ? "Settings" : "Create A Room" }
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl component="fieldset">
                    <FormHelperText component="div"><div align="center">Guest Control of Playback State</div></FormHelperText>
                    <RadioGroup row defaultValue={guestCanPause} onChange={handleGuestCanPauseChange}>
                        <FormControlLabel value="true" control={<Radio color="primary"></Radio>} label="Play/Pause" labelPlacement="bottom"></FormControlLabel>
                        <FormControlLabel value="false" control={<Radio color="secondary"></Radio>} label="No Control" labelPlacement="bottom"></FormControlLabel>
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl>
                    <TextField required={true} type="number" defaultValue={votesToSkip} inputProps={{min:1, style:{textAlign:"center"}}} onChange={handleVotesChange}></TextField>
                    <FormHelperText component="div"><div align="center">Votes Required To Skip Song</div></FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} align="center">
                <Button color="primary" variant="contained" onClick={handleCreateRoomButtonPress}> { update ? "Save Changes" : "Create A Room" }</Button>
            </Grid>
            { update ? null :
                <Grid item xs={12} align="center">
                    <Button color="secondary" variant="contained" href="/">Back</Button>
                </Grid>
            }
        </Grid>
    );
}
