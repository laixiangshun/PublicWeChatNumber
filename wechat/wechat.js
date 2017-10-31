/**
 * Created by lailai on 2017/10/20.
 */
    var fs=require('fs');
    var Promise=require('bluebird');
    var request=Promise.promisify(require('request'));
    var util=require('./util');

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api={
    accessToken:prefix+'token?grant_type=client_credential',
    uploadTempMaterial: prefix+'media/upload?',//access_token=ACCESS_TOKEN&type=TYPE  上传临时素材
    getTempMaterial:prefix+'media/get?',        //access_token=ACCESS_TOKEN&media_id=MEDIA_ID 获取临时素材，GET请求
    uploadPermNews:prefix+'material/add_news?',   //access_token=ACCESS_TOKEN  上传永久图文
    uploadPermPics:prefix+'media/uploadimg?',   //access_token=ACCESS_TOKEN  上传永久图片
    uploadPermOther:prefix+'material/add_material?',   //access_token=ACCESS_TOKEN  上传永久其他素材
    getPermMaterial:prefix+'material/get_material?',   //access_token=ACCESS_TOKEN 获取永久素材，POST请求
    delPermMaterial:prefix+'material/del_material?',   //access_token=ACCESS_TOKEN 删除永久素材，POST请求
    menu: {
        create:prefix+'menu/create?',  //access_token=ACCESS_TOKEN  创建菜单
        get:prefix+'menu/get?',        //access_token=ACCESS_TOKE  获取菜单,GET请求
        delete:prefix+'menu/delete?',  //access_token=ACCESS_TOKEN	删除菜单,GET请求
        getInfo:prefix+'get_current_selfmenu_info?'  //access_token=ACCESS_TOKEN  获取自定义菜单配置接口
    },
    groups:{
        create:prefix+'groups/create?',  //access_token=ACCESS_TOKEN  创建分组，POST请求
        get:prefix+'groups/get?',        //access_token=ACCESS_TOKE  查询所有分组,GET请求
        getId:prefix+'groups/getid?',    //access_token=ACCESS_TOKEN  查询用户所在分组,POST请求
        update:prefix+'groups/update?',  //access_token=ACCESS_TOKEN  修改分组名,POST请求
        membersUpdate:prefix+'groups/members/update?',  //access_token=ACCESS_TOKEN  移动用户分组,POST请求
        membersBatchupdate:prefix+'groups/members/batchupdate?', //access_token=ACCESS_TOKEN  批量移动用户分组,POST请求
        delete:prefix+'groups/delete?'   //access_token=ACCESS_TOKEN  删除分组,POST请求
    },
    user:{
        updateUserRemark:prefix+'user/info/updateremark?',  //access_token=ACCESS_TOKEN  修改用户备注名，POST请求
        getUserInfo:prefix+'user/info?', //access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN  获取用户基本信息，GET请求
        batchGetUserInfo:prefix+'user/info/batchget?',  //access_token=ACCESS_TOKEN，POST请求
        getUserOpenIds:prefix+'user/get?'  //access_token=ACCESS_TOKEN&next_openid=NEXT_OPENID，GET请求
    },
    mass:{
        sendall:prefix+'message/mass/sendall?'  //access_token=ACCESS_TOKEN 群发消息
    }
};

//构造函数，用以生成实例，完成初始化工作，读写票据
function Wechat(opts){
    //console.log('测试号信息配置：',opts);
    var that=this;
    this.appID=opts.appId;
    this.appSecret=opts.appsecret;
    this.getAccessToken=opts.getAccessToken;
    this.saveAccessToken=opts.saveAccessToken;
    this.fetchAccessToken(); //获取access_token
}

