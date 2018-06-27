// Global variables to allow updating of map elements
// by various parts of application.
var map;
var infoContent;


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

var ISS = function(data) {
    var self = this;
    this.name = "ISS Current Location";
    this.ISSdata = data.ISSdata;
    this.marker = data.marker;
    this.infoWindow = data.infoWindow;
    
}

var viewModel = function() {
    var self = this;
    getISSloc(self);
    this.placeList = ko.observableArray([]);
    // Create a new instance of Place for each location
    // and store in ko observableArray
    pointsOfInterest.forEach(function(placeItem){
        self.placeList.push( new Place(placeItem) );
    });
    
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
        if (self.currentPlace().infoWindow) {
            self.currentPlace().infoWindow.close();
            self.currentPlace(clickedPlace);
            animate(self.currentPlace().marker);
            self.currentPlace().infoWindow.open(map, self.currentPlace().marker);
        } else {
            alert("Too fast! We're still loading data, please wait a second and try again.");
        }
    };

}

// Initialises map and viewModel bindings
var viewMap = function() {

    this.LatLng = {lat: 51.5074, lng: 0.1278};
    map = new google.maps.Map(document.getElementById('map'), {
        center: this.LatLng,
        title: "ISS Current Location",
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

// Use open notify API to get ISS crossing info 
// Returns a date: Ddd mmm dd hh:mm:ss timezone
// Also updates infowindow for relevant marker
function getISSdata(self) {
    var api = "http://api.open-notify.org/iss-pass.json"; 
    // Need to add a callback to ? so that request is sent JSONP
    // otherwise browser security features will block the request

    var request = api + "?lat=" + self.lat + "&lon=" + self.lng + "&callback=?";
    var result;
     $.getJSON(request).done(function(data) {
        result = new Date(data.response[0].risetime*1000);
            var contentString = '<div id="content">'+
            '<div id="siteNotice">'+
            '<h1 id=firstHeading" class="firstHeading">'+self.name()+'</h1>'+
            '<div id="bodyContent"'+
            '<p>Next ISS passing:<br>'+result+'</p>'+
            '<p> Attribution: <a href="http://open-notify.org">http://open-notify.org</a></p>'+
            '</div>'+
            '</div>';
        self.infoWindow = new google.maps.InfoWindow({
            content: contentString
        });            
        self.ISSdata(result);
     });
}

// Use open notify API to get current ISS location
// Creates a new instance of object ISS and adds to placeList
// Also adds map marker
function getISSloc(self) {
    var api = "http://api.open-notify.org/iss-now.json";
    // Need to add a callback to ? so that request is sent JSONP
    // otherwise browser security features will block the request
    var request = api + "?callback=?";
    // Load geocoder so we can reverse geocode the coordinates
    // and provide user-friendly place name instead of just coords.
    var geocoder = new google.maps.Geocoder;
    var iss, issLat, issLng, issTime, issLocation, contentString;

    // Send api request
    $.getJSON(request).done(function(data) {
        // Parse response and store in readable variables
        issLat = parseFloat(data.iss_position.latitude);
        issLng = parseFloat(data.iss_position.longitude);
        issLatLng = {lat: issLat, lng: issLng};
        issTime = new Date(data.timestamp*1000);
        
        // Initialise geocoder passing in lat + lng from API
        geocoder.geocode({'location' : issLatLng}, function(results, status) {
            if (status === 'OK') {
                // Proceed if all went OK.
                if(results[0]) {
                    // Proceed if geocoder could provide results for this location
                    // Store the address for passing to modelView later
                    issLocation = results[0].formatted_address;
                    // Populate infoWindow with results
                    contentString = '<div id="content">'+
                    '<div id="siteNotice">'+
                    '<h1 id=firstHeading" class="firstHeading">'+issLocation+'</h1>'+
                    '<div id="bodyContent"'+
                    '<h3> The ISS is currently passing over :</h3><br>'+issLocation+
                    '<p> Attribution: <a href="http://open-notify.org">http://open-notify.org</a></p>'+
                    '</div>'+
                    '</div>';
                    iss.infoWindow.setContent(contentString);
                } else {
                    // If no resulsts were available update infoWindow
                    contentString = 'No information available about this location.';
                    iss.infoWindow.setContent(contentString);
                }
            } else {
                // If an error occurred update infoWindow.
                // Sometimes the geocoder also provides this response if
                // no results were available but 'status' explains to user.
                contentString = 'Failed to retrieve information: ' + status;
                iss.infoWindow.setContent(contentString);
            }  
        });
        
        // Bundle our ISS data together
        iss = {
                ISSdata: issTime,
                address: issLocation,
                marker: new google.maps.Marker({
                            position: issLatLng,
                            title: "ISS",   
                            map: map
                        }),
                infoWindow: new google.maps.InfoWindow({
                            content: "TEST"
                        })
            
        };
        // Place marker for current ISS location on map
        iss.marker.setMap(map);

        // Push ISS data onto view model as an instance of ISS object
        self.placeList.push( new ISS(iss) );
    });

}


 