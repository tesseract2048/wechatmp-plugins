module.exports.parser = function(msg){
	if (msg == '漂流瓶')
	{
		return [0];
	}
	if (msg.indexOf('扔瓶子') == 0)
	{
		return [1, msg.substr(msg.indexOf(' ')).trim()];
	}
	if (msg.indexOf('捞瓶子') == 0)
	{
		return [2];
	}
	if (msg.indexOf('回复瓶子') == 0)
	{
		return [3, msg.substr(msg.indexOf(' ')).trim()];
	}
	if (msg.indexOf('扔回海里') == 0)
	{
		return [5];
	}
};

module.exports.handler = function(data, callback){
	if (!data.user['drift'])
	{
		data.user['drift'] = {'state': 0};
	}
	switch (data.param[0])
	{
		case 0:
			callback('drift_help');
			break;
		case 1:
			if (!data.param[1])
			{
				callback('drift_help');
				return;
			}
			db.open('drift', function (coll, release){
				var row = {'time': new Date(), 'userid': data.userid, 'msg': data.param[1], 'state': 0, 'drop_time': 0, 'rand': Math.random(), 'reply': []};
				coll.insert(row, function(){
					callback('drift_new_ok');
					release();
				});
			});
			break;
		case 2:
			if (data.user['drift'].state > 0)
			{
				callback('drift_already_get');
				return;
			}
			db.open('drift', function (coll, release){
				var rand = Math.random();
				coll.findOne({$or: [{'state': 2, 'userid': data.userid}, {'state': 4, 'reader': data.userid}]}, function(err, item){
					if (err || !item)
					{
						if (data.user['drift'].lastpick && (new Date().getTime() - data.user['drift'].lastpick.getTime()) < 7200000)
						{
							callback('drift_frequency', {'minute': Math.floor((7200000 - (new Date().getTime() - data.user['drift'].lastpick.getTime())) / 60 / 1000)});
							return;
						}
						coll.findOne({'state': 0, 'rand': {$gte: rand}}, function(err, item){
							if (err || !item)
							{
								coll.findOne({'state': 0, 'rand': {$lte: rand}}, function(err, item){
									if (err || !item)
									{
										callback('drift_not_found');
										return;
									}
									callback('drift_get', {'msg': item.msg, 'duration_hour': Math.round((new Date().getTime() - item.time.getTime()) / 1000 / 3600)});
									data.user['drift'].state = 2;
									data.user['drift'].drift = item._id;
									data.user['drift'].lastpick = new Date();
									coll.update({'_id': item._id}, {$set: {'state': 1}}, function (){release();});
								});
								return;
							}
							callback('drift_get', {'msg': item.msg, 'duration_hour': Math.round((new Date().getTime() - item.time.getTime()) / 1000 / 3600)});
							data.user['drift'].state = 2;
							data.user['drift'].drift = item._id;
							data.user['drift'].lastpick = new Date();
							coll.update({'_id': item._id}, {$set: {'state': 1, 'reader': data.userid}}, function (){release();});
						});
						return;
					}
					var reply = '';
					for (var i in item.reply)
					{
						var line = '';
						line += '(' + Math.round((new Date().getTime() - item.reply[i].time.getTime()) / 1000 / 3600) + '小时前) ';
						if (item.reply[i].userid == data.userid)
						{
							line += '您: ';
						}
						else
						{
							line += '对方: ';
						}
						line += item.reply[i].msg;
						line += '\r\n--------------------\r\n';
						reply = line + reply;
					}
					callback('drift_get_reply', {'reply': reply, 'msg': item.msg});
					data.user['drift'].state = 2;
					data.user['drift'].drift = item._id;
					coll.update({'_id': item._id}, {$set: {'state': 3}}, function (){release();});
				});
			});
			break;
		case 3:
			if (data.user['drift'].state != 2)
			{
				callback('drift_did_not_get');
				return;
			}
			db.open('drift', function (coll, release){
				coll.findOne({'_id': data.user['drift'].drift}, function(err, item){
					if (err)
					{
						callback('drift_not_found');
						return;
					}
					var setState;
					var opponent;
					if (item.state == 1)
					{
						setState = 2;
						opponent = item.userid;
					}
					else
					{
						setState = 4;
						opponent = item.reader;
					}
					coll.update({'_id': data.user['drift'].drift}, {$set: {'state': setState}, $push: {'reply': {'time': new Date(), 'userid': data.userid, 'msg': data.param[1]}}}, function (){
						callback('drift_reply_ok');
						data.user['drift'].state = 0;
						release();
					});
					global.sendTextMessage(opponent, global.sendTextMessage(opponent, 'drift_got_reply'));
				});
			});
			break;
		case 5:
			if (data.user['drift'].state != 2)
			{
				callback('drift_did_not_get');
				return;
			}
			db.open('drift', function (coll, release){
				coll.findOne({'_id': data.user['drift'].drift}, function(err, item){
					var okrelease = function(){
						callback('drift_drop_ok');
						data.user['drift'].state = 0;
						release();
					};
					if (err)
					{
						callback('drift_not_found');
						return;
					}
					if (!item) {
						okrelease();
						return;
					}
					var s = {'state': 0};
					if (item.drop_time == 2)
					{
						s.state = 9;
					}
					if (item.reply.length > 0)
					{
						s.state = 9;
					}
					coll.update({'_id': data.user['drift'].drift}, {$set: s, $inc: {'drop_time': 1}}, okrelease);
				});
			});
			break;
	}
};
