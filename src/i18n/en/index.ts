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
    //max 45 chars
    modal: {
      title: 'Запрос на участие',
      prize: 'Приз',
      prizePlaceholder: 'Серверная валюта',
      duration: 'Длительность розыгрыша (1w|1d|1h|1m|1s)',
      maxDuration: 'Максимальная длительность розыгрыша {number:number} недели',
      winnersCount: 'Кол-во победителей',
      winnersCountPlaceholder: 'Максимальное число победителей {max:number}',
      channel: 'Название или id канала'
    },
    modalReply: {
      title: 'Уточним...',
      description: '{type:string}: {description:string}'
    },
    voiceCondition: {
      voice: 'С войсом',
      novoice: 'Без войса'
    },
    accessConditions: {
      reaction: 'Нажатие реакции',
      reactionVoice: 'Нажатие реакции + зайти в войс',
      button: 'Нажатие кнопки',
      buttonVoice: 'Нажатие кнопки + зайти войс'
    },
    additionalConditions: {
      type: 'Отправить "n" кол-во сообщений',
      invite: 'Пригласить "n" кол-во пользователей',
      guess: 'Угадать загаданное число',
      category: 'Находится в определенной категории'
    },
    response: {
      title: 'Для начала',
      titleTwo: 'Участие',
      description:
        '<@{userID:string}>, чтобы продолжить **создание розыгрыша**\nвыберите из **кнопок** ниже нужный вам **вариант**.',
      descriptionTwo:
        '<@{userID:string}>,  чтобы продолжить **создание розыгрыша**\nвыберите ниже **одно** из **условий**.',
      noDonate: '\n\n❗ Некоторые условия недоступны.',
      donateString: 'Недоступны условия?',
      options: 'Варианты условий'
    },
    additionalQuestion: {
      title: 'Последний вопрос',
      type: 'Укажите количество сообщений для участия',
      //not OP
      invite: 'Укажите количество приглашённых для участия',
      category: 'Укажите ид категории',
      guess: 'Загадайте число нужное для участия',
      guessPrompt: 'Укажите подсказку'
    },
    end: {
      response: 'Розыгрыш успешно закончен'
    },
    list: {
      text: '**{index:number}.** <@{userID:string}>',
      additionalText:
        '**{index:number}.** <@{userID:string}> выполнено **{current:number}** из **{need:string}**',
      completedText:
        '**{index:number}.** <@{userID:string}> <:__:1028466516531892224>',
      title: 'Участники розыгрыша',
      footer: 'Страница {page:number} из {pages:number}'
    },
    verify: {
      title: 'Ваш прогресс',
      description: 'Выполнено **{current:number}** из **{need:string}**',
      notIn: 'Вы не участвуете в розыгрыше'
    },
    updateEmbed: {
      participate: 'Участвовать',
      participants: 'Участников - {count:number}',
      verify: 'Проверить'
    },
    onLeave: {
      title: 'Участие в розыгрыше',
      description:
        'Покидая **голосовой канал**, вы отказываетесь от участия в розыгрыше\nУ вас есть **20 секунд** чтобы вернуться.'
    },
    onReturn: {
      title: 'Участие в розыгрыше',
      description:
        'О, вы вернулись, значит оставляем запись на участие в розыгрыше'
    }
  },
  //Create giveaway
  createGiveaway: {
    title: 'Приз: {prize:string}',
    description: {
      default: '> Для участия нужно нажать {rest:string}',
      access: {
        reaction: 'на реакцию "{emoji:string}"',
        button: 'на кнопку "**Участвовать**"'
      },
      voice: '\n> и присоединиться к голосовому каналу',
      additional: {
        type: '\n> и отправить {count:string} сообщений',
        invite: '\n> и пригласить {count:string} пользователей',
        guess: '\n> и угадать загаданное число',
        category: '\n> и находится в категории **<#{count:string}>**'
      },
      time: '\n\n**Заканчивается:** <t:{time:number}:R>'
    },
    reason: {
      additional: {
        type: 'Ваша задача: отправить {count:number} сообщений\n\n',
        invite: 'Ваша задача: пригласить **{count:number}** пользователяx',
        guess: 'Ваша задача: угадать **загаданное** число'
      }
    },
    footer: 'Включить уведомления /notify'
  },
  onJoinGiveaway: {
    alreadyParticipate: 'Вы уже участвуете в розыгрыше',
    noVoice: '**Условие участия:** Зайдите в любой голосовой канал на сервере',
    noCategory:
      '**Условие участия:** Зайдите в любой голосовой канал в категории <#{category:string}>',
    voiceCondition: {
      voice:
        'Примечание: При выходе из **голосового канала** вы\nавтоматические будете **сняты** с участия в **розыгрыше**'
    },
    joined: 'Пусть удача будет на вашей стороне',
    guessNumber: 'Угадайте загаданное число',
    cooldown: {
      title: 'Не торопись..',
      description: 'Подожди <t:${time:number}:R> и попробуй снова'
    },
    join: {
      title: 'Теперь вы участвуете в конкурсе',
      errorTitle: 'Ой что-то не так'
    }
  },
  default: {
    prize: 'Приз',
    time: 'Время',
    duration: 'Длительность',
    winnersCount: 'Кол-во победителей',
    channel: 'Канал',
    option: 'вариант',
    notification: 'Уведомления',
    on: 'Вкл',
    off: 'Выкл',
    winnersNouns: ['победитель', 'победителя', 'победителей'],
    error: 'Ошибка',
    accept: 'Подтвердить',
    reject: 'Отмена',
    missing: 'Отсутствует',
    empty: 'Пусто...'
  },
  endGiveaway: {
    title: 'Розыгрыш закончен.',
    description:
      'Организатор: <@{creatorID:string}>\nПриз: **{prize:string}**\nПобедитель: {winners:string}',
    footer: 'Победитель выбран с помощью: https://www.random.org/'
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
          help: '</{commandID:string}> - Отображает общую информацию.'
        },
        giveaway: {
          gs: '</{commandID:string}> - Запустить розыгрыш.',
          notify:
            '</{commandID:string}> - Включить \\ Выключить уведомления о розыгрыше в \n<:background:980765434414522398><:background:980765434414522398>личных сообщениях',
          end: '</{commandID:string}> + ` messageID `\n<:background:980765434414522398> ┗ Завершает (выбирает победителя) указанный или \n<:background:980765434414522398><:background:980765434414522398>последний розыгрыш в текущем канале.',
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
    information: {
      embed: {
        fields: {
          name: 'Название',
          servers: 'Сервера',
          users: 'Пользователи',
          platform: 'Платформа',
          memory: 'Память',
          active: 'Активен'
        },
        title: 'Информация о боте',
        description:
          '>>> Разработчиком бота является <@{devID:string}>. \n **[**`{devTag:string}`**]**',
        footer: 'ᅠᅠ«Проводите раздачи на своем сервере Discord быстро и легко!»'
      }
    },
    giveaways: {
      fields: {
        noGiveaways: {
          name: 'На сервере - нет запущенных розыгрышей',
          value: 'Начните розыгрыш с помощью команды </gs:1012088879379120148>'
        },
        activeGiveaways: {
          name: 'Приз {prize:string}',
          value:
            'Условия: **{accessCondition:string}**\nКоличество участников: **{count:number}**\nОрганизатор: <@{creatorID:string}>\nОкончание: <t:{ending:number}:R>'
        }
      },
      title: 'Активные розыгрыши',
      description: '>>> Количество розыгрышей: **{count:number}**',
      footer: 'ᅠᅠ«Проводите раздачи на своем сервере Discord быстро и легко!»'
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
