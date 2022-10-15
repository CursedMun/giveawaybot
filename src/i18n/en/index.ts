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
    commands:
      "{fields:[{name:'⚙️Другое',value:'</help:1012088879379120148>-этосообщение.',inline:false},{name:'ᅠ\\nᅠᅠᅠᅠᅠᅠ🎉ᅠУправление розыгрышамиᅠ🎉',value:'<:background:980765434414522398></gs:1012088879379120148>\\n<:background:980765434414522398>┗Запуститьрозыгрыш\\n\\n<:background:980765434414522398></notify:1012088879379120148>\\n<:background:980765434414522398>┗Включить\\\\Выключитьуведомленияорозыгрышев\\n<:background:980765434414522398><:background:980765434414522398>личныхсообщениях\\n\\n<:background:980765434414522398></end:1012088879379120148>+`messageID`\\n<:background:980765434414522398>┗Завершает(выбираетпобедителя)указаннуюили\\n<:background:980765434414522398><:background:980765434414522398>последнийрозыгрышвтекущемканале.\\n\\n<:background:980765434414522398></reroll:1012088879379120148>+`messageID`\\n<:background:980765434414522398>┗Переигрываетуказанныйилипоследнийрозыгрышв\\n<:background:980765434414522398><:background:980765434414522398>текущемканале.',inline:false}],description:'><@1012088879379120148>—этоботдляDiscordсерверов,которыйпомогаетпроводитьавтоматическиераздачи.',color:3092790,footer:{text:'ᅠᅠ«ПроводитераздачинасвоемсервереDiscordбыстроилегко!»'},image:{url:'https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png'}}" as any
  },
  admin: 'Администратор'
};

export default en;
