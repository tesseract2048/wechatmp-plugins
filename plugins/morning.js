

module.exports.parser = function(msg){
	if (msg.indexOf('早安') == 0)
	{
		return [];
	}
};

module.exports.handler = function(data, callback){
	if ((new Date()).getHours() < 4)
	{
		callback('morning_too_early');
		return;
	}
	db.open('morning', function (coll, release){
		var today = new Date();
		if (today.getHours() < 4)
		{
			callback('morning_too_early');
			return;
		}
		today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 4, 00, 0);
		yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 4, 00, 0);
		yesterday.setDate(yesterday.getDate() - 1);
		coll.findOne({'userid': data.userid, 'time': {$gte: today}}, function(err, item){
			if (!err && item)
			{
				callback('morning_duplicate');
				return;
			}
			coll.aggregate({$group : {_id : 0, users: { $addToSet: "$userid"}}}, function (err, item) {
				if (err)
				{
					callback('morning_err');
					return;
				}
				var totalUser = 0;
				if (item.length > 0)
				{
					totalUser = item[0].users.length;
				}
				coll.count({'time': {$gte: today}}, function (err, item){
					coll.insert({'userid': data.userid, 'time': new Date()}, function(err){
						if (err)
						{
							callback('morning_err');
							return;
						}
						db.open('evening', function (coll2, release2){
							coll2.findOne({'userid': data.userid, 'time': {$gte: yesterday}}, function(err, item2){
								if (err || !item2)
								{
									callback('morning', {'hour': (new Date()).getHours(), 'minute': (new Date()).getMinutes(), 'percent': Math.floor((totalUser - item) / totalUser * 100)});
								}
								else
								{
									callback('morning2', {'spent_hour': Math.round((new Date().getTime() - item2.time.getTime()) / 1000 / 3600 * 10) / 10, 'hour': (new Date()).getHours(), 'minute': (new Date()).getMinutes(), 'percent': Math.floor((totalUser - item) / totalUser * 100)});
								}
								release2();
							});
						});
					});
				});
			});
		});
	});
};
