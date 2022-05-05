import enum
import json
import re
import urllib
from collections import namedtuple
from decimal import Decimal
from time import sleep
from bs4 import BeautifulSoup
from steampy.models import GameOptions, Currency

from skinstable import get_table, steam_user
table = list(sorted(get_table(), key=lambda el: el['r1']))
if table[0]['r1'] < table[-1]['r1']:
    table = table[::-1]
#
# class GameOptions:
#     PredefinedOptions = namedtuple('PredefinedOptions', ['app_id', 'context_id'])
#     STEAM = PredefinedOptions('753', '6')
#     DOTA2 = PredefinedOptions('570', '2')
#     CS = PredefinedOptions('730', '2')
#     TF2 = PredefinedOptions('440', '2')
#     PUBG = PredefinedOptions('578080', '2')
#     RUST = PredefinedOptions('252490', '2')
#
#     def __init__(self, app_id: str, context_id: str) -> None:
#         self.app_id = app_id
#         self.context_id = context_id
#
#
# class Currency(enum.IntEnum):
#     USD = 1
#     GBP = 2
#     EURO = 3
#     CHF = 4
#     RUB = 5
#     UAH = 18
#
#
# class SteamUrl:
#     API_URL = "https://api.steampowered.com"
#     COMMUNITY_URL = "https://steamcommunity.com"
#     STORE_URL = 'https://store.steampowered.com'
#
#
#
# def create_buy_order(client, market_name: str, price_single_item, quantity: int, game: GameOptions = GameOptions.CS, currency=Currency.USD) -> dict:
#     #market_name = market_name.replace('/', '-')
#     data = {"sessionid": client.session_id, "currency": currency.value,
#             "appid": game.app_id, "market_hash_name": market_name,
#             "price_total": str(Decimal(price_single_item) * Decimal(quantity)),
#             "quantity": quantity}
#     headers = {'Referer': "%s/market/listings/%s/%s" % (
#         SteamUrl.COMMUNITY_URL, game.app_id, urllib.parse.quote(market_name))}
#     response = client.session.post(
#         SteamUrl.COMMUNITY_URL + "/market/createbuyorder/", data,
#         headers=headers).json()
#     if response.get("success") != 1:
#         if response.get('success') == 29:
#             raise Exception('Ордер уже установлен' + market_name)
#         elif response.get('success') == 25:
#             raise Exception('Ордер не установлен: превышение денежного лимита ' +
#                   market_name)
#         else:
#             print(response)
#             raise Exception(
#                 "There was a problem creating the order. Are you using the right currency? success: %s" % response.get(
#                     "success"))
#     return response
#
#
#
# def create_sell_order(user: steam_user, assetid: str, game: GameOptions, money_to_receive: str) -> dict:
#     data = {
#         "assetid": assetid,
#         "sessionid": user.session_id,
#         "contextid": game.context_id,
#         "appid": game.app_id,
#         "amount": 1,
#         "price": money_to_receive
#     }
#     headers = {'Referer': "%s/profiles/%s/inventory" % (SteamUrl.COMMUNITY_URL, self._steam_guard['steamid'])}
#     response = self._session.post(SteamUrl.COMMUNITY_URL + "/market/sellitem/", data, headers=headers).json()
#     if response.get("needs_mobile_confirmation"):
#         return self._confirm_sell_listing(assetid)
#     return response
#
#
# def get_wallet_balance(client, convert_to_decimal: bool = True):
#     url = SteamUrl.STORE_URL + '/account/history/'
#     response = client.session.get(url)
#     response_soup = BeautifulSoup(response.text, "html.parser")
#     balance = response_soup.find(id='header_wallet_balance').string
#     if convert_to_decimal:
#         pattern = '\D?(\\d*)(\\.|,)?(\\d*)'
#         tokens = re.search(pattern, balance, re.UNICODE)
#         decimal_str = tokens.group(1) + '.' + tokens.group(3)
#         return Decimal(decimal_str)
#     else:
#         return balance
#
# #table = list(sorted(get_table(), key=lambda el: el['r1']))
# #print(*table, sep='\n')
# #print(get_wallet_balance(steam_user))

def create_all_orders(tab):
    for item in tab:
        try:
            #print(item['i'])
            res = steam_user.market.create_buy_order(item['i'], item['p1r'] * 100 + 20, 1,
                                   GameOptions.CS, Currency.RUB)
            print(res)
        except Exception as e:
            print(e)
            pass

def balance():
    return steam_user.get_wallet_balance()



res = steam_user.get_my_inventory(GameOptions.CS)
res = dict((k, v) for k, v in res.items() if v['marketable'] == 1)
#res = json.loads(res)
a = list(res.items())[0]
print(a)
#resp =steam_user.market.create_sell_order(str(a[0]), GameOptions.CS, 7500)
print(resp)
for key, val in res.items():
    print(key, end= ', ')
    print(val['market_hash_name'])

    #print(val['marketable'], end= ', ')
    #print(any(val['market_hash_name'] == i['i'] for i in table))
# print(market.get_volume(item, 730))


#create_all_orders(table)
