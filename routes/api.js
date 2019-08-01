/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const stockFunctions = require('../handlers/stockHandler.js');

const expect = require('chai').expect;
const MongoClient = require('mongodb');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      if(req.query.ticker.length == 0){
        return res.json('Please include a stock ticker before submitting the form');
      } else if(Array.isArray(req.query.ticker) && req.query.ticker[0].length == 0 && req.query.ticker[1].length == 0){
        return res.json('Please include a two ticker symbols before submitting the form');
      } else if(Array.isArray(req.query.ticker) && req.query.ticker[0].length == 0){
        return res.json('Please include a first stock ticker symbol before submitting the form'); 
      } else if(Array.isArray(req.query.ticker) && req.query.ticker[1].length == 0){
        return res.json('Please include a second stock ticker before submitting the form');
      };
    
      let tickers = [];
    if(Array.isArray(req.query.ticker)){
      req.query.ticker.forEach(e => tickers.push(e.toUpperCase()));
    } else{
      tickers.push(req.query.ticker.toUpperCase());
    };
    
    let likeBoolean = Boolean(req.query.like) || false;
    
    let ipAddress = req.headers["x-forwarded-for"].substring(0, req.headers["x-forwarded-for"].indexOf(","));
    
    let stockData = {};
    let priceData = {};
    let likeData = {};
    let rel_likeData = {};
    
    const responseGenerator = function(data){
      if("Error" in data) return res.json(data.Error);
      if("price" in data){
        for (let key in data){
          priceData[data.ticker] = data.price;  
        } 
      } else if("likes" in data){
        for (let e in data){
          likeData[data.ticker] = data.likes;
        };
      };
      
      if(tickers.length == 2 && Object.keys(likeData).length == 2){
        for (let stock in likeData){
          let otherStock = tickers.filter(e => e != stock);
          rel_likeData[stock] = likeData[stock] - likeData[otherStock];
        };
      };
      
      if(tickers.length == 1 && Object.keys(priceData).length != 0 && Object.keys(likeData).length != 0){
        stockData = data.ticker;
        stockData.price = priceData[data.ticker];
        stockData.likes = likeData[data.ticker];
        return res.json({stockData});
      } else if(tickers.length == 2 && Object.keys(priceData).length == 2 && Object.keys(rel_likeData).length == 2){
        stockData = [];
        for (let i = 0; i < tickers.length; i++){
          stockData.push({
            stock: tickers[i],
            price: priceData[tickers[i]],
            rel_likes: rel_likeData[tickers[i]]
          });
        };
        return res.json({stockData});
      }
    };
    
    if(tickers.length == 1){
      stockFunctions.getStockData(tickers[0], responseGenerator);
      stockFunctions.getLikeData(tickers[0], ipAddress, likeBoolean, responseGenerator);
    } else {
      stockFunctions.getStockData(tickers[0], responseGenerator);
      stockFunctions.getLikeData(tickers[0], ipAddress, likeBoolean, responseGenerator);
      stockFunctions.getStockData(tickers[1], responseGenerator);
      stockFunctions.getLikeData(tickers[1], ipAddress, likeBoolean, responseGenerator);
    }
  });
};
