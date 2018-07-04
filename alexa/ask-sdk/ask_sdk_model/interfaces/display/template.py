# coding: utf-8

#
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file
# except in compliance with the License. A copy of the License is located at
#
# http://aws.amazon.com/apache2.0/
#
# or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for
# the specific language governing permissions and limitations under the License.
#

import pprint
import re  # noqa: F401
import six
import typing
from enum import Enum
from abc import ABCMeta, abstractmethod


if typing.TYPE_CHECKING:
    from typing import Dict, List, Optional
    from datetime import datetime
    from ask_sdk_model.interfaces.display.back_button_behavior import BackButtonBehavior


class Template(object):
    """
    NOTE: This class is auto generated.
    Do not edit the class manually.

    :type object_type: (optional) str
    :type token: (optional) str
    :type back_button: (optional) ask_sdk_model.interfaces.display.back_button_behavior.BackButtonBehavior
    """
    deserialized_types = {
        'object_type': 'str',
        'token': 'str',
        'back_button': 'ask_sdk_model.interfaces.display.back_button_behavior.BackButtonBehavior'
    }

    attribute_map = {
        'object_type': 'type',
        'token': 'token',
        'back_button': 'backButton'
    }

    discriminator_value_class_map = {
        'ListTemplate2': 'ask_sdk_model.interfaces.display.list_template2.ListTemplate2',  # noqa: E501
        'ListTemplate1': 'ask_sdk_model.interfaces.display.list_template1.ListTemplate1',  # noqa: E501
        'BodyTemplate7': 'ask_sdk_model.interfaces.display.body_template7.BodyTemplate7',  # noqa: E501
        'BodyTemplate6': 'ask_sdk_model.interfaces.display.body_template6.BodyTemplate6',  # noqa: E501
        'BodyTemplate3': 'ask_sdk_model.interfaces.display.body_template3.BodyTemplate3',  # noqa: E501
        'BodyTemplate2': 'ask_sdk_model.interfaces.display.body_template2.BodyTemplate2',  # noqa: E501
        'BodyTemplate1': 'ask_sdk_model.interfaces.display.body_template1.BodyTemplate1'
    }

    json_discriminator_key = "type"

    __metaclass__ = ABCMeta

    @abstractmethod
    def __init__(self, object_type=None, token=None, back_button=None):  # noqa: E501
        # type: (Optional[str], Optional[str], Optional[BackButtonBehavior]) -> None
        """

        :type object_type: (optional) str
        :type token: (optional) str
        :type back_button: (optional) ask_sdk_model.interfaces.display.back_button_behavior.BackButtonBehavior
        """
        self.__discriminator_value = None

        self.object_type = object_type
        self.token = token
        self.back_button = back_button

    @classmethod
    def get_real_child_model(cls, data):
        # type: (Dict[str, str]) -> str
        """Returns the real base class specified by the discriminator"""
        discriminator_value = data[cls.json_discriminator_key]
        return cls.discriminator_value_class_map.get(discriminator_value)

    def to_dict(self):
        # type: () -> Dict[str, object]
        """Returns the model properties as a dict"""
        result = {}

        for attr, _ in six.iteritems(self.deserialized_types):
            value = getattr(self, attr)
            if isinstance(value, list):
                result[attr] = list(map(
                    lambda x: x.to_dict() if hasattr(x, "to_dict") else
                    x.value if isinstance(x, Enum) else x,
                    value
                ))
            elif isinstance(value, Enum):
                result[attr] = value.value
            elif hasattr(value, "to_dict"):
                result[attr] = value.to_dict()
            elif isinstance(value, dict):
                result[attr] = dict(map(
                    lambda item: (item[0], item[1].to_dict())
                    if hasattr(item[1], "to_dict") else
                    (item[0], item[1].value)
                    if isinstance(item[1], Enum) else item,
                    value.items()
                ))
            else:
                result[attr] = value

        return result

    def to_str(self):
        # type: () -> str
        """Returns the string representation of the model"""
        return pprint.pformat(self.to_dict())

    def __repr__(self):
        # type: () -> str
        """For `print` and `pprint`"""
        return self.to_str()

    def __eq__(self, other):
        # type: (object) -> bool
        """Returns true if both objects are equal"""
        if not isinstance(other, Template):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        # type: (object) -> bool
        """Returns true if both objects are not equal"""
        return not self == other
