from flask import Flask
from .utils import GithubClient

app = Flask(__name__)
github_client = GithubClient()
github_client.authenticate()

import views