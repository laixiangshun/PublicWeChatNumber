/**
 * Created by lailai on 2017/10/20.
 * 公众号义务层的逻辑——例如：回复消息，爬取电影网站信息，支付等
 */
var config = require('./config');
var Wechat = require('./wechat/wechat');
var menu=require('./menu');
var crawler=require('./crawler/crawler');

var wechatApi = new Wechat(config.wechat);
function* reply(next){
    console.log('ctx:'+this);
    var message=this.weixin;
    console.log('this is message:'+message);
    if(message.MsgType === 'event'){
        if(message.Event === 'subscribe'){
            if(message.EventKey){
                console.log('扫描二维码关注:'+message.EventKey+''+message.ticket);
            }
            this.body='终于等到你，还好我没放弃';
        }else if(message.Event === 'unsubscribe'){
            this.body='';
            console.log(message.FromUserName+'悄悄的走了...');
        }else if(message.Event === 'LOCATION'){
            this.body='你上报的地理位置是:'+message.Latitude+','+message.Longitude;
        }else if(message.Event === 'CLICK'){
            //点击自定义菜单
            var movieList=yield crawler.getCrawlMovieList(message.EventKey);
            var messages=[];
            movieList.forEach(function(item){
                var msg={
                    title: item.name,
                    description: item.ftp,
                    picUrl: item.img,
                    url: item.link
                };
                messages.push(msg);
            });
            this.body=messages;
        }else if(message.Event === 'SCAN'){
            this.body='关注后扫描二维码:'+message.Ticket;
        }
    }else if(message.MsgType === 'text'){
        var content=message.Content;
        var reply='你说的话是:“'+content+'”,我听不懂';
        if(content === '1'){
            reply='金刚:骷髅岛';
        }else if(content === '2'){
            var data=yield wechatApi.uploadTempMaterial('image',__dirname+'/public/king.jpg');
            console.log('mediaId:',data.media_id);
            reply={
                type: 'image',
                mediaId: data.media_id
            }
        }else if(content === '3'){
            var data=yield wechatApi.uploadTempMaterial('voice',__dirname+'/public/aiyou.mp3');
            reply={
                type: 'voice',
                mediaId: data.media_id
            }
        }else if(content === '4'){
            reply=[{
                title: '金刚:骷髅岛',
                description: '南太平洋上的神秘岛屿——骷髅岛。史上最大金刚与邪恶骷髅蜥蜴的较量。',
                picUrl: 'http://tu.23juqing.com/d/file/html/gndy/dyzz/2017-04-09/da9c7a64ab7df196d08b4b327ef248f2.jpg',
                url: 'http://www.piaohua.com/html/dongzuo/2017/0409/31921.html'
            }]
        }else if(content === "创建分组"){
            var data=yield wechatApi.createGroup('科幻电影');
            if(data.errcode){
                reply="分组创建失败";
            }else{
                reply="分组:["+data.name+"]创建成功";
            }

        }else if(content === '5'){
            var groups= yield wechatApi.getGroups();
            reply='获取到如下分组:\n';
            for(var i=0;i<groups.length;i++){
                reply=reply+'['+groups[i].name+']   用户数量:['+groups[i].count+']\n';
            }
            //reply='获取到如下分组:\n'+JSON.stringify(groups);
        }else if(content === '6'){
            var msg=yield wechatApi.moveUsersToGroup(message.FromUserName,101);
            var groups=yield wechatApi.getGroups();
            //reply='获取到如下分组:\n'+JSON.stringify(groups);
            reply='获取到如下分组:\n';
            for(var i=0;i<groups.length;i++){
                reply=reply+'['+groups[i].name+']   用户数量:['+groups[i].count+']\n';
            }
        }else if(content === '7'){
            var remark=yield wechatApi.updateUserRemark(message.FromUserName,'一朵花');
            reply='你的备注名被改成了:'+remark;
        }else if(content === '8'){
            var data1=yield wechatApi.fetchUserInfo(message.FromUserName);
            //reply='你的微信名:'+data1.nickname+'   备注:'+data1.remark;
            reply=[{
                title: data1.nickname+'    '+(data1.sex===1 ?'男':'女'),
                description: data1.country+'-'+data1.province+'-'+data1.city+'      备注:'+data1.remark,
                picUrl: data1.headimgurl
            }]
        }else if(content === '9'){
            var data=yield wechatApi.fetchUserInfo([message.FromUserName]);
            var user_list=data.user_info_list;

            var list=[];
            if(user_list && user_list.length>0){
                for(var i=0;i<user_list.length;i++){
                    //reply+=user_list[i].nickname+'-------'+user_list[i].city+'\n';
                    list.push({
                        title: user_list[i].nickname+'    '+(user_list[i].sex===1?'男':'女'),
                        description: user_list[i].country+'-'+user_list[i].province+'-'+user_list[i].city+'      备注:'+user_list[i].remark,
                        picUrl: user_list[i].headimgurl
                    });
                }
                reply=list;
            }else{
                reply='获取用户信息如下:\n';
                reply+='还没有用户关注';
            }
            console.log(data);
            //reply=JSON.stringify(data);
        }else if(content === '10'){
            var data=yield wechatApi.getUserOpenIds();
            reply='获取的用户列表如下:\n';
            reply+='总数:'+data.count+'\n';
            var _data=data.data.openid;
            for(var i=0;i<_data.length;i++){
                reply+='openid:['+_data[i]+']\n';
            }
        }else if(content === '11'){
            var data=yield wechatApi.getUserOpenIds(message.FromUserName);
            console.log(data);
            reply='当前用户为起点获取用户列表如下:\n';
            reply+='总数:'+data.count+'\n';
            if(data.data){
                var _data=data.data.openid;
                for(var i=0;i<_data.length;i++){
                    reply+='openid:['+_data[i]+']\n';
                }
            }else{
                reply+='openid:空';
            }

        }else if(content === '12'){
            var text={
                content: '这是群发消息测试'
            };
            var msg=yield wechatApi.massSendMsg('text',text,101);
            //reply=JSON.stringify(msg);
            console.log('msg:'+JSON.stringify(msg));
        }else if(content === '13'){
            var data=yield wechatApi.uploadTempMaterial('video',__dirname+'/public/vuejs.mp4');
            console.log(data);
            reply={
                type: data.type,
                title: 'vuejs',
                description: 'vuejs入门介绍',
                mediaId: data.media_id
            }
        }
        //其他回复类型

        this.body=reply;
    }
    yield next;
}
//var reply =async (ctx,next)=>{
//    console.log('ctx:'+ctx);
//    var message=ctx.weixin;
//    console.log('this is message:'+message);
//    if(message.MsgType === 'event'){
//        if(message.Event === 'subscribe'){
//            if(message.EventKey){
//                console.log('扫描二维码关注:'+message.EventKey+''+message.ticket);
//            }
//            ctx.body='终于等到你，还好我没放弃';
//        }else if(message.Event === 'unsubscribe'){
//            ctx.body='';
//            console.log(message.FromUserName+'悄悄的走了...');
//        }
//    }
//    await next();
//};

exports.reply=reply;

exports.setMenu=function * (){
    yield wechatApi.deleteMenu().then(function(){
        return wechatApi.createMenu(menu);
    }).then(function(msg){
        console.log('createMenu:'+msg);
    })
};