# coding: utf-8
#-----------------------------------------------------------------------------
#  Copyright (C) 2013 D3PO
#
#  Distributed under the terms of the BSD License.  The full license is in
#  the file LICENSE.txt, distributed as part of this software.
#-----------------------------------------------------------------------------

from flask import Flask
from .utils import GithubClient

app = Flask(__name__)
github_client = GithubClient()
github_client.authenticate()

from . import views
