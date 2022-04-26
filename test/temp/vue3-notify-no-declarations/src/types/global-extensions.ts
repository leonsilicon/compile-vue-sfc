import type VueNotifications from '~/components/vue-notifications.vue';

import type { notify } from '../utils/notify.js';

declare module '@vue/runtime-core' {
	export interface ComponentCustomProperties {
		$notify: typeof notify;
	}

	export interface GlobalComponents {
		VueNotifications: typeof VueNotifications;
	}
}
