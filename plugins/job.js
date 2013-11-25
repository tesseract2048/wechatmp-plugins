function queryJob(keyword, callback)
{
	var client = require('../helper/webclient');
	var gbk = require('../helper/gbk');
	client.get('job.tju.edu.cn', 80, '/zhaopinxinxi.php?key=' + gbk.encodeURIComponent(keyword), function(data, headers){
		var news = [];
		var mchs = data.match(/<img src="images\/60\.gif" \/> <a href="zhaopinxinxi_detail.php\?id=(\d+)">([^<]*)<\/a>/gm);
		for (var i in mchs)
		{
			var group = mchs[i].match(/<img src="images\/60\.gif" \/> <a href="zhaopinxinxi_detail.php\?id=(\d+)">([^<]*)<\/a>/);
			news.push({'Title': group[2], 'Url': global.addConf.portal + 'jobProxy?id=' + group[1], 'PicUrl': '', 'Description': ''});
			if (news.length == 10) break;
		}
		callback(news);
	}, 'GBK');
}

module.exports.parser = function(msg){
	if (msg.indexOf('招聘') == 0)
	{
		var keyword = msg.substr(msg.indexOf(' ') + 1);
		if (msg.indexOf(' ') > -1 && keyword)
		{
			return [keyword];
		}
		else
		{
			return [''];
		}
	}
};

module.exports.handler = function(data, callback){
	var msgParam = {'keyword': data.param[0]};
	queryJob(data.param[0], function(news){
		if (news && news.length > 0)
		{
			msgParam.items = news;
			callback('news', msgParam);
		}
		else
		{
			callback('job_not_found');
		}
	});
};
