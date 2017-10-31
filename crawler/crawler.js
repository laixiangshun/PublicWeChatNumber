/**
 * Created by lailai on 2017/10/26.
 * 爬取飘花电影网电影信息
 */
var co=require('co');
var cheerio=require('cheerio');
var Promise=require('bluebird');
var request=Promise.promisify(require('request'));
var cronJob=require('cron').CronJob;

var URL='http://www.piaohua.com/';

var typeLink = {
    V1001_TODAY_LATEST:'http://www.piaohua.com/',
    V1001_TYPE_KEHUAN:'http://www.piaohua.com/html/kehuan/index.html',
    V1001_TYPE_XUANYI:'http://www.piaohua.com/html/xuannian/index.html',
    V1001_TYPE_AIQING:'http://www.piaohua.com/html/aiqing/index.html',
    V1001_TYPE_WENYI:'http://www.piaohua.com/html/wenyi/index.html',
    V1001_AREA_DALU:'http://www.piaohua.com/html/zhanzheng/index.html',
    V1001_AREA_GANGTAI:'http://www.piaohua.com/html/kongbu/index.html',
    V1001_AREA_OUMEI:'http://www.piaohua.com/html/lianxuju/index.html',
    V1001_AREA_HANGUO:'http://www.piaohua.com/html/zongyijiemu/index.html'
};

//获取下载链接的爬虫
function getftpLink(link){
    return new Promise(function(resolve,reject){
        request.get(link,function(err,res,body){
            if(!err && res.statusCode == 200){
                var $=cheerio.load(body);
                var ftp=$('#showinfo').find('table tbody tr td a').html();
                resolve(ftp);
            }else{
                reject('failed to get the ftp');
            }
        })
    })
};

//获取最近三天上线的电影爬虫
function getTodayLatest(){
    return new Promise(function(resolve,reject){
        request.get(URL,function(err,res,body){
            if(err){
                console.log('failed to crawl the piaohua.com');
                resolve();
            }else{
                var $=cheerio.load(body);
                var movieLists=[];
                var _movieList=$('#iml1').children('ul').first().find('li');
                //console.log('movieList:',_movieList);
                _movieList.each(function(item){
                    var time=$(this).find('span font').html() ? $(this).find('span font').html() : $(this).find('span').html();
                    //筛选最近三天上线的电影
                    if((new Date() - new Date(time))<259200000){
                        var dom=$(this).find('a').first();
                        var link=URL+$(dom).attr('href');
                        var img=$(dom).find('img').attr('src');
                        var name=$(dom).find('img').attr('alt').substr(22).replace('</font>','');
                        var movie={
                            name: name,
                            img: img,
                            link: link,
                            time: time
                        };
                        movieLists.push(movie);
                    }
                });
                resolve(movieLists);
            }
        })
    })
}

//获取指定条件的电影爬虫(暂时不用这个方法)
function getListByEventKey(eventKey){
    return new Promise(function(resolve,reject){
        getPageByUrl(eventKey).then(function(movieList){
            console.log('获取的电影列表：',movieList);
            for(var i=0;i<movieList.length;i++){
                request.get(movieList[i].link,function(err,res,body){
                    if(!err && res.statusCode == 200){
                        var $=cheerio.load(body);
                        var ftp=$('#showinfo').find('table tbody tr td a').html();
                        console.log('ftp:',ftp);
                        movieList[i].ftp = unescape(ftp.replace(/;/g,'').replace(/&#x/g, "%u"));
                    }else{
                        reject('failed to get the ftp');
                    }
                });
            }
            resolve(movieList);
        })
    })
}
function getPageByUrl(evenKey){
    var url;
    switch(evenKey){
        case "V1001_TYPE_KEHUAN":
            url=typeLink.V1001_TYPE_KEHUAN;
            break;
        case "V1001_TYPE_XUANYI":
            url=typeLink.V1001_TYPE_XUANYI;
            break;
        case "V1001_TYPE_AIQING":
            url=typeLink.V1001_TYPE_AIQING;
            break;
        case "V1001_TYPE_WENYI":
            url=typeLink.V1001_TYPE_WENYI;
            break;
        case "V1001_AREA_DALU":
            url=typeLink.V1001_AREA_DALU;
            break;
        case "V1001_AREA_GANGTAI":
            url=typeLink.V1001_AREA_GANGTAI;
            break;
        case "V1001_AREA_OUMEI":
            url=typeLink.V1001_AREA_OUMEI;
            break;
        case "V1001_AREA_HANGUO":
            url=typeLink.V1001_AREA_HANGUO;
            break;
    }
    return new Promise(function(resolve,reject){
        request.get(url,function(err,res,body){
            if(!err && res.statusCode ==200){
                var $=cheerio.load(body);
                var movieLists=[];
                var _movieList=$('#list').find('dl');
                _movieList.each(function(index,item){
                    if(index==5) return false;
                    var dom=$(this).children('dt').find('a');
                    var link=URL+$(dom).attr('href');
                    var img=$(dom).find('img').attr('src');
                    var dom2=$(this).children('dd').find('strong a');
                    var name=$(dom2).find('b font').text();
                    console.log('name:',name);
                    var movie={
                        name: name,
                        link: link,
                        img: img
                    };
                    movieLists.push(movie);
                });
                resolve(movieLists);
            }else{
                console.log('get movie type failed');
                resolve();
            }
        })
    })
}
exports.getCrawlMovieList=function* (evenKey){
    var movieList;
    if(evenKey === 'V1001_TODAY_LATEST'){
        movieList=yield getTodayLatest();
    }else{
        //movieList=yield getListByEventKey(evenKey);
        movieList=yield getPageByUrl(evenKey);
    }
    for(var i=0;i<movieList.length;i++){
        var ftp=yield getftpLink(movieList[i].link); //获取电影的下载链接
        movieList[i].ftp=unescape(ftp.replace(/;/g,'').replace(/&#x/g,'%u'));
    }
    return movieList;
};

//爬虫定时任务——————目前还没有没有实现
var job=new cronJob('00 30 14 * * *',function(){
    request.get(URL,function(err,res,body){
        console.log(body);
    })
});