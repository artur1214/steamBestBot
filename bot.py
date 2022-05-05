import json
import re
import test_parse
import time
from datetime import datetime, timedelta
import requests
import bs4
import sqlalchemy as sqa
from sqlalchemy import delete
from sqlalchemy.orm import mapper, sessionmaker
from steampy.exceptions import ApiException
from steampy.models import GameOptions, Currency
from skinstable import get_table, steam_user
# from steam_auth import login
from test_parse import login


class DBWorker():
    def __init__(self, dbname='botdb.db'):
        self.db = sqa.create_engine(f'sqlite:///{dbname}')
        self.connection = self.db.connect()
        self.create_tables()
        # self.session = sqa.orm.Session(self.connection)
        self._session = sessionmaker(bind=self.db)
        self.session = self._session()

    def create_tables(self):
        # Base = declarative_base(self.connection)
        #
        # class Orders(Base):
        #     __tablename__ = 'posts'
        #     id = sqa.Column(sqa.Integer(), primary_key=True)
        #     item_name = sqa.Column(sqa.String(100), nullable=False)
        #     buy_price = sqa.Column(sqa.Integer(), nullable=False)
        #     sell_price = sqa.Column(sqa.Integer(), nullable=True)
        #     sell_price_real = sqa.Column(sqa.Integer(200), nullable=True)
        #     profit = sqa.Column(sqa.Integer, nullable=True)
        #     created_on = sqa.Column(sqa.DateTime(), default=datetime.now)
        #     updated_on = sqa.Column(sqa.DateTime(), default=datetime.now,
        #                         onupdate=datetime.now)

        self.metadata = sqa.MetaData(self.db)

        class Order(object):

            def __init__(order, **kwargs):
                # print(order.__dict__)
                order.__dict__.update(kwargs)

            def __str__(order):
                return f'Предмет {order.item_name} ({order.item_id})'

            def __repr__(order):
                return f'Предмет {order.item_name} ({order.item_id})'

        self._orders = sqa.Table('orders', self.metadata,
                                 sqa.Column('id', sqa.Integer(),
                                            primary_key=True),
                                 sqa.Column('item_id', sqa.String(40),
                                            nullable=False),
                                 sqa.Column('item_name', sqa.String(200),
                                            nullable=False),
                                 sqa.Column('buy_price', sqa.Integer(),
                                            nullable=False),
                                 sqa.Column('buy_id', sqa.String(40),
                                            nullable=False),
                                 sqa.Column('buy_order_completed',
                                            sqa.Boolean(), nullable=False,
                                            default=False),
                                 sqa.Column('sell_price', sqa.Integer(),
                                            nullable=False),
                                 sqa.Column('sell_id', sqa.String(40),
                                            nullable=True),
                                 sqa.Column('sell_price_real', sqa.Integer(),
                                            nullable=True),
                                 sqa.Column('profit', sqa.Float(),
                                            nullable=True),
                                 sqa.Column('created_on', sqa.DateTime(),
                                            default=datetime.now),
                                 sqa.Column('updated_on', sqa.DateTime(),
                                            default=datetime.now,
                                            onupdate=datetime.now))

        self.orders = Order
        self.metadata.create_all()
        mapper(self.orders, self._orders)

    def create_order(self, **kwargs):
        # print(self.orders.__dict__)
        order_to_create = self.orders(**kwargs)
        self.session.add(order_to_create)
        # print(self.session.new)
        self.session.commit()

    def get_all_orders(self):
        return self.session.query(self.orders).all()

    def get_active_buy_orders(self):
        return self.session.query(self.orders).filter(
            self.orders.buy_order_completed == False).all()

    def get_item_by_id(self, item_id):
        return self.session.query(self.orders).filter(
            self.orders.item_id == str(item_id)).all()

    def get_item_by_name(self, name, complete=[False]):
        return self.session.query(self.orders).filter(
            self.orders.item_name == str(name)).all()

    def get_completed_buy_orders(self):
        return self.session.query(self.orders).filter(
            self.orders.buy_order_completed == True,
            self.orders.sell_id == None).all()

    def get_uncompleted_items(self):
        return self.session.query(self.orders).filter(
            self.orders.buy_order_completed == True,
            self.orders.sell_id == None).all()

    def get_all_selling_orders(self):
        return self.session.query(self.orders).filter(
            self.orders.sell_id != None,
            self.orders.profit == None
        ).all()


