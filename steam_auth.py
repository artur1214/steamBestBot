import json
from time import sleep

import steam.webauth as wa
from bs4 import BeautifulSoup
from steam.guard import SteamAuthenticator
from steampy.client import SteamClient
from steampy.exceptions import InvalidCredentials

STEAM_OPENID = 'https://steamcommunity.com/openid/login'
SKINS_TABLE_STEAM = 'https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=https%3A%2F%2Fskins-table.xyz%2Fsteam%2F%3Flogin&openid.realm=https%3A%2F%2Fskins-table.xyz&openid.ns.sreg=http%3A%2F%2Fopenid.net%2Fextensions%2Fsreg%2F1.1&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select'

#sa = SteamAuthenticator(json.load(open('./main.mafile')))
KEY = ''
steam_client = SteamClient(KEY)



def login(log, password):

    try:
        print('Пытаюсь войти в стим')
        steam_client.login('picachyy', '546546nnnn', './main.mafile')
    except InvalidCredentials as e:
        print(e)
        sleep(31)
        return login(log, password)
    #steam_client.session
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


def auth_to_skinstable(user=None, credentials=('1', '1')):
    if not user:
        user = login(*credentials)
    res = user.session.get(
        SKINS_TABLE_STEAM)  # получаем данные формы входа в стиме, и делаем запрос на вход
    a = BeautifulSoup(res.text, 'lxml').find('form', id='openidForm')
    params = a.find_all('input')[:-1]
    form_data = {i['name']: i['value'] for i in params}
    s = user.session.post(STEAM_OPENID,data=form_data)  # Здесь мы входим
    return user  # если всё правильно, то нас должно пустить в Skins table


def get_user(credentials, *args):
    if credentials:
        return login(*credentials)
    else:
        return login(*args)

