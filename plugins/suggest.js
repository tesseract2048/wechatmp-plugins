

module.exports.parser = function(msg){
	if (msg.indexOf('建议') == 0)
	{
		return [msg];
	}
};

module.exports.handler = function(data, callback){
	db.insert('suggestion', {'userid': data.userid, 'time': new Date(), 'msg': data.param[0]}, function (success){
		if (success)
		{
			callback('suggest_ok');
		}
		else
		{
			callback('suggest_err');
		}
	});
};
