import React, { Component } from 'react';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric'
import {Button, PrimaryButton, DefaultButton, ButtonType} from 'office-ui-fabric-react/lib/Button'
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import gql from 'graphql-tag';
import QRCode from 'qrcode-react';

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      edit_mode: false,
      user: {},
    };
    console.log(this.props);
    this.apolloClient = this.props.client;
  }

  componentDidMount(){
    this.getUser();
  }

  async getUser() {
    const user = await this.props.user();
    console.log(user);
    if(!user){
      this.getUser();
      return
    }
    await this.setState({user: user, edit_mode: user.isNewUser})
  }

  async save(){
    if(this.state.edit_mode){
      console.log(this.props.token);
      if(this.firstNameTF.value==="" || !this.firstNameTF.value){
        this.setState({fnem: "Это поле должно быть заполнено"});
        return
      }
      if(this.secondNameTF.value==="" || !this.secondNameTF.value){
        this.setState({snem: "Это поле должно быть заполнено"});
        return
      }
      const userData = (await this.apolloClient.mutate({
        mutation: gql`
            mutation{
                editUser(input: {
                    id: ${this.state.user.userId}
                    isNewUser: false
                    firstName: "${this.firstNameTF.value}"
                    secondName: "${this.secondNameTF.value}"
                    ${this.passwordTF.value&&'password: "'+this.passwordTF.value+'"'}
                }, token: "${this.props.token}"){
                    user{
                        firstName
                        secondName
                        login
                        userId
                    }
                }
            }
        `,
      }));
      this.setState({edit_mode: false, user: userData.data.editUser.user})
    } else {
      this.setState({edit_mode: true})
    }
  }

  cancel(){
    this.setState({edit_mode: false})
  }

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
              width: '55vw',
              height: '52vh',
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
                width: 'calc(55vw + 80px)'
              }}>
                <ProgressIndicator/>
              </div>
            }
            <div style={{
              position: 'absolute',
              left: '0px'
            }}>
            </div>

            <div style={{
              position: 'absolute',
              left: '40px',
              top: '40px',
              height: '100%'
            }}>
              <QRCode
                renderAs='svg'
                style={{width: '27vw', height:'27vw'}}
                size={256}
                logoWidth={96}
                logo='/logo-02.png'
                value={`inno4d:/token:/${this.props.token}`} />
            </div>

            <div style={{
              position: 'absolute',
              right: '40px',
              top: '0px',
              height: '100%'
            }}>
              <img style={{marginTop: '40px'}} src='/logo-01.png' height='29px' width='auto'/>
              <h1>Профиль</h1>
              <div>
                <div style={{display: 'inline-block', marginRight: '29px'}}>
                  <TextField errorMessage={this.state.fnem} disabled={!this.state.edit_mode} autoComplete='off' value={this.state.user&&this.state.user.firstName} componentRef={(firstNameTF) => {this.firstNameTF = firstNameTF}} label='Имя' />
                  <TextField errorMessage={this.state.snem} disabled={!this.state.edit_mode} autoComplete='off' value={this.state.user&&this.state.user.secondName} componentRef={(secondNameTF) => {this.secondNameTF = secondNameTF}} label='Фамилия' />
                </div>
                <div style={{display: 'inline-block'}}>
                  <TextField autoComplete='off' value={this.state.user&&this.state.user.login} disabled={true} label='Логин' />
                  <TextField disabled={!this.state.edit_mode} autoComplete='off' componentRef={(passwordTF) => {this.passwordTF = passwordTF}} label='Пароль' type='password'  />
                </div>
              </div>
              <div style={{
                position: 'absolute',
                right: '0px',
                bottom: '40px',
              }}>
                {this.state.edit_mode&&<DefaultButton onClick={this.cancel.bind(this)} style={{display: 'inline-block', marginRight: '29px'}}>Отменить</DefaultButton>}
                <PrimaryButton onClick={this.save.bind(this)} style={{display: 'inline-block'}}>{this.state.edit_mode?'Сохранить':'Редактировать'}</PrimaryButton>
              </div >
            </div>
            </div>
        </Fabric>
      </div>
    );
  }
}

export default Account;
