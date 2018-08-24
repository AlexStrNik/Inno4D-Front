import 'babel-polyfill';
import React, { Component } from 'react';
import Map from './Map'
import Login from './Login';
import Account from './Account';
import { loadTheme, getTheme } from 'office-ui-fabric-react/lib/Styling';
import { ApolloClient, createNetworkInterface } from 'apollo-client';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { getMainDefinition } from 'apollo-utilities';
import { InMemoryCache } from 'apollo-cache-inmemory';
import {Router , Redirect, Route, Switch} from 'react-router-dom';
import Cookies from 'universal-cookie';
import gql from 'graphql-tag';
import createHistory from 'history/createBrowserHistory';

// Create an http link:
const httpLink = new HttpLink({
  uri: 'http://10.240.22.34:5000/graphql'
});
const cookies = new Cookies();
const history = createHistory();
// Create a WebSocket link:

/*
const wsLink = new WebSocketLink({
  uri: `ws://10.240.22.203:5000/socket`,
  options: {
    timeout: 60000,
    reconnect: true
  }
});
*/

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent

/*
const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);
*/

const cache = new InMemoryCache(window.__APOLLO_STATE);

loadTheme({
  palette: {
    themePrimary: '#2eadb4',
    themeLighterAlt: '#f5fcfc',
    themeLighter: '#d6f2f3',
    themeLight: '#b5e6e9',
    themeTertiary: '#75ced3',
    themeSecondary: '#42b8be',
    themeDarkAlt: '#2a9da3',
    themeDark: '#24858a',
    themeDarker: '#1a6265',
    neutralLighterAlt: '#f8f8f8',
    neutralLighter: '#f4f4f4',
    neutralLight: '#eaeaea',
    neutralQuaternaryAlt: '#dadada',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c8c8',
    neutralTertiary: '#c2c2c2',
    neutralSecondary: '#858585',
    neutralPrimaryAlt: '#4b4b4b',
    neutralPrimary: '#333',
    neutralDark: '#272727',
    black: '#1d1d1d',
    white: '#fff',
    bodyBackground: '#fff',
    bodyText: '#333'
  }
});
initializeIcons();

const apolloClient = new ApolloClient({
  link: httpLink, cache:cache, connectToDevTools: true,
});

const RMap = (token, user, history) => () => {
  return <Map token={token} history={history} user={user} client={apolloClient} cookies={cookies}/>
};

const RLogin = (auth, user) => () => {
  return <Login user={user} client={apolloClient} cookies={cookies} auth={auth}/>
};

const RAccount = (token, user, history) => () => {
  return <Account history={history} token={token} user={user} client={apolloClient} cookies={cookies}/>
};


class App extends Component {

  async componentDidMount() {
    await this.auth(cookies.get('accessToken'), false)
  }

  async User(){
    if(!this.token){
      this.token = cookies.get('accessToken');
    }

    if(!this.token){
      history.push('/login')
    }

    let user = (await apolloClient.query({
      query: gql`
          query {
              myUser(token: "${this.token}"){
                  login
                  isAdmin
                  isNewUser
                  firstName
                  secondName
                  userId
              }
          }
      `
    })).data;
    console.log(typeof(user));
    console.log(user);
    if(user){
      return user.myUser;
    }
    history.push('/login');
    return null
  }

  async auth(token, redirect){
    console.log(token);
    cookies.set('accessToken', token, { path: '/' });
    this.token = token;
    let user = await this.User();
    if(user){
      if(user.isNewUser){
        if(history.location.pathname!=='/login') {
          history.push('/account')
        }
      } else {
        if(redirect) history.push('/map')
      }
    } else {
      history.push('/login')
    }
    console.log(user);
  }

  render() {
    if(!this.token){
      this.token = cookies.get('accessToken');
    }

    return (
      <Router history={history}>
        <Switch>
          <Route path='/map' component={RMap(this.token, this.User.bind(this), history)}/>
          <Route path='/login' component={RLogin(this.auth.bind(this), this.User.bind(this))}/>
          <Route path='/account' component={RAccount(this.token, this.User.bind(this), history)}/>
        </Switch>
      </Router>
    )
  }
}

export default App;
