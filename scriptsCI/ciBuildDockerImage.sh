#!/bin/bash

set -o xtrace
set -o errexit

echo "************************************** Build war ******************************************"

file='./ci/version'
VERSION_NUMBER=$(<"$file")
file='./ci/url'
CORE_URL=$(<"$file")

docker build --rm -f scriptsCI/docker/core/Dockerfile --build-arg CORE_URL=$CORE_URL -t  cytomine/core:$VERSION_NUMBER ./scriptsCI/docker/core

docker push cytomine/core:$VERSION_NUMBER

docker rmi cytomine/core:$VERSION_NUMBER