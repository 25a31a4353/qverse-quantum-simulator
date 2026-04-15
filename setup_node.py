import urllib.request
import zipfile
import os

url = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"
print("Downloading node...")
urllib.request.urlretrieve(url, "node.zip")
print("Extracting...")
with zipfile.ZipFile("node.zip", "r") as zip_ref:
    zip_ref.extractall(".")
os.remove("node.zip")
print("Done")
