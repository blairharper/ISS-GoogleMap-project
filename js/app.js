// Global variables to allow updating of map elements
// by various parts of application.
var map;
var infoWindow;
var issLat;
var issLng;


// Model
var pointsOfInterest = [

    {
        name: "Uddingston",
        address: "G71 7FN",
        lat: 55.818376,
        lng: -4.075098
    },

    {
        name: "Wembley",
        address: "HA9 6DB",
        lat: 51.553591,
        lng: -0.288527
    },

    {
        name: "Taunton",
            address: "TA2 7SY",
        lat: 51.030710,
        lng: -3.109492
    },

    {
        name: "Westminster",
        address: "SW1A 2AA",
        lat: 51.503540,
        lng: -0.127695
    },

    {
        name: "Newcastle",
        address: "NE1 5DL",
        lat: 54.968291,
        lng: -1.616890

    },

]

var Place = function(data) {
    var self = this;
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
    this.lat = data.lat;
    this.lng = data.lng;
    this.LatLng = {lat: data.lat, lng: data.lng}

    // Get next ISS passing from open-notify API
    this.ISSdata = ko.observable(getISSdata(self));

    // Place marker on map at this location
    this.marker = new google.maps.Marker({
        position: this.LatLng,
        title: this.name(),
        map: map
    });
    this.marker.setMap(map);

}

var ISS = function() {
    var self = this;
    this.name = "ISS";
    this.LatLng = ko.observable(getISSloc(self));
    console.log(this.LatLng());
    this.marker = new google.maps.Marker({
        position: this.LatLng,
        title: this.name,
        map: map
    });
    this.marker.setMap(map);
}

var viewModel = function() {
    var self = this;
   
    this.placeList = ko.observableArray([]);
    // Create a new instance of Place for each location
    // and store in ko observableArray
    pointsOfInterest.forEach(function(placeItem){
        self.placeList.push( new Place(placeItem) );
    });
    
    this.placeList.push( new ISS() );
    this.currentPlace = ko.observable(this.placeList()[2]);

    // Add a listener to each marker that runs the
    // setPlace function when clicked.
    this.placeList().forEach(function(place) {
        place.marker.addListener('click', function() {
            self.setPlace(place);
        });
    
    });

    // Sets currentPlace to the clicked list item
    // or clicked marker and animates relevant marker
    this.setPlace = function(clickedPlace) {
        self.currentPlace(clickedPlace);
        animate(self.currentPlace().marker);
    };

}

// Initialises map and viewModel bindings
var viewMap = function() {

    this.LatLng = {lat: 51.5074, lng: 0.1278};
    map = new google.maps.Map(document.getElementById('map'), {
        center: this.LatLng,
        zoom: 6,
        mapTypeControl: false
    });

 ko.applyBindings(new viewModel());
}

// Make the marker bounce a couple of times
function animate(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1300);
    
    // Center the map position over the position of the clicked marker
    map.panTo(marker.getPosition());
}

function getISSloc(self) {
    var api = "http://api.open-notify.org/iss-now.json";
    var request = api + "?callback=?";
    var result;
    $.getJSON(request).done(function(data) {
        result = {
                    
                    lat: data.iss_position.latitude, 
                    lng: data.iss_position.longitude
                };
            
        self.LatLng(result);
        console.log(self.LatLng());
    });
     

}

// Use open notify API to get ISS crossing info
// Returns a date: Ddd mmm dd hh:mm:ss timezone
function getISSdata(self) {
    var api = "http://api.open-notify.org/iss-pass.json"; 
    // Need to add a callback to ? so that request is sent JSONP
    // otherwise browser security features will block the request

    var request = api + "?lat=" + self.lat + "&lon=" + self.lng + "&callback=?";
    var result;
     $.getJSON(request).done(function(data) {
        result = data.response[0].risetime;
        self.ISSdata(new Date(result*1000));
     });
}

