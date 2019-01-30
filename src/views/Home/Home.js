import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import './Home.css';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import axios from 'axios';
import SnackNotification from './../../components/SnackNotification';
import Snackbar from '@material-ui/core/Snackbar';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

class Home extends Component {
  scopes = [
    'openid',
    'profile',
    'address',
    'email',
    'offline_access',
    'read:core',
    'readwrite:core'
  ];

  scopeDependency = {
    email: ['openid'],
    address: ['openid'],
    profile: ['openid']
  }

  appTypes = [
    {
      id: 'ssa',
      label: 'Server Side Application',
      value: 'server_side',
      grant_type: 'authorization_code',
      response_type: 'code'
    },
    {
      id: 'spa',
      label: 'Single Page Application',
      value: 'single_page',
      grant_type: 'authorization_code',
      response_type: 'code'
    }
  ]

  state = {
    toTokensView: false,
    appType: 'server_side',
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
    const appType = this.state.appType
    this.setState({
      [name]: event.target.value,
    }, () => {
      if (appType === this.state.appType) {
        return
      }
      let credentials = {
        clientId: localStorage.getItem('oauth2_ssa_client_id') || '',
        clientSecret: localStorage.getItem('oauth2_ssa_client_secret') || ''
      }
      if (this.state.appType === 'single_page') {
        this.removeScope('offline_access')
        credentials = {
          clientId: localStorage.getItem('oauth2_spa_client_id') || ''
        }
      }
      this.setState(credentials)
    });
  };

  handleScopeChange = name => event => {
    if(this.state.scopes.search(event.target.value) >= 0) {
      this.removeScope(event.target.value)
    } else {
      this.addScope(event.target.value)
    }
  };

  removeScope = (scope) => {
    this.setState({scopes: this.state.scopes.replace(scope, '')})
  }

  addScope = (scope) => {
    if (this.state.scopes.search(scope) >= 0) {
      return
    }
    this.setState({scopes: this.state.scopes.trim() + ' ' + scope}, () => {
      if (this.scopeDependency[scope]) {
        for(let s of this.scopeDependency[scope]) {
          this.addScope(s)
        }   
      }
    }) 
  }