Wechat.prototype.fetchAccessToken = function(){
    var that = this;
    //console.log('执行上下文:',that);
    // 如果this上已经存在有效的access_token，直接返回this对象
    if(this.access_token && this.expires_in){
        if(this.isvalidAccessToken(this)){
            return Promise.resolve(this);
            //return new Promise(function(resolve,reject){
            //    resolve(this);
            //})
        }
    }

    this.getAccessToken().then(function(data){
        try{
            data = JSON.parse(data);
        }catch(e){
            return that.updateAccessToken();
        }
        if(that.isvalidAccessToken(data)){
            return Promise.resolve(data);
            //return new Promise(function(resolve,reject){
            //    resolve(data);
            //})
        }else{
            return that.updateAccessToken();
        }
    }).then(function(data){
        //console.log('access_token:',data);
        that.access_token = data.access_token;
        that.expires_in = data.expires_in;
        that.saveAccessToken(JSON.stringify(data));
        return Promise.resolve(data);
        //return new Promise(function(resolve,reject){
        //    resolve(data);
        //})
    });
};
//验证access_token是否有效
Wechat.prototype.isvalidAccessToken = function(data){
    if(!data || !data.access_token || !data.expires_in) return false;
    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = new Date().getTime();
    return (now < expires_in) ? true : false;
};
//access_token失效,更新
Wechat.prototype.updateAccessToken = function(){
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid='+ appID +'&secret='+ appSecret;
    //console.log('获取access_token的url：',url);
    return new Promise(function(resolve,reject){
        request({url:url,method: 'GET',json:true}).then(function(response){
            var data = response.body;
            console.log('获取的access_token:',data);
            var now = new Date().getTime();
            var expires_in = now + (data.expires_in - 20) * 1000;   //考虑到网络延迟、服务器计算时间,故提前20秒发起请求
            data.expires_in = expires_in;
            resolve(data);
        });
    });
};
Wechat.prototype.replay=function(){
    var content=this.body;
    var message=this.weixin;
    var xml=util.tpl(content,message);
    this.status=200;
    this.type='application/xml';
    this.body=xml;
};
//上传临时素材
Wechat.prototype.uploadTempMaterial=function(type,filepath){
    var that=this;
    //构造表单
    var from={
        media: fs.createReadStream(filepath)
    };
    return new Promise(function(resolve,reject){
        //console.log('Promise',that.fetchAccessToken());
        that.fetchAccessToken().then(function(data){
            var url=api.uploadTempMaterial+'access_token='+data.access_token+'&type='+type;
            request({url: url,method: 'POST',formData: from,json: true}).then(function(response){
                var _data=response.body;
                console.log('_data:',_data);
                if(_data){
                    resolve(_data); //返回素材管理接口上传临时素材的media_id
                }else{
                    throw new Error('upload temporary material failed!');
                }
            }).catch(function(err){
                reject(err);
            });
        });
    });
};
//上传永久素材
Wechat.prototype.uploadPermMaterial=function(type,material){
  var that=this;
    var form={};
    var uploadUrl='';
    if(type === 'pic') uploadUrl=api.uploadPermPics;
    if(type === 'other') uploadUrl=api.uploadPermOther;
    if(type === 'news'){
        uploadUrl=api.uploadPermNews;
        form=material;
    }else{
        form.media=fs.createReadStream(material);
    }
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=uploadUrl+'access_token='+data.access_token;
            var opts={
                method: 'POST',
                url: url,
                json: true
            };
            (type == 'news') ? (opts.body=form) : (opts.formData=form);//上传数据的方式不同
            request(opts).then(function(response){
                var _data=response.body;
                if(_data){
                    resolve(_data);
                }else{
                    throw new Error('upload permanent material failed');
                }
            }).catch(function(err){
                reject(err);
            });
        })
    })
};
//获取素材链接
Wechat.prototype.getMaterial=function(mediaId,permanent){
    var that=this;
    var getUrl=permanent ? api.getPermMaterial : api.getTempMaterial;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=getUrl+'acceess_token='+data.access_token;
            if(!permanent){
                url+='&media_id='+mediaId;
            }
            resolve(url);
        });
    })
};
//删除永久素材
Wechat.prototype.delMaterial=function(mediaId){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.delPermMaterial+'access_token='+data.access_token;
            var form={
                media_id: mediaId
            };
            request({url: url,method: 'POST',formData: form,json: true}).then(function(response){
                var _data=response.body;
                if(_data.errcode=== 0){
                    resolve();
                }else{
                    throw new Error('delete permanent material failed');
                }
            }).catch(function(err){
                reject(err);
            });
        })
    })
};

