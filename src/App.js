import React, { Component } from 'react';
import './App.css';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import axios from 'axios';
import SnackNotification from './components/SnackNotification';
import Snackbar from '@material-ui/core/Snackbar';

class App extends Component {
  state = {
    identityServerUrl: '',
    redirectUrl: window.location.href,
    clientId: '',
    clientSecret: '',
    scopes: '',
    code: '',
    accessToken: '',
    accessTokenErrMsg: '',
    validationErrMsg: '',
    refreshToken: ''
  };

  componentDidMount() {
    this.loadCredentials();
    let url = new URL(window.location.href);
    this.setState({
      code: url.searchParams.get('code') || ''
    }, this.fetchAcessToken);
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  fetchAcessToken() {
    if (!this.state.code) {
      return
    }
    let params = new URLSearchParams();
    params.append('code', this.state.code);
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', this.state.redirectUrl)
    params.append('client_id', this.state.clientId)
    params.append('client_secret', this.state.clientSecret)
    axios.post(this.state.identityServerUrl + '/connect/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then((response) => {
      this.setState({
        accessToken: response.data.access_token
      });
      if (response.data.refresh_token) {
        this.setState({
          refreshToken: response.data.refresh_token
        });
      }
    })
    .catch((error) => {
      this.setState({
        accessTokenErrMsg: error.error
      })
    });
  }

  redirect = () => {
    if (!this.validateForm()) {
      return;
    }
    let redirectUrl = new URL(this.state.identityServerUrl + '/connect/authorize');
    redirectUrl.searchParams.append('client_id', this.state.clientId);
    redirectUrl.searchParams.append('response_type', 'code');
    redirectUrl.searchParams.append('redirect_uri', this.state.redirectUrl);
    redirectUrl.searchParams.append('scope', this.state.scopes);

    this.saveCredentials();

    window.location.href = redirectUrl.href;
  }

  validateForm = () => {
    let errors = [];
    if (!this.state.clientId) {
      errors.push('Client Id is required')
    }
    if (!this.state.clientSecret) {
      errors.push('Client Secret is required')
    }
    if (!this.state.scopes) {
      errors.push('Scopes is required')
    }
    if (!this.state.identityServerUrl) {
      errors.push('Identity Server Url is required');
    }
    this.setState({'validationErrMsg': errors.join(', ')});
    return errors.length === 0;
  }

  saveCredentials = () => {
    localStorage.setItem('oauth2_identity_server_url', this.state.identityServerUrl);
    localStorage.setItem('oauth2_redirect_uri', this.state.redirectUrl);
    localStorage.setItem('oauth2_client_id', this.state.clientId);
    localStorage.setItem('oauth2_client_secret', this.state.clientSecret);
    localStorage.setItem('oauth2_scopes', this.state.scopes);
  }

  loadCredentials = () => {
    this.setState({
      identityServerUrl: localStorage.getItem('oauth2_identity_server_url') || '',
      clientId: localStorage.getItem('oauth2_client_id') || '',
      clientSecret: localStorage.getItem('oauth2_client_secret') || '',
      scopes: localStorage.getItem('oauth2_scopes') || '',
      redirectUrl: localStorage.getItem('oauth2_redirect_uri') || window.location.href
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h4>OAuth2 Tokengen</h4>
        </header>
        { !this.state.code &&
        <section className="App-form-section">
          <form id="token-generator-form" noValidate autoComplete="off">
            <TextField
              id="identity-server-url"
              label="Identity Server Url"
              value={this.state.identityServerUrl}
              onChange={this.handleChange('identityServerUrl')}
              margin="normal"
              variant="outlined"
              type="url"
            />
            <TextField
              id="redirect-url"
              label="Redirect URL (Read Only)"
              value={this.state.redirectUrl}
              onChange={this.handleChange('redirectUrl')}
              margin="normal"
              variant="outlined"
              type="url"
              inputProps={{
                readOnly: true,
                disabled: true,
              }}
            />
            <TextField
              id="scopes"
              label="Scopes"
              value={this.state.scopes}
              onChange={this.handleChange('scopes')}
              margin="normal"
              variant="outlined"
              type="url"
            />
            <TextField
              id="client-id"
              label="Client Id"
              value={this.state.clientId}
              onChange={this.handleChange('clientId')}
              margin="normal"
              variant="outlined"
              type="text"
            />
            <TextField
              id="client-secret"
              label="Client Secret"
              value={this.state.clientSecret}
              onChange={this.handleChange('clientSecret')}
              margin="normal"
              variant="outlined"
              type="text"
            />
            <Snackbar
              id="errorSnackbar"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              open={this.state.validationErrMsg.length > 0}
              autoHideDuration={6000}
              onClose={() => this.setState({'validationErrMsg': ''})}
            >
              <SnackNotification
                variant="error"
                message={this.state.validationErrMsg}
              />
            </Snackbar>
            <Button variant="contained" color="primary" size="large" onClick={this.redirect}>
              Generate Access Token
            </Button>
          </form>
        </section> }
        {
          this.state.code && 
          <section className="App-access-token-section">
            { !this.state.accessToken  &&
              <div className="App-access-token-fetch">
                <CircularProgress />
                <p style={{ textAlign: 'center' }}> Fetching access token... </p>
              </div> 
            }
            { this.state.accessToken &&
              <div className="App-access-token">
                <TextField
                  label="Access Token"
                  multiline={ true }
                  value={this.state.accessToken}
                  margin="normal"
                  variant="outlined"
                  id="access-token"
                />
              </div>
            }
            { this.state.accessTokenErrMsg &&
              <div className="App-access-token-err-msg">
                <p style={{ color: 'red'}}>{ this.state.accessToken }</p>
              </div>
            }
          </section>
        }
        {
          <section className="App-refresh-token-section">
            { this.state.refreshToken &&
              <div className="App-refresh-token">
                <TextField
                  label="Refresh Token"
                  multiline={ true }
                  value={this.state.refreshToken}
                  margin="normal"
                  variant="outlined"
                  id="refresh-token"
                />
              </div>
            }
          </section>
        }
      </div>
    );
  }
}

export default App;
