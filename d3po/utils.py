# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library
import os, sys
import re

__all__ = ['get_gist_number']

# stolen from iPython's nbviewer
GIST_RGX = re.compile(r'^([a-f0-9]+)/?$')
GIST_URL_RGX = re.compile(r'^https?://gist.github.com/(\w+/)?([a-f0-9]+)/?$')
def get_gist_number(value):
    """ Transform a given value (a gist URI) into an app URL """

    gist_n = GIST_RGX.match(value)
    if gist_n:
        return int(gist_n.groups()[0])

    gist_url = GIST_URL_RGX.match(value)
    if gist_url:
        return int(gist_url.group(2))

    raise ValueError("Invalid gist url or number.")