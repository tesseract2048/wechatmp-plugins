

module.exports.parser = function(msg){
if (msg == '帮助' || msg == 'help')
	{
		return [];
	}
};

module.exports.handler = function(data, callback){
callback('help');
};
