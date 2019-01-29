import React, { Component } from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';

import './TokenList.css'


const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: '#282c34',
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class TokenList extends Component {
    
  state = {
    open: false,
    accessToken: '',
    refreshToken: ''
  };

  tokens = () => {
    let tokens = localStorage.getItem('tokens')
    if (!tokens) {
      return []
    }
    return JSON.parse(tokens).reverse()
  }

  timestampFormatted = (timestamp) => {
    return (new Date(timestamp)).toLocaleString()
  }

  expiresAt = (createdAtTimestamp, expiresIn) => {
    let expireTimestamp = parseInt(createdAtTimestamp) + parseInt(expiresIn) * 1000
    let nowTimestamp = (new Date()).getTime()
    let expiredString = ''
    if (nowTimestamp >= expireTimestamp) {
      expiredString = ' (EXPIRED)'
    }
    return (new Date(expireTimestamp)).toLocaleString() + expiredString 
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  getToken = (token) => {
    this.setState({
      accessToken: token.data.access_token,
      refreshToken: token.data.refresh_token
    })
    this.handleClickOpen()
  }

  render() {
    return (
      <div className="container">
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell>#</CustomTableCell>
                <CustomTableCell align="right">Type</CustomTableCell>
                <CustomTableCell align="right">Generated At</CustomTableCell>
                <CustomTableCell align="right">Expires At</CustomTableCell>
                <CustomTableCell align="right">Token</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.tokens().map((token, index) => (
                <TableRow key={index + 1}>
                  <CustomTableCell component="th" scope="row">
                    {index + 1}
                  </CustomTableCell>
                  <CustomTableCell component="th" scope="row">
                    {token.type}
                  </CustomTableCell>
                  <CustomTableCell align="right">{ this.timestampFormatted(token.timestamp) }</CustomTableCell>
                  <CustomTableCell align="right">{ this.expiresAt(token.timestamp, token.data.expires_in) }</CustomTableCell>
                  <CustomTableCell align="right">
                    <Button size="small" variant="contained" onClick={() => this.getToken(token)}>
                      VIEW
                    </Button>
                  </CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        <Dialog
          open={this.state.open}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
          fullWidth= { true }
          maxWidth="md"
        >
        <DialogTitle id="alert-dialog-slide-title">
          Tokens 
        </DialogTitle>
        <DialogContent>
          <div className="token-field">
            <TextField
              multiline={ true }
              label="Access Token"
              value={this.state.accessToken}
              margin="normal"
              variant="outlined"
              type="text"
            />
          </div>
          { this.state.refreshToken &&
          <div className="token-field">
            <TextField
              multiline={ true }
              label="Refresh Token"
              value={this.state.refreshToken}
              margin="normal"
              variant="outlined"
              type="text"
            />
          </div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </div>
    )
  }
}

export default TokenList;
