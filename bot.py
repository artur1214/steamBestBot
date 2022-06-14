import json

import test_parse
import time
from datetime import datetime, timedelta
import requests
import bs4
from sqlalchemy import delete
from steampy.exceptions import ApiException
from steampy.models import GameOptions, Currency
from skinstable import get_table, steam_user
from test_parse import login
import dbworker

# DBWorker().create_tables()
BUY_ORDER_SUM_LIMIT = 200000

class Bot():
    def __init__(self):
        self.db = dbworker.DBWorker()
        # self.get_table()
        self.client = test_parse.steam_user

    def create_all_buy_orders(self):
        count_buy = 2
        ko = 0
        items = test_parse.get_new_table()
        for item in items:  # self.table:
            try:
                print(item)
                median_price = items.get(item).get('median_price')
                if items.get(item).get('last_price') * 100 / median_price < 1.21 and 1 < items.get(item).get(
                        'profit') < 21:
                    try:
                        price = items.get(item).get('auto_buy_price') * 100 + 1
                        print(f"куплю {price / 100}, продам {items.get(item).get('last_price')}, получу {items.get(item).get('profit')}")
                        res = self.client.market.create_buy_order(item, price, count_buy, GameOptions.CS, Currency.RUB)
                        if res.get("success") == 1:
                            for i in range(1, count_buy + 1):
                                self.db.create_order(item_id=0, item_name=item, buy_price=int(price),
                                                     buy_id=res['buy_orderid'],
                                                     sell_price=int(items.get(item).get('last_price') * 100))
                            print("Успешно создал ордер на покупку")
                            ko += 1
                    except Exception:
                        print(Exception)
                        continue
            except ApiException as e:
                print(e)
                pass
        return ko

    def get_table(self):
        self.table = list(sorted(get_table(), key=lambda el: el['r1']))
        if self.table[0]['r1'] < self.table[-1]['r1']:
            self.table = self.table[::-1]
        return self.table

    def cancel_buy_order(self, order_id):
        return self.client.market.cancel_buy_order(order_id)

    def get_all_buy_orders(self):
        res = self.client.market.get_my_market_listings()
        buy_orders = res['buy_orders']
        return buy_orders

    def get_all_sell_orders(self):
        return self.client.market.get_my_market_listings()['sell_listings']

    def cancel_sell_order(self, order_id):
        return self.client.market.cancel_sell_order(order_id)#.json()

    def get_my_inventory(self):
        res = self.client.get_my_inventory(GameOptions.CS)
        return dict((k, v) for k, v in res.items() if v['marketable'] == 1)

    def get_item_listing_id(self, sells: dict, item_name):
        res = list(
            filter(lambda s: s['description']['market_hash_name'] == item_name,
                   sells.values()))
        if res:
            return res[-1]['listing_id']

    def confirm_all_sell_orders(self):
        orders = self.db.get_all_selling_orders()
        sells = self.client.market.get_my_market_listings()['sell_listings']
        if self.client.is_session_alive():
            for order in orders:
                if not order.sell_id in sells:
                    order.profit = int(order.sell_price_real) - order.buy_price
                    self.db.session.add(order)
                    self.db.session.commit()
        else:
            print('Вылетел')

    def update_all_sell_orders_id(self):
        sells = self.client.market.get_my_market_listings()
        orders = self.db.get_uncompleted_items()
        for order in orders:
            order.sell_id = self.get_item_listing_id(sells['sell_listings'],
                                                     order.item_name)
            self.db.session.add(order)
            self.db.session.commit()

    def write_in_BD_sell_order(self, j, sell_price_real: int):
        j.sell_price_real = sell_price_real
        j.sell_id = self.get_item_listing_id(
            self.client.market.get_my_market_listings()[
                'sell_listings'], j.item_name)
        self.db.session.add(j)
        self.db.session.commit()
        print(f"выставил дороже рынка в + на пару копеек {j.item_name} за {j.sell_price_real}")

    def create_all_sell_orders(self):
        try:
            inventory = self.get_my_inventory()
            with open('invent.json', 'w') as o:
                json.dump(inventory, o)
            for i, el in inventory.items():
                order = self.db.get_item_for_sell(el['market_hash_name'])
                if order:

                    j = order[0]
                    j.buy_order_completed = True
                    self.db.session.add(j)
                    self.db.session.commit()
                    skipaem = ["Souvenir", 'Sticker', 'Sealed']
                    #####Анализ стикеров###
                    if j.item_name.split()[0] in skipaem:
                        dop_price = 0
                    else:
                        html = inventory.get(i).get('descriptions')[-1].get('value')
                        dop_price = 0
                        if html == "" or html == " ":
                            print("Наклеек нет")
                        else:
                            soup = bs4.BeautifulSoup(html, "lxml")
                            names = soup.find("div").text.split(": ")[1].split(",")
                            dop_price = len(names)
                            print(f"{dop_price} наклеек")
                    #######################
                    try:
                        price = test_parse.get_item_info(j.item_name).get('last_price') * 100 + dop_price * 20
                        if price * 0.87 > int(j.buy_price):
                            money_to_receive = int(price * 0.87)
                        else:
                            money_to_receive = int(j.buy_price * 1.01)
                        res = self.client.market.create_sell_order(str(i), GameOptions.CS, money_to_receive)
                        if res['success']:
                            self.write_in_BD_sell_order(j, money_to_receive)
                        else:
                            print(f'Ошибка при выставлении {j.item_name}: {res}')
                    except Exception as e:
                        print(f"Не выставил {j.item_name} словил ошибку:")
                        print(e)
                        continue
        except Exception as ex:
            print(ex)


    def get_db_buy_orders(self):
        names = self.db.session.query(self.db.orders).filter(self.db.orders.item_name)
        return names

    def run(self):
        if not self.client.is_session_alive():
            login('picachyy', '546546nnnn')
        else:
            print('Вход успешен')
        while True:
            print('НОВАЯ ИТЕРАЦИЯ БОТА')
            self.confirm_all_sell_orders()
            print('Бот закрыл выполненые ордера на продажу')
            orders_profit = self.db.session.query(self.db.orders).filter(self.db.orders.profit)
            sum = 0
            for order in orders_profit:
                sum += float(order.profit)
            with open("profit.txt", "a") as f:
                f.write(f"\nПрофит: {sum}, дата: {datetime.now()}")
            print(f"profit = {sum} ")
            print('Создаю ордера на продажу')
            self.create_all_sell_orders()
            self.update_all_sell_prices()
            print('Все ордера успешно созданы.')
            print("Отменяю старые ордера на покупку")
            self.cancel_old_buy_orders()
            print('Создаю ордера на покупку')
            print(f'Было создано {self.create_all_buy_orders()} ордеров на покупку')

    def fix(self):
        orders = self.db.session.query(self.db.orders).filter(self.db.orders.sell_id == None,
                                                              self.db.orders.sell_price_real != None,
                                                              self.db.orders.profit == None)
        for order in orders:
            order.sell_price_real =None
        self.db.session.commit()

    def update_all_sell_prices(self):
        current_orders = self.get_all_sell_orders()
        for steam_order in current_orders:
            db_order = self.db.session.query(self.db.orders).filter(
                self.db.orders.sell_id == steam_order).first()
            if db_order:
                print(f"Смотрю ордер на {db_order.item_name}")
                time_elapsed: timedelta = datetime.now() - db_order.updated_on
                if time_elapsed.days >= 3:  # Сколько дней ордер стоял
                    try:
                        if db_order.sell_id and db_order.profit is None:
                            new_price = test_parse.get_item_info(db_order.item_name).get('last_price') * 100 + 1
                            self.replace_sell_order(current_orders[steam_order], db_order, new_price * 0.87)
                    except Exception as e:
                        print(e)

    def replace_sell_order(self, sell_order, db_order, new_price):
        try:
            cancel_res = self.cancel_sell_order(sell_order['listing_id'])
            print(cancel_res)
            if cancel_res.status_code != 200:
                print(cancel_res.text)
                return False
            item = list(filter(lambda i: i['market_hash_name'] == sell_order['description']['market_hash_name'],
                               self.client.get_my_inventory(GameOptions.CS).values()))
            if len(item) < 1:
                db_order.sell_id = None
                db_order.buy_order_completed = False
                db_order.sell_price_real = None
                self.db.session.add(db_order)
                self.db.session.commit()
            else:
                item = item[0]
                res = self.client.market.create_sell_order(item['id'], GameOptions.CS, new_price)
                if res['success']:
                    db_order.sell_id = self.get_item_listing_id(
                        self.client.market.get_my_market_listings()['sell_listings'], db_order.item_name)
                    db_order.sell_price_real = new_price
                    self.db.session.add(db_order)
                    self.db.session.commit()
                    print(f'Была изменена цена на {db_order.item_name}')
                else:
                    print(f"удалил ордер но чета не поставил, хз почему на {db_order.item_name}--- {res}")
                    db_order.sell_id = None
                    db_order.sell_price_real = None
                    self.db.session.add(db_order)
                    self.db.session.commit()
        except Exception as e:
            print(e)

    def cancel_old_buy_orders(self, days=7):
        orders_to_remove = []
        current_buy_orders = self.get_all_buy_orders()
        orders = [i for i in self.db.get_active_buy_orders() if (datetime.now() - i.created_on).days >= days]
        for db_order in orders:
            if db_order.buy_id in current_buy_orders and db_order.id not in orders_to_remove:
                print(f'Удаляю ордер {db_order.buy_id} ({db_order.item_name}).', end='')
                if self.cancel_buy_order(db_order.buy_id).get('success') == 1:
                    all_remove_order_with_id = self.db.session.query(self.db.orders).filter(
                        self.db.orders.buy_id == db_order.buy_id,
                        self.db.orders.buy_order_completed == 0)
                    for x in all_remove_order_with_id:
                        orders_to_remove.append(x.id)
                    print('Удалил.')
        sql = delete(self.db.orders).where(self.db.orders.id.in_(orders_to_remove)).execution_options(
            synchronize_session="fetch")
        self.db.session.execute(sql)

    def buy_base_items(self):
        k = 0
        items = self.db.session.query(self.db.orders).all()
        res = self.client.market.get_my_market_listings()
        keys = res['buy_orders']
        name_buy_items = []
        for key in keys:
            name_buy_items.append(res['buy_orders'][key]['item_name'])
        for item in items:
            if item.profit is not None and item.item_name not in name_buy_items:
                try:
                    time.sleep(5)
                    price = self.client.market.fetch_price(item.item_name, game=GameOptions.CS, currency=Currency.RUB)
                    price_now = float(price.get('lowest_price').replace(',', '.').split()[0]) * 100 - 1
                    time.sleep(1)
                    auto_buy_price = self.auto_buy_price(item.item_name)
                    time.sleep(1)
                    median_price = float(price.get('median_price').replace(',', "").split()[0])
                    if price_now * 0.84 > auto_buy_price and price_now / median_price < 1.12:
                        res = self.client.market.create_buy_order(item.item_name, auto_buy_price, 1, GameOptions.CS,
                                                                  Currency.RUB)
                        self.db.create_order(item_id=item.id, item_name=item.item_name, buy_price=auto_buy_price,
                                             buy_id=res['buy_orderid'], sell_price=int(item.sell_price))
                        self.db.session.commit()
                        print(f"Успешно создал ордер на покупку {item.item_name}")
                        k += 1
                except Exception as e:
                    print(e)
                    continue
        return k

if __name__ == '__main__':
    bot = Bot()
    print("TEST")
    bot.run()