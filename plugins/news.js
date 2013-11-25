function queryNews(keyword, callback)
{
	var client = require('../helper/webclient');
	client.get('www.tju.edu.cn', 80, '/mobile/m_news/m_tdyw/', function(data, headers){
		var news = [];
		var mchs = data.match(/<li><a href="\.([^"]*)">([^<]*)<\/a><\/li>/g);
		for (var i in mchs)
		{
			var group = mchs[i].match(/<li><a href="\.([^"]*)">([^<]*)<\/a><\/li>/);
			news.push({'Title': group[2], 'Url': 'http://www.tju.edu.cn/mobile/m_news/m_tdyw' + group[1], 'PicUrl': '', 'Description': ''});
			if (news.length == 10) break;
		}
		callback(news);
	}, 'GBK');
}

module.exports.parser = function(msg){
	if (msg.indexOf('新闻') == 0)
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
	queryNews(data.param[0], function(news){
		if (news && news.length > 0)
		{
			msgParam.items = news;
			callback('news', msgParam);
		}
		else
		{
			callback('news_not_found');
		}
	});
};
