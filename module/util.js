/**
 * Created by King Lee on 2014/10/17.
 */
var utils = module.exports;

//  current is the x week
utils.getWeek = function (date) {
    var onejan = new Date(date.getFullYear(), 0, 1);
    //	delay_day ,such as 3,that means wednesday is the first day of new week
    var delay_day = 3;
    return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1 + delay_day) / 7);
};

utils.genNormalDistributionValue1 = function( e, v )
{
    var variable_e = 2.718281828;
    var variable_pi = 3.141592654;
    if(0){
        var u1	= Math.random();
        var u2	= Math.random();
        return e + v * Math.sqrt( -2.0 * ( Math.log( u1 ) / Math.log( variable_e ) ) ) * Math.cos( 2.0 * variable_pi * u2 );
    }else{
        var rand1 = Math.random();
        rand1 = -2.0 * Math.log( rand1 ) / Math.log( variable_e );
        var rand2 = Math.random() * 2 * variable_pi;
        return e + v * Math.sqrt( rand1 ) * Math.cos( rand2 );
    }
};

utils.genNormalDistributionValue2 = function(min_value, max_value, e, v )
{
    var random_value = 0.0;
    do
    {
        random_value = utils.genNormalDistributionValue1( e, v );
    } while ( random_value < min_value || random_value > max_value );

    return random_value;
};

utils.genRandom = function(  e,  min_value,  offset )
{
    return utils.genNormalDistributionValue2( min_value, e + offset, e, ( e - min_value ) / 2.5 );
};

utils.get_month = function (month_string){
    var month = 0;
    switch(month_string){
        case "Jan":{
            month = 0;
            break;
        }
        case "Feb":{
            month = 1;
            break;
        }
        case "Mar":{
            month = 2;
            break;
        }
        case "Apr":{
            month = 3;
            break;
        }
        case "May":{
            month = 4;
            break;
        }
        case "Jun":{
            month = 5;
            break;
        }
        case "Jul":{
            month = 6;
            break;
        }
        case "Aug":{
            month = 7;
            break;
        }
        case "Sep":{
            month = 8;
            break;
        }
        case "Oct":{
            month = 9;
            break;
        }
        case "Nov":{
            month = 10;
            break;
        }
        case "Dec":{
            month = 11;
            break;
        }
        default :{
            break;
        }
    }
    return month;
};