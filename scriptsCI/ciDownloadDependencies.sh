#!/bin/bash

set -o xtrace
set -o errexit

echo "************************************** Download dependencies ******************************************"

file='./ci/version'
VERSION_NUMBER=$(<"$file")

echo "Download dependencies for $VERSION_NUMBER"

docker build --rm -f scriptsCI/docker/Dockerfile-download-dependencies.build -t cytomine/cytomine-core-download-dependencies .

containerDownloadDependenciesId=$(docker create cytomine/cytomine-core-download-dependencies)

docker rm $containerDownloadDependenciesId