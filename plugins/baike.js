var baike;

function init()
{
	baike = {};
	db.open('baike', function (coll, release){
		coll.find().toArray(
			function(err, docs){
				for (var i in docs)
				{
					var obj = docs[i];
					baike[obj.word] = obj.text;
				}
				release();
			}
		);
	});
}

init();
global.purgeProc['baike'] = {'purge': init};

module.exports.parser = function(msg){
	if (baike[msg])
	{
		return [msg];
	}
};

module.exports.handler = function(data, callback){
	callback('baike', {'word': data.param[0], 'text': baike[data.param[0]]});
};
