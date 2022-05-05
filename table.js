function getCookie(name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function formatDate(date)
{
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}
function pad(n)
{
    return (n < 10) ? ("0" + n) : n;
}

var month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var first = $(".sites.first .btn-active").data("id");
var second = $(".sites.second .btn-active").data("id");
var dif2 = commission_config[first];
var dif1 = commission_config[second];
var loading = false;
var pagination = false;
var lastRefresh;
var sort = 0;

var item_list_data = [];
var item_list = [];
var currencies;

var per_page = 50;
var page = 1;
var last_page = false;

var alert = new Audio('/table/js/alert.mp3');

var curXPos, curDown, isClick;
isClick = true;

var likes = [];
if(localStorage.getItem("likes") != null)
{
    likes = localStorage.getItem("likes").split(",");
}

var black_list = [];
if(localStorage.getItem("black-list" + game_id) != null)
{
    black_list = JSON.parse(localStorage.getItem("black-list" + game_id));
}

var scroll1 = 0;
var scroll2 = 0;
if(localStorage.getItem("scroll_1_" + game_id) != null)
{
    scroll1 = parseInt(localStorage.getItem("scroll_1_" + game_id));
}
if(localStorage.getItem("scroll_2_" + game_id) != null)
{
    scroll2 = parseInt(localStorage.getItem("scroll_2_" + game_id));
}
if(localStorage.getItem("filter_opened") != null)
{
    if (localStorage.getItem("filter_opened") == 1)
    {
        $("#filter-button").toggleClass("opened");
        $("#filter-content").show();
    }
}

var dep_left = false;
var dep_right = false;
if(getCookie('dep_left') != null)
{
    if (getCookie('dep_left') == 1) {
        dep_left = true;
    }
}
if(getCookie('dep_right') != null)
{
    if (getCookie('dep_right') == 1) {
        dep_right = true;
    }
}


function rebuildBlackList()
{
    if(black_list.length > 0)
    {
        var content = '';
        var checked = 0;
        $.each(black_list, function(index, value){
            content += '<tr><td>' + value["phrase"] + '</td><td style="text-align: center;padding: 0;">';
            content += '<input class="tgl tgl-skewed phrase-tgl" data-id="' + index + '" id="black_list_checkbox' + index + '" type="checkbox"' + (value["enabled"]? " checked" : "" ) + '>';
            content += '<label style="width: 3em;margin-top:4px;" class="tgl-btn small" data-tg-off="OFF" data-tg-on="ON" for="black_list_checkbox' + index + '"></label></td>';
            content += '<td><span class="remove-phrase" data-id="' + index + '">&#10006;</span></td></tr>';
            if(value["enabled"])
            {
                ++checked;
            }
        });
        content += '<tr><td></td><td style="text-align: center;padding: 0;height:37px;"><input class="tgl tgl-skewed" id="black_list_checkbox_all" type="checkbox"' + (checked == black_list.length ? " checked" : "" ) + '><label style="width: 3em;margin-top:4px;" class="tgl-btn small" data-tg-off="OFF" data-tg-on="ON" for="black_list_checkbox_all"></label></td><td></td></tr>';
        $("#black-list-table tbody").html(content);
        $(".remove-phrase").click(function(){
            var id = $(this).attr("data-id");
            black_list.splice(id, 1);
            rebuildBlackList();
            saveBlackList();
            rebuildList();
        });
        $(".phrase-tgl").on("change", function(){
            var id = $(this).attr("data-id");
            black_list[id]["enabled"] = $(this).prop("checked");
            $("#black_list_checkbox_all").prop("checked", black_list.length ==  $(".phrase-tgl:checked").length);
            saveBlackList();
            rebuildList();
        });
        $("#black_list_checkbox_all").on("change", function(){
            var enabled = $("#black_list_checkbox_all").prop("checked");
            $(".phrase-tgl").prop("checked", enabled);
            $.each(black_list, function(index, value){
                value["enabled"] = enabled;
            });
            saveBlackList();
            rebuildList();
        });
    }
    else
    {
        $("#black-list-table tbody").html("<tr><td colspan='3' style='text-align: center;'>Список правил пуст.</td></tr>");
    }
}

function saveBlackList()
{
    localStorage.setItem("black-list" + game_id, JSON.stringify(black_list));
}

function rebuildListCommon()
{
    var filter_n1 = $("#n1").val();
    if(filter_n1 != "" && !dep_left)
    {
        filter_n1 = parseInt(filter_n1);
        if(!isNaN(filter_n1) && filter_n1 != 0)
        {
            item_list = item_list.filter(function(value){
                return value.c1 >= filter_n1;
            });
        }
    }

    var filter_n2 = $("#n2").val();
    if(filter_n2 != "" && !dep_right)
    {
        filter_n2 = parseInt(filter_n2);
        if(!isNaN(filter_n1) && filter_n2 != 0)
        {
            item_list = item_list.filter(function(value){
                return value.c2 >= filter_n2;
            });
        }
    }

    var filter_n_1 = $("#n_1").val();
    if(filter_n_1 != "" && !dep_left)
    {
        filter_n_1 = parseInt(filter_n_1);
        if(!isNaN(filter_n_1))
        {
            item_list = item_list.filter(function(value){
                return value.c1 <= filter_n_1;
            });
        }
    }

    var filter_n_2 = $("#n_2").val();
    if(filter_n_2 != "" && !dep_right)
    {
        filter_n_2 = parseInt(filter_n_2);
        if(!isNaN(filter_n_2))
        {
            item_list = item_list.filter(function (value) {
                return value.c2 <= filter_n_2;
            });
        }
    }

    var filter_bot1 = $("#bot1").val();
    if(filter_bot1 != "" && !dep_left)
    {
        filter_bot1 = parseInt(filter_bot1);
        if(!isNaN(filter_bot1))
        {
            item_list = item_list.filter(function (value) {
                return filter_bot1 in value.b1 && value.b1[filter_bot1] != 0;
            });
        }
    }

    var filter_bot2 = $("#bot2").val();
    if(filter_bot2 != "" && !dep_right)
    {
        filter_bot2 = parseInt(filter_bot2);
        if(!isNaN(filter_bot2))
        {
            item_list = item_list.filter(function (value) {
                return filter_bot2 in value.b2 && value.b2[filter_bot2] != 0;
            });
        }
    }

    var filter_price1_from = $("#price1_from").val();
    if(filter_price1_from != "")
    {
        filter_price1_from.replace(/\,/g,'.');
        filter_price1_from = parseFloat(filter_price1_from);
        if(!isNaN(filter_price1_from) && filter_price1_from != 0)
        {
            item_list = item_list.filter(function(value){
                var p;
                if (dep_left) {
                    if(price_rub.includes(first))
                    {
                        p = value.pd1 / currencies["USD"];
                    }
                    else if(price_eur.includes(first))
                    {
                        p = value.pd1 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(first))
                    {
                        p = value.pd1 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.pd1;
                    }
                } else {
                    if(price_rub.includes(first))
                    {
                        p = value.p1 / currencies["USD"];
                    }
                    else if(price_eur.includes(first))
                    {
                        p = value.p1 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(first))
                    {
                        p = value.p1 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.p1;
                    }
                }
                return p >= filter_price1_from;
            });
        }
    }

    var filter_price2_from = $("#price2_from").val();
    if(filter_price2_from != "")
    {
        filter_price2_from.replace(/\,/g,'.');
        filter_price2_from = parseFloat(filter_price2_from);
        if(!isNaN(filter_price2_from) && filter_price2_from != 0)
        {
            item_list = item_list.filter(function(value){
                var p;
                if (dep_left) {
                    if(price_rub.includes(second))
                    {
                        p = value.pd2 / currencies["USD"];
                    }
                    else if(price_eur.includes(second))
                    {
                        p = value.pd2 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(second))
                    {
                        p = value.pd2 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.pd2;
                    }
                } else {
                    if(price_rub.includes(second))
                    {
                        p = value.p2 / currencies["USD"];
                    }
                    else if(price_eur.includes(second))
                    {
                        p = value.p2 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(second))
                    {
                        p = value.p2 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.p2;
                    }
                }
                return p >= filter_price2_from;
            });
        }
    }

    var filter_price1_to = $("#price1_to").val();
    if(filter_price1_to != "")
    {
        filter_price1_to.replace(/\,/g,'.');
        filter_price1_to = parseFloat(filter_price1_to);
        if(!isNaN(filter_price1_to) && filter_price1_to != 0)
        {
            item_list = item_list.filter(function(value){
                var p;
                if (dep_left) {
                    if(price_rub.includes(first))
                    {
                        p = value.pd1 / currencies["USD"];
                    }
                    else if(price_eur.includes(first))
                    {
                        p = value.pd1 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(first))
                    {
                        p = value.pd1 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.pd1;
                    }
                } else {
                    if(price_rub.includes(first))
                    {
                        p = value.p1 / currencies["USD"];
                    }
                    else if(price_eur.includes(first))
                    {
                        p = value.p1 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(first))
                    {
                        p = value.p1 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.p1;
                    }
                }
                return p <= filter_price1_to;
            });
        }
    }

    var filter_price2_to = $("#price2_to").val();
    if(filter_price2_to != "")
    {
        filter_price2_to.replace(/\,/g,'.');
        filter_price2_to = parseFloat(filter_price2_to);
        if(!isNaN(filter_price2_to) && filter_price2_to != 0)
        {
            item_list = item_list.filter(function (value) {
                var p;
                if (dep_left) {
                    if(price_rub.includes(second))
                    {
                        p = value.pd2 / currencies["USD"];
                    }
                    else if(price_eur.includes(second))
                    {
                        p = value.pd2 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(second))
                    {
                        p = value.pd2 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.pd2;
                    }
                } else {
                    if(price_rub.includes(second))
                    {
                        p = value.p2 / currencies["USD"];
                    }
                    else if(price_eur.includes(second))
                    {
                        p = value.p2 * currencies["EUR"] / currencies["USD"]
                    }
                    else if(price_cny.includes(second))
                    {
                        p = value.p2 / currencies["CNY"];
                    }
                    else
                    {
                        p = value.p2;
                    }
                }
                return p <= filter_price2_to;
            });
        }
    }

    var filter_per1_from = $("#per1_from").val();
    if(filter_per1_from != "")
    {
        filter_per1_from.replace(/\,/g,'.');
        filter_per1_from = parseFloat(filter_per1_from);
        if(!isNaN(filter_per1_from))
        {
            item_list = item_list.filter(function(value){
                return value.r1 >= filter_per1_from;
            });
        }
    }

    var filter_per2_from = $("#per2_from").val();
    if(filter_per2_from != "")
    {
        filter_per2_from.replace(/\,/g,'.');
        filter_per2_from = parseFloat(filter_per2_from);
        if(!isNaN(filter_per2_from))
        {
            item_list = item_list.filter(function (value) {
                return value.r2 >= filter_per2_from;
            });
        }
    }

    var filter_per1_to = $("#per1_to").val();
    if(filter_per1_to != "")
    {
        filter_per1_to.replace(/\,/g,'.');
        filter_per1_to = parseFloat(filter_per1_to);
        if(!isNaN(filter_per1_to))
        {
            item_list = item_list.filter(function (value) {
                return value.r1 <= filter_per1_to;
            });
        }
    }

    var filter_per2_to = $("#per2_to").val();
    if(filter_per2_to != "")
    {
        filter_per2_to.replace(/\,/g,'.');
        filter_per2_to = parseFloat(filter_per2_to);
        if(!isNaN(filter_per2_to))
        {
            item_list = item_list.filter(function (value) {
                return value.r2 <= filter_per2_to;
            });
        }
    }

    var filter_overstock = $("#overstock_checkbox").prop("checked") ? true : false;
    if(filter_overstock == false)
    {
        item_list = item_list.filter(function(value){
            return value.o1 != 1 && value.o2 != 1;
        });
    }

    if(link_config['lk'])
    {
        var filter_like = $("#like_checkbox").prop("checked") ? true : false;
        if(filter_like == true)
        {
            item_list = item_list.filter(function(value){
                return likes.includes(value.id);
            });
        }
    }

    var filter_name = $("#name").val().toLowerCase().replace(/[\(\)\|]/g, "").replace(/[\-]/g, " ").replace(/\s{2,}/g, " ").trim();
    if(filter_name != "")
    {
        item_list = item_list.filter(function(value){
            return value.i_.includes(filter_name);
        });
    }

    var filter_time1 = $("#time1").val();
    if(filter_time1 != "" && first != 28 && first != 95 && first != 158 && first != 159)
    {
        filter_time1 = parseInt(filter_time1);
        if(!isNaN(filter_time1))
        {
            item_list = item_list.filter(function (value) {
                if (!dep_left && value.d1 == null) return true;
                if (dep_left && value.dd1 == null) return false;
                var now = new Date();
                var diff = now - (dep_left ? value.dd1 : value.d1);
                return diff / 1000 / 60 <= filter_time1;
            });
        }
    }

    var filter_time2 = $("#time2").val();
    if(filter_time2 != "" && second != 28 && second != 95 && second != 158 && second != 159)
    {
        filter_time2 = parseInt(filter_time2);
        if(!isNaN(filter_time2))
        {
            item_list = item_list.filter(function (value) {
                if (!dep_left && value.d2 == null) return true;
                if (dep_left && value.dd2 == null) return false;
                var now = new Date();
                var diff = now - (dep_right ? value.dd2 : value.d2);
                return diff / 1000 / 60 <= filter_time2;
            });
        }
    }

    if($("#op1").length)
    {
        var filter_c7 = $("#op1").val();
        if(filter_c7 != "")
        {
            filter_c7 = parseInt(filter_c7);
            if(!isNaN(filter_c7) && filter_c7 != 0)
            {
                item_list = item_list.filter(function (value) {
                    return value.c7 >= filter_c7;
                });
            }
        }
    }

    var filter_c7_sc = $("#sc1").val();
    if(filter_c7_sc != "")
    {
        filter_c7_sc = parseInt(filter_c7_sc);
        if(!isNaN(filter_c7_sc) && filter_c7_sc != 0)
        {
            item_list = item_list.filter(function (value) {
                return value.c7_sc >= filter_c7_sc;
            });
        }
    }

    if($("#bs1").length)
    {
        var filter_c7_bs = $("#bs1").val();
        if(filter_c7_bs != "")
        {
            filter_c7_bs = parseInt(filter_c7_bs);
            if(!isNaN(filter_c7_bs) && filter_c7_bs != 0)
            {
                item_list = item_list.filter(function (value) {
                    return value.c7_bs >= filter_c7_bs;
                });
            }
        }
    }

    if($("#tm1").length)
    {
        var filter_c7_tm = $("#tm1").val();
        if(filter_c7_tm != "")
        {
            filter_c7_tm = parseInt(filter_c7_tm);
            if(!isNaN(filter_c7_tm) && filter_c7_tm != 0)
            {
                item_list = item_list.filter(function (value) {
                    return value.c7_tm >= filter_c7_tm;
                });
            }
        }
    }

    if(black_list.length > 0)
    {
        item_list = item_list.filter(function(value){
            var result = true;
            $.each(black_list, function(index, value1){
                if(value1["enabled"] && value.i.toString().toLowerCase().includes(value1["phrase"].toLowerCase())){
                    result = false;
                    return true;
                }
            });
            return result;
        });
    }

    if (dep_left) {
        item_list = item_list.filter(function (value) {
            return value.pd1 != null;
        });
    }

    switch(sort)
    {
        case 2:
            item_list.sort(function(a,b) {
                var pa = dep_left ? a.pd1 : a.p1;
                var pb = dep_left ? b.pd1 : b.p1;
                return (pa < pb) ? 1 : ((pb < pa) ? -1 : 0);
            } );
            break;
        case 3:
            item_list.sort(function(a,b) {
                var pa = dep_right ? a.pd2 : a.p2;
                var pb = dep_right ? b.pd2 : b.p2;
                return (pa < pb) ? 1 : ((pb < pa) ? -1 : 0);
            } );
            break;
        case 4:
            item_list.sort(function(a,b) {return (a.r1 < b.r1) ? 1 : ((b.r1 < a.r1) ? -1 : 0);} );
            break;
        case 5:
            item_list.sort(function(a,b) {return (a.r2 < b.r2) ? 1 : ((b.r2 < a.r2) ? -1 : 0);} );
            break;
    }

    var content = "";
    var count = 0;
    if(item_list.length != 0)
    {
        $.each(item_list, function(key, value){
            content += buildRow(value);
            if(++count == per_page * page)
            {
                return false;
            }
        });
        $("#data-table tbody").html(content);

        initLinks();

        $('.price-value').dblclick(function() {
            $("#refresh_checkbox").prop("checked", false);
            $(this).prop('contenteditable',true).addClass("editable");
            window.getSelection().setPosition($(this).get(0), 1);
        });
        $('.price-value').wysiwygEvt();
    }
    else
    {
        $("#data-table tbody").html('<tr><td style="text-align: center;" colspan="' + $("#data-table tr.sort th").length + '">По заданным параметрам ничего не найдено. Измените параметры фильтров или нажмите кнопку "Сбросить". Если проблема осталась - обратитесь в техподдержку.</td></tr>');
    }

    if(count >= item_list.length)
    {
        last_page = true;
    }
}

var ts = 0;
function initLinks()
{
    var i;
    var elements;
    elements = document.getElementsByClassName("links-scroll-1");
    for (i = 0; i < elements.length; i++)
    {
        elements[i].addEventListener('wheel', function(e){
            var delta = e.deltaY > 0 ? 1 : -1;
            linksScrollHandler(delta, 1);
            e.preventDefault();
            return false;
        });
        elements[i].addEventListener('touchmove', function(e) {
            e.preventDefault();
            return false;
        });
        elements[i].addEventListener('touchstart', function(e) {
            ts = e.touches[0].clientY;
        });
        elements[i].addEventListener('touchend', function(e){
            if(Math.abs(ts - e.changedTouches[0].clientY) > 5)
            {
                var delta = ts > e.changedTouches[0].clientY ? 1 : -1;
                linksScrollHandler(delta, 1);
            }
            e.preventDefault();
            return false;
        });
    }
    if($(".links-scroll-1").length && $(".links-scroll-1")[0].scrollHeight >= scroll1 + 26)
    {
        $(".links-scroll-1").scrollTop(scroll1);
    }
    else
    {
        $(".links-scroll-1").scrollTop(0);
    }

    elements = document.getElementsByClassName("links-scroll-2");
    for (i = 0; i < elements.length; i++)
    {
        elements[i].addEventListener('wheel', function(e){
            var delta = e.deltaY > 0 ? 1 : -1;
            linksScrollHandler(delta, 2);
            e.preventDefault();
            return false;
        });
        elements[i].addEventListener('touchmove', function(e) {
            e.preventDefault();
            return false;
        });
        elements[i].addEventListener('touchstart', function(e) {
            ts = e.touches[0].clientY;
        });
        elements[i].addEventListener('touchend', function(e){
            if(Math.abs(ts - e.changedTouches[0].clientY) > 5)
            {
                var delta = ts > e.changedTouches[0].clientY ? 1 : -1;
                linksScrollHandler(delta, 2);
            }
            e.preventDefault();
            return false;
        });
    }
    if($(".links-scroll-2").length && $(".links-scroll-2")[0].scrollHeight >= scroll2 + 26)
    {
        $(".links-scroll-2").scrollTop(scroll2);
    }
    else
    {
        $(".links-scroll-2").scrollTop(0);
    }
}

function linksScrollHandler(delta, column)
{
    var links_scroll = $(".links-scroll-" + column);
    if(links_scroll[0].scrollHeight >= links_scroll.scrollTop() + 26 + 26 * delta)
    {
        links_scroll.scrollTop(links_scroll.scrollTop() + 26 * delta);
        localStorage.setItem("scroll_" + column + "_" + game_id, links_scroll.scrollTop());
        if(column == 1)
        {
            scroll1 = links_scroll.scrollTop();
        }
        else
        {
            scroll2 = links_scroll.scrollTop();
        }
    }
}

function resetCommon()
{
    $("#refresh_checkbox").prop("checked", true);
    $("#name").val('');
    $("#refresh").val(5);
    $("#price1_from").val('');
    $("#price1_to").val('');
    $("#price2_from").val('');
    $("#price2_to").val('');
    $("#time1").val(360);
    $("#time2").val(360);
    $("#bot1").val('');
    $("#bot2").val('');
    $("#n1").val(1);
    $("#n2").val(1);
    $("#n_1").val('');
    $("#n_2").val('');
    $("#per1_from").val('');
    $("#per1_to").val('');
    $("#per2_from").val('');
    $("#per2_to").val('');
    $("#op1").val(0);
    $("#tm1").val(0);
    $("#sc1").val(0);
    $("#bs1").val(0);

    setCookie("refresh_checkbox", 1);
    setCookie("name", '');
    setCookie("refresh", 5);
    setCookie("price1_from", '');
    setCookie("price1_to", '');
    setCookie("price2_from", '');
    setCookie("price2_to", '');
    setCookie("time1", 360);
    setCookie("time2", 360);
    setCookie("bot1", '');
    setCookie("bot2", '');
    setCookie("n1", 1);
    setCookie("n2", 1);
    setCookie("n_1", '');
    setCookie("n_2", '');
    setCookie("per1_from", '');
    setCookie("per1_to", '');
    setCookie("per2_from", '');
    setCookie("per2_to", '');
    setCookie("op1", 0);
    setCookie("tm1", 0);
    setCookie("sc1", 0);
    setCookie("bs1", 0);

    $("#overstock_checkbox").prop("checked", true);

    if($("#dep_left_checkbox").length) {
        $("#dep_left_checkbox").prop("checked", false);
        $("#dep_right_checkbox").prop("checked", false);
    }

    $("#alert").prop("checked", false);
    if(link_config['lk'])
    {
        $("#like_checkbox").prop("checked", false);
    }
    setCookie("overstock", 1);
    setCookie("dep_left", 0);
    setCookie("dep_right", 0);
    setCookie("alert", 0);
    setCookie("like", 0);

    $.each(black_list, function(index, value){
        value["enabled"] = false;
    });
    saveBlackList();

    rebuildList();
}

function setLike(event)
{
    var elem = $(event.target);
    var has_like = elem.hasClass("on");
    var id = elem.attr("data-like-id");
    elem.toggleClass("on");
    if(has_like)
    {
        likes.splice(likes.indexOf(id), 1);
    }
    else
    {
        likes.push(id);
    }
    localStorage.setItem("likes", likes.join(','));
}

function tryRefresh()
{
    if($("#refresh_checkbox").prop("checked"))
    {
        var ts = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
        var delay = Math.max(5, parseInt($("#refresh").val()));
        if(ts > lastRefresh + delay * 1000)
        {
            loadTableData(true);
        }
    }
    window.setTimeout(tryRefresh, 1000);
}

function loadTableData(auto)
{
    if(!loading)
    {
        loading = true;
        updateHeaders();

        $.ajax({
            url: "ajax.php",
            type: "POST",
            data: {
                site1 : first,
                site2 : second
            },
            beforeSend : function(){
                NProgress.start();
            },
            complete: function () {
                loading = false;
                lastRefresh = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
            },
            success : function(data) {
                if (data.length == 0) {
                    window.location.replace("https://skins-table.xyz/");
                    return;
                }
                data = JSON.parse(data);
                currencies = data[2];

                item_list_data = [];
                $.each(data[0], function(item_id, value){
                    if (!(item_id in item_names)) {
                        return;
                    }
                    var item = {};
                    var bots, bot;
                    item["i"] = item_names[item_id][0];
                    if (game_id == 3) {
                        item["r"] = item_names[item_id][1];
                    }
                    item["i_"] = item["i"].toString().toLowerCase().replace(/[\(\)\|]/g, "").replace(/[\-]/g, " ").replace(/\s{2,}/g, " ");
                    item["id"] = item_id;
                    if (item_id in opskins_sales) {
                        item["c7"] = opskins_sales[item_id][0];
                        if (link_config['op'] && opskins_sales[item_id][1].length != 0) {
                            item["lst"] = "<div><span style='font-size:70%;'>OPSKINS.COM (10 ПРОДАЖ)</span><br>";
                            $.each(opskins_sales[item_id][1], function (key1, value1) {
                                var ls_date = new Date(value1[0] * 1000);
                                item["lst"] += "$" + (value1[1] / 100).toFixed(2) + (value1[2] != '' ? " (" + value1[2].toFixed(3) + "%)" : "") + " " + month_names[ls_date.getMonth()] + " " + ls_date.getDate() + "," + ls_date.getFullYear() + "<br>";
                            });
                            item["lst"] += "</div>";
                        } else {
                            item["lst"] = "";
                        }
                    } else {
                        item["c7"] = 0;
                        item["lst"] = "";
                    }
                    if (item_id in bitskins_sales) {
                        item["c7_bs"] = bitskins_sales[item_id][0];
                        if (link_config['bs'] && bitskins_sales[item_id][1].length != 0) {
                            item["lst_bs"] = "<div><span style='font-size:70%;'>BITSKINS.COM (10 ПРОДАЖ)</span><br>";
                            $.each(bitskins_sales[item_id][1], function (key1, value1) {
                                var ls_date = new Date(value1[0] * 1000);
                                item["lst_bs"] += "$" + (value1[1] / 100).toFixed(2) + (value1[2] != '' ? " (" + value1[2].toFixed(3) + "%)" : "") + " " + month_names[ls_date.getMonth()] + " " + ls_date.getDate() + "," + ls_date.getFullYear() + "<br>";
                            });
                            item["lst_bs"] += "</div>";
                        } else {
                            item["lst_bs"] = "";
                        }
                    } else {
                        item["c7_bs"] = 0;
                        item["lst_bs"] = "";
                    }
                    if (item_id in steam_sales) {
                        item["c7_sc"] = steam_sales[item_id][0];
                    } else {
                        item["c7_sc"] = 0;
                    }
                    if (typeof market_sales !== 'undefined' && item_id in market_sales) {
                        item["c7_tm"] = market_sales[item_id][0];
                        if (link_config['tm'] && market_sales[item_id][1].length != 0) {
                            item["lst_tm"] = "<div><span style='font-size:70%;'>MARKET (10 ПРОДАЖ)</span><br>";
                            $.each(market_sales[item_id][1], function (key1, value1) {
                                var ls_date = new Date(value1[0] * 1000);
                                item["lst_tm"] += "<i class='glyphicon glyphicon-rub' style='font-size:9pt'></i> " + (value1[1] / 100).toFixed(2) + " " + month_names[ls_date.getMonth()] + " " + ls_date.getDate() + "," + ls_date.getFullYear() + "<br>";
                            });
                            item["lst_tm"] += "</div>";
                        } else {
                            item["lst_tm"] = "";
                        }
                    } else {
                        item["c7_tm"] = 0;
                        item["lst_tm"] = "";
                    }
                    if (value[0] != null) {
                        item["p1"] = value[0] / 100;
                    } else {
                        item["p1"] = null;
                    }
                    if (value[6] != null) {
                        item["pd1"] = value[6] / 100;
                    } else {
                        item["pd1"] = null;
                    }
                    item["b1"] = {};
                    item["c1"] = 0;
                    if (value[1] != null && value[1] != '') {
                        bots = value[1].split(",");
                        $.each(bots, function (key1, value1) {
                            bot = value1.split(":");
                            bot[1] = parseInt(bot[1]);
                            item["b1"][bot[0]] = bot[1];
                            item["c1"] += bot[1];
                        });
                    }
                    if (value[2] != null)
                        item["d1"] = new Date(value[2] * 1000);
                    else
                        item["d1"] = null;
                    if (value[7] != null)
                        item["dd1"] = new Date(value[7] * 1000);
                    else
                        item["dd1"] = null;
                    if (3 in value)
                        item["o1"] = value[3];
                    else
                        item["o1"] = null;
                    if (4 in value)
                        item["a1"] = value[4];
                    else
                        item["a1"] = null;
                    if (5 in value && value[5] != 0) {
                        item["l1"] = Math.ceil(value[5] / 86400);
                        item["l1_"] = value[5];
                    } else {
                        item["l1"] = null;
                    }
                    if (data[1] != null && item_id in data[1]) {
                        if (data[1][item_id][0] != null) {
                            item["p2"] = data[1][item_id][0] / 100;
                        } else {
                            item["p2"] = null;
                        }
                        if (data[1][item_id][6] != null) {
                            item["pd2"] = data[1][item_id][6] / 100;
                        } else {
                            item["pd2"] = null;
                        }

                        item["b2"] = {};
                        item["c2"] = 0;
                        if (data[1][item_id][1] != null && data[1][item_id][1] != '') {
                            bots = data[1][item_id][1].split(",");
                            $.each(bots, function (key1, value1) {
                                bot = value1.split(":");
                                bot[1] = parseInt(bot[1]);
                                item["b2"][bot[0]] = bot[1];
                                item["c2"] += bot[1];
                            });
                        }
                        if (data[1][item_id][2] != null)
                            item["d2"] = new Date(data[1][item_id][2] * 1000);
                        else
                            item["d2"] = null;
                        if (data[1][item_id][7] != null)
                            item["dd2"] = new Date(data[1][item_id][7] * 1000);
                        else
                            item["dd2"] = null;
                        if (3 in data[1][item_id])
                            item["o2"] = data[1][item_id][3];
                        else
                            item["o2"] = null;
                        if (4 in data[1][item_id])
                            item["a2"] = data[1][item_id][4];
                        else
                            item["a2"] = null;
                        if (5 in data[1][item_id] && data[1][item_id][5] != 0) {
                            item["l2"] = Math.ceil(data[1][item_id][5] / 86400);
                            item["l2_"] = data[1][item_id][5];
                        } else {
                            item["l2"] = null;
                        }
                    } else {
                        item["p2"] = null;
                        item["b2"] = [];
                        item["c2"] = 0;
                        item["d2"] = null;
                        item["o2"] = null;
                        item["a2"] = null;
                        item["l1"] = null;
                        item["l2"] = null;
                    }
                    item_list_data.push(item);
                });

                $.each(item_list_data, function(key, value){
                    if(value["p2"] != null)
                    {
                        var price1, price2 = null;
                        if(price_rub.includes(first))
                            price1 = Math.round(value["p1"] * 100 / currencies['USD']);
                        else if(price_eur.includes(first))
                            price1 = Math.round(value["p1"] * 100 * currencies['EUR'] / currencies['USD']);
                        else if(price_cny.includes(first))
                            price1 = Math.round(value["p1"] * 100 / currencies['CNY']);
                        else
                            price1 = value["p1"] * 100;
                        if(price_rub.includes(second))
                            price2 = Math.round(value["p2"] * 100 / currencies['USD']);
                        else if(price_eur.includes(second))
                            price2 = Math.round(value["p2"] * 100 * currencies['EUR'] / currencies['USD']);
                        else if(price_cny.includes(second))
                            price2 = Math.round(value["p2"] * 100 / currencies['CNY']);
                        else
                            price2 = value["p2"] * 100;

                        var price1_1;
                        var price2_2;
                        if(csgotm.includes(first) && discount_config['csgotm'] != 0)
                            price1_1 = Math.round(price1 * (1 - discount_config['csgotm'] / 100) * 100) / 100;
                        else
                            price1_1 = price1;
                        if(csgotm.includes(second) && discount_config['csgotm'] != 0)
                            price2_2 = Math.round(price2 * (1 - discount_config['csgotm'] / 100) * 100) / 100;
                        else
                            price2_2 = price2;

                        if(link_config["nf"] == 1)
                        {
                            value["r1"] = Math.round(((1 - dif1 / 100) * price2 - price1_1) / Math.max(price1_1, (1 - dif1 / 100) * price2) * 10000) / 100;
                            value["r2"] = Math.round(((1 - dif2 / 100) * price1 - price2_2) / Math.max((1 - dif2 / 100) * price1, price2_2) * 10000) / 100;
                            if(first == 1)
                                value["r1_"] = Math.round(((1 - dif1 / 100) * price2 - price1_1 * 0.985) / Math.max(price1_1 * 0.985, (1 - dif1 / 100) * price2) * 10000) / 100;
                            if(second == 1)
                                value["r2_"] = Math.round(((1 - dif2 / 100) * price1 - price2_2 * 0.985) / Math.max((1 - dif2 / 100) * price1, price2_2 * 0.985) * 10000) / 100;
                        }
                        else
                        {
                            value["r1"] = Math.round(((1 - dif1 / 100) * price2) / price1_1 * 10000 - 10000) / 100;
                            value["r2"] = Math.round(((1 - dif2 / 100) * price1) / price2_2 * 10000 - 10000) / 100;
                            if(first == 1)
                                value["r1_"] = Math.round(((1 - dif1 / 100) * price2) / (price1_1 * 0.985) * 10000 - 10000) / 100;
                            if(second == 1)
                                value["r2_"] = Math.round(((1 - dif2 / 100) * price1) / (price2_2 * 0.985) * 10000 - 10000) / 100;
                        }
                    }
                    else
                    {
                        value["r1"] = -9999;
                        value["r2"] = -9999;
                        if(first == 1)
                            value["r1_"] = -9999;
                        if(second == 1)
                            value["r2_"] = -9999;
                    }
                });
                item_list_data.sort(function(a,b) {return (a.i > b.i) ? 1 : ((b.i > a.i) ? -1 : 0);} );
                rebuildList();
                NProgress.done();
                if(auto && $("#alert").prop("checked") && item_list.length != 0)
                {
                    alert.play();
                }
            }
        });
    }
}

function selectFirst(id)
{
    if(isClick)
    {
        var elem = $(".first div[data-id=" + id + "]");
        if(!elem.hasClass("btn-active"))
        {
            $(".sites.first .btn-active").removeClass("btn-active");
            elem.addClass("btn-active");
            if(id == second)
            {
                $(".sites.second .btn-active").removeClass("btn-active");
                $(".sites.second .btn[data-id='" + first + "']").addClass("btn-active");
                second = first;
                dif1 = commission_config[second];
                setCookie("second", second);
            }
            first = id;
            setCookie("first", first);
            $("#data-table tbody td").css("opacity", "0.2");
            dif2 = commission_config[first];
            loadTableData(false);
        }
    }
}

function selectSecond(id)
{
    if(isClick)
    {
        var elem = $(".second div[data-id=" + id + "]");
        if (!elem.hasClass("btn-active")) {
            $(".sites.second .btn-active").removeClass("btn-active");
            elem.addClass("btn-active");
            if (id == first) {
                $(".sites.first .btn-active").removeClass("btn-active");
                $(".sites.first .btn[data-id='" + second + "']").addClass("btn-active");
                first = second;
                dif2 = commission_config[first];
                setCookie("first", first);
            }
            second = id;
            setCookie("second", second);
            $("#data-table tbody td").css("opacity", "0.2");
            dif1 = commission_config[second];
            loadTableData(false);
        }
    }
}

function setBot(id, bot)
{
    if(bot == 0)
    {
        bot = '';
    }
    $("#bot" + id).val(bot);
    setCookie("bot" + id, bot);
    rebuildList();
}

function setsort(id)
{
    if(sort == id)
    {
        sort = 0;
    }
    else
    {
        sort = id;
    }
    updateHeaders();
    rebuildList();
}

function updateHeaders()
{
    var site1 = $(".sites.first .btn-active").data("name") + (dep_left ? " DEP" : "");
    var site2 = $(".sites.second .btn-active").data("name") + (dep_right ? " DEP" : "");
    $("#skin_name").html("Название предмета");
    $("#site1").html(" " + site1);
    $("#site2").html(" " + site2);
    $("#change1").html(" " + site1 + " > " + site2);
    $("#change2").html(" " + site2 + " > " + site1);
    switch(sort)
    {
        case 1:
            $("#skin_name").append(" &darr;");
            break;
        case 2:
            $("#site1").append(" &darr;");
            break;
        case 3:
            $("#site2").append(" &darr;");
            break;
        case 4:
            $("#change1").append(" &darr;");
            break;
        case 5:
            $("#change2").append(" &darr;");
            break;
    }
}

$(window).scroll(function() {
    if((($(window).scrollTop()+$(window).height())+250)>=$(document).height() && !last_page && !loading){
        ++page;
        var content = "";
        var count = 0;
        $.each(item_list, function(key, value){
            if(count >= (page - 1) * per_page)
            {
                content += buildRow(value);
            }
            if(++count == per_page * page)
            {
                return false;
            }
        });
        if(count >= item_list.length)
        {
            last_page = true;
        }
        $("#data-table tbody").append(content);
        initLinks();
        $('.price-value').dblclick(function() {
            $("#refresh_checkbox").prop("checked", false);
            $(this).prop('contenteditable',true).addClass("editable");
            window.getSelection().setPosition($(this).get(0), 1);
        });
        $('.price-value').wysiwygEvt();
    }
});

(function ($) {
    $.fn.wysiwygEvt = function () {
        return this.each(function () {
            var $this = $(this);
            var htmlold = $this.html();
            $this.bind('blur', function () {
                $this.prop('contenteditable',false).removeClass("editable");
                var htmlnew = $this.html();
                if (htmlold !== htmlnew)
                {
                    htmlnew.replace(/\,/g,'.');
                    var price = parseFloat(htmlnew).toFixed(2);
                    if(!isNaN(price))
                    {
                        $this.html(price);
                        var tr = $this.closest('tr');
                        var item_id = tr.attr("data-id");
                        var value = item_list.find(function(element) {
                            return element.id == item_id;
                        });
                        value.p1 = parseFloat(tr.find(".price-value:eq(0)").html());
                        value.p2 = parseFloat(tr.find(".price-value:eq(1)").html());
                        if(value["p2"] != null)
                        {
                            var price1, price2 = null;
                            if(price_rub.includes(first))
                                price1 = Math.round(value["p1"] * 100 / currencies['USD']);
                            else if(price_eur.includes(first))
                                price1 = Math.round(value["p1"] * 100 * currencies['EUR'] / currencies['USD']);
                            else if(price_cny.includes(first))
                                price1 = Math.round(value["p1"] * 100 / currencies['CNY']);
                            else
                                price1 = value["p1"] * 100;
                            if(price_rub.includes(second))
                                price2 = Math.round(value["p2"] * 100 / currencies['USD']);
                            else if(price_eur.includes(second))
                                price2 = Math.round(value["p2"] * 100 * currencies['EUR'] / currencies['USD']);
                            else if(price_cny.includes(second))
                                price2 = Math.round(value["p2"] * 100 / currencies['CNY']);
                            else
                                price2 = value["p2"] * 100;

                            var price1_1;
                            var price2_2;
                            if(csgotm.includes(first) && discount_config['csgotm'] != 0)
                                price1_1 = Math.round(price1 * (1 - discount_config['csgotm'] / 100) * 100) / 100;
                            else
                                price1_1 = price1;
                            if(csgotm.includes(second) && discount_config['csgotm'] != 0)
                                price2_2 = Math.round(price2 * (1 - discount_config['csgotm'] / 100) * 100) / 100;
                            else
                                price2_2 = price2;

                            if(link_config["nf"] == 1)
                            {
                                value["r1"] = Math.round(((1 - dif1 / 100) * price2 - price1_1) / Math.max(price1_1, (1 - dif1 / 100) * price2) * 10000) / 100;
                                value["r2"] = Math.round(((1 - dif2 / 100) * price1 - price2_2) / Math.max((1 - dif2 / 100) * price1, price2_2) * 10000) / 100;
                                if(first == 1)
                                    value["r1_"] = Math.round(((1 - dif1 / 100) * price2 - price1_1 * 0.985) / Math.max(price1_1 * 0.985, (1 - dif1 / 100) * price2) * 10000) / 100;
                                if(second == 1)
                                    value["r2_"] = Math.round(((1 - dif2 / 100) * price1 - price2_2 * 0.985) / Math.max((1 - dif2 / 100) * price1, price2_2 * 0.985) * 10000) / 100;
                            }
                            else
                            {
                                value["r1"] = Math.round(((1 - dif1 / 100) * price2) / price1_1 * 10000 - 10000) / 100;
                                value["r2"] = Math.round(((1 - dif2 / 100) * price1) / price2_2 * 10000 - 10000) / 100;
                                if(first == 1)
                                    value["r1_"] = Math.round(((1 - dif1 / 100) * price2) / (price1_1 * 0.985) * 10000 - 10000) / 100;
                                if(second == 1)
                                    value["r2_"] = Math.round(((1 - dif2 / 100) * price1) / (price2_2 * 0.985) * 10000 - 10000) / 100;
                            }
                        }
                        else
                        {
                            value["r1"] = -9999;
                            value["r2"] = -9999;
                            if(first == 1)
                                value["r1_"] = -9999;
                            if(second == 1)
                                value["r2_"] = -9999;
                        }

                        var block_price1, block_price2;
                        if(price_rub.includes(first))
                        {
                            block_price1 = "<span title='" + (value.d1 != null ? formatDate(value.d1) : "") + "' class='block-price'><b>" + (value.p1 != null ? ("~" + (value.p1 / currencies["USD"]).toFixed(2) + "$") : "-") + "</b></span>" + (value.p1 != null ? "<span class='block-price-old'>(<span class='price-value'>" + value.p1.toFixed(2) + "</span><i class='glyphicon glyphicon-rub' style='font-size:9pt'></i>)</span>" : "") + (!no_count.includes(first) ? "<span class='block-count'>[" + value.c1 + (value.a1 != null && value.a1 != -1 ? "/" + value.a1 : "") + "]</span>" : "");
                        }
                        else if(price_eur.includes(first))
                        {
                            block_price1 = "<span title='" + (value.d1 != null ? formatDate(value.d1) : "") + "' class='block-price'>" + (value.p1 != null ? "<b>~" + (value.p1 * currencies["EUR"] / currencies["USD"]).toFixed(2) + "$</b></span><span class='block-price-old'>(<span class='price-value'>" + value.p1.toFixed(2) + "</span>€)</span>" : "<span class='price-value'>-</span>") + (!no_count.includes(first) ? "<span class='block-count'>[" + value.c1 + (value.a1 != null && value.a1 != -1 ? "/" + value.a1 : "") + "]</span>" : "");
                        }
                        else if(price_cny.includes(first))
                        {
                            block_price1 = "<span title='" + (value.d1 != null ? formatDate(value.d1) : "") + "' class='block-price'>" + (value.p1 != null ? "<b>~" + Math.max((value.p1 / currencies["CNY"]).toFixed(2), 0.01) + "$</b></span><span class='block-price-old'>(<span class='price-value'>" + value.p1.toFixed(2) + "</span>￥)</span>" : "<span class='price-value'>-</span>") + (!no_count.includes(first) ? "<span class='block-count'>[" + value.c1 + (value.a1 != null && value.a1 != -1 ? "/" + value.a1 : "") + "]</span>" : "");
                        }
                        else if(price_steam.includes(first))
                        {
                            block_price1 = "<span title='" + (value.d1 != null ? formatDate(value.d1) : "") + "' class='block-price'><b>" + (value.p1 != null ? ("<span class='price-value'>" + value.p1.toFixed(2) + "</span>$") : "<span class='price-value'>-</span>") + "</b></span>" + (value.p1 != null ? "<span class='block-price-old'>(~" + (value.p1 * currencies["USD_"]).toFixed(2) + "<i class='glyphicon glyphicon-rub' style='font-size:9pt'></i>)</span>" : "") + (!no_count.includes(first) ? "<span class='block-count'>[" + value.c1 + (value.a1 != null && value.a1 != -1 ? "/" + value.a1 : "") + "]</span>" : "");
                        }
                        else
                        {
                            block_price1 = "<span title='" + (value.d1 != null ? formatDate(value.d1) : "") + "' class='block-price'><b>" + (value.p1 != null ? ("<span class='price-value'>" + value.p1.toFixed(2) + "</span>$") : "<span class='price-value'>-</span>") + "</b></span> " + (first == 1 && value.p1 != null ? "<span class='block-price-old'>(" + (value.p1 * 0.985).toFixed(2) + "$)</span>" : "") + (!no_count.includes(first) ? "<span class='block-count'>[" + value.c1 + (value.a1 != null && value.a1 != -1 ? "/" + value.a1 : "") + "]</span>" : "");
                        }
                        if(price_rub.includes(second))
                        {
                            block_price2 = "<span title='" + (value.d2 != null ? formatDate(value.d2) : "") + "' class='block-price' ><b>" + (value.p2 != null ? ("~" + (value.p2 / currencies["USD"]).toFixed(2) + "$") : "-") + "</b></span>" + (value.p2 != null ? "<span class='block-price-old'>(<span class='price-value'>" + value.p2.toFixed(2) + "</span><i class='glyphicon glyphicon-rub' style='font-size:9pt'></i>)</span>" : "") + (!no_count.includes(second) ? "<span class='block-count'>[" + value.c2 + (value.a2 != null && value.a2 != -1 ? "/" + value.a2 : "") + "]</span>" : "");
                        }
                        else if(price_eur.includes(second))
                        {
                            block_price2 = "<span title='" + (value.d2 != null ? formatDate(value.d2) : "") + "' class='block-price'>" + (value.p2 != null ? "<b>~" + (value.p2 * currencies["EUR"] / currencies["USD"]).toFixed(2) + "$</b></span><span class='block-price-old'>(<span class='price-value'>" + value.p2.toFixed(2) + "</span>€)</span>" : "<span class='price-value'>-</span>") + (!no_count.includes(second) ? "<span class='block-count'>[" + value.c2 + (value.a2 != null && value.a2 != -1 ? "/" + value.a2 : "") + "]</span>" : "");
                        }
                        else if(price_cny.includes(second))
                        {
                            block_price2 = "<span title='" + (value.d2 != null ? formatDate(value.d2) : "") + "' class='block-price'>" + (value.p2 != null ? "<b>~" + Math.max((value.p2 / currencies["CNY"]).toFixed(2), 0.01) + "$</b></span><span class='block-price-old'>(<span class='price-value'>" + value.p2.toFixed(2) + "</span>￥)</span>" : "<span class='price-value'>-</span>") + (!no_count.includes(second) ? "<span class='block-count'>[" + value.c2 + (value.a2 != null && value.a2 != -1 ? "/" + value.a2 : "") + "]</span>" : "");
                        }
                        else if(price_steam.includes(second))
                        {
                            block_price2 = "<span title='" + (value.d2 != null ? formatDate(value.d2) : "") + "' class='block-price'><b>" + (value.p2 != null ? ("<span class='price-value'>" + value.p2.toFixed(2) + "</span>$") : "<span class='price-value'>-</span>") + "</b></span>" + (value.p2 != null ? "<span class='block-price-old'>(~" + (value.p2 * currencies["USD_"]).toFixed(2) + "<i class='glyphicon glyphicon-rub' style='font-size:9pt'></i>)</span>" : "") + (!no_count.includes(second) ? "<span class='block-count'>[" + value.c2 + (value.a2 != null && value.a2 != -1 ? "/" + value.a2 : "") + "]</span>" : "");
                        }
                        else
                        {
                            block_price2 = "<span title='" + (value.d2 != null ? formatDate(value.d2) : "") + "' class='block-price'><b>" + (value.p2 != null ? ("<span class='price-value'>" + value.p2.toFixed(2) + "</span>$") : "<span class='price-value'>-</span>") + "</b></span> " + (second == 1 && value.p2 != null ? "<span class='block-price-old'>(" + (value.p2 * 0.985).toFixed(2) + "$)</span>" : "") + (!no_count.includes(second) ? "<span class='block-count'>[" + value.c2 + (value.a2 != null && value.a2 != -1 ? "/" + value.a2 : "") + "]</span>" : "");
                        }

                        tr.find(".price-value:eq(0)").closest("div").html(block_price1);
                        tr.find(".price-value:eq(1)").closest("div").html(block_price2);
                        tr.find(".per:eq(0)").closest("td").html((value.r1 != -9999 ? "<span class='per" + (value.r1 < 0 ? " red" : " green") + "'>" + value.r1 + "%</span>" : "<span class='per'>-</span>") + ([1].includes(first) ? (value.r1_ != -9999 ? "<span class='block-price-old'>(" + value.r1_ + "%)</span>" : "") : ""));
                        tr.find(".per:eq(1)").closest("td").html((value.r2 != -9999 ? "<span class='per" + (value.r2 < 0 ? " red" : " green") + "'>" + value.r2 + "%</span>" : "<span class='per'>-</span>") + ([1].includes(second) ? (value.r2_ != -9999 ? "<span class='block-price-old'>(" + value.r2_ + "%)</span>" : "") : ""));
                        htmlold = $this.html();
                        tr.find('.price-value').dblclick(function() {
                            $("#refresh_checkbox").prop("checked", false);
                            $(this).prop('contenteditable',true).addClass("editable");
                            window.getSelection().setPosition($(this).get(0), 1);
                        });
                        tr.find('.price-value').wysiwygEvt();
                    }
                    else
                    {
                        $this.html(htmlold);
                    }
                }
            });
            $this.bind("keypress paste", function(e){
                var txt = String.fromCharCode(e.which);
                if(e.keyCode == 13)
                {
                    $(this).trigger("blur");
                }
                else if(!txt.match(/[0-9\.\,]/))
                {
                    return false;
                }
            });
        })
    }
})(jQuery);

$(function () {
    document.getElementById("scroll").addEventListener('wheel', function(e){
        if($('#scroll:hover').length != 0){
            var delta = e.deltaY > 0 ? 1 : -1;
            $("#scroll").scrollLeft($("#scroll").scrollLeft() + 100 * delta);
            if(document.getElementById("scroll").clientWidth + $("#scroll").scrollLeft() >= document.getElementById("scroll").scrollWidth)
            {
                $("#scroll-right").addClass("disabled");
            }
            else
            {
                $("#scroll-right").removeClass("disabled");
            }
            if($("#scroll").scrollLeft() == 0)
            {
                $("#scroll-left").addClass("disabled");
            }
            else
            {
                $("#scroll-left").removeClass("disabled");
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }, false);

    if($("#op1").length)
    {
        $("#op1").TouchSpin({
            verticalbuttons: true,
            prefix: 'OP',
            initval: getCookie('op1') == null ? 0 : getCookie('op1'),
            max: 99999,
            min: 0
        });
        $("#op1").on("change", function() {
            setCookie("op1", $(this).val());
            rebuildList();
        });
        $('#op1').on("keypress paste", function(e){
            var txt = String.fromCharCode(e.which);
            if(!txt.match(/[0-9]/))
            {
                return false;
            }
        });
    }
    if($("#tm1").length)
    {
        $("#tm1").TouchSpin({
            verticalbuttons: true,
            prefix: 'TM',
            initval: getCookie('tm1') == null ? 0 : getCookie('tm1'),
            max: 99999,
            min: 0
        });
        $("#tm1").on("change", function() {
            setCookie("tm1", $(this).val());
            rebuildList();
        });
        $('#tm1').on("keypress paste", function(e){
            var txt = String.fromCharCode(e.which);
            if(!txt.match(/[0-9]/))
            {
                return false;
            }
        });
    }

    $("#sc1").TouchSpin({
        verticalbuttons: true,
        prefix: 'SC',
        initval: getCookie('sc1') == null ? 0 : getCookie('sc1'),
        max: 99999,
        min: 0
    });

    if($("#bs1").length)
    {
        $("#bs1").TouchSpin({
            verticalbuttons: true,
            prefix: 'BS',
            initval: getCookie('bs1') == null ? 0 : getCookie('bs1'),
            max: 99999,
            min: 0
        });
        $("#bs1").on("change", function() {
            setCookie("bs1", $(this).val());
            rebuildList();
        });
        $('#bs1').on("keypress paste", function(e){
            var txt = String.fromCharCode(e.which);
            if(!txt.match(/[0-9]/))
            {
                return false;
            }
        });
    }

    $("#n1").TouchSpin({
        verticalbuttons: true,
        prefix: 'N',
        initval: getCookie('n1') == null ? 1 : getCookie('n1'),
        max: 99999,
        min: 0
    });
    $("#n_1").TouchSpin({
        verticalbuttons: true,
        prefix: 'N',
        initval: getCookie('n_1') == null ? '' : getCookie('n_1'),
        max: 99999,
        min: 0
    });
    $("#n2").TouchSpin({
        verticalbuttons: true,
        prefix: 'N',
        initval: getCookie('n2') == null ? 1 : getCookie('n2'),
        max: 99999,
        min: 0
    });
    $("#n_2").TouchSpin({
        verticalbuttons: true,
        prefix: 'N',
        initval: getCookie('n_2') == null ? '' : getCookie('n_2'),
        max: 99999,
        min: 0
    });
    $("#refresh").TouchSpin({
        verticalbuttons: true,
        prefix: 'М',
        initval: getCookie('refresh') == null ? 5 : getCookie('refresh'),
        max: 99999,
        min: 5
    });

    $("#price1_from").TouchSpin({
        verticalbuttons: true,
        prefix: '$',
        initval: getCookie('price1_from') == null ? '' : getCookie('price1_from'),
        max: 99999,
        min: 0,
        decimals: 2,
        step: 0.01
    });
    $("#price1_to").TouchSpin({
        verticalbuttons: true,
        prefix: '$',
        initval: getCookie('price1_to') == null ? '' : getCookie('price1_to'),
        max: 99999,
        min: 0,
        decimals: 2,
        step: 0.01
    });
    $("#price2_from").TouchSpin({
        verticalbuttons: true,
        prefix: '$',
        initval: getCookie('price2_from') == null ? '' : getCookie('price2_from'),
        max: 99999,
        min: 0,
        decimals: 2,
        step: 0.01
    });
    $("#price2_to").TouchSpin({
        verticalbuttons: true,
        prefix: '$',
        initval: getCookie('price2_to') == null ? '' : getCookie('price2_to'),
        max: 99999,
        min: 0,
        decimals: 2,
        step: 0.01
    });
    $("#per1_from").TouchSpin({
        verticalbuttons: true,
        prefix: '%',
        initval: getCookie('per1_from') == null ? '' : getCookie('per1_from'),
        max: 99999,
        min: -99999,
        decimals: 2,
        step: 0.01
    });
    $("#per1_to").TouchSpin({
        verticalbuttons: true,
        prefix: '%',
        initval: getCookie('per1_to') == null ? '' : getCookie('per1_to'),
        max: 99999,
        min: -99999,
        decimals: 2,
        step: 0.01
    });
    $("#per2_from").TouchSpin({
        verticalbuttons: true,
        prefix: '%',
        initval: getCookie('per2_from') == null ? '' : getCookie('per2_from'),
        max: 99999,
        min: -99999,
        decimals: 2,
        step: 0.01
    });
    $("#per2_to").TouchSpin({
        verticalbuttons: true,
        prefix: '%',
        initval: getCookie('per2_to') == null ? '' : getCookie('per2_to'),
        max: 99999,
        min: -99999,
        decimals: 2,
        step: 0.01
    });
    loadTableData(false);
    $(document).tooltip({
        hide: { effect: "fadeOut", duration: 10 },
        show: false,
        position: { my: "right top", at: "left top" },
        content: function () {
            return $(this).prop('title');
        },
        close: function(event, ui)
        {
            ui.tooltip.hover(function()
                {
                    $(this).stop(true).fadeTo(10, 1);
                },
                function()
                {
                    $(this).fadeOut(10, function()
                    {
                        $(this).remove();
                    });
                }
            );
        }
    });
    window.setTimeout(tryRefresh, 1000);
    $("#name").on("change", function() {
        setCookie("name", $(this).val());
        rebuildList();
    });
    $("#price1_from").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("price1_from", $(this).val());
        rebuildList();
    });
    $("#price1_to").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("price1_to", $(this).val());
        rebuildList();
    });
    $('#n1').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $('#n_1').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#n1").on("change", function() {
        setCookie("n1", $(this).val());
        rebuildList();
    });
    $("#n_1").on("change", function() {
        setCookie("n_1", $(this).val());
        rebuildList();
    });
    $('#n2').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $('#n_2').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#n2").on("change", function() {
        setCookie("n2", $(this).val());
        rebuildList();
    });
    $("#n_2").on("change", function() {
        setCookie("n_2", $(this).val());
        rebuildList();
    });
    $('#bot1').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#bot1").on("change", function() {
        setCookie("bot1", $(this).val());
        rebuildList();
    });
    $("#price2_from").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("price2_from", $(this).val());
        rebuildList();
    });
    $("#price2_to").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("price2_to", $(this).val());
        rebuildList();
    });
    $('#bot2').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#bot2").on("change", function() {
        setCookie("bot2", $(this).val());
        rebuildList();
    });
    $("#per1_from").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("per1_from", $(this).val());
        rebuildList();
    });
    $("#per1_to").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("per1_to", $(this).val());
        rebuildList();
    });
    $("#per2_from").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("per2_from", $(this).val());
        rebuildList();
    });
    $("#per2_to").on("change", function() {
        $(this).val($(this).val().replace(/\,/g,'.'));
        setCookie("per2_to", $(this).val());
        rebuildList();
    });
    $("#overstock_checkbox").on("change", function() {
        setCookie("overstock", $("#overstock_checkbox").prop("checked") ? 1 : 0);
        rebuildList();
    });

    if($("#dep_left_checkbox").length) {
        $("#dep_left_checkbox").on("change", function() {
            dep_left = $("#dep_left_checkbox").prop("checked");
            setCookie("dep_left", dep_left ? 1 : 0);
            updateHeaders();
            rebuildList();
        });
        $("#dep_right_checkbox").on("change", function() {
            dep_right = $("#dep_right_checkbox").prop("checked");
            setCookie("dep_right", dep_right ? 1 : 0);
            updateHeaders();
            rebuildList();
        });
    }
    $("#alert").on("change", function() {
        setCookie("alert", $("#alert").prop("checked") ? 1 : 0);
    });
    if(link_config['lk'])
    {
        $("#like_checkbox").on("change", function() {
            setCookie("like", $("#like_checkbox").prop("checked") ? 1 : 0);
            rebuildList();
        });
    }

    $("#sc1").on("change", function() {
        setCookie("sc1", $(this).val());
        rebuildList();
    });
    $('#sc1').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#time1").on("change", function() {
        setCookie("time1", $(this).val());
        rebuildList();
    });
    $('#time1').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#time2").on("change", function() {
        setCookie("time2", $(this).val());
        rebuildList();
    });
    $('#time2').on("keypress paste", function(e){
        var txt = String.fromCharCode(e.which);
        if(!txt.match(/[0-9]/))
        {
            return false;
        }
    });
    $("#refresh_checkbox").on("change", function() {
        setCookie("refresh_checkbox", $("#refresh_checkbox").prop("checked") ? 1 : 0);
    });
    $("#refresh").on("change", function() {
        setCookie("refresh", $(this).val());
    });

    $("#scroll-left").click(function() {
        $("#scroll").animate({scrollLeft:$("#scroll").scrollLeft() - 200}, 300, function() {
            if(document.getElementById("scroll").clientWidth + $("#scroll").scrollLeft() >= document.getElementById("scroll").scrollWidth)
            {
                $("#scroll-right").addClass("disabled");
            }
            else
            {
                $("#scroll-right").removeClass("disabled");
            }
            if($("#scroll").scrollLeft() == 0)
            {
                $("#scroll-left").addClass("disabled");
            }
            else
            {
                $("#scroll-left").removeClass("disabled");
            }
        });
    });
    $("#scroll-right").click(function() {
        $("#scroll").animate({scrollLeft:$("#scroll").scrollLeft() + 200}, 300, function() {
            if(document.getElementById("scroll").clientWidth + $("#scroll").scrollLeft() >= document.getElementById("scroll").scrollWidth)
            {
                $("#scroll-right").addClass("disabled");
            }
            else
            {
                $("#scroll-right").removeClass("disabled");
            }
            if($("#scroll").scrollLeft() == 0)
            {
                $("#scroll-left").addClass("disabled");
            }
            else
            {
                $("#scroll-left").removeClass("disabled");
            }
        });
    });
    $("#filter-button").click(function() {
        var opened = $("#filter-button").hasClass("opened");
        $("#filter-button").toggleClass("opened");
        if(opened)
        {
            localStorage.setItem("filter_opened", 0);
            $("#filter-content").hide("slow");
        }
        else
        {
            localStorage.setItem("filter_opened", 1);
            $("#filter-content").show("slow");
        }
    });
    $("#black-list-button").click(function() {
        rebuildBlackList();
    });
    $("#add-key-phrase").click(function() {
        var phrase = $("#key-phrase").val().replace(/<\/?[^>]+(>|$)/g, "");
        if(phrase != '')
        {
            black_list.push({"phrase":phrase, "enabled":true});
            $("#key-phrase").val("");
            rebuildBlackList();
            saveBlackList();
            rebuildList();
        }
    });

    $("#apply-rarity").click(function() {
        rarities = [];
        for(var i = 1; i < 9; ++i)
        {
            if($("#rarity" + i).prop("checked"))
            {
                rarities.push(i);
            }
        }
        localStorage.setItem("rarities", JSON.stringify(rarities));
        rebuildList();
    });

    var clipboard = new Clipboard('.clipboard');
    clipboard.on('success', function(e) {
        $(e.trigger).css("backgroundColor", "#e0b841");
        $(e.trigger).animate({
            backgroundColor: "transparent"
        }, 600, function() {
            $(e.trigger).css("background-color", "");
        });
    });
    if(document.getElementById("scroll").clientWidth + $("#scroll").scrollLeft() >= document.getElementById("scroll").scrollWidth)
    {
        $("#scroll-right").addClass("disabled");
    }
    else
    {
        $("#scroll-right").removeClass("disabled");
    }
    if($("#scroll").scrollLeft() == 0)
    {
        $("#scroll-left").addClass("disabled");
    }
    else
    {
        $("#scroll-left").removeClass("disabled");
    }
});

