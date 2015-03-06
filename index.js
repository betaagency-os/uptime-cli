#!/usr/bin/env node
var untildify = require('untildify');
var request = require('request');

var config = require(untildify('~/.monitor.json'));
var _ = require('underscore');

var cfg = config[0];
var argv = process.argv.slice(2);

function next(err){
  console.error(err);
  process.exit(0);
}
function normalize(itm){
  if(!itm.match(/^https?:/)){
    return 'http://'+itm;
  }
  return itm;
}
request(cfg.address+'/api/checks', {auth: {user: cfg.login, pass: cfg.password}}, function(err,req,body){
  if(err){
    return next(err);
  }
  var url = normalize(argv[0]);

  var checks = JSON.parse(body);
  var itm = _.find(checks, function(itm){
    return itm.url === url;
  });
  if(itm){
    console.log('Такой домен уже существует');
    process.exit(0);
  }
  request(cfg.address+'/api/checks', {
    method: "PUT",
    json: {
      "name": url,
      "type": "http",
      "url": url,
      "alertTreshold": 5,
      "interval": 60
    },
    auth: {
      user: cfg.login,
      pass: cfg.password
    }
  }, function(err,req,body){
    if(err){
      return next(err);
    }
    var id = body._id;
    request(cfg.address+'/api/checks/'+id+'/force', {
      method: "post",
      json: {
        "pollerParams": {
            "match": argv[1]
        }
      },
      auth: {
        user: cfg.login,
        pass: cfg.password
      }
    }, function(err,req,body){ // jshint ignore:line
      if(err){
        return next(err);
      }
      console.log('Запись создана: http://munin.betaagency.ru:8082/dashboard/checks/'+id);
    });
  });
});
