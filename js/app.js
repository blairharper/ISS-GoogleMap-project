// Global variable that is set to true if error with google maps API
// when true will prevent application attempting to update map elements
var nomap = false;


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

    // Place marker on map at this location but keep it invisible for now
    if (!nomap) {
        this.marker = new google.maps.Marker({
            position: this.LatLng,
            title: this.name(),
            map: map,
            visible: false
        });

        this.marker.setMap(map);
    }

}


var ISS = function(data) {
    var self = this;
    this.name = ko.observable("ISS Current Location");
    this.address = ko.observable(data.address);
    this.ISSdata = data.ISSdata;
    if(!nomap) {
    this.marker = data.marker;
    this.infoWindow = data.infoWindow;
    }

}


var viewModel = function() {
    var self = this;
    var geocoder = new google.maps.Geocoder();

    this.placeList = ko.observableArray([]);
    // Create a new instance of Place for each location
    // and store in ko observableArray
    pointsOfInterest.forEach(function(placeItem){
        self.placeList.push( new Place(placeItem) );
    });


    // Call function to pull ISS current loc data from API
    // will also push this data into our ko obsvArr
    getISSloc(self);

    this.currentPlace = ko.observable(this.placeList()[2]);

    // Add a listener to each marker that runs the
    // setPlace function when clicked.
    if (!nomap) {
        this.placeList().forEach(function(place) {
            place.marker.addListener('click', function() {
                self.setPlace(place);
            });

        });
        document.getElementById('submit').addEventListener('click', function() {
             geocodeAddress(geocoder, map, self);
        });
    }
    // Filter handler
    self.searchPlaces = ko.observable('');
    self.filteredPlaces = ko.computed(function () {
        return ko.utils.arrayFilter(self.placeList(), function (key) {
            var results = (self.searchPlaces().length == 0 || key.name().toLowerCase().indexOf(self.searchPlaces().toLowerCase()) > -1);
            // Make the markers visible for all filteredRecords that are returned
            if (!nomap) {
                key.marker.setVisible(results);

                }
            return results;
        });
    });
    // Sets currentPlace to the clicked item
    // Animates relevant marker and loads window box
    this.setPlace = function(clickedPlace, currentPlace) {
       setCurrentPlace(clickedPlace, self.currentPlace);
    }

}


// Initialises map and viewModel bindings
var viewMap = function() {
    this.googleError = ko.observable(false);
    this.LatLng = {lat: 51.5074, lng: 0.1278};
 
    map = new google.maps.Map(document.getElementById('map'), {
        center: this.LatLng,
        title: "ISS Current Location",
        zoom: 6,
        mapTypeControl: false
    });

   ko.applyBindings(new viewModel());
}

// Called if there is an error reaching google maps API
var mapError = function() {
    // Set global variable to true to prevent app attempting
    // to update map elements
    // TODO: Create helper methods to update map elements
    //       so that don't have to use if(!nomap) throughout code
    nomap = true;

    // Renders error message on page
    this.googleError = ko.observable(true);

    ko.applyBindings(new viewModel());
}

// Set current place

function setCurrentPlace(clickedPlace, currentPlace) {

    if (currentPlace().infoWindow) {
        // Close any open window boxes
        currentPlace().infoWindow.close()
    }
    // Set currentPlace and animate marker
    currentPlace(clickedPlace);
    animate(currentPlace().marker);

    // Open relevant window box
    if (currentPlace().infoWindow) {
        currentPlace().infoWindow.open(map, currentPlace().marker);
    } else {
        getISSdata(currentPlace(), 1);
    }
}


function geocodeAddress(geocoder, resultsMap, self) {
var address = document.getElementById('address').value;
geocoder.geocode({'address': address}, function(results, status) {
  if (status === 'OK') {
    resultsMap.setCenter(results[0].geometry.location);

    resultData = {
        name: results[0].formatted_address,
        address: results[0].formatted_address,
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng()
    }
    self.placeList.push( new Place(resultData) );

    var getPos = self.placeList().length - 1;
    setCurrentPlace(self.placeList()[getPos], self.currentPlace);
    self.placeList()[getPos].marker.addListener('click', function() {
        self.setPlace(place);
        });

  } else {
    alert('Geocode was not successful for the following reason: ' + status);
  }
});
}

// Make the marker bounce a couple of times
function animate(marker) {
    if(!nomap) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 1300);

        // Center the map position over the position of the clicked marker
        map.panTo(marker.getPosition());
    }
}

// Use open notify API to get ISS crossing info
// Returns a date: Ddd mmm dd hh:mm:ss timezone
// Also updates infowindow for relevant marker
function getISSdata(self, open=0) {

    var api = "http://api.open-notify.org/iss-pass.json";
    // Need to add a callback to ? so that request is sent JSONP
    // otherwise browser security features will block the request
    var request = api + "?lat=" + self.lat + "&lon=" + self.lng + "&callback=?";
    var result;
     $.getJSON(request).done(function(data) {
        result = new Date(data.response[0].risetime*1000);
            var contentString = '<div id="content">'+
            '<div id="siteNotice">'+
            '<h2 id=firstHeading" class="firstHeading">'+self.name()+'</h2>'+
            '<div id="bodyContent"'+
            '<p>Next ISS passing:<br>'+result+'</p>'+
            '</div>'+
            '</div>';
        if(!nomap) { self.infoWindow = new google.maps.InfoWindow({
            content: contentString
        })};
        self.ISSdata(result);
        if (open == 1) {
            self.infoWindow.open(map, self.marker);
        }
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
                    if(!nomap) { contentString = '<div id="content">'+
                        '<div id="siteNotice">'+
                        '<h2 id=firstHeading" class="firstHeading">'+issLocation+'</h2>'+
                        '<div id="bodyContent"'+
                        '<h3> The ISS is currently passing over :</h3><br>'+issLocation+
                        '<p> Attribution: <a href="http://open-notify.org">http://open-notify.org</a></p>'+
                        '</div>'+
                        '</div>'
                    } else {
                        // if nomap is true then we just want the plain text location
                        // since it will just be rendered on page and not in infowindow
                        contentString = issLocation;
                    }
                } else {
                    // If no results were available update infoWindow
                    issLocation = 'No information available about this location.';
                    contentString = issLocation;
                }
                } else {
                if (status === 'ZERO_RESULTS') {
                    issLocation = 'No land data, probably over the sea.'
                    contentString = issLocation;
                } else {
                    issLocation = 'An error occurred: ' + status
                    contentString = issLocation;
                }
            if(!nomap){iss.infoWindow.setContent(contentString)};
            }
        // Set info window content and update address

        self.placeList()[5].address(issLocation);
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
                infoWindow: new google.maps.InfoWindow({})

        };
        // Place marker for current ISS location on map

        if(!nomap) {iss.marker.setMap(map);}
        // Push ISS data onto view model as an instance of ISS object
        self.placeList.push( new ISS(iss) );
    });

}