window.addEventListener('mousemove', function(e){
    if(curDown && $('#scroll:hover').length != 0){
        $("#scroll").scrollLeft($("#scroll").scrollLeft() + (curXPos - e.pageX));
        curXPos = e.pageX;
        if(document.getElementById("scroll").clientWidth + $("#scroll").scrollLeft() >= document.getElementById("scroll").scrollWidth)
        {
            $("#scroll-right").addClass("disabled");
        }
        else
        {
            $("#scroll-right").removeClass("disabled");
        }
        if($("#scroll").scrollLeft() == 0)
        {
            $("#scroll-left").addClass("disabled");
        }
        else
        {
            $("#scroll-left").removeClass("disabled");
        }
    }
});

window.addEventListener('mousedown', function(e){
    curXPos = e.pageX;
    curDown = true;
    setTimeout(function() { if(curDown) isClick = false; }, 400);
});

window.addEventListener('mouseup', function(e){
    curDown = false;
});

window.addEventListener('click', function(e){
    isClick = true;
});
/*window.addEventListener('mousewheel', function(e){
    e.stopPropagation();
    e.preventDefault();
    return false;
}, false);
window.addEventListener('DOMMouseScroll', function(e){
    e.stopPropagation();
    e.preventDefault();
    return false;
}, false);*/