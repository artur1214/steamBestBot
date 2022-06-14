from sqlalchemy import delete
from sqlalchemy.orm import mapper, sessionmaker
import sqlalchemy as sqa
import time
from datetime import datetime, timedelta


class DBWorker:
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
                                            nullable=True),
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

    def get_item_for_sell(self, name):
        return self.session.query(self.orders).filter(
            self.orders.item_name == str(name),
            self.orders.sell_id == None,
            self.orders.sell_price_real == None
        ).all()

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

    def check(self):
        db_order = self.db.session.query(self.db.orders).filter(
            self.db.orders.sell_id == '3790355249676236572').first()
        print(db_order)

# class Check():
#     def __init__(self):
#         self.db = DBWorker()
#
#     def check(self):
#         db_order = self.db.session.query(self.db.orders).filter(
#             self.db.orders.sell_id == 'ghgfgfg').first()
#         if db_order is not None:
#             print(db_order.buy_id)
#         else:
#             print('sdsdsdsdsd')
#
# a = Check().check()