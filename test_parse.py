import re
import multiprocessing
import datetime
from datetime import date
import requests
from bs4 import BeautifulSoup
from pyjsparser import parse
from steam.webauth import WebAuth
import steampy.confirmation
import json
from time import sleep
from steampy.models import GameOptions, Currency
import steam.webauth as wa
from bs4 import BeautifulSoup
from steam.guard import SteamAuthenticator
from steampy.client import SteamClient
from steampy.exceptions import InvalidCredentials
import dbworker

STEAM_OPENID = 'https://steamcommunity.com/openid/login'
SKINS_TABLE_STEAM = 'https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=http%3A%2F%2Ftable.altskins.com%2Flogin%2Fsteam&openid.realm=http%3A%2F%2Ftable.altskins.com&openid.ns.sreg=http%3A%2F%2Fopenid.net%2Fextensions%2Fsreg%2F1.1&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select'

# sa = SteamAuthenticator(json.load(open('./main.mafile')))
KEY = '844B04DC34A8FFA0DA4DC6AD31A5B531'
steam_client = SteamClient(KEY)
db = dbworker.DBWorker()


def login(log, password):
    try:
        print('Пытаюсь войти в стим')
        steam_client.login('picachyy', '546546nnnn', './main.mafile')
    except InvalidCredentials as e:
        print(e)
        sleep(31)
        return login(log, password)
    # steam_client.session
    if steam_client.is_session_alive():
        return steam_client
    else:
        sleep(25)
        return login(log, password)
    # try:
    #     _user = wa.WebAuth(log, password)
    #     _user.login(password, twofactor_code=sa.get_code())
    # except (wa.CaptchaRequired, wa.CaptchaRequiredLoginIncorrect):
    #     print(
    #         'Всё сломалось, давайте попробуем вручную. (или перезайди в браузере и введи там капчу.)')
    #     _user.cli_login()
    # except wa.TwoFactorCodeRequired:
    #     print('Ошибка входа, 2FA код уже был использован, повтор через 5 секунд')
    #     sleep(35)
    #     return login(log, password)
    # return _user


def auth_to_skinstable(user=None, credentials=('picachyy', '546546nnnn')):
    if not user:
        user = login(*credentials)
    res = user.session.get(
        SKINS_TABLE_STEAM)  # получаем данные формы входа в стиме, и делаем запрос на вход
    a = BeautifulSoup(res.text, 'lxml').find('form', id='openidForm')
    params = a.find_all('input')[:-1]
    form_data = {i['name']: i['value'] for i in params}
    s = user.session.post(STEAM_OPENID, data=form_data)  # Здесь мы входим
    return user  # если всё правильно, то нас должно пустить в Skins table


def get_user(credentials, *args):
    if credentials:
        return login(*credentials)
    else:
        return login(*args)


steam_user = get_user(credentials=('picachyy', '546546nnnn'))
auth_to_skinstable(steam_user)


