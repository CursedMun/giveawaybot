import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
  // TODO: your translations go here
  errors: {
    noPerms: {
      description: 'Insufficient permissions to use the command',
      field: 'Required rights',
      value: '` ⚪ {perm:string} ` ` On `'
    },
    noInput: {
      time: 'The time is incorrect',
      channel: 'The channel is specified incorrectly',
      winnersCount: 'The number of winners is incorrect',
      messageID: 'The message ID is specified incorrectly'
    },
    notEnoughMembers: 'Not enough participants',
    noSendMessagePerm: 'Not enough rights to send messages to the channel',
    maxGiveaways: 'Exceeded the maximum number of giveaways on the server',
    noServerGiveaways: 'There are no active giveaways on the server',
    noFoundGiveaways:
      'The giveaways was not found or has already been completed'
  },
  //gs Command
  giveaway: {
    //max 45 chars
    modal: {
      title: 'Request for participation',
      prize: 'Prize',
      prizePlaceholder: 'Server currency',
      duration: 'Duration of the giveaway (1w|1d|1h|1m|1s)',
      maxDuration: 'Maximum giveaway duration {number:number} weeks',
      winnersCount: 'Number of winners',
      winnersCountPlaceholder: 'Maximum number of winners {max:number}',
      channel: 'Channel name or id channel'
    },
    modalReply: {
      title: 'Be clear...',
      description: '{type:string}: {description:string}'
    },
    voiceCondition: {
      voice: 'With voice',
      novoice: 'Without voice'
    },
    accessConditions: {
      reaction: 'Pressing a reaction',
      button: 'Pressing a button'
    },
    additionalConditions: {
      type: 'Send "n" number of messages',
      invite: 'Invite "n" number of users',
      guess: 'Guess the hidden number',
      category: 'Located in a certain category'
    },
    response: {
      title: 'In the beginning...',
      titleTwo: 'Participation',
      description:
        '<@{userID:string}>, to continue **creating a giveaway**\nchoose one of the **buttons** below the one you need.',
      descriptionTwo:
        '<@{userID:string}>, to continue **creating a giveaway**\nchoose the below **one** from the available **conditions**.',
      noDonate:
        '\n\n❗Some conditions are available with a subscription <:patreon:1033868901982937158> & <:boosty:1033868900720455680>',
      donateString: 'Are conditions not available??',
      options: 'Variants of conditions'
    },
    additionalQuestion: {
      title: 'Last question',
      type: 'Specify the number of messages to participate ',
      //not OP
      invite: 'Specify the number of people invited to participate',
      category: 'Specify the category ID',
      guess: 'Guess the number you need to participate',
      guessPrompt: 'Specify a hint'
    },
    end: {
      response: 'The giveaway has been successfully completed'
    },
    list: {
      text: '**{index:number}.** <@{userID:string}>',
      additionalText:
        '**{index:number}.** <@{userID:string}> done **{current:number}** from **{need:string}**',
      completedText:
        '**{index:number}.** <@{userID:string}> <:__:1028466516531892224>',
      title: 'Members of the giveaway',
      footer: 'Page {page:number} from {pages:number}'
    },
    verify: {
      title: 'Your progress',
      description: 'Done **{current:number}** from **{need:string}**',
      notIn: 'You are not participating in the giveaway'
    },
    updateEmbed: {
      participate: 'Participate',
      participants: 'Members - {count:number}',
      verify: 'Verify'
    },
    onLeave: {
      title: 'Participation in the giveaway',
      description:
        "By leaving the **voice channel**, you're refusing to participate in the giveaway\nYou have **20 seconds** to return."
    },
    onReturn: {
      title: 'Participation in the giveaway',
      description:
        "Oh, you're back, so we're leaving an entry for participation in the giveaway"
    }
  },
  //Create giveaway
  createGiveaway: {
    title: 'Prize: {prize:string}',
    description: {
      default: '> To participate, you need to click {rest:string}',
      access: {
        reaction: 'on the reaction "{emoji:string}"',
        button: 'on the button "**Participate**"'
      },
      voice: '\n> and join the voice channel',
      additional: {
        type: '\n> and send {count:string} messages',
        invite: '\n> and invite {count:string} users',
        guess: '\n> and guess the number',
        category: '\n> and be located in the category **<#{count:string}>**'
      },
      time: '\n\n**Finish:** <t:{time:number}:R>\n[Please help me by voting!](https://top.gg/bot/1012088879379120148/vote)'
    },
    reason: {
      additional: {
        type: 'Your task: to send  {count:number} messages\n\n',
        invite: 'Your task: invite **{count:number}** user',
        guess: 'Your task: guess the **hidden** number'
      }
    },
    footer: 'Enable notifications /notify'
  },
  onJoinGiveaway: {
    alreadyParticipate: 'You are already participating',
    noVoice: '**Conditions:** Connect to any voice channel on the server',
    noCategory:
      '**Conditions:** Connect to any voice channel in the category <#{category:string}>',
    voiceCondition: {
      voice:
        "Note: When you exit the **voice channel**, you'll be\n**removed** automatically from participating in the **giveaway**"
    },
    joined: 'May luck be on your side',
    guessNumber: 'Guess the hidden number',
    cooldown: {
      title: 'Do not rush..',
      description: 'Wait <t:${time:number}:R> and try again'
    },
    join: {
      title: 'Now you are participating in the giveaway',
      errorTitle: "Oh, something's wrong"
    }
  },
  default: {
    prize: 'Prize',
    time: 'Time',
    duration: 'Duration',
    winnersCount: 'Winners count',
    channel: 'Channel',
    option: 'Option',
    notification: 'Notifications',
    on: 'On',
    off: 'Off',
    winnersNouns: ['winner', 'winner', 'winners'],
    error: 'Error',
    accept: 'Accept',
    reject: 'Reject',
    missing: 'No winners',
    empty: 'Empty...'
  },
  endGiveaway: {
    title: 'The giveaway is over.',
    description:
      'Organizer: <@{creatorID:string}>\nPrize: **{prize:string}**\nWinner: {winners:string}',
    footer: 'The winner was selected with help: https://www.random.org/',
    winnersMessage: {
      title: 'Luck is on your side',
      description:
        'You won in the giveaway **{prize:string}**, contact the organizer to receive your award.'
    }
  },
  //notification Command
  notification: {
    options: {
      voiceNotifications: 'Voice notification',
      winNotifications: 'Notification of a win'
    },
    title: 'Managing notifications',
    description: `Select the required item to **enable** or **disable** giveaways notifications`,
    placeholder: 'Click here!',
    response: {
      description: {
        text: 'Settings has successfully been changed',
        was: 'Was',
        is: 'Has become'
      }
    }
  },
  help: {
    buttons: {
      information: 'Information',
      commands: 'Commands',
      activeGiveaways: 'Active giveaways',
      feedback: 'Feedback'
    },
    commands: {
      descriptions: {
        others: {
          help: '</{commandID:string}> - Displays general information.',
          locale: '</{commandID:string}> - Change the bot language ru/en.'
        },
        giveaway: {
          gs: '</{commandID:string}> - Start the giveaway.',
          notify:
            '</{commandID:string}> - Enable\\Disable giveaways notifications in \n<:background:980765434414522398><:background:980765434414522398>private messages',
          end: '</{commandID:string}> + ` messageID `\n<:background:980765434414522398> ┗ Finishes (selects the winner) the specified or \n<:background:980765434414522398><:background:980765434414522398>the last giveaway in the current channel.',
          reroll:
            '</{commandID:string}> + ` messageID `\n<:background:980765434414522398> ┗ Rerolls the specified or last giveaway in\n<:background:980765434414522398><:background:980765434414522398>the current channel.'
        }
      },
      embed: {
        footer: 'ᅠᅠ«Hold giveaways on your Discord server quickly and easily!»',
        description:
          '> <@{botID:string}> — a bot for Discord servers, which helps to produce automatic giveaways.'
      }
    },
    information: {
      embed: {
        fields: {
          name: 'Name',
          servers: 'Servers',
          users: 'Users',
          platform: 'Platform',
          memory: 'Memory',
          active: 'Active'
        },
        title: 'Information about the bot',
        description:
          '>>> The developer of the bot is <@{devID:string}>. \n **[**`{devTag:string}`**]**',
        footer: 'ᅠᅠ«Hold giveaways on your Discord server quickly and easily!»'
      }
    },
    giveaways: {
      fields: {
        noGiveaways: {
          name: 'There are no active giveaways on the server',
          value: 'Start the giveaway with the command </gs:1012088879379120148>'
        },
        activeGiveaways: {
          name: 'Prize {prize:string}',
          value:
            'Conditions: **{accessCondition:string}**\nNumber of members: **{count:number}**\nOrganizer: <@{creatorID:string}>\nEnding: <t:{ending:number}:R>'
        }
      },
      title: 'Active giveaways',
      description: '>>> Number of giveaway: **{count:number}**',
      footer: 'ᅠᅠ«Hold giveaways on your Discord server quickly and easily!»'
    },
    giveaway: {
      title: 'ᅠ\nᅠᅠᅠᅠᅠᅠ🎉ᅠManaging giveawaysᅠ🎉'
    },
    others: {
      title: '⚙️ Other'
    }
  },
  admin: 'Administrator',
  locale: {
    title: 'Changing the language',
    description: '**Hi!** now I will be available in **English**!'
  }
};

export default en;
