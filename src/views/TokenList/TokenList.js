import React, { Component } from 'react';
import axios from 'axios'

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import SnackNotification from './../../components/SnackNotification';

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
    refreshToken: '',
    idToken: '',
    tokens: [],
    accessTokenErrMsg: '',
    identityServerUrl: '',
    refreshingToken: false
  };

  componentDidMount() {
    this.setState({
      tokens: JSON.parse(localStorage.getItem('tokens') || '[]').reverse(),
      identityServerUrl: localStorage.getItem('oauth2_identity_server_url')
    })
  }

  timestampFormatted = (timestamp) => {
    return (new Date(timestamp)).toLocaleString()
  }

  expiresAt = (createdAtTimestamp, expiresIn) => {
    let expireTimestamp = parseInt(createdAtTimestamp) + parseInt(expiresIn) * 1000
    let nowTimestamp = (new Date()).getTime()
    if (nowTimestamp >= expireTimestamp) {
      return 'EXPIRED'
    }
    return (new Date(expireTimestamp)).toLocaleString()
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  setCurrentToken = (token) => {
    this.setState({
      accessToken: token.data.access_token,
      refreshToken: token.data.refresh_token,
      idToken: token.data.id_token
    })
    this.handleClickOpen()
  }

  deleteToken = (index) => {
    let tokens = [...this.state.tokens]
    tokens.splice(index, 1)
    this.setState({
      tokens: tokens
    })
    localStorage.setItem('tokens', JSON.stringify(tokens.reverse()))
  }

  refreshAccessToken(index) {
    let tokens = [...this.state.tokens]
    let token = tokens[index]
    
    let clientId = localStorage.getItem('oauth2_ssa_client_id') || ''
    let clientSecret = localStorage.getItem('oauth2_ssa_client_secret') || ''

    if (token.type === 'single_page') {
      clientId = localStorage.getItem('oauth2_spa_client_id')
      clientSecret = localStorage.getItem('oauth2_spa_client_secret')
    }

    if (!clientId || !clientSecret) {
      this.setState({
        accessTokenErrMsg: 'unable to refresh token because client id and client secret is empty.'
      })
      return
    }

    this.setState({
      refreshingToken: true
    })
    let params = new URLSearchParams();
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', token.data.refresh_token)
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)
    axios.post(this.state.identityServerUrl + '/connect/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then((response) => {
      this.setState({
        refreshingToken: false
      })
      token.timestamp = (new Date()).getTime()
      token.data.access_token = response.data.access_token
      token.data.refresh_token = response.data.refresh_token
      if (response.data.id_token) {
        token.data.id_token = response.data.id_token
      }
      this.setState({
        tokens: tokens
      })
      localStorage.setItem('tokens', JSON.stringify(tokens.reverse()))
    })
    .catch((error) => {
      this.setState({
        refreshingToken: false,
        accessTokenErrMsg: error.response.data.error
      })
    });
  }

  handleCloseSnackbar = () => {
    this.setState({
      accessTokenErrMsg: ''
    })
  }

  render() {
    return (
      <div className="container">
        {this.state.refreshingToken && <div><p style={{ textAlign: 'center' }}>Refreshing Token...</p> <LinearProgress /></div>}
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          open={this.state.accessTokenErrMsg.length > 0}
          onClose={() => this.handleCloseSnackbar()}
        >
          <SnackNotification
            variant="error"
            message={ this.state.accessTokenErrMsg }
          />
        </Snackbar>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell>#</CustomTableCell>
                <CustomTableCell>Type</CustomTableCell>
                <CustomTableCell>Generated At</CustomTableCell>
                <CustomTableCell>Expires At</CustomTableCell>
                <CustomTableCell>Token</CustomTableCell>
                <CustomTableCell>Actions</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.tokens.map((token, index) => (
                <TableRow key={index + 1}>
                  <CustomTableCell component="th" scope="row">
                    {index + 1}
                  </CustomTableCell>
                  <CustomTableCell component="th" scope="row">
                    <Chip label={token.type} color={token.type === 'single_page' ? 'primary' : 'secondary'}/>
                  </CustomTableCell>
                  <CustomTableCell>{ this.timestampFormatted(token.timestamp) }</CustomTableCell>
                  <CustomTableCell>{ this.expiresAt(token.timestamp, token.data.expires_in) }</CustomTableCell>
                  <CustomTableCell>
                    <Button size="small" variant="contained" onClick={() => this.setCurrentToken(token)}>
                      VIEW
                    </Button>
                  </CustomTableCell>
                  <CustomTableCell>
                    <Button title="delete" size="small" variant="contained" color="secondary" onClick={() => this.deleteToken(index)}>
                      Trash
                    </Button> &nbsp;&nbsp;
                    {token.data.refresh_token && <Button disabled={this.state.refreshingToken} title="delete" size="small" variant="contained" onClick={() => this.refreshAccessToken(index)}>
                      Refresh Access Token
                    </Button>}
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
          { this.state.idToken &&
          <div className="token-field">
            <TextField
              multiline={ true }
              label="ID Token"
              value={this.state.idToken}
              margin="normal"
              variant="outlined"
              type="text"
            />
          </div>}
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
