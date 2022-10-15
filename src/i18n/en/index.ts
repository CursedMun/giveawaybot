import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
  // TODO: your translations go here
  errors: {
    noPerms: {
      description: 'Недостаточно прав для использования команды',
      field: 'Нужные права',
      value: '` ⚪ {perm:string} ` ` Вкл `'
    },
    noInput: {
      time: 'Неверно указано время',
      channel: 'Неверно указан канал',
      winnersCount: 'Неверно указано кол-во победителей',
      messageID: 'Неверно указан ID сообщение'
    },
    notEnoughMembers: 'Недостаточно участников',
    noSendMessagePerm: 'Недостаточно прав для отправки сообщений в канал',
    maxGiveaways: 'Превышено максимальное кол-во розыгрышей на сервере',
    noServerGiveaways: 'На сервере нет активных розыгрышей',
    noFoundGiveaways: 'Розыгрыш не найден или уже закончен'
  },
  //gs Command
  giveaway: {
    modal: {
      title: 'Запрос на участие',
      prize: 'Приз',
      duration: 'Длительность розыгрыша (1d|1h|1m|1s)',
      winnersCount: 'Кол-во победителей (максимум 10)',
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
      buttonVoice: 'Нажатие кнопки + зайти войс'
    },
    response: {
      title: 'Для начала',
      description:
        'Чтобы продолжить **создание розыгрыша** выберите ниже **одно** из **условий**.',
      options: 'Варианты условий'
    },
    end: {
      response: 'Розыгрыш успешно закончен'
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
    off: 'Выкл',
    winnersNouns: ['победитель', 'победителя', 'победителей'],
    error: 'Ошибка'
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
  help: {
    commands: {
      descriptions: {
        others: {
          help: '</{commandID:string}> - это сообщение.'
        },
        giveaway: {
          gs: '</{commandID:string}> - Запустить розыгрыш.',
          notify:
            '</{commandID:string}> - Включить \\ Выключить уведомления о розыгрыше в \n<:background:980765434414522398><:background:980765434414522398>личных сообщениях',
          end: '</{commandID:string}> + ` messageID `\n<:background:980765434414522398> ┗ Завершает (выбирает победителя) указанную или \n<:background:980765434414522398><:background:980765434414522398>последний розыгрыш в текущем канале.',
          reroll:
            '</{commandID:string}> + ` messageID `\n<:background:980765434414522398> ┗ Переигрывает указанный или последний розыгрыш в \n<:background:980765434414522398><:background:980765434414522398>текущем канале.'
        }
      },
      embed: {
        footer:
          'ᅠᅠ«Проводите раздачи на своем сервере Discord быстро и легко!»',
        description:
          '> <@{botID:string}> — это бот для Discord серверов, который помогает проводить автоматические раздачи.'
      }
    },
    giveaway: {
      title: 'ᅠ\nᅠᅠᅠᅠᅠᅠ🎉ᅠУправление розыгрышамиᅠ🎉'
    },
    others: {
      title: '⚙️ Другое'
    }
  },
  admin: 'Администратор'
};

export default en;
