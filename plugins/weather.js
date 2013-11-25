module.exports.parser = function(msg){
if(msg == "天气"){return [];}
};

module.exports.handler = function(data, callback){
	require('http').get("http://m.weather.com.cn/data/101030100.html", function(res) {
		var data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			var obj = JSON.parse(data);
			callback('weather_reply', obj.weatherinfo);
		});
	});
};