def get_item_info(name):
    name = name.replace(" ", "%20").replace("|", "%7C").replace("(", "%28").replace(")", "%29").replace("™",
                                                                                                        "%E2%84%A2")
    url = "https://steamcommunity.com/market/listings/730/" + name
    res = steam_user.session.get(url)
    soup = BeautifulSoup(res.text, "lxml")
    nameid = \
        soup.findAll("script", type="text/javascript")[-1].text.split("function() { Market_LoadOrderSpread( ")[
            -1].split(
            " ); }")[0]
    url_2 = "https://steamcommunity.com/market/itemordershistogram?country=RU&language=russian&currency=5&item_nameid=" + nameid
    res_2 = requests.get(url_2)
    last_price = res_2.json().get("sell_order_graph")[0][0]

    auto_buy_price = res_2.json().get("buy_order_graph")[0][0]

    history_price = res.text.split("var line1=[")[-1].split("];")[0].replace('"', '').split("],[")
    history_price[0] = history_price[0].replace('[', '')
    history_price[-1] = history_price[-1].replace(']', '')
    days = {}
    months = {
        '1': 'Jan',
        '2': 'Feb',
        '3': 'Mar',
        '4': 'Apr',
        '5': 'May',
        '6': 'Jun',
        '7': 'Jul',
        '8': 'Aug',
        '9': 'Sep',
        '10': 'Oct',
        '11': 'Nov',
        '12': 'Dec'
    }
    today = date.today()
    date1 = datetime.timedelta(days=7)
    prev_date = today - date1
    moth_date = today - datetime.timedelta(days=31)
    for x in range(1, 32):
        prices_for_day = []
        for y in range(1, 24):
            for i in history_price:
                i = i.split(',')
                i[0] = i[0].split(':')[0].split(" ")
                if i[0][2] == str(today.year) and (
                        (i[0][0] == months[str(today.month)] and int(today.day) - int(i[0][1]) < 8) or (
                        i[0][0] == months[str(prev_date.month)] and prev_date.month != today.month and int(
                        i[0][1]) - int(prev_date.day) >= 0)):
                    if i[0][1].lstrip('0') == str(x) and i[0][3].lstrip('0') == str(y):
                        prices_for_day.append(float(i[1]))
        days[x] = prices_for_day
    all_price = []
    for i in history_price:
        i = i.split(',')
        i[0] = i[0].split(':')[0].split(" ")
        if i[0][2] == str(today.year) and (
                i[0][0] == months[str(today.month)] or (
                i[0][0] == months[str(moth_date.month)] and int(i[0][1]) - int(
            moth_date.day) >= 0)):
            all_price.append(float(i[1]))
    if len(all_price) % 2 == 1:
        median_price = sorted(all_price)[int((len(all_price) - 1) / 2)]
    else:
        median_price = (sorted(all_price)[int(len(all_price) / 2)] + sorted(all_price)[int(len(all_price) / 2 - 1)]) / 2
    low_price = []
    max_price = []
    for key in days.keys():
        if days.get(key):
            lforday = sorted(days.get(key))[0]
            mforday = sorted(days.get(key))[::-1][0]
            if median_price > 5:
                if lforday / median_price > 0.69 and mforday / median_price < 1.31:
                    low_price.append(lforday)
                    max_price.append(mforday)
            else:
                low_price.append(lforday)
                max_price.append(mforday)
    if len(low_price) % 2 == 1:
        median_low = sorted(low_price)[(len(low_price) - 1) // 2]
        median_max = sorted(max_price)[(len(max_price) - 1) // 2]
    else:
        median_low = (sorted(low_price)[len(low_price) // 2 - 1] + sorted(low_price)[len(low_price) // 2]) / 2
        median_max = (sorted(max_price)[len(max_price) // 2 - 1] + sorted(max_price)[len(max_price) // 2]) / 2

    try:
        id_first_item = soup.find('div', id='searchResultsRows').find_all('div')[3].get('class')[-1].split('_')[-1]
        fee = float(last_price) * 100 - int(
            soup.find('span', class_='market_listing_price market_listing_price_without_fee').text.split(' ')[
                0].replace(',', ''))
        # print(steam_user.market.buy_item(name, id_first_item, int(float(last_price)*100), fee, GameOptions.CS, Currency.RUB))
    except Exception as e:
        id_first_item = 'net'
        fee = 'net'
    result = {
        'auto_buy_price': float(auto_buy_price),
        'last_price': float(last_price),
        'median_price': int(median_price * 100),
        'median_low': median_low,
        'median_max': median_max,
        'fee': fee,
        'market_id': id_first_item
    }
    sleep(10)
    return result


def get_low_autobuy_price():
    url = 'https://table.altskins.com/ru/site/items?ItemsFilter%5Bknife%5D=0&ItemsFilter%5Bknife%5D=1&ItemsFilter%5Bstattrak%5D=0&ItemsFilter%5Bstattrak%5D=1&ItemsFilter%5Bsouvenir%5D=0&ItemsFilter%5Bsouvenir%5D=1&ItemsFilter%5Bsticker%5D=0&ItemsFilter%5Btype%5D=1&ItemsFilter%5Bservice1%5D=showsteam&ItemsFilter%5Bservice2%5D=showsteama&ItemsFilter%5Bunstable1%5D=1&ItemsFilter%5Bunstable2%5D=1&ItemsFilter%5Bhours1%5D=192&ItemsFilter%5Bhours2%5D=192&ItemsFilter%5BpriceFrom1%5D=&ItemsFilter%5BpriceTo1%5D=&ItemsFilter%5BpriceFrom2%5D=&ItemsFilter%5BpriceTo2%5D=&ItemsFilter%5BsalesBS%5D=&ItemsFilter%5BsalesTM%5D=&ItemsFilter%5BsalesST%5D=&ItemsFilter%5Bname%5D=&ItemsFilter%5Bservice1Minutes%5D=30&ItemsFilter%5Bservice2Minutes%5D=30&ItemsFilter%5BpercentFrom1%5D=0&ItemsFilter%5BpercentFrom2%5D=&ItemsFilter%5Btimeout%5D=5&ItemsFilter%5Bservice1CountFrom%5D=&ItemsFilter%5Bservice1CountTo%5D=&ItemsFilter%5Bservice2CountFrom%5D=&ItemsFilter%5Bservice2CountTo%5D=&ItemsFilter%5BpercentTo1%5D=&ItemsFilter%5BpercentTo2%5D='
    res = steam_user.session.get(url)
    print(res.status_code)
    bs = BeautifulSoup(res.text, 'lxml')
    names = [x.text for x in bs.find_all("span", class_="copy")]
    items = {}
    for name in names:
        try:
            print(f'Чекаю {name} ниже автобая')
            info = get_item_info(name)
            last = info.get('last_price')
            auto = info.get('auto_buy_price')
            median_price = info.get('median_price')
            if last < auto and last < median_price * 0.87:
                items[name] = {
                    "auto_buy_price": auto,
                    "last_price": last,
                    "profit": (last * 100 * 0.87 / (auto * 100) - 1) * 100,
                    "median_price": median_price,
                    'fee': info.get('fee'),
                    'market_id': info.get('market_id')
                }
            else:
                print('Сайт обманул(')
        except Exception:
            print(Exception)
            continue
    return items


def buy_low_autobuy():
    names = get_low_autobuy_price()
    if len(names) > 1:
        for name in names.keys():
            try:
                print(f'Пытаюсь купиить ниже автобая {name}')
                buy_price = int(float(names[name].get('last')) * 100)
                steam_user.market.buy_item(name, names[name].get('market_id'), buy_price, names[name].get('fee'),
                                           GameOptions.CS, Currency.RUB)
                db.create_order(item_id=0, item_name=name, buy_price=int(float(names[name].get('last')) * 100),
                                buy_id='Купили ниже автобая', buy_order_completed=1)

                print("\033[31m {}".format((f'Успешно купил {name} за {buy_price}')))
            except Exception:
                print(f'Не получилось потому что {Exception}')
                continue


def get_new_table():
    names = []
    res = steam_client.market.get_my_market_listings()['buy_orders']
    all_buy_names = [res.get(x).get('item_name') for x in res.keys()]
    ST_sales = '150'
    for i in range(1, 15):
        try:
            res = steam_user.session.get(
                url=f"https://table.altskins.com/ru/site/items?ItemsFilter[knife]=1&ItemsFilter[stattrak]=1&ItemsFilter[souvenir]=1&ItemsFilter[sticker]=1&ItemsFilter[type]=1&ItemsFilter[service1]=showsteama&ItemsFilter[service2]=showsteam&ItemsFilter[unstable1]=1&ItemsFilter[unstable2]=1&ItemsFilter[hours1]=&ItemsFilter[hours2]=&ItemsFilter[priceFrom1]=&ItemsFilter[priceTo1]=&ItemsFilter[priceFrom2]=&ItemsFilter[priceTo2]=&ItemsFilter[salesBS]=&ItemsFilter[salesTM]=&ItemsFilter[salesST]={ST_sales}&ItemsFilter[name]=&ItemsFilter[service1Minutes]=&ItemsFilter[service2Minutes]=&ItemsFilter[percentFrom1]=1&ItemsFilter[percentFrom2]=&ItemsFilter[timeout]=5&ItemsFilter[service1CountFrom]=&ItemsFilter[service1CountTo]=&ItemsFilter[service2CountFrom]=&ItemsFilter[service2CountTo]=&ItemsFilter[percentTo1]=25&ItemsFilter[percentTo2]=&page=" + str(
                    i) + "&per-page=30")
            print(res.status_code)
            bs = BeautifulSoup(res.text, 'lxml')
            all_names = bs.find_all("span", class_="copy")
            for name in all_names:
                if name.text not in all_buy_names:
                    names.append(name.text)
                else:
                    print(f'{name} уже покупается')
            if len(all_names) < 30:
                break
        except Exception:
            continue
    items = {}
    k = 0
    i = 9
    for name in names:
        try:
            i += 1
            if i % 10 == 0:
                buy_low_autobuy()
            print(f'Смотрю {name}')
            info = get_item_info(name)
            last = info.get('last_price')
            auto = info.get('auto_buy_price')
            median_price = info.get('median_price')
            if last > info.get('median_max') or auto < info.get('median_low'):
                continue
            items[name] = {
                "auto_buy_price": auto,
                "last_price": last,
                "profit": (last * 100 * 0.87 / (auto * 100) - 1) * 100,
                "median_price": median_price
            }
            k += 1
            print(f"Парсю сайтик, спарсил {k} предметов")
        except Exception:
            print(Exception)
            continue

    a = {x: y for x, y in list(sorted(items.items(), key=lambda x: x[1]['profit']))[::-1]}
    with open('items_name.json', "w") as f:
        json.dump(a, f)
    # for item in a:
    #     print(a.get(item).get('last_price')) # получене нормальное
    return a
#
#
#

# print(k)
# for item in a:
#     sleep(4)
#     print(steam_client.market.fetch_price(item, game=GameOptions.CS, currency=Currency.RUB))
