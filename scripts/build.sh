#!/bin/bash

rm -rf build/* dist/*

mkdir -p build
cp -r lib templates build
cp package.json package-lock.json build
npm ci --omit dev --prefix build --quiet --ignore-scripts true


mkdir -p dist
PACKAGE_NAME=$(npm pkg get name version | jq -r ".name + \"-\" + .version")
cd build
zip -r "../dist/$PACKAGE_NAME.zip" .