# DBWorker().create_tables()
BUY_ORDER_SUM_LIMIT = 2000


# def get_price(name):
#     name = name.replace(" ", "%20").replace("|", "%7C").replace("(", "%28").replace(")", "%29").replace("™",
#                                                                                                         "%E2%84%A2")
#     url = "https://steamcommunity.com/market/listings/730/" + name
#     res = requests.get(url)
#     soup = bs4.BeautifulSoup(res.text, "lxml")
#     nameid = \
#     soup.findAll("script", type="text/javascript")[-1].text.split("function() { Market_LoadOrderSpread( ")[-1].split(
#         " ); }")[0]
#     url_2 = "https://steamcommunity.com/market/itemordershistogram?country=RU&language=russian&currency=5&item_nameid=" + nameid
#     res_2 = requests.get(url_2)
#     return res_2
#
#
# def get_last_price(name):
#     return get_price(name).json().get("sell_order_graph")[0][0]
#
# def get_autobue_price(name):
#     return get_price(name).json().get("buy_order_graph")[0][0]

class Bot():
    def __init__(self):
        self.db = DBWorker()
        # self.get_table()
        self.client = test_parse.steam_user

    def create_all_buy_orders(self):
        count_buy = 2
        ko = 0
        # self.table.sort(key=lambda x: x['p1r'])
        items = test_parse.get_new_table()
        for item in items: #self.table:
            time.sleep(3)
            orders = self.get_all_buy_orders()
            order_sum = sum(map(float, map(lambda x: x['price'].split(' p')[0].replace(',', '.'), orders.values())))
            # print(, item['p2r'])
            # print(order_sum)
            # json.dumps(orders)
            try:
                if order_sum > BUY_ORDER_SUM_LIMIT:
                    break
                print(item)
                median_price = items.get(item).get('median_price')
                if items.get(item).get('last_price')*100 / median_price < 1.21 and 1 < items.get(item).get('profit') < 25 :
                    try:
                        price = items.get(item).get('auto_buy_price')*100+1
                        print(f"куплю {price/100}, продам {items.get(item).get('last_price')}, получу {items.get(item).get('profit')}")
                        res = self.client.market.create_buy_order(item, price, count_buy, GameOptions.CS, Currency.RUB)
                        # (res)
                        for i in range(1,count_buy+1):
                            self.db.create_order(item_id=0, item_name=item, buy_price=int(price),
                                                 buy_id=res['buy_orderid'], sell_price=int(items.get(item).get('last_price')*100))
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

    def cancel_buy_orders(self, orders):
        for order in orders:
            # print(order)
            res = self.cancel_buy_order(order)
            # print(res)

    def get_all_buy_orders(self):
        res = self.client.market.get_my_market_listings()
        buy_orders = res['buy_orders']
        return buy_orders

    def get_all_sell_orders(self):
        return self.client.market.get_my_market_listings()['sell_listings']

    def cancel_sell_order(self, order_id):
        return self.client.market.cancel_sell_order(order_id).json()

    def cancel_sell_orders(self, orders):
        for order in orders:
            self.cancel_sell_order(order)
        return True

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
            # print(sells)
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

    def create_all_sell_orders(self):
        inventory = self.get_my_inventory()
        for i, el in inventory.items():

            order = self.db.get_item_by_name(el['market_hash_name'])
            # print(order)
            if order:
                for j in order:
                    if j.sell_id:
                        continue
                    j.buy_order_completed = True
                    time.sleep(3)
                    self.db.session.add(j)
                    self.db.session.commit()
                    #####Анализ стикеров###
                    if j.item_name.split()[0] == "Souvenir":
                        dop_price = 0
                    else:
                        print("читаю наклейки")
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
                        time.sleep(8)
                        price = float(self.client.market.fetch_price(j.item_name, game=GameOptions.CS,
                                                                     currency=Currency.RUB).get(
                            'lowest_price').replace(',', '.').split()[0]) * 100 - 1 + dop_price * 50
                        if price * 0.87 > int(j.buy_price):
                            j.sell_price_real = int(price * 0.87)
                            res = self.client.market.create_sell_order(str(i), GameOptions.CS, int(price * 0.87))
                            if res['success']:
                                j.sell_id = self.get_item_listing_id(
                                    self.client.market.get_my_market_listings()[
                                        'sell_listings'], j.item_name)
                                self.db.session.add(j)
                                self.db.session.commit()
                                print(f"Выставил на продажу {j.item_name} за {j.sell_price_real} с учетом комиссии")
                        else:
                            j.sell_price_real = int(j.buy_price*1.01)
                            res = self.client.market.create_sell_order(str(i), GameOptions.CS, j.sell_price_real)
                            if res['success']:
                                j.sell_id = self.get_item_listing_id(
                                    self.client.market.get_my_market_listings()[
                                        'sell_listings'], j.item_name)
                                self.db.session.add(j)
                                self.db.session.commit()
                                print(f"выставил дороже рынка в + на пару копеек {j.item_name} за {j.sell_price_real}")
                    except Exception:
                        print(f"Не выставил {j.item_name} словил ошибку:")
                        print(Exception)
                        continue

    def run(self):
        if not self.client.is_session_alive():
            login('picachyy', '546546nnnn')
        else:
            print('Вход успешен')
        while True:
            print('НОВАЯ ИТЕРАЦИЯ БОТА')
            #self.update_all_sell_orders_id()
            self.confirm_all_sell_orders()
            print('Бот закрыл выполненые ордера на продажу')
            orders_profit = self.db.session.query(self.db.orders).filter(self.db.orders.profit)
            sum = 0
            for order in orders_profit:
                sum += float(order.profit)
            with open("profit.txt", "a") as f:
                f.write(f"Профит: {sum}, дата: {datetime.now()}")
            print(f"profit = {sum} ")
            self.db.get_active_buy_orders()
            # print('Получение данных со skinstable')
            # self.get_table()
            # print('Данные успешно получены')
            print('Создаю ордера на продажу')
            self.create_all_sell_orders()
            # print('Обновляю старые ордера на продажу')
            # self.update_all_sell_prices()
            print('Все ордера успешно созданы.')
            print("Отменяю старые ордера на покупку")
            self.cancel_old_buy_orders()
            print('Создаю ордера на покупку')
            #print(f"было создано {self.buy_base_items()} новых оредров")
            bc = self.create_all_buy_orders()
            print(f'Было создано {bc} ордеров на покупку')
            time.sleep(1800)

    def update_all_sell_prices(self):
        current_orders = self.get_all_sell_orders()
        for steam_order in current_orders:

            try:
                db_order = self.db.session.query(self.db.orders).filter(
                    self.db.orders.sell_id == steam_order)[0]
            except IndexError as e:
                continue
            print(f"Смотрю ордер на {db_order.item_name}")
            time_elapsed: timedelta = datetime.now() - db_order.updated_on
            if time_elapsed.days >= 2:  # Сколько дней ордер стоял
                time.sleep(8)
                prices = self.client.market.fetch_price(db_order.item_name,
                                                        GameOptions.CS,
                                                        currency=Currency.RUB)
                new_price = int(float(prices.get('lowest_price', '-1000 ').replace(',', '.').split()[0]) * 100)
                if new_price * 0.87 > db_order.buy_price:
                    if db_order.sell_price_real and db_order.profit is None:
                        self.replace_sell_order(current_orders[steam_order], db_order, new_price * 0.87)
                        print(f'Была изменена цена на {db_order.item_name}')

    def replace_sell_order(self, sell_order, db_order, new_price):
        cancel_res = self.cancel_sell_order(sell_order['listing_id'])
        time.sleep(3)
        print(cancel_res)
        item = list(filter(lambda i: i['market_hash_name'] == sell_order['description']['market_hash_name'],
                           self.client.get_my_inventory(GameOptions.CS).values()))
        if len(item) < 1:
            db_order.sell_id = None
            db_order.buy_order_completed = False
            self.db.session.add(db_order)
            self.db.session.commit()
        else:
            item = item[0]
            res = self.client.market.create_sell_order(item['id'], GameOptions.CS, new_price)
            if res['success']:
                time.sleep(2)
                db_order.sell_id = self.get_item_listing_id(
                    self.client.market.get_my_market_listings()['sell_listings'], db_order.item_name)
                self.db.session.add(db_order)
                self.db.session.commit()
            else:
                print(f"удалил ордер но чета не поставил, хз почему на {db_order.item_name}")
                db_order.sell_id = None
                self.db.session.add(db_order)
                self.db.session.commit()

    def cancel_old_buy_orders(self, days=7):
        orders_to_remove = []
        current_buy_orders = self.get_all_buy_orders()

        db_orders = self.db.get_active_buy_orders()
        orders = [i for i in db_orders if (datetime.now() - i.created_on).days >= days]
        for db_order in orders:
            # print(db_order.buy_id, current_buy_orders)
            if db_order.buy_id in current_buy_orders:
                print(f'Удаляю ордер {db_order.buy_id} ({db_order.item_name}).', end='')
                if self.cancel_buy_order(db_order.buy_id).get('success'):
                    orders_to_remove.append(db_order.id)
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

    def auto_buy_price(self, name):
        time.sleep(2)
        name = name.replace(" ", "%20").replace("|", "%7C").replace("(", "%28").replace(")",
                                                                                        "%29").replace(
            "™", "%E2%84%A2")
        url = "https://steamcommunity.com/market/listings/730/" + name
        res = requests.get(url)
        soup = bs4.BeautifulSoup(res.text, "lxml")
        item_nameid = soup.findAll("script", type="text/javascript")[-1].text.split(
            "function() { Market_LoadOrderSpread( ")[-1].split(" ); }")[0]
        url_2 = "https://steamcommunity.com/market/itemordershistogram?country=RU&language=russian&currency=5&item_nameid=" + item_nameid
        res_2 = requests.get(url_2)
        price = float(
            res_2.text.split("market_commodity_orders_header_promote")[-1].split(" pуб.")[0].split(">")[
                -1].replace(",", ".")) * 100 + 1
        return price


# Bot().db.create_order(item_name='Предмет', item_id='4333456', buy_price=100_00,
#                       sell_price=150_00,
#                       buy_id='1232667645')


if __name__ == '__main__':
    bot = Bot()
    # to_update = bot.db.session.query(bot.db.orders).filter(bot.db.orders.sell_price_real != None).all()
    # for i in to_update:
    #     k = int(i.sell_price_real * 0.87)
    #     i.sell_price_real = k
    #     #i.profit = i.buy_price
    #     i.profit = k - i.buy_price
    #     bot.db.session.add(i)
    #     bot.db.session.commit()
    # bot.db.session.query(bot.db.orders).update({'sell_price_real':None,
    #                'profit': None})
    # bot.cancel_buy_orders(bot.get_all_buy_orders())
    print("TEST")
    bot.run()  # bot.table = bot.get_table()

# Bot().db.create_order(item_name='Предмет1', item_id='4333446', buy_price=400_00, sell_price=450_00, buy_id='12667645')
# table = list(sorted(get_table(), key=lambda el: el['r1']))

# if table[0]['r1'] < table[-1]['r1']:
#    table = table[::-1]
