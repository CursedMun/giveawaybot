import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
  // TODO: your translations go here
  errors: {
    noPerms: {
      description: 'Недостаточно прав для использования команды',
      field: 'Нужные права',
      value: '` ⚪ {perm:string} ` ` Вкл `'
    },
    noSendMessagePerm: 'Недостаточно прав для отправки сообщений в канал',
    noInput: {
      time: 'Неверно указано время',
      channel: 'Неверно указан канал',
      winnersCount: 'Неверно указано кол-во победителей'
    }
  },
  //gs Command
  giveaway: {
    modal: {
      title: 'Запрос на участие',
      prize: 'Приз',
      duration: 'Длительность розыгрыша (1d|1h|1m|1s)',
      winnersCount: 'Кол-во победителей (максимум 20)',
      channel: 'Название или id канала'
    },
    modalReply: {
      title: 'Уточним...',
      description: '{type:string}: {description:string}'
    },
    conditions: {
      reaction: 'Нажатие реакции',
      reactionVoice: 'Нажатие реакции + зайти в войс',
      button: 'Нажатие кнопки',
      buttonVoice: 'Нажатие кнопки + зайтие войс'
    },
    response: {
      title: 'Для начала',
      description:
        'Чтобы продолжить **создание розыгрыша** выберите ниже **одно** из **условий**.',
      options: 'Варианты условий'
    }
  },
  default: {
    prize: 'Приз',
    duration: 'Время',
    winnersCount: 'Кол-во победителей',
    channel: 'Канал',
    option: 'вариант',
    notification: 'Уведомления',
    on: 'Вкл',
    off: 'Выкл'
  },
  //notification Command
  notification: {
    options: {
      voiceNotifications: 'Войс оповещение',
      winNotifications: 'Оповещение о выигрыше'
    },
    title: 'Управление уведомлениями',
    description: `Выберите нужный пункт для **включения** или **отключения** уведомления о розыгрыше`,
    placeholder: 'Нажимать сюда!',
    response: {
      description: {
        text: 'Вы успешно изменили ваши настройки',
        was: 'Было',
        is: 'Стало'
      }
    }
  },
  admin: 'Администратор'
};

export default en;