//创建菜单
Wechat.prototype.createMenu=function(menu){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            //console.log('------data---',data);
            var url=api.menu.create+'access_token='+data.access_token;
            request({url: url,method: 'POST',body: menu,json: true}).then(function(response){
                var _data=response.body;
                //console.log('_data',_data);
                if(_data.errcode ===0){
                    resolve(_data.errmsg);
                }else{
                    throw new Error('create menu failed');
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//删除原有菜单
Wechat.prototype.deleteMenu=function(){
    var that=this;
    return new Promise(function(resolve,reject){
       that.fetchAccessToken().then(function(data){
            var url=api.menu.delete+'access_token='+data.access_token;
            request({url: url,method: 'GET',json: true}).then(function(response){
                var _data=response.body;
                //console.log('_data',_data);
                if(_data.errcode === 0){
                    resolve(_data.errmsg);
                }else{
                    throw new Error('delete menu failed');
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//获取菜单
Wechat.prototype.getMenu=function(){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.menu.get+'access_token='+data.access_token;
            request({url: url,method: 'GET',json: true}).then(function(response){
                var _data=response.body;
                if(_data.menu){
                    resolve(_data.menu);
                }else{
                    throw new Error('get menu failed');
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};

/**
 * 用户管理操作
 * @type {Wechat}
 */

//创建分组
Wechat.prototype.createGroup=function(name){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.groups.create+'access_token='+data.access_token;
            var opts={
                group: {
                    name: name
                }
            };
            request({method: "POST",url: url,body: opts,json: true}).then(function(response){
                var _data=response.body;
                if(_data.group && response.statusCode === 200){
                    resolve(_data.group);
                }else{
                    throw new Error('create group failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//获取所有用户分组
Wechat.prototype.getGroups=function(){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.groups.get+'access_token='+data.access_token;
            request({url: url,method: 'GET',json: true}).then(function(response){
                var _data=response.body;
                if(_data.groups){
                    resolve(_data.groups);
                }else{
                    throw new Error('get groups failed:'+_data.groups);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//删除用户分组————支持批量删除
Wechat.prototype.deleteGroups=function(ids){
    var that=this;
    that.fetchAccessToken().then(function(data){
        var queue=[];
        for(var i=0;i<ids.length;i++){
            queue.push(_deleteGroup(data.access_token,ids[i]));
        }
        //通过Promise.all()的方法，来处理Promise的集合
        Promise.all(queue).then(function(data){
            console.log('data:'+data);
        }).catch(function(err){
            console.log(err);
        })
    })
};
//为每一个要删除的分组id构建一个Promise
var _deleteGroup=function(access_token,id){
    var url=api.groups.delete+'access_token='+access_token;
    var form={
        group: {
            id: id
        }
    };
    return new Promise(function(resolve,reject){
        request({url: url,method: 'POST',body: form,json: true}).then(function(response){
            var _data=response.body;
            if(_data.errcode === 0){
                resolve('ok');
            }else{
                throw new Error('delete group :'+id+'failed:'+_data.errmsg);
            }
        }).catch(function(err){
            reject(err);
        })
    })
};

//移动用户分组——————支持批量移动
Wechat.prototype.moveUsersToGroup=function(openid,to_groupid){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url='';
            var form={};
            //单个用户
            if(openid && !Array.isArray(openid)){
                url=api.groups.membersUpdate+'access_token='+data.access_token;
                form={
                    openid: openid,
                    to_groupid: to_groupid
                };
            }else if(Array.isArray(openid)){
                url=api.groups.membersBatchupdate+'access_token='+data.access_token;
                form={
                    openid: openid,
                    to_groupid: to_groupid
                };
            }
            request({method: 'POST',url: url,body: form,json: true}).then(function(res){
                var _data=res.body;
                if(_data.errcode ===0){
                    resolve(_data.errmsg);
                }else{
                    throw new Error('update group failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })

        })
    })
};
//设置用户备注名
Wechat.prototype.updateUserRemark=function(openid,remark){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.user.updateUserRemark+'access_token='+data.access_token;
            var form={
                openid: openid,
                remark: remark
            };
            request({url: url,method: 'POST',json: true,body: form}).then(function(res){
                var _data=res.body;
                if(_data.errcode ===0){
                    resolve(remark);
                }else{
                    throw  new Error('update user remark failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//获取单个或者多个用户信息
Wechat.prototype.fetchUserInfo=function(open_id,lang){
    var that=this;
    var lang=lang || 'zh_CN';
    var url='';
    var opts={};
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            if(open_id && !Array.isArray(open_id)){
                url=api.user.getUserInfo+'access_token='+data.access_token+'&openid='+open_id+'&lang='+lang;
                opts={
                    url: url,
                    json: true
                };
            }else if(open_id && Array.isArray(open_id)){
                url=api.user.batchGetUserInfo+'access_token='+data.access_token;
                var user_list=[];
                for(var i=0;i<open_id.length;i++){
                    user_list.push({
                        openid: open_id[i],
                        lang: lang
                    });
                }
                opts={
                    url: url,
                    json: true,
                    method: 'POST',
                    body: {
                        user_list: user_list
                    }
                }
            }
            request(opts).then(function(res){
                var _data=res.body;
                if(!_data.errcode){
                    resolve(_data);
                }else{
                    throw new Error('fetch user info failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};

//获取用户列表
Wechat.prototype.getUserOpenIds=function(next_openid){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.user.getUserOpenIds+'access_token='+data.access_token;
            if(next_openid){
                url+='&next_openid='+next_openid;
            }
            request({url: url,json: true}).then(function(res){
                var _data=res.body;
                if(!_data.errcode){
                    resolve(_data);
                }else{
                    throw new Error('get user openIds failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//修改分组
Wechat.prototype.updateGroup=function(groupid,name){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.groups.update+'access_token='+data.access_token;
            var form={
                group:{
                    id: groupid,
                    name: name
                }
            };
            request({method: 'POST',url: url,body: form,json: true}).then(function(res){
                var _data=res.body;
                if(_data.errcode === 0){
                    resolve(_data.errmsg);
                }else{
                    throw new Error('update group failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
//通过用户的openid获取所在的分组的groupid
Wechat.prototype.getGroupIdByOpenId=function(openid){
    var that=this;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.groups.getId+'access_token='+data.access_token;
            var form={
                openid: openid
            };
            request({method: 'POST',url: url,json: true,body: form}).then(function(res){
                var _data=res.body;
                if(_data.groupid){
                    resolve(_data.groupid);
                }else{
                    throw new Error('get groupId by openid failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
/**
 * 群发消息————有groupid按分组群发，没有groupid则对所有用户群发
 * @type {Wechat}
 */
Wechat.prototype.massSendMsg=function(type,message,groupid){
    var that=this;
    var msg={
        filter:{},
        msgtype: type
    };
    if(!groupid){
        msg.filter.is_to_all=true;
    }else{
        msg.filter.is_to_all=false;
        msg.filter.group_id=groupid;
    }
    msg[type]=message;
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            var url=api.mass.sendall+'access_token='+data.access_token;
            request({url: url,body: msg,json: true,method: 'POST'}).then(function(res){
                var _data=res.body;
                if(_data.errcode===0){
                    resolve(_data);
                }else{
                    throw new Error('send mass message failed:'+_data.errmsg);
                }
            }).catch(function(err){
                reject(err);
            })
        })
    })
};
module.exports=Wechat;