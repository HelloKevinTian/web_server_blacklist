/**
 * Created by King Lee on 2015/1/5.
 */
var redis_pools = require("../nosql/redis_pools");
var async = require('async');
var log4js = require('log4js');
var util = require('../module/util');
var log_json = require('../config/log.json');
log4js.configure(log_json);
var rank_for_pvp_logger = log4js.getLogger('rank-for-pvp-logger');

var redis_rank_pvp_wrapper = module.exports;

var h_rank_pvp = 'h_rank_pvp';
var z_rank_pvp_score = 'z_rank_pvp_score';
var z_rank_pvp_strength = 'z_rank_pvp_strength';
var h_award_pvp = 'h_award_pvp';
var h_rank_pvp_cheat = 'h_rank_pvp_cheat';
var h_blacklist = 'h_blacklist';

/**
 * add rank info at first enter pvp
 * @param device_guid
 * @param rank_info
 */
redis_rank_pvp_wrapper.set_rank_info = function(channel,device_guid,rank_info,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hset(h_rank_pvp, device_guid, JSON.stringify(rank_info), function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
    var championship_id = util.getWeek(new Date());
    redis_pools.execute('pool_1',function(client, release) {
        client.hset(h_rank_pvp + ":" + championship_id, device_guid, JSON.stringify(rank_info), function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });

    redis_pools.execute('pool_1', function (client, release) {
        client.hset(h_rank_pvp + ":" + channel, device_guid, JSON.stringify(rank_info), function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
};

/**
 * get rank info form redis
 * @param device_guid
 * @param cb
 */
redis_rank_pvp_wrapper.get_rank_info = function(device_guid,device_emui,cb){
    //  use device_guid first, if not exist,try device_emui
    redis_pools.execute('pool_1',function(client, release) {
        client.hget(h_rank_pvp, device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            if(!reply){
                redis_pools.execute('pool_1',function(client, release) {
                    client.hget(h_rank_pvp, device_emui, function (err, reply) {
                        if (err) {
                            //  some thing log
                            rank_for_pvp_logger.error(err);
                        }
                        if(reply){
                            //  copy data from device_emui to device_guid
                            var rank_info = JSON.parse(reply);
                            //  clear data
                            //rank_info.phone_number = "";
                            //rank_info.nickname = "跑男车手";
                            //rank_info.area = "滨海市";
                            redis_rank_pvp_wrapper.set_rank_info(rank_info.channel,device_emui,rank_info,function(){});
                            rank_info.device_guid = device_guid;
                            redis_rank_pvp_wrapper.dump_rank_pvp(rank_info);
                            reply = JSON.stringify(rank_info);
                        }
                        cb(reply);
                        release();
                    });
                });
            }else{
                cb(reply);
            }
            release();
        });
    });
};

/**
 * get rank info form redis batch
 * @param device_guid
 * @param cb
 */
redis_rank_pvp_wrapper.get_rank_info_batch = function(device_guid_array,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hmget(h_rank_pvp, device_guid_array, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

redis_rank_pvp_wrapper.get_rank_info_weekly_batch = function(championship_id,device_guid_array,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hmget(h_rank_pvp + ":" + championship_id, device_guid_array, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

redis_rank_pvp_wrapper.get_rank_info_activity_batch = function(channel,device_guid_array,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hmget(h_rank_pvp + ":" + channel, device_guid_array, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * update some about area,phone info for player
 * @param device_guid
 * @param area
 * @param phone
 * @param cb
 */
redis_rank_pvp_wrapper.update_rank_info = function(device_guid,device_emui,channel,area,phone_number,nickname,cb){
    redis_rank_pvp_wrapper.get_rank_info(device_guid,device_emui,function(rank_info){
        if(rank_info){
            rank_info = JSON.parse(rank_info);
            rank_info.area = area;
            rank_info.phone_number = phone_number;
            rank_info.nickname = nickname;
            redis_rank_pvp_wrapper.set_rank_info(channel,device_guid,rank_info,function(){});
        }
        cb(rank_info);
    });
};

/**
 * update score to rank/rank weekly
 * @param device_guid
 * @param championship_id : the week index
 * @param score : the latest score
 */
redis_rank_pvp_wrapper.update_score_rank = function(channel,device_guid,championship_id,rank_info){
    //  avoid score is 0 in redis
    if(0 != rank_info.score){
        redis_pools.execute('pool_1',function(client, release) {
            client.zadd(z_rank_pvp_score, rank_info.score,device_guid, function (err, reply) {
                if (err) {
                    //  some thing log
                    rank_for_pvp_logger.error(err);
                }
                release();
            });
        });
    }
    //  avoid score_weekly is 0 in redis
    if(0 != rank_info.score_weekly){
        redis_pools.execute('pool_1',function(client, release) {
            client.zadd(z_rank_pvp_score + ":" + championship_id, rank_info.score_weekly,device_guid, function (err, reply) {
                if (err) {
                    //  some thing log
                    rank_for_pvp_logger.error(err);
                }
                release();
            });
        });
    }
    //  avoid score_activity is 0 in redis
    if (0 != rank_info.score_activity) {
        redis_pools.execute('pool_1', function (client, release) {
            client.zadd(z_rank_pvp_score + ":" + channel, rank_info.score_activity, device_guid, function (err, reply) {
                if (err) {
                    //  some thing log
                    rank_for_pvp_logger.error(err);
                }
                release();
            });
        });
    }
};

/**
 * get rank by score
 * @param device_guid
 * @param cb
 */
redis_rank_pvp_wrapper.get_score_rank = function(device_guid,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrank(z_rank_pvp_score,device_guid,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * get score rank from 1 to 10
 * @param cb
 */
redis_rank_pvp_wrapper.get_score_rank_partial = function(cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrange(z_rank_pvp_score,0,9,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * get rank by score weekly
 * @param device_guid
 * @param championship_id
 * @param cb
 */
redis_rank_pvp_wrapper.get_score_rank_weekly = function(device_guid,championship_id,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrank(z_rank_pvp_score + ":" + championship_id,device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

redis_rank_pvp_wrapper.get_score_rank_activity = function(device_guid,channel,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrank(z_rank_pvp_score + ":" + channel,device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * get the top 10 by score weekly
 * @param championship_id
 * @param cb
 */
redis_rank_pvp_wrapper.get_score_rank_partial_weekly = function(championship_id,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrange(z_rank_pvp_score + ":" + championship_id,0,9,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

redis_rank_pvp_wrapper.get_score_rank_partial_activity = function(channel,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrevrange(z_rank_pvp_score + ":" + channel,0,9,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * get current week's rank info
 * @param championship_id
 * @param cb
 */
redis_rank_pvp_wrapper.get_all_rank_info_weekly = function(championship_id,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hgetall(h_rank_pvp + ":" + championship_id,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * set award
 * @param device_guid
 * @param award_info
 */
redis_rank_pvp_wrapper.set_award = function(device_guid,award_info){
    redis_pools.execute('pool_1',function(client, release) {
        client.hset(h_award_pvp,device_guid, JSON.stringify(award_info),function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
};

/**
 * get award
 * @param device_guid
 * @param cb
 */
redis_rank_pvp_wrapper.get_award = function(device_guid,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hget(h_award_pvp,device_guid,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * del award
 * @param device_guid
 */
redis_rank_pvp_wrapper.del_award = function(device_guid){
    redis_pools.execute('pool_1',function(client, release) {
        client.hdel(h_award_pvp,device_guid,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
};

/**
 * update score to rank
 * @param device_guid
 * @param strength
 */
redis_rank_pvp_wrapper.update_strength_rank = function(device_guid,strength){
    redis_pools.execute('pool_1',function(client, release) {
        client.zadd(z_rank_pvp_strength, strength,device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
};

/**
 * get rank by strength
 * @param device_guid
 * @param cb
 */
redis_rank_pvp_wrapper.get_strength_rank = function(device_guid,cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.rank(z_rank_pvp_strength,device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

redis_rank_pvp_wrapper.get_player_by_strength = function(min,max,count,cb){
    redis_pools.execute('pool_1',function(client, release) {
        //  offset form the first result
        var offset = 0;
        var args = [ z_rank_pvp_strength, min, max, 'LIMIT', offset, count ];
        client.zrangebyscore(args, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            cb(reply);
            release();
        });
    });
};

/**
 * dump rank info from device emui to device guid
 */
redis_rank_pvp_wrapper.dump_rank_pvp = function(rank_info){
    var channel = rank_info.channel;
    var device_guid = rank_info.device_guid;
    var strength = rank_info.strength;
    var championship_id = util.getWeek(new Date());
    if(championship_id != rank_info.championship_id){
        rank_info.score_weekly = 0;
    }
    redis_rank_pvp_wrapper.set_rank_info(channel,device_guid,rank_info,function(){});
    redis_rank_pvp_wrapper.update_score_rank(channel,device_guid,championship_id,rank_info);
    redis_rank_pvp_wrapper.update_strength_rank(device_guid,strength);
};

redis_rank_pvp_wrapper.record_cheat_info = function(device_guid,rank_info){
    redis_pools.execute('pool_1',function(client, release) {
        client.hset(h_rank_pvp_cheat,Date.now(), JSON.stringify(rank_info),function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
};
///////////////////////////////////////////////
redis_rank_pvp_wrapper.get_block_list = function(cb){
    redis_pools.execute('pool_1',function(client, release) {
        client.hgetall(h_rank_pvp_cheat,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            var cheat_list = [];
            for(var v in reply){
                if(reply[v]){
                    var rank_info = JSON.parse(reply[v]);
                    rank_info.record_time = v;
                    cheat_list.push(rank_info);
                }
            }
            var count = 0;
            async.whilst(
                function () { return count < cheat_list.length; },
                function (callback) {
                    async.parallel([
                        function(callback){
                            redis_rank_pvp_wrapper.get_score_rank(cheat_list[count].device_guid,function(reply){
                                callback(null,reply);
                            });
                        },
                        function(callback){
                            redis_rank_pvp_wrapper.get_score_rank_weekly(cheat_list[count].device_guid,cheat_list[count].championship_id,function(reply){
                                callback(null,reply);
                            });
                        },
                        function(callback){
                            redis_rank_pvp_wrapper.get_score_rank_activity(cheat_list[count].device_guid,cheat_list[count].channel,function(reply){
                                callback(null,reply);
                            });
                        }
                    ],
                        // optional callback
                        function (err, result) {
                            if (err) {
                                console.error(err);
                            }
                            cheat_list[count].score_rank = result[0]?(result[0] + 1):999999;
                            cheat_list[count].score_rank_weekly = result[1]?(result[1] + 1):999999;
                            cheat_list[count].score_rank_activity = result[2]?(result[2] + 1):999999;
                            ++count;
                            callback(null);
                        });
                },
                function (err) {
                    //  whilst end,do nothing
                    if(err){
                        console.error(err);
                    }
                    cb(cheat_list);
                }
            );
            release();
        });
    });
};

redis_rank_pvp_wrapper.disappear_from_rank_pvp = function(device_guid){
    redis_pools.execute('pool_1',function(client, release) {
        client.zrem(z_rank_pvp_score,device_guid,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
    var championship_id = util.getWeek(new Date());
    redis_pools.execute('pool_1',function(client, release) {
        client.zrem(z_rank_pvp_score + ":" + championship_id,device_guid,function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            release();
        });
    });
    redis_pools.execute('pool_1',function(client, release) {
        client.hget(h_rank_pvp, device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            if(reply){
                var rank_info = JSON.parse(reply);
                redis_pools.execute('pool_1',function(client, release) {
                    client.zrem(z_rank_pvp_score + ":" + rank_info.channel,device_guid,function (err, reply) {
                        if (err) {
                            //  some thing log
                            rank_for_pvp_logger.error(err);
                        }
                        release();
                    });
                });
                rank_info.blocked = 1;
                redis_rank_pvp_wrapper.set_rank_info(rank_info.channel,device_guid,rank_info,function(){});
            }
            release();
        });
    });
};

redis_rank_pvp_wrapper.display_rank_pvp = function(device_guid){
    redis_pools.execute('pool_1',function(client, release) {
        client.hget(h_rank_pvp, device_guid, function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            if(reply){
                var rank_info = JSON.parse(reply);
                redis_rank_pvp_wrapper.update_score_rank(rank_info.channel,rank_info.device_guid,rank_info.championship_id,rank_info);
                rank_info.blocked = 0;
                redis_rank_pvp_wrapper.set_rank_info(rank_info.channel,device_guid,rank_info,function(){});
            }
            release();
        });
    });
};

redis_rank_pvp_wrapper.add_blacklist = function(black){
    redis_pools.execute('pool_1',function(client, release) {
        client.hset(h_blacklist,black.device_guid, JSON.stringify(black),function (err, reply) {
            if (err) {
                //  some thing log
                rank_for_pvp_logger.error(err);
            }
            rank_for_pvp_logger.debug(black);
            release();
        });
    });
};
