/**
 * Created by lailai on 2017/10/20.
 * 入口文件
 */
var koa=require('koa');
var sha1=require('sha1');
var wechat=require('./wechat/generator.js');
var config=require('./config.js');
var weixin=require('./weixin.js');

var app=new koa();

app.use(wechat(config.wechat,weixin.reply));

app.use(weixin.setMenu);

app.listen(8000);
console.log('server success on port 8000');
