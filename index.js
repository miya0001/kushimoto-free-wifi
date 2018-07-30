#!/usr/bin/env node

const http = require('https');
const mkdirp = require('mkdirp');
const fs = require('fs');

const json = 'https://raw.githubusercontent.com/wakayama-pref-org/wakayama_free_wi-fi/master/json/WAKAYAMAFREEWi-Fi.json';
const yahoo = `https://map.yahooapis.jp/geocode/V1/geoCoder?appid=${process.env.YAHOO_APP_ID}&output=json`;
console.log(yahoo)
const validateStr = ( str ) => {
    str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    str = str.replace( '－', '-' );
    str = str.replace( '　', ' ' );

    return str.trim();
}

mkdirp('api/v1', err => {
    if (err) console.log(err)
})

const api = JSON.parse(fs.readFileSync('api/v1/api.json', {
    encoding: 'utf-8'
}));

http.get(json, (res) => {
    let body = '';
    res.setEncoding('utf8');
  
    res.on('data', (chunk) => {
        body += chunk;
    });
  
    res.on('end', (res) => {
        res = JSON.parse(body);
        res.forEach(element => {
            if (0 <= element[2].indexOf('東牟婁郡串本町')) {
                const name = validateStr( element[1] );
                const address = validateStr( element[2] ) + validateStr( element[3] );
                http.get(`${yahoo}&query=${encodeURIComponent(address)}`, (res) => {
                    let body = '';
                    res.setEncoding('utf8');
                  
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                  
                    res.on('end', (res) => {
                        var lat = '';
                        var lng = '';
                        res = JSON.parse(body);
                        if (res.ResultInfo.Count) {
                            latlng = res.Feature[0].Geometry.Coordinates.split(',');
                            lat = latlng[0];
                            lng = latlng[1];
                            api[name] = {
                                address: res.Feature[0].Property.Address,
                                lat: lat,
                                lng: lng
                            };
                        } else if (!api[name]) {
                            api[name] = {
                                address: address,
                                lat: "",
                                lng: ""
                            };
                        }

                        fs.writeFile(
                            `api/v1/api.json`,
                            JSON.stringify(api),
                            err => {
                              if (err) throw err
                            }
                        )
                    });
                }).on('error', (e) => {
                    console.log(e.message);
                });
            }
        });
    });
  }).on('error', (e) => {
    console.log(e.message);
  });