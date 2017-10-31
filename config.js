/**
 * Created by lailai on 2017/10/20.
 */
var path=require('path');
var util=require('./libs/utils.js');
var wechat_file=path.join(__dirname,'./config/wechat.txt');

var config={
    wechat: {
        appId: 'wx7783b61a992de5c8',
        appsecret: 'c961e5077f8920cc66c9475625bdfb64',
        token: 'move',
        getAccessToken: function(){
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken: function(data){
            return util.writeFileAsync(wechat_file,data);
        }
    }
};
module.exports=config;