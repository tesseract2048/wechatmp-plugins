function setEvening(db, coll, data, today, tomorrow, callback, release)
{
	coll.aggregate({$group : {_id : 0, users: { $addToSet: "$userid"}}}, function (err, item) {
		if (err)
		{
			callback('evening_err');
			return;
		}
		var totalUser = 0;
		if (item.length > 0)
		{
			totalUser = item[0].users.length;
		}
		coll.count({'time': {$lte: tomorrow, $gte: today}}, function (err, item){
			coll.insert({'userid': data.userid, 'time': new Date()}, function(err){
				if (err)
				{
					callback('evening_err');
					return;
				}
				db.collection('morning', {'safe': true}, function (err, coll2){
					if (err)
					{
						callback('evening_err');
						return;
					}
					coll2.findOne({'userid': data.userid, 'time': {$gte: today}}, function(err, item2){
						if (err || !item2)
						{
							callback('evening', {'hour': (new Date()).getHours(), 'minute': (new Date()).getMinutes(), 'percent': Math.floor(item / totalUser * 100)});
						}
						else
						{
							callback('evening2', {'spent_hour': Math.round((new Date().getTime() - item2.time.getTime()) / 1000 / 3600 * 10) / 10, 'hour': (new Date()).getHours(), 'minute': (new Date()).getMinutes(), 'percent': Math.floor(item / totalUser * 100)});
						}
						release();
					});
				});
			});
		});
	});
}

module.exports.parser = function(msg){
	if (msg.indexOf('晚安') == 0)
	{
		return [];
	}
};

module.exports.handler = function(data, callback){
	if ((new Date()).getHours() >= 4 && (new Date()).getHours() <= 16)
	{
		callback('evening_too_early');
		return;
	}
	rrest.mongo(function(err, db, release){
		if (err)
		{
			callback('evening_err');
			return;
		}
		db.collection('evening', {'safe': true}, function (err, coll){
			var tomorrow;
			var today;
			if ((new Date()).getHours() >= 4)
			{
				tomorrow = new Date();
				today = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 4, 00, 0);
				tomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 4, 00, 0);
				tomorrow.setDate(tomorrow.getDate() + 1);
			}
			else
			{
				tomorrow = new Date();
				tomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 4, 00, 0);
				today = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 4, 00, 0);
				today.setDate(tomorrow.getDate() - 1);
			}
			coll.findOne({'userid': data.userid, 'time': {$lte: tomorrow}}, function(err, item){
				if (!err && item)
				{
					coll.remove({'userid': data.userid, 'time': {$lte: tomorrow, $gte: today}}, function(err) {
						setEvening(db, coll, data, today, tomorrow, callback, release);
					});
					return;
				}
				setEvening(db, coll, data, today, tomorrow, callback, release);
			});
		});
	});
};
