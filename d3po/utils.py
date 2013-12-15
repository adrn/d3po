# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library
import os, sys
import re

# Third party
import requests

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

class GithubClient(object):
    github_api_url = 'https://api.github.com'

    def __init__(self):
        pass

    def authenticate(self):
        auth = {'client_id': os.environ.get('GITHUB_OAUTH_KEY', ''),
                'client_secret': os.environ.get('GITHUB_OAUTH_SECRET', ''),
                'token' : os.environ.get('GITHUB_API_TOKEN', '')}
        self.auth = {k:v for k,v in auth.items() if v}

    def github_api_request(self, path, params=None):
        """ Make a GitHub API request to URL

            URL is constructed from url and params, if specified.
        """

        url = "{}/{}".format(self.github_api_url, path)

        params = {} if params is None else params
        params.setdefault('user_agent', 'GitHub-Client')

        if self.auth:
            params.update(self.auth)

        return requests.get(url, params=params)

    def get_gist(self, gist_id):
        """ Get a gist """

        path = u'gists/{}'.format(gist_id)
        return self.github_api_request(path)