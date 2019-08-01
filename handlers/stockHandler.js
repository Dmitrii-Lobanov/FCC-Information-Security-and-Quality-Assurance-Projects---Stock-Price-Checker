const MongoClient = require('mongodb').MongoClient;
const request = require('request');

exports.getStockData = function(ticker, callback){
  let url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&apikey=' + process.env.ALPHA_VANTAGE_API_KEY + '&interval=1min&symbol' + ticker;
  
  request.get(url, (err, res, body) =>{
    if(err) return console.log('Error while getting stock information from Alpha Vantage', err);
    let data = JSON.parse(body)["Time Series (1min)"];
    
    if(data == undefined){
      return callback({'Error': 'There was a problem retrieving data for the ticker symbol' + ticker});
    };
    
    let tickerPrice = parseFloat(data[Object.keys(data)[0]]["4. close"]);
    
    callback({
      'ticker': ticker,
      'price': tickerPrice.toFixed(2)
    });
  });
};

exports.getLikeData = function(ticker, reqIpAddress, likes, callback){
  let ipAddressToAdd;
  (likes == true) ? (ipAddressToAdd = reqIpAddress) : (ipAddressToAdd = 'dummy IP address')
  
  MongoClient.connect(process.env.DB, {useNewUrlParser: true}, (err, database) =>{
    if(err) return console.log('Error connecting to db', err);
    database.db('test').collection("stock-price-checker").findOneAndUpdate(
      {ticker: ticker},
      {$addToSet: {ipAddresses: ipAddressToAdd}},
      {
        upsert: true,
        returnOriginal: false
      },
      (err, stock) =>{
        if(err) return console.log('Error with findOneAndUpdate', err);
        if(stock.value.ipAddresses.indexOf('dummy IP address') == -1){
          callback({
            ticker: ticker,
            likes: stock.value.ipAddresses.length - 1
          });
        };
      }
    );
  });
};