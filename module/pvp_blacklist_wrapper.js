/**
 * Created by King Lee on 15-2-3.
 */

var redis_rank_pvp_wrapper = require('../nosql/redis_rank_pvp_wrapper');
var utils =  require('./util');
var pvp_blacklist_wrapper = module.exports;

pvp_blacklist_wrapper.get_block_list = function(cb){
    redis_rank_pvp_wrapper.get_block_list(cb);
};

pvp_blacklist_wrapper.disappear_from_rank_pvp = function(device_guid){
    redis_rank_pvp_wrapper.disappear_from_rank_pvp(device_guid);
};

pvp_blacklist_wrapper.display_rank_pvp = function(device_guid){
    redis_rank_pvp_wrapper.display_rank_pvp(device_guid);
};

pvp_blacklist_wrapper.init = function(){
    var time_interval = 3600*1000;
    var max_count = 3000;
    var championship_id = utils.getWeek(new Date());
    setInterval(function(){
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
            for(var j = 0; j < black_list_show.length; ++j){
                if(black_list_show[j].count >= max_count){
                    redis_rank_pvp_wrapper.disappear_from_rank_pvp(black_list_show[j].device_guid);
                }
            }
        })
    },time_interval);
};
