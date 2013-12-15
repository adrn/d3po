# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library

# Third-party
from flask import request, render_template, redirect, url_for

# Project
from . import app
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
    print(gist_number)
    return ""
