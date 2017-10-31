/**
 * Created by lailai on 2017/10/25.
 * 自定义菜单
 */
module.exports={
    'button':[
        {
            'type': 'click',
            'name': '最新',
            'key': 'V1001_TODAY_LATEST',
            'sub_button': []
        },
        {
            'name': '类别',
            'sub_button': [
                {
                    'type': 'click',
                    'name': '科幻',
                    'key': 'V1001_TYPE_KEHUAN',
                    'sub_button': []
                },
                {
                    'type': 'click',
                    'name': '悬疑',
                    'key': 'V1001_TYPE_XUANYI',
                    'sub_button': []
                },
                {
                    'type': 'click',
                    'name': '爱情',
                    'key': 'V1001_TYPE_AIQING',
                    'sub_button': []
                },
                {
                    'type': 'click',
                    'name': '文艺',
                    'key': 'V1001_TYPE_WENYI',
                    'sub_button': []
                }
            ]
        },
        {
            'name': '地域',
            'sub_button': [
                {
                    'type': 'click',
                    'name': '大陆',
                    'key': 'V1001_AREA_DALU',
                    'sub_button': []
                },
                {
                    'type':'click',
                    'name':'港台',
                    'key':'V1001_AREA_GANGTAI',
                    'sub_button':[]
                },
                {
                    'type':'click',
                    'name':'欧美',
                    'key':'V1001_AREA_OUMEI',
                    'sub_button':[]
                },
                {
                    'type':'click',
                    'name':'韩印',
                    'key':'V1001_AREA_HANGUO',
                    'sub_button':[]
                }
            ]
        }
    ]
};
