import json
import math
import re

from bs4 import BeautifulSoup
from pyjsparser import parse
from steam.webauth import WebAuth
import steampy.confirmation
import steam_auth

STEAM_FEE = 15

MAIN_AJAX_URL = 'https://skins-table.xyz/table/ajax.php'
MAIN_TABLE_URL = 'https://skins-table.xyz/table/'
steam_user = steam_auth.get_user(credentials=('picachyy', '546546nnnn'))

#assert len(res.text) != 0


def get_default_items(skinstable_user: WebAuth):
    res = skinstable_user.session.get('https://skins-table.xyz/table/')
    bs = BeautifulSoup(res.text, 'lxml')
    script_tag = bs.find(
        lambda tag: tag.name == 'script' and 'item_names' in tag.text)

    # print(script_tag)
    #print('Получаю JS дерево')
    try:
        txt = script_tag.text
        pattern = re.compile(r"var (.+)? = (.+)?;", re.MULTILINE)
    except Exception as e:
        if steam_user.is_session_alive():
            steam_auth.auth_to_skinstable(steam_user)
        else:
            steam_auth.login('picachyy', '546546nnnn')
            steam_auth.auth_to_skinstable(steam_user)
        get_default_items(steam_user)

    res = {}
    for i in pattern.findall(txt):
        res.update({i[0]: json.loads(i[1])})
    #print(res)
    with open('vars.json', 'w') as f:
        json.dump(res, f)  # re.findall(pattern, )  # print(pattern.match(txt))  # json.dump(tree, open('body.json', 'w'))  # print(tree.keys()['body'])

def get_table():
    steam_auth.auth_to_skinstable(steam_user)
    res = steam_user.session.post(MAIN_AJAX_URL,
                                  data={'site1': 53, 'site2': 52})
    #print(res.text)
    if not res.text:
        #print(res.text)
        steam_auth.auth_to_skinstable(steam_user)
        return get_table()
    get_default_items(steam_user)
    items = json.load(open('vars.json'))
    item_names = items['item_names']
    steam_sales = items['steam_sales']

    table = res.json()
    currencies = table[2]
    data = table
    item_list_data = []
    for item_id, value in zip(data[0].keys(), data[0].values()):
        if not item_id in item_names:
            continue
        item = {}
        item["i"] = item_names[item_id][0].replace('/', '-')
        # re.sub(re.sub(r'[\s{2,}]', item['i']))
        # item["i_"] = item['i'].lower().replace('')
        item['id'] = item_id
        if item_id in steam_sales:
            item["c7_sc"] = steam_sales[item_id][0]
        else:
            item["c7_sc"] = 0
        if value['0'] is not None:
            item["p1"] = value['0'] / 100
            item['p1r'] = item['p1'] * currencies['USD_']
        else:
            continue
            item["p1"] = None
            item['p1r'] = None
        if data[0] and item['id'] in data[0]:
            if item_id in data[1] and data[1][item_id].get('0'):
                item['p2'] = data[1][item_id]['0'] / 100
                item['p2r'] = item['p2'] * currencies['USD_']
            else:
                continue
                item['p2'] = None
                item["p2r"] = None
        else:
            continue
            item["p2"] = None
            item["p2r"] = None

        item['r1'] = round(((1 - STEAM_FEE / 100) * item['p2']) / item['p1'] * 10000 - 10000) / 100
        item['r2'] = round(((1 - STEAM_FEE / 100) * item['p1']) / item['p2'] * 10000 - 10000) / 100
        item_list_data.append(item)

        #print(item)
        # item["i_"] = str(item['i'].lower().replace( / [\(
        #     \)\ |] / g, "").replace( / [\-] / g, " ").replace( /\s
        # {2, } / g, " ");
        pass  # print(i, val)  # print(table)
    item_list_data.sort(key=lambda x: x['r1'])
    return filter_items(item_list_data)

def filter_items(data):
    #i for i in item_list_data if i['p1']>=1
    #p1 = lambda p: p['p1'] >= 0.1
    p1 = lambda p: p['p1'] >= 0.1
    sales = lambda c: c['c7_sc'] >= 150
    r1 = lambda r: 30 > r['r1'] > 5
    #return data
    return list(filter(lambda row: p1(row) and sales(row) and r1(row), data))[::-1]

#print(*filter_items(item_list_data), sep='\n')


