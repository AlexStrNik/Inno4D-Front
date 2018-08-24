import React, { Component } from 'react';
import Cesium from 'cesium/Cesium';
import 'cesium/Widgets/widgets.css'; //eslint-disable-line
import 'cesium/Widgets/InfoBox/InfoBoxDescription.css'; //eslint-disable-line
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import gql from 'graphql-tag';
import {Panel} from "office-ui-fabric-react/lib/Panel";
import {Button, PrimaryButton, DefaultButton, ButtonType, IconButton} from 'office-ui-fabric-react/lib/Button'
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import {ActivityItem} from "office-ui-fabric-react/lib/ActivityItem";
import {Link} from "office-ui-fabric-react/lib/Link";
import {type2color} from './Utils'

String.prototype.replaceAll = function(search, replacement) {
  let target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      chatPanel: false
    };
    console.log('WTF');
    console.log(this.state);
  }

  async loadMap(){
    const self = this;
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYzliMjNmMS00YjQ2LTQ4MzQtOWI1ZS1hNmU0MzMzZTg1ZTgiLCJpZCI6Mjc3OCwiaWF0IjoxNTM0NTIyNjk2fQ.MORkjLZANhZ0qURBDC998ay8SWXaKlC_UaYcErB04kc';

    const apolloClient = this.props.client;

    const mapData = (await apolloClient.query({
      query: gql`
          query GeoJson {
              buildingsJson
              commerceJson
          }
      `,
    })).data;

    let viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        credit: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
      }),
      timeline: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      geocoder: false,
      selectionIndicator : false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      animation: false,
      infoBox: false,
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
      const pickedObjects = viewer.scene.drillPick(movement.position);
      if (Cesium.defined(pickedObjects)) {
        for (let i = 0; i < pickedObjects.length; ++i) {
          let entity = pickedObjects[i].id;
          if(entity.properties.Type){
            self.showCommerce(entity._properties._id);
            return;
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (movement) {
      const pickedObjects = viewer.scene.drillPick(movement.endPosition);
      if (Cesium.defined(pickedObjects)) {
        for (let i = 0; i < pickedObjects.length; ++i) {
          let entity = pickedObjects[i].id;
          if(entity.properties.Type){
            self.setState({tooltipName: entity._properties._Name, tooltipType: entity._properties._Type});
            return;
          }
        }
      }
      self.setState({tooltipName: null, tooltipType: null});
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    let dataSource = await Cesium.GeoJsonDataSource.load(mapData.buildingsJson);
    let p = dataSource.entities.values;
    for (let i = 0; i < p.length; i++) {
      p[i].polygon.extrudedHeight = p[i].properties._B_LEVELS._value * 7; // or height property
    }

    let dataSource_c = await Cesium.GeoJsonDataSource.load(mapData.commerceJson);
    let p_c = dataSource_c.entities.values;
    for (let i = 0; i < p_c.length; i++) {
      p_c[i].polygon.extrudedHeight = 7; // or height property
      console.log(p_c[i].properties._Type._value);
      let color = type2color[p_c[i].properties._Type._value];
      p_c[i].polygon.material = new Cesium.ColorMaterialProperty(color);
      p_c[i].polygon.outline = true;
      p_c[i].polygon.outlineColor = color;
    }
    await viewer.dataSources.add(dataSource);
    await viewer.dataSources.add(dataSource_c);


    await viewer.zoomTo(dataSource);
  }

  async loadChat() {
    const apolloClient = this.props.client;

    const allMessages = (await apolloClient.query({
      query: gql`
          query AllMessages {
              allMessages{
                  text
                  messageId
                  date
                  replyMessage{
                      user{
                          firstName
                          secondName
                      }
                      text
                  }
                  user{
                      firstName
                      secondName
                  }
              }
          }
      `,
    })).data;
    this.setState({messages: allMessages.allMessages})
  }

  hideChat(){
    this.setState({chatPanel: false});
  }

  hideCommerce(){
    this.setState({commPanel: false});
  }

  async loadCommerce(id){
    const apolloClient = this.props.client;

    const commData = (await apolloClient.query({
      query: gql`
          query{
              commerceById(id: ${id}){
                  name
                  rentalRate
                  address
                  id
                  area
                  idHouse
                  p
                  status
                  type
              }
          }
      `,
    })).data.commerceById;
    console.log(commData);
    this.setState({commData: commData})
  }

  showCommerce(id){
    this.loadCommerce(id);
    this.setState({
      commPanel: true,
      commData: {},
      commEditMode: false
    });
    this.hideChat();
  }

  toggleChat(){
    console.log(this.state);
    this.setState({chatPanel: !this.state.chatPanel});
  }

  componentDidMount(){
    this.loadMap();
    this.loadChat();
    this.getUser();
  }
  async save(){
    if(this.state.commEditMode){
      let apolloClient = this.props.client;
      let commData = await apolloClient.mutate({
        mutation: gql`
          mutation {
            editCommrece(input: {
              id: ${this.state.commData.id}
              Name: "${this.nameTF.value.replaceAll('"', '\\"')}"
              rentalRate: ${this.rentalTF.value||0}
              address: "${this.addressTF.value.replaceAll('"', '\\"')}"
              area: ${this.areaTF.value||0}
              status: "${this.statusTF.value.replaceAll('"', '\\"')}"
              P: ${this.pTF.value||0}
              idHouse: ${this.state.commData.idHouse||2}
              Type: "${this.typeTF.value.replaceAll('"', '\\\\"')}"
            }, token: "${this.props.token}") {
              commerce {
                name
                rentalRate
                address
                id
                area
                idHouse
                p
                status
                type
              }
            }
        }`
      });
      console.log(commData.data);
      this.setState({commEditMode: false, commData: commData.data.editCommrece.commerce})
    } else {
      this.setState({commEditMode: true})
    }
  }

  cancel(){
    this.setState({commEditMode: false})
  }

  async getUser(){
    let user = await this.props.user();
    await this.setState({user: user})
  }

  async send(){
    
  }

  render(){

    return (
      <Fabric style={{height: '100vh', width: '100vw'}}>
        <div id="cesiumContainer" style={{height: '100vh', width: '100vw'}}>
          <Panel
            isOpen={this.state.chatPanel}
            isLightDismiss={true}
            headerText='Чат'
            onDismiss={this.hideChat.bind(this)}
          >
            <div style={{
              width: '100%',
              height: 'calc(100vh - 360px)'
            }}>
              {this.state.messages && this.state.messages.map((message)=> { return (
                <ActivityItem
                  style={{
                    marginTop: '29px'
                  }}
                  key={message.messageId}
                  timeStamp={message.date}
                  comments={
                    <span style={{fontSize: '15px'}}>
                       {message.replyMessage&&
                         <span style={{fontWeight:'bold', fontSize: '15px'}}>
                           ❝{message.replyMessage.text}❞
                           <span style={{fontWeight:'normal', fontStyle:'italic', fontSize: '11px'}}><br/>{message.replyMessage.user.firstName + ' ' + message.replyMessage.user.secondName}</span>
                           <br/>
                           <br/>
                          </span>
                         }
                      {message.text}
                    </span>}
                  activityDescription={
                    [
                      <Link
                        key={1}
                        onClick={() => {
                          alert('A name was clicked.');
                        }}
                      >
                        {message.user.firstName + ' ' + message.user.secondName}
                      </Link>,
                      <span key={2}> {message.replyMessage?'ответил(а) на сообщение:':'написал(а) сообщение:'}</span>
                    ]
                  }
                  activityPersonas={[
                    {
                      imageInitials: message.user.firstName[0] + message.user.secondName[0],
                      text: message.user.firstName + ' ' + message.user.secondName
                    }
                  ]}
                />
                )})}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '91px',
              width: 'calc(100% - 80px)'
            }}>
              <TextField componentRef={(textTF) => {this.textTF = textTF}} multiline resizable={false} />
              <PrimaryButton style={{
                marginTop: '29px',
                position: 'absolute',
                right: '0px'
              }}
                allowDisabledFocus={true}
                onClick={this.send.bind(this)}
                iconProps={{ iconName: 'Send' }}
                text="Отправить">
                Отправить
              </PrimaryButton>
            </div>
          </Panel>
          <Panel
            isOpen={this.state.commPanel}
            isLightDismiss={true}
            headerText='Коммерция'
            onDismiss={this.hideCommerce.bind(this)}
          >
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.name} componentRef={(ref) => {this.nameTF = ref}} label='Название'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.status} componentRef={(ref) => {this.statusTF = ref}} label='Статус'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.type} componentRef={(ref) => {this.typeTF = ref}} label='Тип'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.rentalRate} componentRef={(ref) => {this.rentalTF = ref}} label='Арендная плата'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.address} componentRef={(ref) => {this.addressTF = ref}} label='Адрес'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.p} componentRef={(ref) => {this.pTF = ref}} label='Потребляемая мощность'/>
            <TextField disabled={!this.state.commEditMode} value={this.state.commData&&this.state.commData.area} componentRef={(ref) => {this.areaTF = ref}} label='Площадь'/>
            <div style={{
              position: 'absolute',
              right: '40px',
              width: '40vw',
              bottom: '40px',
            }}>
              {this.state.commEditMode&&<DefaultButton onClick={this.cancel.bind(this)} style={{display: 'inline-block', marginRight: '29px'}}>Отменить</DefaultButton>}
              <PrimaryButton disabled={!(this.state.user&&this.state.user.isAdmin)} onClick={this.save.bind(this)} style={{display: 'inline-block'}}>{this.state.commEditMode?'Сохранить':'Редактировать'}</PrimaryButton>
            </div >
          </Panel>
        </div>
        {this.state.tooltipName&&<div style={{
          position: 'fixed',
          bottom: '29px',
          left: '50vw',
          background: '#fff',
          padding: '40px',
          width: '20vw',
          borderStyle: 'solid',
          borderWidth: '2px',
          borderColor: '#2eadb4',
          transform: 'translateX(-50%)'
        }}>
          <TextField label="Название" value={this.state.tooltipName} disabled={true} />
          <TextField label="Тип" value={this.state.tooltipType} disabled={true} />
        </div>}
        <div id="topBar" style={{
          width: '100%',
          position: 'fixed',
          top: 0
        }}>
          <CommandBar farItems={[
            {
              iconOnly: true,
              iconProps: {
                iconName: 'Message'
              },
              key: 'chat',
              onClick: this.toggleChat.bind(this),
              name: 'Чат'
            },
            {
              iconOnly: true,
              iconProps: {
                iconName: 'Contact'
              },
              onClick: () => {this.props.history.push('/account')},
              key: 'profile',
              name: 'Профиль'
            }
          ]}/>
        </div>
      </Fabric>
    );
  }
}

export default Map;
