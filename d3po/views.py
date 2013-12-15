# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library
import json

# Third-party
from flask import request, render_template, redirect, url_for

# Project
from . import app, github_client
from .utils import *

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create', methods=['POST'])
def create():
    gist_no = get_gist_number(request.form['gistOrUrl'])
    return redirect('/gist/{:d}'.format(gist_no))

@app.route('/gist/<int:gist_number>')
def gist(gist_number):
    resp = github_client.get_gist(gist_number)
    resp_json = json.loads(resp.text)

    for fname in resp_json['files'].keys():
        xx,ext = os.path.splitext(fname)
        content = resp_json['files'][fname]['content']

        if ext == ".csv":
            csv_data = content
        elif ext == ".json":
            json_states = content

    return ""
