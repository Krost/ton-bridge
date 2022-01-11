#!/bin/bash

source=src/assets
build=temp/build
source_js=$source/js

vendor=$source/js/vendor
app=$source_js/app

mkdir -p temp/build/js

yes | cp -rf $source/css $build
yes | cp -rf $source/img $build
yes | cp -rf $source/fonts $build
yes | cp -rf $source/view.html $build

cat $vendor/vue-2.6.14.min.js $vendor/vue-router-3.5.3.min.js $vendor/vue-clipboard.min.js $vendor/namespace-1.0.3.min.js $vendor/tonweb-0.0.26.js $vendor/web3-1.3.5.min.js $vendor/ethers-5.0.umd.min.js > $build/js/vendor.js
cat $app/component/*.js $app/system/*.js $app/ton/*.js $app/view/*.js $app/view/page/*.js $app/*.js $source_js/@common.js $source_js/main.js > $build/js/app.js
uglifyjs -c -m -o $build/js/app.js $build/js/app.js

rm -rf www/assets
mv $build www/assets