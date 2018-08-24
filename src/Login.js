import React, { Component } from 'react';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric'
import {Button, PrimaryButton, ButtonType} from 'office-ui-fabric-react/lib/Button'
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import gql from 'graphql-tag';


class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  login = async () => {
    this.setState({loading: true});

    const apolloClient = this.props.client;
    const login = this.loginTF.value;
    const password = this.passwordTF.value;
    if(login===""||!login){
      this.setState({errorMessage: "Это поле должно быть заполнено"});
      return
    }
    if(password===""||!password){
      this.setState({errorMessage2: "Это поле должно быть заполнено"});
      return
    }
    console.log(`${login} ${password}`);

    try{
      const authData = (await apolloClient.mutate({
        mutation: gql`
            mutation{
                authUser(password: "${password}", username: "${login}"){
                    accessToken
                    refreshToken
                }
            }
        `,
      }));
      console.log(authData);
      this.props.cookies.set('accessToken', authData.data.authUser.accessToken, { path: '/' });
      this.props.auth(authData.data.authUser.accessToken, true);
    } catch (e) {
      this.setState({errorMessage: "Неправильный логин и/или пароль"})
    }
  };

  render() {
    return (
      <div style={{
        height: '100%', width: '100%',
        backgroundImage: 'url(/inno4d-01.png)',
        backgroundSize : 'cover',
        backgroundPosition: 'center',}}>
        <Fabric style={{height: '100%', width: '100%'}}>
          <div style={{
            background: 'white',
            padding: '40px',
            width: '26vw',
            height: '50vh',
            position: 'relative',
            left: '50vw',
            top: '50vh',
            transform: 'translateX(-50%) translateY(-50%)'}}>
            {
              this.state.loading&&
              <div style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: 'calc(26vw + 80px)'
              }}>
                <ProgressIndicator/>
              </div>
            }
            <img src='/logo-01.png' height='29px' width='auto'/>
            <h1>Авторизация</h1>
            <TextField errorMessage={this.state.errorMessage} componentRef={(loginTF) => {this.loginTF = loginTF}} label='Логин' />
            <TextField errorMessage={this.state.errorMessage2} componentRef={(passwordTF) => {this.passwordTF = passwordTF}} label='Пароль' type='password'  />
            <PrimaryButton onClick={this.login.bind(this)} style={{
              position: 'absolute',
              right: '40px',
              marginTop: '40px',
              bottom: '40px',
            }}>Войти / Зарегистрироваться</PrimaryButton>
          </div>

        </Fabric>
      </div>
    );
  }
}

export default Login;
