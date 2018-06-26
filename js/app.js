// Global variables to allow updating of map elements
// by various parts of application.
var map;
var infoWindow;

// Model
var pointsOfInterest = [

    {
        name: "Uddingston",
        address: "G71 7FN",
        lat: 55.818376,
        long: -4.075098
    },

    {
        name: "Wembley",
        address: "HA9 6DB",
        lat: 51.553591,
        long: -0.288527
    },

    {
        name: "Taunton",
            address: "TA2 7SY",
        lat: 51.030710,
        long: -3.109492
    },

    {
        name: "Westminster",
        address: "SW1A 2AA",
        lat: 51.503540,
        long: -0.127695
    },

    {
        name: "Newcastle",
        address: "NE1 5DL",
        lat: 54.968291,
        long: -1.616890

    }

]

var Place = function(data) {
    var self = this;
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
    this.lat = data.lat;
    this.long = data.long;
    this.LatLng = {lat: data.lat, lng: data.long}
    this.ISSdata = ko.observable();
    /* Need to get this working in separate function */
    var request = "http://api.open-notify.org/iss-pass.json?lat=" + this.lat + "&lon=" + this.long + "&callback=?";
    var result;
    console.log(request);
     $.getJSON(request).done(function(data) {
        result = data.response[0].risetime;
        self.ISSdata(new Date(result*1000));
     });
     /* end function */

    this.marker = new google.maps.Marker({
        position: this.LatLng,
        title: this.name(),
        map: map
    });
    this.marker.setMap(map);

    this.marker.addListener('click', function() {
    //TODO: add code here for info window
        animate(self.marker);    
    });


}

// View

var viewModel = function() {
    var self = this;
    
    this.placeList = ko.observableArray([]);

    pointsOfInterest.forEach(function(placeItem){
        self.placeList.push( new Place(placeItem) );
    });

    this.currentPlace = ko.observable(this.placeList()[0]);

    this.setPlace = function(clickedPlace) {
        self.currentPlace(clickedPlace);
        animate(self.currentPlace().marker);
    };

}

var viewMap = function() {
    this.LatLng = {lat: 51.5074, lng: 0.1278};
    map = new google.maps.Map(document.getElementById('map'), {
        center: this.LatLng,
        zoom: 6,
        mapTypeControl: false
    });

ko.applyBindings(new viewModel());
}

function animate(marker) {
    // Make the marker bounce a couple of times when clicked
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1300);
    
    // Center the map position over the position of the clicked marker
    map.panTo(marker.getPosition());
}
