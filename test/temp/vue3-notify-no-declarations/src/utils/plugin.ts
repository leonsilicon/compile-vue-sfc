import type { App, Plugin } from 'vue';

import Notifications from '~/components/vue-notifications.vue';

import type { NotificationsPluginOptions } from '../types/plugin.js';
import { notify } from './notify.js';

export const VueNotificationPlugin: Plugin = {
	install(app: App, args: NotificationsPluginOptions = {}) {
		const name = args.name ?? 'notify';

		app.config.globalProperties['$' + name] = notify;
		app.component(args.componentName ?? 'VueNotifications', Notifications);
	},
};
