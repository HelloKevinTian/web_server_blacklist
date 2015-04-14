/**
 * Created by King Lee on 15-2-3.
 */
var express = require('express');
var router = express.Router();
var pvp_blacklist_wrapper = require('../module/pvp_blacklist_wrapper');
var utils =  require('../module/util');

var desc_count = function(a,b){
    if (a.count > b.count)
        return -1;
    if (a.count < b.count)
        return 1;
};

var asce_rank = function(a,b){
    if (a.score_rank > b.score_rank)
        return 1;
    if (a.score_rank < b.score_rank)
        return -1;
};

var asce_rank_weekly = function(a,b){
    if (a.score_rank_weekly > b.score_rank_weekly)
        return 1;
    if (a.score_rank_weekly < b.score_rank_weekly)
        return -1;
};

var asce_rank_activity = function(a,b){
    if (a.score_rank_activity > b.score_rank_activity)
        return 1;
    if (a.score_rank_activity < b.score_rank_activity)
        return -1;
};

var format_time = function(){
    var date_now = new Date();
    var month_now = date_now.getMonth() + 1;
    var day_now = date_now.getDate();
    var year_now = date_now.getFullYear();
    return year_now + "-" + month_now + "-" + day_now;
};

/* GET home page. */
router.get('/', function(req, res) {
    if(!req.session.user){
        return res.redirect('/login');
    }
    get_black_list(function(string_black_list_show){
        res.render('pvp_blacklist',
            {
                title: 'pvp_blacklist',
                link_show: req.session.user ? "注销":"登录",
                link: req.session.user ? "/logout":"/login",
                date: format_time(),
                black_list:string_black_list_show
            }
        );
    });
});

var get_black_list = function(cb){
    pvp_blacklist_wrapper.get_block_list(function(reply){
        var black_list = reply;
        var black_list_show = [];
        for(var i = 0; i < black_list.length; ++i){
            var black = new Object();
            var find = false;
            var index = 0;
            for(var j = 0; j < black_list_show.length; ++j){
                if(black_list[i].device_guid == black_list_show[j].device_guid){
                    find = true;
                    index = j;
                }
            }
            if(find){
                ++black_list_show[index].count;
                var interval = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black_list_show[index].interval_total += interval;
            }else{
                black.channel = black_list[i].channel;
                black.nickname = black_list[i].nickname;
                black.device_guid = black_list[i].device_guid;
                black.score_rank = black_list[i].score_rank;
                black.championship_id = black_list[i].championship_id;
                black.score_rank_weekly = black_list[i].score_rank_weekly;
                black.score_rank_activity = black_list[i].score_rank_activity;
                black.interval_total = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black.count = 1;
                black_list_show.push(black)
            }
        }
        black_list_show.sort(asce_rank);
        var string_black_list_show = "";
        for(var j = 0; j < black_list_show.length; ++j){
            black_list_show[j].interval_average = black_list_show[j].interval_total / black_list_show[j].count;
            string_black_list_show += JSON.stringify(black_list_show[j]);
        }
        cb(string_black_list_show);
    });
};

var get_black_list_by_date = function(select_date,cb){
    if(typeof select_date == "string"){
        select_date = select_date.split(' ');
    }
    var month = utils.get_month(select_date[1]);
    var day = parseInt(select_date[2]);
    var year = parseInt(select_date[3]);
    var select_date_future = new Date(year,month,day);
    var championship_id = utils.getWeek(select_date_future);
    pvp_blacklist_wrapper.get_block_list(function(reply){
        var black_list = reply;
        var black_list_show = [];
        for(var i = 0; i < black_list.length; ++i){
            var black = new Object();
            var find = false;
            var index = 0;
            for(var j = 0; j < black_list_show.length; ++j){
                if(black_list[i].device_guid == black_list_show[j].device_guid){
                    find = true;
                    index = j;
                }
            }
            if(find){
                ++black_list_show[index].count;
                var interval = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black_list_show[index].interval_total += interval;
            }else{
                black.channel = black_list[i].channel;
                black.nickname = black_list[i].nickname;
                black.device_guid = black_list[i].device_guid;
                black.score_rank = black_list[i].score_rank;
                black.championship_id = black_list[i].championship_id;
                black.score_rank_weekly = black_list[i].score_rank_weekly;
                black.score_rank_activity = black_list[i].score_rank_activity;
                black.interval_total = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black.count = 1;
                if(championship_id == black.championship_id){
                    black_list_show.push(black)
                }
            }
        }
        black_list_show.sort(asce_rank_weekly);
        var string_black_list_show = "";
        for(var j = 0; j < black_list_show.length; ++j){
            black_list_show[j].interval_average = black_list_show[j].interval_total / black_list_show[j].count;
            string_black_list_show += JSON.stringify(black_list_show[j]);
        }
        cb(string_black_list_show);
    });
};

var get_black_list_by_mm = function(cb){
    pvp_blacklist_wrapper.get_block_list(function(reply){
        var black_list = reply;
        var black_list_show = [];
        for(var i = 0; i < black_list.length; ++i){
            var black = new Object();
            var find = false;
            var index = 0;
            for(var j = 0; j < black_list_show.length; ++j){
                if(black_list[i].device_guid == black_list_show[j].device_guid){
                    find = true;
                    index = j;
                }
            }
            if(find){
                ++black_list_show[index].count;
                var interval = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black_list_show[index].interval_total += interval;
            }else{
                black.channel = black_list[i].channel;
                black.nickname = black_list[i].nickname;
                black.device_guid = black_list[i].device_guid;
                black.score_rank = black_list[i].score_rank;
                black.championship_id = black_list[i].championship_id;
                black.score_rank_weekly = black_list[i].score_rank_weekly;
                black.score_rank_activity = black_list[i].score_rank_activity;
                black.interval_total = (black_list[i].record_time - black_list[i].upload_last_time)/1000;
                black.count = 1;
                if("000013" == black.channel){
                    black_list_show.push(black)
                }
            }
        }
        black_list_show.sort(asce_rank_activity);
        var string_black_list_show = "";
        for(var j = 0; j < black_list_show.length; ++j){
            black_list_show[j].interval_average = black_list_show[j].interval_total / black_list_show[j].count;
            string_black_list_show += JSON.stringify(black_list_show[j]);
        }
        cb(string_black_list_show);
    });
};

router.post('/', function(req, res) {
    var result = {
        code :200
    };
    var type = req.body.type;
    var device_guid = req.body.device_guid;
    if(type == "del"){
        pvp_blacklist_wrapper.disappear_from_rank_pvp(device_guid);
        return  res.end(JSON.stringify(result) + '\n', 'utf8');
    }else if(type == "restore"){
        pvp_blacklist_wrapper.display_rank_pvp(device_guid);
        return  res.end(JSON.stringify(result) + '\n', 'utf8');
    }else if(type == "date"){
        var select_date = req.body.select_date;
        get_black_list_by_date(select_date,function(string_black_list_show){
            result.string_black_list_show = string_black_list_show;
            return  res.end(JSON.stringify(result) + '\n', 'utf8');
        });
    }else if(type == "mm"){
        var checked = req.body.checked;
        if("true" == checked){
            get_black_list_by_mm(function(string_black_list_show){
                result.string_black_list_show = string_black_list_show;
                return  res.end(JSON.stringify(result) + '\n', 'utf8');
            });
        }else{
            get_black_list(function(string_black_list_show){
                result.string_black_list_show = string_black_list_show;
                return  res.end(JSON.stringify(result) + '\n', 'utf8');
            });
        }
    }
});
module.exports = router;