  fetchAcessToken() {
    if (!this.state.code) {
      return
    }
    let params = new URLSearchParams();
    params.append('code', this.state.code);
    params.append('grant_type', this.appType().grant_type)
    params.append('redirect_uri', this.state.redirectUrl)
    params.append('client_id', this.state.clientId)
    if (this.state.appType === 'server_side') {
      params.append('client_secret', this.state.clientSecret)
    }
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
      this.storeToken(response.data)
      this.setState({toTokensView: true})
    })
    .catch((error) => {
      this.setState({
        accessTokenErrMsg: error.response.data.error,
        code: ''
      })
    });
  }

  storeToken = (data) => {
    let tokens = localStorage.getItem('tokens');
    if (tokens) {
      tokens = JSON.parse(tokens)
    } else {
      tokens = []
    }
    tokens.push({data: data, type: this.state.appType, timestamp: (new Date()).getTime()})
    localStorage.setItem('tokens', JSON.stringify(tokens))
  }

  appType = () => {
    return this.appTypes.filter((app) => app.value === this.state.appType)[0] || null
  }

  appScopes = () => {
    return this.scopes.filter((scope) => {
      if (this.state.appType === 'single_page') {
        return scope !== 'offline_access'
      }
      return true
    })
  }

  redirectToIdentityServer = () => {
    if (!this.validateForm()) {
      return;
    }
    let redirectUrl = new URL(this.state.identityServerUrl + '/connect/authorize');
    redirectUrl.searchParams.append('client_id', this.state.clientId);
    redirectUrl.searchParams.append('response_type', this.appType().response_type);
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
    localStorage.setItem('oauth2_identity_server_url', this.state.identityServerUrl)
    localStorage.setItem('oauth2_redirect_uri', this.state.redirectUrl)
    if (this.state.appType === 'server_side') {
      localStorage.setItem('oauth2_ssa_client_id', this.state.clientId)
      localStorage.setItem('oauth2_ssa_client_secret', this.state.clientSecret)
    } else {
      localStorage.setItem('oauth2_spa_client_id', this.state.clientId)
    }
    localStorage.setItem('oauth2_scopes', this.state.scopes)
    localStorage.setItem('oauth2_app_type', this.state.appType)
  }

  loadCredentials = () => {
    let credentials = {
      appType: localStorage.getItem('oauth2_app_type') || 'server_side',
      identityServerUrl: localStorage.getItem('oauth2_identity_server_url') || '',
      scopes: localStorage.getItem('oauth2_scopes') || '',
      redirectUrl: localStorage.getItem('oauth2_redirect_uri') || window.location.href
    };

    if (credentials.appType === 'server_side') {
      credentials.clientId = localStorage.getItem('oauth2_ssa_client_id') || ''
      credentials.clientSecret = localStorage.getItem('oauth2_ssa_client_secret') || ''
    } else {
      credentials.clientId = localStorage.getItem('oauth2_spa_client_id') || ''
    }
    this.setState(credentials)
  }

  handleCloseSnackbar = () => {
    this.setState({
      accessTokenErrMsg: ''
    })
  }

  render() {
    if(this.state.toTokensView) {
      return <Redirect to="/tokens"></Redirect>
    }

    return (
      <div className="Home container">
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
        { !this.state.code &&
        <section className="Home-form-section">
          <form id="token-generator-form" noValidate autoComplete="off">
            <div>
              <TextField
                id="outlined-select-currency-native"
                select
                label="Application Type"
                value={this.state.appType}
                onChange={this.handleChange('appType')}
                SelectProps={{
                  native: true
                }}
                margin="normal"
                variant="outlined"
              >
                {this.appTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </div>
            <div>
              <TextField
                id="identity-server-url"
                label="Identity Server Url"
                value={this.state.identityServerUrl}
                onChange={this.handleChange('identityServerUrl')}
                margin="normal"
                variant="outlined"
                type="url"
              />
            </div>
            <div>
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
            </div>
            <div>
              <TextField
                id="client-id"
                label="Client Id"
                value={this.state.clientId}
                onChange={this.handleChange('clientId')}
                margin="normal"
                variant="outlined"
                type="text"
              />
            </div>
            { this.state.appType === 'server_side' &&
            <div>
              <TextField
                id="client-secret"
                label="Client Secret"
                value={this.state.clientSecret}
                onChange={this.handleChange('clientSecret')}
                margin="normal"
                variant="outlined"
                type="text"
              />
            </div>}
            <div>
              <div className="scopes-input">
                <TextField
                  id="scopes"
                  label="Scopes"
                  value={this.state.scopes}
                  onChange={this.handleChange('scopes')}
                  margin="normal"
                  variant="outlined"
                  type="url"
                />
              </div>
              <div className="scopes">
                {this.appScopes().map((scope) => <FormControlLabel
                    control={<Checkbox
                        checked={this.state.scopes.search(scope) >= 0}
                        onChange={this.handleScopeChange('scopes')}
                        value={scope}
                        color="primary"
                      />
                    }
                    label={scope}
                    key={scope}
                  />
                )}
              </div>
            </div>
            <div>
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
            </div>
            <div className="submit-wrapper">
              <Button variant="contained" color="primary" size="large" onClick={this.redirectToIdentityServer}>
                Generate Token
              </Button>
            </div>
          </form>
        </section> }
        {
          this.state.code && 
          <section className="Home-access-token-section">
            { !this.state.accessToken && !this.state.accessTokenErrMsg &&
              <div className="Home-access-token-fetch">
                <CircularProgress />
                <p style={{ textAlign: 'center' }}> Fetching access token... </p>
              </div> 
            }
          </section>
        }
      </div>
    );
  }
}

export default Home;
