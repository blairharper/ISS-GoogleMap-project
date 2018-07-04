from ask_sdk_core.utils import is_request_type
from ask_sdk_model.ui import SimpleCard
from ask_sdk_core.utils import is_intent_name
from ask_sdk_core.skill_builder import CustomSkillBuilder
from ask_sdk_core.api_client import DefaultApiClient
# from ask_sdk_core.dispatch_components import AbstractRequestHandler
# from ask_sdk_core.dispatch_components import AbstractExceptionHandler
from ask_sdk_model.ui import AskForPermissionsConsentCard
from ask_sdk_model.services import ServiceException
import json
from urllib.request import urlopen
from urllib.parse import quote
from time import localtime, strftime

sb = CustomSkillBuilder(api_client=DefaultApiClient())

LAUNCH = ("Welcome to the International Space Station, "
          "you can ask when I'll next be near.")
NOTIFY_MISSING_PERMISSIONS = ("Please enable Location permissions in "
                              "the Amazon Alexa app.")
NO_ADDRESS = ("It looks like you don't have an address set. "
              "You can set your address from the companion app.")
ADDRESS_AVAILABLE = "{}, is when the space station will next be over {}."
ERROR = "Uh Oh. Looks like something went wrong."
LOCATION_FAILURE = ("There was an error with the Device Address API. "
                    "Please try again.")
GOODBYE = "To infinite and beyond! Bye!"
UNHANDLED = "Oopsie woopsie, this skill doesn't support that."

# ////// Begin Alexa handler boilerplate ////////

permissions = ["read::alexa:device:all:address"]


@sb.request_handler(can_handle_func=is_request_type("LaunchRequest"))
def launch_request_handler(handler_input):

    handler_input.response_builder.speak(LAUNCH).set_card(
        SimpleCard("Space Station", LAUNCH)).set_should_end_session(
        False)
    return handler_input.response_builder.response


# Request handler to say when the ISS will next be overhead the
# alexa device location
@sb.request_handler(can_handle_func=is_intent_name("OverheadIntent"))
def space_station_intent_handler(handler_input):
    req_envelope = handler_input.request_envelope
    response_builder = handler_input.response_builder
    service_client_fact = handler_input.service_client_factory

    if not (req_envelope.context.system.user.permissions and
            req_envelope.context.system.user.permissions.consent_token):
        response_builder.speak(NOTIFY_MISSING_PERMISSIONS)
        response_builder.set_card(AskForPermissionsConsentCard(
            permissions=permissions))
        return response_builder.response

    try:
        device_id = req_envelope.context.system.device.device_id
        device_addr_client = service_client_fact.get_device_address_service()
        addr = device_addr_client.get_full_address(device_id)

# Make sure we have some piece of address information before continuing
        if (addr.address_line1 is None and addr.state_or_region is None and addr.postal_code is None):
            response_builder.speak(NO_ADDRESS)
        else:
                # TODO: Move this else: into a helper function
                # Concat address components and pass to quote() to conver to URL safe string
                location = addr.address_line1 + " " + addr.state_or_region + " " + addr.postal_code
                locationURL = quote(location)
                # Form our request URL for google geo-code api to get coordinates
                base = "https://maps.googleapis.com/maps/api/geocode/json?"
                params = "address={address}&key={key}".format(
                    address=locationURL,
                    key="AIzaSyCVmqqeNXsmM3JKHW_-XGUq1MeUc9MQSeU")
                url = "{base}{params}".format(base=base, params=params)
                response = web_service_interface(url)
                # Save the formatted address from google for alexa to read out later
                location = response['results'][0]['formatted_address']
                # Pass coordinates to open-notify.org API to find out when ISS will next pass
                lat = response['results'][0]['geometry']['location']['lat']
                lon = response['results'][0]['geometry']['location']['lng']
                result = web_service_interface('http://api.open-notify.org/iss-pass.json', lat, lon)
                # Convert timestamp to UTC and format in full date form so alexa reads clearly
                over = localtime(result['response'][1]['risetime'])
                over = strftime("%A %d %B %H:%M %Z", over)
                response_builder.speak(ADDRESS_AVAILABLE.format(
                    over, location))
        return response_builder.response

    except ServiceException:
        response_builder.speak(ERROR)
        return response_builder.response
    except Exception as e:
        raise e

    # handler_input.response_builder.speak(speech_text).set_card(
    #     SimpleCard("Space Station", speech_text)).set_should_end_session(
    #     True)
    # return handler_input.response_builder.response


@sb.request_handler(can_handle_func=is_intent_name("CurrentLocationIntent"))
def space_station_location_handler(handler_input):
    speech_text = iss_location()

    handler_input.response_builder.speak(speech_text).set_card(
        SimpleCard("Space Station", speech_text)).set_should_end_session(
        True)
    return handler_input.response_builder.response


@sb.request_handler(can_handle_func=is_intent_name("AMAZON.HelpIntent"))
def help_intent_handler(handler_input):
    speech_text = "You can ask me when the space station will be overhead."

    handler_input.response_builder.speak(speech_text).ask(speech_text).set_card(
        SimpleCard("Space Station", speech_text))
    return handler_input.response_builder.response


@sb.request_handler(
    can_handle_func=lambda input:
        is_intent_name("AMAZON.CancelIntent")(input) or
        is_intent_name("AMAZON.StopIntent")(input))
def cancel_and_stop_intent_handler(handler_input):
    speech_text = "Goodbye!"

    handler_input.response_builder.speak(speech_text).set_card(
        SimpleCard("Space Station", speech_text))
    return handler_input.response_builder.response


@sb.request_handler(can_handle_func=is_request_type("SessionEndedRequest"))
def session_ended_request_handler(handler_input):
    # any cleanup logic goes here

    return handler_input.response_builder.response


@sb.exception_handler(can_handle_func=lambda i, e: True)
def all_exception_handler(handler_input, exception):
    # Log the exception in CloudWatch Logs
    print(exception)

    speech = "Oopsie woopsie! I'm having trouble reaching the space station. "
    handler_input.response_builder.speak(speech).ask(speech)
    return handler_input.response_builder.response


handler = sb.lambda_handler()


# ////// End handler boilerplate //////


# ////// Begin app logic //////


# Interface to pull results from web api
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
    # latitude = 51.0305632
    # longitude = -3.1091860000000224

    base = "https://maps.googleapis.com/maps/api/geocode/json?"
    params = "latlng={lat},{lng}&key=AIzaSyCVmqqeNXsmM3JKHW_-XGUq1MeUc9MQSeU".format(
        lat=latitude,
        lng=longitude)
    url = "{base}{params}".format(base=base, params=params)
    response = web_service_interface(url)
    try:
        if (response['status'] == "ZERO_RESULTS"):
            speech_text = "The space station is currently over the sea, I can only tell you when its above land."

        if (response['status'] == "OK"):
            r = str(response['results'][0]['formatted_address'])
            speech_text = "The space station is over: %s" % r
    except:
        speech_text = "Sorry there was a problem: %s" % response['status']

    return speech_text
