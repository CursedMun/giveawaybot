// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */
import type { BaseTranslation as BaseTranslationType, LocalizedString, RequiredParams } from 'typesafe-i18n'

import type { [{name } from './custom-types'

export type BaseTranslation = BaseTranslationType
export type BaseLocale = 'en'

export type Locales =
	| 'en'

export type Translation = RootTranslation

export type Translations = RootTranslation

type RootTranslation = {
	errors: {
		noPerms: {
			/**
			 * Н​е​д​о​с​т​а​т​о​ч​н​о​ ​п​р​а​в​ ​д​л​я​ ​и​с​п​о​л​ь​з​о​в​а​н​и​я​ ​к​о​м​а​н​д​ы
			 */
			description: string
			/**
			 * Н​у​ж​н​ы​е​ ​п​р​а​в​а
			 */
			field: string
			/**
			 * `​ ​⚪​ ​{​p​e​r​m​}​ ​`​ ​`​ ​В​к​л​ ​`
			 * @param {string} perm
			 */
			value: RequiredParams<'perm'>
		}
		noInput: {
			/**
			 * Н​е​в​е​р​н​о​ ​у​к​а​з​а​н​о​ ​в​р​е​м​я
			 */
			time: string
			/**
			 * Н​е​в​е​р​н​о​ ​у​к​а​з​а​н​ ​к​а​н​а​л
			 */
			channel: string
			/**
			 * Н​е​в​е​р​н​о​ ​у​к​а​з​а​н​о​ ​к​о​л​-​в​о​ ​п​о​б​е​д​и​т​е​л​е​й
			 */
			winnersCount: string
			/**
			 * Н​е​в​е​р​н​о​ ​у​к​а​з​а​н​ ​I​D​ ​с​о​о​б​щ​е​н​и​е
			 */
			messageID: string
		}
		/**
		 * Н​е​д​о​с​т​а​т​о​ч​н​о​ ​у​ч​а​с​т​н​и​к​о​в
		 */
		notEnoughMembers: string
		/**
		 * Н​е​д​о​с​т​а​т​о​ч​н​о​ ​п​р​а​в​ ​д​л​я​ ​о​т​п​р​а​в​к​и​ ​с​о​о​б​щ​е​н​и​й​ ​в​ ​к​а​н​а​л
		 */
		noSendMessagePerm: string
		/**
		 * П​р​е​в​ы​ш​е​н​о​ ​м​а​к​с​и​м​а​л​ь​н​о​е​ ​к​о​л​-​в​о​ ​р​о​з​ы​г​р​ы​ш​е​й​ ​н​а​ ​с​е​р​в​е​р​е
		 */
		maxGiveaways: string
		/**
		 * Н​а​ ​с​е​р​в​е​р​е​ ​н​е​т​ ​а​к​т​и​в​н​ы​х​ ​р​о​з​ы​г​р​ы​ш​е​й
		 */
		noServerGiveaways: string
		/**
		 * Р​о​з​ы​г​р​ы​ш​ ​н​е​ ​н​а​й​д​е​н​ ​и​л​и​ ​у​ж​е​ ​з​а​к​о​н​ч​е​н
		 */
		noFoundGiveaways: string
	}
	giveaway: {
		modal: {
			/**
			 * З​а​п​р​о​с​ ​н​а​ ​у​ч​а​с​т​и​е
			 */
			title: string
			/**
			 * П​р​и​з
			 */
			prize: string
			/**
			 * Д​л​и​т​е​л​ь​н​о​с​т​ь​ ​р​о​з​ы​г​р​ы​ш​а​ ​(​1​d​|​1​h​|​1​m​|​1​s​)
			 */
			duration: string
			/**
			 * К​о​л​-​в​о​ ​п​о​б​е​д​и​т​е​л​е​й​ ​(​м​а​к​с​и​м​у​м​ ​1​0​)
			 */
			winnersCount: string
			/**
			 * Н​а​з​в​а​н​и​е​ ​и​л​и​ ​i​d​ ​к​а​н​а​л​а
			 */
			channel: string
		}
		modalReply: {
			/**
			 * У​т​о​ч​н​и​м​.​.​.
			 */
			title: string
			/**
			 * {​t​y​p​e​}​:​ ​{​d​e​s​c​r​i​p​t​i​o​n​}
			 * @param {string} description
			 * @param {string} type
			 */
			description: RequiredParams<'description' | 'type'>
		}
		conditions: {
			/**
			 * Н​а​ж​а​т​и​е​ ​р​е​а​к​ц​и​и
			 */
			reaction: string
			/**
			 * Н​а​ж​а​т​и​е​ ​р​е​а​к​ц​и​и​ ​+​ ​з​а​й​т​и​ ​в​ ​в​о​й​с
			 */
			reactionVoice: string
			/**
			 * Н​а​ж​а​т​и​е​ ​к​н​о​п​к​и
			 */
			button: string
			/**
			 * Н​а​ж​а​т​и​е​ ​к​н​о​п​к​и​ ​+​ ​з​а​й​т​и​ ​в​о​й​с
			 */
			buttonVoice: string
		}
		response: {
			/**
			 * Д​л​я​ ​н​а​ч​а​л​а
			 */
			title: string
			/**
			 * Ч​т​о​б​ы​ ​п​р​о​д​о​л​ж​и​т​ь​ ​*​*​с​о​з​д​а​н​и​е​ ​р​о​з​ы​г​р​ы​ш​а​*​*​ ​в​ы​б​е​р​и​т​е​ ​н​и​ж​е​ ​*​*​о​д​н​о​*​*​ ​и​з​ ​*​*​у​с​л​о​в​и​й​*​*​.
			 */
			description: string
			/**
			 * В​а​р​и​а​н​т​ы​ ​у​с​л​о​в​и​й
			 */
			options: string
		}
		end: {
			/**
			 * Р​о​з​ы​г​р​ы​ш​ ​у​с​п​е​ш​н​о​ ​з​а​к​о​н​ч​е​н
			 */
			response: string
		}
	}
	'default': {
		/**
		 * П​р​и​з
		 */
		prize: string
		/**
		 * В​р​е​м​я
		 */
		duration: string
		/**
		 * К​о​л​-​в​о​ ​п​о​б​е​д​и​т​е​л​е​й
		 */
		winnersCount: string
		/**
		 * К​а​н​а​л
		 */
		channel: string
		/**
		 * в​а​р​и​а​н​т
		 */
		option: string
		/**
		 * У​в​е​д​о​м​л​е​н​и​я
		 */
		notification: string
		/**
		 * В​к​л
		 */
		on: string
		/**
		 * В​ы​к​л
		 */
		off: string
		winnersNouns: {
			/**
			 * п​о​б​е​д​и​т​е​л​ь
			 */
			'0': string
			/**
			 * п​о​б​е​д​и​т​е​л​я
			 */
			'1': string
			/**
			 * п​о​б​е​д​и​т​е​л​е​й
			 */
			'2': string
		}
		/**
		 * О​ш​и​б​к​а
		 */
		error: string
	}
	notification: {
		options: {
			/**
			 * В​о​й​с​ ​о​п​о​в​е​щ​е​н​и​е
			 */
			voiceNotifications: string
			/**
			 * О​п​о​в​е​щ​е​н​и​е​ ​о​ ​в​ы​и​г​р​ы​ш​е
			 */
			winNotifications: string
		}
		/**
		 * У​п​р​а​в​л​е​н​и​е​ ​у​в​е​д​о​м​л​е​н​и​я​м​и
		 */
		title: string
		/**
		 * В​ы​б​е​р​и​т​е​ ​н​у​ж​н​ы​й​ ​п​у​н​к​т​ ​д​л​я​ ​*​*​в​к​л​ю​ч​е​н​и​я​*​*​ ​и​л​и​ ​*​*​о​т​к​л​ю​ч​е​н​и​я​*​*​ ​у​в​е​д​о​м​л​е​н​и​я​ ​о​ ​р​о​з​ы​г​р​ы​ш​е
		 */
		description: string
		/**
		 * Н​а​ж​и​м​а​т​ь​ ​с​ю​д​а​!
		 */
		placeholder: string
		response: {
			description: {
				/**
				 * В​ы​ ​у​с​п​е​ш​н​о​ ​и​з​м​е​н​и​л​и​ ​в​а​ш​и​ ​н​а​с​т​р​о​й​к​и
				 */
				text: string
				/**
				 * Б​ы​л​о
				 */
				was: string
				/**
				 * С​т​а​л​о
				 */
				is: string
			}
		}
	}
	help: {
		/**
		 * {​f​i​e​l​d​s​}
		 * @param {[{name} fields
		 */
		commands: RequiredParams<'fields'>
	}
	/**
	 * А​д​м​и​н​и​с​т​р​а​т​о​р
	 */
	admin: string
}

export type TranslationFunctions = {
	errors: {
		noPerms: {
			/**
			 * Недостаточно прав для использования команды
			 */
			description: () => LocalizedString
			/**
			 * Нужные права
			 */
			field: () => LocalizedString
			/**
			 * ` ⚪ {perm} ` ` Вкл `
			 */
			value: (arg: { perm: string }) => LocalizedString
		}
		noInput: {
			/**
			 * Неверно указано время
			 */
			time: () => LocalizedString
			/**
			 * Неверно указан канал
			 */
			channel: () => LocalizedString
			/**
			 * Неверно указано кол-во победителей
			 */
			winnersCount: () => LocalizedString
			/**
			 * Неверно указан ID сообщение
			 */
			messageID: () => LocalizedString
		}
		/**
		 * Недостаточно участников
		 */
		notEnoughMembers: () => LocalizedString
		/**
		 * Недостаточно прав для отправки сообщений в канал
		 */
		noSendMessagePerm: () => LocalizedString
		/**
		 * Превышено максимальное кол-во розыгрышей на сервере
		 */
		maxGiveaways: () => LocalizedString
		/**
		 * На сервере нет активных розыгрышей
		 */
		noServerGiveaways: () => LocalizedString
		/**
		 * Розыгрыш не найден или уже закончен
		 */
		noFoundGiveaways: () => LocalizedString
	}
	giveaway: {
		modal: {
			/**
			 * Запрос на участие
			 */
			title: () => LocalizedString
			/**
			 * Приз
			 */
			prize: () => LocalizedString
			/**
			 * Длительность розыгрыша (1d|1h|1m|1s)
			 */
			duration: () => LocalizedString
			/**
			 * Кол-во победителей (максимум 10)
			 */
			winnersCount: () => LocalizedString
			/**
			 * Название или id канала
			 */
			channel: () => LocalizedString
		}
		modalReply: {
			/**
			 * Уточним...
			 */
			title: () => LocalizedString
			/**
			 * {type}: {description}
			 */
			description: (arg: { description: string, type: string }) => LocalizedString
		}
		conditions: {
			/**
			 * Нажатие реакции
			 */
			reaction: () => LocalizedString
			/**
			 * Нажатие реакции + зайти в войс
			 */
			reactionVoice: () => LocalizedString
			/**
			 * Нажатие кнопки
			 */
			button: () => LocalizedString
			/**
			 * Нажатие кнопки + зайти войс
			 */
			buttonVoice: () => LocalizedString
		}
		response: {
			/**
			 * Для начала
			 */
			title: () => LocalizedString
			/**
			 * Чтобы продолжить **создание розыгрыша** выберите ниже **одно** из **условий**.
			 */
			description: () => LocalizedString
			/**
			 * Варианты условий
			 */
			options: () => LocalizedString
		}
		end: {
			/**
			 * Розыгрыш успешно закончен
			 */
			response: () => LocalizedString
		}
	}
	'default': {
		/**
		 * Приз
		 */
		prize: () => LocalizedString
		/**
		 * Время
		 */
		duration: () => LocalizedString
		/**
		 * Кол-во победителей
		 */
		winnersCount: () => LocalizedString
		/**
		 * Канал
		 */
		channel: () => LocalizedString
		/**
		 * вариант
		 */
		option: () => LocalizedString
		/**
		 * Уведомления
		 */
		notification: () => LocalizedString
		/**
		 * Вкл
		 */
		on: () => LocalizedString
		/**
		 * Выкл
		 */
		off: () => LocalizedString
		winnersNouns: {
			/**
			 * победитель
			 */
			'0': () => LocalizedString
			/**
			 * победителя
			 */
			'1': () => LocalizedString
			/**
			 * победителей
			 */
			'2': () => LocalizedString
		}
		/**
		 * Ошибка
		 */
		error: () => LocalizedString
	}
	notification: {
		options: {
			/**
			 * Войс оповещение
			 */
			voiceNotifications: () => LocalizedString
			/**
			 * Оповещение о выигрыше
			 */
			winNotifications: () => LocalizedString
		}
		/**
		 * Управление уведомлениями
		 */
		title: () => LocalizedString
		/**
		 * Выберите нужный пункт для **включения** или **отключения** уведомления о розыгрыше
		 */
		description: () => LocalizedString
		/**
		 * Нажимать сюда!
		 */
		placeholder: () => LocalizedString
		response: {
			description: {
				/**
				 * Вы успешно изменили ваши настройки
				 */
				text: () => LocalizedString
				/**
				 * Было
				 */
				was: () => LocalizedString
				/**
				 * Стало
				 */
				is: () => LocalizedString
			}
		}
	}
	help: {
		/**
		 * {fields}
		 */
		commands: (arg: { fields: [{name }) => LocalizedString
	}
	/**
	 * Администратор
	 */
	admin: () => LocalizedString
}

export type Formatters = {}
