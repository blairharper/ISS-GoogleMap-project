import json
from urllib.request import urlopen
from urllib.parse import quote
from time import localtime, strftime


def web_service_interface(url, lat=0, lon=0):
    # Check if coordinates have been supplied
    # If so it means function has been called by iss_overhead function
    # and we want to parse coordinates onto the URL
    if ((lat > 0) or (lat < 0)) and ((lon > 0) or (lon < 0)):
        url = url + '?lat=' + str(lat) + '&lon=' + str(lon)

    response = urlopen(url)
    result = json.loads(response.read())
    return result


def iss_location():
    # Call web service to obtain details of ISS location
    result = web_service_interface('http://api.open-notify.org/iss-now.json')
    # Store response in variables - turtle requires float for x,y coords
    location = result['iss_position']
    latitude = float(location['latitude'])
    longitude = float(location['longitude'])

    base = "https://maps.googleapis.com/maps/api/geocode/json?"
    params = "latlng={lat},{lng}&key=AIzaSyCVmqqeNXsmM3JKHW_-XGUq1MeUc9MQSeU".format(
        lat=latitude,
        lng=longitude)
    url = "{base}{params}".format(base=base, params=params)
    response = web_service_interface(url)
    try:
        if (response['status'] == "ZERO_RESULTS"):
            speech_text = "No land data available, the space station is probably over the sea."

        if (response['status'] == "OK"):
            r = str(response['results'][0]['formatted_address'])
            speech_text = "The space station is over: %s" % r
    except:
        speech_text = "Sorry there was a problem: %s" % response['status']
    return speech_text


def iss_overhead():
    address_line1 = "73 Avonside Drive"
    state_or_region = "Falkirk"
    postal_code = "FK6 6QF"
    location = address_line1 + " " + state_or_region + " " + postal_code
    location = quote(location)
    base = "https://maps.googleapis.com/maps/api/geocode/json?"
    params = "address={address}&key={key}".format(
        address=location,
        key="AIzaSyCVmqqeNXsmM3JKHW_-XGUq1MeUc9MQSeU")
    url = "{base}{params}".format(base=base, params=params)

    response = web_service_interface(url)
    lat = response['results'][0]['geometry']['location']['lat']
    lon = response['results'][0]['geometry']['location']['lng']
    result = web_service_interface('http://api.open-notify.org/iss-pass.json', lat, lon)
    # Convert timestamp to readable time and print onto map at the marker location
    over = localtime(result['response'][1]['risetime'])
    over = strftime("%A %d %B %H:%M %Z", over)
    print(response['results'][0]['formatted_address'])


iss_overhead()
