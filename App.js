/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */
import React, { Component } from "react";
import geolib from "geolib";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableHighlight
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import apiKey from "./google_api_key";
import _ from "lodash";
import PolyLine from "@mapbox/polyline";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {

      
      error: "",
      latitude:0,
      longitude:0,
      destination: "",
      predictions: [],
      pointCoords: [],



     markers: [{
      title: 'HITECH CITY',
      coordinates: {
        latitude: 17.4504,
        longitude: 78.3810,
      },
    },
    {
      title: 'CYBER TOWERS',
      coordinates: {
        latitude: 17.441551,
        longitude: 78.38264,
      },  
    }]






      
    };
    this.onChangeDestinationDebounced = _.debounce(
      this.onChangeDestination,
      1000
    );
  }

  componentDidMount() {
    //Get current location and set initial region to this
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

       this.getRouteDirections();
      },
      error => console.error(error),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 50000 }
    );
   
  }

  async getRouteDirections(destinationPlaceId, destinationName) {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${destinationPlaceId}&key=${apiKey}`);
      console.log(response);
      const json = await response.json();
      console.log(json);
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      console.log(points);
      const pointCoords = points.map(point => {
        var distanceinmeters = geolib.getDistance({
          latitude: point[0],
          longitude: point[1]
         }, {
             latitude: this.state.latitude,
             longitude: this.state.longitude
         });
         const distanceinkm = geolib.convertUnit('km',distanceinmeters , 2) + "km away from you";
         this.setState({distanceinkm});
       //  alert(distanceinkm);
        return { latitude: point[0], longitude: point[1] };
      }); 
    
      this.setState({
        pointCoords,
        predictions: [],
        destination: destinationName
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoords);
 
        
      
     
   
  
    } catch (error) {
      console.error(error);
    }
  }

  async onChangeDestination(destination) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}&input=${destination}&location=${this.state.latitude},${this.state.longitude}&radius=2000`;
    console.log(apiUrl);
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions: json.predictions
      });
      console.log(json);
    } catch (err) {
      console.error(err);
    }
  }



  render() {
    let marker = null;

    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
          
        />
      );
    }

    const predictions = this.state.predictions.map(prediction => (
      <TouchableHighlight
        onPress={() =>
          this.getRouteDirections(
            prediction.place_id,
            prediction.structured_formatting.main_text
          )
        }
        key={prediction.id}
      >

        <View>
          <Text style={styles.suggestions}>
            {prediction.structured_formatting.main_text}
          </Text>
        </View>
      </TouchableHighlight>
    ));

    return (
      <View style={styles.container}>
        <MapView
          ref={map => {
            this.map = map;
          }}  
          style={styles.map}
          region={{
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121
          }}
          showsUserLocation={true}


          
        >
        
          <Polyline
            coordinates={this.state.pointCoords}
            strokeWidth={4}
            strokeColor="blue"
          />

          
          {marker}

          {this.state.markers.map(marker => (
    <MapView.Marker 
      coordinate={marker.coordinates}
      title={marker.title}
    />
  ))}
      
          
        </MapView>
        <TextInput
          placeholder="Enter destination..."
          style={styles.destinationInput}
          value={this.state.destination}
          clearButtonMode="always"
          onChangeText={destination => {
            console.log(destination);
            this.setState({ destination });
            this.onChangeDestinationDebounced(destination);
          }
        }

        />
        {predictions}
        <View style={styles.BottomInput}>
    <Text style = {{textAlign: "center",}}>{this.state.distanceinkm}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  BottomInput: {
   
  

    height:50,
    position: 'absolute',
     left: 0, 
     right: 0, 
     bottom: 0,
    backgroundColor: "white"
  },

  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "white"
  },
  container: {
    ...StyleSheet.absoluteFillObject
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});