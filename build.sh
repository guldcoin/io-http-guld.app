#!/bin/bash
ln -sf ~/ledger ledger
ln -sf ~/market market
ln -sf ~/keys keys
ln -sf ~/dotfiles/ dotfiles
rm js/decimal.min.js; cp -f ~/tech/js/node_modules/decimal.js/decimal.min.js js/decimal.min.js
rm js/qs-local-window.js; cp -f ~/tech/js/node_modules/qs-local-window/qs-local-window.js js/
rm js/error-display.js; cp -f ~/tech/js/node_modules/error-display/error-display.js js/
rm js/load-html-component.js; cp -f ~/tech/js/node_modules/load-html-component/load-html-component.js js/
rm js/ini.min.js; cp -f ~/tech/js/node_modules/git-config-ini/ini.min.js js/
rm js/ledger-types.min.js; cp -f ~/tech/js/node_modules/ledger-types/ledger-types.min.js js/
rm js/guld-ledger-transfer.min.js; cp -f ~/tech/js/node_modules/guld-ledger-transfer/guld-ledger-transfer.min.js js/
rm js/guld-ledger-register.min.js; cp -f ~/tech/js/node_modules/guld-ledger-register/guld-ledger-register.min.js js/
rm js/guld-ledger-grant.min.js; cp -f ~/tech/js/node_modules/guld-ledger-grant/guld-ledger-grant.min.js js/
rm js/jquery.min.js; cp -f ~/tech/js/node_modules/jquery/dist/jquery.min.js js/
rm js/bootstrap.bundle.min.js; cp -f ~/tech/js/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js js/
rm css/bootstrap.min.css; cp -f ~/tech/js/node_modules/bootswatch/dist/darkly/bootstrap.min.css css/
rm js/fontawesome-all.min.js; cp -f ~/tech/js/node_modules/fontawesome/svg-with-js/js/fontawesome-all.min.js js/
rm css/fa-svg-with-js.min.css; cp -f ~/tech/js/node_modules/fontawesome/svg-with-js/css/fa-svg-with-js.min.css css/

