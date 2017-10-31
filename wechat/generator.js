/**
 * Created by lailai on 2017/10/20.
 * 接入微信公众号——中间件
 */
var sha1=require('sha1');
var rawbody=require('raw-body');
var weChat=require('./wechat');

var util=require('./util.js');


module.exports=function(opts,handler){
    //console.log("opts:",opts);
    var wechat=new weChat(opts);
    return function* (next){
        var token=opts.token;
        var signature=this.query.signature;
        var nonce=this.query.nonce;
        var timestamp=this.query.timestamp;
        var echostr=this.query.echostr;
        var str=[token,timestamp,nonce].sort().join('');//按字典排序，拼接字符串
        var sha=sha1(str);
        if(this.method==='GET') this.body=(sha=== signature)?echostr+'':'failed';
        else if(this.method === 'POST'){
            if(sha !== signature){
                this.body='failed';
                return false;
            }
            //从http请求中获取request对象，拼接成xml数据
            var data=yield rawbody(this.req,{
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            });
            //console.log('data:'+data);

            //xml2js解析xml数据
            var content=yield util.parseXMLAsync(data);

            var message=yield util.formatMessage(content.xml);
            console.log('message:',message);

            this.weixin=message; //挂载消息

            //console.log('ctx:'+this);

            yield handler.call(this,next);// 转到义务层逻辑

            wechat.replay.call(this); //真正回复
        }
    };
};
