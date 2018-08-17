import React, { Component } from 'react';
import Cesium from 'cesium/Cesium';

class App extends Component {

  componentDidMount(){
    let viewer = new Cesium.Viewer('cesiumContainer');
    let dataSource = Cesium.GeoJsonDataSource.load('buildings.geojson').then(
      function(dataSource) {
        let p = dataSource.entities.values;
        for (let i = 0; i < p.length; i++) {
          p[i].polygon.extrudedHeight = 17; // or height property
        }
        viewer.dataSources.add(dataSource);
        viewer.zoomTo(dataSource);
      }
    );
  }

  render() {
    return (
      <div id="cesiumContainer" className="App">

      </div>
    );
  }
}

export default App;
