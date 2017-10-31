/**
 * Created by lailai on 2017/10/20.
 */
var xml2js=require('xml2js');
var Promise=require('bluebird');
var tpl=require('./tpl.js');

//使用xml2js模块将xml数据解析成对象格式
exports.parseXMLAsync=function(xml){
    return new Promise(function(resolve,reject){
        xml2js.parseString(xml,{trim: true},function(err,content){
            err?reject(err):resolve(content);
        })
    })
};
//格式化xml数据
function formatMessage(result){
    var message={};
    if(typeof result === 'object'){
        var keys=Object.keys(result);
        for(var i=0;i<keys.length;i++){
            var key=keys[i];
            var item=result[key];
            if(!(item instanceof Array) || item.length === 0) continue;
            if(item.length ===1){
                var val=item[0];
                if(typeof val === 'object') message[key]=formatMessage(val);
                else message[key]=(val || '').trim();
            }else{
                message[key]=[];
                for(var j=0,k=item.length;j<K;j++){
                    message[key].push(formatMessage(item[j]));
                }
            }
        }
    }
    return message;
}

exports.formatMessage=formatMessage;

exports.tpl=function(content,message){
    var info={};
    var type='text';
    var fromUserName=message.FromUserName;
    var toUserName=message.ToUserName;

    if(Array.isArray(content)) type='news';
    type=content.type || type;
    info.content=content;
    info.createTime=new Date().getTime();
    info.msgType=type;
    info.fromUserName=toUserName;
    info.toUserName=fromUserName;

    return tpl.compiled(info);
};